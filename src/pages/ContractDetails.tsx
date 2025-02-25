
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
  const [contract, setContract] = useState<Contract | null>(null);

  useEffect(() => {
    if (contractNumber) {
      loadContract();
    }
  }, [contractNumber]);

  const loadContract = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('contract_number', contractNumber)
        .single();

      if (error) throw error;

      if (data) {
        // Type assertion to ensure status and type match the expected enum values
        const status = data.status as Contract['status'];
        const type = data.type as Contract['type'];

        setContract({
          id: data.id,
          contractNumber: data.contract_number,
          title: data.title,
          description: data.description,
          vendor: data.vendor,
          amount: data.amount,
          startDate: data.start_date,
          endDate: data.end_date,
          status: status,
          type: type,
          department: data.department,
          accountingCodes: data.accounting_codes,
          vendorEmail: data.vendor_email,
          vendorPhone: data.vendor_phone,
          vendorAddress: data.vendor_address,
          signatoryName: data.signatory_name,
          signatoryEmail: data.signatory_email,
          attachments: [],  // We'll need to implement attachment loading separately
          comments: [],     // We'll need to implement comments loading separately
          creatorEmail: data.creator_email,
          creatorId: data.creator_id,
          createdAt: data.created_at
        });
      }
    } catch (error) {
      console.error('Error loading contract:', error);
    }
  };

  const canEdit = true;

  const handleSave = async () => {
    if (!contract) return;

    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          title: contract.title,
          description: contract.description,
          status: contract.status,
        })
        .eq('contract_number', contractNumber);

      if (error) throw error;
      
      setIsEditing(false);
    } catch (error) {
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
