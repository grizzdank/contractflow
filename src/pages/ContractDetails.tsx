import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { useAuth } from "@/lib/hooks/useAuth";
import { ClerkAuthContext } from "@/contexts/ClerkAuthContext";
import { Database } from "@/lib/supabase/types";
import { toast } from "@/components/ui/use-toast";
import { SupabaseClient } from '@supabase/supabase-js';
import { formatISO } from 'date-fns'; // For timestamp

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
const mapContractToDbUpdate = (contract: Contract): ContractUpdate => {
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getToken, user } = useAuth();
  const authContext = useContext(ClerkAuthContext);
  const organizationId = authContext?.authState.user?.organizationId;
  const userId = authContext?.authState.user?.id;
  const userEmail = user?.emailAddresses?.[0]?.emailAddress;
  const userName = user?.fullName || user?.username || userEmail || 'Unknown User';
  const contractId = contract?.id; // For convenience in addComment

  useEffect(() => {
    console.log("[ContractDetails] useEffect triggered. contractNumber:", contractNumber, "organizationId:", organizationId);
    if (contractNumber && getToken && organizationId) {
      loadContract().then(loadedContract => {
        // Load COI files only *after* contract is successfully loaded
        if (loadedContract?.id) {
            console.log("[ContractDetails] Contract loaded, now loading COI files for contract ID:", loadedContract.id);
            loadCOIFiles(loadedContract.id);
        } else {
            console.warn("[ContractDetails] Contract loaded but ID is missing, cannot load COI files.");
        }
      });
    } else if (contractNumber && (!getToken || !organizationId)) {
      setIsLoading(true);
      setError("Authenticating...");
      console.log("[ContractDetails] Waiting for getToken/organizationId...");
    }
  }, [contractNumber, getToken, organizationId]);

  const loadContract = async (): Promise<Contract | null> => {
    if (!contractNumber || !getToken || !organizationId) {
      console.error("[ContractDetails] loadContract called without required dependencies.");
      setError("Failed to load: Missing contract number or authentication details.");
      setIsLoading(false);
      return null; // Return null
    }
    
    console.log(`[ContractDetails] Attempting to load contract ${contractNumber} for org ${organizationId}`);
    try {
      setIsLoading(true);
      setError(null);

      const authenticatedSupabase = await createAuthenticatedSupabaseClient(getToken);
      console.log("[ContractDetails] Authenticated client created.");

      const { data, error: fetchError } = await authenticatedSupabase
        .from('contracts')
        .select('*')
        .eq('contract_number', contractNumber)
        .eq('organization_id', organizationId)
        .maybeSingle();

      console.log("[ContractDetails] Fetch response:", { data, fetchError });

      if (fetchError) throw fetchError;

      if (!data) {
        setError(`Contract ${contractNumber} not found or access denied.`);
        setContract(null);
        console.warn(`[ContractDetails] Contract ${contractNumber} not found for org ${organizationId}.`);
        return null; // Return null on failure/not found
      } else {
        const loaded = mapDbToContract(data);
        setContract(loaded);
        console.log("[ContractDetails] Contract data set:", data);
        return loaded; // Return the loaded contract
      }

    } catch (error: any) {
      console.error('[ContractDetails] Error loading contract:', error);
      setError(error.message || 'Failed to load contract details');
    } finally {
      setIsLoading(false);
      console.log("[ContractDetails] loadContract finished.");
    }
     return null; // Ensure a return path in case of error caught before setting state
  };

  const canEdit = true;

  const handleSave = async () => {
    if (!contract || !contract.id || !getToken || !userId || !userEmail || !organizationId) {
      console.error("[ContractDetails] handleSave called without required contract data or auth info.", { contractId: contract?.id, hasToken: !!getToken, userId, userEmail, organizationId });
      toast({ title: "Error Saving", description: "Missing contract, organization, or authentication information.", variant: "destructive" });
      return;
    }
    
    console.log("[ContractDetails] Attempting to save contract:", contract.id);
    try {
      const authenticatedSupabase = await createAuthenticatedSupabaseClient(getToken);
      console.log("[ContractDetails] Authenticated client created for save.");

      const dbUpdateData = mapContractToDbUpdate(contract);
      console.log("[ContractDetails] Mapped data for update:", dbUpdateData);

      // Remove undefined fields before updating
      const cleanUpdateData = Object.fromEntries(
        Object.entries(dbUpdateData).filter(([_, v]) => v !== undefined)
      ) as ContractUpdate; // Cast back after filtering

      if (Object.keys(cleanUpdateData).length === 0) {
          console.warn("[ContractDetails] No valid fields to update after mapping.");
          toast({ title: "No Changes", description: "No updatable fields detected.", variant: "default"});
          setIsEditing(false); // Still exit editing mode
          return;
      }
       console.log("[ContractDetails] Cleaned data for update:", cleanUpdateData);

      // --- Perform Contract Update ---
      const { error: updateError } = await authenticatedSupabase
        .from('contracts')
        .update(cleanUpdateData) // Use cleaned data
        .eq('id', contract.id)
        .eq('organization_id', organizationId);

      if (updateError) {
        console.error("[ContractDetails] Error updating contract:", updateError);
        throw new Error(`Failed to update contract: ${updateError.message}`);
      }
      console.log("[ContractDetails] Contract updated successfully.");

      // --- Create Audit Trail Entry ---
      // Record only the fields that were actually sent in the update
      const auditChanges = cleanUpdateData;

      const auditEntry: AuditTrailInsert = {
        contract_id: contract.id,
        action_type: 'Update',
        changes: auditChanges as any, // Cast needed for Json type
        performed_by: userId,
        performed_by_email: userEmail,
        // performed_at handled by DB default
      };
      console.log("[ContractDetails] Creating audit trail entry:", auditEntry);

      const { error: auditError } = await authenticatedSupabase
        .from('contract_audit_trail')
        .insert(auditEntry);

      if (auditError) {
        console.error("[ContractDetails] Error creating audit trail entry:", auditError);
        toast({ title: "Warning", description: "Contract saved, but failed to record audit trail entry.", variant: "default" });
      } else {
        console.log("[ContractDetails] Audit trail entry created successfully.");
      }

      // --- Finalize ---
      setIsEditing(false);
      toast({ title: "Success", description: "Contract details saved successfully." });
      // loadContract(); // Re-fetch to ensure UI reflects potential DB triggers/defaults if any

    } catch (error: any) {
      console.error('[ContractDetails] Error during save process:', error);
      toast({ title: "Error Saving Contract", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    }
  };

  const addComment = async () => {
    console.log("[ContractDetails] Attempting to add comment to contracts table.");
    // Use contractId variable for clarity
    if (!contractId || !newComment.trim() || !getToken || !userId || !userEmail || !organizationId || !userName) {
        console.error("[ContractDetails] addComment called without required data.", { contractId, comment: newComment, hasToken: !!getToken, userId, userName, userEmail, orgId: organizationId });
        toast({ title: "Error Adding Comment", description: "Cannot add comment. Missing required details.", variant: "destructive" });
        return;
    }

    const commentToAdd: Comment = {
        id: crypto.randomUUID(),
        userId: userId,
        userName: userName,
        content: newComment.trim(),
        timestamp: formatISO(new Date()),
    };
    console.log("[ContractDetails] New comment object:", commentToAdd);

    try {
        const authenticatedSupabase = await createAuthenticatedSupabaseClient(getToken);
        const currentComments: Comment[] = contract?.comments || [];
        const updatedComments = [...currentComments, commentToAdd];

        console.log("[ContractDetails] Updating 'comments' column in 'contracts' DB table.");
        const { error: updateError } = await authenticatedSupabase
            .from('contracts')
            .update({ comments: updatedComments as any })
            .eq('id', contractId)
            .eq('organization_id', organizationId);

        if (updateError) {
            console.error("[ContractDetails] Error updating comments column:", updateError);
            // Check if the error is specifically about the 'comments' column not existing
            if (updateError.message.includes("column") && updateError.message.includes("comments") && updateError.message.includes("does not exist")) {
                throw new Error(`Failed to save comment: The 'comments' column does not exist on the 'contracts' table. Schema update needed.`);
            }
            throw new Error(`Failed to save comment: ${updateError.message}`);
        }

        console.log("[ContractDetails] Comments updated successfully in DB.");
        setContract(prev => prev ? { ...prev, comments: updatedComments } : null);
        setNewComment("");
        toast({ title: "Comment Added", description: "Your comment has been saved." });

        // --- Complete Audit Trail Entry for Comment ---
        try {
            // Ensure all required fields for AuditTrailInsert are present
            const auditEntry: AuditTrailInsert = {
                contract_id: contractId, // Use variable
                action_type: 'Comment Added', // Specific action type
                // Log relevant info, like the comment text or the whole comment object
                changes: { comment_text: commentToAdd.content } as any, // Cast to 'any' for Supabase JSON type
                performed_by: userId,
                performed_by_email: userEmail,
                // performed_at is handled by DB default
            };
            console.log("[ContractDetails] Creating comment audit trail entry:", auditEntry);

            // Perform the insert operation
            const { error: auditError } = await authenticatedSupabase
                .from('contract_audit_trail')
                .insert(auditEntry); // Pass the constructed entry

            if (auditError) {
                console.error("[ContractDetails] Error creating comment audit trail entry:", auditError);
                toast({ title: "Audit Log Warning", description: "Comment saved, but failed to record audit log entry.", variant: "default" });
            } else {
                console.log("[ContractDetails] Comment audit trail entry created successfully.");
            }
        } catch (auditLogError: any) { // Catch specific error if needed
            console.error("[ContractDetails] Exception during comment audit log creation:", auditLogError);
            // Optionally inform user, but primary action (comment add) succeeded
            toast({ title: "Audit Log Info", description: "Comment saved, but encountered an issue logging the action.", variant: "default" });
        }

    } catch (error: any) {
        console.error('[ContractDetails] Error adding comment:', error);
        toast({ title: "Error Adding Comment", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    }
  };

  const loadCOIFiles = async (currentContractId: string) => {
    console.log(`[ContractDetails] Attempting to load COI files for contract ID: ${currentContractId}`);
    if (!getToken || !currentContractId) {
      console.error("[ContractDetails] loadCOIFiles called without token or contract ID.");
      toast({ title: "Error", description: "Cannot load COI files: Missing authentication or contract ID.", variant: "destructive" });
      return;
    }
    try {
      const authenticatedSupabase = await createAuthenticatedSupabaseClient(getToken);
      const { data, error } = await authenticatedSupabase
        .from('contract_coi_files')
        .select('*')
        .eq('contract_id', currentContractId)
        .order('uploaded_at', { ascending: false }); // Show newest first

      if (error) {
        console.error("[ContractDetails] Error loading COI files:", error);
        throw new Error(`Failed to load COI files: ${error.message}`);
      }

      setCoiFiles(data ? data.map(mapDbToCOIFile) : []);
      console.log(`[ContractDetails] Loaded ${data?.length || 0} COI files.`);

    } catch (error: any) {
      console.error('[ContractDetails] Exception loading COI files:', error);
      toast({ title: "Error Loading COI Files", description: error.message || "An unexpected error occurred.", variant: "destructive" });
      setCoiFiles([]); // Reset on error
    }
  };

  // Handler for successful file upload via COIFileUpload component
  const handleCOIUploadSuccess = async (fileName: string, filePath: string) => {
    console.log(`[ContractDetails] Handling COI upload success. File: ${fileName}, Path: ${filePath}`);
    if (!contract?.id || !getToken || !userId || !userEmail) {
      console.error("[ContractDetails] handleCOIUploadSuccess called without required data.");
      toast({ title: "Error Saving File Info", description: "Missing contract or authentication details.", variant: "destructive" });
      return;
    }

    try {
       const authenticatedSupabase = await createAuthenticatedSupabaseClient(getToken);
       const insertData: COIFileInsert = {
         contract_id: contract.id,
         file_name: fileName,
         file_path: filePath,
         uploaded_by: userId,
         // uploaded_at is handled by DB default
         // expiration_date needs to be handled - how does the component provide this?
         // For now, let's assume it might be optional or needs a default/prompt
       };

       console.log("[ContractDetails] Inserting COI file record:", insertData);
       const { error } = await authenticatedSupabase
         .from('contract_coi_files')
         .insert(insertData);

       if (error) {
         console.error("[ContractDetails] Error inserting COI file record:", error);
         throw new Error(`Failed to save file metadata: ${error.message}`);
       }

       console.log("[ContractDetails] COI file record inserted successfully.");
       toast({ title: "File Uploaded", description: `${fileName} saved successfully.` });
       loadCOIFiles(contract.id); // Refresh the list

    } catch (error: any) {
       console.error('[ContractDetails] Exception saving COI file metadata:', error);
       toast({ title: "Error Saving File Info", description: error.message || "An unexpected error occurred.", variant: "destructive" });
       // Consider if cleanup of the uploaded storage file is needed here
    }
  };

  // Handler for file deletion via COIFileUpload component
  const handleCOIDelete = async (fileId: string, filePath: string) => {
    console.log(`[ContractDetails] Handling COI delete request. File ID: ${fileId}, Path: ${filePath}`);
     if (!contract?.id || !getToken) {
      console.error("[ContractDetails] handleCOIDelete called without required data.");
      toast({ title: "Error Deleting File", description: "Missing contract or authentication details.", variant: "destructive" });
      return;
    }

    // Optional: Add a confirmation dialog here

    try {
      const authenticatedSupabase = await createAuthenticatedSupabaseClient(getToken);

      // 1. Delete the database record
      console.log(`[ContractDetails] Deleting COI file record with ID: ${fileId}`);
      const { error: dbError } = await authenticatedSupabase
        .from('contract_coi_files')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        console.error("[ContractDetails] Error deleting COI file record:", dbError);
        throw new Error(`Failed to delete file record: ${dbError.message}`);
      }
      console.log("[ContractDetails] COI file record deleted successfully.");


      // 2. Delete the file from storage (optional, but recommended)
      if (filePath) {
          console.log(`[ContractDetails] Deleting file from storage at path: ${filePath}`);
          // Assuming filePath is the path within your designated 'coi-files' bucket
          // Adjust bucket name as needed.
          const { error: storageError } = await authenticatedSupabase
              .storage
              .from('coi-files') // Replace with your actual bucket name
              .remove([filePath]);

          if (storageError) {
              console.error("[ContractDetails] Error deleting file from storage:", storageError);
              // Don't throw an error here, the DB record is deleted, but warn the user.
               toast({ title: "Warning", description: "File record deleted, but could not remove file from storage.", variant: "default" });
          } else {
              console.log("[ContractDetails] File deleted from storage successfully.");
          }
      } else {
          console.warn("[ContractDetails] File path not provided, skipping storage deletion.");
      }


      toast({ title: "File Deleted", description: `File record removed.` });
      loadCOIFiles(contract.id); // Refresh the list

    } catch (error: any) {
       console.error('[ContractDetails] Exception deleting COI file:', error);
       toast({ title: "Error Deleting File", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50 pt-16">
          <div className="max-w-4xl mx-auto space-y-8 fade-in p-6">
            <div>Loading contract details...</div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50 pt-16">
          <div className="max-w-4xl mx-auto space-y-8 fade-in p-6">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => navigate('/contracts')}>
              Back to Contracts
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (!contract) {
    return null; // Or a specific "Not Found" component
  }

  const refreshCOIFiles = () => {
    loadCOIFiles(contract.id);
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50 pt-16">
        <div className="max-w-4xl mx-auto space-y-8 fade-in p-6">
          <ContractHeader
            title={contract.title}
            isEditing={isEditing}
            canEdit={canEdit}
            onEditClick={() => setIsEditing(true)}
            onSaveClick={handleSave}
            onTitleChange={(title) => setContract(prev => ({ ...prev!, title }))}
          />

          <Card className="p-6">
            <ContractDetailsGrid
              contract={contract}
              isEditing={isEditing}
              onContractChange={(updates) => setContract(prev => ({ ...prev!, ...updates }))}
            />
          </Card>

          <Card className="p-6">
            <div className="space-y-8">
              <ContractExecutedDocument
                contractId={contract.id}
                onDocumentUploaded={refreshCOIFiles}
              />

              <div>
                <h3 className="text-lg font-medium mb-4">Certificate of Insurance (COI) Files</h3>
                <COIFileUpload
                  contractId={contract.id}
                  files={coiFiles}
                  onFileUploaded={() => loadCOIFiles(contract.id)}
                  onFileDeleted={() => loadCOIFiles(contract.id)}
                />
              </div>

              <ContractAttachments attachments={contract.attachments} />

              <ContractAuditTrail contractId={contractNumber} />

              <ContractComments
                comments={contract.comments}
                newComment={newComment}
                onNewCommentChange={setNewComment}
                onAddComment={addComment}
              />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ContractDetails;
