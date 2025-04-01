import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import type { UserResource } from '@clerk/types';
import { User, UserRole, AuthState } from '@/domain/types/Auth';
import { supabase } from '@/lib/supabase/client';

interface ClerkAuthContextType {
  authState: AuthState;
  isLoaded: boolean;
}

const ClerkAuthContext = createContext<ClerkAuthContextType | undefined>(undefined);

// Initial auth state
const initialAuthState: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  error: null,
};

export function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const { isLoaded: isClerkLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();

  // Function to update auth state
  const updateAuthState = (updates: Partial<AuthState>) => {
    setAuthState((prevState) => ({
      ...prevState,
      ...updates,
    }));
  };

  // Function to fetch user role from Supabase
  const fetchUserRole = async (userId: string) => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('role, organization_id')
        .eq('user_id', userId)
        .single();

      if (memberError && memberError.code !== 'PGRST116') {
        console.error('Error fetching user role:', memberError);
        return { role: UserRole.VIEWER, organizationId: null };
      }

      return {
        role: memberData?.role ? mapDatabaseRoleToUserRole(memberData.role) : UserRole.VIEWER,
        organizationId: memberData?.organization_id,
      };
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      return { role: UserRole.VIEWER, organizationId: null };
    }
  };

  // Map database role to UserRole enum
  const mapDatabaseRoleToUserRole = (dbRole: string): UserRole => {
    switch (dbRole.toLowerCase()) {
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

  // Effect to sync Clerk user with our auth state
  useEffect(() => {
    const syncUser = async () => {
      if (!isClerkLoaded) {
        return;
      }

      updateAuthState({ isLoading: true });

      try {
        if (!isSignedIn || !clerkUser) {
          updateAuthState({
            user: null,
            session: null,
            isLoading: false,
            error: null,
          });
          return;
        }

        // Get user role and organization from Supabase
        const { role, organizationId } = await fetchUserRole(clerkUser.id);

        // Create our user object
        const user: User = {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          firstName: clerkUser.firstName || undefined,
          lastName: clerkUser.lastName || undefined,
          role,
          organizationId,
          createdAt: new Date(clerkUser.createdAt).toISOString(),
          updatedAt: new Date(clerkUser.lastSignInAt || clerkUser.createdAt).toISOString(),
        };

        // Get session token for Supabase
        const token = await (clerkUser as unknown as { getToken(opts: { template: string }): Promise<string | null> })
          .getToken({ template: 'supabase' });

        // Create session object
        const session = {
          accessToken: token || '',
          refreshToken: '', // Not needed with Clerk
          expiresAt: Date.now() + 3600 * 1000, // 1 hour from now
        };

        updateAuthState({
          user,
          session,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error syncing user:', error);
        updateAuthState({
          isLoading: false,
          error: error as Error,
        });
      }
    };

    syncUser();
  }, [isClerkLoaded, isSignedIn, clerkUser]);

  return (
    <ClerkAuthContext.Provider value={{ authState, isLoaded: isClerkLoaded }}>
      {children}
    </ClerkAuthContext.Provider>
  );
}

// Hook to use the auth context
export function useClerkAuth() {
  const context = useContext(ClerkAuthContext);
  if (context === undefined) {
    throw new Error('useClerkAuth must be used within a ClerkAuthProvider');
  }
  return context;
}

// Convenience hooks for accessing user and session
export function useClerkUser() {
  const { authState } = useClerkAuth();
  return authState.user;
}

export function useClerkSession() {
  const { authState } = useClerkAuth();
  return authState.session;
} 