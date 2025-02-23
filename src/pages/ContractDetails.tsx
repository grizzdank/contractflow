import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navigation from "@/components/Navigation";
import { FileText, Building, DollarSign, Calendar, User, CheckCircle, Clock, Edit, Users, Send, Download } from "lucide-react";
import { COIFileUpload } from "@/components/COIFileUpload";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  description: string;
  vendor: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: "Requested" | "Draft" | "Review" | "InSignature" | "ExecutedActive" | "ExecutedExpired";
  type: "grant" | "services" | "goods" | "sponsorship" | "amendment" | "vendor_agreement" | "interagency_agreement" | "mou" | "sole_source" | "rfp";
  department: string;
  assignedTo?: {
    name: string;
    email: string;
  };
  accountingCodes: string;
  vendorEmail: string;
  vendorPhone: string;
  vendorAddress: string;
  signatoryName: string;
  signatoryEmail: string;
  attachments: Array<{
    name: string;
    url: string;
  }>;
  comments: Comment[];
}

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
    
    const comment: Comment = {
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

  const getStatusIcon = (status: Contract['status']) => {
    if (!status) return null;
    
    switch (status) {
      case 'ExecutedActive':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ExecutedExpired':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'Draft':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'Review':
        return <FileText className="h-4 w-4 text-yellow-500" />;
      case 'InSignature':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'Requested':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: Contract['status']) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status) {
      case 'ExecutedActive':
        return 'bg-green-100 text-green-800';
      case 'ExecutedExpired':
        return 'bg-gray-100 text-gray-800';
      case 'Draft':
        return 'bg-blue-100 text-blue-800';
      case 'Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'InSignature':
        return 'bg-purple-100 text-purple-800';
      case 'Requested':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          <header className="text-center space-y-4">
            <div className="inline-block px-4 py-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-full text-sm font-medium">
              Contract Details
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-orange-600 bg-clip-text text-transparent">
              {isEditing ? (
                <Input 
                  value={contract.title}
                  onChange={(e) => setContract(prev => ({ ...prev, title: e.target.value }))}
                  className="text-center text-4xl font-bold"
                />
              ) : contract.title}
            </h1>
            {canEdit && (
              <Button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                variant="outline"
                className="mt-4"
              >
                {isEditing ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Contract
                  </>
                )}
              </Button>
            )}
          </header>

          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Contract Number</label>
                  <p className="text-lg font-mono font-medium">{contract.contractNumber}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  {isEditing ? (
                    <Textarea
                      value={contract.description}
                      onChange={(e) => setContract(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-gray-700">{contract.description}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <Select
                        value={contract.status}
                        onValueChange={(value: Contract['status']) => 
                          setContract(prev => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Review">Review</SelectItem>
                          <SelectItem value="InSignature">In Signature</SelectItem>
                          <SelectItem value="ExecutedActive">Executed Active</SelectItem>
                          <SelectItem value="ExecutedExpired">Executed Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                          contract.status
                        )}`}
                      >
                        {getStatusIcon(contract.status)}
                        {contract.status === 'InSignature' ? 'In Signature' : contract.status}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned To</label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={contract.assignedTo?.name || ''}
                        onChange={(e) => setContract(prev => ({
                          ...prev,
                          assignedTo: {
                            ...prev.assignedTo,
                            name: e.target.value
                          }
                        }))}
                        placeholder="Name"
                        className="mt-1"
                      />
                      <Input
                        value={contract.assignedTo?.email || ''}
                        onChange={(e) => setContract(prev => ({
                          ...prev,
                          assignedTo: {
                            ...prev.assignedTo,
                            email: e.target.value
                          }
                        }))}
                        placeholder="Email"
                        type="email"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium">{contract.assignedTo?.name}</p>
                        <p className="text-sm text-gray-500">{contract.assignedTo?.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Vendor</label>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <p>{contract.vendor}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <p>${contract.amount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <p>{contract.department}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="capitalize">{contract.type.replace(/_/g, " ")}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Start Date</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p>{new Date(contract.startDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">End Date</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p>{new Date(contract.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium mb-4">Certificate of Insurance (COI) Files</h3>
                <COIFileUpload
                  contractId={contractNumber || ''}
                  files={coiFiles}
                  onFileUploaded={loadCOIFiles}
                  onFileDeleted={loadCOIFiles}
                />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Attachments</h3>
                <div className="space-y-2">
                  {contract.attachments.map((attachment) => (
                    <div key={attachment.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span>{attachment.name}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Comments</h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={addComment}>
                      <Send className="h-4 w-4 mr-2" />
                      Post
                    </Button>
                  </div>
                  <div className="space-y-4 mt-4">
                    {contract.comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{comment.userName}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(comment.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ContractDetails;
