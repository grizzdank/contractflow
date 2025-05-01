## ContractFlo Notification Integration - Implementation Plan

This plan details the steps to integrate Microsoft Teams and Outlook notifications for contract status updates, approvals, and reminders.

**Assumptions:**

*   Backend logic resides in Supabase Edge Functions (`supabase/functions/`).
*   Authentication for API endpoints called by external services (Teams/Outlook actions) will use specific validation methods (Actionable Message JWT validation, potentially custom validation for Teams bot actions if not using user redirection).
*   User mapping between ContractFlo and Azure AD (for DMs) needs addressing. We'll assume an `azure_ad_user_principal_name` field can be added to your user profiles/metadata in Supabase.
*   Environment variables for backend services (`TEAMS_*`, `GRAPH_*`) will be configured in Supabase Function settings, NOT in the frontend `.env` or committed to git.

---

### Phase 1: Teams Channel Notifications via Incoming Webhook

*   **Goal:** Broadcast contract status changes to a designated Teams channel.
*   **Prerequisites:**
    1.  **Teams Setup:** Channel owner creates an "Incoming Webhook" connector for the target channel, names it (e.g., "ContractFlo Alerts"), and securely stores the generated Webhook URL.
    2.  **Supabase Env Vars:** Add `TEAMS_WEBHOOK_URL` to the environment variables for the Supabase Edge Function defined below (via Supabase dashboard or CLI).
*   **Backend Implementation (Supabase):**
    1.  **Database Trigger:**
        *   Create a PostgreSQL function (e.g., `handle_contract_status_change`) that triggers on `UPDATE` of the `status` column in your `contracts` table.
        *   This trigger function should invoke a Supabase Edge Function (e.g., `notify-teams-channel`), passing relevant contract data (ID, old status, new status, title, amount, owner details, etc.).
        *   **SQL Example (Conceptual):**
            ```sql
            -- Trigger Function
            CREATE OR REPLACE FUNCTION handle_contract_status_change()
            RETURNS trigger AS $$
            DECLARE
              payload jsonb;
            BEGIN
              payload := jsonb_build_object(
                'contract_id', NEW.id,
                'new_status', NEW.status,
                'old_status', OLD.status,
                'title', NEW.title, 
                -- Add other necessary fields: amount, due_date, owner_id etc.
              );
              -- Invoke Edge Function asynchronously
              PERFORM net.http_post(
                url:='<supabase_function_url>/notify-teams-channel', -- Replace with actual function URL
                headers:='{"Content-Type": "application/json", "Authorization": "Bearer <supabase_service_role_key>"}'::jsonb, -- Secure invocation
                body:=payload
              );
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            -- Trigger
            CREATE TRIGGER contract_status_update_trigger
            AFTER UPDATE OF status ON contracts
            FOR EACH ROW
            WHEN (OLD.status IS DISTINCT FROM NEW.status)
            EXECUTE FUNCTION handle_contract_status_change();
            ```
    2.  **Edge Function (`supabase/functions/notify-teams-channel/index.ts`):**
        *   **Purpose:** Receives contract update data from the DB trigger and formats/sends a MessageCard to the Teams Webhook URL.
        *   **Input:** JSON payload from the trigger (contract details).
        *   **Logic:**
            *   Read `TEAMS_WEBHOOK_URL` from environment variables.
            *   Fetch any additional required data if not passed in the payload (e.g., owner's name from `users` table using `owner_id`).
            *   Construct the Teams MessageCard JSON payload (as per your outline). Use contract data to populate `summary`, `title`, `facts`, and the `OpenUri` target URL (`https://app.contractflo.ai/contracts/{contract_id}`).
            *   Perform an HTTP POST request to the `TEAMS_WEBHOOK_URL` with the MessageCard payload.
            *   Implement error handling (e.g., log failures, handle non-200 responses from Teams).
        *   **Authentication:** The trigger invokes this function potentially using the `service_role` key for necessary permissions if fetching extra data. The function itself doesn't need specific auth checks beyond being invoked correctly.
*   **Frontend Implementation (React/Vite):**
    *   No changes required for this phase.
*   **Security:** Ensure the Webhook URL is treated as a secret. Secure the invocation method from the DB trigger to the Edge Function (e.g., using Supabase service role key if calling via `net.http_post` or internal function invocation).

---

### Phase 2: Teams Individual Notifications via Microsoft Graph

*   **Goal:** Send direct messages (DMs) with actionable Adaptive Cards (e.g., Approve/Reject) to relevant users.
*   **Prerequisites:**
    1.  **Azure AD App Registration (Requires M365 Admin):**
        *   Register a new *single-tenant* application ("ContractFlo Bot").
        *   Grant **Application Permissions** for Microsoft Graph: `Chat.ReadWrite` (to send DMs), `User.Read.All` (to lookup user IDs by UPN), `ChannelMessage.Send` (if needed for channel replies later).
        *   Grant **Admin Consent** for the tenant.
        *   Create a **Client Secret** and securely store its value.
        *   Note down the **Tenant ID** and **Client ID**.
    2.  **User Profile Data:** Ensure a way to map ContractFlo users to their Azure AD User Principal Names (UPNs). Suggestion: Add an optional `azure_ad_user_principal_name` text field to your Supabase `profiles` or `auth.users.user_metadata` table. This needs population (manual, sync, or during user setup).
    3.  **Supabase Env Vars:** Add `GRAPH_TENANT_ID`, `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET` to the environment variables for the relevant Supabase Functions.
*   **Backend Implementation (Supabase):**
    1.  **Edge Function (`supabase/functions/send-teams-dm/index.ts`):**
        *   **Purpose:** Sends an Adaptive Card DM to a specific user via Graph API.
        *   **Invocation:** Triggered by specific workflow events (e.g., contract status changes to 'Pending Approval', called from another function or DB trigger).
        *   **Input:** Contract ID, recipient's ContractFlo user ID, type of notification/card needed.
        *   **Logic:**
            *   Read Graph API credentials from environment variables.
            *   Fetch the recipient's `azure_ad_user_principal_name` from Supabase based on their ContractFlo user ID.
            *   **Get Graph API Token:** Implement OAuth 2.0 client credentials flow (`POST https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`) using client ID/secret to get an access token with `scope=https://graph.microsoft.com/.default`. Cache this token appropriately (e.g., in memory with expiry check).
            *   **Find/Create Chat:** Use the access token to call `POST https://graph.microsoft.com/v1.0/users/{userPrincipalName}/chats` (or potentially search existing chats) to get the `chatId` for the DM with the target user. Requires `Chat.ReadWrite`.
            *   **Construct Adaptive Card:** Build the JSON for the Adaptive Card (e.g., with Approve/Reject buttons).
                *   **Action Handling (Recommended: Option C - App Redirect):** Configure `Action.OpenUrl` buttons that link back to your application, passing context. Example URL: `https://app.contractflo.ai/handle-teams-action?contractId={contract_id}&action=approve&userId={user_id}`.
            *   **Send Message:** Use the access token and `chatId` to call `POST https://graph.microsoft.com/v1.0/chats/{chatId}/messages` with the Adaptive Card payload.
            *   Implement error handling for all Graph API calls.
    2.  **Edge Function (`supabase/functions/approve-contract/index.ts` or similar existing API):**
        *   **Purpose:** Handles the core logic of approving/rejecting a contract. This likely *already exists* and is called by your frontend.
        *   **Authentication:** This endpoint MUST be protected and verify the *logged-in user's* JWT (`Authorization: Bearer <token>`), ensuring they have permission to approve/reject the specified contract.
*   **Frontend Implementation (React/Vite):**
    1.  **Route/Page (`src/pages/HandleTeamsAction.tsx` or similar):**
        *   Create a new route (e.g., `/handle-teams-action`) registered in `src/App.tsx`.
        *   This page/component reads query parameters (`contractId`, `action`, `userId`) from the URL.
        *   It verifies the logged-in user (using Supabase client auth state) matches the `userId` (or has appropriate permissions).
        *   It calls the existing protected backend API (`/api/approve-contract` or similar) to perform the actual approve/reject action using the user's session token.
        *   Provides user feedback (e.g., "Contract Approved!", redirecting back to the contract page).
*   **Security:** Protect Graph API credentials. Ensure user mapping is correct. Secure the action-handling API endpoint with standard user JWT authentication. Validate users performing actions initiated via Teams links.

---

### Phase 3: Outlook Actionable Messages

*   **Goal:** Send renewal reminders via email with an embedded action button (e.g., "Mark Renewed").
*   **Prerequisites:**
    1.  **Email Sending Domain:** Configure DKIM and SPF records for the domain you'll send emails from (e.g., `notifications.contractflo.ai` or `contractflo.ai`) to align with Microsoft's requirements. This requires DNS access.
    2.  **Actionable Message Developer Dashboard:** Register your sending domain and the target URL for action handling (e.g., `https://app.contractflo.ai/api/handle-outlook-action`) in the AM Dashboard. This links your sender address to the allowed action endpoint.
    3.  **Azure AD App Permissions:** Ensure the "ContractFlo Bot" Azure AD App has `Mail.Send` **Application Permission** granted (if not already included).
    4.  **Supabase Env Vars:** Graph API credentials should already be configured from Phase 2.
*   **Backend Implementation (Supabase):**
    1.  **Scheduling Mechanism:** Implement a way to trigger renewal reminders (e.g., a Supabase Cron Job (`supabase/cron/check-renewals/index.ts`) that runs daily).
    2.  **Edge Function (`supabase/functions/send-outlook-actionable-message/index.ts`):**
        *   **Purpose:** Sends an email with an embedded Actionable Message via Graph API.
        *   **Invocation:** Called by the scheduling mechanism (e.g., Cron Job) when a contract nears renewal.
        *   **Input:** Contract ID, recipient email address(es).
        *   **Logic:**
            *   Read Graph API credentials.
            *   Get Graph API Token (client credentials flow, same as Phase 2).
            *   Fetch contract details and recipient email.
            *   **Construct Adaptive Card:** Build the card JSON for the renewal reminder.
                *   **Action Handling:** Use `Action.Http` for the button (e.g., "Mark Renewed").
                    *   `method`: `POST`
                    *   `url`: The *exact* URL registered in the AM Dashboard (e.g., `https://app.contractflo.ai/api/handle-outlook-action`).
                    *   `body`: JSON payload containing necessary context (e.g., `{"contractId": "{contract_id}", "action": "renewed"}`).
                    *   `headers`: `[{"name": "Authorization", "value": ""}]` - Microsoft automatically inserts the Bearer token here.
            *   **Format Email Body:** Embed the Adaptive Card JSON within `<script type="application/ld+json">...</script>` inside the HTML email body. Include a fallback message for clients that don't support Actionable Messages.
            *   **Send Email:** Use the Graph API token to call `POST https://graph.microsoft.com/v1.0/users/{senderUserId}/sendMail` (or `/me/sendMail` if appropriate context is available, otherwise use the app identity). Fill in `subject`, `toRecipients`, `body`. Requires `Mail.Send`.
            *   Implement error handling.
    3.  **Edge Function (`supabase/functions/handle-outlook-action/index.ts`):**
        *   **Purpose:** Handles the POST request from the Actionable Message button click.
        *   **Invocation:** Directly POSTed to by Outlook/Microsoft when a user clicks the action button.
        *   **Input:** HTTP POST request with JSON body (e.g., `{"contractId": "123", "action": "renewed"}`) and an `Authorization: Bearer <JWT>` header provided by Microsoft.
        *   **Logic:**
            *   **Validate Request:** Implement Actionable Message security validation. This involves:
                *   Verifying the JWT signature using Microsoft's public keys.
                *   Checking the `aud` (audience) claim matches your service URL.
                *   Checking the `sub` (subject) claim identifies the user who clicked the action.
            *   **Perform Action:** If validation passes, extract the `contractId` and `action` from the request body. Use the validated user identity (`sub` claim) to perform the "Mark Renewed" action in your database (e.g., update contract status or log renewal).
            *   **Respond:** Return HTTP 200 OK. Optionally include the `CARD-ACTION-STATUS` header with a success message to be displayed in Outlook.
        *   **Authentication:** Relies *solely* on the Actionable Message JWT validation.
*   **Frontend Implementation (React/Vite):**
    *   No direct changes required, but ensure the contract view reflects the status change made via the Outlook action.
*   **Security:** Critical to implement Actionable Message JWT validation correctly on the handler endpoint. Ensure DKIM/SPF are correctly set up.

---

### Phase 4: Documentation & Rollout

1.  **Azure Consent Guide:** Prepare the guide for Travel Oregon IT detailing the Azure AD App registration steps and required permissions.
2.  **Testing:**
    *   Test Teams webhook posts with various contract statuses.
    *   Test Teams DM sending and Adaptive Card rendering.
    *   Test the full Teams action flow (click button -> redirect to app -> app calls API -> contract updated).
    *   Test Outlook email sending, AM rendering, and fallback content.
    *   Test the Outlook action flow (click button -> handler function validates JWT -> contract updated). Test with invalid tokens.
    *   Test user mapping scenarios (user found/not found).
3.  **Deployment:** Deploy Supabase Functions, configure environment variables, set up DB triggers/cron jobs.
4.  **User Communication:** Inform users about the new notification features.

--- 