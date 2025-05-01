import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardCheck, File, Send, User, Building, DollarSign, Calendar, Briefcase, FileText, Download, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import { useClerkAuth } from "@/contexts/ClerkAuthContext";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/client";
import { Upload } from "lucide-react";
import { Database } from "@/lib/supabase/types";

// Define the enum types based on Database definition
type ContractStatusEnum = Database["public"]["Enums"]["contract_status"];
type ContractTypeEnum = Database["public"]["Enums"]["contract_type"];

// Define the frontend type alias separately if needed for dropdown values
type FrontendContractType = "grant" | "services" | "goods" | "sponsorship" | "amendment" | "vendor_agreement" | "interagency_agreement" | "mou" | "sole_source" | "rfp";

type DbContractInsert = Database['public']['Tables']['contracts']['Insert'];

const ContractRequest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userDetails, isLoading: isAuthLoading, getToken, error: authError, contractServiceInstance } = useClerkAuth();
  const organizationId = userDetails?.organizationId;
  const userEmail = userDetails?.email;
  const supabaseUserId = userDetails?.supabaseUserId;

  const [formData, setFormData] = useState({
    requestTitle: "",
    description: "",
    contractType: "" as FrontendContractType,
    amendmentNumber: "",
    department: "",
    contractAdmin: "",
    nte: "",
    startDate: "",
    endDate: "",
    accountingCodes: "",
    vendorName: "",
    vendorEmail: "",
    vendorPhone: "",
    vendorAddress: "",
    signatoryName: "",
    signatoryEmail: "",
    sowFiles: [] as File[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        sowFiles: [...prev.sowFiles, ...newFiles]
      }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sowFiles: prev.sowFiles.filter((_, i) => i !== index)
    }));
  };

  const downloadTemplate = () => {
    const template = `Statement of Work Template\n\n1. Project Overview\n------------------\n[Briefly describe the project\'s purpose and objectives]\n\n2. Scope of Work\n---------------\n[Detail the specific tasks, deliverables, and services to be provided]\n\n3. Timeline\n----------\nStart Date: [Insert Start Date]\nEnd Date: [Insert End Date]\n\n4. Deliverables\n--------------\n[List all expected deliverables with descriptions and due dates]\n\n5. Requirements\n-------------\n[Specify any technical, operational, or quality requirements]\n\n6. Payment Terms\n--------------\nTotal Not-to-Exceed Amount: [Insert Amount]\nPayment Schedule: [Detail payment milestones]\n\n7. Key Personnel\n--------------\n[List key team members and their roles]\n\n8. Acceptance Criteria\n--------------------\n[Define how deliverables will be evaluated and accepted]\n\n9. Additional Terms\n-----------------\n[Include any special conditions or requirements]`;

    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sow_template.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "Edit the template and upload it back when ready.",
      duration: 3000,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!getToken || !organizationId || !userEmail || !supabaseUserId || !contractServiceInstance) {
        toast({
          title: "Error",
          description: "Cannot submit request. User, organization details, or service not ready. Please try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
    }
    
    try {
      const mapFrontendTypeToDb = (frontendType: FrontendContractType): ContractTypeEnum => {
        switch (frontendType) {
          case 'services': return 'service';
          case 'interagency_agreement': return 'iaa';
          case 'vendor_agreement': return 'vendor';
          case 'mou':
          case 'sponsorship':
            return frontendType as ContractTypeEnum;
          case 'grant': return 'other';
          case 'goods': return 'product';
          case 'amendment': return 'other';
          case 'sole_source': return 'other';
          case 'rfp': return 'other';
          default:
            console.warn(`Unsupported contract type mapping for: ${frontendType}. Defaulting to 'other'.`);
            return 'other';
        }
      };

      const newContractPayload: Omit<DbContractInsert, 'id' | 'created_at' | 'contract_number' | 'status' | 'organization_id' | 'creator_id' | 'creator_email' | 'comments'> = {
        title: formData.requestTitle,
        description: formData.description,
        type: mapFrontendTypeToDb(formData.contractType),
        department: formData.department,
        amount: parseFloat(formData.nte) || null,
        start_date: formData.startDate || null,
        end_date: formData.endDate || null,
        accounting_codes: formData.accountingCodes || null,
        vendor: formData.vendorName,
        vendor_email: formData.vendorEmail,
        vendor_phone: formData.vendorPhone || null,
        vendor_address: formData.vendorAddress || null,
        signatory_name: formData.signatoryName,
        signatory_email: formData.signatoryEmail,
      };

      console.log('Payload being sent to ContractService.createContract:', newContractPayload);

      const { data: createdContract, error: createError } = await contractServiceInstance.createContract(
          newContractPayload, 
          supabaseUserId, 
          userEmail
      );

      if (createError) {
        console.error('Service createContract error:', createError);
        throw createError;
      }

      console.log('Contract created via service:', createdContract);
      const newContractId = createdContract?.id;
      const newContractNumber = createdContract?.contract_number;

      if (newContractId && formData.sowFiles.length > 0) {
          console.log(`Uploading ${formData.sowFiles.length} SOW files for contract ${newContractId}...`);
          let uploadErrors = 0;
          const uploadPromises = formData.sowFiles.map(file =>
              contractServiceInstance.uploadGeneralAttachment(
                  newContractId,
                  file,
                  supabaseUserId!, 
                  userEmail!      
              ).catch(uploadErr => {
                  console.error(`Failed to upload ${file.name}:`, uploadErr);
                  uploadErrors++;
                  return { error: uploadErr };
              })
          );
          await Promise.allSettled(uploadPromises);
          if (uploadErrors > 0) {
              toast({ title: "File Upload Issues", /* ... */ variant: "destructive" });
          } else {
               toast({ title: "Attachments Uploaded", description: "All attached files were uploaded successfully." });
          }
      }

      toast({
        title: "Request Submitted Successfully",
        description: `Your contract request ${newContractNumber || '(Number pending)'} has been submitted.`,
        duration: 5000,
      });

      // Log the contract number and intended path before navigating
      console.log(`[ContractRequest] Submission successful. Contract Number: ${newContractNumber}. Attempting navigation...`);

      if (newContractNumber) {
          const targetPath = `/dashboard/contracts/${newContractNumber}`;
          console.log(`[ContractRequest] Navigating to new contract details: ${targetPath}`);
          navigate(targetPath);
      } else {
          console.warn("[ContractRequest] Created contract did not return a contract number. Navigating to list.");
          // Corrected fallback path
          const fallbackPath = '/dashboard/contracts';
          console.log(`[ContractRequest] Navigating to contract list: ${fallbackPath}`);
          navigate(fallbackPath); 
      }

    } catch (error) {
      console.error('Error submitting contract:', error);
      toast({
        title: "Error Submitting Contract",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
       setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading authentication...</p>
      </div>
    );
  }

  if (authError) {
     return (
       <div className="flex h-screen items-center justify-center text-red-600">
         <p>Authentication Error: {authError.message}</p>
       </div>
     );
  }

  if (!organizationId || !contractServiceInstance) {
      return (
         <div className="flex h-screen items-center justify-center text-red-600">
           <Navigation />
           <div className="flex-1 flex items-center justify-center">
              <p>Organization details or contract service missing. Cannot create contract request.</p>
           </div>
         </div>
      );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50 pt-16 pb-16">
        <div className="max-w-3xl mx-auto space-y-8 fade-in p-6">
          <header className="text-center space-y-4">
            <div className="inline-block px-4 py-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-full text-sm font-medium">
              New Contract Request
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-orange-600 bg-clip-text text-transparent">
              Submit a Contract Request
            </h1>
            <p className="text-gray-600">
              Fill out the form below to submit a new contract request. Please ensure all required information is provided.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
             <Card className="p-6 bg-white shadow-sm">
               <h2 className="text-xl font-semibold mb-6 border-b pb-2 flex items-center"><FileText className="h-5 w-5 mr-2 text-primary"/> Contract Details</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label htmlFor="requestTitle" className="text-sm font-medium">Request Title *</label>
                    <Input id="requestTitle" placeholder="e.g., Marketing Services Agreement" value={formData.requestTitle} onChange={e => setFormData({...formData, requestTitle: e.target.value})} required />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="contractType" className="text-sm font-medium">Contract Type *</label>
                    <Select value={formData.contractType} onValueChange={(value: FrontendContractType) => setFormData({...formData, contractType: value})} required>
                      <SelectTrigger id="contractType">
                        <SelectValue placeholder="Select contract type" />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="services">Services (PSA)</SelectItem>
                         <SelectItem value="goods">Goods (PSA)</SelectItem>
                         <SelectItem value="grant">Grant</SelectItem>
                         <SelectItem value="sponsorship">Sponsorship</SelectItem>
                         <SelectItem value="amendment">Amendment</SelectItem>
                         <SelectItem value="vendor_agreement">Vendor Agreement</SelectItem>
                         <SelectItem value="interagency_agreement">Interagency Agreement</SelectItem>
                         <SelectItem value="mou">MOU</SelectItem>
                         <SelectItem value="sole_source">Sole/Single Source</SelectItem>
                         <SelectItem value="rfp">RFP</SelectItem>
                       </SelectContent>
                    </Select>
                  </div>

                  {formData.contractType === 'amendment' && (
                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="amendmentNumber" className="text-sm font-medium">Amendment Number *</label>
                      <Input id="amendmentNumber" placeholder="e.g., 01, 02" value={formData.amendmentNumber} onChange={e => setFormData({...formData, amendmentNumber: e.target.value})} required />
                      <p className="text-xs text-gray-500">Enter the amendment number for this contract modification.</p>
                    </div>
                  )}

                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="description" className="text-sm font-medium">Description / Scope Summary *</label>
                    <Textarea id="description" placeholder="Briefly describe the contract's purpose and scope." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
                  </div>

                 <div className="space-y-2">
                   <label htmlFor="department" className="text-sm font-medium">Department *</label>
                   <Input id="department" placeholder="e.g., Marketing, IT" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} required />
                 </div>

                  <div className="space-y-2">
                    <label htmlFor="contractAdmin" className="text-sm font-medium">Contract Admin/Primary Contact *</label>
                    <Input id="contractAdmin" placeholder="Name of the responsible person" value={formData.contractAdmin} onChange={e => setFormData({...formData, contractAdmin: e.target.value})} required />
                  </div>
               </div>
             </Card>

             <Card className="p-6 bg-white shadow-sm">
                <h2 className="text-xl font-semibold mb-6 border-b pb-2 flex items-center"><DollarSign className="h-5 w-5 mr-2 text-primary"/> Financials & Dates</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="nte" className="text-sm font-medium">Not-to-Exceed (NTE) Amount *</label>
                    <Input id="nte" type="number" placeholder="e.g., 5000" value={formData.nte} onChange={e => setFormData({...formData, nte: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="startDate" className="text-sm font-medium">Start Date *</label>
                    <Input id="startDate" type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="endDate" className="text-sm font-medium">End Date *</label>
                    <Input id="endDate" type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} required />
                  </div>
                   <div className="space-y-2 md:col-span-3">
                     <label htmlFor="accountingCodes" className="text-sm font-medium">Accounting Codes (Optional)</label>
                     <Input id="accountingCodes" placeholder="e.g., Project Code, Cost Center" value={formData.accountingCodes} onChange={e => setFormData({...formData, accountingCodes: e.target.value})} />
                   </div>
                </div>
              </Card>

             <Card className="p-6 bg-white shadow-sm">
                <h2 className="text-xl font-semibold mb-6 border-b pb-2 flex items-center"><Building className="h-5 w-5 mr-2 text-primary"/> Vendor Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label htmlFor="vendorName" className="text-sm font-medium">Vendor Name *</label>
                     <Input id="vendorName" placeholder="Vendor/Contractor Company Name" value={formData.vendorName} onChange={e => setFormData({...formData, vendorName: e.target.value})} required />
                   </div>
                  <div className="space-y-2">
                    <label htmlFor="vendorEmail" className="text-sm font-medium">Vendor Email *</label>
                    <Input id="vendorEmail" type="email" placeholder="vendor@example.com" value={formData.vendorEmail} onChange={e => setFormData({...formData, vendorEmail: e.target.value})} required />
                  </div>
                   <div className="space-y-2">
                     <label htmlFor="vendorPhone" className="text-sm font-medium">Vendor Phone (Optional)</label>
                     <Input id="vendorPhone" placeholder="(555) 123-4567" value={formData.vendorPhone} onChange={e => setFormData({...formData, vendorPhone: e.target.value})} />
                   </div>
                   <div className="space-y-2 md:col-span-2">
                     <label htmlFor="vendorAddress" className="text-sm font-medium">Vendor Address (Optional)</label>
                     <Textarea id="vendorAddress" placeholder="123 Vendor St, City, State, Zip" value={formData.vendorAddress} onChange={e => setFormData({...formData, vendorAddress: e.target.value})} />
                   </div>
                </div>
              </Card>

              <Card className="p-6 bg-white shadow-sm">
                <h2 className="text-xl font-semibold mb-6 border-b pb-2 flex items-center"><User className="h-5 w-5 mr-2 text-primary"/> Signatory Details</h2>
                 <p className="text-sm text-gray-600 mb-4">Provide the contact information for the person authorized to sign on behalf of the vendor/contractor.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label htmlFor="signatoryName" className="text-sm font-medium">Signatory Full Name *</label>
                     <Input id="signatoryName" placeholder="Jane Doe" value={formData.signatoryName} onChange={e => setFormData({...formData, signatoryName: e.target.value})} required />
                   </div>
                  <div className="space-y-2">
                    <label htmlFor="signatoryEmail" className="text-sm font-medium">Signatory Email *</label>
                    <Input id="signatoryEmail" type="email" placeholder="signer@example.com" value={formData.signatoryEmail} onChange={e => setFormData({...formData, signatoryEmail: e.target.value})} required />
                  </div>
                 </div>
              </Card>

             <Card className="p-6 bg-white shadow-sm">
                <h2 className="text-xl font-semibold mb-6 border-b pb-2 flex items-center"><Briefcase className="h-5 w-5 mr-2 text-primary"/> Statement of Work (SOW) / Attachments</h2>
                <p className="text-sm text-gray-600 mb-4">Attach the SOW or any other relevant supporting documents. You can download a template below.</p>
                <div className="flex gap-4 mb-4">
                   <Button type="button" variant="outline" onClick={downloadTemplate}>
                     <Download className="h-4 w-4 mr-2"/> Download SOW Template
                   </Button>
                   <div className="relative">
                    <Input 
                       type="file" 
                       multiple 
                       onChange={handleFileChange} 
                       id="sowFiles" 
                       className="hidden"
                     />
                     <Button type="button" asChild>
                        <label htmlFor="sowFiles" className="cursor-pointer">
                           <Upload className="h-4 w-4 mr-2"/> Upload Files
                        </label>
                     </Button>
                   </div>
                </div>

                {formData.sowFiles.length > 0 && (
                   <div className="space-y-2 border-t pt-4">
                     <h3 className="text-sm font-medium">Selected Files:</h3>
                     <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                       {formData.sowFiles.map((file, index) => (
                         <li key={index} className="flex justify-between items-center">
                           <span>{file.name}</span>
                           <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700">
                             <X className="h-4 w-4"/>
                           </Button>
                         </li>
                       ))}
                     </ul>
                   </div>
                )}
              </Card>

             <div className="flex justify-end gap-4">
               <Button 
                 type="button"
                 variant="outline" 
                 onClick={() => navigate('/dashboard')} 
                 disabled={isSubmitting}
               >
                 Cancel
               </Button>
               <Button 
                 type="submit" 
                 className="bg-emerald-600 hover:bg-emerald-700" 
                 disabled={isSubmitting}
               >
                 {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  {isSubmitting ? "Submitting..." : "Submit Request"}
               </Button>
             </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ContractRequest;
