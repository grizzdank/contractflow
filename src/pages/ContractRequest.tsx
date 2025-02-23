import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardCheck, File, Send, User, Building, DollarSign, Calendar, Briefcase, FileText } from "lucide-react";
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

type ContractType = "grant" | "services" | "goods" | "sponsorship" | "amendment" | "vendor_agreement" | "interagency_agreement" | "mou" | "sole_source" | "rfp";

const ContractRequest = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    requestTitle: "",
    description: "",
    contractType: "" as ContractType,
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
    sowFile: null as File | null,
    status: "pending_approval" as "pending_approval" | "approved" | "rejected",
  });
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, sowFile: e.target.files[0] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Show success toast with approval workflow information
    toast({
      title: "Request Submitted Successfully",
      description: `Your contract request has been sent to the ${formData.department} director for approval. You will be notified of any updates.`,
      duration: 5000,
    });

    // In a real application, we would save the request data here
    // and trigger notifications to the department director

    // Navigate to contracts page after submission
    setTimeout(() => {
      navigate('/contracts');
    }, 2000);

    setFormData({
      requestTitle: "",
      description: "",
      contractType: "" as ContractType,
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
      sowFile: null,
      status: "pending_approval",
    });
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50 pt-16">
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

          <Card className="p-6 glass-panel">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-gray-700">Request Title</span>
                    <Input
                      type="text"
                      required
                      value={formData.requestTitle}
                      onChange={(e) => setFormData({ ...formData, requestTitle: e.target.value })}
                      className="mt-1 block w-full"
                      placeholder="Brief title for your request"
                    />
                  </label>

                  <label className="block">
                    <span className="text-gray-700">Contract Type</span>
                    <Select
                      value={formData.contractType}
                      onValueChange={(value: ContractType) => setFormData({ ...formData, contractType: value })}
                    >
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue placeholder="Select contract type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grant">Grant</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="goods">Goods</SelectItem>
                        <SelectItem value="sponsorship">Sponsorship</SelectItem>
                        <SelectItem value="amendment">Amendment</SelectItem>
                        <SelectItem value="vendor_agreement">Vendor Agreement</SelectItem>
                        <SelectItem value="interagency_agreement">InterAgency Agreement</SelectItem>
                        <SelectItem value="mou">MOU</SelectItem>
                        <SelectItem value="sole_source">Sole/Single Source</SelectItem>
                        <SelectItem value="rfp">RFP</SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                </div>

                {formData.contractType === "amendment" && (
                  <label className="block">
                    <span className="text-gray-700">Contract/PO Number to Amend</span>
                    <Input
                      type="text"
                      value={formData.amendmentNumber}
                      onChange={(e) => setFormData({ ...formData, amendmentNumber: e.target.value })}
                      className="mt-1 block w-full"
                      placeholder="Enter original contract or PO number"
                    />
                  </label>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-gray-700 flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Requesting Department
                    </span>
                    <Input
                      type="text"
                      required
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="mt-1 block w-full"
                      placeholder="Enter department name"
                    />
                  </label>

                  <label className="block">
                    <span className="text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Contract Administrator
                    </span>
                    <Input
                      type="text"
                      required
                      value={formData.contractAdmin}
                      onChange={(e) => setFormData({ ...formData, contractAdmin: e.target.value })}
                      className="mt-1 block w-full"
                      placeholder="Enter administrator name"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-gray-700">Description</span>
                  <Textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full"
                    placeholder="Describe the purpose and details of the contract"
                    rows={4}
                  />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="block">
                    <span className="text-gray-700 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      NTE Amount
                    </span>
                    <Input
                      type="number"
                      required
                      value={formData.nte}
                      onChange={(e) => setFormData({ ...formData, nte: e.target.value })}
                      className="mt-1 block w-full"
                      placeholder="0.00"
                    />
                  </label>
                  <label className="block">
                    <span className="text-gray-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Start Date
                    </span>
                    <Input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="mt-1 block w-full"
                    />
                  </label>
                  <label className="block">
                    <span className="text-gray-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      End Date
                    </span>
                    <Input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="mt-1 block w-full"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-gray-700">Accounting Codes</span>
                  <Input
                    type="text"
                    required
                    value={formData.accountingCodes}
                    onChange={(e) => setFormData({ ...formData, accountingCodes: e.target.value })}
                    className="mt-1 block w-full"
                    placeholder="Enter accounting codes"
                  />
                </label>

                <div className="bg-emerald-50 p-4 rounded-lg space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Building className="h-5 w-5" />
                    <h3 className="font-medium">Vendor Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-gray-700">Vendor Name</span>
                      <Input
                        type="text"
                        required
                        value={formData.vendorName}
                        onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                        className="mt-1 block w-full"
                      />
                    </label>
                    <label className="block">
                      <span className="text-gray-700">Vendor Email</span>
                      <Input
                        type="email"
                        required
                        value={formData.vendorEmail}
                        onChange={(e) => setFormData({ ...formData, vendorEmail: e.target.value })}
                        className="mt-1 block w-full"
                      />
                    </label>
                    <label className="block">
                      <span className="text-gray-700">Vendor Phone</span>
                      <Input
                        type="tel"
                        value={formData.vendorPhone}
                        onChange={(e) => setFormData({ ...formData, vendorPhone: e.target.value })}
                        className="mt-1 block w-full"
                      />
                    </label>
                    <label className="block">
                      <span className="text-gray-700">Vendor Address</span>
                      <Input
                        type="text"
                        required
                        value={formData.vendorAddress}
                        onChange={(e) => setFormData({ ...formData, vendorAddress: e.target.value })}
                        className="mt-1 block w-full"
                      />
                    </label>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg space-y-4">
                  <div className="flex items-center gap-2 text-orange-700">
                    <User className="h-5 w-5" />
                    <h3 className="font-medium">Authorized Signatory</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-gray-700">Signatory Name</span>
                      <Input
                        type="text"
                        required
                        value={formData.signatoryName}
                        onChange={(e) => setFormData({ ...formData, signatoryName: e.target.value })}
                        className="mt-1 block w-full"
                      />
                    </label>
                    <label className="block">
                      <span className="text-gray-700">Signatory Email</span>
                      <Input
                        type="email"
                        required
                        value={formData.signatoryEmail}
                        onChange={(e) => setFormData({ ...formData, signatoryEmail: e.target.value })}
                        className="mt-1 block w-full"
                      />
                    </label>
                  </div>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                    />
                    <div className="space-y-2">
                      <File className="h-8 w-8 mx-auto text-gray-400" />
                      <div className="text-sm text-gray-600">
                        {formData.sowFile ? (
                          <span className="text-emerald-600">{formData.sowFile.name}</span>
                        ) : (
                          <>
                            <span className="text-emerald-600 font-medium">Click to upload</span> or drag
                            and drop
                            <br />
                            SOW document (PDF, DOC, DOCX)
                          </>
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="submit"
                  size="lg"
                  className="hover-effect bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Request
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ContractRequest;
