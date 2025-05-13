import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, FileText, Search, Filter, CheckCircle, Clock, Edit, Users, Loader2, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { Contract } from "@/domain/types/Contract";
import { toast } from "@/components/ui/use-toast";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/client";
import { useClerkAuth } from "@/contexts/ClerkAuthContext";
import { Badge } from "@/components/ui/badge";

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

const getStatusVariant = (status: Contract['status']): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'ExecutedActive': return 'default';
    case 'ExecutedExpired': return 'secondary';
    case 'Draft': return 'outline';
    case 'Review': return 'outline';
    case 'InSignature': return 'outline';
    case 'Requested': return 'outline';
    default: return 'secondary';
  }
};

export const columns: ColumnDef<Contract>[] = [
  {
    accessorKey: "contractNumber",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Contract #
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const contractNumber = row.getValue("contractNumber") as string | undefined | null;
      const linkTarget = row.original.contractNumber; // Use original for link consistency
      
      // Display the contract number if it exists and isn't empty, otherwise show "Pending"
      const displayText = contractNumber ? contractNumber : "Pending"; 
      
      // Only make it a link if the link target (original number) exists
      return linkTarget ? (
        <Link to={`/dashboard/contracts/${linkTarget}`} className="hover:underline text-blue-600">
          {displayText}
        </Link>
      ) : (
        <span>{displayText}</span> // Display as plain text if no valid link target
      );
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Title
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="truncate max-w-xs" title={row.getValue("title")}>{row.getValue("title")}</div>,
  },
  {
    accessorKey: "vendor",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Vendor
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as ContractStatus;
      return (
        <Badge variant={getStatusVariant(status)} className="flex items-center gap-1 w-fit">
          {getStatusIcon(status)}
          {status}
        </Badge>
      );
    },
  },
   {
    accessorKey: "department",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Department
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Start Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue("startDate") as string;
      return date ? new Date(date).toLocaleDateString() : "N/A";
    },
  },
  {
    accessorKey: "endDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        End Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue("endDate") as string;
      return date ? new Date(date).toLocaleDateString() : "N/A";
    },
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
];

const Contracts = () => {
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    type: "all",
    department: "all",
  });
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const navigate = useNavigate();

  const {
    getToken, 
    appUserDetails, 
    isLoading: isAuthContextLoading, 
    contractServiceInstance,
    authError
  } = useClerkAuth();
  
  const organizationId = appUserDetails?.organizationId;

  // Debug: Log initial context values
  useEffect(() => {
    console.log("[Contracts.tsx] Initial context values - isAuthContextLoading:", isAuthContextLoading, "appUserDetails.organizationId:", appUserDetails.organizationId, "contractServiceInstance:", !!contractServiceInstance, "authError:", authError);
  }, []); // Run once on mount

  useEffect(() => {
    console.log("[Contracts.tsx] Main useEffect triggered. isAuthContextLoading:", isAuthContextLoading, "OrgID:", appUserDetails.organizationId, "Service:", !!contractServiceInstance, "AuthError:", authError);

    if (isAuthContextLoading) {
      console.log("[Contracts.tsx] Auth context is loading. Setting local loading true.");
      setIsLoadingContracts(true);
      return;
    }

    // Handle auth errors from context first
    if (authError) {
        console.error("[Contracts.tsx] Auth error from context:", authError.message);
        toast({ title: "Authentication Error", description: authError.message, variant: "destructive" });
        setIsLoadingContracts(false);
        setContracts([]);
        return;
    }

    if (!appUserDetails.organizationId) {
      console.warn("[Contracts.tsx] Organization ID is missing. Cannot load contracts.");
      // Don't toast immediately if auth is still loading, wait for authError or final state
      if (!isAuthContextLoading) { 
        toast({ title: "Configuration Error", description: "Organization ID not found. Cannot load contracts.", variant: "destructive" });
      }
      setIsLoadingContracts(false);
      setContracts([]);
      return;
    }

    if (!contractServiceInstance) {
      console.warn("[Contracts.tsx] Contract service not available. Cannot load contracts.");
      if (!isAuthContextLoading) {
         toast({ title: "Service Error", description: "Contract service not available.", variant: "destructive" });
      }
      setIsLoadingContracts(false);
      setContracts([]);
      return;
    }
    
    console.log("[Contracts.tsx] All checks passed. Fetching contracts for Org ID:", appUserDetails.organizationId);
    setIsLoadingContracts(true); 
    contractServiceInstance.getAllContracts()
      .then(({ data, error }) => {
        if (error) {
          console.error("[Contracts.tsx] Error fetching contracts:", error);
          toast({ title: "Fetch Error", description: error.message || "Failed to fetch contracts.", variant: "destructive" });
          setContracts([]);
        } else if (data) {
          console.log("[Contracts.tsx] Data received from service (already mapped):", data);
          console.log("[Contracts.tsx] Contracts fetched successfully:", data.length, "items.");
          setContracts(data); // Use the data directly
        } else {
          console.log("[Contracts.tsx] No contracts data returned, setting to empty array.");
          setContracts([]);
        }
      })
      .catch(catchError => { 
          console.error("[Contracts.tsx] Caught unexpected error during getAllContracts chain:", catchError);
          toast({ title: "Unexpected Error", description: "An error occurred while trying to fetch contracts.", variant: "destructive" });
          setContracts([]);
      })
      .finally(() => {
        setIsLoadingContracts(false);
        console.log("[Contracts.tsx] Finished contract fetching process.");
      });

  }, [isAuthContextLoading, appUserDetails.organizationId, contractServiceInstance, authError]); // Added authError to dependencies

  // Debounce search updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [filters.search]);

  // Memoize filtered contracts
  const filteredContracts = useMemo(() => {
    console.log('[Contracts] Recomputing filtered contracts');
    const searchLower = debouncedSearch.toLowerCase();
    const deptFilterLower = filters.department.toLowerCase();

    return contracts.filter((contract) => {
      // Only perform search if there's a search term
      const searchMatch = !searchLower || 
        (contract.title?.toLowerCase().includes(searchLower) ||
         contract.vendor?.toLowerCase().includes(searchLower) ||
         contract.description?.toLowerCase().includes(searchLower) ||
         contract.contractNumber?.toLowerCase().includes(searchLower));

      const statusMatch = filters.status === "all" || contract.status === filters.status;
      const typeMatch = filters.type === "all" || contract.type === filters.type;
      const departmentMatch =
        filters.department === "all" ||
        contract.department?.toLowerCase() === deptFilterLower;

      return searchMatch && statusMatch && typeMatch && departmentMatch;
    });
  }, [contracts, debouncedSearch, filters.status, filters.type, filters.department]);

  // Memoize table options
  const tableOptions = useMemo(
    () => ({
      data: filteredContracts,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      onSortingChange: setSorting,
      state: {
        sorting,
      },
      initialState: {
        pagination: {
          pageSize: 10,
        },
      },
    }),
    [filteredContracts, sorting]
  );

  // Initialize table with memoized options
  const table = useReactTable(tableOptions);

  if (isAuthContextLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading user authentication...</p>
      </div>
    );
  }

  if (error) {
     return (
       <div className="flex h-screen items-center justify-center text-red-600">
         <p>{error}</p>
       </div>
     );
   }

  return (
    <div className="flex h-screen">
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold text-gray-800">Contracts</h1>
          <Link to="/dashboard/contracts/request">
            <Button>Request New Contract</Button>
          </Link>
        </div>

        <div className="p-4 mb-6 bg-white shadow-sm rounded-lg border border-gray-200">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="search" className="text-sm font-medium text-gray-700">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by title, vendor..."
                  value={filters.search}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setFilters(prev => ({ ...prev, search: newValue }));
                  }}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value })
                }
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Requested">Requested</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="InSignature">In Signature</SelectItem>
                  <SelectItem value="ExecutedActive">Executed (Active)</SelectItem>
                  <SelectItem value="ExecutedExpired">Executed (Expired)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label htmlFor="type-filter" className="text-sm font-medium text-gray-700">Type</label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters({ ...filters, type: value })}
              >
                <SelectTrigger id="type-filter">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="grant">Grant</SelectItem>
                  <SelectItem value="services">Services (PSA)</SelectItem>
                  <SelectItem value="goods">Goods (PSA)</SelectItem>
                  <SelectItem value="sponsorship">Sponsorship</SelectItem>
                  <SelectItem value="amendment">Amendment</SelectItem>
                  <SelectItem value="vendor_agreement">Vendor Agreement</SelectItem>
                  <SelectItem value="interagency_agreement">Interagency Agreement</SelectItem>
                  <SelectItem value="mou">MOU</SelectItem>
                  <SelectItem value="sole_source">Sole Source</SelectItem>
                  <SelectItem value="rfp">RFP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-1.5">
               <label htmlFor="dept-filter" className="text-sm font-medium text-gray-700">Department</label>
               <Select
                 value={filters.department}
                 onValueChange={(value) =>
                   setFilters({ ...filters, department: value })
                 }
                 disabled={availableDepartments.length === 0}
               >
                 <SelectTrigger id="dept-filter">
                   <SelectValue placeholder="Filter by department" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Departments</SelectItem>
                   {availableDepartments.map((dept) => (
                     <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

          </div>
        </div>

        {isLoadingContracts ? (
          <div className="flex items-center justify-center mt-10">
             <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="ml-2">Loading contracts...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 mt-10">{error}</div>
        ) : (
          <div className="rounded-md border bg-white shadow-sm">
             <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      onClick={() => navigate(`/dashboard/contracts/${row.original.contractNumber}`)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
             <div className="flex items-center justify-between space-x-2 py-4 px-4">
               <div className="flex-1 text-sm text-muted-foreground">
                 {table.getFilteredRowModel().rows.length} total results
               </div>
               <div className="flex items-center space-x-6 lg:space-x-8">
                 <div className="flex items-center space-x-2">
                   <p className="text-sm font-medium">Rows per page</p>
                   <Select
                     value={`${table.getState().pagination.pageSize}`}
                     onValueChange={(value) => {
                       table.setPageSize(Number(value));
                     }}
                   >
                     <SelectTrigger className="h-8 w-[70px]">
                       <SelectValue placeholder={table.getState().pagination.pageSize} />
                     </SelectTrigger>
                     <SelectContent side="top">
                       {[10, 20, 30, 40, 50].map((pageSize) => (
                         <SelectItem key={pageSize} value={`${pageSize}`}>
                           {pageSize}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                   Page {table.getState().pagination.pageIndex + 1} of{" "}
                   {table.getPageCount()}
                 </div>
                 <div className="flex items-center space-x-2">
                   <Button
                     variant="outline"
                     className="hidden h-8 w-8 p-0 lg:flex"
                     onClick={() => table.setPageIndex(0)}
                     disabled={!table.getCanPreviousPage()}
                   >
                     <span className="sr-only">Go to first page</span>
                     <ChevronsLeft className="h-4 w-4" />
                   </Button>
                   <Button
                     variant="outline"
                     className="h-8 w-8 p-0"
                     onClick={() => table.previousPage()}
                     disabled={!table.getCanPreviousPage()}
                   >
                     <span className="sr-only">Go to previous page</span>
                     <ChevronLeft className="h-4 w-4" />
                   </Button>
                   <Button
                     variant="outline"
                     className="h-8 w-8 p-0"
                     onClick={() => table.nextPage()}
                     disabled={!table.getCanNextPage()}
                   >
                     <span className="sr-only">Go to next page</span>
                     <ChevronRight className="h-4 w-4" />
                   </Button>
                   <Button
                     variant="outline"
                     className="hidden h-8 w-8 p-0 lg:flex"
                     onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                     disabled={!table.getCanNextPage()}
                   >
                     <span className="sr-only">Go to last page</span>
                     <ChevronsRight className="h-4 w-4" />
                   </Button>
                 </div>
               </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Contracts;
