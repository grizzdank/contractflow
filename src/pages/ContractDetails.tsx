import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { FileText, Building, DollarSign, Calendar, User, CheckCircle, Clock, Edit, Users } from "lucide-react";

interface Contract {
  id: string;
  contractNumber: string;
  title: string;
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
}

const ContractDetails = () => {
  const { contractNumber } = useParams();

  const contract: Contract = {
    id: "1",
    contractNumber: "001-0224PSA",
    title: "Website Development Agreement",
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
    }
  };

  const getStatusIcon = (status: Contract['status']) => {
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
              {contract.title}
            </h1>
          </header>

          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Contract Number</label>
                  <p className="text-lg font-mono font-medium">{contract.contractNumber}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                        contract.status
                      )}`}
                    >
                      {getStatusIcon(contract.status)}
                      {contract.status === 'InSignature' ? 'In Signature' : contract.status}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned To</label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{contract.assignedTo?.name}</p>
                      <p className="text-sm text-gray-500">{contract.assignedTo?.email}</p>
                    </div>
                  </div>
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
        </div>
      </div>
    </>
  );
};

export default ContractDetails;
