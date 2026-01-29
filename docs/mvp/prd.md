# Product Requirements Document (PRD): Core Platform MVP

## 1. Overview
This document outlines the implemented features and user flows for the Pockett One Core Platform MVP. The platform serves as a client-centric workspace for professional services, integrating seamlessly with Google Drive for document management.

## 2. Onboarding Flow
**Goal**: Ensure every user has a dedicated workspace immediately upon signup.

- [x] **Trigger**: New user signup via Auth provider (Google).
- [x] **Routing**:
    - [x] If User has *NO* organization memberships -> Redirect to `/onboarding`.
    - [x] If User has existing memberships -> Redirect to `/dash` (which routs to default Organization).
- [x] **Feature: "Name your Workspace"**:
    - [x] Simple form input for Organization Name.
    - [x] Auto-generates a URL-friendly slug.
    - [x] **Action**: Provisions a new Organization (Tier: Free) and assigns the user as `ORG_OWNER`.

## 3. Organization Level
**Goal**: The root container for all business data, settings, and team access.

- [x] **Structure**:
    - [x] **Multi-Tenancy**: Users can belong to multiple organizations (switching via User Profile dropdown, though currently scoped to single active view).
    - [x] **Role-Based Access Control (RBAC)**:
        - [x] `ORG_OWNER`: Full administrative access (Billing, Settings, Client Creation).
        - [x] `ORG_MEMBER`: Standard access (View/Edit Projects).
        - [x] `ORG_GUEST`: Restricted access (Project-scoped).
- [x] **Dashboard**:
    - [x] Redirects to the most recently used Client Workspace.
    - [x] Displays global navigation (App Sidebar).

## 4. Client Management
**Goal**: Organize work by the customer/entity being served.

- [x] **Data Model**: Clients are children of an Organization.
- [x] **UI Components**:
    - [x] **Sidebar Selector**: Dropdown to switch between active Clients.
    - [x] **Persistence**: Remembers the last selected Client per Organization (LocalStorage).
    - [x] **Empty State**: Prompts to create a Client if none exist.
- [x] **Feature: Create Client**:
    - [x] **Access**: `ORG_OWNER` only.
    - [x] **Input**: Client Name, Industry/Sector.
    - [x] **Output**: Creates a Client entity in DB.

## 5. Project Management
**Goal**: The primary unit of work (Engagement, Case, Audit).

- [x] **Data Model**: Projects belong to a Client and are linked 1:1 with a Google Drive Folder.
- [x] **UI Components**:
    - [x] **Project List**: View all projects for the active Client.
        - [x] Toggle: Grid View / List View.
    - [x] **Sidebar Navigation**:
        - [x] "Projects" item expands to show active Project Tabs when inside a project.
- [x] **Feature: Create Project**:
    - [x] **Input**: Project Name, Start Date, Description.
    - [x] **Integration**: Automatically creates a structured Google Drive Folder (`[Client Name] / [Project Name]`).
    - [x] **Sync**: Stores the Drive Folder ID in DB for direct access.
- [x] **Project Workspace (Tabs)**:
    1.  [x] **Files**: Document management (Default View).
    2.  [ ] **Sharing**: User/Guest access settings (Placeholder).
    3.  [ ] **Insights**: Analytics dashboard (Placeholder).
    4.  [ ] **Data Sources**: Connector configuration (Placeholder).

## 6. File Management
**Goal**: Secure, robust, and familiar document handling powered by Google Drive.

- [x] **Architecture**: "Headless" Drive integration. Pockett acts as the UI, Google Drive acts as the storage/backend.
- [x] **Security**:
    - [x] **Direct-to-Drive Uploads**: Files are streamed directly from Browser to Google (TLS 1.3), bypassing Pockett servers (Resumable Upload Protocol).
    - [x] **Scoped Access**: System uses a Service Account or OAuth Scope limited to specific folders.
- [x] **Feature: File Browser**:
    - [x] **Visuals**: Clean, table-based layout (Name, Owner, Date, Size).
    - [x] **Icons**: Dynamic file-type icons (PDF, Sheets, Docs, Images, etc.).
    - [x] **Navigation**: Breadcrumbs for folder traversal.
    - [x] **Actions**: Context menu for Open, Rename (implied), Delete (implied).
- [x] **Feature: Upload Experience**:
    - [x] **UX**: Bottom-right floating progress modal (similar to Gmail/Drive).
    - [x] **Capabilities**:
        - [x] **Multi-file Batching**: Queue multiple files.
        - [x] **Background Processing**: Continue navigating while uploading.
        - [x] **Conflict Resolution**: Detects duplicates. User can choose to **Rewrite** (Replace) or **Keep Both** (Auto-rename).
        - [x] **Smart Tracking**: If a file is renamed (e.g. `Report.pdf` -> `Report_1.pdf`) due to conflict, the UI captures the *final* name.
    - [x] **Post-Upload**: "Show file location" button highlights the new file in the list.

## 7. Project Members & Personas
**Goal**: Manage access control through granular, role-based personas at the project level.

- [x] **Data Model (New)**:
    - [x] **`ProjectPersona`**: Helper table scoped to `Organization`. Defines role templates.
        -   **Fields**: `name`, `description`, `role` (System Role: `ORG_MEMBER` | `ORG_GUEST`), `permissions` (JSON: `can_view`, `can_edit`, `can_manage`), `isDefault`.
    - [x] **`ProjectMember` Update**: Links `userId` to `projectId` AND `personaId`. Added `settings` (JSONB).
    - [x] **`ProjectInvitation`**: Tracks pending invites (`email`, `personaId`, `status`, `token`).

- [x] **Default Personas (Organization Level Templates)**:
    1.  **Project Owners**
        -   **System Role**: `ORG_MEMBER`
        -   **Permissions**: `can_manage` (delete docs, invite members).
        -   **Access**: Continuous.
        -   **Note**: At least 1 required. Default `ORG_OWNER` added automatically.
    2.  **Project Internal Members**
        -   **System Role**: `ORG_MEMBER`
        -   **Permissions**: `can_manage`, `can_edit` (create/edit docs).
        -   **Access**: Continuous.
    3.  **Project Associates**
        -   **System Role**: `ORG_GUEST`
        -   **Permissions**: `can_edit`.
        -   **Access**: Limited (initiation to completion).
    4.  **Project Clients**
        -   **System Role**: `ORG_GUEST`
        -   **Permissions**: `can_view`.
        -   **Access**: Stakeholder view.

- [x] **UI Components (Members Tab)**:
    - [x] **Member List**: Shows User, Persona, and Status.
    - [x] **Invitation Modal**: Input Email + Select Persona.
    - [x] **Change Member Role**: Dialog to update an existing member's persona assignment.
    - [ ] **Persona Editor**:
        -   Edit Name/Description of existing personas.
        -   Add New Persona (Name, Desc, System Role, Permissions).
    - [x] **Invitation Status**:
        -   `PENDING`: Show "Resend" button.
        -   `ACCEPTED`: Link Verified / Signup in progress.
        -   `JOINED`: Fully onboarded member.

- [x] **Invitation Flow**:
    -   [x] **Sender**: Invites email -> Selects Persona -> System sends email (SMTP/Brevo).
    -   [x] **Invitee**: Clicks link -> If new, registers -> If existing, signs in -> Redirected to Project.
    -   [x] **System**: Updates `ProjectInvitation` status -> Creates `ProjectMember` record -> Assigns `OrganizationMember` role if needed.
    -   [x] **Security (Tamper-Proofing)**:
        -   **Backend Enforcement**: Invitation redemption logic explicitly validates that the `invite.email` matches the `authenticated_user.email`.
        -   **Prevention**: Prevents "Link Forwarding" or "UI Tampering" where a user attempts to claim an invite intended for another email address.
    -   [x] **Reliability (Transactional Integrity)**:
        -   **Atomic Operations**: Acceptance logic wrapped in `prisma.$transaction`.
        -   **Guarantee**: Ensures Member Creation, Org Member Creation, and Invite Status Update happen as a single atomic unit. Prevents inconsistent states (e.g. "Joined" status without "Member" record).

