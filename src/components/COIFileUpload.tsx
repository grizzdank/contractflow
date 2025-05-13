import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Trash2, FileText, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { IFileService } from "@/services/interfaces/IFileService";
import { useClerkAuth } from "@/contexts/ClerkAuthContext";

interface DisplayFile {
  id: string;
  file_name: string;
  file_path: string;
  document_type: string;
  mime_type: string | null;
  file_size: number | null;
  uploaded_at: string;
  uploaded_by?: string;
  expiration_date: string | null;
}

interface COIFileUploadProps {
  contractId: string;
  organizationId: string;
  coiFiles: DisplayFile[];
  onUploadSuccess: (fileName: string, filePath: string, documentType: string) => void;
  onDelete: (fileId: string, filePath: string, contractId: string, organizationId: string) => void;
  isLoading?: boolean;
  fileService: IFileService;
}

export function COIFileUpload({
  contractId,
  organizationId,
  coiFiles,
  onUploadSuccess,
  onDelete,
  isLoading = false,
  fileService
}: COIFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [expirationDate, setExpirationDate] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { appUserDetails, services } = useClerkAuth();
  const contractService = services.contract;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fileService || !organizationId) {
        if (!organizationId) setUploadError("Cannot upload: Organization ID missing.");
        if (!fileService) setUploadError("Cannot upload: File service not available.");
        return;
    }
    if (!appUserDetails?.supabaseUserId) {
        setUploadError("Cannot upload: User ID not available.");
        setIsUploading(false);
        return;
    }
    if (!contractService) {
        setUploadError("Cannot upload: Contract service not available.");
        setIsUploading(false);
        return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      console.log(`[COIUpload] Uploading ${file.name} for Org ${organizationId} with expiry ${expirationDate || 'N/A'}`);
      const { data, error } = await fileService.uploadContractFile(
          contractId, 
          file, 
          false,
          organizationId, 
          appUserDetails.supabaseUserId,
          expirationDate
      );

      if (error) throw error;

      const filePath = data?.file_path;
      const fileId = data?.id;
      if (!filePath || !fileId) {
        throw new Error("Upload succeeded but file path or ID was not returned.");
      }
      
      console.log(`[COIUpload] Upload success for ${file.name}. Path: ${filePath}`);
      onUploadSuccess(file.name, filePath, 'coi');

      const auditEntry = {
          contract_id: contractId,
          action_type: 'coi_document_uploaded' as const,
          changes: {
              fileName: file.name,
              filePath: filePath,
              fileId: fileId,
              expirationDate: expirationDate || null,
              message: `Uploaded COI: ${file.name}`
          }
      };
      console.log("[COIUpload] Creating audit entry:", auditEntry);
      const { error: auditError } = await contractService.addAuditTrailEntry(auditEntry);
      if (auditError) {
          console.error("[COIUpload] Failed to create audit trail entry:", auditError);
          toast({ title: "Warning", description: "File uploaded, but failed to record audit event.", variant: "default" });
      } else {
           console.log("[COIUpload] Audit entry created successfully.");
      }

    } catch (error: any) {
      console.error('Error uploading COI file:', error);
      setUploadError(error.message || "Failed to upload file.");
    } finally {
      setIsUploading(false);
      setExpirationDate("");
      event.target.value = '';
    }
  };

  const handleDeleteClick = (fileId: string, filePath: string) => {
    if (!organizationId) {
        console.error("Cannot delete: Organization ID missing.");
        toast({ title: "Error", description: "Cannot delete file: Organization ID missing.", variant: "destructive"});
        return;
    }
    console.log(`[COIUpload] Delete clicked for File ID: ${fileId}, Path: ${filePath}, Org: ${organizationId}`);
    onDelete(fileId, filePath, contractId, organizationId);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Certificate of Insurance (COI)</h3>
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            placeholder="Expiration Date (optional)"
            className="flex-1"
            disabled={isLoading || isUploading}
          />
          <div className="relative">
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.png"
              onChange={handleFileUpload}
              className="hidden"
              id="coi-file-upload"
              disabled={isLoading || isUploading}
            />
            <Button
              disabled={isLoading || isUploading}
              asChild
            >
              <label htmlFor="coi-file-upload" className={`cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isLoading || isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90'} h-10 px-4 py-2`}>
                {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Upload className="h-4 w-4 mr-2" />}
                {isUploading ? 'Uploading...' : 'Upload COI'}
              </label>
            </Button>
          </div>
        </div>
        {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-600">Uploaded COI Files:</h4>
        {isLoading && !coiFiles.length ? (
          <p className="text-sm text-gray-500">Loading file list...</p>
        ) : coiFiles.length === 0 ? (
          <p className="text-sm text-gray-500">No COI files uploaded yet.</p>
        ) : (
          coiFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm"
            >
              <div className="flex items-center gap-3 overflow-hidden mr-2">
                <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <div className="overflow-hidden">
                  <p className="font-medium truncate" title={file.file_name}>{file.file_name}</p>
                  {file.expiration_date && (
                    <p className="text-xs text-gray-500">
                      Expires: {new Date(file.expiration_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteClick(file.id, file.file_path)}
                disabled={isLoading || isUploading}
                className="text-red-500 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete {file.file_name}</span>
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
