import { mockContracts } from "./mockData";
import { supabase } from "./supabase/client";
import { Contract } from "@/types/contract";

// Toggle this flag to switch between mock and real data
export const USE_MOCK_DATA = true;

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
  return {
    id: contract.id,
    contract_number: contract.contractNumber,
    title: contract.title,
    description: contract.description,
    vendor: contract.vendor,
    amount: contract.amount,
    start_date: contract.startDate,
    end_date: contract.endDate,
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
    created_at: contract.createdAt
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
    
    const { data, error } = await supabase.from('contracts').select('*');
    
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
    
    const { data, error } = await supabase
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
    
    // For new contracts
    if (!contract.id) {
      const { data, error } = await supabase
        .from('contracts')
        .insert(dbContract)
        .select()
        .single();
      
      if (error) return { data: null, error };
      return { data: mapDbToContract(data), error: null };
    }
    
    // For updating existing contracts
    const { data, error } = await supabase
      .from('contracts')
      .update(dbContract)
      .eq('id', contract.id)
      .select()
      .single();
    
    if (error) return { data: null, error };
    return { data: mapDbToContract(data), error: null };
  },
  
  async getContractCOIFiles(contractId: string) {
    if (USE_MOCK_DATA) {
      // Return empty array for mock data
      return { data: [], error: null };
    }
    
    const { data, error } = await supabase
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
    
    const { data, error } = await supabase
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
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${contractId}/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('coi_files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { data, error: dbError } = await supabase
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
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${contractId}/executed_${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('coi_files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { data, error: dbError } = await supabase
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
      await supabase
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
      const { data, error } = await supabase.storage
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
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('coi_files')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('contract_coi_files')
        .delete()
        .eq('file_path', filePath);

      if (dbError) throw dbError;
      
      return { data: true, error: null };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { data: false, error };
    }
  }
};

export const teamService = {
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
    
    // Get current user's department
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      return { data: [], error: { message: "User not authenticated" } };
    }
    
    // Get user's profile to determine department
    const { data: profileData } = await supabase
      .from('profiles')
      .select('department')
      .eq('id', userData.user.id)
      .single();
    
    const userDepartment = profileData?.department || 'Engineering';
    
    // Fetch team members from the same department and Operations
    return await supabase
      .from('profiles')
      .select('*')
      .in('department', [userDepartment, 'Operations']);
  }
}; 