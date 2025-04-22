Below is the step-by-step implementation plan for ContractFlo structured into six phases, with an emphasis on architecture, clean code, security, and scalability.

## Phase 0: Architecture and Design Principles

1.  **Layered Architecture Design:**

    *   Define a clear layered architecture with separation of concerns:
        *   **Presentation Layer**: UI components, pages, and layouts
        *   **Application Layer**: Business logic, workflows, and service interfaces
        *   **Domain Layer**: Core business entities, rules, and value objects
        *   **Infrastructure Layer**: External services, data access, and technical implementations
    *   Document the architecture with diagrams and explanations in `documents/architecture.md`

2.  **Code Organization and Standards:**

    *   Establish coding standards and documentation requirements:
        *   Set up ESLint and Prettier with strict rules
        *   Define JSDoc comment standards for all public functions and components
        *   Create README files for major directories explaining purpose and patterns
    *   Set up directory structure to reflect the layered architecture:
        *   `/src/pages`: Page components (presentation layer)
        *   `/src/components`: Reusable UI components (presentation layer)
        *   `/src/features`: Feature-specific components and logic (presentation/application layer)
        *   `/src/services`: Business logic and service interfaces (application layer)
        *   `/src/domain`: Business entities and rules (domain layer)
        *   `/src/lib`: Infrastructure implementations (infrastructure layer)
        *   `/src/utils`: Utility functions and helpers

3.  **Security Framework:**

    *   Design a comprehensive security approach:
        *   Authentication and authorization strategy
        *   Data encryption approach for sensitive contract information
        *   API security patterns including rate limiting and input validation
        *   Audit logging strategy for security-relevant events
    *   Document security patterns in `documents/security.md`

4.  **Scalability Considerations:**

    *   Plan for application growth:
        *   Design database schema with performance in mind
        *   Implement caching strategies at appropriate levels
        *   Create service abstractions that could be split into microservices later
        *   Plan for monitoring and observability
    *   Document scalability approach in `documents/scalability.md`

5.  **Component Library and Design System:**

    *   Create a design system with consistent patterns:
        *   Define color palette, typography, spacing, and other design tokens
        *   Build a component library with reusable UI components
        *   Document components with usage examples
    *   Set up Storybook for component documentation and visual testing

## Phase 1: Environment Setup

1.  **Install Tools:**

    *   Verify that Node.js v20+ is installed on your development machine. If not, install the latest stable version of Node.js.
    *   Install Bun as the package manager and runtime for improved performance.

2.  **Initialize React Project with Vite:**

    *   Create a new React project with TypeScript and Vite by running:

    ```
    bun create vite contractflo -- --template react-ts
    ```

    *   This provides a modern, fast development environment with hot module replacement.

3.  **Configure Tailwind CSS:**

    *   Install and configure Tailwind CSS with PostCSS:
    
    ```
    bun add -D tailwindcss postcss autoprefixer
    bunx tailwindcss init -p
    ```
    
    *   Update the Tailwind configuration in `tailwind.config.ts` and include Tailwind directives in `src/index.css`.
    *   Create a theme configuration that aligns with the design system.

4.  **Set Up UI Component Libraries:**

    *   Install shadcn/UI, Radix UI, and Lucide Icons:
    
    ```
    bun add @radix-ui/react-* lucide-react
    ```
    
    *   Configure shadcn UI components using the components.json file.
    *   Set up Storybook for component documentation:
    
    ```
    bunx storybook init
    ```

5.  **Set Up Development Tools:**

    *   Configure ESLint and Prettier for code quality:
    
    ```
    bun add -D eslint prettier eslint-config-prettier eslint-plugin-react eslint-plugin-react-hooks @typescript-eslint/eslint-plugin @typescript-eslint/parser
    ```
    
    *   Set up Jest and React Testing Library for unit testing:
    
    ```
    bun add -D jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
    ```
    
    *   Configure Husky and lint-staged for pre-commit hooks:
    
    ```
    bun add -D husky lint-staged
    ```

6.  **Initialize Git Repository:**

    *   Create a Git repository with `main` and `dev` branches and apply branch protection rules.
    *   Set up GitHub Actions for CI/CD pipeline.
    *   Add MIT license file.

7.  **Validation:**

    *   Run `node -v` and `bun run dev` to verify that the development server starts correctly.
    *   Ensure all linting and testing tools are functioning properly.

## Phase 2: Core Infrastructure

1.  **Project Structure Setup:**

    *   Create the directory structure according to the layered architecture defined in Phase 0.
    *   Add README files to each directory explaining its purpose and patterns.

2.  **Type Definitions:**

    *   Create comprehensive TypeScript interfaces for all domain entities:
        *   `src/domain/types/Contract.ts`
        *   `src/domain/types/User.ts`
        *   `src/domain/types/Team.ts`
        *   `src/domain/types/Notification.ts`
        *   `src/domain/types/Template.ts`
    *   Define type-safe API response and request types.

3.  **Service Layer Foundation:**

    *   Define service interfaces for core functionality using TypeScript interfaces in `src/services/interfaces/`:
        *   `IAuthService.ts`
        *   `IContractService.ts`
        *   `IFileService.ts`
        *   `ITeamService.ts`
        *   `IAuditTrailService.ts`
        *   `IUserProfileService.ts` (Potentially merge with ITeamService or IUserService if overlap)
        *   `INotificationService.ts`
    *   Implement concrete service classes in `src/services/` that implement these interfaces (e.g., `ContractService.ts`, `FileService.ts`).
    *   Services encapsulate business logic and orchestrate calls to repositories.

4.  **Data Access Layer (Repositories):**

    *   Set up Supabase client in `src/lib/supabase/client.ts`.
    *   Create data access repositories in `src/lib/repositories/` to abstract database interactions:
        *   `ContractRepository.ts` (Handles `contracts` table)
        *   `FileRepository.ts` (Handles `contract_coi_files` table and file storage interactions)
        *   `AuditTrailRepository.ts` (Handles `contract_audit_trail` table)
        *   `UserProfileRepository.ts` (Handles `profiles` table)
        *   `OrganizationMemberRepository.ts` (Handles `organization_members` table)
        *   *(Add other repositories as needed, e.g., for Templates, Notifications)*
    *   Repositories are responsible *only* for data fetching/mutation, not business logic or data mapping to application types.
    *   Implement caching strategies where appropriate (potentially at the service layer or using Supabase features).

5.  **Authentication Framework:**

    *   Utilize Clerk for primary authentication (UI flows, session management).
    *   Use `ClerkAuthProvider` (`src/contexts/ClerkAuthContext.tsx`) to manage auth state and provide user/session info.
    *   Generate Supabase JWT tokens via Clerk (`getToken({ template: 'supabase' })`) for authenticating Supabase API calls.
    *   Implement Supabase Row Level Security (RLS) policies based on user roles/organization memberships stored in Supabase tables (`profiles`, `organization_members`).
    *   Refactor service authentication: Remove dependency on React hooks (`useAuth`) within service implementations. Pass necessary auth context (like user ID or token) explicitly to service methods requiring authorization.

6.  **Error Handling and Logging:**

    *   Create a centralized error handling system:
        *   Define custom error types in `src/domain/errors/`
        *   Implement error boundary components
        *   Set up logging service for client-side errors
    *   Add monitoring integration for production environments.

7.  **Feature Flags:**

    *   Implement a feature flag system to control feature rollout:
        *   Create `src/lib/featureFlags.ts` for feature flag definitions
        *   Add `useFeatureFlag` hook for component-level feature flag checks
        *   Set up remote configuration for dynamic feature flags

## Phase 3: Frontend Development

1.  **Component Library Development:**

    *   Create base UI components following the design system:
        *   Buttons, inputs, form elements, cards, modals, etc.
        *   Document each component in Storybook with usage examples
        *   Implement comprehensive accessibility features
    *   Create layout components for consistent page structure.

2.  **Landing and Registration Page:**

    *   Create `src/pages/Index.tsx` with a clean, minimalistic landing page per design guidelines.
    *   Implement SEO optimization with meta tags and structured data.

3.  **User Registration & Authentication Pages:**

    *   Create `src/pages/Auth.tsx` that integrates with the AuthService.
    *   Implement form validation with proper error handling.
    *   Add security features like CAPTCHA for registration.

4.  **Protected Layout Component:**

    *   Create a reusable layout component at `src/components/ProtectedLayout.tsx` to support role-based rendering.
    *   Implement route guards for authenticated routes.

5.  **Navigation Component:**

    *   Create `src/components/Navigation.tsx` for consistent navigation across the application.
    *   Implement responsive design for mobile and desktop.

6.  **Contract Management Pages:**

    *   Create `src/pages/Contracts.tsx` for the centralized searchable contract repository.
    *   Create `src/pages/ContractDetails.tsx` for viewing contract details.
    *   Create `src/pages/ContractRequest.tsx` for creating new contract requests.
    *   Create `src/pages/ContractApproval.tsx` for the contract approval workflow.
    *   Implement proper state management and data fetching patterns.

7.  **Contract Components:**

    *   Create reusable components in `src/components/contract/` for contract-related functionality:
        *   `ContractHeader.tsx` for displaying contract header information
        *   `ContractDetailsGrid.tsx` for displaying contract details in a grid layout
        *   `ContractAttachments.tsx` for managing contract attachments
        *   `ContractAuditTrail.tsx` for tracking contract changes
        *   `ContractComments.tsx` for managing contract comments
        *   `ContractExecutedDocument.tsx` for displaying executed contract documents
    *   Ensure components follow the design system and accessibility guidelines.

8.  **Team Management Page:**

    *   Create `src/pages/Team.tsx` for managing team members and their roles.
    *   Implement proper permission checks for administrative functions.

9.  **File Upload Component:**

    *   Create `src/components/COIFileUpload.tsx` for handling file uploads, particularly for certificates of insurance.
    *   Implement secure file handling with validation and virus scanning.

10. **Frontend Routing:**

    *   Configure React Router in `src/App.tsx` to handle navigation between pages.
    *   Implement route-based code splitting for performance optimization.

11. **Analytics Integration:**

    *   Add analytics tracking for user interactions and feature usage.
    *   Implement privacy-respecting analytics with proper user consent.

## Phase 4: Backend Development

1.  **Database Schema Design:**

    *   Design tables for Users, Roles, Contracts, Templates, Notifications, Reminders, and Subscriptions.
    *   Implement proper indexing and optimization for query performance.
    *   Generate TypeScript types from the Supabase schema in `src/lib/supabase/types.ts`.

2.  **Implement Role Management:**

    *   Add role-based access logic using Supabase's Row Level Security (RLS).
    *   Define policies to enforce roles (Administrator, Manager, Reviewer, Contributor, Viewer).
    *   Create comprehensive tests for permission checks.

3.  **Contract Management Logic:**

    *   Implement contract business logic (CRUD, validation) within `ContractService.ts`, utilizing `ContractRepository.ts`.
    *   Implement audit logging for contract changes via `AuditTrailService.ts`.

4.  **File Management Logic:**

    *   Implement file upload/download/delete logic within `FileService.ts`, utilizing `FileRepository.ts`.
    *   Include audit logging for executed document uploads via `AuditTrailService.ts`.

5.  **Template API:**

    *   Create functionality to fetch, customize, and save contract templates.
    *   Implement version control for templates.

6.  **E-Signature Integration:**

    *   Develop integration modules for DocuSign, Adobe Sign, RightSignature, and PandaDoc APIs.
    *   Create a common interface for all e-signature providers.
    *   Implement secure handling of signature requests and callbacks.

7.  **Notifications System:**

    *   Create functionality to trigger notifications via email, SMS, and in-app alerts when key contract dates occur.
    *   Implement notification preferences and opt-out mechanisms.

8.  **Reporting Functionality:**

    *   Develop functionality to generate and export contract reports in CSV and PDF formats.
    *   Implement data visualization components for dashboards.

9.  **Subscription & Billing Integration:**

    *   Integrate Stripe for subscription management.
    *   Implement secure handling of payment information.
    *   Add subscription management UI.

10. **Backend Testing:**

    *   Write unit tests for repositories and services.
    *   Implement integration tests for critical workflows involving services and repositories.

## Phase 5: External Integrations

1.  **OAuth Authentication (Microsoft and Google):**

    *   **Microsoft Entra ID (Azure AD) Application Setup:**

        *   Register a new application in the Microsoft Entra admin center (https://entra.microsoft.com).
        *   Configure the application with appropriate redirect URIs:
            *   Production: `https://[your-supabase-project].supabase.co/auth/v1/callback`
            *   Development: `http://localhost:8080/auth/callback`
        *   Enable ID tokens and access tokens in the Authentication settings.
        *   Add required Microsoft Graph API permissions:
            *   User.Read (delegated)
            *   email, profile, openid, offline_access
        *   Generate a client secret and securely store it.

    *   **Google Cloud Platform Project Setup:**

        *   Create a new project in the Google Cloud Console (https://console.cloud.google.com).
        *   Configure the OAuth consent screen with appropriate app information and scopes.
        *   Create OAuth 2.0 Client ID credentials with the following redirect URIs:
            *   Production: `https://[your-supabase-project].supabase.co/auth/v1/callback`
            *   Development: `http://localhost:8080/auth/callback`
        *   Enable necessary Google APIs (Google+ API, Google People API).
        *   Generate client ID and client secret and securely store them.

    *   **Supabase OAuth Configuration:**

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

    *   **Auth Component Enhancement:**

        *   Update `src/pages/Auth.tsx` to include both Microsoft and Google sign-in options:
            *   Add Microsoft sign-in button with appropriate styling and icon.
            *   Add Google sign-in button with appropriate styling and icon.
            *   Implement the `signInWithMicrosoft` and `signInWithGoogle` functions using Supabase's OAuth API.
            *   Handle OAuth redirects and authentication state for both providers.

    *   **Auth Callback Handler:**

        *   Create `src/pages/AuthCallback.tsx` to handle OAuth redirects:
            *   Implement logic to process the authentication response from both providers.
            *   Handle success and error states appropriately.
            *   Redirect users to the appropriate page after authentication.
        *   Update routing in `src/App.tsx` to include the callback route.

    *   **Token Management:**

        *   Create `src/lib/auth/tokenManager.ts` to handle OAuth tokens:
            *   Implement secure storage of access and refresh tokens for both providers.
            *   Add functionality to refresh expired tokens.
            *   Create utility functions to retrieve valid tokens for API calls.

    *   **Microsoft Graph Integration:**

        *   Create `src/lib/microsoft/graphClient.ts` to interact with Microsoft Graph API:
            *   Implement functions to fetch user profile information.
            *   Add methods to access organizational data if needed.
            *   Handle authentication errors and token refreshing.

    *   **Google API Integration:**

        *   Create `src/lib/google/apiClient.ts` to interact with Google APIs:
            *   Implement functions to fetch user profile information.
            *   Add methods to access Google services if needed (Calendar, Drive, etc.).
            *   Handle authentication errors and token refreshing.

    *   **User Profile Synchronization:**

        *   Enhance user profile management to sync with account data from both providers:
            *   Update user profiles with information from Microsoft Graph or Google People API.
            *   Implement logic to handle profile picture synchronization.
            *   Add department and organization information if available.
            *   Create a unified profile data structure regardless of authentication provider.

    *   **Role Mapping:**

        *   Create `src/lib/auth/roleMappings.ts` to map provider groups to application roles:
            *   Implement logic to extract group membership from tokens or provider APIs.
            *   Map Microsoft security groups or Google groups to ContractFlo roles.
            *   Update user permissions based on group membership.
            *   Ensure consistent role assignment regardless of authentication provider.

    *   **Single Sign-On Experience:**

        *   Enhance the authentication flow for seamless SSO experience:
            *   Implement silent authentication for returning users.
            *   Add "Keep me signed in" option.
            *   Create session persistence that respects token expiration policies.
            *   Implement provider selection memory for returning users.

    *   **Security Enhancements:**

        *   Implement additional security measures for enterprise authentication:
            *   Add token validation to verify authenticity.
            *   Implement proper PKCE flow for public clients.
            *   Add protection against CSRF attacks in the OAuth flow.
            *   Set up proper CORS configuration for authentication endpoints.
            *   Ensure secure handling of tokens from multiple providers.

    *   **Testing and Validation:**

        *   Create comprehensive tests for the OAuth implementation:
            *   Test the sign-in flow with both Microsoft and Google accounts.
            *   Verify token refresh functionality for both providers.
            *   Test role mapping and permissions.
            *   Validate the security of the implementation.
            *   Ensure smooth user experience when switching between providers.

2.  **QuickBooks Integration:**

    *   **QuickBooks API Setup:**
        *   Register application with Intuit Developer portal
        *   Configure OAuth 2.0 for QuickBooks API access
        *   Obtain and securely store API credentials

    *   **Financial Data Service:**
        *   Create `src/services/interfaces/IFinancialService.ts` interface
        *   Implement `src/services/QuickBooksService.ts` for QuickBooks integration
        *   Build data mapping between contracts and QuickBooks entities

    *   **Budget Alignment Features:**
        *   Create `src/components/finance/BudgetAllocation.tsx` for assigning contracts to departments/budgets
        *   Implement budget validation against QuickBooks data
        *   Add budget utilization visualizations and alerts

    *   **Invoice Integration:**
        *   Develop functionality to generate invoices in QuickBooks from contract data
        *   Create `src/components/finance/InvoiceGeneration.tsx` for invoice creation UI
        *   Implement invoice status tracking and synchronization

    *   **Financial Reporting:**
        *   Build contract financial dashboards with budget vs. actual comparisons
        *   Create export functionality for financial reports
        *   Implement department-specific financial views

3.  **E-Signature Provider Integration:**

    *   Develop integration modules for DocuSign, Adobe Sign, RightSignature, and PandaDoc APIs.
    *   Create a common interface for all e-signature providers.
    *   Implement secure handling of signature requests and callbacks.

## Phase 6: Integration and Deployment

1.  **Connect Frontend to Services:**

    *   Refactor components and pages (e.g., `Contracts.tsx`, `ContractDetails.tsx`, `Auth.tsx`) to use the newly implemented services (`ContractService`, `FileService`, etc.) instead of the deprecated `dataService.ts` or direct Supabase calls.
    *   Adapt data fetching hooks or state management logic to work with the service layer.
    *   Handle passing authentication context (tokens) to service methods from the UI layer where needed.

2.  **Integrate Role-based Dashboard Rendering:**

    *   Implement logic to detect a user's role from Supabase and render the corresponding dashboard component.
    *   Add permission checks for all protected operations.

3.  **Wire Up Contract Management:**

    *   Connect frontend contract CRUD operations to the Supabase client.
    *   Implement optimistic UI updates for better user experience.

4.  **Integrate E-Signature Workflows:**

    *   From the contract form component, add functionality to trigger the e-signature process.
    *   Implement webhook handlers for signature status updates.

5.  **Configure Notification Triggers:**

    *   Ensure that when contracts are created or updated (with close dates), notifications are triggered.
    *   Implement notification preferences and delivery channels.

6.  **Integrate Stripe Billing:**

    *   On the subscription page, integrate Stripe billing for subscription management.
    *   Implement secure handling of payment information.

7.  **Performance Optimization:**

    *   Implement code splitting for improved load times.
    *   Add caching strategies for API responses.
    *   Optimize bundle size with tree shaking and dependency analysis.
    *   Implement lazy loading for non-critical components.

8.  **Accessibility Audit:**

    *   Perform a comprehensive accessibility audit.
    *   Fix any accessibility issues to ensure WCAG 2.1 AA compliance.
    *   Test with screen readers and keyboard navigation.

9.  **Security Audit:**

    *   Conduct a security audit of the application.
    *   Implement any necessary security enhancements.
    *   Run dependency vulnerability scans.

10. **Integration Testing:**

    *   End-to-end test registration, role-based login, contract creation, template customization, e-signature initiation, notification sending, and subscription processing.
    *   Automate critical user flows with Cypress or Playwright.

11. **Frontend Deployment Setup:**

    *   Configure deployment settings for the Vite React application on your preferred platform (e.g., Vercel, Netlify).
    *   Ensure that environment variables (Supabase URL/keys, Stripe keys) are properly set.
    *   Set up proper CI/CD pipeline with staging and production environments.

12. **Supabase Production Setup:**

    *   Migrate the database schema to the Supabase production instance.
    *   Set up database backups and disaster recovery procedures.

13. **Configure CI/CD Pipeline:**

    *   Set up CI/CD to build and deploy the frontend and backend integrations.
    *   Implement automated testing in the CI pipeline.
    *   Add deployment approval gates for production releases.

14. **Set Up Cloud Environment Variables:**

    *   Ensure environment variables for Supabase, Stripe, and optional Clerkdev are set in the deployment environment.
    *   Implement secure handling of secrets in the CI/CD pipeline.

15. **Monitoring and Observability:**

    *   Set up application monitoring with error tracking.
    *   Implement performance monitoring for critical user flows.
    *   Add logging for security-relevant events.

16. **Deployment Validation:**

    *   Once deployed, perform live tests including user registration, role-based dashboard loading, contract CRUD operations, e-signature processes, notifications, and billing.
    *   Validate performance in production environment.

**Note:** Throughout the implementation ensure to adhere strictly to design and technical specifications outlined in the PRD. Validate every step using appropriate testing tools (unit tests, integration tests, and end-to-end tests) to confirm correct behavior and compliance with requirements.

This plan provides an unambiguous, step-by-step guide for building ContractFlo with a focus on architecture, clean code, security, and scalability.

demo steps: 
SSO Status: The Auth.tsx page uses the standard Clerk <SignIn> and <SignUp> components. The clerkConfig in src/lib/clerk/client.ts sets up the publishable key but doesn't explicitly enable or configure additional providers like Microsoft. Action Needed: Microsoft SSO needs to be configured in your Clerk dashboard and potentially reflected in the frontend code (e.g., by adding provider buttons to the Auth.tsx page or customizing the Clerk components if necessary, as outlined in Phase 5 of the plan).
2. Supabase Database Functionality:
Service Layer: ContractService.ts now exists and handles database interactions via ContractRepository.ts. This aligns with the planned architecture. The mapping functions (mapDbToContract, mapContractToDb) are present.
Data Fetching: Contracts.tsx uses contractService.getContracts() to fetch data. ContractDetails.tsx uses contractService.getContractById(). This seems correct.
RLS: The previous errors in Contracts.tsx (like code 42501) strongly indicated RLS issues. While the code now uses getSupabaseWithAuth which should help, RLS policies themselves need to be correctly configured in Supabase. Action Needed: Double-check and test your Supabase RLS policies thoroughly. Ensure they allow authenticated users (based on the JWT from Clerk) with appropriate roles to perform SELECT, INSERT, UPDATE operations on the contracts, profiles, organization_members, and other relevant tables. The "Create Test Contract" button in Contracts.tsx tries an insert and could be a good test case.
Data Mapping: The mapDbToContract function in ContractService.ts has logic to handle potentially invalid status and type values from the DB, defaulting them. This is good defensive coding. Ensure the Contract type definition in src/domain/types/Contract.ts accurately reflects all necessary fields retrieved from the database.
3. UI/UX Polish & Demo Flow:
Core Pages:
Index.tsx: Looks like a reasonable landing/dashboard page.
Auth.tsx: Standard Clerk login/signup flow (needs SSO button).
Contracts.tsx: Provides a list/table view with search and filtering. Includes a "Create Test Contract" button (useful for demoing RLS/inserts if working).
ContractDetails.tsx: Shows details, allows editing (controlled by isEditing state), includes components for attachments, comments, audit trail. Seems relatively complete for viewing/basic editing.
Navigation: Navigation.tsx includes links to Home, Contracts, Request, Team, and Sign In/Out. The new logo is integrated. Looks functional.
Potential Issues:
The dataService.ts file still exists and is marked as deprecated. While we removed the mock data flag, pages like Contracts.tsx and ContractDetails.tsx still import contractService from it. This needs refactoring to import from the actual ContractService.ts implementation.
Error handling seems present (e.g., in Contracts.tsx fetch), but ensure it's robust enough for a demo.
Placeholders/TODOs: Check components like ContractAttachments.tsx, ContractComments.tsx, ContractAuditTrail.tsx (used in ContractDetails.tsx) for completeness if they are part of the demo flow. The audit trail service seemed basic, and comment adding in ContractDetails.tsx uses hardcoded user info (currentUser, Current User).
Summary & Demo Readiness Checklist:
[URGENT] Microsoft SSO: Needs configuration in Clerk dashboard and likely frontend adjustments. (Blocker)
[URGENT] Supabase RLS: Must be configured correctly and tested to ensure users can view/create/edit data as expected. The previous errors suggest this is a critical point. (Blocker)
[HIGH] Refactor Service Imports: Update pages (Contracts.tsx, ContractDetails.tsx, etc.) to import from the actual ContractService.ts (in src/services/) instead of the deprecated src/lib/dataService.ts. Delete dataService.ts afterwards.
[MEDIUM] Audit Trail User: Update the audit trail logic (if used in the demo) to use the actual logged-in user, not hardcoded values. Similarly, fix comment creation user data in ContractDetails.tsx.
[MEDIUM] Data Consistency: Ensure the Contract type matches the database schema and the data mapping functions are accurate.
[LOW] E-Sign: Confirm this is out of scope for the demo.
[LOW] Testing Framework: Can be skipped for the demo.
Recommendation:
Focus immediately on configuring Microsoft SSO in Clerk and thoroughly testing/fixing the Supabase RLS policies. These are the biggest potential demo blockers. After that, refactor the service imports and clean up any hardcoded user info in features you plan to show.