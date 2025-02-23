
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Download, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ExecutedDocument {
  id: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
}

interface ContractExecutedDocumentProps {
  contractId: string;
  onDocumentUploaded: () => void;
}

export function ContractExecutedDocument({ contractId, onDocumentUploaded }: ContractExecutedDocumentProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [executedDocument, setExecutedDocument] = useState<ExecutedDocument | null>(null);

  const loadExecutedDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('contract_coi_files')
        .select('*')
        .eq('contract_id', contractId)
        .eq('is_executed_contract', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setExecutedDocument(data);
    } catch (error) {
      console.error('Error loading executed document:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const filePath = `${contractId}/executed_${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('coi_files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('contract_coi_files')
        .insert({
          contract_id: contractId,
          file_name: file.name,
          file_path: filePath,
          is_executed_contract: true,
        });

      if (dbError) throw dbError;

      // Add audit trail entry
      await supabase
        .from('contract_audit_trail')
        .insert({
          contract_id: contractId,
          action_type: 'executed',
          changes: { file_name: file.name },
          performed_by_email: 'current.user@example.com', // Should be replaced with actual user email
        });

      onDocumentUploaded();
      loadExecutedDocument();
    } catch (error) {
      console.error('Error uploading executed document:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('coi_files')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = executedDocument?.file_name || 'executed-contract';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-4">Executed Contract Document</h3>
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-50">
        {executedDocument ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span>{executedDocument.file_name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(executedDocument.file_path)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        ) : (
          <div className="relative">
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              id="executed-contract-upload"
            />
            <Button
              disabled={isUploading}
              asChild
            >
              <label htmlFor="executed-contract-upload" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Upload Executed Contract
              </label>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
