import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth, useUser, useSession, useClerk } from '@clerk/clerk-react';
import { SupabaseClient } from '@supabase/supabase-js';
import { createAuthenticatedSupabaseClient } from '../lib/supabase/client'; // Corrected path
import { Database } from '@/lib/supabase/types'; // Ensure Database type is imported
import { ContractService } from '@/services/ContractService'; // <-- Import ContractService
import { UserResource } from '@clerk/types';

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
  contractServiceInstance: ContractService | null; // <-- Add service state
}

interface UserDetails {
  clerkUserId?: string | null;
  supabaseUserId?: string | null;
  email?: string | null;
  fullName?: string | null;
  role?: string | null;
  organizationId?: string | null;
}

// Define the context type including the getToken function
export interface ClerkAuthContextType { //extends AuthState {
  user: UserResource | null | undefined; // Use Clerk's type 
  userDetails: UserDetails | null; // Use our combined details type
  isLoading: boolean;
  getToken: (options?: { template?: string }) => Promise<string | null>;
  authenticatedSupabase: SupabaseClient<Database> | null;
  error: Error | null; // An auth error
  contractServiceInstance: ContractService | null; // A service instance
  isAuthenticated: boolean; // Authentication status flag
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
  contractServiceInstance: null, // <-- Initialize service state
};

// Define the provider component props
interface ClerkAuthProviderProps {
  children: ReactNode;
}

// Define the provider component
export const ClerkAuthProvider: React.FC<ClerkAuthProviderProps> = ({ children }) => {
  const { isSignedIn, sessionId, getToken } = useAuth();
  const { user: clerkUser, isLoaded: clerkUserLoaded } = useUser();
  const { session } = useSession();
  const clerkInstance = useClerk();
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

          // --- START: Get Supabase User ID from Clerk Metadata --- 
          let supabaseUserId: string | null = null;
          if (clerkUser.publicMetadata && typeof clerkUser.publicMetadata.supabase_id === 'string') {
            supabaseUserId = clerkUser.publicMetadata.supabase_id;
            console.log(`[ClerkAuthProvider] Effect 2: Retrieved Supabase User ID from Clerk Metadata: ${supabaseUserId}`);
          } else {
            console.warn("[ClerkAuthProvider] Effect 2: Supabase User ID not found in Clerk publicMetadata.");
             // TODO: Consider if this is an error state - should we try to fetch/sync?
             // For now, we'll leave supabaseUserId as null if not found in metadata.
          }
          // --- END: Get Supabase User ID from Clerk Metadata ---

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

          // *** Create ContractService instance HERE ***
          // Use local variables for the check, as authState might not be updated yet
          // Pass getToken along with user details
          if (authState.authenticatedSupabase && organizationId && supabaseUserId && primaryEmail && getToken && !authState.contractServiceInstance) { 
              console.log('[ClerkAuthProvider] Effect 2: Creating ContractService instance with retrieved details and getToken...');
              try {
                  // REMOVE: supabaseClient variable (no longer passed)
                  // Pass getToken and user/org details
                  const service = new ContractService(getToken, organizationId, supabaseUserId, primaryEmail);
                  if (isMounted) {
                      setAuthState(prev => ({ ...prev, contractServiceInstance: service }));
                      console.log('[ClerkAuthProvider] Effect 2: ContractService instance created successfully.');
                  }
              } catch(serviceError) {
                   console.error("[ClerkAuthProvider] Effect 2: Error creating ContractService instance:", serviceError);
                   // Decide how to handle this - maybe set an error state?
              }
          } else {
               // Log why it might be skipped
               const skipReason = !authState.authenticatedSupabase ? "Supabase client not ready" 
                               : !organizationId ? "Org ID missing"
                               : !supabaseUserId ? "Supabase User ID missing"
                               : !primaryEmail ? "Primary email missing"
                               : authState.contractServiceInstance ? "Service already exists"
                               : "Unknown reason";
               console.log(`[ClerkAuthProvider] Effect 2: Skipping ContractService creation (${skipReason}).`);
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
  }, [authState.authenticatedSupabase, clerkUserLoaded, clerkUser, getToken]); // Add clerkUser here

  // *** Construct the userDetails object - FINAL ATTEMPT ***
  const userDetails: UserDetails | null = clerkUserLoaded && clerkUser ? {
    clerkUserId: clerkUser.id,
    supabaseUserId: authState.user.supabaseUserId,         // Correct: Direct access
    email: clerkUser.primaryEmailAddress?.emailAddress,
    fullName: clerkUser.fullName,
    role: authState.user.role,                   // Correct: Direct access
    organizationId: authState.user.organizationId,     // Correct: Direct access
  } : null;

  const contextValue: ClerkAuthContextType = {
    user: clerkUser,
    userDetails: userDetails,
    isLoading: authState.isLoading || !clerkUserLoaded,
    getToken,
    authenticatedSupabase: authState.authenticatedSupabase,
    error: authState.error,
    contractServiceInstance: authState.contractServiceInstance,
    isAuthenticated: authState.isAuthenticated,
  };

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