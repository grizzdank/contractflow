import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { COIFileUpload } from "@/components/COIFileUpload";
import { Contract } from "@/types/contract";
import { ContractHeader } from "@/components/contract/ContractHeader";
import { ContractDetailsGrid } from "@/components/contract/ContractDetailsGrid";
import { ContractAttachments } from "@/components/contract/ContractAttachments";
import { ContractComments } from "@/components/contract/ContractComments";
import { ContractExecutedDocument } from "@/components/contract/ContractExecutedDocument";
import { ContractAuditTrail } from "@/components/contract/ContractAuditTrail";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { contractService } from "@/lib/dataService";

const ContractDetails = () => {
  const { contractNumber } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [coiFiles, setCoiFiles] = useState<any[]>([]);
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contractNumber) {
      loadContract();
    }
  }, [contractNumber]);

  const loadContract = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await contractService.getContractById(contractNumber);

      if (error) throw error;

      if (!data) {
        setError(`Contract ${contractNumber} not found`);
        return;
      }

      setContract(data);
    } catch (error: any) {
      console.error('Error loading contract:', error);
      setError(error.message || 'Failed to load contract details');
    } finally {
      setIsLoading(false);
    }
  };

  const canEdit = true;

  const handleSave = async () => {
    if (!contract) return;

    try {
      const { error } = await contractService.saveContract(contract);

      if (error) throw error;
      
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error saving contract:', error);
    }
  };

  const addComment = () => {
    if (!newComment.trim() || !contract) return;
    
    const comment = {
      id: crypto.randomUUID(),
      userId: "currentUser",
      userName: "Current User",
      content: newComment,
      timestamp: new Date().toISOString()
    };

    setContract(prev => ({
      ...prev!,
      comments: [...(prev?.comments || []), comment]
    }));
    setNewComment("");
  };

  useEffect(() => {
    if (contractNumber) {
      loadCOIFiles();
    }
  }, [contractNumber]);

  const loadCOIFiles = async () => {
    try {
      const { data, error } = await contractService.getContractCOIFiles(contractNumber!);

      if (error) throw error;
      setCoiFiles(data || []);
    } catch (error) {
      console.error('Error loading COI files:', error);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50 pt-16">
          <div className="max-w-4xl mx-auto space-y-8 fade-in p-6">
            <div>Loading contract details...</div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50 pt-16">
          <div className="max-w-4xl mx-auto space-y-8 fade-in p-6">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => navigate('/contracts')}>
              Back to Contracts
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (!contract) {
    return null;
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50 pt-16">
        <div className="max-w-4xl mx-auto space-y-8 fade-in p-6">
          <ContractHeader
            title={contract.title}
            isEditing={isEditing}
            canEdit={canEdit}
            onEditClick={() => setIsEditing(true)}
            onSaveClick={handleSave}
            onTitleChange={(title) => setContract(prev => ({ ...prev!, title }))}
          />

          <Card className="p-6">
            <ContractDetailsGrid
              contract={contract}
              isEditing={isEditing}
              onContractChange={(updates) => setContract(prev => ({ ...prev!, ...updates }))}
            />
          </Card>

          <Card className="p-6">
            <div className="space-y-8">
              <ContractExecutedDocument
                contractId={contractNumber}
                onDocumentUploaded={loadCOIFiles}
              />

              <div>
                <h3 className="text-lg font-medium mb-4">Certificate of Insurance (COI) Files</h3>
                <COIFileUpload
                  contractId={contractNumber}
                  files={coiFiles}
                  onFileUploaded={loadCOIFiles}
                  onFileDeleted={loadCOIFiles}
                />
              </div>

              <ContractAttachments attachments={contract.attachments} />

              <ContractAuditTrail contractId={contractNumber} />

              <ContractComments
                comments={contract.comments}
                newComment={newComment}
                onNewCommentChange={setNewComment}
                onAddComment={addComment}
              />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ContractDetails;
