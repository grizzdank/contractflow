// Repository for handling file storage and contract_coi_files table interactions 
import { supabase } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/types";

// Define types used within the repository
type DbContractCoiFile = Database['public']['Tables']['contract_coi_files']['Row'];
type DbContractCoiFileInsert = Database['public']['Tables']['contract_coi_files']['Insert'];

export const FileRepository = {
  async getFilesByContractId(supabaseClient: typeof supabase, contractId: string): Promise<{ data: DbContractCoiFile[] | null; error: any }> {
    const { data, error } = await supabaseClient
      .from('contract_coi_files')
      .select('*')
      .eq('contract_id', contractId)
      .order('uploaded_at', { ascending: false });
      
    return { data, error };
  },

  async createFileRecord(supabaseClient: typeof supabase, fileData: DbContractCoiFileInsert): Promise<{ data: DbContractCoiFile | null; error: any }> {
    const { data, error } = await supabaseClient
      .from('contract_coi_files')
      .insert(fileData)
      .select()
      .single();
    
    return { data, error };
  },

  async uploadFile(supabaseClient: typeof supabase, bucket: string, filePath: string, file: File): Promise<{ data: { path: string } | null; error: any }> {
     const { data, error } = await supabaseClient.storage
        .from(bucket)
        .upload(filePath, file);
        
    return { data, error };
  },
  
  async downloadFile(supabaseClient: typeof supabase, bucket: string, filePath: string): Promise<{ data: Blob | null; error: any }> {
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .download(filePath);
      
    return { data, error };
  },
  
  async deleteFile(supabaseClient: typeof supabase, bucket: string, filePath: string): Promise<{ data: any | null; error: any }> {
     const { data, error } = await supabaseClient.storage
        .from(bucket)
        .remove([filePath]);
        
    return { data, error };
  }
}; 