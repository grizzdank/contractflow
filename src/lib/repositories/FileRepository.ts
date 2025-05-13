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
     // Explicitly set Content-Type
     const fileUploadOptions = {
        contentType: file.type || 'application/octet-stream', // Use file type or default
        upsert: false // Default, but explicit is fine
     };
     console.log(`[FileRepository] Uploading ${filePath} to bucket ${bucket} with options:`, fileUploadOptions);
     const { data, error } = await supabaseClient.storage
        .from(bucket)
        .upload(filePath, file, fileUploadOptions); // Pass options here
        
    if (error) {
      console.error(`[FileRepository] Storage upload error for ${filePath}:`, error);
    }
    return { data, error };
  },
  
  async downloadFile(supabaseClient: typeof supabase, bucket: string, filePath: string): Promise<{ data: Blob | null; error: any }> {
    // Log the parameters just before the download call
    console.log(`[FileRepository] Attempting to download from bucket: ${bucket}, path: ${filePath}`);
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .download(filePath);
      
    // Log any error returned by the download operation
    if (error) {
      console.error(`[FileRepository] Storage download error for ${filePath}:`, error);
    }
    return { data, error };
  },
  
  async deleteFile(supabaseClient: typeof supabase, bucket: string, filePath: string): Promise<{ data: any | null; error: any }> {
     const { data, error } = await supabaseClient.storage
        .from(bucket)
        .remove([filePath]);
        
    return { data, error };
  },

  async getFileByPath(supabaseClient: typeof supabase, filePath: string): Promise<{ data: DbContractCoiFile | null; error: any }> {
    const { data, error } = await supabaseClient
      .from('contract_coi_files')
      .select('*')
      .eq('file_path', filePath)
      .maybeSingle(); // Use maybeSingle as path should ideally be unique, but good to handle if not.
      
    return { data, error };
  },

  async getFileByPathAndContract(supabaseClient: typeof supabase, filePath: string, contractId?: string): Promise<{ data: DbContractCoiFile | null; error: any }> {
    let query = supabaseClient
      .from('contract_coi_files')
      .select('*')
      .eq('file_path', filePath);

    if (contractId) {
      query = query.eq('contract_id', contractId);
    }
    
    const { data, error } = await query.maybeSingle();
      
    return { data, error };
  },

  async deleteFileRecordById(supabaseClient: typeof supabase, fileId: string): Promise<{ data: boolean | null; error: any }> {
    const { error } = await supabaseClient
      .from('contract_coi_files')
      .delete()
      .eq('id', fileId);
      
    return { data: !error, error };
  }
}; 