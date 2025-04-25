import { useLocation, useNavigate } from 'react-router-dom';
import { SignIn, SignUp, useClerk, useUser } from '@clerk/clerk-react';

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const clerk = useClerk();
  
  const isSignUp = location.pathname === '/sign-up';
  
  console.log('[Auth] Rendering Clerk Sign In/Up component...');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 via-white to-orange-50">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-white/80 backdrop-blur-sm p-6 shadow-lg">
            {isSignUp ? (
              <SignUp
                appearance={{
                  elements: {
                formButtonPrimary: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700',
                footerActionLink: 'text-emerald-600 hover:text-emerald-700'
                  }
                }}
                signInUrl="/auth"
            fallbackRedirectUrl="/dashboard"
              />
            ) : (
              <SignIn
                appearance={{
                  elements: {
                formButtonPrimary: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700',
                footerActionLink: 'text-emerald-600 hover:text-emerald-700'
                  }
                }}
                signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard"
              />
            )}
          </div>
        </div>
  );
}
