import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { COIFileUpload } from "@/components/COIFileUpload";
import { Contract } from "@/domain/types/Contract";
import { ContractHeader } from "@/components/contract/ContractHeader";
import { ContractDetailsGrid } from "@/components/contract/ContractDetailsGrid";
import { ContractAttachments } from "@/components/contract/ContractAttachments";
import { ContractComments, Comment } from "@/components/contract/ContractComments";
import { ContractExecutedDocument } from "@/components/contract/ContractExecutedDocument";
import { ContractAuditTrail } from "@/components/contract/ContractAuditTrail";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/client";
import { useClerkAuth } from "@/contexts/ClerkAuthContext";
import { Database } from "@/lib/supabase/types";
import { toast } from "@/components/ui/use-toast";
import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { formatISO } from 'date-fns'; // For timestamp
import { Loader2, ArrowLeft } from "lucide-react"; // Import Loader and ArrowLeft icon
import { Skeleton } from "@/components/ui/skeleton";

// Type aliases for cleaner code
type ContractsTable = Database['public']['Tables']['contracts'];
type ContractInsert = ContractsTable['Insert'];
type ContractUpdate = ContractsTable['Update'];
type ContractStatusDb = ContractsTable['Row']['status']; // Get DB status enum type
type ContractTypeDb = ContractsTable['Row']['type'];   // Get DB type enum type
type AuditTrailInsert = Database['public']['Tables']['contract_audit_trail']['Insert'];
type COIFilesTable = Database['public']['Tables']['contract_coi_files'];
type COIFileRow = COIFilesTable['Row'];
type COIFileInsert = COIFilesTable['Insert'];
type ContractRow = Database['public']['Tables']['contracts']['Row'];

// Local JSON type definition (compatible with Supabase JSONB)
// Based on common definitions, adjust if Supabase has specific nuances
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type Json = JsonValue; // Use JsonValue as the primary Json type

// Frontend type for COI File (adjust based on actual DB columns)
interface COIFile {
  id: string; // Assuming UUID primary key
  contract_id: string;
  file_name: string;
  file_path: string; // Path in Supabase Storage
  uploaded_at: string;
  uploaded_by?: string; // Optional uploader ID
  expiration_date: string; // Added based on linter error
}

// Define a structure for comments within the contract
interface ContractComment {
    text: string;
    userId: string;
    userEmail: string;
    timestamp: string; // ISO 8601 format
}

// Updated mapDbToContract
const mapDbToContract = (data: ContractRow): Contract => {
  let parsedComments: Comment[] = [];
  if (data.comments && Array.isArray(data.comments)) {
      const validatedComments = data.comments.filter(
          (c: any): c is Comment =>
              c &&
              typeof c.id === 'string' &&
              typeof c.userId === 'string' &&
              typeof c.userName === 'string' &&
              typeof c.content === 'string' &&
              typeof c.timestamp === 'string'
      );
      if (validatedComments.length !== data.comments.length) {
          console.warn("[ContractDetails] Some comments in DB data had invalid structure.");
      }
      // Cast via unknown for stricter type safety
      parsedComments = validatedComments as unknown as Comment[];
  } else if (data.comments != null) {
      console.warn("[ContractDetails] Comments field exists but is not an array:", data.comments);
  }

  // Assert status and type directly if DB enums match frontend enums
  // Otherwise, implement proper DB -> Frontend mapping functions
  const frontendStatus = data.status as Contract['status'];
  const frontendType = data.type as Contract['type'];

  return {
    id: data.id,
    contractNumber: data.contract_number,
    title: data.title,
    description: data.description,
    vendor: data.vendor,
    amount: data.amount,
    startDate: data.start_date,
    endDate: data.end_date,
    status: frontendStatus, // Use asserted/mapped status
    type: frontendType,     // Use asserted/mapped type
    department: data.department,
    accountingCodes: data.accounting_codes,
    vendorEmail: data.vendor_email,
    vendorPhone: data.vendor_phone,
    vendorAddress: data.vendor_address,
    signatoryName: data.signatory_name,
    signatoryEmail: data.signatory_email,
    attachments: [], // Add attachments field back as empty array
    comments: parsedComments,
    creatorId: data.creator_id,
    creatorEmail: data.creator_email,
    createdAt: data.created_at
  };
};

// Helper to map frontend status to DB status enum
const mapStatusToDb = (frontendStatus: Contract['status']): ContractStatusDb | undefined => {
  switch (frontendStatus) {
    case 'Requested': return 'new';
    case 'Draft': return 'draft';
    case 'Review': return 'in_coord'; // Assuming Review maps to in_coord
    case 'InSignature': return 'in_signature';
    case 'ExecutedActive': return 'active'; // Or 'executed'? Check desired logic
    case 'ExecutedExpired': return 'expired';
    // Add mappings for other frontend statuses if they exist
    default:
      console.warn(`[ContractDetails] Unmapped frontend status: ${frontendStatus}`);
      return undefined; // Or handle as error
  }
};

// Helper to map frontend type to DB type enum
const mapTypeToDb = (frontendType: Contract['type']): ContractTypeDb | undefined => {
  switch (frontendType) {
    case 'grant': return 'other'; // Example mapping, adjust as needed
    case 'services': return 'service';
    case 'goods': return 'product'; // Example mapping
    case 'sponsorship': return 'sponsorship';
    case 'amendment': return 'other'; // Example mapping
    case 'vendor_agreement': return 'vendor';
    case 'interagency_agreement': return 'iaa';
    case 'mou': return 'mou';
    case 'sole_source': return 'other'; // Example mapping
    case 'rfp': return 'other'; // Example mapping
    // Add mappings for other frontend types if they exist
    default:
      console.warn(`[ContractDetails] Unmapped frontend type: ${frontendType}`);
      return undefined; // Or handle as error
  }
};

// Function to map frontend Contract state back to DB Update format
const mapContractToDbUpdate = (contract: Contract, organizationId: string): ContractUpdate => {
  const mappedStatus = mapStatusToDb(contract.status);
  const mappedType = mapTypeToDb(contract.type);

  return {
    title: contract.title,
    description: contract.description,
    vendor: contract.vendor,
    amount: contract.amount,
    start_date: contract.startDate,
    end_date: contract.endDate,
    status: mappedStatus, // Use mapped status
    type: mappedType,     // Use mapped type
    department: contract.department,
    accounting_codes: contract.accountingCodes,
    vendor_email: contract.vendorEmail,
    vendor_phone: contract.vendorPhone,
    vendor_address: contract.vendorAddress,
    signatory_name: contract.signatoryName,
    signatory_email: contract.signatoryEmail,
    organization_id: organizationId,
  };
};

// Function to map DB row to frontend COIFile type
const mapDbToCOIFile = (data: COIFileRow): COIFile => ({
  id: data.id,
  contract_id: data.contract_id,
  file_name: data.file_name,
  file_path: data.file_path,
  uploaded_at: data.uploaded_at,
  uploaded_by: data.uploaded_by ?? undefined, // Handle potential null
  expiration_date: data.expiration_date, // Added
});

const ContractDetails = () => {
  const { contractNumber } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [coiFiles, setCoiFiles] = useState<COIFile[]>([]);
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoadingContract, setIsLoadingContract] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    getToken,
    userDetails,
    isLoading: isAuthLoading,
    contractServiceInstance
  } = useClerkAuth();
  const { organizationId, supabaseUserId, email: userEmail } = userDetails;

  const contractId = contract?.id;

  const loadContract = useCallback(async (): Promise<Contract | null> => {
    if (!contractNumber || !getToken || !organizationId) {
      console.error("[ContractDetails] loadContract called without required dependencies.");
      setError("Failed to load: Missing contract number or authentication details.");
      setIsLoadingContract(false);
      return null;
    }

    console.log(`[ContractDetails] Attempting to load contract ${contractNumber} for org ${organizationId}`);
    setIsLoadingContract(true);
    setError(null);
    try {
      const authenticatedSupabase = await createAuthenticatedSupabaseClient(getToken);
      console.log("[ContractDetails] Authenticated client created.");

      console.log(`[ContractDetails] Querying Supabase with: contractNumber='${contractNumber}', organizationId='${organizationId}'`);

      const { data, error: fetchError } = await authenticatedSupabase
        .from('contracts')
        .select('*')
        .eq('contract_number', contractNumber)
        .eq('organization_id', organizationId)
        .limit(1)
        .maybeSingle();

      console.log("[ContractDetails] Fetch response:", { data, fetchError });

      if (fetchError) {
         console.error("[ContractDetails] Error fetching contract:", fetchError);
         throw fetchError;
      }

      if (!data) {
        setError(`Contract ${contractNumber} not found or access denied.`);
        setContract(null);
        console.warn(`[ContractDetails] Contract ${contractNumber} not found for org ${organizationId}.`);
        setIsLoadingContract(false);
        return null;
      } else {
        const loaded = mapDbToContract(data as ContractRow);
        setContract(loaded);
        console.log("[ContractDetails] Contract data mapped and set:", loaded);
        setIsLoadingContract(false);
        return loaded;
      }
    } catch (err: any) {
      console.error("[ContractDetails] Exception during loadContract:", err);
      setError(err.message || 'Failed to load contract data.');
      setContract(null);
      setIsLoadingContract(false);
      return null;
    }
  }, [contractNumber, getToken, organizationId]);

  useEffect(() => {
    console.log(`[ContractDetails] useEffect triggered. AuthLoading: ${isAuthLoading}, OrgID: ${organizationId}, ContractNumber: ${contractNumber}`);

    if (!isAuthLoading && contractNumber && organizationId && getToken) {
      console.log("[ContractDetails] Dependencies met, calling loadContract...");
      loadContract();
    } else {
       console.log("[ContractDetails] Dependencies not met, waiting...");
       if (isAuthLoading) {
           setIsLoadingContract(true); 
       }
    }
  }, [isAuthLoading, contractNumber, organizationId, getToken, loadContract]);

  const handleSave = async () => {
    if (!contract || !getToken || !organizationId || !supabaseUserId || !userEmail || !contractServiceInstance) {
      toast({
        title: "Error",
        description: "Cannot save. Missing contract data, user details, or service not ready.",
        variant: "destructive",
      });
      console.error("Save failed: Missing data/service", { contract, getToken: !!getToken, organizationId, supabaseUserId, userEmail, serviceReady: !!contractServiceInstance });
      return;
    }

    console.log("[ContractDetails] handleSave called. Contract state:", contract);
    setIsLoadingContract(true);
    try {
      const dbUpdateData = mapContractToDbUpdate(contract, organizationId);
      console.log("[ContractDetails] Mapped data for DB update:", dbUpdateData);

      const { data: originalData, error: originalError } = await contractServiceInstance.getContract(contract.id);

      if(originalError || !originalData) {
          console.error("Failed to fetch original contract data for audit:", originalError);
          toast({
             title: "Save Warning",
             description: "Could not record detailed changes. Please verify save manually.",
             variant: "destructive"
          });
      }

      let changes: Record<string, { old: any; new: any }> = {};
      if (originalData) {
          for (const key in contract) {
              if (Object.prototype.hasOwnProperty.call(contract, key)) {
                  const typedKey = key as keyof Contract;
                  if (contract[typedKey] !== originalData[typedKey]) {
                      let oldDbValue: any = originalData[typedKey];
                      let newDbValue: any = contract[typedKey];
                      let dbFieldName: string = key;

                      if (typedKey === 'status') {
                          oldDbValue = mapStatusToDb(originalData.status);
                          newDbValue = mapStatusToDb(contract.status);
                          dbFieldName = 'status';
                      } else if (typedKey === 'type') {
                          oldDbValue = mapTypeToDb(originalData.type);
                          newDbValue = mapTypeToDb(contract.type);
                          dbFieldName = 'type';
                      } else if (typedKey === 'startDate') {
                          oldDbValue = originalData.startDate;
                          newDbValue = contract.startDate;
                          dbFieldName = 'start_date';
                      } else if (typedKey === 'endDate') {
                          oldDbValue = originalData.endDate;
                          newDbValue = contract.endDate;
                          dbFieldName = 'end_date';
                      }
                      
                      changes[dbFieldName] = { old: oldDbValue, new: newDbValue };
                  }
              }
          }
          console.log("[ContractDetails] Detected changes for audit (DB format):", changes);
      }

      const { data: updateData, error: updateError } = await contractServiceInstance.updateContract(contract.id, dbUpdateData);

      if (updateError) {
         console.error("[ContractDetails] Error updating contract:", updateError);
         throw updateError;
      }
      console.log("[ContractDetails] Contract update successful via service:", updateData);

       if (Object.keys(changes).length > 0) {
          try {
              const auditPayload: AuditTrailInsert = {
                  contract_id: contract.id,
                  action_type: 'contract_updated',
                  changes: changes,
                  performed_by: supabaseUserId,
                  performed_by_email: userEmail,
                  organization_id: organizationId
              };
              const { error: auditError } = await contractServiceInstance.addAuditTrailEntry(auditPayload);
              if (auditError) {
                  console.error("[ContractDetails] Failed to add audit trail entry via service:", auditError);
                  toast({
                     title: "Warning",
                     description: "Contract saved, but failed to log audit trail entry.",
                  });
              } else {
                  console.log("[ContractDetails] Audit trail entry added successfully via service.");
              }
          } catch (auditCatchError) {
               console.error("[ContractDetails] Caught error adding audit trail entry via service:", auditCatchError);
               toast({
                  title: "Warning",
                  description: "Contract saved, but an error occurred logging the audit trail entry.",
               });
          }
      } else {
          console.log("[ContractDetails] No changes detected, skipping audit trail.");
      }

      setContract(mapDbToContract(updateData as ContractRow));
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Contract details saved successfully.",
      });
    } catch (err: any) {
      console.error("[ContractDetails] Error saving contract:", err);
      setError(err.message || 'Failed to save contract details.');
      toast({
        title: "Save Failed",
        description: err.message || 'An unexpected error occurred.',
        variant: "destructive",
      });
    } finally {
      setIsLoadingContract(false);
    }
  };

  const addComment = async (commentText: string) => {
    if (!contract || !supabaseUserId || !organizationId || !userEmail || !contractServiceInstance) {
        toast({ title: "Error", description: "Cannot add comment. Missing details or service not ready.", variant: "destructive" });
        return;
    }
    if (!commentText.trim()) {
        toast({ title: "Error", description: "Comment cannot be empty.", variant: "destructive" });
        return;
    }
    try {
        const { error } = await contractServiceInstance.addComment(contract.id, commentText.trim());
        if (error) {
           console.error("Failed to add comment via service:", error);
           toast({ title: "Error", description: `Failed to add comment: ${error.message}`, variant: "destructive" });
        } else {
            console.log("Comment added successfully via service.");
            toast({ title: "Success", description: "Comment added." });
            setNewComment(""); // Clear input after successful submission
            // TODO: Trigger comment list refresh (might need separate state or refetch)
        }
    } catch(err) {
        console.error("Caught error adding comment via service:", err);
        toast({ title: "Error", description: "An unexpected error occurred adding the comment.", variant: "destructive" });
    }
  };

  const handleAddCommentClick = () => {
      addComment(newComment); // Call the actual addComment with the current state value
  };

  const loadCOIFiles = async (currentContractId: string) => {
    if (!getToken || !currentContractId) return;
    console.log("[ContractDetails] Loading COI files for contract:", currentContractId);
    try {
        const authenticatedSupabase = await createAuthenticatedSupabaseClient(getToken);
        const { data, error: coiError } = await authenticatedSupabase
            .from('contract_coi_files')
            .select('*')
            .eq('contract_id', currentContractId)
            .eq('is_executed_contract', false)
            .order('uploaded_at', { ascending: false });

        if (coiError) {
             console.error("[ContractDetails] Error loading COI files:", coiError);
             throw coiError;
        }
        const mappedFiles = data ? data.map(mapDbToCOIFile) : [];
        setCoiFiles(mappedFiles);
        console.log("[ContractDetails] COI files loaded and mapped:", mappedFiles);
    } catch (err: any) {
         console.error("[ContractDetails] Exception loading COI files:", err);
         toast({ title: "Error Loading COI Files", description: err.message, variant: "destructive" });
    }
  };

  const handleCOIUploadSuccess = async (fileName: string, filePath: string) => {
    console.log("[ContractDetails] handleCOIUploadSuccess called.");
    toast({ title: "COI Uploaded", description: `${fileName} uploaded successfully.` });

      if (contractId && supabaseUserId && userEmail && getToken && organizationId) {
          try {
              const authenticatedSupabase = await createAuthenticatedSupabaseClient(getToken);
               const auditPayload: AuditTrailInsert = {
                   contract_id: contractId,
                   action_type: 'coi_uploaded',
                   changes: { file_name: fileName, path: filePath },
                   performed_by: supabaseUserId,
                   performed_by_email: userEmail,
                   organization_id: organizationId
               };
               const { error: auditError } = await contractServiceInstance.addAuditTrailEntry(auditPayload);
               if (auditError) {
                   console.warn("[ContractDetails] Failed to insert COI upload audit trail:", auditError);
               }
          } catch (auditException) {
               console.error("[ContractDetails] Exception inserting COI upload audit trail:", auditException);
          }
      } else {
           console.warn("[ContractDetails] Missing data for COI upload audit trail.");
      }

      if (contractId) {
         loadCOIFiles(contractId);
      }
  };

  const handleCOIDelete = async (fileId: string, filePath: string) => {
    if (!getToken || !contractId || !supabaseUserId || !userEmail || !organizationId) {
      toast({ title: "Error", description: "Missing context for deletion.", variant: "destructive" });
      return;
    }
    console.log(`[ContractDetails] Deleting COI file ID: ${fileId}, Path: ${filePath}`);

    const originalFiles = coiFiles;
    setCoiFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));

    try {
      const authenticatedSupabase = await createAuthenticatedSupabaseClient(getToken);

      const { error: dbError } = await authenticatedSupabase
        .from('contract_coi_files')
        .delete()
        .eq('id', fileId)
        .eq('contract_id', contractId);

      if (dbError) {
        console.error("[ContractDetails] Error deleting COI DB record:", dbError);
        throw dbError;
      }
      console.log("[ContractDetails] COI DB record deleted successfully.");

      const { error: storageError } = await authenticatedSupabase.storage
        .from('coi-documents')
        .remove([filePath]);

      if (storageError) {
        console.warn("[ContractDetails] Error deleting COI from storage (DB record deleted):", storageError);
        toast({ title: "Warning", description: "File deleted from records, but failed to remove from storage." });
      } else {
        console.log("[ContractDetails] COI file deleted from storage successfully.");
        toast({ title: "Success", description: "COI document deleted successfully." });
      }

       try {
           const auditPayload: AuditTrailInsert = {
               contract_id: contractId,
               action_type: 'coi_deleted',
               changes: { file_id: fileId, path: filePath },
               performed_by: supabaseUserId,
               performed_by_email: userEmail,
               organization_id: organizationId
           };
           const { error: auditError } = await contractServiceInstance.addAuditTrailEntry(auditPayload);
           if (auditError) {
               console.warn("[ContractDetails] Failed to insert COI delete audit trail:", auditError);
           }
       } catch (auditException) {
           console.error("[ContractDetails] Exception inserting COI delete audit trail:", auditException);
       }

    } catch (err: any) {
      console.error("[ContractDetails] Error deleting COI file:", err);
      toast({ title: "Error Deleting COI", description: err.message, variant: "destructive" });
      setCoiFiles(originalFiles); // Revert optimistic update
    }
  };

  const refreshCOIFiles = () => {
    if (contractId) {
        loadCOIFiles(contractId);
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

  if (error && !contract) {
    return (
      <div className="flex flex-col h-screen">
        <Navigation /> 
        <main className="flex-1 p-6 flex flex-col items-center justify-center">
          <Alert variant="destructive" className="max-w-md mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={() => navigate('/dashboard/contracts')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Contracts List
          </Button>
        </main>
      </div>
    );
  }

  if (!contract && !isLoadingContract && !error) {
    return (
        <div className="flex flex-col h-screen">
            <Navigation />
            <main className="flex-1 p-6 flex flex-col items-center justify-center">
                <p className="text-gray-500">Contract not found.</p>
                 <Button variant="outline" onClick={() => navigate('/dashboard/contracts')} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Contracts List
                </Button>
            </main>
        </div>
    );
  }

  if (isLoadingContract) {
     return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading contract details...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="flex-1 p-6 overflow-auto space-y-6">
         {error && contract && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/dashboard/contracts')} 
         >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contracts List
         </Button>

          <ContractHeader
          contract={contract}
            isEditing={isEditing}
          onEditToggle={() => setIsEditing(!isEditing)}
          onSave={handleSave}
        />

        <ContractDetailsGrid contract={contract} isEditing={isEditing} onFieldChange={(field, value) => {
          setContract(prev => prev ? { ...prev, [field]: value } : null);
        }} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <Card className="p-4 bg-white shadow-sm">
            <ContractExecutedDocument
              contractId={contract.id}
              onDocumentUploaded={refreshCOIFiles}
            />
          </Card>

          <Card className="p-4 bg-white shadow-sm">
                <COIFileUpload
              contractId={contract.id}
              coiFiles={coiFiles}
              onUploadSuccess={handleCOIUploadSuccess}
              onDelete={handleCOIDelete}
              isLoading={isLoadingContract}
            />
          </Card>
              </div>

        <Card className="p-4 bg-white shadow-sm">
          <ContractAttachments contractId={contract.id} />
        </Card>

        <Card className="p-4 bg-white shadow-sm">
              <ContractComments
                comments={contract.comments || []}
                newComment={newComment}
                onNewCommentChange={setNewComment}
                onAddComment={handleAddCommentClick}
                currentUserId={supabaseUserId}
              />
        </Card>

         <Card className="p-4 bg-white shadow-sm">
            <ContractAuditTrail contractId={contract.id} />
          </Card>

      </main>
      </div>
  );
};

export default ContractDetails;
