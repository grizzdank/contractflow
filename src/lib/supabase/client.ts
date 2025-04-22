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


// --- Helper function to create an AUTHENTICATED client ---
// This function requires the Clerk getToken function to be passed in.
// It should be called within a component or context where useAuth() is available.
// Note: This creates a NEW client instance each time. Consider memoization or context if performance is critical.
export const createAuthenticatedSupabaseClient = async (
  getToken: (options?: { template?: string }) => Promise<string | null>
): Promise<SupabaseClient<Database>> => {
  console.log('[createAuthenticatedSupabaseClient] Attempting to create authenticated client...');
  try {
    // IMPORTANT: Use the standard getToken without template for the new integration method
    const token = await getToken();
    if (!token) {
       console.error('[createAuthenticatedSupabaseClient] Clerk token is null. Cannot create authenticated client.');
       // Returning the base client might be confusing. Throwing error is clearer.
       throw new Error('Clerk token not available for authenticated Supabase client');
    }
    // Avoid logging the full token in production
    // console.log('[createAuthenticatedSupabaseClient] Successfully retrieved Clerk token.');

    // Create a new Supabase client instance configured with the dynamic token
    const authSupabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`, // Pass token via Authorization header
        },
      },
      // Keep Supabase auth mechanisms disabled
      auth: {
         persistSession: false,
         autoRefreshToken: false,
         detectSessionInUrl: false,
      }
    });
    console.log('[createAuthenticatedSupabaseClient] Authenticated Supabase client instance created.');
    return authSupabase;

  } catch (error) {
    console.error('[createAuthenticatedSupabaseClient] Error creating authenticated client:', error);
    // Rethrow to allow caller to handle (e.g., show error message to user)
    throw error;
  }
};

// Remove the old try/catch block and the potentially problematic mock client
// export { supabase }; // Already exported as const 