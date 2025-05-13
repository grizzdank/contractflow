import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileText, Loader2, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { IFileService } from "@/services/interfaces/IFileService";
import { DisplayFile } from "@/domain/types/DisplayFile";
import { useClerkAuth } from "@/contexts/ClerkAuthContext";

interface ContractAttachmentsProps {
  contractId: string;
  organizationId: string;
  attachments: DisplayFile[];
  onUploadSuccess: (fileName: string, filePath: string, documentType: string) => void;
  onDelete: (fileId: string, filePath: string, contractId: string, organizationId: string) => void;
  isLoading?: boolean;
  fileService: IFileService;
}

export function ContractAttachments({
  contractId,
  organizationId,
  attachments,
  onUploadSuccess,
  onDelete,
  isLoading,
  fileService
}: ContractAttachmentsProps) {
  
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
        const { data, error: uploadError } = await fileService.uploadGeneralAttachment(
            contractId,
            selectedFile,
            organizationId,
            appUserDetails.supabaseUserId
        ); 

        if (uploadError) throw uploadError;

        const filePath = data?.file_path;
        const fileId = data?.id;
        if (!filePath || !fileId) {
          throw new Error("Upload succeeded but file path or ID was not returned.");
        }

        toast.success(`Attachment ${selectedFile.name} uploaded successfully.`);
        onUploadSuccess(selectedFile.name, filePath, 'general_attachment');

        const auditEntry = {
            contract_id: contractId,
            action_type: 'general_attachment_uploaded' as const,
            changes: {
                fileName: selectedFile.name,
                filePath: filePath,
                fileId: fileId,
                message: `Uploaded attachment: ${selectedFile.name}`
            }
        };
        console.log("[Attachments] Creating audit entry:", auditEntry);
        const { error: auditError } = await contractService.addAuditTrailEntry(auditEntry);
        if (auditError) {
            console.error("[Attachments] Failed to create audit trail entry:", auditError);
            toast.warning("File uploaded, but failed to record audit event.");
        } else {
             console.log("[Attachments] Audit entry created successfully.");
        }

        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

    } catch (err: any) {
        console.error('[Attachments] Upload error:', err);
        toast.error(`Failed to upload attachment: ${err.message || 'Unknown error'}`);
    } finally {
        setIsUploading(false);
    }
  };

  const handleDownload = async (attachment: DisplayFile) => {
    if (!attachment?.file_path || !fileService) {
        toast.error("Download failed: Missing file path or service.");
        return;
    }
    toast.info(`Preparing download for ${attachment.file_name}...`);
    try {
      const { data, error: downloadError } = await fileService.downloadFile(attachment.file_path);

      if (downloadError || !data) throw new Error(downloadError?.message || 'Failed to download file blob.');

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download started.");
    } catch (err: any) {
      console.error('[Attachments] Download error:', err);
      toast.error(`Download failed: ${err.message}`);
    }
  };

  const handleDeleteClick = (fileId: string, filePath: string) => {
    if (!organizationId) {
        toast.error("Cannot delete: Organization ID missing.");
        return;
    }
    onDelete(fileId, filePath, contractId, organizationId);
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Attachments</h3>
      
      <div className="mb-4 p-4 border rounded-lg bg-gray-50 space-y-2">
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => {
              console.log('[Attachments] Choose File button clicked. Triggering input ref click...');
              fileInputRef.current?.click();
            }}
            disabled={isUploading} 
            size="sm" 
            variant="outline" 
            className="flex-shrink-0"
          >
            <Upload className="h-4 w-4 mr-2" /> Choose File
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            id={`attachment-file-input-${contractId}`}
          />
          <span className="text-sm text-gray-600 truncate flex-grow">
            {selectedFile ? selectedFile.name : 'No file chosen'}
          </span>
          <Button onClick={handleUploadClick} disabled={!selectedFile || isUploading} size="sm">
            {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Upload className="h-4 w-4 mr-2" />}
            {isUploading ? 'Uploading...' : 'Upload Attachment'}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-600">Uploaded Attachments:</h4>
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading attachments...</p>
        ) : attachments.length === 0 ? (
          <p className="text-sm text-gray-500">No attachments added yet.</p>
        ) : (
          attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm"
            >
              <div className="flex items-center gap-3 overflow-hidden mr-2">
                <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                <p className="font-medium truncate" title={attachment.file_name}>{attachment.file_name}</p>
              </div>
               <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(attachment)}>
                        <Download className="h-4 w-4 mr-2" /> Download
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(attachment.id, attachment.file_path)} className="text-red-500 hover:bg-red-100">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete {attachment.file_name}</span>
                    </Button>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
