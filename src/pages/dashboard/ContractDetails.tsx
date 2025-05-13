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
import { useClerkAuth, ClerkAuthContextType } from "@/contexts/ClerkAuthContext";
import { Database } from "@/lib/supabase/types";
import { toast } from "@/components/ui/use-toast";
import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { formatISO } from 'date-fns'; // For timestamp
import { Loader2, ArrowLeft } from "lucide-react"; // Import Loader and ArrowLeft icon
import { Skeleton } from "@/components/ui/skeleton";
import { DisplayFile } from "@/domain/types/DisplayFile"; // This is the correct import

// Type aliases for cleaner code
type ContractsTable = Database['public']['Tables']['contracts'];
type ContractInsert = ContractsTable['Insert'];
type ContractUpdate = ContractsTable['Update'];
type ContractStatusDb = ContractsTable['Row']['status']; // Get DB status enum type
type ContractTypeDb = ContractsTable['Row']['type'];   // Get DB type enum type
type AuditTrailInsert = Database['public']['Tables']['contract_audit_trail']['Insert'];
type FilesTable = Database['public']['Tables']['contract_coi_files']; // Table will be renamed later
type DbFileRecord = FilesTable['Row'];
type COIFileInsert = FilesTable['Insert'];
type ContractRow = Database['public']['Tables']['contracts']['Row'];

// Local JSON type definition (compatible with Supabase JSONB)
// Based on common definitions, adjust if Supabase has specific nuances
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type Json = JsonValue; // Use JsonValue as the primary Json type

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

// Update mapDbToCOIFile to mapDbToFile and handle new fields
const mapDbToFileCorrected = (data: DbFileRecord): DisplayFile => ({
  id: data.id,
  contract_id: data.contract_id,
  file_name: data.file_name,
  file_path: data.file_path,
  document_type: (data as any).document_type || 'unknown', 
  mime_type: (data as any).mime_type || null,
  file_size: (data as any).file_size ?? null, // Use nullish coalescing for potentially zero file size
  uploaded_at: data.uploaded_at,
  uploaded_by: data.uploaded_by || undefined,
  expiration_date: data.expiration_date || null, 
});

const ContractDetails = () => {
  const { contractNumber } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [coiFiles, setCoiFiles] = useState<DisplayFile[]>([]);
  const [executedDocument, setExecutedDocument] = useState<DisplayFile | null>(null);
  const [generalAttachments, setGeneralAttachments] = useState<DisplayFile[]>([]);
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoadingContract, setIsLoadingContract] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [auditTrailRefreshKey, setAuditTrailRefreshKey] = useState(0);

  const {
    getToken,
    appUserDetails, // Use appUserDetails from context
    isLoading: isAuthLoading,
    contractServiceInstance,
    fileServiceInstance // This should now be correctly provided by useClerkAuth
  } = useClerkAuth();
  const { organizationId, supabaseUserId, email: userEmail } = appUserDetails;

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

  const fetchFiles = useCallback(async (currentContractId?: string) => {
    const idToFetch = currentContractId || contractId;
    if (!idToFetch || !fileServiceInstance) {
      console.log("[ContractDetails] fetchFiles: contractId or fileServiceInstance not available. Skipping fetch.");
      setIsLoadingFiles(false);
      return;
    }
    console.log(`[ContractDetails] Fetching files for contract ID: ${idToFetch}`);
    setIsLoadingFiles(true);
    try {
      const { data: filesData, error: filesError } = await fileServiceInstance.getContractFiles(idToFetch);
      if (filesError) throw filesError;
      if (filesData) {
        const allDisplayFiles: DisplayFile[] = filesData.map(mapDbToFileCorrected);
        console.log("[ContractDetails] All fetched files (DisplayFile):", allDisplayFiles);
        setCoiFiles(allDisplayFiles.filter(f => f.document_type === 'coi'));
        setExecutedDocument(allDisplayFiles.find(f => f.document_type === 'executed_agreement') || null);
        setGeneralAttachments(allDisplayFiles.filter(f => f.document_type === 'general_attachment'));
      } else {
        setCoiFiles([]);
        setExecutedDocument(null);
        setGeneralAttachments([]);
      }
    } catch (err) {
      console.error("Error fetching contract files:", err);
      toast({
        title: "Error Fetching Files",
        description: (err as Error).message || "Could not load contract documents.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFiles(false);
    }
  }, [contractId, fileServiceInstance, mapDbToFileCorrected]);

  useEffect(() => {
    console.log(`[ContractDetails] useEffect triggered. AuthLoading: ${isAuthLoading}, OrgID: ${organizationId}, ContractNumber: ${contractNumber}`);

    if (!isAuthLoading && contractNumber && organizationId && getToken) {
      console.log("[ContractDetails] Dependencies met, calling loadContract...");
      loadContract().then(loadedContract => {
        if (loadedContract && loadedContract.id) {
          console.log("[ContractDetails] Contract loaded, now fetching files for contract ID:", loadedContract.id);
          fetchFiles(loadedContract.id);
        }
      });
    } else {
       console.log("[ContractDetails] Dependencies not met, waiting...");
       if (isAuthLoading) {
           setIsLoadingContract(true); 
       }
    }
  }, [isAuthLoading, contractNumber, organizationId, getToken, loadContract, fetchFiles]);

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

  const handleFileUploadSuccess = (fileName: string, filePath: string, documentType: string) => {
    console.log(`[ContractDetails] File upload success: ${fileName}, Type: ${documentType}, Path: ${filePath}. Triggering file list refresh.`);
    fetchFiles();

    setAuditTrailRefreshKey(prevKey => prevKey + 1);
    console.log("[ContractDetails] Incremented auditTrailRefreshKey to trigger audit trail refresh.");

    toast({
      title: "File Uploaded",
      description: `${fileName} has been successfully uploaded as a ${documentType.replace('_', ' ')}.`,
    });
  };

  const handleDeleteFile = async (fileId: string, filePath: string, delContractId: string, delOrganizationId: string) => {
    if (contractServiceInstance && delContractId && delOrganizationId && appUserDetails?.supabaseUserId && appUserDetails?.email) {
       const { error } = await contractServiceInstance.deleteContractFile(filePath, delContractId, delOrganizationId);
        if (!error) {
            // Refresh file list first
            fetchFiles(delContractId);
            
            toast({ title: "File Deleted", description: `File ${filePath} deleted successfully.` });

            // ***** ADD AUDIT TRAIL ENTRY *****
            // Determine document type from filePath for a more specific audit message if possible
            let documentTypeForAudit = 'file';
            if (filePath.includes('/coi/')) documentTypeForAudit = 'COI document';
            else if (filePath.includes('/executed_agreement/')) documentTypeForAudit = 'executed agreement';
            else if (filePath.includes('/general_attachment/')) documentTypeForAudit = 'general attachment';

            const auditEntry = {
                contract_id: delContractId,
                action_type: 'document_deleted' as const,
                changes: {
                    filePath: filePath,
                    fileId: fileId, // The ID of the DB record that was deleted
                    message: `Deleted ${documentTypeForAudit}: ${filePath.substring(filePath.lastIndexOf('/') + 1)}`
                },
                // performed_by and performed_by_email will be added by addAuditTrailEntry
            };
            console.log("[ContractDetails] Creating audit entry for file deletion:", auditEntry);
            const { error: auditError } = await contractServiceInstance.addAuditTrailEntry(auditEntry);
            if (auditError) {
                console.error("[ContractDetails] Failed to create audit trail entry for file deletion:", auditError);
                toast({
                    title: "Warning", 
                    description: "File deleted, but failed to record audit event.",
                    variant: "default" 
                });
            } else {
                 console.log("[ContractDetails] Audit entry for file deletion created successfully.");
            }
            // ***** END AUDIT TRAIL ENTRY *****

            // Increment the key to force ContractAuditTrail to re-render and re-fetch
            setAuditTrailRefreshKey(prevKey => prevKey + 1);
            console.log("[ContractDetails] Incremented auditTrailRefreshKey after file deletion.");

        } else {
            toast({ title: "Error Deleting File", description: error.message, variant: "destructive" });
        }
    } else {
        toast({ title: "Error", description: "Cannot delete file: Service or IDs missing.", variant: "destructive" });
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
              document={executedDocument}
              contractId={contract.id}
              organizationId={organizationId ?? ''}
              onUploadSuccess={handleFileUploadSuccess}
              onDelete={handleDeleteFile}
              isLoading={isLoadingFiles}
              fileService={fileServiceInstance}
            />
          </Card>

          <Card className="p-4 bg-white shadow-sm">
                <COIFileUpload
              contractId={contract.id}
              organizationId={organizationId ?? ''}
              coiFiles={coiFiles}
              onUploadSuccess={handleFileUploadSuccess}
              onDelete={handleDeleteFile}
              isLoading={isLoadingFiles}
              fileService={fileServiceInstance}
            />
          </Card>
              </div>

        <Card className="p-4 bg-white shadow-sm">
          <ContractAttachments
            attachments={generalAttachments}
            contractId={contract.id}
            organizationId={organizationId ?? ''}
            onUploadSuccess={handleFileUploadSuccess}
            onDelete={handleDeleteFile}
            isLoading={isLoadingFiles}
            fileService={fileServiceInstance}
          />
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
            <ContractAuditTrail 
              key={auditTrailRefreshKey}
              contractId={contract.id} 
            />
          </Card>

      </main>
      </div>
  );
};

export default ContractDetails;
