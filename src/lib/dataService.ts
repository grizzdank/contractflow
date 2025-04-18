// This file is deprecated and its contents have been moved to dedicated repositories and services.
// It can be deleted once all components/pages are refactored to use the new services.

// Example: import { ContractService } from '@/services/ContractService';

import { mockContracts } from "./mockData";
import { supabase } from "./supabase/client";
import { Contract } from "@/types/contract";
import { useClerk } from "@clerk/clerk-react";

// Toggle this flag to switch between mock and real data
export const USE_MOCK_DATA = false;

// Helper function to get Supabase client with Clerk session
async function getSupabaseWithAuth() {
  const { session } = useClerk();
  const token = await session?.getToken({
    template: 'supabase'
  });
  
  if (token) {
    supabase.auth.setSession({
      access_token: token,
      refresh_token: '',
    });
  }
  
  return supabase;
}

// Helper function to map database fields to Contract type
const mapDbToContract = (data: any): Contract => {
  return {
    id: data.id,
    contractNumber: data.contract_number,
    title: data.title,
    description: data.description,
    vendor: data.vendor,
    amount: data.amount,
    startDate: data.start_date,
    endDate: data.end_date,
    status: data.status,
    type: data.type,
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

// Helper function to map Contract type to database fields
const mapContractToDb = (contract: Contract): any => {
  // Ensure dates are in the correct format for Supabase
  const formatDate = (dateString: string) => {
    try {
      // Parse the date and return in ISO format
      return new Date(dateString).toISOString();
    } catch (e) {
      console.error('Error formatting date:', dateString, e);
      return dateString; // Return original if parsing fails
    }
  };

  // Ensure amount is a number
  const amount = typeof contract.amount === 'string' 
    ? parseFloat(contract.amount as string) 
    : contract.amount;

  return {
    id: contract.id,
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
    created_at: formatDate(contract.createdAt)
  };
};

export const contractService = {
  async getContracts() {
    if (USE_MOCK_DATA) {
      // Get any submitted contract from localStorage
      const submittedContract = localStorage.getItem('submittedContract');
      let contracts = [...mockContracts];
      
      if (submittedContract) {
        const parsedContract = JSON.parse(submittedContract);
        contracts = [parsedContract, ...contracts];
      }
      
      return { data: contracts, error: null };
    }
    
    const supabaseClient = await getSupabaseWithAuth();
    const { data, error } = await supabaseClient.from('contracts').select('*');
    
    if (error) return { data: null, error };
    
    // Map database fields to Contract type
    const mappedContracts = data.map(mapDbToContract);
    return { data: mappedContracts, error: null };
  },
  
  async getContractById(id: string) {
    if (USE_MOCK_DATA) {
      // First check localStorage for submitted contract
      const submittedContract = localStorage.getItem('submittedContract');
      if (submittedContract) {
        const parsedContract = JSON.parse(submittedContract);
        if (parsedContract.id === id || parsedContract.contractNumber === id) {
          return { data: parsedContract, error: null };
        }
      }
      
      // Then check mock contracts
      const contract = mockContracts.find(c => c.id === id || c.contractNumber === id);
      return { 
        data: contract || null, 
        error: contract ? null : { message: `Contract ${id} not found` }
      };
    }
    
    const supabaseClient = await getSupabaseWithAuth();
    const { data, error } = await supabaseClient
      .from('contracts')
      .select('*')
      .eq('contract_number', id)
      .maybeSingle();
    
    if (error) return { data: null, error };
    if (!data) return { data: null, error: { message: `Contract ${id} not found` } };
    
    // Map database fields to Contract type
    return { data: mapDbToContract(data), error: null };
  },
  
  async saveContract(contract: Contract) {
    if (USE_MOCK_DATA) {
      // Save to localStorage
      localStorage.setItem('submittedContract', JSON.stringify(contract));
      return { data: contract, error: null };
    }
    
    // Map Contract type to database fields
    const dbContract = mapContractToDb(contract);
    console.log('Mapped contract for DB:', dbContract);
    
    try {
      const supabaseClient = await getSupabaseWithAuth();
      
      // For new contracts
      if (!contract.id) {
        console.log('Inserting new contract into Supabase');
        const { data, error } = await supabaseClient
          .from('contracts')
          .insert(dbContract)
          .select()
          .single();
        
        console.log('Insert result:', data, 'Error:', error);
        
        if (error) {
          console.error('Supabase insert error details:', JSON.stringify(error, null, 2));
          return { data: null, error };
        }
        return { data: mapDbToContract(data), error: null };
      }
      
      // For updating existing contracts
      console.log('Updating existing contract in Supabase');
      const { data, error } = await supabaseClient
        .from('contracts')
        .update(dbContract)
        .eq('id', contract.id)
        .select()
        .single();
      
      console.log('Update result:', data, 'Error:', error);
      
      if (error) {
        console.error('Supabase update error details:', JSON.stringify(error, null, 2));
        return { data: null, error };
      }
      return { data: mapDbToContract(data), error: null };
    } catch (err) {
      console.error('Unexpected error in saveContract:', err);
      return { data: null, error: err };
    }
  },
  
  async getContractCOIFiles(contractId: string) {
    if (USE_MOCK_DATA) {
      // Return empty array for mock data
      return { data: [], error: null };
    }
    
    const supabaseClient = await getSupabaseWithAuth();
    const { data, error } = await supabaseClient
      .from('contract_coi_files')
      .select('*')
      .eq('contract_id', contractId)
      .order('uploaded_at', { ascending: false });
      
    return { data, error };
  },
  
  async getContractAuditTrail(contractId: string) {
    if (USE_MOCK_DATA) {
      // Return empty array for mock data
      return { data: [], error: null };
    }
    
    const supabaseClient = await getSupabaseWithAuth();
    const { data, error } = await supabaseClient
      .from('contract_audit_trail')
      .select('*')
      .eq('contract_id', contractId)
      .order('performed_at', { ascending: false });
      
    return { data, error };
  },
  
  async uploadCOIFile(contractId: string, file: File, expirationDate?: string) {
    if (USE_MOCK_DATA) {
      // Mock successful upload
      return { 
        data: {
          id: crypto.randomUUID(),
          contract_id: contractId,
          file_name: file.name,
          file_path: `mock/${contractId}/${file.name}`,
          uploaded_at: new Date().toISOString(),
          expiration_date: expirationDate || null
        }, 
        error: null 
      };
    }
    
    try {
      const supabaseClient = await getSupabaseWithAuth();
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${contractId}/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabaseClient.storage
        .from('coi_files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { data, error: dbError } = await supabaseClient
        .from('contract_coi_files')
        .insert({
          contract_id: contractId,
          file_name: file.name,
          file_path: filePath,
          expiration_date: expirationDate || null,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error uploading COI file:', error);
      return { data: null, error };
    }
  },
  
  async uploadExecutedDocument(contractId: string, file: File) {
    if (USE_MOCK_DATA) {
      // Mock successful upload
      return { 
        data: {
          id: crypto.randomUUID(),
          contract_id: contractId,
          file_name: file.name,
          file_path: `mock/${contractId}/executed_${file.name}`,
          uploaded_at: new Date().toISOString(),
          is_executed_contract: true
        }, 
        error: null 
      };
    }
    
    try {
      const supabaseClient = await getSupabaseWithAuth();
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${contractId}/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabaseClient.storage
        .from('executed_documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { data, error: dbError } = await supabaseClient
        .from('contract_coi_files')
        .insert({
          contract_id: contractId,
          file_name: file.name,
          file_path: filePath,
          is_executed_contract: true,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      
      // Add audit trail entry
      await supabaseClient
        .from('contract_audit_trail')
        .insert({
          contract_id: contractId,
          action_type: 'executed',
          changes: { file_name: file.name },
          performed_by_email: 'current.user@example.com', // Should be replaced with actual user email
        });
      
      return { data, error: null };
    } catch (error) {
      console.error('Error uploading executed document:', error);
      return { data: null, error };
    }
  },
  
  async downloadFile(filePath: string) {
    if (USE_MOCK_DATA) {
      // Mock successful download
      return { 
        data: new Blob(['Mock file content'], { type: 'application/octet-stream' }), 
        error: null 
      };
    }
    
    try {
      const supabaseClient = await getSupabaseWithAuth();
      const { data, error } = await supabaseClient.storage
        .from('coi_files')
        .download(filePath);

      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error downloading file:', error);
      return { data: null, error };
    }
  },
  
  async deleteFile(filePath: string) {
    if (USE_MOCK_DATA) {
      // Mock successful deletion
      return { data: true, error: null };
    }
    
    try {
      const supabaseClient = await getSupabaseWithAuth();
      const { error } = await supabaseClient.storage
        .from('coi_files')
        .remove([filePath]);

      if (error) throw error;
      
      return { data: true, error: null };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { data: false, error };
    }
  },
  
  async getTeamMembers() {
    if (USE_MOCK_DATA) {
      // Mock team members
      const mockTeamMembers = [
        {
          id: "1",
          full_name: "John Doe",
          email: "john.doe@example.com",
          department: "Engineering"
        },
        {
          id: "2",
          full_name: "Jane Smith",
          email: "jane.smith@example.com",
          department: "Engineering"
        },
        {
          id: "3",
          full_name: "Robert Johnson",
          email: "robert.johnson@example.com",
          department: "Operations"
        },
        {
          id: "4",
          full_name: "Emily Davis",
          email: "emily.davis@example.com",
          department: "Operations"
        }
      ];
      
      return { data: mockTeamMembers, error: null };
    }
    
    const supabaseClient = await getSupabaseWithAuth();
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .order('full_name');
      
    return { data, error };
  }
}; 