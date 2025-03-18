import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { toast } from "@/components/ui/use-toast";

// Mock data for demo
const MOCK_CONTRACTS: Contract[] = [
  {
    id: "1",
    contractNumber: "CF100001",
    title: "Website Development Agreement",
    vendor: "TechCorp Solutions",
    vendorEmail: "contact@techcorp.com",
    vendorPhone: "555-0123",
    vendorAddress: "123 Tech Street, San Francisco, CA 94105",
    amount: 25000,
    startDate: "2024-03-01",
    endDate: "2024-12-31",
    status: "ExecutedActive",
    type: "service",
    department: "IT",
    description: "Development of company website and CMS",
    accountingCodes: "IT-DEV-2024",
    creatorEmail: "admin@contractflow.com",
    creatorId: "demo-creator-1",
    attachments: [],
    signatoryName: "John Smith",
    signatoryEmail: "john.smith@techcorp.com",
    comments: [{
      id: "c1",
      userId: "demo-creator-1",
      userName: "Admin User",
      content: "Standard website development agreement",
      timestamp: "2024-03-01T09:00:00Z"
    }]
  },
  {
    id: "2",
    contractNumber: "CF100002",
    title: "Office Supplies Agreement",
    vendor: "Office Depot",
    vendorEmail: "b2b@officedepot.com",
    vendorPhone: "555-0456",
    vendorAddress: "456 Supply Drive, Chicago, IL 60601",
    amount: 5000,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "ExecutedActive",
    type: "product",
    department: "Operations",
    description: "Annual office supplies contract",
    accountingCodes: "OPS-SUP-2024",
    creatorEmail: "admin@contractflow.com",
    creatorId: "demo-creator-1",
    attachments: [],
    signatoryName: "Sarah Johnson",
    signatoryEmail: "sarah.johnson@officedepot.com",
    comments: [{
      id: "c2",
      userId: "demo-creator-1",
      userName: "Admin User",
      content: "Annual renewal with standard terms",
      timestamp: "2024-01-01T10:00:00Z"
    }]
  },
  {
    id: "3",
    contractNumber: "CF100003",
    title: "Marketing Consultation",
    vendor: "Brand Builders Inc",
    vendorEmail: "projects@brandbuilders.com",
    vendorPhone: "555-0789",
    vendorAddress: "789 Marketing Ave, New York, NY 10001",
    amount: 15000,
    startDate: "2024-02-01",
    endDate: "2024-07-31",
    status: "Review",
    type: "service",
    department: "Marketing",
    description: "Brand strategy consultation",
    accountingCodes: "MKT-CON-2024",
    creatorEmail: "admin@contractflow.com",
    creatorId: "demo-creator-1",
    attachments: [],
    signatoryName: "Michael Chen",
    signatoryEmail: "m.chen@brandbuilders.com",
    comments: [{
      id: "c3",
      userId: "demo-creator-1",
      userName: "Admin User",
      content: "Pending legal review of scope changes",
      timestamp: "2024-02-15T14:30:00Z"
    }]
  },
  {
    id: "4",
    contractNumber: "CF100004",
    title: "Software License Agreement",
    vendor: "CloudTech Services",
    vendorEmail: "licenses@cloudtech.com",
    vendorPhone: "555-0321",
    vendorAddress: "321 Cloud Lane, Seattle, WA 98101",
    amount: 8000,
    startDate: "2024-01-15",
    endDate: "2025-01-14",
    status: "Draft",
    type: "license",
    department: "IT",
    description: "Annual cloud software subscription",
    accountingCodes: "IT-SW-2024",
    creatorEmail: "admin@contractflow.com",
    creatorId: "demo-creator-1",
    attachments: [],
    signatoryName: "Lisa Park",
    signatoryEmail: "l.park@cloudtech.com",
    comments: [{
      id: "c4",
      userId: "demo-creator-1",
      userName: "Admin User",
      content: "Initial draft under internal review",
      timestamp: "2024-01-15T11:45:00Z"
    }]
  },
];

const getContractSuffix = (type: Contract['type'], amendmentNumber?: string): string => {
  switch (type) {
    case 'service':
    case 'product':
      return 'PSA';
    case 'license':
      return 'LIC';
    case 'nda':
      return 'NDA';
    case 'mou':
      return 'MOU';
    case 'iaa':
      return 'IAA';
    case 'sponsorship':
      return 'SP';
    case 'employment':
      return 'EMP';
    case 'vendor':
      return 'VEN';
    case 'other':
      return 'GEN';
    default:
      return 'PSA';
  }
};

const Contracts = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    type: "all",
    department: "all",
  });

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

  const filteredContracts = MOCK_CONTRACTS.filter((contract) => {
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

  const handleRowClick = (contractNumber: string) => {
    navigate(`/demo/contracts/${contractNumber}`);
  };

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
              <Link to="/demo/contract-request">
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
                      <SelectItem value="service">Services</SelectItem>
                      <SelectItem value="product">Products</SelectItem>
                      <SelectItem value="license">License</SelectItem>
                      <SelectItem value="nda">NDA</SelectItem>
                      <SelectItem value="employment">Employment</SelectItem>
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
                      <SelectItem value="Operations">Operations</SelectItem>
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
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContracts.map((contract) => (
                      <tr
                        key={contract.id}
                        className="border-b hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => handleRowClick(contract.contractNumber)}
                      >
                        <td className="py-3 px-4">
                          <span className="font-mono font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                            {contract.contractNumber}
                          </span>
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
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${getStatusColor(contract.status)}`}
                          >
                            {getStatusIcon(contract.status)}
                            {contract.status === 'InSignature' ? 'In Signature' : 
                              contract.status === 'ExecutedActive' ? 'Active' : 
                              contract.status === 'ExecutedExpired' ? 'Expired' : 
                              contract.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 capitalize">
                          {contract.type.replace(/_/g, " ")}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {contract.department}
                        </td>
                      </tr>
                    ))}
                    {filteredContracts.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-gray-500">
                          No contracts found matching your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Contracts;
