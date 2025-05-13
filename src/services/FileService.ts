import { IFileService } from "@/services/interfaces/IFileService";
import { FileRepository } from "@/lib/repositories/FileRepository";
import { getSupabaseSession } from "@/lib/supabase/utils"; 
import { Database } from "@/lib/supabase/types";
import { GetTokenFn } from "./interfaces/IFileService"; // Corrected import path for GetTokenFn
import { SupabaseClient } from '@supabase/supabase-js'; // Added import
import { createAuthenticatedSupabaseClient } from '@/lib/supabase/client'; // Added import

// Assuming 'contract_coi_files' will be renamed to 'contract_documents' later.
// The generated types will reflect this once Supabase types are regenerated after table rename.
type DbFileRecord = Database['public']['Tables']['contract_coi_files']['Row'];
type DbFileRecordInsert = Database['public']['Tables']['contract_coi_files']['Insert'];
type DbAuditTrailInsert = Database['public']['Tables']['contract_audit_trail']['Insert'];

// Define constants for Supabase bucket names
export const COI_BUCKET = 'coi_files';
export const EXECUTED_DOC_BUCKET = 'executed-documents';
export const TEMPLATE_BUCKET = 'contract-templates';
export const ATTACHMENT_BUCKET = 'general-attachments'; // Used by ContractService
export const GENERAL_ATTACHMENTS_BUCKET = 'general-attachments';

// TODO: Add more constants as needed, e.g., for templates, etc.

export class FileService implements IFileService {
  private getToken: GetTokenFn;

  constructor(getToken: GetTokenFn) {
    if (!getToken) {
      throw new Error("FileService requires a getToken function.");
    }
    this.getToken = getToken;
  }

  private async getSupabaseClient(): Promise<SupabaseClient<Database>> {
      console.log("[FileService] getSupabaseClient: Attempting to get token...");
      const token = await this.getToken(); // Call and store for logging
      console.log("[FileService] getSupabaseClient: Token received (first 20 chars):", token ? token.substring(0, 20) + "..." : "null/undefined");
      console.log("[FileService] getSupabaseClient: Attempting to create authenticated Supabase client...");
      // Pass the already fetched token function (this.getToken) to createAuthenticatedSupabaseClient as it expects a function
      const client = await createAuthenticatedSupabaseClient(this.getToken);
      console.log("[FileService] getSupabaseClient: Authenticated Supabase client potentially created.");
      return client;
  }

  private async uploadTypedContractFile(
    contractId: string,
    file: File,
    documentType: 'coi' | 'executed_agreement' | 'general_attachment',
    organizationId: string,
    userId: string,
    expirationDate?: string
  ): Promise<{ data: DbFileRecord | null; error: any }> {
    try {
      console.log(`[FileService] uploadTypedContractFile (${documentType}): Acquiring Supabase client...`);
      const supabase = await this.getSupabaseClient();
      console.log(`[FileService] uploadTypedContractFile (${documentType}): Supabase client acquired.`);
      
      if (!userId) {
        console.error(`[FileService] uploadTypedContractFile (${documentType}): userId not provided.`);
        throw new Error("User ID is required for file upload.");
      }
      console.log(`[FileService] uploadTypedContractFile (${documentType}): Using provided userId:`, userId);

      let bucket: string;
      switch (documentType) {
        case 'coi': bucket = COI_BUCKET; break;
        case 'executed_agreement': bucket = EXECUTED_DOC_BUCKET; break;
        case 'general_attachment': bucket = GENERAL_ATTACHMENTS_BUCKET; break;
        default: throw new Error(`Invalid document type: ${documentType}`);
      }
      const fileExt = file.name.split('.').pop();
      const filePath = `${organizationId}/${contractId}/${documentType}/${crypto.randomUUID()}.${fileExt}`;
      
      // Call uploadFile and check for errors
      const { data: uploadData, error: uploadError } = await FileRepository.uploadFile(supabase, bucket, filePath, file); 

      // If storage upload failed, log and return the error immediately
      if (uploadError) {
        console.error(`[FileService] Storage upload failed for ${filePath}. Aborting DB record creation. Error:`, uploadError);
        return { data: null, error: uploadError };
      }
      
      // Only proceed if upload succeeded (uploadError is null/falsy)
      console.log(`[FileService] Storage upload successful for path: ${uploadData?.path}`); // Log success path

      const fileData = {
        contract_id: contractId,
        file_name: file.name,
        file_path: filePath,
        uploaded_by: userId,
        organization_id: organizationId,
        document_type: documentType,
        mime_type: file.type || 'application/octet-stream',
        file_size: file.size,
        expiration_date: documentType === 'coi' ? expirationDate || null : null,
        // is_executed_contract: undefined, // No longer needed explicitly if type doesn't have it
      };

      // Use 'as any' when creating DB record due to outdated Supabase types
      const { data: dbRecord, error: dbError } = await FileRepository.createFileRecord(supabase, fileData as any);
      if (dbError) {
        console.error("Error creating file record in DB:", dbError);
        await FileRepository.deleteFile(supabase, bucket, filePath); // Attempt to clean up storage
        throw dbError;
      }
      console.log(`[FileService] DB record created successfully for ${filePath}. ID: ${dbRecord?.id}`);
      return { data: dbRecord as DbFileRecord, error: null };
    } catch (error) {
      console.error(`Error in uploadTypedContractFile (${documentType}):`, error);
      return { data: null, error };
    }
  }

  // Existing method, now wraps uploadTypedContractFile
  async uploadContractFile(
    contractId: string,
    file: File,
    isExecuted: boolean,
    organizationId: string,
    userId: string,
    expirationDate?: string
  ): Promise<{ data: DbFileRecord | null; error: any }> {
    const documentType = isExecuted ? 'executed_agreement' : 'coi';
    return this.uploadTypedContractFile(contractId, file, documentType, organizationId, userId, expirationDate);
  }

  // New method for general attachments
  async uploadGeneralAttachment(
    contractId: string,
    file: File,
    organizationId: string,
    userId: string
  ): Promise<{ data: DbFileRecord | null; error: any }> {
    return this.uploadTypedContractFile(contractId, file, 'general_attachment', organizationId, userId);
  }

  async getContractFiles(contractId: string): Promise<{ data: DbFileRecord[] | null; error: any }> {
    try {
      // Use internal method to get client
      const supabase = await this.getSupabaseClient(); 
      // Removed direct session check, assume getSupabaseClient handles auth context
      return await FileRepository.getFilesByContractId(supabase, contractId);
    } catch (error) {
      console.error(`Error getting files for contract ${contractId}:`, error);
      return { data: null, error };
    }
  }

  async downloadFile(filePath: string): Promise<{ data: Blob | null; error: any }> {
     try {
      const supabase = await this.getSupabaseClient(); // Use instance client
      // const session = await getSupabaseSession(); // Not needed if client is auth-context aware
      // if (!session) throw new Error("User not authenticated");
      
      let bucket: string;
      const dbFile = await FileRepository.getFileByPath(supabase, filePath);

      if (dbFile && dbFile.data) {
        switch ((dbFile.data as any).document_type) { // Use type assertion
          case 'coi': bucket = COI_BUCKET; break;
          case 'executed_agreement': bucket = EXECUTED_DOC_BUCKET; break;
          case 'general_attachment': bucket = ATTACHMENT_BUCKET; break;
          default: 
            console.warn(`Could not reliably determine bucket for ${filePath} based on document_type. Falling back to path heuristics.`);
            if (filePath.includes('/coi/')) bucket = COI_BUCKET;
            else if (filePath.includes('/executed_agreement/')) bucket = EXECUTED_DOC_BUCKET;
            else if (filePath.includes('/general_attachment/')) bucket = GENERAL_ATTACHMENTS_BUCKET;
            else throw new Error(`Unknown document type/path structure for file path: ${filePath}`);
        }
      } else {
        console.error(`File record not found for path ${filePath}, cannot determine bucket for download.`);
        // Fallback to path heuristics if DB record not found - RETHINK if this is safe
        if (filePath.includes('/coi/')) bucket = COI_BUCKET;
        else if (filePath.includes('/executed_agreement/')) bucket = EXECUTED_DOC_BUCKET;
        else if (filePath.includes('/general_attachment/')) bucket = GENERAL_ATTACHMENTS_BUCKET;
        else throw new Error(`File record not found and cannot infer bucket from path: ${filePath}`);
      }
      
      return await FileRepository.downloadFile(supabase, bucket, filePath);
    } catch (error) {
      console.error(`Error downloading file ${filePath}:`, error);
      return { data: null, error };
    }
  }

  async deleteFile(filePath: string, contractId: string, organizationId_UNUSED?: string): Promise<{ data: boolean | null; error: any }> {
    try {
      const supabase = await this.getSupabaseClient(); // Use instance client
      // const session = await getSupabaseSession(); // Not needed
      // if (!session) throw new Error("User not authenticated");

      const fileRecordResult = await FileRepository.getFileByPathAndContract(supabase, filePath, contractId);

      if (fileRecordResult.error || !fileRecordResult.data) {
        console.warn(`DB record for ${filePath} (contract: ${contractId}) not found. Aborting delete, as bucket cannot be reliably determined.`);
        // To prevent accidental deletion from a wrong bucket if path based guess is also off.
        throw new Error(`File record not found for path ${filePath} and contract ${contractId}. Cannot delete.`);
      }

      const fileToDelete = fileRecordResult.data;
      let bucket: string;

      switch ((fileToDelete as any).document_type) { // Use type assertion
          case 'coi': bucket = COI_BUCKET; break;
          case 'executed_agreement': bucket = EXECUTED_DOC_BUCKET; break;
          case 'general_attachment': bucket = ATTACHMENT_BUCKET; break;
          default:
              throw new Error(`Cannot determine bucket for deletion. Unknown document type: ${(fileToDelete as any).document_type}`);
      }
      
      await FileRepository.deleteFile(supabase, bucket, filePath);
      await FileRepository.deleteFileRecordById(supabase, fileToDelete.id);
      
      return { data: true, error: null };
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
      return { data: false, error };
    }
  }
} 