import { supabase } from '../supabase/client';
import { UserRole } from '@/domain/types/Auth';
import { mapClerkRoleToDbRole } from '../auth/roleMappings';

interface WebhookEvent {
  data: {
    id: string;
    email_addresses: Array<{
      email_address: string;
      id: string;
      verification: {
        status: string;
      };
    }>;
    first_name?: string;
    last_name?: string;
    created_at: number;
    updated_at: number;
    organization_memberships?: Array<{
      role: string;
      organization: {
        id: string;
        name: string;
      };
    }>;
  };
  object: string;
  type: string;
}

/**
 * Handle user creation in Supabase when a new user signs up with Clerk
 */
export async function handleUserCreated(event: WebhookEvent) {
  const { data: user } = event;
  const primaryEmail = user.email_addresses.find(email => 
    email.verification.status === 'verified'
  )?.email_address;

  if (!primaryEmail) {
    console.error('No verified email found for user:', user.id);
    return;
  }

  try {
    // Create organization if user has one in Clerk
    let organizationId: string | undefined;
    const orgMembership = user.organization_memberships?.[0];
    
    if (orgMembership?.organization) {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert([{
          id: orgMembership.organization.id,
          name: orgMembership.organization.name,
        }])
        .select('id')
        .single();

      if (orgError && orgError.code !== '23505') { // Ignore unique violation
        throw orgError;
      }

      organizationId = orgMembership.organization.id;
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: user.id,
        email: primaryEmail,
        full_name: [user.first_name, user.last_name].filter(Boolean).join(' '),
        organization_id: organizationId,
      }]);

    if (profileError) {
      throw profileError;
    }

    // Add user to organization with appropriate role
    if (organizationId) {
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert([{
          user_id: user.id,
          organization_id: organizationId,
          role: mapClerkRoleToDbRole(orgMembership?.role || 'basic_member'),
        }]);

      if (memberError) {
        throw memberError;
      }
    }

    console.log('Successfully created user in Supabase:', user.id);
  } catch (error) {
    console.error('Error creating user in Supabase:', error);
    throw error;
  }
}

/**
 * Handle user updates in Supabase when user data changes in Clerk
 */
export async function handleUserUpdated(event: WebhookEvent) {
  const { data: user } = event;
  const primaryEmail = user.email_addresses.find(email => 
    email.verification.status === 'verified'
  )?.email_address;

  if (!primaryEmail) {
    console.error('No verified email found for user:', user.id);
    return;
  }

  try {
    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        email: primaryEmail,
        full_name: [user.first_name, user.last_name].filter(Boolean).join(' '),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      throw profileError;
    }

    // Update organization membership if changed
    const orgMembership = user.organization_memberships?.[0];
    if (orgMembership) {
      const { error: memberError } = await supabase
        .from('organization_members')
        .update({
          role: mapClerkRoleToDbRole(orgMembership.role),
        })
        .eq('user_id', user.id)
        .eq('organization_id', orgMembership.organization.id);

      if (memberError) {
        throw memberError;
      }
    }

    console.log('Successfully updated user in Supabase:', user.id);
  } catch (error) {
    console.error('Error updating user in Supabase:', error);
    throw error;
  }
}

/**
 * Handle user deletion in Supabase when a user is deleted from Clerk
 */
export async function handleUserDeleted(event: WebhookEvent) {
  const { data: user } = event;

  try {
    // Delete user profile (this should cascade to organization_members)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (error) {
      throw error;
    }

    console.log('Successfully deleted user from Supabase:', user.id);
  } catch (error) {
    console.error('Error deleting user from Supabase:', error);
    throw error;
  }
} 