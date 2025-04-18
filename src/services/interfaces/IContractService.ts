import { Contract } from "@/types/contract";

export interface IContractService {
  getAllContracts(): Promise<{ data: Contract[] | null; error: any }>;
  getContractByNumber(contractNumber: string): Promise<{ data: Contract | null; error: any }>;
  getContractById(id: string): Promise<{ data: Contract | null; error: any }>;
  saveContract(contract: Contract): Promise<{ data: Contract | null; error: any }>;
} 