import { ClerkProvider } from '@clerk/clerk-react';

// Validate environment variables
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Missing Clerk publishable key. Please check your .env file.');
}

// Export configuration for use in the app
export const clerkConfig = {
  publishableKey,
  // Add any additional Clerk configuration options here
  appearance: {
    // You can customize the appearance of Clerk components here
    elements: {
      formButtonPrimary: 'bg-green-500 hover:bg-green-600',
      footerActionLink: 'text-green-500 hover:text-green-600'
    },
  },
  // Modern redirect configuration
  signInUrl: '/auth',
  signUpUrl: '/sign-up',
  // Restore fallbackRedirectUrl - needed for standard redirects
  fallbackRedirectUrl: '/dashboard',
  // Development debugging
  debug: true,
  // Remove custom router functions - let ClerkProvider handle it via Router context
  // routerPush: ...
  // routerReplace: ...
  // routerDebug: ...
}; 