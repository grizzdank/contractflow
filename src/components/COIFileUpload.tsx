
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Trash2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface COIFile {
  id: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
  expiration_date: string | null;
}

interface COIFileUploadProps {
  contractId: string;
  onFileUploaded: () => void;
  files: COIFile[];
  onFileDeleted: () => void;
}

export function COIFileUpload({ contractId, onFileUploaded, files, onFileDeleted }: COIFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [expirationDate, setExpirationDate] = useState<string>("");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${contractId}/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('coi_files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { error: dbError } = await supabase
        .from('contract_coi_files')
        .insert({
          contract_id: contractId,
          file_name: file.name,
          file_path: filePath,
          expiration_date: expirationDate || null,
        });

      if (dbError) throw dbError;

      onFileUploaded();
    } catch (error) {
      console.error('Error uploading COI file:', error);
    } finally {
      setIsUploading(false);
      setExpirationDate("");
    }
  };

  const handleDelete = async (filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('coi_files')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('contract_coi_files')
        .delete()
        .eq('file_path', filePath);

      if (dbError) throw dbError;

      onFileDeleted();
    } catch (error) {
      console.error('Error deleting COI file:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-50">
        <div className="flex gap-4">
          <Input
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            placeholder="Expiration Date (optional)"
          />
          <div className="relative">
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              id="coi-file-upload"
            />
            <Button
              disabled={isUploading}
              asChild
            >
              <label htmlFor="coi-file-upload" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Upload COI
              </label>
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-3 bg-white border rounded-lg"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <div>
                <p className="font-medium">{file.file_name}</p>
                {file.expiration_date && (
                  <p className="text-sm text-gray-500">
                    Expires: {new Date(file.expiration_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(file.file_path)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
