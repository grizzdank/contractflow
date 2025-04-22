import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { supabase } from './client';
import { jwtDecode } from 'jwt-decode'; // We'll need a JWT decoding library

// Helper type for decoded JWT payload (adjust based on your actual claims)
interface DecodedToken {
  exp: number;
  iat: number;
  iss: string;
  sub: string;
  // Add other standard claims as needed
  // --> Add your specific role claim here, e.g.:
  user_role?: string; 
  app_metadata?: { role?: string };
  [key: string]: any; // Allow other custom claims
}


export function useSupabaseAuth() {
  const { getToken } = useAuth();
  
  useEffect(() => {
    const setupSupabase = async () => {
      console.debug('[useSupabaseAuth] Attempting to set Supabase session...');
      try {
        const token = await getToken({ template: 'supabase' });
        if (token) {
          try {
            const decoded = jwtDecode<DecodedToken>(token);
            console.debug('[useSupabaseAuth] Decoded Clerk Token Payload:', decoded);
            // ** Check if the expected role claim is present here **
            if (!decoded.user_role && !decoded.app_metadata?.role) {
               console.warn('[useSupabaseAuth] Role claim (user_role or app_metadata.role) missing in token!');
            }
          } catch (decodeError) {
             console.error('[useSupabaseAuth] Failed to decode token:', decodeError);
          }

          await supabase.auth.setSession({
            access_token: token,
            refresh_token: ''  // Clerk handles token refresh
          });
          console.debug('[useSupabaseAuth] Supabase session set successfully.');
        } else {
           console.warn('[useSupabaseAuth] No token received from Clerk.');
        }
      } catch (error) {
        console.error('[useSupabaseAuth] Error setting up Supabase auth:', error);
      }
    };

    setupSupabase();

    // Cleanup on unmount
    return () => {
      console.debug('[useSupabaseAuth] Cleaning up Supabase session.');
      supabase.auth.setSession({ access_token: '', refresh_token: '' });
    };
  }, [getToken]);

  return supabase;
} 