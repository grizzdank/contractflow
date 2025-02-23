import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { COIFileUpload } from "@/components/COIFileUpload";
import { supabase } from "@/integrations/supabase/client";
import { Contract } from "@/types/contract";
import { ContractHeader } from "@/components/contract/ContractHeader";
import { ContractDetailsGrid } from "@/components/contract/ContractDetailsGrid";
import { ContractAttachments } from "@/components/contract/ContractAttachments";
import { ContractComments } from "@/components/contract/ContractComments";
import { ContractExecutedDocument } from "@/components/contract/ContractExecutedDocument";
import { ContractAuditTrail } from "@/components/contract/ContractAuditTrail";

const ContractDetails = () => {
  const { contractNumber } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [coiFiles, setCoiFiles] = useState<any[]>([]);

  const [contract, setContract] = useState<Contract>({
    id: "1",
    contractNumber: "001-0224PSA",
    title: "Website Development Agreement",
    description: "Development of company website with modern features",
    vendor: "TechCorp Solutions",
    amount: 50000,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "ExecutedActive",
    type: "services",
    department: "IT",
    assignedTo: {
      name: "John Doe",
      email: "john.doe@example.com"
    },
    accountingCodes: "IT-2024-001",
    vendorEmail: "contact@techcorp.com",
    vendorPhone: "(555) 123-4567",
    vendorAddress: "123 Tech Street, Silicon Valley, CA 94025",
    signatoryName: "Jane Smith",
    signatoryEmail: "jane.smith@techcorp.com",
    attachments: [
      { name: "Statement of Work.pdf", url: "/documents/sow.pdf" },
      { name: "Contract Draft.pdf", url: "/documents/contract.pdf" }
    ],
    comments: [
      {
        id: "1",
        userId: "user1",
        userName: "John Doe",
        content: "Initial review completed. Ready for legal review.",
        timestamp: "2024-02-20T10:00:00Z"
      }
    ]
  });

  const canEdit = true;

  const handleSave = () => {
    setIsEditing(false);
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    
    const comment = {
      id: crypto.randomUUID(),
      userId: "currentUser",
      userName: "Current User",
      content: newComment,
      timestamp: new Date().toISOString()
    };

    setContract(prev => ({
      ...prev,
      comments: [...prev.comments, comment]
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
      const { data, error } = await supabase
        .from('contract_coi_files')
        .select('*')
        .eq('contract_id', contractNumber)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setCoiFiles(data || []);
    } catch (error) {
      console.error('Error loading COI files:', error);
    }
  };

  if (!contract) {
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
            onTitleChange={(title) => setContract(prev => ({ ...prev, title }))}
          />

          <Card className="p-6">
            <ContractDetailsGrid
              contract={contract}
              isEditing={isEditing}
              onContractChange={(updates) => setContract(prev => ({ ...prev, ...updates }))}
            />
          </Card>

          <Card className="p-6">
            <div className="space-y-8">
              <ContractExecutedDocument
                contractId={contractNumber || ''}
                onDocumentUploaded={loadCOIFiles}
              />

              <div>
                <h3 className="text-lg font-medium mb-4">Certificate of Insurance (COI) Files</h3>
                <COIFileUpload
                  contractId={contractNumber || ''}
                  files={coiFiles}
                  onFileUploaded={loadCOIFiles}
                  onFileDeleted={loadCOIFiles}
                />
              </div>

              <ContractAttachments attachments={contract.attachments} />

              <ContractAuditTrail contractId={contractNumber || ''} />

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
