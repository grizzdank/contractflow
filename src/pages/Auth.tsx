import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SignIn, SignUp, useClerk, useUser } from '@clerk/clerk-react';
import { ThemeProvider } from '@/components/theme-provider';
import Navigation from "@/components/Navigation";

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const clerk = useClerk();
  
  const isSignUp = location.pathname === '/sign-up';
  
  // Log component state
  useEffect(() => {
    console.log('[Auth] Component mounted', {
      isSignUp,
      pathname: location.pathname,
      user: !!user,
      state: location.state
    });
    
    return () => {
      console.log('[Auth] Component unmounting');
    };
  }, [location, user, isSignUp]);

  // Handle successful authentication
  const handleSuccess = () => {
    console.log('[Auth] Authentication successful');
    const destination = location.state?.redirectTo || '/';
    console.log('[Auth] Navigating to:', destination);
    navigate(destination, { replace: true });
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      console.log('[Auth] User already authenticated, redirecting');
      handleSuccess();
    }
  }, [user]);

  return (
    <>
      <Navigation />
      <ThemeProvider defaultTheme="dark" storageKey="contractflow-ui-theme">
        <div className="flex min-h-screen flex-col items-center justify-center bg-background">
          <div className="w-full max-w-md space-y-6 rounded-lg border p-6 shadow-lg">
            {isSignUp ? (
              <SignUp
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-green-500 hover:bg-green-600',
                    footerActionLink: 'text-green-500 hover:text-green-600'
                  }
                }}
                signInUrl="/auth"
                redirectUrl="/"
                fallbackRedirectUrl="/"
              />
            ) : (
              <SignIn
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-green-500 hover:bg-green-600',
                    footerActionLink: 'text-green-500 hover:text-green-600'
                  }
                }}
                signUpUrl="/sign-up"
                redirectUrl="/"
                fallbackRedirectUrl="/"
              />
            )}
          </div>
        </div>
      </ThemeProvider>
    </>
  );
}
