import { Contract } from "@/domain/types/Contract";

export interface IContractService {
  getAllContracts(): Promise<{ data: Contract[] | null; error: any }>;
  getContractByNumber(contractNumber: string): Promise<{ data: Contract | null; error: any }>;
  getContractById(id: string): Promise<{ data: Contract | null; error: any }>;
  saveContract(contract: Contract): Promise<{ data: Contract | null; error: any }>;
} 