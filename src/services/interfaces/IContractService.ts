import { Contract } from "@/domain/types/Contract";
import { Database, Tables } from "@/lib/supabase/types";

type DbContract = Tables<"contracts">;
type DbContractUpdate = Database['public']['Tables']['contracts']['Update'];
type DbAuditTrailInsert = Database['public']['Tables']['contract_audit_trail']['Insert'];
// Assuming 'contract_coi_files' will be renamed to 'contract_documents' later
type DbFileRecord = Database['public']['Tables']['contract_coi_files']['Row'];

export interface IContractService {
  getAllContracts(): Promise<{ data: Contract[] | null; error: any }>;
  getContractByNumber(contractNumber: string): Promise<{ data: Contract | null; error: any }>;
  getContractById(id: string): Promise<{ data: Contract | null; error: any }>;
  getContract(id: string): Promise<{ data: Contract | null; error: any }>; // Alias for getContractById?
  saveContract(contract: Contract): Promise<{ data: Contract | null; error: any }>;
  updateContract(id: string, updateData: DbContractUpdate): Promise<{ data: DbContract | null; error: any }>;
  createContract(contractData: any, userId: string, userEmail: string): Promise<{ data: DbContract | null; error: any }>; // Input type needs review
  getContractAuditTrail(contractId: string): Promise<{ data: any[] | null; error: any }>;
  addAuditTrailEntry(auditEntry: Omit<DbAuditTrailInsert, 'organization_id' | 'performed_by' | 'performed_by_email'>): Promise<{ error: any }>;
  addComment(contractId: string, commentText: string): Promise<{ error: any }>;
  // File related methods (Consider if these belong here or should be solely in IFileService)
  getAllContractFiles(contractId: string): Promise<{ data: DbFileRecord[] | null; error: any }>;
  deleteContractFile(filePath: string, contractId: string, organizationId: string): Promise<{ data: boolean | null; error: any }>;
  // Methods previously in deprecated dataService, potentially needed if ContractService orchestrates
  // uploadExecutedDocument(contractId: string, file: File, userId: string, userEmail: string): Promise<{ data: DbFileRecord | null; error: any }>;
  // uploadGeneralAttachment(contractId: string, file: File, userId: string, userEmail: string): Promise<{ data: DbFileRecord | null; error: any }>;
  // downloadFile(filePath: string, bucket?: string): Promise<{ data: Blob | null; error: any }>;
} 