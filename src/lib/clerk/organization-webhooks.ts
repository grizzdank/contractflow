import { supabase } from '../supabase/client';
import { mapClerkRoleToDbRole } from '../auth/roleMappings';

interface OrganizationWebhookEvent {
  data: {
    id: string;
    name: string;
    slug: string;
    created_at: number;
    updated_at: number;
    members_count?: number;
    logo_url?: string;
    domain?: string;
  };
  object: string;
  type: string;
}

interface OrganizationMembershipWebhookEvent {
  data: {
    id: string;
    role: string;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
    public_user_data: {
      user_id: string;
      first_name?: string;
      last_name?: string;
      email_addresses: Array<{
        email_address: string;
        verification: {
          status: string;
        };
      }>;
    };
    created_at: number;
    updated_at: number;
  };
  object: string;
  type: string;
}

/**
 * Handle organization creation in Supabase when a new organization is created in Clerk
 */
export async function handleOrganizationCreated(event: OrganizationWebhookEvent) {
  const { data: org } = event;

  try {
    const { error: orgError } = await supabase
      .from('organizations')
      .insert([{
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo_url: org.logo_url,
        domain: org.domain,
        created_at: new Date(org.created_at).toISOString(),
        updated_at: new Date(org.updated_at).toISOString(),
      }]);

    if (orgError) {
      throw orgError;
    }

    console.log('Successfully created organization in Supabase:', org.id);
  } catch (error) {
    console.error('Error creating organization in Supabase:', error);
    throw error;
  }
}

/**
 * Handle organization updates in Supabase when organization data changes in Clerk
 */
export async function handleOrganizationUpdated(event: OrganizationWebhookEvent) {
  const { data: org } = event;

  try {
    const { error: orgError } = await supabase
      .from('organizations')
      .update({
        name: org.name,
        slug: org.slug,
        logo_url: org.logo_url,
        domain: org.domain,
        updated_at: new Date(org.updated_at).toISOString(),
      })
      .eq('id', org.id);

    if (orgError) {
      throw orgError;
    }

    console.log('Successfully updated organization in Supabase:', org.id);
  } catch (error) {
    console.error('Error updating organization in Supabase:', error);
    throw error;
  }
}

/**
 * Handle organization deletion in Supabase when an organization is deleted from Clerk
 */
export async function handleOrganizationDeleted(event: OrganizationWebhookEvent) {
  const { data: org } = event;

  try {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', org.id);

    if (error) {
      throw error;
    }

    console.log('Successfully deleted organization from Supabase:', org.id);
  } catch (error) {
    console.error('Error deleting organization from Supabase:', error);
    throw error;
  }
}

/**
 * Handle organization membership creation in Supabase
 */
export async function handleOrgMembershipCreated(event: OrganizationMembershipWebhookEvent) {
  const { data: membership } = event;
  const primaryEmail = membership.public_user_data.email_addresses.find(email => 
    email.verification.status === 'verified'
  )?.email_address;

  if (!primaryEmail) {
    console.error('No verified email found for user:', membership.public_user_data.user_id);
    return;
  }

  try {
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert([{
        user_id: membership.public_user_data.user_id,
        organization_id: membership.organization.id,
        role: mapClerkRoleToDbRole(membership.role),
        created_at: new Date(membership.created_at).toISOString(),
        updated_at: new Date(membership.updated_at).toISOString(),
      }]);

    if (memberError) {
      throw memberError;
    }

    console.log('Successfully created organization membership in Supabase:', membership.id);
  } catch (error) {
    console.error('Error creating organization membership in Supabase:', error);
    throw error;
  }
}

/**
 * Handle organization membership updates in Supabase
 */
export async function handleOrgMembershipUpdated(event: OrganizationMembershipWebhookEvent) {
  const { data: membership } = event;

  try {
    const { error: memberError } = await supabase
      .from('organization_members')
      .update({
        role: mapClerkRoleToDbRole(membership.role),
        updated_at: new Date(membership.updated_at).toISOString(),
      })
      .eq('user_id', membership.public_user_data.user_id)
      .eq('organization_id', membership.organization.id);

    if (memberError) {
      throw memberError;
    }

    console.log('Successfully updated organization membership in Supabase:', membership.id);
  } catch (error) {
    console.error('Error updating organization membership in Supabase:', error);
    throw error;
  }
}

/**
 * Handle organization membership deletion in Supabase
 */
export async function handleOrgMembershipDeleted(event: OrganizationMembershipWebhookEvent) {
  const { data: membership } = event;

  try {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('user_id', membership.public_user_data.user_id)
      .eq('organization_id', membership.organization.id);

    if (error) {
      throw error;
    }

    console.log('Successfully deleted organization membership from Supabase:', membership.id);
  } catch (error) {
    console.error('Error deleting organization membership from Supabase:', error);
    throw error;
  }
} 