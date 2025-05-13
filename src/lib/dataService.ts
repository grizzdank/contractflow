// This file is deprecated and its contents have been moved to dedicated repositories and services.
// It can be deleted once all components/pages are refactored to use the new services.

// Example: import { ContractService } from '@/services/ContractService';

import { mockContracts } from "@/lib/mockData";
import { supabase } from "@/lib/supabase/client";
import { Contract } from "@/domain/types/Contract";
import { SupabaseClient } from '@supabase/supabase-js';

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
    const { data, error } = await supabase.from('contracts').select('*');
    
    if (error) return { data: null, error };
    
    const mappedContracts = data.map(mapDbToContract);
    return { data: mappedContracts, error: null };
  },
  
  async getContractById(id: string) {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('contract_number', id)
      .maybeSingle();
    
    if (error) return { data: null, error };
    if (!data) return { data: null, error: { message: `Contract ${id} not found` } };
    
    return { data: mapDbToContract(data), error: null };
  },
  
  async saveContract(contract: Contract) {
    const dbContract = mapContractToDb(contract);
    console.log('Mapped contract for DB:', dbContract);
    
    try {
      if (!contract.id) {
        console.log('Inserting new contract into Supabase');
        const { data, error } = await supabase
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
      
      console.log('Updating existing contract in Supabase');
      const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from('contract_coi_files')
      .select('*')
      .eq('contract_id', contractId)
      .order('uploaded_at', { ascending: false });
      
    return { data, error };
  },
  
  async getContractAuditTrail(contractId: string) {
    const { data, error } = await supabase
      .from('contract_audit_trail')
      .select('*')
      .eq('contract_id', contractId)
      .order('performed_at', { ascending: false });
      
    return { data, error };
  },
  
  async uploadCOIFile(contractId: string, file: File, organizationId: string, expirationDate?: string) {
    try {
      const session = await supabase.auth.getSession(); // Get session for user ID
      if (!session.data.session?.user) throw new Error("User not authenticated for COI upload.");
      const userId = session.data.session.user.id;

      const fileExt = file.name.split('.').pop();
      const filePath = `${contractId}/${crypto.randomUUID()}.${fileExt}`;
      
      // Upload to 'coi_files' bucket
      const { error: uploadError } = await supabase.storage
        .from('coi_files') // COI_BUCKET
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Insert into 'contract_coi_files' table (soon to be 'contract_documents')
      const insertPayload = {
          contract_id: contractId,
          file_name: file.name,
          file_path: filePath,
          uploaded_by: userId,
          organization_id: organizationId,
          document_type: 'coi', // New field
          mime_type: file.type,   // New field
          file_size: file.size,   // New field
          expiration_date: expirationDate || null,
          is_executed_contract: undefined, // Ensure old field not sent / is null
      };

      const { data, error: dbError } = await supabase
        .from('contract_coi_files')
        .insert(insertPayload as any) // Use 'as any' until types are regenerated
        .select()
        .single();

      if (dbError) throw dbError;
      
      // Return the full record, which now includes document_type etc.
      return { data, error: null }; 
    } catch (error) {
      console.error('Error uploading COI file:', error);
      return { data: null, error };
    }
  },
  
  async uploadExecutedDocument(contractId: string, file: File) {
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExtension}`;
      const filePath = `${contractId}/${fileName}`;

      console.log(`[dataService] Uploading executed doc. Contract: ${contractId}, Path: ${filePath}`);

      const { data, error } = await supabase.storage
        .from('executed-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('[dataService] Supabase storage upload error:', error);
        throw error;
      }

      console.log('[dataService] Upload successful:', data);

      const { data: insertedData, error: dbError } = await supabase
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
      
      await supabase
        .from('contract_audit_trail')
        .insert({
          contract_id: contractId,
          action_type: 'executed',
          changes: { file_name: file.name },
          performed_by_email: 'current.user@example.com', // TODO: Replace with actual user email
        });
      
      return { data: insertedData, error: null };
    } catch (error: any) {
      console.error('[dataService] Exception during upload:', error);
      const errorResponse = error.message.includes('Bucket not found')
        ? { statusCode: '404', error: 'Bucket not found', message: 'Bucket not found' } 
        : { statusCode: error.statusCode || '500', error: error.error || 'Upload Failed', message: error.message };
      return { data: null, error: errorResponse };
    }
  },
  
  async downloadFile(filePath: string) {
    const { data, error } = await supabase.storage
      .from('coi_files')
      .download(filePath);

    if (error) throw error;
    
    return { data, error: null };
  },
  
  async deleteFile(filePath: string) {
    const { error } = await supabase.storage
      .from('coi_files')
      .remove([filePath]);

    if (error) throw error;
    
    return { data: true, error: null };
  },
  
  async getTeamMembers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');
      
    return { data, error };
  }
}; 