import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useClerkAuth } from "@/contexts/ClerkAuthContext";

interface ExecutedDocument {
  id: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
  is_executed_contract?: boolean | null;
  uploaded_by?: string;
  organization_id?: string;
}

interface ContractExecutedDocumentProps {
  contractId: string;
  onDocumentUploaded: () => void;
}

export function ContractExecutedDocument({ contractId, onDocumentUploaded }: ContractExecutedDocumentProps) {
  const { user: clerkUser } = useUser();
  const { userDetails, contractServiceInstance, isLoading: isAuthLoading, error: authError } = useClerkAuth();
  const supabaseUserId = userDetails?.supabaseUserId;
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [executedDocument, setExecutedDocument] = useState<ExecutedDocument | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contractService = contractServiceInstance;

  const loadExecutedDocument = async () => {
    if (!contractId || !contractService) {
        if (!contractService) console.warn("[CED] Contract service instance not available from context yet.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      console.log(`[CED] Loading executed doc for contract: ${contractId}`);
      const { data, error: fetchError } = await contractService.getContractCOIFiles(contractId);

      if (fetchError) throw fetchError;

      const executedDoc = data?.find(file => file.is_executed_contract === true);
      console.log(`[CED] Found executed doc:`, executedDoc);
      setExecutedDocument(executedDoc || null);
    } catch (err: any) {
      const message = err.message || "Failed to load executed document.";
      console.error('[CED] Error loading executed document:', err);
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading && contractService) {
        loadExecutedDocument();
    } else if (!isAuthLoading && !contractService) {
        console.warn("[CED] Auth loaded but contract service instance is still null.");
        setError("Contract service could not be initialized.");
        setIsLoading(false);
    }
  }, [contractId, contractService, isAuthLoading]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUploadClick = async () => {
    if (!selectedFile || !contractService) {
      toast.error("Please select a file first.");
      if (!contractService) toast.error("Service not available from context.");
      return;
    }
    if (!supabaseUserId) {
      toast.error("User database ID not found. Cannot upload.");
      return;
    }
    const userEmail = clerkUser?.primaryEmailAddress?.emailAddress ?? 'unknown@example.com';

    setIsUploading(true);
    setError(null);
    toast.info(`Uploading ${selectedFile.name}...`);

    try {
      console.log(`[CED] Uploading/Replacing file: ${selectedFile.name} for contract ${contractId}`);
      const { data: uploadedData, error: uploadError } = await contractService.uploadExecutedDocument(contractId, selectedFile, supabaseUserId, userEmail);

      if (uploadError) {
        console.error('[CED] Raw upload error:', uploadError);
        const message = (uploadError as any).message || 'Failed to upload executed document.';
        toast.error(`Upload failed: ${message}`);
        setError(`Upload failed: ${message}`);
        throw new Error(message);
      }

      toast.success("Executed document uploaded/replaced successfully!");
      setExecutedDocument(uploadedData as ExecutedDocument);
      setSelectedFile(null);
       if (fileInputRef.current) {
         fileInputRef.current.value = "";
       }
      if (onDocumentUploaded) {
        onDocumentUploaded();
      }
    } catch (err) {
      console.error('[CED] Caught error during file upload process.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!executedDocument?.file_path || !contractService) {
         if (!contractService) toast.error("Service not available from context.");
        return;
    }

    toast.info("Preparing download...");
    try {
      const { data, error: downloadError } = await contractService.downloadFile(executedDocument.file_path);

      if (downloadError || !data) {
          const message = downloadError?.message || 'Failed to download file blob.';
          toast.error(message);
          throw new Error(message);
      }

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
    }
  };

  if (isAuthLoading) {
       return <div>Initializing authentication context...</div>;
  }

  if (authError) {
     return <div className="text-red-500">Authentication Error: {authError.message}</div>;
  }

  if (!contractService && !isAuthLoading) {
      return <div className="text-red-500">Could not initialize contract service. Check auth context logs.</div>;
  }

  if (isLoading) {
      return <div>Loading executed document status...</div>;
  }

  if (error && !executedDocument) {
      return <div className="text-red-500">Error loading document status: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-4">Executed Contract Document</h3>
      <div className="p-4 border rounded-lg bg-white shadow-sm">
        {executedDocument ? (
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <div className="flex items-center gap-2 overflow-hidden mr-2 flex-grow">
              <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="truncate" title={executedDocument.file_name}>{executedDocument.file_name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDownload} className="flex-shrink-0">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-4">No executed document uploaded yet.</p>
        )}

        <div>
            <label htmlFor="executed-contract-upload" className="text-sm font-medium text-gray-700 block mb-2">
                {executedDocument ? 'Replace Executed Document' : 'Upload Executed Document'}
            </label>
            <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
                id="executed-contract-upload"
                ref={fileInputRef}
                disabled={isUploading}
            />
            <div className="flex items-center gap-2">
                <Button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading} 
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0"
                >
                     <Upload className="h-4 w-4 mr-2" />
                     Choose File
                </Button>
                <span className="text-sm text-gray-600 truncate flex-grow">
                    {selectedFile ? selectedFile.name : 'No file chosen'}
                </span>
                <Button 
                    onClick={handleUploadClick}
                    disabled={!selectedFile || isUploading}
                    size="sm"
                    className="flex-shrink-0"
                >
                     {isUploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                     ) : (
                        <Upload className="h-4 w-4 mr-2" />
                     )}
                     {isUploading ? 'Uploading...' : (executedDocument ? 'Replace Document' : 'Upload Document')}
                </Button>
            </div>
             {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
         </div>
      </div>
    </div>
  );
}
