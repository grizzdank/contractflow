import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthState } from '@/domain/types/Auth';
import { authService } from '@/services/authService';

// Define the shape of the context
interface AuthContextType {
  // Current auth state
  authState: AuthState;
  
  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string, organizationName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: { firstName?: string; lastName?: string }) => Promise<{ error: Error | null }>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial auth state
const initialAuthState: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  error: null,
};

// Provider component that wraps the app and makes auth object available to any child component that calls useAuth()
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  
  // Function to update auth state
  const updateAuthState = (updates: Partial<AuthState>) => {
    setAuthState((prevState) => ({
      ...prevState,
      ...updates,
    }));
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        updateAuthState({ isLoading: true, error: null });
        
        const { user, session, error } = await authService.getCurrentSession();
        
        if (error) {
          console.error('Error checking session:', error);
          updateAuthState({ isLoading: false, error });
          return;
        }
        
        updateAuthState({ user, session, isLoading: false, error: null });
      } catch (error) {
        console.error('Unexpected error checking session:', error);
        updateAuthState({ isLoading: false, error: error as Error });
      }
    };
    
    checkSession();
    
    // Set up Supabase auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
        
        if (event === 'SIGNED_OUT') {
          // Clear auth state on sign out
          updateAuthState({ user: null, session: null, isLoading: false });
        } else if (session) {
          // Refresh user data on auth state change
          checkSession();
        }
      }
    );
    
    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in method
  const signIn = async (email: string, password: string) => {
    updateAuthState({ isLoading: true, error: null });
    
    try {
      const { user, session, error } = await authService.signIn(email, password);
      
      if (error) {
        updateAuthState({ isLoading: false, error });
        return { error };
      }
      
      updateAuthState({ user, session, isLoading: false, error: null });
      return { error: null };
    } catch (error) {
      const typedError = error as Error;
      updateAuthState({ isLoading: false, error: typedError });
      return { error: typedError };
    }
  };

  // Sign up method
  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    organizationName?: string
  ) => {
    updateAuthState({ isLoading: true, error: null });
    
    try {
      const { user, error } = await authService.signUp(
        email,
        password,
        fullName,
        organizationName
      );
      
      if (error) {
        updateAuthState({ isLoading: false, error });
        return { error };
      }
      
      // Note: We don't update the auth state here because the user needs to confirm their email
      // They will need to sign in after confirmation
      updateAuthState({ isLoading: false });
      return { error: null };
    } catch (error) {
      const typedError = error as Error;
      updateAuthState({ isLoading: false, error: typedError });
      return { error: typedError };
    }
  };

  // Sign out method
  const signOut = async () => {
    updateAuthState({ isLoading: true, error: null });
    
    try {
      const { error } = await authService.signOut();
      
      if (error) {
        updateAuthState({ isLoading: false, error });
        return { error };
      }
      
      updateAuthState({ user: null, session: null, isLoading: false, error: null });
      return { error: null };
    } catch (error) {
      const typedError = error as Error;
      updateAuthState({ isLoading: false, error: typedError });
      return { error: typedError };
    }
  };

  // Reset password method
  const resetPassword = async (email: string) => {
    updateAuthState({ isLoading: true, error: null });
    
    try {
      const { error } = await authService.resetPassword(email);
      
      if (error) {
        updateAuthState({ isLoading: false, error });
        return { error };
      }
      
      updateAuthState({ isLoading: false });
      return { error: null };
    } catch (error) {
      const typedError = error as Error;
      updateAuthState({ isLoading: false, error: typedError });
      return { error: typedError };
    }
  };

  // Update password method
  const updatePassword = async (password: string) => {
    updateAuthState({ isLoading: true, error: null });
    
    try {
      const { error } = await authService.updatePassword(password);
      
      if (error) {
        updateAuthState({ isLoading: false, error });
        return { error };
      }
      
      updateAuthState({ isLoading: false });
      return { error: null };
    } catch (error) {
      const typedError = error as Error;
      updateAuthState({ isLoading: false, error: typedError });
      return { error: typedError };
    }
  };

  // Update profile method
  const updateProfile = async (updates: { firstName?: string; lastName?: string }) => {
    if (!authState.user) {
      return { error: new Error('No authenticated user') };
    }
    
    updateAuthState({ isLoading: true, error: null });
    
    try {
      const { error } = await authService.updateProfile(authState.user.id, updates);
      
      if (error) {
        updateAuthState({ isLoading: false, error });
        return { error };
      }
      
      // Update the user in the auth state with the new profile data
      if (authState.user) {
        const updatedUser: User = {
          ...authState.user,
          firstName: updates.firstName ?? authState.user.firstName,
          lastName: updates.lastName ?? authState.user.lastName,
          updatedAt: new Date().toISOString(),
        };
        
        updateAuthState({ user: updatedUser, isLoading: false });
      }
      
      return { error: null };
    } catch (error) {
      const typedError = error as Error;
      updateAuthState({ isLoading: false, error: typedError });
      return { error: typedError };
    }
  };

  // Create the value object that will be provided by the context
  const value: AuthContextType = {
    authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Convenience hooks for common auth operations
export function useUser() {
  const { authState } = useAuth();
  return authState.user;
}

export function useSession() {
  const { authState } = useAuth();
  return authState.session;
}

export function useAuthLoading() {
  const { authState } = useAuth();
  return authState.isLoading;
}

export function useAuthError() {
  const { authState } = useAuth();
  return authState.error;
}

// Import at the end to avoid circular dependencies
import { supabase } from '@/lib/supabase/client'; 