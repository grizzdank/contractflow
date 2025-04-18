import { supabase } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/types";

// Define types for contract data used within the repository
type DbContract = Database['public']['Tables']['contracts']['Row'];
type DbContractInsert = Database['public']['Tables']['contracts']['Insert'];
type DbContractUpdate = Database['public']['Tables']['contracts']['Update'];

export const ContractRepository = {
  async getAllContracts(supabaseClient: typeof supabase): Promise<{ data: DbContract[] | null; error: any }> {
    const { data, error } = await supabaseClient.from('contracts').select('*');
    return { data, error };
  },

  async getContractByNumber(supabaseClient: typeof supabase, contractNumber: string): Promise<{ data: DbContract | null; error: any }> {
    const { data, error } = await supabaseClient
      .from('contracts')
      .select('*')
      .eq('contract_number', contractNumber)
      .maybeSingle();
      
    if (error) return { data: null, error };
    if (!data) return { data: null, error: { message: `Contract ${contractNumber} not found` } };
    
    return { data, error: null };
  },
  
  async getContractById(supabaseClient: typeof supabase, id: string): Promise<{ data: DbContract | null; error: any }> {
    const { data, error } = await supabaseClient
      .from('contracts')
      .select('*')
      .eq('id', id)
      .maybeSingle();
      
    if (error) return { data: null, error };
    if (!data) return { data: null, error: { message: `Contract ${id} not found` } };
    
    return { data, error: null };
  },

  async createContract(supabaseClient: typeof supabase, dbContract: DbContractInsert): Promise<{ data: DbContract | null; error: any }> {
    console.log('Inserting new contract into Supabase via repository');
    const { data, error } = await supabaseClient
      .from('contracts')
      .insert(dbContract)
      .select()
      .single();
      
    if (error) {
      console.error('Supabase insert error details:', JSON.stringify(error, null, 2));
    }
    console.log('Insert result:', data, 'Error:', error);
    return { data, error };
  },

  async updateContract(supabaseClient: typeof supabase, id: string, dbContract: DbContractUpdate): Promise<{ data: DbContract | null; error: any }> {
    console.log('Updating existing contract in Supabase via repository');
    const { data, error } = await supabaseClient
      .from('contracts')
      .update(dbContract)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Supabase update error details:', JSON.stringify(error, null, 2));
    }
    console.log('Update result:', data, 'Error:', error);
    return { data, error };
  },
}; 