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
    cell: ({ row }) => (
      <Link to={`/dashboard/contracts/${row.original.contractNumber}`} className="hover:underline text-blue-600">
        {row.getValue("contractNumber") || "Pending"}
      </Link>
    ),
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

  const { userDetails, getToken, isLoading: isAuthLoading } = useClerkAuth();
  const organizationId = userDetails?.organizationId;

  const loadContracts = useCallback(async () => {
    if (!organizationId || !getToken) {
        console.error("[Contracts] loadContracts called without OrgID or getToken.");
        setError("Cannot load contracts: Missing organization or authentication.");
        setIsLoadingContracts(false);
        return;
    }
    console.log("[Contracts] loadContracts called");
    setIsLoadingContracts(true);
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
      const errorMessage = err.message || 'Unknown error';
      setError(`Failed to load contracts: ${errorMessage}`);
      toast({
        title: "Error Loading Contracts",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingContracts(false);
      console.log('[Contracts] loadContracts finished');
    }
  }, [organizationId, getToken]);

  useEffect(() => {
    console.log(`[Contracts] useEffect triggered. AuthLoading: ${isAuthLoading}, OrgID: ${organizationId}`);

    if (!isAuthLoading && organizationId) {
      console.log("[Contracts] Auth loaded and OrgID present. Calling loadContracts.");
      loadContracts();
    } else if (!isAuthLoading && !organizationId) {
      console.error("[Contracts] Auth loaded, but Organization ID is missing from context. Cannot load contracts.");
      setError("Organization details are missing. Cannot load contracts.");
      setIsLoadingContracts(false);
    } else {
      console.log("[Contracts] Waiting for auth context to load...");
      setIsLoadingContracts(true);
    }
  }, [isAuthLoading, organizationId, loadContracts]);

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

  if (isAuthLoading) {
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
