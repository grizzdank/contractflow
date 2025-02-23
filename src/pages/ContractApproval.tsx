
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Building, Calendar, DollarSign, FileText, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ContractRequest {
  requestTitle: string;
  description: string;
  contractType: string;
  department: string;
  nte: string;
  startDate: string;
  endDate: string;
  vendorName: string;
  vendorEmail: string;
  vendorPhone: string;
  vendorAddress: string;
  sowFile: File | null;
  status: "pending_approval" | "approved" | "rejected";
}

const ContractApproval = () => {
  const { toast } = useToast();
  const [approvalComment, setApprovalComment] = useState("");
  
  // Mock data - in a real app this would come from your backend
  const mockRequest: ContractRequest = {
    requestTitle: "Sample Contract Request",
    description: "This is a sample contract request for demonstration purposes",
    contractType: "services",
    department: "IT",
    nte: "50000",
    startDate: "2024-03-15",
    endDate: "2024-12-31",
    vendorName: "Tech Solutions Inc",
    vendorEmail: "contact@techsolutions.com",
    vendorPhone: "(555) 123-4567",
    vendorAddress: "123 Tech Street, Silicon Valley, CA 94025",
    sowFile: null,
    status: "pending_approval"
  };

  const handleApprove = () => {
    const approvalData = {
      status: "approved",
      approvedBy: "John Doe", // This would come from your auth system
      approvalTimestamp: new Date().toISOString(),
      approvalComment: approvalComment
    };

    // Here you would update the contract request with the approval data
    console.log("Approval data:", approvalData);

    toast({
      title: "Contract Approved",
      description: "The contract request has been approved and the requestor has been notified.",
    });
  };

  const handleReject = () => {
    const rejectionData = {
      status: "rejected",
      rejectedBy: "John Doe", // This would come from your auth system
      rejectionTimestamp: new Date().toISOString(),
      rejectionComment: approvalComment
    };

    // Here you would update the contract request with the rejection data
    console.log("Rejection data:", rejectionData);

    toast({
      title: "Contract Rejected",
      description: "The contract request has been rejected and the requestor has been notified.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50 p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <div className="inline-block px-4 py-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-full text-sm font-medium">
            Contract Approval
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-orange-600 bg-clip-text text-transparent">
            Review Contract Request
          </h1>
        </header>

        <Card className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Request Details</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-500">Title</label>
                    <p className="font-medium">{mockRequest.requestTitle}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Description</label>
                    <p className="text-gray-700">{mockRequest.description}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Contract Type</label>
                    <p className="font-medium capitalize">{mockRequest.contractType.replace('_', ' ')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <div>
                      <label className="text-sm text-gray-500">Not to Exceed</label>
                      <p className="font-medium">${Number(mockRequest.nte).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Vendor Information</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-500" />
                    <div>
                      <label className="text-sm text-gray-500">Vendor Name</label>
                      <p className="font-medium">{mockRequest.vendorName}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Contact Email</label>
                    <p className="text-gray-700">{mockRequest.vendorEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Phone</label>
                    <p className="text-gray-700">{mockRequest.vendorPhone}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Address</label>
                    <p className="text-gray-700">{mockRequest.vendorAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Contract Timeline</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <label className="text-sm text-gray-500">Start Date</label>
                    <p className="font-medium">
                      {new Date(mockRequest.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <label className="text-sm text-gray-500">End Date</label>
                    <p className="font-medium">
                      {new Date(mockRequest.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {mockRequest.sowFile && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Attachments</h2>
                <div className="flex items-center gap-2 text-emerald-600">
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">{mockRequest.sowFile.name}</span>
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Approval Decision</h2>
                <Textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="Add any comments about your decision..."
                  className="w-full"
                  rows={4}
                />
                <div className="flex justify-end gap-4">
                  <Button
                    onClick={handleReject}
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    className="bg-gradient-to-r from-emerald-600 to-green-600"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ContractApproval;
