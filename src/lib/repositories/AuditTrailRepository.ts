// Repository for handling contract_audit_trail table interactions 
import { supabase } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/types";

// Define types used within the repository
type DbAuditTrail = Database['public']['Tables']['contract_audit_trail']['Row'];
type DbAuditTrailInsert = Database['public']['Tables']['contract_audit_trail']['Insert'];

export const AuditTrailRepository = {
  async getAuditTrailByContractId(supabaseClient: typeof supabase, contractId: string): Promise<{ data: DbAuditTrail[] | null; error: any }> {
    const { data, error } = await supabaseClient
      .from('contract_audit_trail')
      .select('*')
      .eq('contract_id', contractId)
      .order('performed_at', { ascending: false });
      
    return { data, error };
  },
  
  async createAuditTrailEntry(supabaseClient: typeof supabase, auditData: DbAuditTrailInsert): Promise<{ data: DbAuditTrail | null; error: any }> {
    const { data, error } = await supabaseClient
      .from('contract_audit_trail')
      .insert(auditData)
      .select()
      .single();
      
    return { data, error };
  },
}; 