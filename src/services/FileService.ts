import { IFileService } from "./interfaces/IFileService";
import { FileRepository } from "@/lib/repositories/FileRepository";
import { AuditTrailRepository } from "@/lib/repositories/AuditTrailRepository"; // Needed for audit log on executed doc upload
import { supabase } from "@/lib/supabase/client";
import { getSupabaseSession } from "../lib/supabase/utils"; 
import { Database } from "@/lib/supabase/types";

type DbContractCoiFile = Database['public']['Tables']['contract_coi_files']['Row'];
type DbAuditTrailInsert = Database['public']['Tables']['contract_audit_trail']['Insert'];

const COI_BUCKET = 'coi_files'; // Define bucket names
const EXECUTED_DOC_BUCKET = 'executed_documents';

export class FileService implements IFileService {
  async getContractFiles(contractId: string): Promise<{ data: DbContractCoiFile[] | null; error: any }> {
    try {
      const session = await getSupabaseSession();
      if (!session) throw new Error("User not authenticated");
      // Fetch file records from the database
      return await FileRepository.getFilesByContractId(supabase, contractId);
    } catch (error) {
      console.error(`Error getting files for contract ${contractId}:`, error);
      return { data: null, error };
    }
  }

  async uploadContractFile(contractId: string, file: File, isExecuted: boolean, expirationDate?: string): Promise<{ data: DbContractCoiFile | null; error: any }> {
    try {
      const session = await getSupabaseSession();
      if (!session?.user) throw new Error("User not authenticated");
      
      const bucket = isExecuted ? EXECUTED_DOC_BUCKET : COI_BUCKET;
      const fileExt = file.name.split('.').pop();
      const filePath = `${contractId}/${crypto.randomUUID()}.${fileExt}`;

      // 1. Upload file to storage
      const { error: uploadError } = await FileRepository.uploadFile(supabase, bucket, filePath, file);
      if (uploadError) throw uploadError;

      // 2. Create database record
      const fileData: Database['public']['Tables']['contract_coi_files']['Insert'] = {
          contract_id: contractId,
          file_name: file.name,
          file_path: filePath,
          uploaded_by: session.user.id, // Add user ID
          is_executed_contract: isExecuted,
          expiration_date: expirationDate || null,
      };
      const { data: dbRecord, error: dbError } = await FileRepository.createFileRecord(supabase, fileData);
      if (dbError) {
        // Attempt to delete uploaded file if DB record fails
        console.warn(`DB record failed for ${filePath}, attempting to delete orphaned storage file.`);
        await FileRepository.deleteFile(supabase, bucket, filePath);
        throw dbError;
      }

      // 3. Add audit trail entry if it's an executed document
      if (isExecuted) {
         const auditData: DbAuditTrailInsert = {
            contract_id: contractId,
            action_type: 'executed_document_uploaded',
            changes: { file_name: file.name, file_path: filePath },
            performed_by: session.user.id,
            performed_by_email: session.user.email || 'unknown',
          };
         await AuditTrailRepository.createAuditTrailEntry(supabase, auditData);
          // Log potential errors but don't fail the upload if audit fails
          // if (auditError) {
          //   console.error('Failed to create audit trail for executed document upload:', auditError);
          // }
      }
      
      return { data: dbRecord, error: null };
    } catch (error) {
      console.error('Error uploading contract file:', error);
      return { data: null, error };
    }
  }

  async downloadFile(filePath: string): Promise<{ data: Blob | null; error: any }> {
     try {
      const session = await getSupabaseSession();
      if (!session) throw new Error("User not authenticated");
      
      // Determine bucket based on path structure (assuming paths are unique enough)
      // This is brittle - might need a better way to know the bucket
      const bucket = filePath.includes('executed_') ? EXECUTED_DOC_BUCKET : COI_BUCKET; 
      
      return await FileRepository.downloadFile(supabase, bucket, filePath);
    } catch (error) {
      console.error(`Error downloading file ${filePath}:`, error);
      return { data: null, error };
    }
  }

  async deleteFile(filePath: string): Promise<{ data: boolean | null; error: any }> {
    try {
      const session = await getSupabaseSession();
      if (!session) throw new Error("User not authenticated");
      
      // Determine bucket (same caveat as download)
      const bucket = filePath.includes('executed_') ? EXECUTED_DOC_BUCKET : COI_BUCKET; 

      // TODO: Also need to delete the corresponding DB record in contract_coi_files
      // This requires finding the record by filePath, which isn't directly supported by the repo yet.
      // Need to add a getFileByPath or deleteFileRecord method to FileRepository.
      
      const { error } = await FileRepository.deleteFile(supabase, bucket, filePath);
      if (error) throw error;
      
      console.log(`Successfully deleted file ${filePath} from storage bucket ${bucket}. Remember to delete DB record.`);
      return { data: true, error: null };
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
      return { data: false, error };
    }
  }
} 