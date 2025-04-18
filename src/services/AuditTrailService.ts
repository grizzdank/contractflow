import { IAuditTrailService } from "@/services/interfaces/IAuditTrailService";
import { AuditTrailRepository } from "@/lib/repositories/AuditTrailRepository";
import { supabase } from "@/lib/supabase/client";
import { getSupabaseSession } from "@/lib/supabase/utils"; 
import { Database } from "@/lib/supabase/types";

type DbAuditTrail = Database['public']['Tables']['contract_audit_trail']['Row'];
type DbAuditTrailInsert = Database['public']['Tables']['contract_audit_trail']['Insert'];

export class AuditTrailService implements IAuditTrailService {
  async getContractAuditTrail(contractId: string): Promise<{ data: DbAuditTrail[] | null; error: any }> {
    try {
      const session = await getSupabaseSession();
      if (!session) throw new Error("User not authenticated");
      return await AuditTrailRepository.getAuditTrailByContractId(supabase, contractId);
    } catch (error) {
      console.error(`Error getting audit trail for contract ${contractId}:`, error);
      return { data: null, error };
    }
  }

  async createAuditTrailEntry(auditData: DbAuditTrailInsert): Promise<{ data: DbAuditTrail | null; error: any }> {
     try {
      const session = await getSupabaseSession();
      if (!session?.user) throw new Error("User not authenticated");
      
      // Ensure performed_by and performed_by_email are set
      if (!auditData.performed_by) {
          auditData.performed_by = session.user.id;
      }
      if (!auditData.performed_by_email) {
          auditData.performed_by_email = session.user.email || 'unknown';
      }
      
      return await AuditTrailRepository.createAuditTrailEntry(supabase, auditData);
    } catch (error) {
      console.error('Error creating audit trail entry:', error);
      return { data: null, error };
    }
  }
} 