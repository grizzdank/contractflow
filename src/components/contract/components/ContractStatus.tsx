import { CheckCircle, Clock, Edit, FileText, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Contract } from "@/domain/types/Contract";

interface ContractStatusProps {
  status: Contract['status'];
  isEditing: boolean;
  onStatusChange: (status: Contract['status']) => void;
}

export function ContractStatus({ status, isEditing, onStatusChange }: ContractStatusProps) {
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
    <div>
      <label className="text-sm font-medium text-gray-500">Status</label>
      <div className="flex items-center gap-2">
        {isEditing ? (
          <Select
            value={status}
            onValueChange={onStatusChange}
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
              status
            )}`}
          >
            {getStatusIcon(status)}
            {status === 'InSignature' ? 'In Signature' : status}
          </span>
        )}
      </div>
    </div>
  );
}
