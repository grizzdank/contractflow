import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/domain/types/Auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * ProtectedRoute component that restricts access to routes based on authentication status
 * and optionally user roles.
 * 
 * @param children - The components to render if the user is authenticated
 * @param allowedRoles - Optional array of roles that are allowed to access the route
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, session, isLoading } = useAuth();
  const location = useLocation();

  console.log(`[ProtectedRoute] Path: ${location.pathname} - Checking auth...`, {
    isLoading,
    hasUser: !!user,
    userId: user?.id,
    userRole: user?.role,
    hasSession: !!session,
    allowedRoles,
  });

  if (isLoading) {
    console.log(`[ProtectedRoute] Path: ${location.pathname} - Still loading auth state.`);
    return <div>Authenticating... Please wait.</div>;
  }

  if (!user) {
    console.log(`[ProtectedRoute] Path: ${location.pathname} - No user found. Redirecting to /auth.`);
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log(`[ProtectedRoute] Path: ${location.pathname} - User role (${user.role}) not allowed. Allowed: ${allowedRoles.join(', ')}. Redirecting to /unauthorized.`);
    return <Navigate to="/unauthorized" replace />;
  }

  console.log(`[ProtectedRoute] Path: ${location.pathname} - Access granted. Rendering children.`);
  return <>{children}</>;
} 