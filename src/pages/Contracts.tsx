import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Search, Filter, CheckCircle, Clock, Edit, Users, User } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Contract } from "@/domain/types/Contract";
import { toast } from "@/components/ui/use-toast";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { ClerkAuthContext } from "@/contexts/ClerkAuthContext";

type ContractStatus = Contract['status'];
type ContractType = 'grant' | 'services' | 'goods' | 'sponsorship' | 'amendment' | 'vendor_agreement' | 'interagency_agreement' | 'mou' | 'sole_source' | 'rfp';

const getContractSuffix = (type: Contract['type'], amendmentNumber?: string): string => {
  switch (type) {
    case 'services':
    case 'goods':
      return 'PSA';
    case 'grant':
      return 'GR';
    case 'sponsorship':
      return 'SP';
    case 'amendment':
      return `Amnd${amendmentNumber || '01'}`;
    case 'vendor_agreement':
      return 'VA';
    case 'interagency_agreement':
      return 'IAA';
    case 'mou':
      return 'MOU';
    case 'sole_source':
      return 'SS';
    case 'rfp':
      return 'RFP';
    default:
      return 'PSA';
  }
};

const mapDbStatusToFilterValue = (dbStatus: string | null | undefined): ContractStatus => {
  switch (dbStatus) {
    case 'new': return 'Requested';
    case 'draft': return 'Draft';
    case 'in_coord': return 'Review';
    case 'in_signature': return 'InSignature';
    case 'active': return 'ExecutedActive';
    case 'executed': return 'ExecutedActive';
    case 'expired': return 'ExecutedExpired';
    default:
      console.warn(`[Contracts] Unmapped DB status: ${dbStatus}. Falling back to 'Requested'.`);
      return 'Requested';
  }
};

const mapDbTypeToFilterValue = (dbType: string | null | undefined): ContractType => {
  switch (dbType) {
    case 'grant': return 'grant';
    case 'service': return 'services';
    case 'goods': return 'goods';
    case 'product': return 'goods';
    case 'sponsorship': return 'sponsorship';
    case 'amendment': return 'amendment';
    case 'vendor': return 'vendor_agreement';
    case 'iaa': return 'interagency_agreement';
    case 'mou': return 'mou';
    case 'sole_source': return 'sole_source';
    case 'rfp': return 'rfp';
    default:
      console.warn(`[Contracts] Unmapped DB type: ${dbType}. Falling back to 'services'.`);
      return 'services';
  }
};

const mapDbToContract = (data: any): Contract => {
  const mappedStatus = mapDbStatusToFilterValue(data.status);
  const mappedType = mapDbTypeToFilterValue(data.type);

  return {
    id: data.id,
    contractNumber: data.contract_number,
    title: data.title,
    description: data.description,
    vendor: data.vendor,
    amount: data.amount,
    startDate: data.start_date,
    endDate: data.end_date,
    status: mappedStatus,
    type: mappedType,
    department: data.department,
    accountingCodes: data.accounting_codes,
    vendorEmail: data.vendor_email,
    vendorPhone: data.vendor_phone,
    vendorAddress: data.vendor_address,
    signatoryName: data.signatory_name,
    signatoryEmail: data.signatory_email,
    attachments: data.attachments || [],
    comments: data.comments || [],
    creatorId: data.creator_id,
    creatorEmail: data.creator_email,
    createdAt: data.created_at
  };
};

const Contracts = () => {
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    type: "all",
    department: "all",
  });
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingContract, setIsCreatingContract] = useState(false);
  
  const { getToken } = useAuth();
  const authContext = useContext(ClerkAuthContext);
  const organizationId = authContext?.authState.user?.organizationId;

  const loadContracts = async () => {
    console.log('[Contracts] loadContracts called');
    if (!getToken) {
      console.error('[Contracts] getToken function not available from useAuth');
      setError('Authentication not ready.');
      setIsLoading(false);
      return;
    }

    if (!organizationId) {
      console.warn('[Contracts] Organization ID not available yet. Cannot fetch contracts.');
      setContracts([]); 
      setIsLoading(false); 
      setError('Organization details not loaded yet.');
      return; 
    }
    console.log(`[Contracts] Fetching contracts for Org ID: ${organizationId}`);

    setIsLoading(true);
    setError(null);
    try {
      const authenticatedSupabase = await createAuthenticatedSupabaseClient(getToken);
      console.log('[Contracts] Authenticated Supabase client created for fetch.');

      const { data, error: fetchError } = await authenticatedSupabase
        .from('contracts')
        .select('*')
        .eq('organization_id', organizationId);

      console.log('[Contracts] Fetch response:', { data, fetchError });

      if (fetchError) {
        console.error('[Contracts] Error fetching contracts:', fetchError);
        throw fetchError;
      }
      
      const mappedContracts = (data || []).map(mapDbToContract);
      setContracts(mappedContracts);
      console.log('[Contracts] Mapped contracts set:', mappedContracts);
      
      const uniqueDepts = Array.from(
        new Set(
          mappedContracts
            .map(c => c.department)
            .filter((dept): dept is string => typeof dept === 'string' && dept.trim() !== '')
        )
      ).sort();
      setAvailableDepartments(uniqueDepts);
      console.log('[Contracts] Available departments set:', uniqueDepts);
      
    } catch (err: any) {
      console.error('[Contracts] Error in loadContracts process:', err);
      setError(`Failed to load contracts: ${err.message || 'Unknown error'}`);
      toast({
        title: "Error Loading Contracts",
        description: err.message || 'An unexpected error occurred.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log('[Contracts] loadContracts finished');
    }
  };

  useEffect(() => {
    console.log('[Contracts] useEffect running');
    loadContracts();
  }, [getToken, organizationId]);

  const createTestContract = async () => {
    alert('createTestContract needs refactoring to use authenticated client and organization ID.');
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

  console.log("[Contracts] Current Filters State:", filters);
  console.log("[Contracts] First Raw Contract Data (if any):", contracts.length > 0 ? contracts[0] : 'N/A');

  const filteredContracts = contracts.filter((contract) => {
    const searchLower = filters.search.toLowerCase();
    const deptFilterLower = filters.department.toLowerCase();

    const titleMatch = contract.title?.toLowerCase().includes(searchLower);
    const vendorMatch = contract.vendor?.toLowerCase().includes(searchLower);
    const numberMatch = contract.contractNumber?.toLowerCase().includes(searchLower);
    
    const statusMatch = filters.status === "all" || contract.status === filters.status;
    const typeMatch = filters.type === "all" || contract.type === filters.type;
    const departmentMatch = filters.department === "all" || contract.department === filters.department;

    return (
      (filters.search === "" || titleMatch || vendorMatch || numberMatch) &&
      statusMatch &&
      typeMatch &&
      departmentMatch
    );
  });

  console.log("[Contracts] Filtered Contracts Count:", filteredContracts.length);

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50 pt-16">
        <div className="max-w-7xl mx-auto space-y-8 fade-in p-6">
          <header className="text-center space-y-4">
            <div className="inline-block px-4 py-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-full text-sm font-medium">
              Contract Tracker
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-orange-600 bg-clip-text text-transparent">
              Active Contracts
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Monitor and manage your ongoing contracts in one place.
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <Button 
                onClick={createTestContract} 
                disabled={isCreatingContract}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isCreatingContract ? "Creating..." : "Create Test Contract"}
              </Button>
              <Link to="/request">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Request New Contract
                </Button>
              </Link>
            </div>
          </header>

          <Card className="p-6">
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md">
                  {error}
                </div>
              )}

              {isLoading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading contracts...
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                      <Input
                        placeholder="Search contracts..."
                        value={filters.search}
                        onChange={(e) =>
                          setFilters({ ...filters, search: e.target.value })
                        }
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-4 flex-wrap sm:flex-nowrap">
                      <Select
                        value={filters.status}
                        onValueChange={(value) =>
                          setFilters({ ...filters, status: value })
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="Requested">Requested</SelectItem>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Review">Review</SelectItem>
                          <SelectItem value="InSignature">In Signature</SelectItem>
                          <SelectItem value="ExecutedActive">Active</SelectItem>
                          <SelectItem value="ExecutedExpired">Expired</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={filters.type}
                        onValueChange={(value) =>
                          setFilters({ ...filters, type: value })
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="grant">Grant</SelectItem>
                          <SelectItem value="services">Services</SelectItem>
                          <SelectItem value="goods">Goods</SelectItem>
                          <SelectItem value="sponsorship">Sponsorship</SelectItem>
                          <SelectItem value="amendment">Amendment</SelectItem>
                          <SelectItem value="vendor_agreement">Vendor Agreement</SelectItem>
                          <SelectItem value="interagency_agreement">InterAgency Agreement</SelectItem>
                          <SelectItem value="mou">MOU</SelectItem>
                          <SelectItem value="sole_source">Sole/Single Source</SelectItem>
                          <SelectItem value="rfp">RFP</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={filters.department}
                        onValueChange={(value) =>
                          setFilters({ ...filters, department: value })
                        }
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {availableDepartments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Contract Number</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Contract</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Vendor</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Start Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">End Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Department</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Created By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredContracts.map((contract) => (
                          <tr
                            key={contract.id}
                            className="border-b hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <Link 
                                to={`/contracts/${contract.contractNumber}`}
                                className="font-mono font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                              >
                                {contract.contractNumber}
                              </Link>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="font-medium text-gray-900">
                                  {contract.title}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {contract.vendor}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              ${contract.amount.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {new Date(contract.startDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {new Date(contract.endDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                  ${getStatusColor(contract.status)}`}
                              >
                                {getStatusIcon(contract.status)}
                                {contract.status === 'InSignature' ? 'In Signature' : contract.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-600 capitalize">
                              {contract.type.replace(/_/g, " ")}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {contract.department}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <div>
                                  <p className="text-sm text-gray-500">{contract.creatorEmail}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredContracts.length === 0 && (
                          <tr>
                            <td colSpan={10} className="text-center py-8 text-gray-500">
                              No contracts found matching your filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Contracts;
