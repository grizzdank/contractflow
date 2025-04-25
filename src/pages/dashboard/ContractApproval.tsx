import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Building, Calendar, DollarSign, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Navigation from "@/components/Navigation";

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
  contractNumber?: string;
}

const generateContractNumber = (type: string, date: Date = new Date()): string => {
  const sequentialNumber = "001";
  
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  
  let suffix;
  switch (type) {
    case 'services':
    case 'goods':
      suffix = 'PSA';
      break;
    case 'grant':
      suffix = 'GR';
      break;
    case 'sponsorship':
      suffix = 'SP';
      break;
    case 'amendment':
      suffix = 'Amnd01';
      break;
    case 'vendor_agreement':
      suffix = 'VA';
      break;
    case 'interagency_agreement':
      suffix = 'IAA';
      break;
    case 'mou':
      suffix = 'MOU';
      break;
    case 'sole_source':
      suffix = 'SS';
      break;
    case 'rfp':
      suffix = 'RFP';
      break;
    default:
      suffix = 'PSA';
  }

  return `${sequentialNumber}-${month}${year}${suffix}`;
};

const ContractApproval = () => {
  const { toast } = useToast();
  const [approvalComment, setApprovalComment] = useState("");
  
  const [request, setRequest] = useState<ContractRequest>({
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
  });

  const handleApprove = () => {
    const contractNumber = generateContractNumber(request.contractType);
    
    const approvalData = {
      ...request,
      status: "approved",
      contractNumber,
      approvedBy: "John Doe",
      approvalTimestamp: new Date().toISOString(),
      approvalComment: approvalComment
    };

    console.log("Approval data:", approvalData);

    toast({
      title: "Contract Approved",
      description: `Contract ${contractNumber} has been approved and the requestor has been notified.`,
    });
  };

  const handleReject = () => {
    const rejectionData = {
      ...request,
      status: "rejected",
      rejectedBy: "John Doe",
      rejectionTimestamp: new Date().toISOString(),
      rejectionComment: approvalComment
    };

    console.log("Rejection data:", rejectionData);

    toast({
      title: "Contract Rejected",
      description: "The contract request has been rejected and the requestor has been notified.",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRequest({ ...request, sowFile: e.target.files[0] });
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50 pt-16">
        <div className="max-w-3xl mx-auto space-y-8 p-6">
          <div className="space-y-8">
            <header className="text-center space-y-4">
              <div className="inline-block px-4 py-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-full text-sm font-medium">
                Contract Approval
              </div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-orange-600 bg-clip-text text-transparent">
                Review & Edit Contract Request
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
                        <Input
                          value={request.requestTitle}
                          onChange={(e) => setRequest({ ...request, requestTitle: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Description</label>
                        <Textarea
                          value={request.description}
                          onChange={(e) => setRequest({ ...request, description: e.target.value })}
                          className="mt-1"
                          rows={4}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Contract Type</label>
                        <Input
                          value={request.contractType}
                          onChange={(e) => setRequest({ ...request, contractType: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Not to Exceed</label>
                        <div className="relative mt-1">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                          <Input
                            type="number"
                            value={request.nte}
                            onChange={(e) => setRequest({ ...request, nte: e.target.value })}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold mb-4">Vendor Information</h2>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-500">
                          <Building className="inline w-4 h-4 mr-1 text-gray-500" />
                          Vendor Name
                        </label>
                        <Input
                          value={request.vendorName}
                          onChange={(e) => setRequest({ ...request, vendorName: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Contact Email</label>
                        <Input
                          type="email"
                          value={request.vendorEmail}
                          onChange={(e) => setRequest({ ...request, vendorEmail: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Phone</label>
                        <Input
                          type="tel"
                          value={request.vendorPhone}
                          onChange={(e) => setRequest({ ...request, vendorPhone: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Address</label>
                        <Input
                          value={request.vendorAddress}
                          onChange={(e) => setRequest({ ...request, vendorAddress: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold mb-4">Contract Timeline</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">
                        <Calendar className="inline w-4 h-4 mr-1 text-gray-500" />
                        Start Date
                      </label>
                      <Input
                        type="date"
                        value={request.startDate}
                        onChange={(e) => setRequest({ ...request, startDate: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">
                        <Calendar className="inline w-4 h-4 mr-1 text-gray-500" />
                        End Date
                      </label>
                      <Input
                        type="date"
                        value={request.endDate}
                        onChange={(e) => setRequest({ ...request, endDate: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold mb-4">Attachments</h2>
                  <div className="p-4 border-2 border-dashed rounded-lg">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <FileText className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {request.sowFile ? request.sowFile.name : "Click to upload new SOW document"}
                      </span>
                    </label>
                  </div>
                </div>

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
      </div>
    </>
  );
};

export default ContractApproval;
