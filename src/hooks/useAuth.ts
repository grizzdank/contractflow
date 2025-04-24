import { useClerkAuth } from '@/contexts/ClerkAuthContext';
import { ClerkAuthContextType } from '@/contexts/ClerkAuthContext'; // Import the type if not already

/**
 * Custom hook that provides authentication state and user information
 * by wrapping the Clerk authentication context.
 */
export function useAuth(): ClerkAuthContextType | undefined { // Return type can be undefined if context not ready
  const contextValue = useClerkAuth(); 

  // Handle context not being ready
  if (!contextValue) {
     console.warn("[useAuth] ClerkAuth context not available yet.");
     // If context is undefined, the hook cannot provide auth state yet.
     // Return undefined to signal this to the consumer (e.g., ProtectedRoute)
     return undefined; 
  }

  // The contextValue *is* the state (including isLoading, user, etc.) and getToken
  // We don't need to check for authState separately here because contextValue itself
  // holds the loading status.

  // Log the state for debugging
  console.log('[useAuth] Hook status:', {
    isLoading: contextValue.isLoading, // Access directly from context value
    isAuthenticated: contextValue.isAuthenticated,
    hasUser: !!contextValue.user?.clerkUserId, // Check a property on user
    userId: contextValue.user?.supabaseUserId,
    userRole: contextValue.user?.role,
    hasSession: !!contextValue.authenticatedSupabase, // Check if client exists as proxy for session
    contextError: contextValue.error
  });

  // Return the whole context value as it matches the desired output structure
  // (user, session-like info via authenticatedSupabase, isLoading, getToken)
  // We just need to ensure the consumer handles the potential undefined return
  // if the provider isn't ready.
  return contextValue;
} 