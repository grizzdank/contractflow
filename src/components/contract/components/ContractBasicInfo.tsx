
import { Building, DollarSign } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Contract } from "@/types/contract";

interface ContractBasicInfoProps {
  contract: {
    contractNumber: string;
    description: string;
    vendor: string;
    amount: number;
  };
  isEditing: boolean;
  onDescriptionChange: (description: string) => void;
}

export function ContractBasicInfo({ contract, isEditing, onDescriptionChange }: ContractBasicInfoProps) {
  return (
    <>
      <div>
        <label className="text-sm font-medium text-gray-500">Contract Number</label>
        <p className="text-lg font-mono font-medium">{contract.contractNumber}</p>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-500">Description</label>
        {isEditing ? (
          <Textarea
            value={contract.description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="mt-1"
          />
        ) : (
          <p className="text-gray-700">{contract.description}</p>
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
    </>
  );
}
