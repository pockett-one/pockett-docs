# Product Requirement & Technical Design: Pockett Dashboard & Onboarding

**Status:** Draft  
**Reference Documents:**
- `Pockett_Domain_Signup_Org_Policy.md` (Signup & Auth Policy)
- `Pockett_Permissions_Access_Model.md` (Access Control Model)

---

## 1. Foundational Design Principles

To ensure scalability, security, and a frictionless "Product-Led Growth" (PLG) experience, the following principles must guide the database and authentication design.

### 1.1. Identity & Access Principles
*   **"Personal Workspace First" Onboarding:** Every signup is treated as an individual first. We do not block entry. We create a personal organization for every new user immediately, ensuring instant time-to-value.
*   **Implicit vs Explicit Access:**
    *   **Organizations** define *Identity* (Who you are, who pays).
    *   **Projects** define *Capability* (What you can do).
    *   **Principle:** Organization roles (`ORG_MEMBER`) do **not** imply project access. Project access must be explicitly granted (like Google Drive).
*   **Silent Deduping (The "Middle Path"):** We allow multiple users from the same domain (e.g., `@acme.com`) to create separate organizations. We detect this silently but do not force merges or block signups. We "nudge" later.

### 1.2. Database & Data Integrity Principles
*   **Strict Multi-tenancy:** All top-level entities (Customers, Projects) must belong to a single `Organization`. Data leakage between organizations is the highest severity failure.
*   **Single Source of Truth for Permissions:** Do not act on "inferred" permissions. There should be a specific table (e.g., `project_access`) that is queried to determine `can_view` or `can_edit`.
*   **Auditability:** Critical actions (signup, role changes, permission grants) should be logged.
*   **Idempotency:** The provisioning flow must be replayable. If a step fails and we retry, it should not create duplicate phantom records.

---

## 2. Functional Requirements (User Stories)

### User Story 1: Database & Entity Relationship Model

**As a** System Architect,  
**I want** a robust entity relationship model implemented in the database,  
**So that** we can support multi-tenancy, flexible access control, and logical data hierarchy.

#### Acceptance Criteria

1.  **Organization Entity (`Organization`)**
    *   Root container for all data.
    *   Attributes: `id`, `name`, `owner_id`, `created_at`.
    *   **Billing Attributes:** `stripe_customer_id` (string, nullable), `subscription_status` (enum: 'active', 'trialing', 'past_due', 'canceled', 'unpaid', 'none'), `plan_tier` (enum: 'free', 'pro', 'enterprise').
    *   Policy: An Organization has One Owner (`ORG_OWNER`) initially. The Organization is the billing entity.

2.  **User Entity (`User`)**
    *   **Native Supabase Implementation:** Use the existing `auth.users` table. **Do not create a separate `public.users` table** unless strictly required for foreign key constraints that cannot be resolved otherwise.
    *   **Metadata Storage:** All additional user properties (e.g., `full_name`, `avatar_url`, `preferences`) and system-level roles (e.g., `SYS_ADMIN`) must be stored within `auth.users.raw_app_meta_data` (secure/admin-only) or `auth.users.raw_user_meta_data` (user-updateable).
    *   **Relationship:** A User can belong to **Many** Organizations.

3.  **Organization Member (`OrganizationMember`)**
    *   Join entity between User and Organization.
    *   Attributes: `user_id` (ref `auth.users.id`), `org_id` (ref `public.organizations.id`), `role` (`ORG_OWNER`, `ORG_MEMBER`, `ORG_GUEST`).
    *   **Supabase Pattern:** Use RLS policies on this table to enforce tenancy. Sync active Org Role to a JWT claim/metadata only if necessary for performance, but `public.organization_members` remains the source of truth for RLS.

4.  **Customer Entity (`Customer`)**
    *   Represents a client or external entity being managed.
    *   Relationship: **Belongs to One Organization**.
    *   Relationship: **Has Many Projects**.

5.  **Project Entity (`Project`)**
    *   Represents a distinct workspace or engagement.
    *   Relationship: **Belongs to One Customer**.
    *   Relationship: **Has Many Access Rules** (Users with permissions).

6.  **Entity Hierarchy Validation**
    *   Verify: `Organization` -> 1:N `Customer` -> 1:N `Project`.
    *   Verify: `Organization` -> 1:N `OrganizationMember` -> 1:1 `User`.

7.  **Row Level Security (RLS) & Isolation**
    *   **Mandatory Enforcement:** Enable RLS on `public.organizations`, `public.customers`, `public.projects`, and `public.organization_members`.
    *   **Policy Logic:** A user can only `SELECT/INSERT/UPDATE/DELETE` rows where they are an active member of the `organization_id` associated with that row.
    *   **Supabase Context:** Ensure the application sets the context (or relies on `auth.uid()` joining to `organization_members`) to enforce this strict multi-tenancy at the database layer.

---

### User Story 2: Signup & Provisioning Policies

**As a** New User,  
**I want** a seamless signup process that automatically sets up my workspace,  
**So that** I can start using the product immediately without manual configuration.

#### Acceptance Criteria

1.  **Seamless Signup Flow (New User)**
    *   **Trigger:** User authenticates via Auth Provider (e.g., Google) for the first time.
    *   **Action 1 (User Creation):** Create `User` record if it doesn't exist.
    *   **Action 2 (Default Org):** Create a new `Organization`.
        *   Naming Convention: "[User's First Name]'s Workspace" (or similar).
        *   Role Assignment: Assign this User as `ORG_OWNER`.
    *   **Action 3 (Default Customer):** Create a default `Customer` entity under this Organization (e.g., Name: "General" or "Internal").
    *   **Action 4 (Default Project):** Create a default `Project` entity under the default Customer (e.g., Name: "Onboarding" or "My First Project").
    *   **Action 5 (Redirection):** Redirect user to `/o/[org_slug]` (slugified org name or id). **Do not use generic `/dash`.**

2.  **Existing User Sign In (Idempotency)**
    *   **Trigger:** Existing User authenticates (or clicks Signup again).
    *   **Validation:** Check if `User` already exists by Email/Auth ID.
    *   **Action:**
        *   **Do NOT** create a new User.
        *   **Do NOT** create a new default Organization/Customer/Project.
        *   **Redirect** directly to the Dashboard of their last active Organization: `/o/[last_active_org_slug]`.

3.  **URL Structure & Protection Rules**
    *   **Pattern:** `/o/[org_slug]/...` (e.g., `/o/deepaks-workspace/projects`).
    *   **Protection Rule (Middleware/Layout):**
        *   **Authentication:** User must be logged in.
        *   **Authorization:** User must be a member of the Organization identified by `[org_slug]`.
        *   **Failure:** If user is logged in but not a member, redirect to their own default org or a 403 Forbidden page ("You do not have access to this workspace").

4.  **Duplicate Domain Handling (Silent)**
    *   **Scenario:** `alice@acme.com` signs up. Later, `bob@acme.com` signs up.
    *   **Action:**
        *   Bob gets his **own** new Organization ("Bob's Workspace").
        *   Bob is **NOT** automatically added to Alice's Organization.
        *   Bob is **NOT** blocked.
    *   **Rationale:** See `Pockett_Domain_Signup_Org_Policy.md` -> "Do not block signup. Detect, nudge, and merge instead."

5.  **Error Handling**
    *   If any step of the provisioning fails (e.g., DB error after User creation but before Org creation), the next attempt must resume or retry gracefully without leaving the User in a broken state (Transaction or Check-before-create).

### User Story 3: Subscription Paywall & Feature Gating

**As a** Product Owner,
**I want** to enforce subscription tiers on Organization functionalities,
**So that** we can monetize premium features and manage usage limits.

#### Acceptance Criteria

1.  **Organization-Level Billing**
    *   Subscriptions are tied to the **Organization**, not the User.
    *   All members of an Organization inherit the Organization's plan tier coverage while working within that context.

2.  **Feature Gating Logic**
    *   **Enforcement:** Backend API and Frontend UI must check `organizations.plan_tier` and `organizations.subscription_status` before allowing restricted actions.
    *   **Logic:**
        *   IF `status` is 'active' or 'trialing' AND `tier` >= Required_Tier -> ALLOW.
        *   ELSE -> BLOCK (Return 402 Payment Required or show Upgrade Prompt).

3.  **Test/Dev Provisioning ("God Mode")**
    *   **Requirement:** Ability to manually override subscription status for testing/QA without making real Stripe payments.
    *   **Implementation:**
        *   `SYS_ADMIN` users (or via direct SQL) can update `organizations.plan_tier` and `organizations.subscription_status` directly.
        *   **SQL for Test User:**
            ```sql
            UPDATE public.organizations
            SET 
                subscription_status = 'active',
                plan_tier = 'pro'
            WHERE owner_id = (SELECT id FROM auth.users WHERE email = 'testuser@pockett.io');
            ```
