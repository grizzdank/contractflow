import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { ContractService } from '@/services/ContractService';
import { FileService } from '@/services/FileService';
import { IContractService } from '@/services/interfaces/IContractService';
import { IFileService, GetTokenFn } from '@/services/interfaces/IFileService';

interface AppUserDetails {
    clerkUserId: string | null;
    supabaseUserId: string | null;
    email: string | null;
    organizationId: string | null;
    role: string | null; 
}

// Define the structure for the services object
interface AppServices {
    contract: IContractService | null;
    file: IFileService | null;
}

export interface ClerkAuthContextType { 
    isLoading: boolean;
    authError: Error | null;
    getToken: GetTokenFn;
    contractServiceInstance: IContractService | null;
    fileServiceInstance: IFileService | null;
    services: AppServices;
    appUserDetails: AppUserDetails;
    isAuthenticated: boolean;
}

const ClerkAuthContext = createContext<ClerkAuthContextType | undefined>(undefined);

export const ClerkAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const { user: clerkUser } = useUser();
    
    const [authError, setAuthError] = useState<Error | null>(null);
    const [appUserDetails, setAppUserDetails] = useState<AppUserDetails>({
        clerkUserId: null,
        supabaseUserId: null,
        email: null,
        organizationId: null,
        role: null,
    });

    useEffect(() => {
        console.log("[ClerkAuthContext] AppUserDetailsEffect triggered. isLoaded:", isLoaded, "isSignedIn:", isSignedIn, "clerkUser:", !!clerkUser);
        if (isLoaded && clerkUser && isSignedIn) {
            const orgMember = clerkUser.organizationMemberships?.[0];
            const supabaseIdFromClerk = (clerkUser.publicMetadata as any)?.supabase_id as string || null;
            
            const newDetails: AppUserDetails = {
                clerkUserId: clerkUser.id,
                supabaseUserId: supabaseIdFromClerk,
                email: clerkUser.primaryEmailAddress?.emailAddress || null,
                organizationId: orgMember?.organization.id || null,
                role: orgMember?.role || null,
            };
            setAppUserDetails(newDetails);
            console.log("[ClerkAuthContext] appUserDetails updated:", newDetails);

            if (!supabaseIdFromClerk) {
                console.warn("[ClerkAuthContext] supabase_id not found in Clerk user publicMetadata.");
            }
        } else if (isLoaded && !isSignedIn) {
            const clearedDetails: AppUserDetails = { clerkUserId: null, supabaseUserId: null, email: null, organizationId: null, role: null };
            setAppUserDetails(clearedDetails);
            setAuthError(null); 
            console.log("[ClerkAuthContext] User signed out, appUserDetails cleared.");
        }
    }, [isLoaded, clerkUser, isSignedIn]);

    const fileServiceInstance = useMemo<IFileService | null>(() => {
        if (isLoaded && isSignedIn && getToken) {
            try {
                console.log("[ClerkAuthContext] Attempting to instantiate FileService.");
                const instance = new FileService(getToken);
                console.log("[ClerkAuthContext] FileService instantiated successfully.");
                return instance;
            } catch (e: any) { 
                console.error("[ClerkAuthContext] Failed to instantiate FileService:", e);
                setAuthError(prevError => prevError || new Error("FileService instantiation failed: " + e.message));
                return null;
            }
        }
        console.log("[ClerkAuthContext] Conditions not met for FileService instantiation. isLoaded:", isLoaded, "isSignedIn:", isSignedIn, "getToken:", !!getToken);
        return null;
    }, [isLoaded, isSignedIn, getToken]);

    const contractServiceInstance = useMemo<IContractService | null>(() => {
        const { organizationId, supabaseUserId, email } = appUserDetails;
        if (isLoaded && isSignedIn && getToken && fileServiceInstance && organizationId && supabaseUserId && email) {
             try {
                console.log("[ClerkAuthContext] Attempting to instantiate ContractService with:", { organizationId, supabaseUserId, email, fileServiceReady: !!fileServiceInstance });
                const instance = new ContractService(getToken, organizationId, supabaseUserId, email, fileServiceInstance);
                console.log("[ClerkAuthContext] ContractService instantiated successfully.");
                return instance;
            } catch (e: any) { 
                console.error("[ClerkAuthContext] Failed to instantiate ContractService:", e);
                setAuthError(prevError => prevError || new Error("ContractService instantiation failed: " + e.message));
                return null;
             }
        }
        console.log("[ClerkAuthContext] Conditions not met for ContractService instantiation. isLoaded:", isLoaded, "isSignedIn:", isSignedIn, "getToken:", !!getToken, "fileService:", !!fileServiceInstance, "appUserDetails:", appUserDetails);
        return null;
    }, [isLoaded, isSignedIn, getToken, fileServiceInstance, appUserDetails]);

    const contextIsLoading = !isLoaded || 
                           (isSignedIn && 
                            (!appUserDetails.organizationId || 
                             !appUserDetails.supabaseUserId || 
                             !fileServiceInstance || 
                             !contractServiceInstance));
    
    const isAuthenticated = isSignedIn && 
                            !!appUserDetails.organizationId && 
                            !!appUserDetails.supabaseUserId &&
                            !!fileServiceInstance && 
                            !!contractServiceInstance;
    
    console.log("[ClerkAuthContext] Recalculated flags. contextIsLoading:", contextIsLoading, "isAuthenticated:", isAuthenticated, "appUserDetails:", appUserDetails, "services:", {contract:!!contractServiceInstance, file:!!fileServiceInstance});

    const value: ClerkAuthContextType = {
        isLoading: contextIsLoading,
        authError,
        getToken,
        contractServiceInstance,
        fileServiceInstance,
        services: {
            contract: contractServiceInstance,
            file: fileServiceInstance
        },
        appUserDetails,
        isAuthenticated,
    };

    return (
        <ClerkAuthContext.Provider value={value}>
            {children}
        </ClerkAuthContext.Provider>
    );
};

export const useClerkAuth = (): ClerkAuthContextType => {
    const context = useContext(ClerkAuthContext);
    if (context === undefined) {
        throw new Error('useClerkAuth must be used within a ClerkAuthProvider');
    }
    return context;
};