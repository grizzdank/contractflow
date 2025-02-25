import { useEffect, useState } from "react";
import { Clock, User, FileText, Edit, CheckCircle } from "lucide-react";
import { contractService } from "@/lib/dataService";

interface AuditTrailEntry {
  id: string;
  action_type: string;
  changes: any;
  performed_by_email: string;
  performed_at: string;
}

interface ContractAuditTrailProps {
  contractId: string;
}

export function ContractAuditTrail({ contractId }: ContractAuditTrailProps) {
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditTrail();
  }, [contractId]);

  const loadAuditTrail = async () => {
    try {
      const { data, error } = await contractService.getContractAuditTrail(contractId);

      if (error) throw error;
      setAuditTrail(data || []);
    } catch (error) {
      console.error('Error loading audit trail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'edited':
        return <Edit className="h-4 w-4 text-yellow-500" />;
      case 'executed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return <div>Loading audit trail...</div>;
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Audit Trail</h3>
      <div className="space-y-4">
        {auditTrail.map((entry) => (
          <div key={entry.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="mt-1">{getActionIcon(entry.action_type)}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  {entry.performed_by_email}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(entry.performed_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1 capitalize">
                {entry.action_type}
              </p>
              {entry.changes && (
                <div className="mt-2 text-sm text-gray-500">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(entry.changes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
