import { useEffect, ReactNode } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import Footer from './Footer';

interface ProtectedLayoutProps {
  children: ReactNode;
}

// This component wraps all authenticated routes
// It assumes it's rendered within ClerkAuthProvider and InitializeClerkSession
export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('[ProtectedLayout] Component state:', {
      isLoaded,
      hasUser: !!user,
      pathname: location.pathname,
      userDetails: user ? {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        fullName: user.fullName
      } : null
    });

    if (!isLoaded) {
      console.log('[ProtectedLayout] Auth state still loading...');
      return;
    }

    if (!user) {
      console.log('[ProtectedLayout] No authenticated user, redirecting to auth');
      navigate('/auth', {
        replace: true,
        state: { redirectTo: location.pathname }
      });
      return;
    }

    // Ensure we're in the dashboard path
    if (!location.pathname.startsWith('/dashboard')) {
      console.log('[ProtectedLayout] Not in dashboard path, redirecting');
      navigate('/dashboard', { replace: true });
      return;
    }

    console.log('[ProtectedLayout] All checks passed, rendering protected content');
  }, [isLoaded, user, location.pathname]);

  if (!isLoaded) {
    console.log('[ProtectedLayout] Rendering loading state');
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
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
