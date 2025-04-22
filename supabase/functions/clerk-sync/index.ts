// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Webhook } from '../_shared/svix.js' // Import from local shared file (v1.64.1)
import type { WebhookEvent } from 'https://esm.sh/@clerk/clerk-sdk-node@5.0.12' // Use Clerk types

console.log('Clerk Sync Function Initializing')

// Ensure required environment variables are available
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const clerkWebhookSecret = Deno.env.get('CLERK_WEBHOOK_SECRET')

if (!supabaseUrl || !supabaseServiceRoleKey || !clerkWebhookSecret) {
  console.error('Missing required environment variables.')
  // In a real scenario, you might want to throw an error or handle this differently
}

serve(async (req) => {
  if (!supabaseUrl || !supabaseServiceRoleKey || !clerkWebhookSecret) {
     return new Response('Server configuration error: Missing environment variables.', { status: 500 })
  }

  // 1. Verify the request signature
  const wh = new Webhook(clerkWebhookSecret)
  let evt: WebhookEvent | null = null
  const headers = Object.fromEntries(req.headers.entries())
  const payload = await req.text()

  try {
    // svix adds timestamp tolerance automatically
    evt = wh.verify(payload, headers) as WebhookEvent
    console.log('Webhook verified successfully:', evt.type)
  } catch (err) {
    console.error('Error verifying webhook:', err.message)
    return new Response('Error occurred during webhook verification', {
      status: 400,
    })
  }

  // Initialize Supabase admin client
  // Note: Use service_role key for admin actions that bypass RLS
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        // Required for admin client
        autoRefreshToken: false,
        persistSession: false
    }
  })

  // 2. Handle the event based on its type
  const eventType = evt.type
  const eventData = evt.data // Type depends on eventType

  console.log(`Processing event type: ${eventType}`)

  try {
    switch (eventType) {
      case 'organization.created':
      case 'organization.updated': { // Use upsert for both create and update
        // Assuming organizations table has columns: id (TEXT PK), name (TEXT), slug (TEXT)
        // Clerk's eventData for org.created/updated includes id, name, slug
        const { id, name, slug } = eventData;
        console.log(`Upserting organization: ${id} - ${name}`)
        const { error } = await supabaseAdmin
          .from('organizations')
          .upsert({ id: id, name: name, slug: slug }, { onConflict: 'id' }) // Assumes 'id' is the PK or has a UNIQUE constraint

        if (error) throw new Error(`Failed to upsert organization ${id}: ${error.message}`)
        console.log(`Organization ${id} upserted successfully.`)
        break;
      }

      case 'organization.deleted': {
        // Clerk's eventData includes id and object='organization'
        // Note: Consider cascade deletes in your DB schema or handle related data deletion here (e.g., memberships)
        const { id } = eventData;
         if (!id) {
            console.warn('Organization deleted event missing ID.');
            break; // Or handle error appropriately
         }
        console.log(`Deleting organization: ${id}`)
        const { error } = await supabaseAdmin
          .from('organizations')
          .delete()
          .eq('id', id)

        if (error) throw new Error(`Failed to delete organization ${id}: ${error.message}`)
        console.log(`Organization ${id} deleted successfully.`)
        break;
      }


      case 'organizationMembership.created':
      case 'organizationMembership.updated': { // Use upsert for both
         // Clerk's eventData includes organization.id, public_user_data.user_id, role
         const orgId = eventData.organization?.id;
         const userId = eventData.public_user_data?.user_id;
         const role = eventData.role;

         if (!orgId || !userId || !role) {
            console.warn('Org Membership created/updated event missing data:', { orgId, userId, role });
            break; // Or handle error
         }

         console.log(`Upserting membership: User ${userId} in Org ${orgId} with Role ${role}`)
         // Assuming organization_members table has: user_id (TEXT), organization_id (TEXT), role (TEXT)
         // And a composite primary key or unique constraint on (user_id, organization_id)
         const { error } = await supabaseAdmin
          .from('organization_members')
          .upsert({ user_id: userId, organization_id: orgId, role: role }, { onConflict: 'user_id, organization_id' }) // Adjust constraint name if different

         if (error) throw new Error(`Failed to upsert membership for User ${userId} in Org ${orgId}: ${error.message}`)
         console.log(`Membership for User ${userId} in Org ${orgId} upserted successfully.`)
         break;
      }

      case 'organizationMembership.deleted': {
         // Clerk's eventData includes organization.id, public_user_data.user_id
         const orgId = eventData.organization?.id;
         const userId = eventData.public_user_data?.user_id;

         if (!orgId || !userId) {
            console.warn('Org Membership deleted event missing data:', { orgId, userId });
            break; // Or handle error
         }

         console.log(`Deleting membership: User ${userId} from Org ${orgId}`)
        const { error } = await supabaseAdmin
          .from('organization_members')
          .delete()
          .match({ user_id: userId, organization_id: orgId })

        if (error) throw new Error(`Failed to delete membership for User ${userId} in Org ${orgId}: ${error.message}`)
        console.log(`Membership for User ${userId} in Org ${orgId} deleted successfully.`)
        break;
      }


      // Optionally handle user events if needed
      // case 'user.created':
      //   // Handle user creation - potentially upsert into profiles table
      //   const userId = eventData.id;
      //   const email = eventData.email_addresses?.[0]?.email_address;
      //   const firstName = eventData.first_name;
      //   const lastName = eventData.last_name;
      //    if (!userId) break; // Cannot proceed without user ID
      //   console.log(`Upserting user profile: ${userId}`)
      //   // Ensure your profiles table has relevant columns (id, email, first_name, last_name, etc.)
      //   // Make sure 'id' is TEXT and PK/Unique
      //   await supabaseAdmin.from('profiles').upsert({
      //       id: userId,
      //       email: email, // Handle potential undefined email
      //       first_name: firstName,
      //       last_name: lastName
      //       // Add other relevant fields from eventData as needed
      //   }, { onConflict: 'id' })
      //   break;
      // case 'user.updated':
      //    // Similar logic to user.created, using upsert
      //    // Extract relevant fields and upsert into profiles
      //    break;
      // case 'user.deleted':
      //    // Handle user deletion - delete from profiles
      //    const deletedUserId = eventData.id;
      //     if (!deletedUserId) break;
      //    await supabaseAdmin.from('profiles').delete().eq('id', deletedUserId);
      //    break;

      default:
        console.log(`Received unhandled event type: ${eventType}`)
    }

    // 3. Acknowledge receipt of the webhook
    return new Response('Webhook processed successfully', { status: 200 })

  } catch (error) {
      console.error(`Error processing event type ${eventType}:`, error.message);
      // Optionally, inspect the error to see if it's a DB error vs other
      // You might want different status codes depending on the error type
      return new Response(`Error processing webhook event: ${error.message}`, { status: 500 });
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/clerk-sync' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
