import { Card } from "@/components/ui/card";
import { Contract } from "@/types/contract";
import { ContractStatus } from "@/components/contract/components/ContractStatus";
import { ContractAssignee } from "@/components/contract/components/ContractAssignee";
import { ContractBasicInfo } from "@/components/contract/components/ContractBasicInfo";
import { ContractDates } from "@/components/contract/components/ContractDates";
import { ContractCreator } from "@/components/contract/components/ContractCreator";

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
  if (!contract) {
    return <div>Loading contract details...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <ContractBasicInfo
          contract={contract}
          isEditing={isEditing}
          onDescriptionChange={(description) => onContractChange({ description })}
        />

        <ContractCreator
          creatorEmail={contract.creatorEmail}
          createdAt={contract.createdAt}
        />

        <ContractStatus
          status={contract.status}
          isEditing={isEditing}
          onStatusChange={(status) => onContractChange({ status })}
        />

        <ContractAssignee
          assignedTo={contract.assignedTo}
          isEditing={isEditing}
          onAssigneeChange={(assignedTo) => onContractChange({ assignedTo })}
        />
      </div>

      <div className="space-y-4">
        <ContractDates
          department={contract.department}
          type={contract.type}
          startDate={contract.startDate}
          endDate={contract.endDate}
        />
      </div>
    </div>
  );
}
