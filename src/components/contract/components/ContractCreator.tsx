
import { UserCircle } from "lucide-react";

interface ContractCreatorProps {
  creatorEmail?: string;
  createdAt?: string;
}

export function ContractCreator({ creatorEmail, createdAt }: ContractCreatorProps) {
  if (!creatorEmail) return null;

  return (
    <div>
      <label className="text-sm font-medium text-gray-500">Created By</label>
      <div className="flex items-center gap-2">
        <UserCircle className="h-4 w-4 text-gray-400" />
        <div>
          <p className="font-medium">{creatorEmail}</p>
          {createdAt && (
            <p className="text-sm text-gray-500">
              {new Date(createdAt).toLocaleDateString()} at{" "}
              {new Date(createdAt).toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
