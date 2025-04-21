import { IContractService } from "@/services/interfaces/IContractService";
import { Contract } from "@/domain/types/Contract";
import { ContractRepository } from "@/lib/repositories/ContractRepository";
import { supabase } from "@/lib/supabase/client"; // Import the base client
import { getSupabaseSession } from "@/lib/supabase/utils"; // Corrected import path
import { Database } from "@/lib/supabase/types";

type DbContract = Database['public']['Tables']['contracts']['Row'];
type DbContractInsert = Database['public']['Tables']['contracts']['Insert'];
type DbContractUpdate = Database['public']['Tables']['contracts']['Update'];

// Helper function to map database fields to Contract type
const mapDbToContract = (data: DbContract): Contract => {
  const isValidStatus = (status: string | null): status is Contract['status'] => {
      const validStatuses: Contract['status'][] = ["Requested", "Draft", "Review", "InSignature", "ExecutedActive", "ExecutedExpired"];
      return !!status && validStatuses.includes(status as Contract['status']);
  };
  const isValidType = (type: string | null): type is Contract['type'] => {
      const validTypes: Contract['type'][] = ["grant", "services", "goods", "sponsorship", "amendment", "vendor_agreement", "interagency_agreement", "mou", "sole_source", "rfp"];
      return !!type && validTypes.includes(type as Contract['type']);
  };

  return {
    id: data.id,
    contractNumber: data.contract_number ?? '',
    title: data.title,
    description: data.description ?? undefined,
    vendor: data.vendor,
    amount: data.amount ?? 0,
    startDate: data.start_date ?? '',
    endDate: data.end_date ?? '',
    status: isValidStatus(data.status) ? data.status : "Draft", // Use validated status
    type: isValidType(data.type) ? data.type : "services", // Use validated type
    department: data.department,
    accountingCodes: data.accounting_codes ?? undefined,
    vendorEmail: data.vendor_email ?? undefined,
    vendorPhone: data.vendor_phone ?? undefined,
    vendorAddress: data.vendor_address ?? undefined,
    signatoryName: data.signatory_name ?? undefined,
    signatoryEmail: data.signatory_email ?? undefined,
    attachments: [],
    comments: [],
    creatorId: data.creator_id ?? undefined,
    creatorEmail: data.creator_email ?? '',
    createdAt: data.created_at ?? new Date().toISOString(),
  };
};

// Helper function to map Contract type to database fields
const mapContractToDb = (contract: Contract): DbContractInsert | DbContractUpdate => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return null;
    try { return new Date(dateString).toISOString(); } catch (e) { console.error('Error formatting date:', dateString, e); return null; }
  };
  const amount = typeof contract.amount === 'string' ? parseFloat(contract.amount) : contract.amount;
  const dbData = {
    contract_number: contract.contractNumber,
    title: contract.title,
    description: contract.description,
    vendor: contract.vendor,
    amount: amount,
    start_date: formatDate(contract.startDate),
    end_date: formatDate(contract.endDate),
    status: contract.status,
    type: contract.type,
    department: contract.department,
    accounting_codes: contract.accountingCodes,
    vendor_email: contract.vendorEmail,
    vendor_phone: contract.vendorPhone,
    vendor_address: contract.vendorAddress,
    signatory_name: contract.signatoryName,
    signatory_email: contract.signatoryEmail,
    creator_id: contract.creatorId,
    creator_email: contract.creatorEmail,
  };
  Object.keys(dbData).forEach(key => dbData[key as keyof typeof dbData] === undefined && delete dbData[key as keyof typeof dbData]);
  if (contract.id) { return { id: contract.id, ...dbData } as DbContractUpdate; }
  return dbData as DbContractInsert;
};

export class ContractService implements IContractService {
  async getAllContracts(): Promise<{ data: Contract[] | null; error: any }> {
    try {
      const session = await getSupabaseSession();
      if (!session) throw new Error("User not authenticated");
      const { data, error } = await ContractRepository.getAllContracts(supabase);
      if (error) return { data: null, error };
      const mappedContracts = data?.map(mapDbToContract) ?? [];
      return { data: mappedContracts, error: null };
    } catch (error) {
      console.error("Error getting all contracts:", error);
      return { data: null, error };
    }
  }

  async getContractByNumber(contractNumber: string): Promise<{ data: Contract | null; error: any }> {
    try {
      const session = await getSupabaseSession();
      if (!session) throw new Error("User not authenticated");
      const { data, error } = await ContractRepository.getContractByNumber(supabase, contractNumber);
      if (error) return { data: null, error };
      return { data: data ? mapDbToContract(data) : null, error: null };
    } catch (error) {
      console.error(`Error getting contract by number ${contractNumber}:`, error);
      return { data: null, error };
    }
  }

  async getContractById(id: string): Promise<{ data: Contract | null; error: any }> {
    try {
      const session = await getSupabaseSession();
      if (!session) throw new Error("User not authenticated");
      const { data, error } = await ContractRepository.getContractById(supabase, id);
      if (error) return { data: null, error };
      return { data: data ? mapDbToContract(data) : null, error: null };
    } catch (error) {
      console.error(`Error getting contract by id ${id}:`, error);
      return { data: null, error };
    }
  }

  async saveContract(contract: Contract): Promise<{ data: Contract | null; error: any }> {
    try {
      const session = await getSupabaseSession();
      if (!session) throw new Error("User not authenticated");
      const dbContract = mapContractToDb(contract);
      let result: { data: DbContract | null; error: any };
      if (contract.id) {
        result = await ContractRepository.updateContract(supabase, contract.id, dbContract as DbContractUpdate);
      } else {
        if (!dbContract.creator_id || !dbContract.creator_email) {
            const user = session.user;
            if (!user?.id || !user.email) {
                throw new Error("User ID or email not available in session for creating contract");
            }
            dbContract.creator_id = user.id;
            dbContract.creator_email = user.email;
        }
        result = await ContractRepository.createContract(supabase, dbContract as DbContractInsert);
      }
      if (result.error) return { data: null, error: result.error };
      return { data: result.data ? mapDbToContract(result.data) : null, error: null };
    } catch (error) {
      console.error("Error saving contract:", error);
      return { data: null, error };
    }
  }
} 