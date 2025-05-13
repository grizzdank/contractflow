export interface DisplayFile {
  id: string;
  contract_id: string;
  file_name: string;
  file_path: string; // Path in Supabase Storage
  document_type: string; 
  mime_type: string | null;
  file_size: number | null;
  uploaded_at: string;
  uploaded_by?: string;
  expiration_date: string | null; 
} 