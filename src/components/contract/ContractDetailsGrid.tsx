
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Building, Calendar, DollarSign, User, CheckCircle, Clock, Edit, FileText, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Contract } from "@/types/contract";

interface ContractDetailsGridProps {
  contract: Contract | null;
  isEditing: boolean;
  onContractChange: (updates: Partial<Contract>) => void;
}

export function ContractDetailsGrid({
  contract,
  isEditing,
  onContractChange,
}: ContractDetailsGridProps) {
  // Early return with loading state if contract is null
  if (!contract) {
    return <div>Loading contract details...</div>;
  }

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

  return (
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
              onChange={(e) => onContractChange({ description: e.target.value })}
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
                  onContractChange({ status: value })
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
                onChange={(e) => onContractChange({
                  assignedTo: {
                    ...contract.assignedTo,
                    name: e.target.value
                  }
                })}
                placeholder="Name"
                className="mt-1"
              />
              <Input
                value={contract.assignedTo?.email || ''}
                onChange={(e) => onContractChange({
                  assignedTo: {
                    ...contract.assignedTo,
                    email: e.target.value
                  }
                })}
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
  );
}
