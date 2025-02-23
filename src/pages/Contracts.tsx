
import { useState } from "react";
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
import { FileText, Search, Filter } from "lucide-react";
import Navigation from "@/components/Navigation";

interface Contract {
  id: string;
  title: string;
  vendor: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: "active" | "pending" | "expired";
  type: string;
  department: string;
}

const Contracts = () => {
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    type: "all",
    department: "all",
  });

  // Mock data - in a real app this would come from your backend
  const contracts: Contract[] = [
    {
      id: "1",
      title: "Website Development Agreement",
      vendor: "TechCorp Solutions",
      amount: 50000,
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      status: "active",
      type: "services",
      department: "IT",
    },
    {
      id: "2",
      title: "Marketing Services",
      vendor: "Digital Marketing Pro",
      amount: 25000,
      startDate: "2024-03-15",
      endDate: "2025-03-15",
      status: "active",
      type: "marketing",
      department: "Marketing",
    },
    {
      id: "3",
      title: "Cloud Services Agreement",
      vendor: "CloudHost Solutions",
      amount: 75000,
      startDate: "2024-01-01",
      endDate: "2025-06-30",
      status: "active",
      type: "services",
      department: "IT",
    },
  ];

  const filteredContracts = contracts.filter((contract) => {
    return (
      (filters.search === "" ||
        contract.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        contract.vendor.toLowerCase().includes(filters.search.toLowerCase())) &&
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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
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
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
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
                        className="border-b hover:bg-gray-50/50 transition-colors"
                      >
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
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                              ${
                                contract.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : contract.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                          >
                            {contract.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 capitalize">
                          {contract.type}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {contract.department}
                        </td>
                      </tr>
                    ))}
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
