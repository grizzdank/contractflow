import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Download, FileText } from "lucide-react";
import { contractService } from "@/lib/dataService";

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
      const { data, error } = await contractService.getContractCOIFiles(contractId);

      if (error) throw error;
      
      // Find the executed contract document
      const executedDoc = data?.find(file => file.is_executed_contract);
      setExecutedDocument(executedDoc || null);
    } catch (error) {
      console.error('Error loading executed document:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      const { error } = await contractService.uploadExecutedDocument(contractId, file);

      if (error) throw error;

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
      const { data, error } = await contractService.downloadFile(filePath);

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
