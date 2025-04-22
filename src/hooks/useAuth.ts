import { useClerkAuth } from '@/contexts/ClerkAuthContext';

/**
 * Custom hook that provides authentication state and user information
 * by wrapping the Clerk authentication context.
 */
export function useAuth() {
  // Get the raw state from our context
  const { authState, isLoaded: clerkHooksLoaded } = useClerkAuth(); 

  // Determine the final loading state:
  // We are loading if the core Clerk hooks haven't loaded OR if our internal authState is still loading.
  const isLoading = !clerkHooksLoaded || authState.isLoading;

  // Log the state for debugging
  console.log('[useAuth] Hook status:', {
    clerkHooksLoaded, // Are the base Clerk hooks ready?
    authStateIsLoading: authState.isLoading, // Is our custom sync logic running?
    finalIsLoading: isLoading, // The combined loading state we expose
    hasUser: !!authState.user,
    userId: authState.user?.id,
    userRole: authState.user?.role,
    hasSession: !!authState.session,
    authStateError: authState.error
  });

  return {
    user: authState.user,
    session: authState.session,
    // Expose the combined loading state
    isLoading: isLoading 
  };
} 