import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Download, FileText, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { IFileService } from "@/services/interfaces/IFileService";
import { DisplayFile } from "@/domain/types/DisplayFile";
import { useClerkAuth } from "@/contexts/ClerkAuthContext";

interface ContractExecutedDocumentProps {
  contractId: string;
  organizationId: string;
  document: DisplayFile | null;
  onUploadSuccess: (fileName: string, filePath: string, documentType: string) => void;
  onDelete: (fileId: string, filePath: string, contractId: string, organizationId: string) => void;
  isLoading?: boolean;
  fileService: IFileService;
}

export function ContractExecutedDocument({
  contractId,
  organizationId,
  document: executedDocument,
  onUploadSuccess,
  onDelete,
  isLoading,
  fileService
}: ContractExecutedDocumentProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { appUserDetails, services } = useClerkAuth();
  const contractService = services.contract;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUploadClick = async () => {
    if (!selectedFile || !fileService || !organizationId || !contractId) {
      toast.error("Cannot upload: Missing file, service, or context.");
      return;
    }
    if (!appUserDetails?.supabaseUserId) {
      toast.error("Cannot upload: User ID not available.");
      setIsUploading(false);
      return;
    }
    if (!contractService) {
      toast.error("Cannot upload: Contract service not available.");
      setIsUploading(false);
      return;
    }

    setIsUploading(true);
    toast.info(`Uploading ${selectedFile.name}...`);

    try {
      const { data, error: uploadError } = await fileService.uploadContractFile(
          contractId, 
          selectedFile, 
          true,
          organizationId,
          appUserDetails.supabaseUserId
      );

      if (uploadError) throw uploadError;

      const filePath = data?.file_path;
      const fileId = data?.id;
      if (!filePath || !fileId) {
        throw new Error("Upload succeeded but file path or ID was not returned.");
      }

      toast.success("Executed document uploaded successfully!");
      onUploadSuccess(selectedFile.name, filePath, 'executed_agreement');

      const actionType = executedDocument ? 'executed_document_replaced' : 'executed_document_uploaded';
      const auditEntry = {
          contract_id: contractId,
          action_type: actionType,
          changes: {
              fileName: selectedFile.name,
              filePath: filePath,
              fileId: fileId,
              message: `${actionType === 'executed_document_replaced' ? 'Replaced' : 'Uploaded'} executed document: ${selectedFile.name}`,
              ...(actionType === 'executed_document_replaced' && executedDocument ? { oldFilePath: executedDocument.file_path } : {})
          }
      };
      console.log(`[CED] Creating audit entry (${actionType}):`, auditEntry);
      const { error: auditError } = await contractService.addAuditTrailEntry(auditEntry);
      if (auditError) {
          console.error(`[CED] Failed to create audit trail entry (${actionType}):`, auditError);
          toast.warning("File uploaded, but failed to record audit event.");
      } else {
           console.log(`[CED] Audit entry created successfully (${actionType}).`);
      }

      setSelectedFile(null);
      if (fileInputRef.current) {
         fileInputRef.current.value = "";
      }

    } catch (err: any) {
      console.error('[CED] Caught error during file upload process:', err);
      toast.error(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!executedDocument?.file_path || !fileService) {
        toast.error("Download failed: Missing file path or service.");
        return;
    }
    toast.info("Preparing download...");
    try {
      const { data, error: downloadError } = await fileService.downloadFile(executedDocument.file_path);

      if (downloadError || !data) throw new Error(downloadError?.message || 'Failed to download file blob.');

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = executedDocument?.file_name || 'executed-contract';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download started.");
    } catch (err: any) {
      console.error('[CED] Error downloading file:', err);
      toast.error(`Download failed: ${err.message}`);
    }
  };

  const handleDeleteClick = () => {
    if (!executedDocument || !organizationId) {
        toast.error("Cannot delete: Missing file info or Organization ID.");
        return;
    }
    onDelete(executedDocument.id, executedDocument.file_path, contractId, organizationId);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-4">Executed Contract Document</h3>
      <div className="p-4 border rounded-lg bg-white shadow-sm">
        {isLoading ? (
          <div>Loading...</div>
        ) : executedDocument ? (
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <div className="flex items-center gap-2 overflow-hidden mr-2 flex-grow">
              <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="truncate" title={executedDocument.file_name}>{executedDocument.file_name}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" /> Download
                </Button>
                 <Button variant="ghost" size="icon" onClick={handleDeleteClick} className="text-red-500 hover:bg-red-100">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete Executed Document</span>
                </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-4">No executed document uploaded yet.</p>
        )}

        <div>
            <label htmlFor="executed-contract-upload" className="text-sm font-medium text-gray-700 block mb-2">
                {executedDocument ? 'Replace Executed Document' : 'Upload Executed Document'}
            </label>
            <Input
              id="executed-contract-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="mb-2"
              ref={fileInputRef}
              disabled={isUploading}
            />
            {selectedFile && (
                 <p className="text-xs text-gray-500 mb-2 truncate">Selected: {selectedFile.name}</p>
            )}
            <Button 
              onClick={handleUploadClick} 
              disabled={!selectedFile || isUploading}
              size="sm"
            >
              {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Upload className="h-4 w-4 mr-2" />}
              {isUploading ? 'Uploading...' : (executedDocument ? 'Replace Document' : 'Upload Document')}
            </Button>
        </div>
      </div>
    </div>
  );
}

