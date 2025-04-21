import { Calendar, User } from "lucide-react";
import { Contract } from "@/domain/types/Contract";

interface ContractDatesProps {
  department: string;
  type: string;
  startDate: string;
  endDate: string;
}

export function ContractDates({ department, type, startDate, endDate }: ContractDatesProps) {
  return (
    <>
      <div>
        <label className="text-sm font-medium text-gray-500">Department</label>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <p>{department}</p>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-500">Type</label>
        <p className="capitalize">{type.replace(/_/g, " ")}</p>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-500">Start Date</label>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <p>{new Date(startDate).toLocaleDateString()}</p>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-500">End Date</label>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <p>{new Date(endDate).toLocaleDateString()}</p>
        </div>
      </div>
    </>
  );
}
