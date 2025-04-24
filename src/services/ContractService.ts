import { IContractService } from "@/services/interfaces/IContractService";
import { Contract } from "@/domain/types/Contract";
import { ContractRepository } from "@/lib/repositories/ContractRepository";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/client"; // Use authenticated client creator
import { Database, Tables } from "@/lib/supabase/types"; // Use generated types
import { SupabaseClient, User } from '@supabase/supabase-js'; // Import User type

type DbContract = Tables<"contracts">;
type DbContractInsert = Database['public']['Tables']['contracts']['Insert'];
type DbContractUpdate = Database['public']['Tables']['contracts']['Update'];
type DbCoiFile = Tables<"contract_coi_files">;
type DbCoiFileInsert = Database['public']['Tables']['contract_coi_files']['Insert'];
type DbAuditTrailInsert = Database['public']['Tables']['contract_audit_trail']['Insert'];

type GetTokenFn = (options?: { template?: string }) => Promise<string | null>; // Type for getToken

// Add these mapping functions (or import if defined elsewhere)
type DbContractStatus = DbContractInsert['status'];
type DbContractType = DbContractInsert['type'];

const mapFrontendStatusToDb = (frontendStatus: Contract['status']): DbContractStatus | undefined => {
  switch (frontendStatus) {
    case 'Requested': return 'new';
    case 'Draft': return 'draft';
    case 'Review': return 'in_coord';
    case 'InSignature': return 'in_signature';
    case 'ExecutedActive': return 'active'; // Or 'executed' based on DB enum
    case 'ExecutedExpired': return 'expired';
    default: console.warn(`Unmapped frontend status: ${frontendStatus}`); return undefined;
  }
};

const mapFrontendTypeToDb = (frontendType: Contract['type']): DbContractType | undefined => {
  switch (frontendType) {
    case 'grant': return 'other';
    case 'services': return 'service';
    case 'goods': return 'product';
    case 'sponsorship': return 'sponsorship';
    case 'amendment': return 'other';
    case 'vendor_agreement': return 'vendor';
    case 'interagency_agreement': return 'iaa';
    case 'mou': return 'mou';
    case 'sole_source': return 'other';
    case 'rfp': return 'other';
    default:
      console.warn(`Unmapped frontend type: ${frontendType}. Falling back to 'other'.`); 
      return 'other';
  }
};

// Helper function to map database fields to Contract type
const mapDbToContract = (data: DbContract): Contract => {
  const isValidStatus = (status: string | null): status is Contract['status'] => {
      const validStatuses: Contract['status'][] = ["Requested", "Draft", "Review", "InSignature", "ExecutedActive", "ExecutedExpired"];
      return !!status && validStatuses.includes(status as Contract['status']);
  };
  const isValidType = (type: string | null): type is Contract['type'] => {
      const validTypes: Contract['type'][] = ["grant", "services", "goods", "sponsorship", "amendment", "vendor_agreement", "interagency_agreement", "mou", "sole_source", "rfp"];
      return !!type && validTypes.includes(type as Contract['type']);
  };

  return {
    id: data.id,
    contractNumber: data.contract_number ?? '',
    title: data.title,
    description: data.description ?? undefined,
    vendor: data.vendor,
    amount: data.amount ?? 0,
    startDate: data.start_date ?? '',
    endDate: data.end_date ?? '',
    status: isValidStatus(data.status) ? data.status : "Draft", // Use validated status
    type: isValidType(data.type) ? data.type : "services", // Use validated type
    department: data.department,
    accountingCodes: data.accounting_codes ?? undefined,
    vendorEmail: data.vendor_email ?? undefined,
    vendorPhone: data.vendor_phone ?? undefined,
    vendorAddress: data.vendor_address ?? undefined,
    signatoryName: data.signatory_name ?? undefined,
    signatoryEmail: data.signatory_email ?? undefined,
    attachments: [],
    comments: [],
    creatorId: data.creator_id ?? undefined,
    creatorEmail: data.creator_email ?? '',
    createdAt: data.created_at ?? new Date().toISOString(),
  };
};

// Helper function to map Contract type to database fields
const mapContractToDb = (contract: Contract): Omit<DbContractInsert, 'organization_id'> | DbContractUpdate => { // Adjust return type slightly for clarity on insert
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return null;
    try { return new Date(dateString).toISOString(); } catch (e) { console.error('Error formatting date:', dateString, e); return null; }
  };
  const amount = typeof contract.amount === 'string' ? parseFloat(contract.amount) : contract.amount;
  const mappedStatus = mapFrontendStatusToDb(contract.status);
  const mappedType = mapFrontendTypeToDb(contract.type);
  
  const dbData = {
    contract_number: contract.contractNumber,
    title: contract.title,
    description: contract.description,
    vendor: contract.vendor,
    amount: amount,
    start_date: formatDate(contract.startDate),
    end_date: formatDate(contract.endDate),
    status: mappedStatus, // Use mapped status
    type: mappedType,     // Use mapped type
    department: contract.department,
    accounting_codes: contract.accountingCodes,
    vendor_email: contract.vendorEmail,
    vendor_phone: contract.vendorPhone,
    vendor_address: contract.vendorAddress,
    signatory_name: contract.signatoryName,
    signatory_email: contract.signatoryEmail,
    creator_id: contract.creatorId,
    creator_email: contract.creatorEmail,
  };
  Object.keys(dbData).forEach(key => {
    const k = key as keyof typeof dbData;
    if (dbData[k] === undefined) delete dbData[k];
  });
  
  if (contract.id) { 
    // ID exists, it's an update. Types should now match DbContractUpdate better.
    return { id: contract.id, ...dbData } as DbContractUpdate; 
  }
  // ID doesn't exist, it's an insert payload (missing organization_id).
  // The calling function needs to add organization_id before inserting.
  return dbData as Omit<DbContractInsert, 'organization_id'>; 
};

export class ContractService implements IContractService {
  private getToken: GetTokenFn;
  private organizationId: string | null = null; // Store orgId if available

  // Updated constructor to accept getToken and organizationId
  constructor(getToken: GetTokenFn, organizationId?: string | null) {
    if (!getToken) {
      throw new Error("ContractService requires a getToken function.");
    }
    this.getToken = getToken;
    this.organizationId = organizationId ?? null;
    console.log(`ContractService initialized. Org ID: ${this.organizationId}`);
  }

  async getAllContracts(): Promise<{ data: Contract[] | null; error: any }> {
    // TODO: Refactor to use createAuthenticatedSupabaseClient if needed
    console.warn("ContractService.getAllContracts potentially uses old auth pattern.");
    // ... existing implementation ...
    return { data: null, error: { message: "Not implemented with new auth" } };
  }

  async getContractByNumber(contractNumber: string): Promise<{ data: Contract | null; error: any }> {
     // TODO: Refactor to use createAuthenticatedSupabaseClient if needed
    console.warn("ContractService.getContractByNumber potentially uses old auth pattern.");
     // ... existing implementation ...
     return { data: null, error: { message: "Not implemented with new auth" } };
  }

   async getContractById(id: string): Promise<{ data: Contract | null; error: any }> {
     // TODO: Refactor to use createAuthenticatedSupabaseClient if needed
    console.warn("ContractService.getContractById potentially uses old auth pattern.");
     // ... existing implementation ...
     return { data: null, error: { message: "Not implemented with new auth" } };
  }

  async saveContract(contract: Contract): Promise<{ data: Contract | null; error: any }> {
    // TODO: Refactor to use createAuthenticatedSupabaseClient if needed
    console.warn("ContractService.saveContract potentially uses old auth pattern.");
     // ... existing implementation ...
     return { data: null, error: { message: "Not implemented with new auth" } };
  }

  async getContractCOIFiles(contractId: string): Promise<{ data: DbCoiFile[] | null; error: any }> {
    try {
      const supabase = await createAuthenticatedSupabaseClient(this.getToken);
      const { data, error } = await supabase
        .from('contract_coi_files')
        .select('*')
        .eq('contract_id', contractId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error("Error fetching COI files:", error);
        throw error;
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async uploadExecutedDocument(contractId: string, file: File, userId: string, userEmail: string): Promise<{ data: DbCoiFile | null; error: any }> {
    let supabase: SupabaseClient<Database>;
    let deletedExisting = false; // Flag to track if we deleted an old doc
    let oldFilePath: string | null = null;

    try {
        supabase = await createAuthenticatedSupabaseClient(this.getToken);
        console.log(`[ContractService] Authenticated client created for upload. User ID: ${userId}`);
    } catch (error) {
        console.error("Failed to create authenticated Supabase client:", error);
        return { data: null, error: new Error("Authentication failed") };
    }

    if (!this.organizationId) {
        console.error("[ContractService] Organization ID is missing. Cannot proceed with upload.");
        return { data: null, error: new Error("Organization context is missing") };
    }

    try {
        // --- START: Check for and delete existing executed document --- 
        const { data: existingFiles, error: existingError } = await supabase
            .from('contract_coi_files')
            .select('id, file_path')
            .eq('contract_id', contractId)
            .eq('is_executed_contract', true)
            .limit(1);
        
        if (existingError) {
            console.warn("[ContractService] Failed to check for existing executed document:", existingError);
            // Decide if this is critical - maybe proceed with upload anyway?
        } else if (existingFiles && existingFiles.length > 0) {
            const existingFile = existingFiles[0];
            oldFilePath = existingFile.file_path;
            console.log(`[ContractService] Found existing executed document (ID: ${existingFile.id}, Path: ${oldFilePath}). Deleting before upload.`);
            
            // Delete DB record first
            const { error: deleteDbError } = await supabase
                .from('contract_coi_files')
                .delete()
                .eq('id', existingFile.id);
            
            if (deleteDbError) {
                console.error("[ContractService] Failed to delete existing executed document DB record:", deleteDbError);
                // Don't throw, maybe log and proceed? Or return error?
                // Returning error for safety for now:
                return { data: null, error: new Error("Failed to replace existing document record.") };
            }

            // Delete from storage (best effort, don't block upload if this fails)
            const { error: deleteStorageError } = await supabase.storage
                .from('executed-documents')
                .remove([oldFilePath]);
            
            if (deleteStorageError) {
                console.warn(`[ContractService] Failed to delete existing executed document from storage (Path: ${oldFilePath}):`, deleteStorageError);
                // Log this but continue with the upload
            } else {
                 console.log(`[ContractService] Successfully deleted existing executed document from storage (Path: ${oldFilePath})`);
            }
            deletedExisting = true;
        }
        // --- END: Check for and delete existing executed document ---

        // Proceed with upload
        const fileExtension = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExtension}`;
        const filePath = `${contractId}/${fileName}`;
        console.log(`[ContractService] Uploading executed doc. Contract: ${contractId}, Path: ${filePath}`);

        // 1. Upload to Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('executed-documents')
            .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) {
            console.error('[ContractService] Supabase storage upload error:', uploadError);
            throw uploadError; // Throw if storage upload fails
        }
        console.log('[ContractService] Storage Upload successful:', uploadData);

        // 2. Insert metadata into contract_coi_files table
        const insertPayload: DbCoiFileInsert = {
            contract_id: contractId,
            file_name: file.name,
            file_path: filePath,
            is_executed_contract: true,
            uploaded_by: userId,
            organization_id: this.organizationId,
        };

        const { data: insertedData, error: dbError } = await supabase
            .from('contract_coi_files')
            .insert(insertPayload)
            .select()
            .single();

        if (dbError) {
            console.error('[ContractService] Database insert error:', dbError);
            // If insert fails after successful upload, attempt to remove the orphaned storage object?
            // For now, just throw the DB error.
            throw dbError;
        }
        console.log('[ContractService] Database insert successful:', insertedData);

        // 3. Insert into audit trail
        try {
            const actionType = deletedExisting ? 'executed_document_replaced' : 'executed_document_uploaded';
            const auditChanges: Record<string, any> = { new_file_name: file.name, new_path: filePath };
            if (oldFilePath) {
                auditChanges.old_path = oldFilePath;
            }

            const auditTrailPayload: DbAuditTrailInsert = {
                contract_id: contractId,
                action_type: actionType,
                changes: auditChanges,
                performed_by_email: userEmail,
                performed_by: userId,
                organization_id: this.organizationId,
            };

            const { error: auditError } = await supabase
                .from('contract_audit_trail')
                .insert(auditTrailPayload);
            if (auditError) {
                console.warn('[ContractService] Failed to insert audit trail:', auditError);
            } else {
                console.log(`[ContractService] Audit trail insert successful (${actionType}).`);
            }
        } catch (auditErr) {
            console.warn('[ContractService] Exception during audit trail insert:', auditErr);
        }

        return { data: insertedData, error: null };

    } catch (error: any) {
      console.error('[ContractService] Exception during upload process:', error);
      // Attempt cleanup if storage upload succeeded but DB insert failed?
      const message = error.message || 'An unexpected error occurred during the upload process.';
      const statusCode = error.statusCode || (error.code ? 'DB_' + error.code : '500');
      const errorName = error.error || error.name || 'UploadError';
      return { data: null, error: { message, statusCode, error: errorName } };
    }
  }

  async uploadGeneralAttachment(contractId: string, file: File, userId: string, userEmail: string): Promise<{ data: DbCoiFile | null; error: any }> {
    let supabase: SupabaseClient<Database>;

    try {
        supabase = await createAuthenticatedSupabaseClient(this.getToken);
        console.log(`[ContractService] Authenticated client created for general attachment upload. User ID: ${userId}`);
    } catch (error) {
        console.error("Failed to create authenticated Supabase client:", error);
        return { data: null, error: new Error("Authentication failed") };
    }

    if (!this.organizationId) {
        console.error("[ContractService] Organization ID is missing. Cannot proceed with general attachment upload.");
        return { data: null, error: new Error("Organization context is missing") };
    }

    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExtension}`;
      // Define storage path within the general-attachments bucket
      const filePath = `${contractId}/${fileName}`; 
      console.log(`[ContractService] Uploading general attachment. Contract: ${contractId}, Path: ${filePath}`);

      // 1. Upload to Storage (use 'general-attachments' bucket)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('general-attachments') // <<< Changed bucket
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        console.error('[ContractService] Supabase storage upload error (general attachment):', uploadError);
        const message = uploadError.message || 'Failed to upload file to storage.';
        const statusCode = (uploadError as any).statusCode || '500';
        return { data: null, error: { message, statusCode, error: uploadError.name || 'StorageUploadError' } };
      }
      console.log('[ContractService] General attachment Storage Upload successful:', uploadData);

      // 2. Insert metadata into contract_coi_files table
      const insertPayload: DbCoiFileInsert = {
          contract_id: contractId,
          file_name: file.name, 
          file_path: filePath, 
          is_executed_contract: false, // <<< Explicitly false
          uploaded_by: userId,
          organization_id: this.organizationId, 
      };

      const { data: insertedData, error: dbError } = await supabase
        .from('contract_coi_files')
        .insert(insertPayload)
        .select()
        .single();

      if (dbError) {
        console.error('[ContractService] Database insert error (general attachment):', dbError);
        throw dbError;
      }
      console.log('[ContractService] Database insert successful (general attachment):', insertedData);

      // 3. Insert into audit trail
      try {
           const auditTrailPayload: DbAuditTrailInsert = {
            contract_id: contractId,
            action_type: 'attachment_uploaded', // <<< Changed action type
            changes: { file_name: file.name, path: filePath },
            performed_by_email: userEmail,
            performed_by: userId,
            organization_id: this.organizationId,
          };

          const { error: auditError } = await supabase
            .from('contract_audit_trail')
            .insert(auditTrailPayload);
           if (auditError) {
               console.warn('[ContractService] Failed to insert attachment upload audit trail:', auditError);
           } else {
               console.log('[ContractService] Attachment upload audit trail insert successful.');
           }
      } catch (auditErr) {
           console.warn('[ContractService] Exception during attachment upload audit trail insert:', auditErr);
      }

      return { data: insertedData, error: null };

    } catch (error: any) {
      console.error('[ContractService] Exception during general attachment upload process:', error);
      const message = error.message || 'An unexpected error occurred during the upload process.';
      const statusCode = error.statusCode || (error.code ? 'DB_' + error.code : '500');
      const errorName = error.error || error.name || 'UploadError';
      return { data: null, error: { message, statusCode, error: errorName } };
    }
  }

  async downloadFile(filePath: string, bucket: string = 'executed-documents'): Promise<{ data: Blob | null; error: any }> {
    // Added bucket parameter with default
    try {
      const supabase = await createAuthenticatedSupabaseClient(this.getToken);
      console.log(`[ContractService] Downloading file from bucket: ${bucket}, path: ${filePath}`); // Added log
      const { data, error } = await supabase.storage
        .from(bucket) // Use dynamic bucket
        .download(filePath);

      if (error) {
        console.error("Error downloading file:", error);
        throw error;
      }
      return { data, error: null };
    } catch (error) {
      console.error("Exception downloading file:", error);
      return { data: null, error };
    }
  }

  // --- NEW createContract METHOD --- 
  async createContract(contractData: Omit<DbContractInsert, 'id' | 'created_at' | 'contract_number' | 'status' | 'organization_id' | 'creator_id' | 'creator_email' | 'comments'>, userId: string, userEmail: string): Promise<{ data: DbContract | null; error: any }> {
      let supabase: SupabaseClient<Database>;
      try {
        supabase = await createAuthenticatedSupabaseClient(this.getToken);
      } catch (error) {
        console.error("Failed to create authenticated Supabase client for createContract:", error);
        return { data: null, error: new Error("Authentication failed") };
      }

      if (!this.organizationId) {
          console.error("[ContractService] Organization ID is missing. Cannot create contract.");
          return { data: null, error: new Error("Organization context is missing") };
      }

      try {
          // 1. Generate Contract Number (example logic, adjust if needed)
          const deptPrefix = (contractData.department || 'GEN').substring(0, 3).toUpperCase();
          const year = new Date().getFullYear();
          // Consider a more robust sequence generation if needed (e.g., DB sequence)
          const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          const contractNumber = `${deptPrefix}-${year}-${randomSuffix}`;

          // 2. Prepare full insert payload
          const insertPayload: DbContractInsert = {
              ...contractData,
              contract_number: contractNumber,
              status: 'new', // Set initial status
              organization_id: this.organizationId,
              creator_id: userId,
              creator_email: userEmail,
              comments: [], // Initialize comments as empty array
              // created_at is handled by the database default
          };
          
          console.log("[ContractService] Inserting new contract:", insertPayload);

          // 3. Insert into DB
          const { data: insertedData, error: dbError } = await supabase
              .from('contracts')
              .insert(insertPayload)
              .select()
              .single();

          if (dbError) {
              console.error('[ContractService] Database insert error (createContract):', dbError);
              throw dbError; // Propagate error
          }
          
          console.log('[ContractService] Contract created successfully:', insertedData);
          const newContractId = insertedData.id;

          // 4. Add Audit Trail Entry
          try {
              const auditPayload: DbAuditTrailInsert = {
                  contract_id: newContractId,
                  action_type: 'contract_created',
                  changes: { initial_data: contractData }, // Log initial data
                  performed_by: userId,
                  performed_by_email: userEmail,
                  organization_id: this.organizationId
              };
              const { error: auditError } = await supabase
                  .from('contract_audit_trail')
                  .insert(auditPayload);
              if (auditError) {
                  console.warn('[ContractService] Failed to insert creation audit trail:', auditError);
                  // Non-critical, don't block return
              }
          } catch (auditException) {
              console.error('[ContractService] Exception inserting creation audit trail:', auditException);
          }

          // Return the newly created contract data
          return { data: insertedData as DbContract, error: null }; 

      } catch (error: any) {
          console.error('[ContractService] Exception during createContract process:', error);
          const message = error.message || 'An unexpected error occurred while creating the contract.';
          return { data: null, error: { message, error: error.name || 'CreateError' } };
      }
  }
  // --- END createContract METHOD ---
} 