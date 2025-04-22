// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

/// <reference types=\"https://deno.land/x/deno/cli/types/v1.37.1/index.d.ts\" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Webhook } from "npm:svix@^1.24.0" // Use npm specifier for Svix
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@^2.43.4'; // Import Supabase client via npm
import { Clerk, createClerkClient } from 'npm:@clerk/clerk-sdk-node@^5.0.12'; // Import Clerk backend SDK via npm

// Import Supabase client (adjust path if necessary, might use Supabase environment vars later)
// For now, let's assume we'll initialize clients inside the handler
// import { supabase } from '../lib/supabase/client' // This path won't work directly in Edge Functions

// Load secrets from environment variables (configured in Supabase dashboard)
const CLERK_WEBHOOK_SECRET = Deno.env.get("CLERK_WEBHOOK_SECRET")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const CLERK_SECRET_KEY = Deno.env.get("CLERK_SECRET_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") // Usually set automatically

// Initialize clients (can be done outside the handler for reuse across invocations)
let supabaseAdminClient: SupabaseClient | null = null;
let clerkClient: Clerk | null = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
} else {
  console.error("[clerk-webhooks] Missing Supabase URL or Service Role Key for admin client initialization.");
}

if (CLERK_SECRET_KEY) {
  clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY });
} else {
  console.error("[clerk-webhooks] Missing Clerk Secret Key for backend client initialization.");
}

// Import handler functions (we'll define these later or import if modularized)
// For now, define dummy handlers inline
async function handleUserCreated(payload: any) {
  console.log("[clerk-webhooks] Processing user.created for Clerk User ID:", payload.data.id);
  const { data: userData } = payload;

  if (!supabaseAdminClient || !clerkClient) {
     throw new Error("Supabase Admin or Clerk Backend client not initialized.");
  }

  const primaryEmail = userData.email_addresses?.find((e: any) => e.id === userData.primary_email_address_id)?.email_address;
  if (!primaryEmail) {
    throw new Error(`No primary email found for Clerk User ID: ${userData.id}`);
  }

  // 1. Create Supabase auth user
  console.log(`[clerk-webhooks] Creating Supabase auth user for email: ${primaryEmail}`);
  const { data: supabaseAuthUser, error: createAuthUserError } = await supabaseAdminClient.auth.admin.createUser({
      email: primaryEmail,
      email_confirm: true, // Assuming Clerk verified email
      // Add other user attributes if needed, like password (though likely not needed if only Clerk login)
  });

  if (createAuthUserError || !supabaseAuthUser?.user) {
    // Handle potential error if user already exists in Supabase Auth (e.g., conflict)
    if (createAuthUserError && createAuthUserError.message.includes('already exists')) {
        console.warn(`[clerk-webhooks] Supabase auth user with email ${primaryEmail} already exists. Attempting to link.`);
        // Attempt to find existing user to link - might need more robust logic
        const { data: existingUser, error: findError } = await supabaseAdminClient.auth.admin.listUsers({ email: primaryEmail });
        if (findError || !existingUser || existingUser.users.length === 0) {
            throw new Error(`Failed to find existing Supabase auth user for email ${primaryEmail} after creation conflict.`);
        }
        // Proceed using the existing user's ID
        supabaseAuthUser.user = existingUser.users[0];
    } else {
        console.error("[clerk-webhooks] Error creating Supabase auth user:", createAuthUserError);
        throw new Error(`Failed to create Supabase auth user: ${createAuthUserError?.message}`);
    }
  }

  const supabaseUserId = supabaseAuthUser.user.id;
  console.log(`[clerk-webhooks] Supabase auth user created/found with ID: ${supabaseUserId}`);

  // 2. Update Clerk metadata
  console.log(`[clerk-webhooks] Updating Clerk user ${userData.id} public metadata with Supabase ID: ${supabaseUserId}`);
  try {
    await clerkClient.users.updateUserMetadata(userData.id, {
        publicMetadata: {
          supabase_id: supabaseUserId,
        },
    });
    console.log(`[clerk-webhooks] Successfully updated Clerk metadata for user ${userData.id}`);
  } catch (clerkUpdateError) {
      console.error(`[clerk-webhooks] Error updating Clerk metadata for user ${userData.id}:`, clerkUpdateError);
      // Decide if this is a fatal error. Maybe proceed but log warning?
      // For now, let's throw to indicate failure.
      throw new Error(`Failed to update Clerk metadata: ${clerkUpdateError.message}`);
  }

  // 3. Create Supabase profile
  console.log(`[clerk-webhooks] Creating Supabase profile for user ID: ${supabaseUserId}`);
  const { error: profileError } = await supabaseAdminClient
    .from('profiles')
    .insert([{
      id: supabaseUserId, // Use Supabase UUID
      email: primaryEmail,
      full_name: [userData.first_name, userData.last_name].filter(Boolean).join(' ') || null,
      // Add other profile fields as needed
    }]);

  if (profileError) {
      console.error(`[clerk-webhooks] Error creating Supabase profile for user ID ${supabaseUserId}:`, profileError);
      // Decide if this is fatal. If auth user was created and metadata updated, maybe just log?
      // For now, let's throw.
      throw new Error(`Failed to create Supabase profile: ${profileError.message}`);
  }

  console.log(`[clerk-webhooks] Successfully synced user ${userData.id} (Supabase ID: ${supabaseUserId})`);
}

async function handleUserUpdated(payload: any) { console.log("TODO: Implement user.updated handler", payload.data.id); }
async function handleUserDeleted(payload: any) { console.log("TODO: Implement user.deleted handler", payload.data.id); }
// Add other handlers (org, membership) as needed

console.log("Clerk webhook handler function initialized and waiting for requests.");

serve(async (req) => {
  console.log(`[clerk-webhooks] Received ${req.method} request`);

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (!CLERK_WEBHOOK_SECRET) {
    console.error("[clerk-webhooks] Missing CLERK_WEBHOOK_SECRET environment variable.");
    return new Response("Internal Server Error: Configuration missing", { status: 500 });
  }

  // Get verification headers
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.warn("[clerk-webhooks] Missing Svix headers.");
    return new Response("Missing webhook verification headers", { status: 400 });
  }

  const headers = req.headers;
  const payloadString = await req.text(); // Read body as text for verification

  // Verify webhook signature using Svix
  const wh = new Webhook(CLERK_WEBHOOK_SECRET);
  let payload: any; // Define payload variable

  try {
    payload = wh.verify(payloadString, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
    console.log(`[clerk-webhooks] Webhook signature verified successfully for event type: ${payload.type}`);
  } catch (err) {
    console.error(`[clerk-webhooks] Webhook signature verification failed: ${err.message}`);
    return new Response("Webhook signature verification failed", { status: 401 });
  }

  // Ensure clients are initialized before processing
  if (!supabaseAdminClient || !clerkClient) {
     console.error("[clerk-webhooks] Clients not initialized. Check environment variables.");
     return new Response("Internal Server Error: Configuration error", { status: 500 });
  }

  // Handle different webhook events
  try {
    switch (payload.type) {
      case "user.created":
        await handleUserCreated(payload);
        break;
      case "user.updated":
        await handleUserUpdated(payload);
        break;
      case "user.deleted":
        await handleUserDeleted(payload);
        break;

      // TODO: Add handlers for organization and membership events if needed
      // case 'organization.created':
      //   await handleOrganizationCreated(payload);
      //   break;
      // ... etc.

      default:
        console.log(`[clerk-webhooks] Unhandled webhook event type: ${payload.type}`);
    }

    return new Response("Webhook processed successfully", { status: 200 });

  } catch (error) {
    console.error(`[clerk-webhooks] Error processing webhook type ${payload.type}:`, error);
    // Log specific error message if available
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[clerk-webhooks] Error details: ${errorMessage}`);
    return new Response(`Error processing webhook: ${errorMessage}`, { status: 500 });
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/clerk-webhooks' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
