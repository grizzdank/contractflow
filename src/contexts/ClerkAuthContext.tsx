import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useClerk, useUser, useOrganizationList } from '@clerk/clerk-react';
import type { SignedInSessionResource, UserResource } from '@clerk/types';
import { User, UserRole, AuthState } from '@/domain/types/Auth';
import { supabase } from '@/lib/supabase/client';

interface AuthUser {
  id: string;
  role: UserRole;
  email: string;
  organizationId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Expand AuthStateType to include more detailed loading/status
interface AuthStateType {
  user: AuthUser | null;
  isClerkLoading: boolean; // Is useUser still loading?
  isSupabaseLoading: boolean; // Are we syncing token/role?
  isInitializationAttemptComplete: boolean; // Has InitializeClerkSession run?
  isSignedIn: boolean | undefined; // Reflect Clerk's isSignedIn directly
  error?: Error;
}

interface ClerkAuthContextType {
  authState: AuthStateType;
  isLoaded: boolean; // Represents overall readiness (Clerk loaded AND init attempted)
  signalInitializationComplete: () => void; // Function for Initializer component
}

const initialAuthState: AuthStateType = {
  user: null,
  isClerkLoading: true,
  isSupabaseLoading: false,
  isInitializationAttemptComplete: false,
  isSignedIn: undefined,
  error: undefined
};

// Export the context so it can be consumed
export const ClerkAuthContext = createContext<ClerkAuthContextType | undefined>(undefined);

// Function to fetch user role from Supabase using Clerk User ID
const fetchUserRole = async (clerkUserId: string): Promise<{ role: UserRole; organizationId: string | null }> => {
  if (!clerkUserId) {
    console.log('[fetchUserRole] No Clerk User ID provided.');
    return { role: UserRole.VIEWER, organizationId: null };
  }

  try {
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('role, organization_id')
      .eq('user_id', clerkUserId)
      .maybeSingle();

    if (memberError && memberError.code !== 'PGRST116') {
      console.error('[fetchUserRole] Error fetching user role:', memberError);
      return { role: UserRole.VIEWER, organizationId: null };
    }

    if (!memberData) {
        console.log(`[fetchUserRole] No membership found for user ${clerkUserId}. Defaulting to VIEWER.`);
        return { role: UserRole.VIEWER, organizationId: null };
    }

    return {
      role: mapDatabaseRoleToUserRole(memberData.role),
      organizationId: memberData.organization_id,
    };
  } catch (error) {
    console.error('[fetchUserRole] Exception fetching user role:', error);
    return { role: UserRole.VIEWER, organizationId: null };
  }
};

// Map database role to UserRole enum
const mapDatabaseRoleToUserRole = (dbRole: string | null): UserRole => {
  if (!dbRole) return UserRole.VIEWER;
  const roleKey = dbRole.includes(':') ? dbRole.split(':')[1] : dbRole;

  switch (roleKey.toLowerCase()) {
    case 'admin':
      return UserRole.ADMINISTRATOR;
    case 'manager':
      return UserRole.MANAGER;
    case 'reviewer':
      return UserRole.REVIEWER;
    case 'contributor':
      return UserRole.CONTRIBUTOR;
    case 'viewer':
    default:
      return UserRole.VIEWER;
  }
};

export function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  const clerk = useClerk();
  const { isLoaded: isUserLoaded, isSignedIn, user } = useUser();

  const [authState, setAuthState] = useState<AuthStateType>(initialAuthState);
  const isSupabaseSyncing = useRef(false); // Ref to prevent concurrent Supabase syncs

  // Callback for InitializeClerkSession to signal completion
  const signalInitializationComplete = useCallback(() => {
    console.log('[ClerkAuthProvider] Received signalInitializationComplete.');
    setAuthState(prev => ({ ...prev, isInitializationAttemptComplete: true }));
  }, []);

  // Effect 1: Update basic Clerk state (isLoaded, isSignedIn, basic user)
  useEffect(() => {
    console.log('[ClerkAuthProvider][Effect1] Updating basic state based on useUser:', { isUserLoaded, isSignedIn });
    setAuthState(prev => ({
      ...prev,
      isClerkLoading: !isUserLoaded,
      isSignedIn: isUserLoaded ? isSignedIn : undefined, // Only set isSignedIn when user is loaded
      // Keep user potentially stale here until Supabase sync, or update partially?
      // Let's keep it null until full sync for simplicity, role is crucial.
      user: null, 
      isLoading: !isUserLoaded, // Reflect only Clerk loading here
    }));
  }, [isUserLoaded, isSignedIn]);

  // Effect 2: Sync with Supabase (get token, fetch role) AFTER initialization attempt
  useEffect(() => {
    const syncWithSupabase = async () => {
      // Conditions to run:
      // 1. Initialization component MUST have run its course.
      // 2. useUser hook must be loaded and report isSignedIn=true (use direct hook values).
      // 3. Must NOT be already syncing.
      if (!authState.isInitializationAttemptComplete || !isUserLoaded || !isSignedIn || isSupabaseSyncing.current) {
         console.log('[ClerkAuthProvider][Effect2] Skipping Supabase sync. Conditions not met:', {
            initAttempted: authState.isInitializationAttemptComplete,
            isUserHookLoaded: isUserLoaded,
            isUserHookSignedIn: isSignedIn, // Use direct hook value
            isSyncing: isSupabaseSyncing.current
         });
         // If init is complete but user is signed out, ensure Supabase is logged out
         if (authState.isInitializationAttemptComplete && isUserLoaded && !isSignedIn) {
            console.log('[ClerkAuthProvider][Effect2] Init complete, user hook loaded, user not signed in. Signing out Supabase.')
            await supabase.auth.signOut().catch(console.error);
         }
         return; 
      }
      
      // Ensure user object is available (redundant check if isSignedIn is true, but safe)
      if (!user) {
          console.error('[ClerkAuthProvider][Effect2] Inconsistency: Hook reports signed in but no user object.');
          setAuthState(prev => ({ ...prev, isSupabaseLoading: false, error: new Error('Clerk signed in state inconsistency during sync') }));
          await supabase.auth.signOut().catch(console.error);
          return;
      }

      // Start syncing
      isSupabaseSyncing.current = true;
      console.log(`[ClerkAuthProvider][Effect2] Conditions met for user: ${user.id}. Starting Supabase sync.`);
      setAuthState(prev => ({ ...prev, isSupabaseLoading: true, error: undefined }));

      // --- Introduce a minimal delay before getToken ---
      setTimeout(async () => {
        console.log('[ClerkAuthProvider][Effect2] Executing sync logic after minimal delay.');
        let supabaseToken: string | null = null;
        try {
          // 1. Get Supabase token
          if (!clerk.session) throw new Error('Clerk session missing during Supabase sync');
          console.log("[ClerkAuthProvider][Effect2] Attempting to get Supabase token.");
          supabaseToken = await clerk.session.getToken(); // Use template if needed: { template: 'supabase' } ? Check if necessary
          if (!supabaseToken) throw new Error('Received null Supabase token from Clerk');

          // Decode the token to access claims
          const decodedToken = JSON.parse(atob(supabaseToken.split('.')[1])); // Consider using jwtDecode library for safety
          console.log("[ClerkAuthProvider][Effect2] Decoded Supabase Token Claims:", decodedToken);

          // 2. Set Supabase session
          await supabase.auth.setSession({ access_token: supabaseToken, refresh_token: '' });
          console.log("[ClerkAuthProvider][Effect2] Supabase client auth set.");

          // 3. GET ROLE AND ORG ID DIRECTLY FROM TOKEN
          const orgData = decodedToken.o || {}; // Get the 'o' claim, default to empty object if missing
          const tokenRole = orgData.rol || 'viewer'; // Get the role from token, default to 'viewer' if missing
          const tokenOrgId = orgData.id || null; // Get the org ID from token

          // Map the token role string ('admin') to your internal UserRole enum
          const mappedRole = mapDatabaseRoleToUserRole(tokenRole);
          console.log(`[ClerkAuthProvider][Effect2] Role from token: ${tokenRole}, Mapped role: ${mappedRole}, Org ID: ${tokenOrgId}`);

          const userData: AuthUser = {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress || '',
            role: mappedRole, // Use the role derived from the token
            organizationId: tokenOrgId, // Use the org ID from the token
            createdAt: new Date(user.createdAt).toISOString(),
            updatedAt: new Date(user.lastSignInAt || user.updatedAt || user.createdAt).toISOString(),
          };

          // 4. Update final state
          setAuthState(prev => ({
            ...prev,
            user: userData,
            isSignedIn: true, // Explicitly set signedIn state to true
            isSupabaseLoading: false,
            error: undefined
          }));
          console.log(`[ClerkAuthProvider][Effect2] Supabase sync complete for user: ${userData.id}`);

        } catch (error) {
          console.error('[ClerkAuthProvider][Effect2] Error during Supabase sync:', error);
          setAuthState(prev => ({
            ...prev,
            user: null,
            isSignedIn: false, // Explicitly set signedIn state to false on error
            isSupabaseLoading: false,
            error: error instanceof Error ? error : new Error('Unknown error during Supabase sync')
          }));
          await supabase.auth.signOut().catch(console.error); 
        } finally {
          // Important: Set syncing to false ONLY within the setTimeout callback
          isSupabaseSyncing.current = false;
          console.log('[ClerkAuthProvider][Effect2] Finished Supabase sync run (inside setTimeout).');
        }
      }, 0); // Minimal delay (0 ms)

    };

    void syncWithSupabase();
    // Dependencies: Run when initialization attempt completes, or useUser status changes.
  }, [authState.isInitializationAttemptComplete, isUserLoaded, isSignedIn, user, clerk.session]); // Depend on hook values directly

  // Calculate overall loading state
  const overallIsLoading = authState.isClerkLoading || !authState.isInitializationAttemptComplete || authState.isSupabaseLoading;

  const contextValue: ClerkAuthContextType = {
    authState,
    isLoaded: !overallIsLoading, // Considered loaded when all stages are complete
    signalInitializationComplete
  };

  return (
    <ClerkAuthContext.Provider value={contextValue}>
      {children}
    </ClerkAuthContext.Provider>
  );
}

export function useClerkAuth() {
  const context = useContext(ClerkAuthContext);
  if (context === undefined) {
    throw new Error('useClerkAuth must be used within a ClerkAuthProvider');
  }
  return context;
}

export function useClerkUser() {
  const { authState } = useClerkAuth();
  return authState.user;
}

// This hook might return null if we remove session from state
// Consider if components using this need the full session object 
// or just specific details derivable from useUser() or useSession() directly.
// export function useClerkSession() { 
//   const { authState } = useClerkAuth();
//   return authState.session; 
// } 