import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/domain/types/Auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

/**
 * ProtectedRoute component that restricts access to routes based on authentication status
 * and optionally user roles.
 * 
 * @param children - The components to render if the user is authenticated
 * @param requiredRoles - Optional array of roles that are allowed to access the route
 */
export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { authState } = useAuth();
  const location = useLocation();
  
  // Show loading state
  if (authState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!authState.user || !authState.session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // Check role requirements if specified
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(authState.user.role);
    
    if (!hasRequiredRole) {
      // Redirect to unauthorized page or dashboard
      return <Navigate to="/unauthorized" replace />;
    }
  }
  
  // User is authenticated and has required role (if specified)
  return <>{children}</>;
} 