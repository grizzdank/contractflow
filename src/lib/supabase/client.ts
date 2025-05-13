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

    // We don't need to fetch the token here anymore if using the accessToken factory
    // console.log("[createAuthenticatedSupabaseClient] Fetching Clerk JWT...");
    // const token = await getToken({ skipCache: false }); 
    // console.log(`[createAuthenticatedSupabaseClient] Clerk JWT fetched (first few chars): ${token?.substring(0, 8)}...`);

    // if (!token) {
    //     throw new Error("Failed to get JWT from Clerk. User might not be authenticated.");
    // }

    // ---- JWT DECODING LOG (can be kept for debugging if needed, but token is fetched in accessToken now) ----
    // const decodedPayload = decodeJwtPayload(token); 
    // if (decodedPayload) {
    //     console.log("[createAuthenticatedSupabaseClient] Decoded JWT Payload:", decodedPayload);
    //     console.log(`[createAuthenticatedSupabaseClient] JWT Org ID Claim (org_id): ${decodedPayload.org_id ?? 'Not Found'}`);
    //     console.log(`[createAuthenticatedSupabaseClient] JWT Subject Claim (sub): ${decodedPayload.sub ?? 'Not Found'}`);
    //     const expirationTime = decodedPayload.exp ? new Date(decodedPayload.exp * 1000) : 'N/A';
    //     console.log(`[createAuthenticatedSupabaseClient] JWT Expiration: ${expirationTime}`);
    // } else {
    //     console.warn("[createAuthenticatedSupabaseClient] Could not decode JWT payload.");
    // }
    // ---- END JWT DECODING LOG ----

    console.log("[createAuthenticatedSupabaseClient] Creating Supabase client with accessToken factory...");
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseAnonKey) {
      throw new Error("Supabase Anon Key is missing in environment variables for authenticated client creation.");
    }

    const authenticatedClient = createClient<Database>(supabaseUrl, supabaseAnonKey, { 
        // global: { // Remove global header setting
        //     headers: {
        //         Authorization: `Bearer ${token}`,
        //     },
        // },
        auth: {
            autoRefreshToken: false, 
            persistSession: false, 
            detectSessionInUrl: false,
        },
        // Add the accessToken factory function
        async accessToken() {
          console.log("[SupabaseClient accessTokenFactory] Fetching token via getToken()...");
          const token = await getToken({ skipCache: false }); // skipCache might be important
          if (!token) {
            console.warn("[SupabaseClient accessTokenFactory] getToken() returned null/undefined.");
            return null;
          }
          console.log(`[SupabaseClient accessTokenFactory] Token fetched (first 8 chars): ${token.substring(0,8)}...`);
          
          // Decode and log the token payload for debugging storage RLS
          const decodedPayload = decodeJwtPayload(token);
          if (decodedPayload) {
              // Log the full payload as a string to avoid console truncation
              console.log("[SupabaseClient accessTokenFactory] Decoded JWT Payload (RAW):", token);
              console.log("[SupabaseClient accessTokenFactory] Decoded JWT Payload (Parsed JSON):", JSON.stringify(decodedPayload, null, 2));
              
              // Attempt to log specific claims relevant to RLS
              // Try common locations for org_id for context, but use the correct one definitively
              const orgIdFromRoot = decodedPayload.org_id;
              const orgIdFromSessionClaims = decodedPayload.session_claims && decodedPayload.session_claims.org_id;
              // Correcting based on logs: Clerk nests org info under 'o'
              const orgIdFromOClaim = decodedPayload.o && decodedPayload.o.id; 
              const orgIdFromPublicMetadata = decodedPayload.public_metadata && decodedPayload.public_metadata.org_id;


              // Directly use the known correct claim based on observed JWT structure
              const orgIdClaim = orgIdFromOClaim; 
              
              console.log("[SupabaseClient accessTokenFactory] Potential org_id sources - Root:", orgIdFromRoot);
              console.log("[SupabaseClient accessTokenFactory] Potential org_id sources - session_claims.org_id:", orgIdFromSessionClaims);
              console.log("[SupabaseClient accessTokenFactory] Potential org_id sources - o.id:", orgIdFromOClaim); // Log the one we are using
              console.log("[SupabaseClient accessTokenFactory] Potential org_id sources - public_metadata.org_id:", orgIdFromPublicMetadata);


              console.log("[SupabaseClient accessTokenFactory] JWT Org ID Claim (now definitive):", orgIdClaim || "Not Found - THIS IS AN ERROR!"); // Updated log message
              console.log("[SupabaseClient accessTokenFactory] JWT Subject Claim (sub):", decodedPayload.sub || "Not Found");
              if (decodedPayload.exp) {
                console.log("[SupabaseClient accessTokenFactory] JWT Expiration:", new Date(decodedPayload.exp * 1000));
              }
          } else {
            console.warn("[SupabaseClient accessTokenFactory] Failed to decode JWT payload.");
          }
          return token;
        }
    });
    console.log("[createAuthenticatedSupabaseClient] Authenticated Supabase client created with accessToken factory.");
    return authenticatedClient;
};

// Remove the old try/catch block and the potentially problematic mock client
// export { supabase }; // Already exported as const 