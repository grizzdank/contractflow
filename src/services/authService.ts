import { supabase } from '@/lib/supabase/client';
import { User, UserRole, Session } from '@/domain/types/Auth';

/**
 * AuthService provides methods for handling authentication operations
 * using Supabase as the backend authentication provider.
 */
export class AuthService {
  private logPrefix = '[AuthService]';

  /**
   * Log a message with the AuthService prefix
   */
  private log(message: string, data?: any): void {
    if (data) {
      console.log(`${this.logPrefix} ${message}`, data);
    } else {
      console.log(`${this.logPrefix} ${message}`);
    }
  }

  /**
   * Log an error with the AuthService prefix
   */
  private logError(message: string, error: any): void {
    console.error(`${this.logPrefix} ${message}`, error);
  }

  /**
   * Sign up a new user with email and password
   * Also creates a profile and organization if needed
   */
  async signUp(
    email: string,
    password: string,
    fullName?: string,
    organizationName?: string
  ): Promise<{ user: User | null; error: Error | null }> {
    this.log(`Signing up user with email: ${email}`);
    
    try {
      // Split full name into first and last name if provided
      let firstName: string | undefined;
      let lastName: string | undefined;
      
      if (fullName) {
        const nameParts = fullName.trim().split(' ');
        firstName = nameParts[0];
        lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;
        this.log(`Parsed name: firstName=${firstName}, lastName=${lastName}`);
      }

      // 1. Create the auth user
      this.log('Creating auth user in Supabase');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: fullName,
            organization_name: organizationName,
          },
        },
      });

      if (authError) {
        this.logError('Auth user creation failed', authError);
        throw authError;
      }
      
      if (!authData.user) {
        this.logError('Auth user creation failed', 'No user returned from Supabase');
        throw new Error('User creation failed');
      }
      
      this.log('Auth user created successfully', { userId: authData.user.id });
      
      // Store user metadata for later use after email verification
      // The profile and organization will be created when the user confirms their email
      // and signs in for the first time
      
      // Format and return the user
      const user: User = {
        id: authData.user.id,
        email: authData.user.email || '',
        firstName,
        lastName,
        role: UserRole.ADMINISTRATOR, // Default role for new users
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.log('Sign up completed successfully', { userId: user.id });
      return { user, error: null };
    } catch (error) {
      this.logError('Sign up error', error);
      return { user: null, error: error as Error };
    }
  }

  /**
   * Sign in a user with email and password
   */
  async signIn(
    email: string,
    password: string
  ): Promise<{ user: User | null; session: Session | null; error: Error | null }> {
    this.log(`Signing in user with email: ${email}`);
    
    try {
      // 1. Authenticate with Supabase
      this.log('Authenticating with Supabase');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        this.logError('Authentication failed', authError);
        throw authError;
      }
      
      if (!authData.user || !authData.session) {
        this.logError('Authentication failed', 'No user or session returned from Supabase');
        throw new Error('Authentication failed');
      }
      
      this.log('Authentication successful', { userId: authData.user.id });

      // 2. Check if profile exists, if not create it (first-time sign-in after email verification)
      this.log('Checking if user profile exists');
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
        
      if (profileCheckError && profileCheckError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        this.logError('Error checking for existing profile', profileCheckError);
        throw profileCheckError;
      }
      
      // If profile doesn't exist, create it along with organization if needed
      if (!existingProfile) {
        this.log('First-time sign-in detected, creating profile and organization');
        
        // Get user metadata from auth user
        const userData = authData.user.user_metadata;
        const fullName = userData.full_name;
        const organizationName = userData.organization_name;
        
        this.log('Retrieved user metadata', { fullName, organizationName });
        
        // Create organization if name was provided during signup
        let organizationId: string | undefined;
        
        if (organizationName) {
          this.log(`Creating organization: ${organizationName}`);
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .insert([{ name: organizationName }])
            .select('id')
            .single();

          if (orgError) {
            this.logError('Organization creation failed', orgError);
            throw orgError;
          }
          
          organizationId = orgData.id;
          this.log('Organization created successfully', { organizationId });
          
          // Add user as organization admin
          this.log('Adding user as organization admin');
          const { error: memberError } = await supabase
            .from('organization_members')
            .insert([
              {
                user_id: authData.user.id,
                organization_id: organizationId,
                role: 'admin', // Default to admin for the creator
              },
            ]);

          if (memberError) {
            this.logError('Adding user as organization admin failed', memberError);
            throw memberError;
          }
          
          this.log('User added as organization admin successfully');
        }
        
        // Create profile
        this.log('Creating user profile');
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email: email,
              full_name: fullName,
              organization_id: organizationId,
            },
          ])
          .select()
          .single();

        if (profileError) {
          this.logError('Profile creation failed', profileError);
          throw profileError;
        }
        
        this.log('Profile created successfully', { profileId: profileData.id });
      }

      // 3. Get the user's profile
      this.log('Fetching user profile');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, organizations(*)')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        this.logError('Fetching user profile failed', profileError);
        throw profileError;
      }
      
      this.log('User profile fetched successfully', { 
        profileId: profileData.id,
        organizationId: profileData.organization_id 
      });

      // 4. Get the user's role from organization_members
      this.log('Fetching user role');
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', authData.user.id)
        .eq('organization_id', profileData.organization_id)
        .single();

      if (memberError && memberError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        this.logError('Fetching user role failed', memberError);
        // We don't throw here as the user might not have a role yet
        this.log('User has no explicit role, will use default');
      } else if (memberData) {
        this.log('User role fetched successfully', { role: memberData.role });
      }

      // 5. Parse full name into first and last name
      let firstName: string | undefined;
      let lastName: string | undefined;
      
      if (profileData.full_name) {
        const nameParts = profileData.full_name.trim().split(' ');
        firstName = nameParts[0];
        lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;
        this.log(`Parsed name: firstName=${firstName}, lastName=${lastName}`);
      }

      // 6. Format and return the user and session
      const user: User = {
        id: authData.user.id,
        email: authData.user.email || '',
        firstName,
        lastName,
        role: this.mapDatabaseRoleToUserRole(memberData?.role || 'viewer'),
        organizationId: profileData.organization_id,
        createdAt: profileData.created_at,
        updatedAt: profileData.updated_at,
      };

      const session: Session = {
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expiresAt: new Date(authData.session.expires_at || 0).getTime(),
      };

      this.log('Sign in completed successfully', { 
        userId: user.id,
        role: user.role,
        sessionExpiry: new Date(session.expiresAt).toISOString()
      });
      
      return { user, session, error: null };
    } catch (error) {
      this.logError('Sign in error', error);
      return { user: null, session: null, error: error as Error };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: Error | null }> {
    this.log('Signing out user');
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        this.logError('Sign out failed', error);
        throw error;
      }
      
      this.log('Sign out successful');
      return { error: null };
    } catch (error) {
      this.logError('Sign out error', error);
      return { error: error as Error };
    }
  }

  /**
   * Get the current session and user
   */
  async getCurrentSession(): Promise<{ user: User | null; session: Session | null; error: Error | null }> {
    this.log('Getting current session');
    
    try {
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        this.logError('Getting session failed', authError);
        throw authError;
      }
      
      if (!authData.session) {
        this.log('No active session found');
        return { user: null, session: null, error: null };
      }
      
      this.log('Session found', { 
        userId: authData.session.user.id,
        expires: new Date(authData.session.expires_at || 0).toISOString()
      });

      // Get the user's profile
      this.log('Fetching user profile');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, organizations(*)')
        .eq('id', authData.session.user.id)
        .single();

      if (profileError) {
        this.logError('Fetching user profile failed', profileError);
        throw profileError;
      }
      
      this.log('User profile fetched successfully', { 
        profileId: profileData.id,
        organizationId: profileData.organization_id 
      });

      // Get the user's role from organization_members
      this.log('Fetching user role');
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', authData.session.user.id)
        .eq('organization_id', profileData.organization_id)
        .single();

      if (memberError && memberError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        this.logError('Fetching user role failed', memberError);
        // We don't throw here as the user might not have a role yet
        this.log('User has no explicit role, will use default');
      } else if (memberData) {
        this.log('User role fetched successfully', { role: memberData.role });
      }

      // Parse full name into first and last name
      let firstName: string | undefined;
      let lastName: string | undefined;
      
      if (profileData.full_name) {
        const nameParts = profileData.full_name.trim().split(' ');
        firstName = nameParts[0];
        lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;
        this.log(`Parsed name: firstName=${firstName}, lastName=${lastName}`);
      }

      // Format and return the user and session
      const user: User = {
        id: authData.session.user.id,
        email: authData.session.user.email || '',
        firstName,
        lastName,
        role: this.mapDatabaseRoleToUserRole(memberData?.role || 'viewer'),
        organizationId: profileData.organization_id,
        createdAt: profileData.created_at,
        updatedAt: profileData.updated_at,
      };

      const session: Session = {
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expiresAt: new Date(authData.session.expires_at || 0).getTime(),
      };

      this.log('Get current session completed successfully', { 
        userId: user.id,
        role: user.role,
        sessionExpiry: new Date(session.expiresAt).toISOString()
      });
      
      return { user, session, error: null };
    } catch (error) {
      this.logError('Get current session error', error);
      return { user: null, session: null, error: error as Error };
    }
  }

  /**
   * Reset password for a user
   */
  async resetPassword(email: string): Promise<{ error: Error | null }> {
    this.log(`Requesting password reset for email: ${email}`);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        this.logError('Password reset request failed', error);
        throw error;
      }
      
      this.log('Password reset email sent successfully');
      return { error: null };
    } catch (error) {
      this.logError('Reset password error', error);
      return { error: error as Error };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(password: string): Promise<{ error: Error | null }> {
    this.log('Updating user password');
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        this.logError('Password update failed', error);
        throw error;
      }
      
      this.log('Password updated successfully');
      return { error: null };
    } catch (error) {
      this.logError('Update password error', error);
      return { error: error as Error };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: { firstName?: string; lastName?: string }
  ): Promise<{ error: Error | null }> {
    this.log(`Updating profile for user: ${userId}`, updates);
    
    try {
      // Combine first and last name for the full_name field
      let fullName: string | undefined;
      if (updates.firstName || updates.lastName) {
        fullName = [updates.firstName, updates.lastName].filter(Boolean).join(' ');
        this.log(`Combined name: ${fullName}`);
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        this.logError('Profile update failed', error);
        throw error;
      }
      
      this.log('Profile updated successfully');
      return { error: null };
    } catch (error) {
      this.logError('Update profile error', error);
      return { error: error as Error };
    }
  }

  /**
   * Map database role to UserRole enum
   */
  private mapDatabaseRoleToUserRole(dbRole: string): UserRole {
    this.log(`Mapping database role: ${dbRole}`);
    
    let userRole: UserRole;
    switch (dbRole.toLowerCase()) {
      case 'admin':
        userRole = UserRole.ADMINISTRATOR;
        break;
      case 'manager':
        userRole = UserRole.MANAGER;
        break;
      case 'reviewer':
        userRole = UserRole.REVIEWER;
        break;
      case 'contributor':
        userRole = UserRole.CONTRIBUTOR;
        break;
      case 'viewer':
      default:
        userRole = UserRole.VIEWER;
        break;
    }
    
    this.log(`Mapped to UserRole: ${userRole}`);
    return userRole;
  }
}

// Export a singleton instance
export const authService = new AuthService(); 