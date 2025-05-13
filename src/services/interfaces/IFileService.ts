import { Database } from "@/lib/supabase/types";

// Define GetTokenFn here or import from a shared types location if it exists
export type GetTokenFn = (options?: { template?: string; skipCache?: boolean; }) => Promise<string | null>;

// Assuming 'contract_coi_files' will be renamed to 'contract_documents' later.
// Update this type alias when Supabase types are regenerated after table rename.
type DbFileRecord = Database['public']['Tables']['contract_coi_files']['Row'];

export interface IFileService {
  getContractFiles(contractId: string): Promise<{ data: DbFileRecord[] | null; error: any }>;
  uploadContractFile(
    contractId: string, 
    file: File, 
    isExecuted: boolean, 
    organizationId: string,
    userId: string,
    expirationDate?: string
  ): Promise<{ data: DbFileRecord | null; error: any }>;
  
  // New method for general attachments
  uploadGeneralAttachment(
    contractId: string,
    file: File,
    organizationId: string,
    userId: string
  ): Promise<{ data: DbFileRecord | null; error: any }>;

  downloadFile(filePath: string): Promise<{ data: Blob | null; error: any }>;
  deleteFile(filePath: string, contractId: string, organizationId?: string): Promise<{ data: boolean | null; error: any }>;
} 