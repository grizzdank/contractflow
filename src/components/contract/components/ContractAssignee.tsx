import { User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Contract } from "@/domain/types/Contract";

interface ContractAssigneeProps {
  assignedTo: Contract['assignedTo'];
  isEditing: boolean;
  onAssigneeChange: (assignedTo: NonNullable<Contract['assignedTo']>) => void;
}

export function ContractAssignee({ assignedTo, isEditing, onAssigneeChange }: ContractAssigneeProps) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-500">Assigned To</label>
      {isEditing ? (
        <div className="space-y-2">
          <Input
            value={assignedTo?.name || ''}
            onChange={(e) => onAssigneeChange({
              ...assignedTo,
              name: e.target.value
            })}
            placeholder="Name"
            className="mt-1"
          />
          <Input
            value={assignedTo?.email || ''}
            onChange={(e) => onAssigneeChange({
              ...assignedTo,
              email: e.target.value
            })}
            placeholder="Email"
            type="email"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <div>
            <p className="font-medium">{assignedTo?.name}</p>
            <p className="text-sm text-gray-500">{assignedTo?.email}</p>
          </div>
        </div>
      )}
    </div>
  );
}
