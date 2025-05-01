import { Navigate, useLocation } from 'react-router-dom';
// import { useAuth } from '@/hooks/useAuth'; // REMOVE Old hook
import { useClerkAuth } from '@/contexts/ClerkAuthContext'; // IMPORT Correct hook
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
  // const auth = useAuth(); // REMOVE Old hook usage
  const { userDetails, isLoading, isAuthenticated } = useClerkAuth(); // USE Correct hook
  const location = useLocation();

  // Get role from userDetails
  const userRole = userDetails?.role;

  console.log(`[ProtectedRoute] Path: ${location.pathname} - Checking auth...`, {
    isLoading,
    isAuthenticated,
    userId: userDetails?.supabaseUserId, // Use ID from userDetails
    userRole, // Log the fetched role
    allowedRoles,
  });

  if (isLoading) {
    console.log(`[ProtectedRoute] Path: ${location.pathname} - Still loading auth state.`);
    return <div>Authenticating... Please wait.</div>;
  }

  // Check isAuthenticated first
  if (!isAuthenticated) {
    console.log(`[ProtectedRoute] Path: ${location.pathname} - User not authenticated. Redirecting to /auth.`);
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if userDetails (including role) is available
  if (!userDetails) {
     console.warn(`[ProtectedRoute] Path: ${location.pathname} - Authenticated but userDetails not available. Redirecting to /unauthorized temporarily.`);
    // This might indicate a timing issue in context loading, but redirecting is safer for now.
    return <Navigate to="/unauthorized" replace />;
  }

  // Now check roles using userRole from userDetails
  if (allowedRoles && (!userRole || !allowedRoles.includes(userRole as UserRole))) {
    console.log(`[ProtectedRoute] Path: ${location.pathname} - User role (${userRole || 'None'}) not allowed. Allowed: ${allowedRoles.join(', ')}. Redirecting to /unauthorized.`);
    return <Navigate to="/unauthorized" replace />;
  }

  console.log(`[ProtectedRoute] Path: ${location.pathname} - Access granted. Rendering children.`);
  return <>{children}</>;
} 