import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, FileText, CheckCircle, Edit, Users, ChevronLeft, Download, Send, Plus, ArrowUpRight, PaperclipIcon, MessageSquare } from "lucide-react";
import { Contract } from "@/types/contract";

// Using the same mock data as in the Contracts.tsx file
const MOCK_CONTRACTS: Contract[] = [
  {
    id: "1",
    contractNumber: "CF100001",
    title: "Website Development Agreement",
    vendor: "TechCorp Solutions",
    vendorEmail: "contact@techcorp.com",
    vendorPhone: "555-0123",
    vendorAddress: "123 Tech Street, San Francisco, CA 94105",
    amount: 25000,
    startDate: "2024-03-01",
    endDate: "2024-12-31",
    status: "ExecutedActive",
    type: "service",
    department: "IT",
    description: "Development of company website and CMS",
    accountingCodes: "IT-DEV-2024",
    creatorEmail: "admin@contractflow.com",
    creatorId: "demo-creator-1",
    attachments: [
      { name: "Contract_CF100001.pdf", url: "#" },
      { name: "SOW_CF100001.pdf", url: "#" }
    ],
    signatoryName: "John Smith",
    signatoryEmail: "john.smith@techcorp.com",
    comments: [{
      id: "c1",
      userId: "demo-creator-1",
      userName: "Admin User",
      content: "Standard website development agreement",
      timestamp: "2024-03-01T09:00:00Z"
    }]
  },
  {
    id: "2",
    contractNumber: "CF100002",
    title: "Office Supplies Agreement",
    vendor: "Office Depot",
    vendorEmail: "b2b@officedepot.com",
    vendorPhone: "555-0456",
    vendorAddress: "456 Supply Drive, Chicago, IL 60601",
    amount: 5000,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "ExecutedActive",
    type: "product",
    department: "Operations",
    description: "Annual office supplies contract",
    accountingCodes: "OPS-SUP-2024",
    creatorEmail: "admin@contractflow.com",
    creatorId: "demo-creator-1",
    attachments: [
      { name: "Contract_CF100002.pdf", url: "#" }
    ],
    signatoryName: "Sarah Johnson",
    signatoryEmail: "sarah.johnson@officedepot.com",
    comments: [{
      id: "c2",
      userId: "demo-creator-1",
      userName: "Admin User",
      content: "Annual renewal with standard terms",
      timestamp: "2024-01-01T10:00:00Z"
    }]
  },
  {
    id: "3",
    contractNumber: "CF100003",
    title: "Marketing Consultation",
    vendor: "Brand Builders Inc",
    vendorEmail: "projects@brandbuilders.com",
    vendorPhone: "555-0789",
    vendorAddress: "789 Marketing Ave, New York, NY 10001",
    amount: 15000,
    startDate: "2024-02-01",
    endDate: "2024-07-31",
    status: "Review",
    type: "service",
    department: "Marketing",
    description: "Brand strategy consultation",
    accountingCodes: "MKT-CON-2024",
    creatorEmail: "admin@contractflow.com",
    creatorId: "demo-creator-1",
    attachments: [
      { name: "Draft_Contract_CF100003.pdf", url: "#" },
      { name: "Proposal_CF100003.pdf", url: "#" }
    ],
    signatoryName: "Michael Chen",
    signatoryEmail: "m.chen@brandbuilders.com",
    comments: [{
      id: "c3",
      userId: "demo-creator-1",
      userName: "Admin User",
      content: "Pending legal review of scope changes",
      timestamp: "2024-02-15T14:30:00Z"
    }]
  },
  {
    id: "4",
    contractNumber: "CF100004",
    title: "Software License Agreement",
    vendor: "CloudTech Services",
    vendorEmail: "licenses@cloudtech.com",
    vendorPhone: "555-0321",
    vendorAddress: "321 Cloud Lane, Seattle, WA 98101",
    amount: 8000,
    startDate: "2024-01-15",
    endDate: "2025-01-14",
    status: "Draft",
    type: "license",
    department: "IT",
    description: "Annual cloud software subscription",
    accountingCodes: "IT-SW-2024",
    creatorEmail: "admin@contractflow.com",
    creatorId: "demo-creator-1",
    attachments: [],
    signatoryName: "Lisa Park",
    signatoryEmail: "l.park@cloudtech.com",
    comments: [{
      id: "c4",
      userId: "demo-creator-1",
      userName: "Admin User",
      content: "Initial draft under internal review",
      timestamp: "2024-01-15T11:45:00Z"
    }]
  },
];

const getStatusIcon = (status: Contract['status']) => {
  switch (status) {
    case 'ExecutedActive':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'ExecutedExpired':
      return <Clock className="h-5 w-5 text-gray-500" />;
    case 'Draft':
      return <Edit className="h-5 w-5 text-blue-500" />;
    case 'Review':
      return <FileText className="h-5 w-5 text-yellow-500" />;
    case 'InSignature':
      return <Users className="h-5 w-5 text-purple-500" />;
    case 'Requested':
      return <Clock className="h-5 w-5 text-blue-500" />;
    default:
      return null;
  }
};

const getStatusColor = (status: Contract['status']) => {
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

const ContractDetail = () => {
  const { contractNumber } = useParams();
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState("");
  const [contract, setContract] = useState<Contract | null>(null);
  
  useEffect(() => {
    // Find the contract with the matching contract number
    const foundContract = MOCK_CONTRACTS.find(c => c.contractNumber === contractNumber);
    if (foundContract) {
      setContract(foundContract);
    }
  }, [contractNumber]);

  if (!contract) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50 pt-16">
          <div className="max-w-7xl mx-auto p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold">Contract not found</h2>
              <p className="mt-2 text-gray-600">
                The contract you're looking for doesn't exist or has been removed.
              </p>
              <Button 
                className="mt-6"
                onClick={() => navigate('/demo/contracts')}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Contracts
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50 pt-16">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header with navigation and status */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/demo/contracts')}
                className="mr-4"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{contract.title}</h1>
                <div className="flex items-center mt-1 space-x-2">
                  <span className="text-sm text-gray-500 font-mono">{contract.contractNumber}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-500">{contract.vendor}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full flex items-center gap-2 ${getStatusColor(contract.status)}`}>
                {getStatusIcon(contract.status)}
                <span className="text-sm font-medium">
                  {contract.status === 'InSignature' ? 'In Signature' : 
                   contract.status === 'ExecutedActive' ? 'Active' : 
                   contract.status === 'ExecutedExpired' ? 'Expired' : 
                   contract.status}
                </span>
              </div>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>

          <Tabs defaultValue="details">
            <TabsList className="mb-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Contract Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Contract Type</h3>
                        <p className="mt-1">{contract.type.replace(/_/g, " ").charAt(0).toUpperCase() + contract.type.replace(/_/g, " ").slice(1)}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Department</h3>
                        <p className="mt-1">{contract.department}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Contract Value</h3>
                        <p className="mt-1">${contract.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Accounting Codes</h3>
                        <p className="mt-1">{contract.accountingCodes}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                        <p className="mt-1">{new Date(contract.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                        <p className="mt-1">{new Date(contract.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="pt-4">
                      <h3 className="text-sm font-medium text-gray-500">Description</h3>
                      <p className="mt-1 text-gray-700">{contract.description}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Vendor Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Vendor Name</h3>
                      <p className="mt-1">{contract.vendor}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Contact Email</h3>
                      <p className="mt-1">{contract.vendorEmail}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Contact Phone</h3>
                      <p className="mt-1">{contract.vendorPhone}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Address</h3>
                      <p className="mt-1">{contract.vendorAddress}</p>
                    </div>
                    <div className="pt-4">
                      <h3 className="text-sm font-medium text-gray-500">Signatory</h3>
                      <p className="mt-1">{contract.signatoryName}</p>
                      <p className="text-sm text-gray-500">{contract.signatoryEmail}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Contract Documents</CardTitle>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Upload Document
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {contract.attachments.length > 0 ? (
                    <div className="space-y-4">
                      {contract.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-gray-500 mr-3" />
                            <div>
                              <p className="font-medium">{attachment.name}</p>
                              <p className="text-sm text-gray-500">Added on {new Date().toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <PaperclipIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-gray-500 font-medium">No documents yet</h3>
                      <p className="text-gray-400 text-sm mt-1">Upload contract files to keep everything in one place</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="comments">
              <Card>
                <CardHeader>
                  <CardTitle>Comments & Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contract.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-4 p-3 border-b">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-baseline justify-between">
                            <h4 className="font-medium">{comment.userName}</h4>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-1 text-gray-700">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6">
                    <Textarea
                      placeholder="Add a comment..."
                      className="min-h-[100px]"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="mt-2 flex justify-end">
                      <Button disabled={!newComment.trim()}>
                        <Send className="mr-2 h-4 w-4" />
                        Add Comment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Contract History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4 p-3 border-b">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">Contract created</p>
                        <p className="text-sm text-gray-500">By {contract.creatorEmail} on {new Date(contract.startDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 p-3 border-b">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">Status changed to {contract.status}</p>
                        <p className="text-sm text-gray-500">By {contract.creatorEmail} on {new Date(contract.startDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {contract.comments.map((comment, index) => (
                      <div key={index} className="flex gap-4 p-3 border-b">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-medium">Comment added</p>
                          <p className="text-sm text-gray-500">By {comment.userName} on {new Date(comment.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default ContractDetail; 