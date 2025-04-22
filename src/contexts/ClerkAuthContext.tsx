import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo, ReactNode } from 'react';
import { useClerk, useUser, useAuth } from '@clerk/clerk-react';
import type { UserResource } from '@clerk/types';
import { UserRole, AuthState } from '@/domain/types/Auth';
import { createAuthenticatedSupabaseClient } from '../lib/supabase/client';
import { Database } from '../lib/supabase/types';
import { SupabaseClient } from '@supabase/supabase-js';

// Simplified AuthUser for context state
interface ContextAuthUser {
  id: string;
  role: UserRole | null; // Role can be null initially while loading
  email?: string;
  organizationId?: string | null; // Org ID can be null initially
}

// Refined internal state type
interface AuthStateType {
  user: ContextAuthUser | null;
  isClerkLoading: boolean; // Are useUser/useAuth hooks ready?
  isRoleLoading: boolean; // Are we fetching the role from Supabase?
  isInitializationAttemptComplete: boolean; // Has InitializeClerkSession run?
  isSignedIn: boolean | undefined; // Reflect Clerk's isSignedIn directly
  error?: Error;
}

interface ClerkAuthContextType {
  authState: AuthStateType;
  isLoaded: boolean; // Represents overall readiness (Clerk loaded AND init attempted AND role loaded/failed)
  signalInitializationComplete: () => void;
}

const initialAuthState: AuthStateType = {
  user: null,
  isClerkLoading: true,
  isRoleLoading: false, // Starts as false
  isInitializationAttemptComplete: false,
  isSignedIn: undefined,
  error: undefined
};

export const ClerkAuthContext = createContext<ClerkAuthContextType | undefined>(undefined);

// Function to fetch user role from Supabase using Clerk User ID and an authenticated client
// Accepts getToken to create the client dynamically
const fetchUserRole = async (
    clerkUserId: string,
    getToken: (options?: { template?: string }) => Promise<string | null>
  ): Promise<{ role: UserRole; organizationId: string | null } | null> => {
  if (!clerkUserId) {
    console.log('[fetchUserRole] No Clerk User ID provided.');
    return null; // Return null if no ID
  }
  console.log(`[fetchUserRole] Fetching role for Clerk User ID: ${clerkUserId}`);
  let authenticatedSupabase: SupabaseClient<Database>; // Define type
  try {
    // Create the authenticated client *inside* the function
    console.log('[fetchUserRole] Creating authenticated Supabase client...');
    authenticatedSupabase = await createAuthenticatedSupabaseClient(getToken);
    console.log('[fetchUserRole] Authenticated Supabase client created.');

    // Perform the query with the authenticated client
    const { data: memberData, error: memberError } = await authenticatedSupabase
      .from('organization_members')
      .select('role, organization_id')
      .eq('user_id', clerkUserId)
      .maybeSingle();

    // Log the raw response
    console.log('[fetchUserRole] Supabase response:', { memberData, memberError });

    // Handle specific Supabase errors explicitly
    if (memberError) {
       // PGRST116: "The result contains 0 rows" - this is not an error, just means no membership found
      if (memberError.code === 'PGRST116') {
         console.log(`[fetchUserRole] No membership found for user ${clerkUserId}.`);
         return { role: UserRole.VIEWER, organizationId: null }; // Default role if no membership
      } else {
        // Log other Supabase errors
        console.error('[fetchUserRole] Error fetching user role:', memberError);
        throw new Error(`Supabase error fetching role: ${memberError.message}`); // Throw to be caught below
      }
    }

    // If data is explicitly null (and no error other than PGRST116), it means no record found
    if (!memberData) {
        console.log(`[fetchUserRole] No membership record explicitly found for user ${clerkUserId}. Defaulting to VIEWER.`);
        return { role: UserRole.VIEWER, organizationId: null };
    }

    // Map the role from the database string to the UserRole enum
    const mappedRole = mapDatabaseRoleToUserRole(memberData.role);
    console.log(`[fetchUserRole] Found membership. DB Role: ${memberData.role}, Mapped Role: ${mappedRole}, Org ID: ${memberData.organization_id}`);
    return {
      role: mappedRole,
      organizationId: memberData.organization_id,
    };

  } catch (error) {
    // Catch errors from client creation or the fetch itself
    console.error('[fetchUserRole] Exception during authenticated client creation or role fetch:', error);
     return null; // Or throw error if upstream needs to handle it differently
  }
};

// Map database role string to UserRole enum
const mapDatabaseRoleToUserRole = (dbRole: string | null): UserRole => {
  if (!dbRole) {
    console.warn('[mapDatabaseRoleToUserRole] Received null dbRole, defaulting to VIEWER.');
    return UserRole.VIEWER;
  }
  // Handle potential schema prefix "role:" if present
  const roleKey = dbRole.includes(':') ? dbRole.split(':')[1] : dbRole;

  switch (roleKey.toLowerCase()) {
    case 'admin': return UserRole.ADMINISTRATOR;
    case 'manager': return UserRole.MANAGER;
    case 'reviewer': return UserRole.REVIEWER;
    case 'contributor': return UserRole.CONTRIBUTOR;
    case 'viewer': return UserRole.VIEWER;
    default:
      console.warn(`[mapDatabaseRoleToUserRole] Unknown dbRole '${dbRole}', defaulting to VIEWER.`);
      return UserRole.VIEWER;
  }
};

export function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  console.log('[ClerkAuthProvider] Rendering Provider...');

  // Use useAuth to get getToken along with other details
  const { isLoaded: isAuthLoaded, isSignedIn: isAuthSignedIn, getToken, userId } = useAuth();
  // Keep useUser for convenience if specific user details are needed beyond ID/email
  const { user: clerkUser } = useUser();
  // Keep useClerk if direct access to the Clerk instance is needed for other reasons (e.g., navigation)
  // const clerk = useClerk();

  // Log initial state from hooks immediately
  console.log('[ClerkAuthProvider] Initial Hook State:', {
    isAuthLoaded,
    isAuthSignedIn,
    userId,
    hasClerkUser: !!clerkUser,
    // clerkUserId: clerkUser?.id // Redundant if userId is available
  });

  const [authState, setAuthState] = useState<AuthStateType>(initialAuthState);
  const hasAttemptedRoleFetch = useRef(false); // Track if role fetch has been initiated for the current user

  // Callback for InitializeClerkSession to signal completion
  const signalInitializationComplete = useCallback(() => {
    console.log('[ClerkAuthProvider] Received signalInitializationComplete.');
    setAuthState(prev => ({ ...prev, isInitializationAttemptComplete: true }));
  }, []);


  // Effect 1: Update basic sign-in state & clear user on sign-out/loading
  useEffect(() => {
      console.log('[ClerkAuthProvider] Effect 1 (Clerk State Sync) - Running.', { isAuthLoaded, isAuthSignedIn });
      setAuthState(prev => {
          // Only update if Clerk's state has changed significantly
           const clerkLoadingChanged = prev.isClerkLoading !== !isAuthLoaded;
           const signedInStatusChanged = prev.isSignedIn !== isAuthSignedIn;

           if (!clerkLoadingChanged && !signedInStatusChanged) {
               console.log('[ClerkAuthProvider] Effect 1 - Skipping state update, no change in Clerk status.');
               return prev; // No change needed
           }

           const newState: AuthStateType = {
              ...prev,
              isClerkLoading: !isAuthLoaded,
              isSignedIn: isAuthLoaded ? isAuthSignedIn : undefined,
              // If loading or signed out, clear the user and reset role loading
              // Use userId from useAuth as the primary identifier
              user: (isAuthLoaded && isAuthSignedIn && userId) ? (prev.user ?? { id: userId, email: clerkUser?.primaryEmailAddress?.emailAddress, role: null }) : null,
              isRoleLoading: (isAuthLoaded && isAuthSignedIn && userId) ? prev.isRoleLoading : false, // Reset role loading if user is cleared
              error: (isAuthLoaded && !isAuthSignedIn) ? undefined : prev.error, // Clear error on sign-out
           };
           
           // Reset role fetch attempt flag if the user logs out or changes
           if (!newState.user || (prev.user && newState.user && prev.user.id !== newState.user.id)) {
               console.log('[ClerkAuthProvider] Effect 1 - User changed or logged out, resetting role fetch flag.');
               hasAttemptedRoleFetch.current = false;
           }

           console.log('[ClerkAuthProvider] Effect 1 - State Updated:', { from: prev, to: newState });
           return newState;
      });
  }, [isAuthLoaded, isAuthSignedIn, userId, clerkUser]); // Depend on userId from useAuth


  // Effect 2: Fetch Role when user is loaded, signed in, and hasn't been fetched yet
  useEffect(() => {
    const currentUserId = authState.user?.id; // Use ID from our state
    console.log('[ClerkAuthProvider] Effect 2 (Role Fetch) - Checking conditions.', {
        userId: currentUserId,
        isRoleLoading: authState.isRoleLoading,
        hasAttemptedFetch: hasAttemptedRoleFetch.current,
        isClerkLoading: authState.isClerkLoading, // Based on isAuthLoaded
        isSignedIn: authState.isSignedIn // Based on isAuthSignedIn
    });

    // Conditions to fetch role:
    // 1. We have a user ID in our state.
    // 2. We are not already loading the role.
    // 3. We haven't already attempted to fetch the role for this user ID.
    // 4. Clerk basic loading is finished (isClerkLoading is false).
    // 5. User is signed in according to state (isSignedIn is true).
    // 6. getToken function is available.
    if (currentUserId && !authState.isRoleLoading && !hasAttemptedRoleFetch.current && !authState.isClerkLoading && authState.isSignedIn === true && getToken) {
      console.log(`[ClerkAuthProvider] Effect 2 - Conditions met. Attempting role fetch for user: ${currentUserId}`);
      hasAttemptedRoleFetch.current = true; // Mark that we are starting the fetch attempt
      setAuthState(prev => ({ ...prev, isRoleLoading: true, error: undefined }));

      // Pass getToken to fetchUserRole
      fetchUserRole(currentUserId, getToken).then(roleInfo => {
          console.log('[ClerkAuthProvider] Effect 2 - Role fetch completed.', { roleInfo });
          setAuthState(prev => {
             // Ensure we are still updating the state for the same user
             if (prev.user?.id !== currentUserId) {
                 console.warn('[ClerkAuthProvider] Effect 2 - User changed during role fetch, discarding result.');
                 return { ...prev, isRoleLoading: false }; // Stop loading, but don't apply stale data
             }
             if (roleInfo) {
                return {
                   ...prev,
                   user: { ...prev.user!, role: roleInfo.role, organizationId: roleInfo.organizationId }, // Update user with role and orgId
                   isRoleLoading: false,
                   error: undefined
                };
             } else {
                 // fetchUserRole returned null, indicating an error during fetch or default assignment
                  console.error(`[ClerkAuthProvider] Effect 2 - Role fetch failed or defaulted for user ${currentUserId}. Check fetchUserRole logs.`);
                  // Keep user ID but mark role as potentially problematic (null or default VIEWER already set by fetchUserRole)
                  // Or set an error state if fetchUserRole threw an error that was caught and returned null
                   return {
                     ...prev,
                     // Ensure user object exists before trying to access its properties
                     user: prev.user ? { ...prev.user, role: prev.user.role ?? UserRole.VIEWER } : null,
                     isRoleLoading: false,
                     // Set or keep existing error, provide a default if none exists
                     error: prev.error ?? new Error('Failed to fetch user role.')
                   };
             }
          });
      }).catch(error => {
          // This catch block might be redundant if fetchUserRole catches internally and returns null,
          // but added for safety.
          console.error('[ClerkAuthProvider] Effect 2 - Unexpected error during fetchUserRole call:', error);
          setAuthState(prev => ({
             ...prev,
             isRoleLoading: false,
             error: error instanceof Error ? error : new Error('Role fetch failed unexpectedly.')
          }));
      });
    } else {
       console.log('[ClerkAuthProvider] Effect 2 - Skipping role fetch, conditions not met or already attempted.');
       // Log why skipped
       if (!getToken) console.log('[ClerkAuthProvider] Effect 2 - Reason: getToken not available.');
       if (!currentUserId) console.log('[ClerkAuthProvider] Effect 2 - Reason: No user ID in state.');
       if (authState.isRoleLoading) console.log('[ClerkAuthProvider] Effect 2 - Reason: Role fetch already in progress.');
       if (hasAttemptedRoleFetch.current) console.log('[ClerkAuthProvider] Effect 2 - Reason: Role fetch already attempted for this user.');
       if (authState.isClerkLoading) console.log('[ClerkAuthProvider] Effect 2 - Reason: Clerk is loading.');
       if (authState.isSignedIn !== true) console.log('[ClerkAuthProvider] Effect 2 - Reason: User is not signed in.');
    }
  // Depend on user ID changes, loading states, and getToken availability
  }, [authState.user?.id, authState.isRoleLoading, authState.isClerkLoading, authState.isSignedIn, getToken]);


  // Overall loading state: Clerk auth hooks must be loaded, init must be attempted, role must be loaded/failed.
  const isProviderLoaded = isAuthLoaded && authState.isInitializationAttemptComplete && !authState.isRoleLoading;

   console.log('[ClerkAuthProvider] Final Render State:', {
       isProviderLoaded,
       authState
   });

  const contextValue: ClerkAuthContextType = useMemo(() => ({
    authState,
    isLoaded: isProviderLoaded, // Use the calculated overall loaded state
    signalInitializationComplete,
    // getToken, // Expose getToken if needed by consumers, otherwise rely on useAuth
  }), [authState, isProviderLoaded, signalInitializationComplete]); // Add getToken if exposed


  return (
    <ClerkAuthContext.Provider value={contextValue}>
      {children}
    </ClerkAuthContext.Provider>
  );
}

// --- Hooks ---

export function useClerkAuth() {
  const context = useContext(ClerkAuthContext);
  if (context === undefined) {
    throw new Error('useClerkAuth must be used within a ClerkAuthProvider');
  }
  return context;
}

// Convenience hook to get just the user object
export function useClerkUser() {
  const { authState } = useClerkAuth();
  return authState.user;
}

// Convenience hook to get loading and signed-in status easily
export function useAuthStatus() {
    const { authState, isLoaded } = useClerkAuth();
    return {
        isLoading: !isLoaded,
        isSignedIn: authState.isSignedIn ?? false, // Default to false if undefined
        isLoaded // Expose the combined loaded status
    };
}

// This hook might return null if we remove session from state
// Consider if components using this need the full session object 
// or just specific details derivable from useUser() or useSession() directly.
// export function useClerkSession() { 
//   const { authState } = useClerkAuth();
//   return authState.session; 
// } 