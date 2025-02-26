import { useState, useEffect } from "react";
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
import { Contract } from "@/types/contract";
import { contractService } from "@/lib/dataService";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase/client";

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

const Contracts = () => {
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    type: "all",
    department: "all",
  });
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingContract, setIsCreatingContract] = useState(false);

  useEffect(() => {
    const fetchContracts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Attempting to fetch contracts...');
        const { data, error } = await contractService.getContracts();
        console.log('Supabase connection test - Contracts data:', data, 'Error:', error);
        
        if (error) {
          console.error('Error details:', JSON.stringify(error, null, 2));
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          console.error('Error hint:', error.hint);
          throw error;
        }
        
        setContracts(data || []);
      } catch (error: any) {
        console.error('Error fetching contracts:', error);
        console.error('Error type:', typeof error);
        console.error('Error properties:', Object.keys(error));
        
        if (error.code === '42501') {
          setError('Permission denied. RLS policy is blocking access.');
        } else {
          setError('Failed to load contracts');
        }
        
        toast({
          title: "Error",
          description: `Failed to load contracts: ${error.message || 'Unknown error'}`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchContracts();
  }, []);

  const createTestContract = async () => {
    try {
      setIsCreatingContract(true);
      console.log('Creating test contract...');
      
      // Generate a random contract number with prefix CF and 6 digits
      const contractNumber = `CF${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Format dates as YYYY-MM-DD for the date type in Postgres
      const today = new Date();
      const nextYear = new Date();
      nextYear.setFullYear(today.getFullYear() + 1);
      
      const formattedStartDate = today.toISOString().split('T')[0];
      const formattedEndDate = nextYear.toISOString().split('T')[0];
      
      // Use snake_case for database column names and ensure all required fields are provided
      const testContract = {
        contract_number: contractNumber,
        title: "Test Contract",
        vendor: "Test Vendor Inc.",
        amount: 10000,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        status: "Draft",
        type: "services",
        department: "IT",
        creator_id: null, // Set to null to work with anonymous policy
        creator_email: "test@example.com",
        description: "This is a test contract created for testing purposes.",
      };
      
      console.log('Test contract data:', testContract);
      
      const { data, error } = await supabase
        .from('contracts')
        .insert(testContract)
        .select()
        .single();
      
      console.log('Insert response:', { data, error });
      
      if (error) {
        console.error('Error details:', JSON.stringify(error, null, 2));
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error hint:', error.hint);
        throw error;
      }
      
      toast({
        title: "Success",
        description: `Test contract ${contractNumber} created successfully!`,
      });
      
      // Refresh the contracts list
      loadContracts();
    } catch (error: any) {
      console.error('Error creating test contract:', error);
      
      let errorMessage = 'Failed to create test contract';
      if (error.code === '42501') {
        errorMessage = 'Permission denied. RLS policy is blocking the insert operation.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreatingContract(false);
    }
  };

  const loadContracts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await contractService.getContracts();
      
      if (error) throw error;
      setContracts(data || []);
    } catch (err) {
      console.error('Error loading contracts:', err);
      setError('Failed to load contracts');
    } finally {
      setIsLoading(false);
    }
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

  const filteredContracts = contracts.filter((contract) => {
    return (
      (filters.search === "" ||
        contract.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        contract.vendor.toLowerCase().includes(filters.search.toLowerCase()) ||
        contract.contractNumber.toLowerCase().includes(filters.search.toLowerCase())) &&
      (filters.status === "all" || contract.status === filters.status) &&
      (filters.type === "all" || contract.type === filters.type) &&
      (filters.department === "all" || contract.department === filters.department)
    );
  });

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
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          <SelectItem value="IT">IT</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
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
