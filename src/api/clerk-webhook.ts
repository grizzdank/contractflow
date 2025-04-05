import { Webhook } from 'svix';
import { 
  handleUserCreated, 
  handleUserUpdated, 
  handleUserDeleted 
} from '@/lib/clerk/webhooks';
import {
  handleOrganizationCreated,
  handleOrganizationUpdated,
  handleOrganizationDeleted,
  handleOrgMembershipCreated,
  handleOrgMembershipUpdated,
  handleOrgMembershipDeleted
} from '@/lib/clerk/organization-webhooks';

// Webhook secret from environment variable
const webhookSecret = import.meta.env.VITE_CLERK_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('Missing Clerk webhook secret. Please check your .env file.');
}

export async function handleWebhook(request: Request) {
  // Verify the webhook signature
  const svix_id = request.headers.get('svix-id');
  const svix_timestamp = request.headers.get('svix-timestamp');
  const svix_signature = request.headers.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing webhook verification headers', { status: 400 });
  }

  try {
    const payload = await request.json();
    const body = JSON.stringify(payload);

    // Verify webhook signature using Svix
    const wh = new Webhook(webhookSecret);
    try {
      wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Webhook signature verification failed', { status: 401 });
    }

    console.log('Received webhook event:', payload.type);

    // Handle different webhook events
    switch (payload.type) {
      // User events
      case 'user.created':
        await handleUserCreated(payload);
        break;
      case 'user.updated':
        await handleUserUpdated(payload);
        break;
      case 'user.deleted':
        await handleUserDeleted(payload);
        break;

      // Organization events
      case 'organization.created':
        await handleOrganizationCreated(payload);
        break;
      case 'organization.updated':
        await handleOrganizationUpdated(payload);
        break;
      case 'organization.deleted':
        await handleOrganizationDeleted(payload);
        break;

      // Organization membership events
      case 'organizationMembership.created':
        await handleOrgMembershipCreated(payload);
        break;
      case 'organizationMembership.updated':
        await handleOrgMembershipUpdated(payload);
        break;
      case 'organizationMembership.deleted':
        await handleOrgMembershipDeleted(payload);
        break;

      default:
        console.log('Unhandled webhook event type:', payload.type);
    }

    return new Response('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Error processing webhook', { status: 500 });
  }
} 