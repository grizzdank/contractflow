import { createClient, SupabaseClient } from '@supabase/supabase-js';
// Remove useAuth import as it's not used directly here anymore
import { Database } from './types';

// Export environment variables for creating authenticated clients elsewhere
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Note: We use Clerk for authentication, Supabase is only used for database and storage
// let supabase: ReturnType<typeof createClient<Database>>; // Remove mutable let

// Check for env vars immediately
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Missing Supabase environment variables. Please check your .env file.');
  // Consider throwing an error or providing a fallback that clearly indicates the issue
  // For now, log error and proceed cautiously. The app might crash later.
} else {
   // Validate URL format only if URL is present
   try {
      new URL(supabaseUrl);
   } catch (e) {
     console.error(`Invalid Supabase URL format: ${supabaseUrl}. Please check your environment variables.`);
     // Throw error here?
   }
}

// Log the Supabase URL (without the key for security)
console.log('Supabase base client config - URL:', supabaseUrl ? supabaseUrl.split('.co')[0] + '.co' : 'MISSING');


// Create a basic, unauthenticated client instance
// This can be used for operations that don't require user authentication (if any)
// or as a base for creating authenticated clients.
export const supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
  // Keep auth minimal for the base client, as authentication state
  // will be handled by Clerk and injected into authenticated instances.
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false, // Ensure Supabase doesn't try to look for sessions in URL
  },
  // Remove global headers like x-debug-token unless specifically needed for anon client
});

console.log('Base Supabase client initialized (unauthenticated).');


// Utility to decode JWT payload (basic base64 decoding)
function decodeJwtPayload(token: string): any | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding JWT payload:", error);
    return null;
  }
}

// Define the type for the getToken function more specifically if possible
// This matches the type from Clerk's useAuth hook
type GetToken = (options?: { template?: string; skipCache?: boolean; }) => Promise<string | null>;

// Singleton instance for the base client (unauthenticated)
let supabaseBaseClient: SupabaseClient<Database> | null = null;

/**
 * Gets the singleton instance of the unauthenticated Supabase client.
 */
export const getSupabaseBaseClient = (): SupabaseClient<Database> => {
  if (!supabaseBaseClient) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    console.log("Supabase base client config - URL:", supabaseUrl);

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase URL or Anon Key is missing in environment variables.");
    }

    supabaseBaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
            // Recommended settings for SPA
            autoRefreshToken: true,
            persistSession: true, // Typically true for web apps
            detectSessionInUrl: false, // Unless using OAuth redirects
        },
    });
    console.log("Base Supabase client initialized (unauthenticated).");
  }
  return supabaseBaseClient;
};

// Store authenticated clients to potentially reuse or manage them
// For now, just log creation
// const authenticatedClients = new Map<string, SupabaseClient<Database>>();

/**
 * Creates an authenticated Supabase client using a Clerk JWT.
 * IMPORTANT: Avoid calling this repeatedly if possible. Prefer passing the client instance.
 */
export const createAuthenticatedSupabaseClient = async (
    getToken: GetToken
): Promise<SupabaseClient<Database>> => {
    console.log("[createAuthenticatedSupabaseClient] Attempting to create client...");
    if (!getToken) {
        throw new Error("getToken function is required to create an authenticated Supabase client.");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
        throw new Error("Supabase URL is missing in environment variables.");
    }

    console.log("[createAuthenticatedSupabaseClient] Fetching Clerk JWT...");
    const token = await getToken({ skipCache: false });
    console.log(`[createAuthenticatedSupabaseClient] Clerk JWT fetched (first few chars): ${token?.substring(0, 8)}...`);

    if (!token) {
        throw new Error("Failed to get JWT from Clerk. User might not be authenticated.");
    }

    // ---- START JWT DECODING LOG ----
    const decodedPayload = decodeJwtPayload(token);
    if (decodedPayload) {
        console.log("[createAuthenticatedSupabaseClient] Decoded JWT Payload:", decodedPayload);
        console.log(`[createAuthenticatedSupabaseClient] JWT Org ID Claim (org_id): ${decodedPayload.org_id ?? 'Not Found'}`);
        // Add checks for other relevant claims like 'sub' (Supabase User ID), 'exp' (expiration)
        console.log(`[createAuthenticatedSupabaseClient] JWT Subject Claim (sub): ${decodedPayload.sub ?? 'Not Found'}`);
        const expirationTime = decodedPayload.exp ? new Date(decodedPayload.exp * 1000) : 'N/A';
        console.log(`[createAuthenticatedSupabaseClient] JWT Expiration: ${expirationTime}`);
    } else {
        console.warn("[createAuthenticatedSupabaseClient] Could not decode JWT payload.");
    }
    // ---- END JWT DECODING LOG ----

    console.log("[createAuthenticatedSupabaseClient] Creating Supabase client with JWT...");
    // Pass the anon key, even with global auth headers, as the client library seems to require it.
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseAnonKey) {
      // This should ideally have been caught earlier, but double-check.
      throw new Error("Supabase Anon Key is missing in environment variables for authenticated client creation.");
    }
    const authenticatedClient = createClient<Database>(supabaseUrl, supabaseAnonKey, { 
        global: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
        auth: {
            autoRefreshToken: false, // Refresh is handled by Clerk
            persistSession: false, // Session is managed by Clerk
            detectSessionInUrl: false,
        },
    });
    console.log("[createAuthenticatedSupabaseClient] Authenticated Supabase client created successfully.");
    return authenticatedClient;
};

// Remove the old try/catch block and the potentially problematic mock client
// export { supabase }; // Already exported as const 