import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@clerk/clerk-react"; 

/**
 * Utility function to get the current Supabase session using Clerk token.
 * This should ideally be called within a React component or context where useAuth is available.
 * For server-side or non-React contexts, the token needs to be passed differently.
 */
export async function getSupabaseSession() {
  const { getToken } = useAuth();
  const token = await getToken({ template: 'supabase' });

  if (!token) {
    console.warn('No Supabase token found from Clerk.');
    // Attempt to get session directly from Supabase (might be expired or null)
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      console.error('Error getting Supabase session:', error);
      return null;
    }
    return data.session;
  }

  // Set the session for the Supabase client instance
  const { error } = await supabase.auth.setSession({
    access_token: token,
    refresh_token: '' // Clerk manages refresh tokens
  });

  if (error) {
    console.error('Error setting Supabase session with Clerk token:', error);
    return null;
  }
  
  // Return the session object after setting it
  const { data } = await supabase.auth.getSession();
  return data.session;
} 