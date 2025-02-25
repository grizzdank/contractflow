Below is the step-by-step implementation plan for ContractFlow structured into five phases.

## Phase 1: Environment Setup

1.  **Install Tools:**

    *   Verify that Node.js v20+ is installed on your development machine. If not, install the latest stable version of Node.js.

2.  **Initialize React Project with Vite:**

    *   Create a new React project with TypeScript and Vite by running:

    ```
    npm create vite@latest contractflow -- --template react-ts
    ```

    *   This provides a modern, fast development environment with hot module replacement.

3.  **Configure Tailwind CSS:**

    *   Install and configure Tailwind CSS with PostCSS:
    
    ```
    npm install -D tailwindcss postcss autoprefixer
    npx tailwindcss init -p
    ```
    
    *   Update the Tailwind configuration in `tailwind.config.ts` and include Tailwind directives in `src/index.css`.

4.  **Set Up UI Component Libraries:**

    *   Install shadcn/UI, Radix UI, and Lucide Icons:
    
    ```
    npm install @radix-ui/react-* lucide-react
    ```
    
    *   Configure shadcn UI components using the components.json file.

5.  **Initialize Git Repository:**

    *   Create a Git repository with `main` and `dev` branches and apply branch protection rules.

6.  **Validation:**

    *   Run `node -v` and `npm run dev` to verify that the development server starts correctly.

## Phase 2: Frontend Development

1.  **Project Structure Setup:**

    *   Create directories `/src/pages`, `/src/components`, `/src/lib`, `/src/hooks`, and `/src/integrations` in the project.

2.  **Landing and Registration Page:**

    *   Create `src/pages/Index.tsx` with a clean, minimalistic landing page per design guidelines.

3.  **User Registration & Authentication Pages:**

    *   Create `src/pages/Auth.tsx` that integrates Supabase authentication.

4.  **Protected Layout Component:**

    *   Create a reusable layout component at `src/components/ProtectedLayout.tsx` to support role-based rendering.

5.  **Navigation Component:**

    *   Create `src/components/Navigation.tsx` for consistent navigation across the application.

6.  **Contract Management Pages:**

    *   Create `src/pages/Contracts.tsx` for the centralized searchable contract repository.
    *   Create `src/pages/ContractDetails.tsx` for viewing contract details.
    *   Create `src/pages/ContractRequest.tsx` for creating new contract requests.
    *   Create `src/pages/ContractApproval.tsx` for the contract approval workflow.

7.  **Contract Components:**

    *   Create reusable components in `src/components/contract/` for contract-related functionality:
        *   `ContractHeader.tsx` for displaying contract header information
        *   `ContractDetailsGrid.tsx` for displaying contract details in a grid layout
        *   `ContractAttachments.tsx` for managing contract attachments
        *   `ContractAuditTrail.tsx` for tracking contract changes
        *   `ContractComments.tsx` for managing contract comments
        *   `ContractExecutedDocument.tsx` for displaying executed contract documents

8.  **Team Management Page:**

    *   Create `src/pages/Team.tsx` for managing team members and their roles.

9.  **File Upload Component:**

    *   Create `src/components/COIFileUpload.tsx` for handling file uploads, particularly for certificates of insurance.

10. **Frontend Routing:**

    *   Configure React Router in `src/App.tsx` to handle navigation between pages.

## Phase 3: Backend Development

1.  **Set Up Supabase Project:**

    *   Create a Supabase project and configure the database, authentication, and storage.
    *   Set up the Supabase client in `src/integrations/supabase/client.ts`.

2.  **Database Schema Design (Tables):**

    *   Design tables for Users, Roles, Contracts, Templates, Notifications, Reminders, and Subscriptions.
    *   Generate TypeScript types from the Supabase schema in `src/integrations/supabase/types.ts`.

3.  **Implement Role Management:**

    *   Add role-based access logic using Supabase's Row Level Security (RLS).
    *   Define policies to enforce roles (Administrator, Manager, Reviewer, Contributor, Viewer).

4.  **Contract Management API:**

    *   Implement contract CRUD operations using Supabase client in the contract-related components.

5.  **Template API:**

    *   Create functionality to fetch, customize, and save contract templates.

6.  **E-Signature Integration:**

    *   Develop integration modules for DocuSign, Adobe Sign, RightSignature, and PandaDoc APIs.

7.  **Notifications System:**

    *   Create functionality to trigger notifications via email, SMS, and in-app alerts when key contract dates occur.

8.  **Reporting Functionality:**

    *   Develop functionality to generate and export contract reports in CSV and PDF formats.

9.  **Subscription & Billing Integration:**

    *   Integrate Stripe for subscription management.

10. **Backend Testing:**

    *   Test each API endpoint and database operation to ensure correct behavior.

## Phase 3.5: OAuth Authentication Integration (Microsoft and Google)

1.  **Microsoft Entra ID (Azure AD) Application Setup:**

    *   Register a new application in the Microsoft Entra admin center (https://entra.microsoft.com).
    *   Configure the application with appropriate redirect URIs:
        *   Production: `https://[your-supabase-project].supabase.co/auth/v1/callback`
        *   Development: `http://localhost:8080/auth/callback`
    *   Enable ID tokens and access tokens in the Authentication settings.
    *   Add required Microsoft Graph API permissions:
        *   User.Read (delegated)
        *   email, profile, openid, offline_access
    *   Generate a client secret and securely store it.

2.  **Google Cloud Platform Project Setup:**

    *   Create a new project in the Google Cloud Console (https://console.cloud.google.com).
    *   Configure the OAuth consent screen with appropriate app information and scopes.
    *   Create OAuth 2.0 Client ID credentials with the following redirect URIs:
        *   Production: `https://[your-supabase-project].supabase.co/auth/v1/callback`
        *   Development: `http://localhost:8080/auth/callback`
    *   Enable necessary Google APIs (Google+ API, Google People API).
    *   Generate client ID and client secret and securely store them.

3.  **Supabase OAuth Configuration:**

    *   In the Supabase dashboard, navigate to Authentication → Providers.
    *   For Microsoft:
        *   Enable the Microsoft provider and configure it with:
            *   Client ID from the Microsoft Entra ID application
            *   Client Secret from the Microsoft Entra ID application
            *   Redirect URL matching what was configured in Microsoft Entra ID
        *   Configure additional scopes if needed (e.g., `offline_access` for refresh tokens).
    *   For Google:
        *   Enable the Google provider and configure it with:
            *   Client ID from the Google Cloud Platform project
            *   Client Secret from the Google Cloud Platform project
            *   Redirect URL matching what was configured in Google Cloud Platform
        *   Configure additional scopes if needed (e.g., `https://www.googleapis.com/auth/userinfo.profile` for profile information).

4.  **Auth Component Enhancement:**

    *   Update `src/pages/Auth.tsx` to include both Microsoft and Google sign-in options:
        *   Add Microsoft sign-in button with appropriate styling and icon.
        *   Add Google sign-in button with appropriate styling and icon.
        *   Implement the `signInWithMicrosoft` and `signInWithGoogle` functions using Supabase's OAuth API.
        *   Handle OAuth redirects and authentication state for both providers.

5.  **Auth Callback Handler:**

    *   Create `src/pages/AuthCallback.tsx` to handle OAuth redirects:
        *   Implement logic to process the authentication response from both providers.
        *   Handle success and error states appropriately.
        *   Redirect users to the appropriate page after authentication.
    *   Update routing in `src/App.tsx` to include the callback route.

6.  **Token Management:**

    *   Create `src/lib/auth/tokenManager.ts` to handle OAuth tokens:
        *   Implement secure storage of access and refresh tokens for both providers.
        *   Add functionality to refresh expired tokens.
        *   Create utility functions to retrieve valid tokens for API calls.

7.  **Microsoft Graph Integration:**

    *   Create `src/lib/microsoft/graphClient.ts` to interact with Microsoft Graph API:
        *   Implement functions to fetch user profile information.
        *   Add methods to access organizational data if needed.
        *   Handle authentication errors and token refreshing.

8.  **Google API Integration:**

    *   Create `src/lib/google/apiClient.ts` to interact with Google APIs:
        *   Implement functions to fetch user profile information.
        *   Add methods to access Google services if needed (Calendar, Drive, etc.).
        *   Handle authentication errors and token refreshing.

9.  **User Profile Synchronization:**

    *   Enhance user profile management to sync with account data from both providers:
        *   Update user profiles with information from Microsoft Graph or Google People API.
        *   Implement logic to handle profile picture synchronization.
        *   Add department and organization information if available.
        *   Create a unified profile data structure regardless of authentication provider.

10. **Role Mapping:**

    *   Create `src/lib/auth/roleMappings.ts` to map provider groups to application roles:
        *   Implement logic to extract group membership from tokens or provider APIs.
        *   Map Microsoft security groups or Google groups to ContractFlow roles.
        *   Update user permissions based on group membership.
        *   Ensure consistent role assignment regardless of authentication provider.

11. **Single Sign-On Experience:**

    *   Enhance the authentication flow for seamless SSO experience:
        *   Implement silent authentication for returning users.
        *   Add "Keep me signed in" option.
        *   Create session persistence that respects token expiration policies.
        *   Implement provider selection memory for returning users.

12. **Security Enhancements:**

    *   Implement additional security measures for enterprise authentication:
        *   Add token validation to verify authenticity.
        *   Implement proper PKCE flow for public clients.
        *   Add protection against CSRF attacks in the OAuth flow.
        *   Set up proper CORS configuration for authentication endpoints.
        *   Ensure secure handling of tokens from multiple providers.

13. **Testing and Validation:**

    *   Create comprehensive tests for the OAuth implementation:
        *   Test the sign-in flow with both Microsoft and Google accounts.
        *   Verify token refresh functionality for both providers.
        *   Test role mapping and permissions.
        *   Validate the security of the implementation.
        *   Ensure smooth user experience when switching between providers.

## Phase 4: Integration

1.  **Connect Supabase Auth with Frontend:**

    *   In the Auth page, call Supabase auth functions to handle user sign-up and sign-in.

2.  **Integrate Role-based Dashboard Rendering:**

    *   Implement logic to detect a user's role from Supabase and render the corresponding dashboard component.

3.  **Wire Up Contract Management:**

    *   Connect frontend contract CRUD operations to the Supabase client.

4.  **Integrate E-Signature Workflows:**

    *   From the contract form component, add functionality to trigger the e-signature process.

5.  **Configure Notification Triggers:**

    *   Ensure that when contracts are created or updated (with close dates), notifications are triggered.

6.  **Integrate Stripe Billing:**

    *   On the subscription page, integrate Stripe billing for subscription management.

7.  **Integration Testing:**

    *   End-to-end test registration, role-based login, contract creation, template customization, e-signature initiation, notification sending, and subscription processing.

## Phase 5: Deployment

1.  **Frontend Deployment Setup:**

    *   Configure deployment settings for the Vite React application on your preferred platform (e.g., Vercel, Netlify).
    *   Ensure that environment variables (Supabase URL/keys, Stripe keys) are properly set.

2.  **Supabase Production Setup:**

    *   Migrate the database schema to the Supabase production instance.

3.  **Configure CI/CD Pipeline:**

    *   Set up CI/CD to build and deploy the frontend and backend integrations.

4.  **Set Up Cloud Environment Variables:**

    *   Ensure environment variables for Supabase, Stripe, and optional Clerkdev are set in the deployment environment.

5.  **Deployment Validation:**

    *   Once deployed, perform live tests including user registration, role-based dashboard loading, contract CRUD operations, e-signature processes, notifications, and billing.

**Note:** Throughout the implementation ensure to adhere strictly to design and technical specifications outlined in the PRD. Validate every step using appropriate testing tools (unit tests, integration tests, and end-to-end tests) to confirm correct behavior and compliance with requirements.

This plan provides an unambiguous, step-by-step guide for building ContractFlow.
