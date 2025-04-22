import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import Navigation from './Navigation';

// This component wraps all authenticated routes
// It assumes it's rendered within ClerkAuthProvider and InitializeClerkSession
export default function ProtectedLayout() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('[ProtectedLayout] Component state:', {
      isLoaded,
      hasUser: !!user,
      pathname: location.pathname
    });

    if (isLoaded && !user) {
      console.log('[ProtectedLayout] No authenticated user, redirecting to auth');
      navigate('/auth', {
        replace: true,
        state: { redirectTo: location.pathname }
      });
    }
  }, [isLoaded, user, location.pathname]);

  if (!isLoaded) {
    console.log('[ProtectedLayout] Auth state loading');
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-green-500" />
      </div>
    );
  }

  if (!user) {
    console.log('[ProtectedLayout] No user, rendering nothing while redirect happens');
    return null;
  }

  console.log('[ProtectedLayout] Rendering protected content');
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
