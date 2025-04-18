import { Database } from "@/lib/supabase/types";

type DbAuditTrail = Database['public']['Tables']['contract_audit_trail']['Row'];
type DbAuditTrailInsert = Database['public']['Tables']['contract_audit_trail']['Insert'];

export interface IAuditTrailService {
  getContractAuditTrail(contractId: string): Promise<{ data: DbAuditTrail[] | null; error: any }>;
  createAuditTrailEntry(auditData: DbAuditTrailInsert): Promise<{ data: DbAuditTrail | null; error: any }>;
} 