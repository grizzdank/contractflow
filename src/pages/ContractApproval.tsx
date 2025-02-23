
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ContractApproval = () => {
  const { toast } = useToast();
  const [approvalComment, setApprovalComment] = useState("");

  const handleApprove = () => {
    toast({
      title: "Contract Approved",
      description: "The contract request has been approved and the requestor has been notified.",
    });
  };

  const handleReject = () => {
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
            {/* Contract details will be displayed here */}
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
        </Card>
      </div>
    </div>
  );
};

export default ContractApproval;
