import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { SupabaseClient } from '@supabase/supabase-js';
import { createAuthenticatedSupabaseClient } from '../lib/supabase/client'; // Corrected path
import { Database } from '@/lib/supabase/types'; // Ensure Database type is imported

// type DbProfile = Database['public']['Tables']['profiles']['Row']; // profiles table type
// Define type for organization_members row
type DbOrgMember = Database['public']['Tables']['organization_members']['Row'];
// Define Role type based on the role column in organization_members table
type Role = DbOrgMember['role']; // This assumes 'role' exists and is typed correctly in organization_members

// Define the structure for the user object within the context state
interface ContextAuthUser {
  clerkUserId: string | null;
  primaryEmail: string | null;
  fullName: string | null;
  role: Role | null;
  supabaseUserId: string | null;
  organizationId: string | null; // Add organization ID field
}

// Define the structure for the authentication state
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: ContextAuthUser;
  error: Error | null;
  authenticatedSupabase: SupabaseClient<Database> | null;
}

// Define the context type including the getToken function
export interface ClerkAuthContextType extends AuthState {
  getToken: (options?: { template?: string }) => Promise<string | null>;
}

// Create the context with a default value
const ClerkAuthContext = createContext<ClerkAuthContextType | undefined>(undefined);

// Define the initial state
const initialAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: {
    clerkUserId: null,
    primaryEmail: null,
    fullName: null,
    role: null,
    supabaseUserId: null,
    organizationId: null, // Initialize organization ID
  },
  error: null,
  authenticatedSupabase: null,
};

// Define the provider component props
interface ClerkAuthProviderProps {
  children: ReactNode;
}

// Define the provider component
export const ClerkAuthProvider: React.FC<ClerkAuthProviderProps> = ({ children }) => {
  const { isSignedIn, sessionId, getToken } = useAuth();
  const { user: clerkUser, isLoaded: clerkUserLoaded } = useUser();
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);

  // Effect 1: Initialize authenticated Supabase client
  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component

    const initializeSupabase = async () => {
      console.log("[ClerkAuthProvider] Effect 1: Checking session and attempting Supabase client init...");
      if (isSignedIn && sessionId && isMounted) {
        console.log("[ClerkAuthProvider] Effect 1: User signed in, session exists. Initializing authenticated Supabase...");
        try {
          const client = await createAuthenticatedSupabaseClient(getToken);
          if (isMounted) {
            setAuthState(prev => ({ ...prev, authenticatedSupabase: client }));
            console.log("[ClerkAuthProvider] Effect 1: Authenticated Supabase client initialized successfully.");
          }
        } catch (error) {
          console.error("[ClerkAuthProvider] Effect 1: Error initializing authenticated Supabase client:", error);
          if (isMounted) {
            setAuthState(prev => ({ ...prev, error: error instanceof Error ? error : new Error(String(error)) }));
          }
        }
      } else {
        console.log("[ClerkAuthProvider] Effect 1: No active session or user not signed in. Skipping Supabase init.");
      }
    };

    initializeSupabase();

    return () => {
      isMounted = false; // Cleanup flag
      console.log("[ClerkAuthProvider] Effect 1: Cleanup.");
    };
  }, [isSignedIn, sessionId, getToken]); // Rerun when session status changes

  // Effect 2: Fetch user profile (role, Supabase ID, Org ID) once authenticated Supabase client is ready
  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component

    const fetchUserProfile = async () => {
      console.log("[ClerkAuthProvider] Effect 2: Checking conditions to fetch user profile...");
      if (
        authState.authenticatedSupabase &&
        clerkUserLoaded &&
        clerkUser &&
        !authState.user.role // Only fetch if role/org isn't already set (assuming they load together)
      ) {
        const clerkUserId = clerkUser.id;
        const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress ?? null;
        const fullName = clerkUser.fullName ?? null;

        console.log(`[ClerkAuthProvider] Effect 2: Fetching profile for Clerk User ID: ${clerkUserId}, Email: ${primaryEmail}`);
        setAuthState(prev => ({
          ...prev,
          isLoading: true,
          user: { ...prev.user, clerkUserId, primaryEmail, fullName } // Update basic info first
        }));

        try {
          // Fetch Role and Org ID from organization_members table
          console.log("[ClerkAuthProvider] Effect 2: Fetching role and org ID from organization_members table...");
          const { data: memberData, error: memberError } = await authState.authenticatedSupabase
            .from('organization_members')
            .select('role, organization_id') // Select both role and organization_id
            .eq('user_id', clerkUserId)
            .maybeSingle();

          if (memberError && memberError.code !== 'PGRST116') { // Ignore '0 rows' error
            console.error('[ClerkAuthProvider] Effect 2: Error fetching organization membership:', memberError);
            throw memberError;
          }

          const userRole: Role | null = memberData?.role ? (memberData.role as Role) : null;
          const organizationId: string | null = memberData?.organization_id ?? null;
          console.log(`[ClerkAuthProvider] Effect 2: Fetched from org_members - Role: ${userRole ?? 'Not found'}, Org ID: ${organizationId ?? 'Not found'}`);

          // Fetch/Assume Supabase User ID (using Clerk ID based on previous assumption)
          let supabaseUserId: string | null = null;
          if (primaryEmail) {
             console.log(`[ClerkAuthProvider] Effect 2: Assigning Supabase User ID based on Clerk User ID.`);
             supabaseUserId = clerkUserId;
             console.log(`[ClerkAuthProvider] Effect 2: ASSIGNED Supabase User ID (as Clerk ID): ${supabaseUserId}`);
          } else {
             console.warn("[ClerkAuthProvider] Effect 2: Cannot assign Supabase User ID because primary email is missing.");
          }


          if (isMounted) {
            setAuthState(prev => ({
              ...prev,
              isAuthenticated: true,
              isLoading: false,
              // Store role, Supabase ID, and Org ID
              user: { ...prev.user, role: userRole, supabaseUserId: supabaseUserId, organizationId: organizationId },
              error: null,
            }));
            console.log(`[ClerkAuthProvider] Effect 2: User profile updated (Role: ${userRole ?? 'None'}, SupabaseID: ${supabaseUserId ?? 'None'}, OrgID: ${organizationId ?? 'None'}).`);
          }
        } catch (error) {
          console.error("[ClerkAuthProvider] Effect 2: Error fetching user profile:", error);
          if (isMounted) {
            setAuthState(prev => ({
              ...prev,
              isLoading: false,
              error: error instanceof Error ? error : new Error('Failed to fetch user profile'),
            }));
          }
        }
      } else if (clerkUserLoaded && !clerkUser) {
        // Clerk is loaded but no user is signed in
        if (isMounted) {
          setAuthState(initialAuthState); // Reset state if user signs out
          console.log("[ClerkAuthProvider] Effect 2: Clerk loaded, user not signed in. Resetting auth state.");
        }
      } else {
         // Reduced log noise slightly
         if (!authState.user.role) { // Only log unmet conditions if we were expecting to fetch
            console.log("[ClerkAuthProvider] Effect 2: Conditions not met to fetch profile (Supabase client ready?:", !!authState.authenticatedSupabase, "Clerk loaded?:", clerkUserLoaded, "Clerk user exists?:", !!clerkUser, ")");
         }
      }
    };

    fetchUserProfile();

    return () => {
      isMounted = false; // Cleanup flag
      console.log("[ClerkAuthProvider] Effect 2: Cleanup.");
    };
    // Dependencies: Run when client is ready, Clerk user loads, or Clerk user changes
  }, [authState.authenticatedSupabase, clerkUserLoaded, clerkUser]); // Add clerkUser here


  // Provide a stable getToken function
  const stableGetToken = useCallback(getToken, [getToken]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    ...authState,
    getToken: stableGetToken,
  }), [authState, stableGetToken]);


  return (
    <ClerkAuthContext.Provider value={contextValue}>
      {children}
    </ClerkAuthContext.Provider>
  );
};

// Custom hook to use the ClerkAuth context
export const useClerkAuth = (): ClerkAuthContextType => {
  const context = useContext(ClerkAuthContext);
  if (context === undefined) {
    throw new Error('useClerkAuth must be used within a ClerkAuthProvider');
  }
  return context;
};