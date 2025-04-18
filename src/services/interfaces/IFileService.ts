import { Database } from "@/lib/supabase/types";

type DbContractCoiFile = Database['public']['Tables']['contract_coi_files']['Row'];

export interface IFileService {
  getContractFiles(contractId: string): Promise<{ data: DbContractCoiFile[] | null; error: any }>;
  uploadContractFile(contractId: string, file: File, isExecuted: boolean, expirationDate?: string): Promise<{ data: DbContractCoiFile | null; error: any }>;
  downloadFile(filePath: string): Promise<{ data: Blob | null; error: any }>;
  deleteFile(filePath: string): Promise<{ data: boolean | null; error: any }>;
} 