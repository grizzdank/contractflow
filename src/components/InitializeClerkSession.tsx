import React, { useEffect, useState, useContext } from 'react';
import { useClerk, useUser } from '@clerk/clerk-react';
import type { OrganizationMembershipResource } from '@clerk/types'; // Import type for clarity
import { Loader2 } from 'lucide-react'; // Assuming lucide-react for loading indicator
import { ClerkAuthContext } from '@/contexts/ClerkAuthContext'; // Import the context itself to get its type and consume it

interface InitializeClerkSessionProps {
  children: React.ReactNode;
}

export function InitializeClerkSession({ children }: InitializeClerkSessionProps) {
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

  const [initializationDone, setInitializationDone] = useState(false);

  useEffect(() => {
    // Ensure context function is available before proceeding
    if (!signalInitializationComplete || initializationDone) return;

    // Wait only for Clerk and useUser to be loaded
    if (!clerk.loaded || !isUserLoaded) {
      console.log('[InitializeClerkSession] Waiting for Clerk/User to load.');
      return;
    }

    console.log('[InitializeClerkSession] Clerk and User hooks loaded.');

    const completeInitialization = () => {
      console.log('[InitializeClerkSession] Completing initialization and signaling provider.');
      setInitializationDone(true);
      signalInitializationComplete(); 
    };

    // User must be signed in to proceed with org logic
    if (!isSignedIn || !user) {
      console.log('[InitializeClerkSession] User not signed in.');
      completeInitialization();
      return;
    }

    // Check if an organization is already active on the Clerk instance
    if (clerk.organization) {
      console.log(`[InitializeClerkSession] Organization already active: ${clerk.organization.id}`);
      completeInitialization();
      return;
    }

    // --- Fetch memberships directly from user object --- 
    console.log('[InitializeClerkSession] Fetching organization memberships directly...');
    user.getOrganizationMemberships()
      // Correctly handle the paginated response object
      .then((paginatedResponse) => { 
        const memberships = paginatedResponse.data; // Access the data array
        if (memberships && memberships.length > 0) {
          const firstMembership = memberships[0];
          console.log(`[InitializeClerkSession] Found memberships. Attempting to set active: ${firstMembership.organization.id}`);
          return clerk.setActive({ organization: firstMembership.organization.id })
             .then(() => {
                console.log(`[InitializeClerkSession] Successfully set active org: ${firstMembership.organization.id}`);
             });
        } else {
          console.log('[InitializeClerkSession] User has no organization memberships (fetched directly).');
          return Promise.resolve(); 
        }
      })
      .catch((error) => {
        console.error('[InitializeClerkSession] Error fetching memberships or setting active organization:', error);
      })
      .finally(() => {
          completeInitialization();
      });

  }, [
    clerk, // Add clerk instance as dependency for setActive
    isUserLoaded,
    isSignedIn,
    user,
    signalInitializationComplete,
    initializationDone
  ]);

  if (!initializationDone) {
    // Render loading indicator while waiting for this component's logic
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Initializing session...</span>
      </div>
    );
  }

  // Once initialization attempt is done, render the children
  return <>{children}</>;
}

export default InitializeClerkSession; 