import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Edit } from "lucide-react";
import { Contract } from "@/domain/types/Contract";

interface ContractHeaderProps {
  contract: Contract;
  isEditing: boolean;
  onEditToggle: () => void;
  onSave: () => void;
}

export function ContractHeader({
  contract,
  isEditing,
  onEditToggle,
  onSave,
}: ContractHeaderProps) {
  return (
    <header className="text-center space-y-4">
      <div className="inline-block px-4 py-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-full text-sm font-medium">
        Contract Details
      </div>
      <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-orange-600 bg-clip-text text-transparent">
        {contract.title}
      </h1>
      <Button
        onClick={() => isEditing ? onSave() : onEditToggle()}
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
            Edit Contract Details
          </>
        )}
      </Button>
    </header>
  );
}
