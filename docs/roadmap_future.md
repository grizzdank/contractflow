## Feature Roadmap 

### Completed
- [x] Authentication foundation
  - [x] Protected routes implementation
  - [x] Role-based access control foundation
  - [x] Session management
  - [x] Supabase database integration
  - [x] Basic role definitions (Admin, Manager, Viewer)
  - [x] Route protection based on roles
- [x] Hybrid Authentication System
  - [x] Clerk.dev integration for SSO
    - [x] OAuth providers (Google, Microsoft, etc.)
    - [x] Multi-factor authentication
    - [x] User registration and login flows
  - [x] Supabase Integration
    - [x] JWT validation middleware
    - [x] Database access with Clerk tokens
    - [x] Webhook signature verification
  - [ ] Fine-grained permission system
  - [ ] Role assignment UI

### In Progress
- [ ] Organization Management
  - [ ] Team member roles and permissions
  - [ ] Department structure
  - [ ] Access control implementation

- [x] Centralized contract database
  - [x] Database schema design
  - [x] Contract data model
  - [x] Basic contract listing page
  - [x] Contract details page
  - [x] Contract request form
  - [ ] Advanced search and filtering capabilities
  - [ ] Batch operations

### Current In-Scope (Prioritized)
- [ ] Contract lifecycle management workflow
  - [x] Status tracking (Draft, Review, InSignature, ExecutedActive, ExecutedExpired)
  - [ ] Approval workflows
  - [ ] Renewal tracking
  - [ ] Milestone and deadline management

- [x] Document management
  - [x] Basic file upload for contracts
  - [x] Certificate of Insurance (COI) file management
  - [x] Document storage with Supabase
  - [ ] Document versioning
  - [ ] Document preview

- [ ] Notifications
  - [ ] Email notifications for key events
  - [ ] In-app notification center
  - [ ] Customizable notification preferences
  - [ ] Scheduled reminders for deadlines

- [ ] E-signatures
  - [ ] Integration with e-signature providers (DocuSign, Adobe Sign, etc.)
  - [ ] Signature request workflow
  - [ ] Signature verification and tracking
  - [ ] Optional: Native e-signature capability
  - [ ] **SignWell API Integration**
    - [ ] **Document Preparation & Upload**
      - [ ] User creates or uploads a document in the app (UI: contract creation or upload form)
      - [ ] Document is converted to PDF (if not already PDF) using a server-side or client-side library
      - [ ] PDF is stored in Supabase storage and/or prepared for SignWell upload
    - [ ] **SignWell API Workflow**
      - [ ] App calls SignWell API to upload the PDF document
      - [ ] UI for user to define signature fields, initials, dates, and other required fields (drag-and-drop or form-based)
      - [ ] App sends field definitions to SignWell via API
      - [ ] User sets recipients (signers, CCs) and their roles/emails in the UI
      - [ ] App sends recipient info to SignWell and initiates the signature request (envelope creation)
      - [ ] App tracks the SignWell envelope/document ID in the contract record in Supabase
    - [ ] **Signature Process & Tracking**
      - [ ] App displays real-time status of signature process (pending, viewed, signed, completed, declined)
      - [ ] SignWell webhooks are configured to notify the app of signature events (viewed, signed, completed, declined, etc.)
      - [ ] Webhook handler updates contract status and audit trail in Supabase
      - [ ] UI notifies users of signature progress and completion (in-app and/or email notifications)
    - [ ] **Post-Signature Handling**
      - [ ] Download and store the signed PDF in Supabase storage
      - [ ] Attach signed document to contract record and make available for download/viewing
      - [ ] Update audit trail with signature events and timestamps
    - [ ] **Error Handling & Security**
      - [ ] Handle API errors and display user-friendly messages
      - [ ] Securely store and manage SignWell API credentials (never expose to frontend)
      - [ ] Validate all webhook requests from SignWell (signature verification)
      - [ ] Ensure only authorized users can initiate and view signature requests
      - [ ] Log all signature-related actions for compliance and auditing

### Technical Roadmap
- [x] Database schema design and implementation
- [x] Authentication system
  - [x] Clerk.dev integration
  - [x] Supabase database access
  - [x] Webhook handling
- [x] Basic file storage system
- [ ] Advanced file management
- [ ] API documentation
- [ ] Performance optimization
- [ ] Comprehensive test coverage
- [ ] CI/CD pipeline
- [ ] Disaster recovery plan

### Future Features (Prioritized)
- [ ] Reporting tools
  - [ ] Contract status dashboards
  - [ ] Financial reporting
  - [ ] Compliance tracking
  - [ ] Custom report builder

- [ ] Subscription and billing
  - [ ] Tiered subscription plans
  - [ ] Payment processing (Stripe integration)
  - [ ] Usage tracking
  - [ ] Billing management

- [ ] Templates
  - [ ] Pre-defined contract templates
  - [ ] Custom template creation
  - [ ] Template versioning
  - [ ] Clause library

- [ ] AI-powered features
  - [ ] SOW generation
  - [ ] Contract analysis and risk assessment
  - [ ] Automated metadata extraction
  - [ ] Intelligent contract recommendations

- [ ] Advanced user experience
  - [ ] Chat interface for user Q&A
  - [ ] Mobile application
  - [ ] Offline capabilities
  - [ ] Batch operations

- [ ] Integrations
  - [ ] Quickbooks API integration
  - [ ] CRM systems (Salesforce, HubSpot)
  - [ ] Document management systems
  - [ ] Calendar integrations

- [ ] Enhanced visualization
  - [ ] Calendar view of contracts
  - [ ] Relationship mapping between contracts
  - [ ] Financial forecasting charts
  - [ ] Compliance heat maps