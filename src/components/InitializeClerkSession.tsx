import React, { useContext, useEffect, useState } from 'react';
import { useClerk, useUser } from '@clerk/clerk-react';
import type { OrganizationMembershipResource } from '@clerk/types'; // Import type for clarity
import { Loader2 } from 'lucide-react'; // Assuming lucide-react for loading indicator
import { ClerkAuthContext } from '@/contexts/ClerkAuthContext'; // Import the context itself to get its type and consume it

interface InitializeClerkSessionProps {
  children: React.ReactNode;
}

export function InitializeClerkSession({ children }: InitializeClerkSessionProps) {
  console.log('[InitializeClerkSession] Component rendering');

  try {
    const clerk = useClerk();
    const { isLoaded: isUserLoaded, isSignedIn, user } = useUser();
    
    // No longer using useOrganizationList here
    // const { 
    //   isLoaded: isOrgListLoaded, 
    //   setActive, 
    //   userMemberships
    // } = useOrganizationList({
    //   userMemberships: true
    // });

    // Get the context, handling potential undefined initial state
    const context = useContext(ClerkAuthContext);
    const signalInitializationComplete = context?.signalInitializationComplete;

    console.log('[InitializeClerkSession] Initial state:', {
      clerkLoaded: clerk.loaded,
      isUserLoaded,
      isSignedIn,
      hasUser: !!user,
      hasContext: !!context,
      hasSignalFn: !!signalInitializationComplete
    });

    const [initializationDone, setInitializationDone] = useState(false);

    useEffect(() => {
      console.log('[InitializeClerkSession] Effect running with state:', {
        clerkLoaded: clerk.loaded,
        isUserLoaded,
        isSignedIn,
        hasUser: !!user,
        hasContext: !!context,
        hasSignalFn: !!signalInitializationComplete,
        initializationDone
      });

      // Ensure context function is available before proceeding
      if (!signalInitializationComplete) {
        console.error('[InitializeClerkSession] Missing signalInitializationComplete function from context');
        return;
      }

      if (initializationDone) {
        console.log('[InitializeClerkSession] Initialization already completed');
        return;
      }

      // Wait only for Clerk and useUser to be loaded
      if (!clerk.loaded || !isUserLoaded) {
        console.log('[InitializeClerkSession] Still waiting for Clerk/User to load');
        return;
      }

      console.log('[InitializeClerkSession] Clerk and User hooks loaded');

      const completeInitialization = () => {
        console.log('[InitializeClerkSession] Completing initialization');
        setInitializationDone(true);
        signalInitializationComplete();
      };

      // User must be signed in to proceed with org logic
      if (!isSignedIn || !user) {
        console.log('[InitializeClerkSession] User not signed in, completing initialization');
        completeInitialization();
        return;
      }

      // Check if an organization is already active
      if (clerk.organization) {
        console.log(`[InitializeClerkSession] Organization already active: ${clerk.organization.id}`);
        completeInitialization();
        return;
      }

      // Fetch memberships
      console.log('[InitializeClerkSession] Fetching organization memberships');
      user.getOrganizationMemberships()
        .then((response) => {
          const memberships = response.data;
          console.log('[InitializeClerkSession] Got memberships:', memberships?.length);
          
          if (memberships && memberships.length > 0) {
            const firstMembership = memberships[0];
            console.log(`[InitializeClerkSession] Setting active org: ${firstMembership.organization.id}`);
            return clerk.setActive({ organization: firstMembership.organization.id });
          }
          return Promise.resolve();
        })
        .catch((error) => {
          console.error('[InitializeClerkSession] Error handling memberships:', error);
        })
        .finally(() => {
          console.log('[InitializeClerkSession] Membership handling complete');
          completeInitialization();
        });

    }, [clerk, isUserLoaded, isSignedIn, user, signalInitializationComplete, initializationDone]);

    if (!initializationDone) {
      console.log('[InitializeClerkSession] Rendering loading state');
      return (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Initializing session...</span>
        </div>
      );
    }

    console.log('[InitializeClerkSession] Rendering children');
    return <>{children}</>;
  } catch (error) {
    console.error('[InitializeClerkSession] Fatal error:', error);
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600">Initialization Error</h2>
          <pre className="mt-4 text-sm text-gray-600">{error?.toString()}</pre>
        </div>
      </div>
    );
  }
}

export default InitializeClerkSession; 