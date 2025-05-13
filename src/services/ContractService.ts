import { IContractService } from "@/services/interfaces/IContractService";
import { Contract } from "@/domain/types/Contract";
import { ContractRepository } from "@/lib/repositories/ContractRepository";
import { FileRepository } from "@/lib/repositories/FileRepository";
import { FileService } from "./FileService";
import { IFileService } from "./interfaces/IFileService";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/client"; // Use authenticated client creator
import { Database, Tables } from "@/lib/supabase/types"; // Use generated types
import { SupabaseClient, User } from '@supabase/supabase-js'; // Import User type

type DbContract = Tables<"contracts">;
type DbContractInsert = Database['public']['Tables']['contracts']['Insert'];
type DbContractUpdate = Database['public']['Tables']['contracts']['Update'];
type DbCoiFile = Tables<"contract_coi_files">;
type DbCoiFileInsert = Database['public']['Tables']['contract_coi_files']['Insert'];
type DbAuditTrailInsert = Database['public']['Tables']['contract_audit_trail']['Insert'];
type DbFileRecord = Database['public']['Tables']['contract_coi_files']['Row'];

type GetTokenFn = (options?: { template?: string; skipCache?: boolean; }) => Promise<string | null>;

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

  const status = isValidStatus(data.status) ? data.status : "Draft";
  const type = isValidType(data.type) ? data.type : "services";
  
  console.log(`[Service Map] Input data.contract_number: '${data.contract_number}', Output contractNumber: '${data.contract_number ?? ''}' for ID: ${data.id}`);

  return {
    id: data.id,
    contractNumber: data.contract_number ?? '',
    title: data.title,
    description: data.description ?? undefined,
    vendor: data.vendor,
    amount: data.amount ?? 0,
    startDate: data.start_date ?? '',
    endDate: data.end_date ?? '',
    status: status, // Use mapped/validated status
    type: type,     // Use mapped/validated type
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
  private organizationId: string | null = null;
  private userId: string | null = null;
  private userEmail: string | null = null;
  private fileService: IFileService;

  constructor(
      getToken: GetTokenFn, 
      organizationId: string | null, 
      userId: string | null, 
      userEmail: string | null, 
      fileService: IFileService
    ) {
    if (!getToken) {
      throw new Error("ContractService requires a getToken function.");
    }
    if (!fileService) {
      throw new Error("ContractService requires a FileService instance.");
    }
    if (!organizationId) {
       console.warn("ContractService initialized without an Organization ID.");
    }
     if (!userId || !userEmail) {
       console.warn("ContractService initialized without full user details (ID or Email missing).");
    }
    this.getToken = getToken;
    this.organizationId = organizationId ?? null;
    this.userId = userId ?? null;
    this.userEmail = userEmail ?? null;
    this.fileService = fileService;
    console.log(`ContractService initialized. Org ID: ${this.organizationId}, User ID: ${this.userId}`);
  }

  async getAllContracts(): Promise<{ data: Contract[] | null; error: any }> {
    if (!this.organizationId) return { data: null, error: { message: "Organization ID missing" } };
    try {
      const supabase = await createAuthenticatedSupabaseClient(this.getToken);
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('organization_id', this.organizationId);

      if (error) throw error;
      console.log("[ContractService] Raw data from DB:", data); // Log raw data

      const mappedData = data ? data.map(mapDbToContract) : [];
      
      console.log("[ContractService] Mapped data being returned:", mappedData); // Log mapped data
      
      return { data: mappedData, error: null };
    } catch (error) {
      console.error("Error fetching all contracts:", error);
      return { data: null, error };
    }
  }

  async getContractByNumber(contractNumber: string): Promise<{ data: Contract | null; error: any }> {
     if (!this.organizationId) return { data: null, error: { message: "Organization ID missing" } };
     try {
       const supabase = await createAuthenticatedSupabaseClient(this.getToken);
       const { data, error } = await supabase
         .from('contracts')
         .select('*')
         .eq('contract_number', contractNumber)
         .eq('organization_id', this.organizationId)
         .maybeSingle();

       if (error) throw error;
       return { data: data ? mapDbToContract(data) : null, error: null };
     } catch (error) {
       console.error("Error fetching contract by number:", error);
       return { data: null, error };
     }
  }

   async getContractById(id: string): Promise<{ data: Contract | null; error: any }> {
     if (!this.organizationId) return { data: null, error: { message: "Organization ID missing" } };
     try {
       const supabase = await createAuthenticatedSupabaseClient(this.getToken);
       const { data, error } = await supabase
         .from('contracts')
         .select('*')
         .eq('id', id)
         .eq('organization_id', this.organizationId)
         .single();

       if (error) throw error;
       return { data: mapDbToContract(data), error: null };
     } catch (error) {
       console.error("Error fetching contract by ID:", error);
       return { data: null, error };
     }
  }

  async saveContract(contract: Contract): Promise<{ data: Contract | null; error: any }> {
      if (!this.organizationId) return { data: null, error: { message: "Organization ID missing" } };
      if (!this.userId || !this.userEmail) return { data: null, error: { message: "User details missing" } };

      const dbPayloadBase = mapContractToDb(contract);

      try {
          let savedData: DbContract | null = null;
          let error: any = null;

          if (contract.id) {
              const updatePayload: DbContractUpdate = {
                ...dbPayloadBase,
                id: contract.id,
              };
              console.log("[ContractService] Updating contract:", updatePayload);
              const supabase = await createAuthenticatedSupabaseClient(this.getToken);
              const { data: updateData, error: updateError } = await supabase
                  .from('contracts')
                  .update(updatePayload)
                  .eq('id', contract.id)
                  .select()
                  .single();
              savedData = updateData;
              error = updateError;

              if (!error && savedData) {
                 await this.addAuditTrailEntry({
                     contract_id: savedData.id,
                     action_type: 'contract_updated',
                     changes: { updated_fields: Object.keys(updatePayload) },
                 });
              }

          } else {
              const deptPrefix = (contract.department || 'GEN').substring(0, 3).toUpperCase();
              const year = new Date().getFullYear();
              const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
              const contractNumber = `${deptPrefix}-${year}-${randomSuffix}`;

              const insertPayload: DbContractInsert = {
                  ...(dbPayloadBase as Omit<DbContractInsert, 'organization_id'>),
                  contract_number: contractNumber,
                  status: mapFrontendStatusToDb(contract.status) || 'new',
                  type: mapFrontendTypeToDb(contract.type) || 'other',
                  organization_id: this.organizationId,
                  creator_id: this.userId,
                  creator_email: this.userEmail,
                  comments: [],
              };

              Object.keys(insertPayload).forEach(key => {
                  const k = key as keyof DbContractInsert;
                  if (insertPayload[k] === undefined) delete insertPayload[k];
              });

              console.log("[ContractService] Creating new contract:", insertPayload);
              const supabase = await createAuthenticatedSupabaseClient(this.getToken);
              const { data: insertData, error: insertError } = await supabase
                  .from('contracts')
                  .insert(insertPayload)
                  .select()
                  .single();
              savedData = insertData;
              error = insertError;

              if (!error && savedData) {
                  await this.addAuditTrailEntry({
                      contract_id: savedData.id,
                      action_type: 'contract_created',
                      changes: { initial_data: insertPayload },
                  });
              }
          }

          if (error) {
              console.error('[ContractService] Database save error:', error);
              throw error;
          }

          console.log('[ContractService] Contract saved successfully:', savedData);
          return { data: savedData ? mapDbToContract(savedData) : null, error: null };

      } catch (error: any) {
          console.error('[ContractService] Exception during saveContract process:', error);
          const message = error.message || 'An unexpected error occurred while saving the contract.';
          return { data: null, error: { message, error: error.name || 'SaveError' } };
      }
  }

  async getAllContractFiles(contractId: string): Promise<{ data: DbFileRecord[] | null; error: any }> {
    if (!this.organizationId) return { data: null, error: { message: "Organization ID missing" } };
     try {
       const supabase = await createAuthenticatedSupabaseClient(this.getToken);
       return await FileRepository.getFilesByContractId(supabase, contractId);
     } catch (error) {
       console.error(`Error getting files for contract ${contractId}:`, error);
       return { data: null, error };
     }
  }

  async deleteContractFile(filePath: string, contractId: string, organizationId: string): Promise<{ data: boolean | null; error: any }> {
     if (!this.organizationId || this.organizationId !== organizationId) {
         console.error(`[ContractService] deleteContractFile Org ID mismatch/missing. Service: ${this.organizationId}, Request: ${organizationId}`);
         return { data: false, error: { message: "Organization ID mismatch or missing" } };
     }
     return this.fileService.deleteFile(filePath, contractId, organizationId);
  }

  async getContractAuditTrail(contractId: string): Promise<{ data: any[] | null; error: any }> {
    try {
      console.log(`[Service - getAuditTrail] Using OrgID from instance: ${this.organizationId}`);
      console.log(`[Service - getAuditTrail] Final check - Querying with contractId: '${contractId}', Type: ${typeof contractId}`);

      console.log(`[ContractService] Fetching audit trail for contract ID: ${contractId} using instance client.`);
      const supabase = await createAuthenticatedSupabaseClient(this.getToken);
      const { data, error } = await supabase
        .from('contract_audit_trail')
        .select('id, action_type, changes, performed_by_email, performed_at, organization_id')
        .eq('contract_id', contractId)
        .eq('organization_id', this.organizationId)
        .order('performed_at', { ascending: false });

      console.log('[ContractService] Audit trail fetch result (using instance client, explicit contract_id AND organization_id filter):', { data, error }); 

      if (error) {
        console.error("Error fetching audit trail:", error);
        throw error;
      }
      return { data, error: null };
    } catch (error) {
      console.error("[ContractService] Exception in getContractAuditTrail:", error);
      return { data: null, error };
    }
  }

  async getContract(id: string): Promise<{ data: Contract | null; error: any }> {
      return this.getContractById(id);
  }

  async updateContract(id: string, updateData: DbContractUpdate): Promise<{ data: DbContract | null; error: any }> {
     console.log(`[ContractService] updateContract called for ID: ${id}`);
     if (!this.organizationId) {
       return { data: null, error: { message: "Organization ID missing in service" } };
     }
     if (!this.userId || !this.userEmail) {
        console.error(`[ContractService] User details missing during updateContract.`);
        return { data: null, error: new Error("User details missing.") };
     }

     try {
       const supabase = await createAuthenticatedSupabaseClient(this.getToken);
       const { data: originalData, error: fetchError } = await supabase
         .from('contracts')
         .select('*')
         .eq('id', id)
         .single();

       if (fetchError) {
         console.error("[ContractService] Error fetching original contract for update audit:", fetchError);
       }

       const payload = { ...updateData };
       delete payload.id;

       const { data, error } = await supabase
         .from('contracts')
         .update(payload)
         .eq('id', id)
         .select()
         .single();

       if (error) throw error;

       if (data) {
         const changes: Record<string, any> = {};
         if (originalData) {
            for (const key in payload) {
                 if (Object.prototype.hasOwnProperty.call(payload, key)) {
                     const typedKey = key as keyof DbContractUpdate;
                     if (payload[typedKey] !== originalData[typedKey]) {
                         changes[typedKey] = { old: originalData[typedKey], new: payload[typedKey] };
                     }
                 }
             }
         } else {
             changes['updated_fields'] = Object.keys(payload);
         }

         await this.addAuditTrailEntry({
             contract_id: id,
             action_type: 'contract_updated',
             changes: changes,
         });
       }

       return { data: data as DbContract, error: null };
     } catch (error: any) {
       console.error("[ContractService] Error updating contract:", error);
       return { data: null, error };
     }
  }

  async addAuditTrailEntry(auditEntry: Omit<DbAuditTrailInsert, 'organization_id' | 'performed_by' | 'performed_by_email'>): Promise<{ error: any }> {
    console.log("[ContractService] addAuditTrailEntry called");
    if (!this.organizationId || !this.userId || !this.userEmail) {
      console.error("[ContractService] Cannot add audit trail entry: Context missing (Org/User)");
      return { error: { message: "Organization or User context missing in service" } };
    }

    const payload: DbAuditTrailInsert = {
      ...auditEntry,
      organization_id: this.organizationId,
      performed_by: this.userId,
      performed_by_email: this.userEmail,
    };

    try {
      const supabase = await createAuthenticatedSupabaseClient(this.getToken);
      const { error } = await supabase
        .from('contract_audit_trail')
        .insert(payload);
      if (error) throw error;
       console.log("[ContractService] Audit trail entry added successfully:", payload.action_type);
      return { error: null };
    } catch (error: any) {
      console.error("[ContractService] Error inserting audit trail entry:", error);
      return { error };
    }
  }

  async addComment(contractId: string, commentText: string): Promise<{ error: any }> {
      console.log(`[ContractService] addComment called for Contract ID: ${contractId}`);
      if (!this.organizationId || !this.userId || !this.userEmail) {
          console.error(`[ContractService] User details missing during addComment.`);
          return { error: new Error("User details missing.") };
      }

      try {
          const auditPayloadBase: Omit<DbAuditTrailInsert, 'organization_id' | 'performed_by' | 'performed_by_email'> = {
              contract_id: contractId,
              action_type: 'comment_added',
              changes: { comment: commentText },
          };
          return await this.addAuditTrailEntry(auditPayloadBase);
      } catch (error: any) {
          console.error("[ContractService] Error processing addComment:", error);
          return { error };
      }
  }

  async createContract(contractData: any, userId: string, userEmail: string): Promise<{ data: DbContract | null; error: any }> {
    console.warn("[ContractService] createContract is a placeholder. Received:", { contractData, userId, userEmail });
    const supabase = await createAuthenticatedSupabaseClient(this.getToken);
    if (!this.organizationId) {
        return { data: null, error: new Error("Organization ID is not set in ContractService context.") };
    }
    if (!this.userId || !this.userEmail) {
        return { data: null, error: new Error("User ID or Email is not set in ContractService context.") };
    }

    // Basic placeholder payload - In a real scenario, map contractData to DbContractInsert carefully
    const insertPayload: DbContractInsert = {
      // Mandatory fields from DbContractInsert (based on typical Supabase table)
      contract_number: contractData.contract_number || `CN-${Date.now()}`,
      title: contractData.title || 'Untitled Contract',
      status: 'draft', // Default status
      type: 'other', // Default type
      organization_id: this.organizationId,
      creator_id: this.userId, 
      creator_email: this.userEmail,
      amount: contractData.amount || 0, // Ensure amount is a number
      department: contractData.department || 'N/A',
      vendor: contractData.vendor || 'N/A',
      start_date: contractData.startDate || new Date().toISOString(),
      end_date: contractData.endDate || new Date().toISOString(),
      // Optional fields - add if provided in contractData
      description: contractData.description || null,
      // ... add other fields from DbContractInsert as needed/available
    };

    const { data, error } = await supabase
        .from('contracts')
        .insert(insertPayload)
        .select()
        .single();

    if (error) {
        console.error("Error creating contract (placeholder):", error);
        return { data: null, error };
    }
    // Optionally add audit trail entry for contract creation
    if (data) {
        this.addAuditTrailEntry({
            contract_id: data.id,
            action_type: 'contract_created',
            changes: { initial_data: insertPayload }
        }).catch(auditError => console.error("Failed to add audit trail for contract creation:", auditError));
    }
    return { data: data as DbContract, error: null };
  }
} 