import { supabase } from "./client";
import { useAuth } from "@clerk/clerk-react";

/**
 * Sets a Supabase session using a JWT token.
 * This can be used in both React and non-React contexts.
 */
export async function setSupabaseSessionFromJwt(token: string) {
  if (!token) {
    console.warn('No token provided to setSupabaseSessionFromJwt');
    return null;
  }

  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: ''  // Clerk handles token refresh
    });

    if (error) {
      console.error('Error setting Supabase session:', error);
      return null;
    }

    return data.session;
  } catch (error) {
    console.error('Error in setSupabaseSessionFromJwt:', error);
    return null;
  }
}

/**
 * Gets a Supabase session using Clerk authentication.
 * This should only be used in React components.
 */
export async function getSupabaseSession() {
  const { getToken } = useAuth();
  const token = await getToken({ template: 'supabase' });
  
  if (!token) {
    console.warn('No Supabase token found from Clerk');
    return null;
  }

  return setSupabaseSessionFromJwt(token);
} 