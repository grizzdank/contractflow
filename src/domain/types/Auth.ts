export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  ADMINISTRATOR = 'administrator',
  MANAGER = 'manager',
  REVIEWER = 'reviewer',
  CONTRIBUTOR = 'contributor',
  VIEWER = 'viewer'
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
} 