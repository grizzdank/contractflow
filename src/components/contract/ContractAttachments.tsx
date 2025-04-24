import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useClerkAuth } from "@/contexts/ClerkAuthContext";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/types";
import { toast } from "sonner";
import { ContractService } from "@/services/ContractService";

// Type for attachments fetched from DB - Pointing to contract_coi_files now
type DbAttachmentFile = Database['public']['Tables']['contract_coi_files']['Row'];

// Type for frontend display
interface Attachment {
  id: string;
  name: string;
  path: string; // Path in storage
  url?: string; // Optional: pre-signed URL for download
}

interface ContractAttachmentsProps {
  contractId: string;
}

// Helper to map DB data from contract_coi_files to frontend Attachment type
const mapDbToFile = (dbFile: DbAttachmentFile): Attachment => ({
  id: dbFile.id,
  name: dbFile.file_name, // Assuming same column name
  path: dbFile.file_path, // Assuming same column name
});

export function ContractAttachments({ contractId }: ContractAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, getToken, isLoading: isAuthLoading } = useClerkAuth();

  // Function to load attachments (can be reused for refresh)
  const loadAttachments = async () => {
    if (!contractId || !getToken || isAuthLoading) {
      console.log("[Attachments] Waiting for contractId, token, or auth loading.");
      if (!isAuthLoading) setIsLoading(false);
      return;
    }
    
    console.log(`[Attachments] Loading general attachments for contract ID: ${contractId}`);
    setIsLoading(true);
    setError(null);
    try {
      const supabase = await createAuthenticatedSupabaseClient(getToken);
      const { data, error: fetchError } = await supabase
        .from('contract_coi_files') 
        .select('id, file_name, file_path, is_executed_contract')
        .eq('contract_id', contractId)
        .eq('is_executed_contract', false)
        .order('uploaded_at', { ascending: true });

      if (fetchError) throw fetchError;

      const mappedFiles = data ? data.map(mapDbToFile) : [];
      setAttachments(mappedFiles);
      console.log(`[Attachments] Loaded ${mappedFiles.length} general attachments.`);
      
    } catch (err: any) {
      console.error('[Attachments] Error loading general attachments:', err);
      setError(err.message || "Failed to load attachments.");
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to load attachments on mount or when dependencies change
  useEffect(() => {
    loadAttachments();
  }, [contractId, getToken, isAuthLoading]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null); // Clear previous upload errors on new selection
    } else {
      setSelectedFile(null);
    }
  };

  const handleUploadClick = async () => {
    if (!selectedFile || !contractId || !getToken || !user?.supabaseUserId || !user?.primaryEmail || !user?.organizationId) {
        toast.error("Cannot upload. Missing file, contract details, or user information.");
        console.error("Upload check failed:", { selectedFile, contractId, getToken:!!getToken, user });
        return;
    }

    setIsUploading(true);
    setError(null); // Clear previous errors before new upload
    toast.info(`Uploading ${selectedFile.name}...`);

    try {
        const contractService = new ContractService(getToken, user.organizationId);
        const { data, error: uploadError } = await contractService.uploadGeneralAttachment(
            contractId,
            selectedFile,
            user.supabaseUserId,
            user.primaryEmail
        );

        if (uploadError) {
            throw uploadError;
        }

        toast.success(`Attachment ${selectedFile.name} uploaded successfully.`);
        setSelectedFile(null); // Clear selection
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; // Reset file input
        }
        loadAttachments(); // Refresh the list

    } catch (err: any) {
        console.error('[Attachments] Upload error:', err);
        const message = err.message || 'Unknown error';
        toast.error(`Failed to upload attachment: ${message}`);
        setError(`Upload failed: ${message}`); // Set error state to display
    } finally {
        setIsUploading(false);
    }
  };

  // Function to handle download (requires storage access)
  const handleDownload = async (attachment: Attachment) => {
    if (!getToken || !user?.organizationId) { // Also check orgId for service instantiation
      toast.error("Authentication context not available.");
      return;
    }
    toast.info(`Preparing download for ${attachment.name}...`);
    try {
        // Instantiate service to use its download method
        const contractService = new ContractService(getToken, user.organizationId);
        // Use the service's download function, specifying the correct bucket
        const { data, error: downloadError } = await contractService.downloadFile(
            attachment.path, 
            'general-attachments' // <<< Specify correct bucket
        );

        if (downloadError) throw downloadError;
        if (!data) throw new Error("No download data received.");

        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.name;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Download started.");

    } catch (err: any) {
        console.error('[Attachments] Download error:', err);
        toast.error(`Failed to download ${attachment.name}: ${err.message}`);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Attachments</h3>
      
      {/* --- Upload Section --- */}
      <div className="mb-4 p-4 border rounded-lg bg-gray-50 space-y-2">
        {/* Hidden File Input */}
        <Input 
            id="attachment-upload" 
            type="file" 
            onChange={handleFileSelect} // Use handleFileSelect
            className="hidden" // Keep hidden
            ref={fileInputRef}
            disabled={isUploading}
        />
        <div className="flex items-center gap-2">
            {/* Button to Trigger File Selection */} 
            <Button 
                onClick={() => fileInputRef.current?.click()} // Triggers hidden input
                disabled={isUploading} 
                size="sm"
                variant="outline"
                className="flex-shrink-0"
            >
                 <Upload className="h-4 w-4 mr-2" />
                 Choose File
            </Button>
            {/* Display selected file name */} 
            <span className="text-sm text-gray-600 truncate flex-grow">
                {selectedFile ? selectedFile.name : 'No file chosen'}
            </span>
            {/* Action Button to Perform Upload */} 
            <Button 
                onClick={handleUploadClick} // Calls the upload logic
                disabled={!selectedFile || isUploading}
                size="sm"
                className="flex-shrink-0"
            >
                 {isUploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                 ) : (
                    <Upload className="h-4 w-4 mr-2" />
                 )}
                 {isUploading ? 'Uploading...' : 'Upload Attachment'}
            </Button>
        </div>
        {/* Display upload-specific error */} 
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
      {/* --- End Upload Section --- */}

      <div className="space-y-2">
        {isAuthLoading ? (
           <p className="text-sm text-gray-500">Waiting for authentication...</p>
        ) : isLoading ? (
          <div className="flex items-center text-sm text-gray-500">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading attachments...
          </div>
        ) : error ? (
           <p className="text-sm text-red-500">Error: {error}</p>
        ) : attachments.length === 0 ? (
          <p className="text-sm text-gray-500">No attachments found.</p>
        ) : (
          attachments.map((attachment) => (
            <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 overflow-hidden mr-2">
                <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="truncate" title={attachment.name}>{attachment.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDownload(attachment)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
