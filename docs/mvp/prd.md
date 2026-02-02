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
  - [x] Displays global navigation (App Sidebar: Projects, Members, Shares, Insights, Sources, Connectors).
- [x] **Connectors**: Org-level Google Drive connection at `/o/[slug]/connectors`; used for project Drive folder sync and Import from Drive in file browser.
  - [x] **Folder Setup**: When Google Drive connector is initialized, creates `.pockett` root folder and organization folder with strict permission restrictions (owner-only, no inheritance from parent). See [File Management Security](#6-file-management) for details.

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
- [x] **Project Creator as Project Lead**: When a project is created, the creator is automatically added as a Project Lead member. This ensures the org owner (or any user who creates the project) sees the file list and has full project access without special-case logic; file visibility remains strictly persona-based.
- [x] **Project Settings (Project Lead only)**:
  - [x] **Settings icon**: Prominent settings icon beside the project name (large bold title); visible only to users with the Project Lead persona for that project.
  - [x] **Role access config**: In-code JSON config (`PROJECT_ROLE_ACCESS.canViewProjectSettings: ['Project Lead']`) determines who can view and use project settings; intended to move later to permissions or `project_personas` table.
  - [x] **Settings modal**:
    - **Project Properties**: Name, Description, Save. When the project is closed (`isClosed: true`), property fields and Save are disabled; user must reopen to edit.
    - **Close project** (amber): Sets `isClosed: true`. Project becomes view-only for current members. All project members who are org guests (`ORG_GUEST`) are removed and their Google Drive folder access is revoked.
    - **Reopen project** (amber): Shown when `isClosed: true`. Sets `isClosed: false`; only Project Lead can reopen.
    - **Delete project** (red): Soft delete. Sets `isDeleted: true`; removes all project members; revokes all Google Drive permissions on the project folder (restrict to owner only). The project folder is **not** deleted in Google Drive so the org admin can still access files natively outside Pockett. No other DB records or Drive files are deleted.
- [x] **Project lifecycle flags**: `Project.isClosed` (Boolean, default false) and `Project.isDeleted` (Boolean, default false). Deleted projects are excluded from hierarchy and all project fetches; they are hidden from everyone in the portal.
- [x] **Project Workspace (Tabs)**:
  1. [x] **Files**: Document management (default view); full file browser, uploads, Import from Drive, folder upload.
  2. [x] **Members**: Member list, invitations, personas (see §7).
  3. [ ] **Shares**: User/guest sharing settings (placeholder).
  4. [x] **Insights**: Project-level insights dashboard (recent/trending/storage/sharing views).
  5. [ ] **Sources**: Data sources & connectors (placeholder; org-level Connectors at `/o/[slug]/connectors` for Google Drive).

## 6. File Management

**Goal**: Secure, robust, and familiar document handling powered by Google Drive.

- [x] **Architecture**: "Headless" Drive integration. Pockett acts as the UI, Google Drive acts as the storage/backend.
- [x] **Security**:
  - [x] **Direct-to-Drive Uploads**: Files are streamed directly from Browser to Google (TLS 1.3), bypassing Pockett servers (Resumable Upload Protocol).
  - [x] **Scoped Access**: System uses a Service Account or OAuth Scope limited to specific folders.
  - [x] **Folder Permission Restrictions**:
    - [x] **Centralized Access Control**: All folder permissions are managed exclusively through Pockett Portal project membership. Google Drive's native sharing is disabled to prevent unauthorized access.
    - [x] **`.pockett` Root Folder**: When created during organization setup, permissions are restricted to owner-only with no inheritance from parent folder. All non-owner permissions are removed to ensure strict access control.
    - [x] **Organization Folders**: Each organization folder created under `.pockett` is restricted to owner-only access with no inheritance from `.pockett` parent. This ensures complete isolation of organization data.
    - [x] **Project-Level Permissions**: Access to project folders is granted automatically when users join projects via invitation (Project Lead and Team Member personas receive `can_edit` access). Permissions are revoked automatically when members are removed from projects.
    - [x] **Enforcement**: Applied automatically during `setupOrgFolder()` when Google Drive connector is initialized. Both new and existing folders are secured to prevent unauthorized access. This ensures that all access is controlled through Pockett Portal's project membership system, not through Google Drive's native sharing mechanisms.
- [x] **Feature: File Browser**:
  - [x] **Visuals**: Clean, table-based layout (Name, Owner, Date modified, File size). Column headers in Title case; Sort column right-aligned with row action menu.
  - [x] **Icons**: Dynamic file-type icons (PDF, Sheets, Docs, Images, etc.).
  - [x] **Navigation**: Breadcrumbs for folder traversal.
  - [x] **Loading state**: Toolbar (Add, Type, People, Modified, Source, Search) disabled while the file list is loading.
  - [x] **Filters**: Type (multi-select with checkboxes; "All types" indeterminate when some selected; stays open until Done), People (Any / Owned by me / Not owned by me), Modified (Any / 7d / 30d / 1y), Source (filter by connector). All filter dropdowns use `text-xs` and header + Done button.
  - [x] **Sort**: Dedicated Sort column (icon + "Sort" label) with dropdown: Sort by (Name, Date modified, Date modified by me, Date opened by me), Sort direction (A–Z, Z–A), Folders (On top, Mixed with files). Default: Name, A–Z, Folders on top.
  - [x] **Refresh**: Button next to search to refresh list (e.g. after renaming in Google Docs).
  - [x] **Actions**: Row action menu (Preview, Edit in Google Docs, Open Folder in Drive, Download, Share, Version history, Bookmark, Set Due Date, Rename/Copy/Move/Delete when callbacks provided). Menu items `text-xs`; menu stays open until user dismisses.
  - [x] **Long names**: Truncated file names show full name in tooltip.
  - [x] **Direct-to-Drive**: Add menu indicates uploads go directly to Google (never through Pockett servers).
- [x] **Feature: Add Menu**:
  - [x] **New folder** (and New Doc/Sheet/Slide/etc. via submenu).
  - [x] **From your computer**: Upload files; Upload folder (retains folder structure in Drive; in-app confirmation modal).
  - [x] **Import from Google Drive**: Opens Google Picker with **My Drive** and **Shared Drives** tabs; starts at root (top-level folders/files), LIST view; user traverses hierarchy and multi-selects; selection flows to import confirmation dialog (copy/shortcut).
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

- [x] **File visibility**: Only users who are project members with a persona (Project Lead, Team Member, etc.) see project files. There is no special path for "org member with no project persona"; the project creator is always added as a Project Lead so they see files from creation.
- [x] **Data Model (New)**:
  - [x] **`ProjectPersona`**: Helper table scoped to `Organization`. Defines role templates.
    - **Fields**: `name`, `description`, `role` (System Role: `ORG_MEMBER` | `ORG_GUEST`), `permissions` (JSON: `can_view`, `can_edit`, `can_manage`, `can_comment`), `isDefault`.
  - [x] **`ProjectMember` Update**: Links `userId` to `projectId` AND `personaId`. Added `settings` (JSONB).
  - [x] **`ProjectInvitation`**: Tracks pending invites (`email`, `personaId`, `status`, `token`).

- [x] **Default Personas (Organization Level Templates)**:
  1. **Project Lead**
     - **System Role**: `ORG_MEMBER`
     - **Permissions**: `can_view`, `can_edit`, `can_manage`, `can_comment` (full administrative access including member management and document deletions).
     - **Access**: Continuous.
     - **Description**: Internal team member responsible for project oversight.
  2. **Team Member**
     - **System Role**: `ORG_MEMBER`
     - **Permissions**: `can_view`, `can_edit`, `can_manage`, `can_comment` (full project access including document creation, editing, and team collaboration).
     - **Access**: Continuous.
     - **Description**: Internal staff member with full project access.
  3. **External Collaborator**
     - **System Role**: `ORG_GUEST`
     - **Permissions**: `can_view`, `can_edit`, `can_comment` (can view and edit documents, provide feedback, but cannot manage project settings or delete content).
     - **Access**: Project-scoped, need-to-know basis.
     - **Description**: External partner, contractor, or vendor working on the project.
  4. **Client Contact**
     - **System Role**: `ORG_GUEST`
     - **Permissions**: `can_view`, `can_comment` (view-only access with ability to provide feedback and track progress).
     - **Access**: Stakeholder view.
     - **Description**: Client stakeholder or project sponsor with view-only access.

- [x] **UI Components (Members Tab)**:
  - [x] **Member List**: Shows User, Persona, and Status.
  - [x] **Invitation Modal**: Input Email + Select Persona.
  - [x] **Change Member Role**: Dialog to update an existing member's persona assignment.
  - [ ] **Persona Editor**:
    - Edit Name/Description of existing personas.
    - Add New Persona (Name, Desc, System Role, Permissions).
  - [x] **Invitation Status**:
    - `PENDING`: Show "Resend" button.
    - `ACCEPTED`: Link Verified / Signup in progress.
    - `JOINED`: Fully onboarded member.

- [x] **Invitation Flow**:
  - [x] **Sender**: Invites email -> Selects Persona -> System sends email (SMTP/Brevo).
  - [x] **Invitee**: Clicks link -> If new, registers -> If existing, signs in -> Redirected to Project.
  - [x] **System**: Updates `ProjectInvitation` status -> Creates `ProjectMember` record -> Assigns `OrganizationMember` role if needed.
  - [x] **Google Drive Access**: Automatically grants folder permissions based on persona:
    - [x] **Project Lead & Team Member**: Receive `writer` (can_edit) access to project's Google Drive folder upon joining.
    - [x] **External Collaborator & Client Contact**: No automatic Drive access (view-only through Portal UI).
    - [x] **Removal**: When any member is removed from a project, their Google Drive folder access is automatically revoked.
  - [x] **Security (Tamper-Proofing)**:
    - **Backend Enforcement**: Invitation redemption logic explicitly validates that the `invite.email` matches the `authenticated_user.email`.
    - **Prevention**: Prevents "Link Forwarding" or "UI Tampering" where a user attempts to claim an invite intended for another email address.
  - [x] **Reliability (Transactional Integrity)**:
    - **Atomic Operations**: Acceptance logic wrapped in `prisma.$transaction`.
    - **Guarantee**: Ensures Member Creation, Org Member Creation, and Invite Status Update happen as a single atomic unit. Prevents inconsistent states (e.g. "Joined" status without "Member" record).

## 8. Non-Functional Requirements: Error Handling & Logging

**Goal**: Ensure system reliability, observability, and robust error recovery across all application layers.

- [x] **Infrastructure**:
  - [x] **Sentry Integration**:
    - [x] **Client-Side**: Browser error tracking with Session Replay (10% sampling).
    - [x] **Server-Side**: Node.js runtime error tracking with performance monitoring.
    - [x] **Edge Runtime**: Middleware error tracking.
    - [x] **Source Maps**: Automated upload during build for readable stack traces.
  - [x] **Logger Utility**:
    - [x] **Centralized Logging**: Unified interface (`lib/logger.ts`) for all log levels (`debug`, `info`, `warn`, `error`).
    - [x] **Environment Awareness**:
      - **Dev**: Colored console output with metadata.
      - **Prod**: JSON structured logs + Sentry integration.
    - [x] **Context Awareness**: Captures user ID, organization context, and breadcrumbs.

- [x] **Resilience & Recovery**:
  - [x] **Global Error Boundaries**:
    - [x] **Root Level**: Catches top-level crashes (`app/global-error.tsx`).
    - [x] **Page Level**: Catches route-specific errors (`app/error.tsx`).
    - [x] **Component Level**: Granular boundaries for widget isolation (e.g., `ProjectFileList`).
  - [x] **Graceful Degradation**: Failed components display user-friendly fallback UI without crashing the entire app.

- [x] **Privacy & Security**:
  - [x] **Sanitization**:
    - [x] Sentry masking for text input and sensitive data.
    - [x] Removal of PII from production logs.
  - [x] **Health Checks**: Filtered out from error tracking to reduce noise.
  - [ ] **Database Row-Level Security (RLS)** (recommended, not yet implemented):
    - **Multi-tenancy:** At organization level (tenant = Organization). RLS may be applied at different levels for different tables.
    - **Org-level RLS:** For org-owned tables (`organizations`, `clients`, `projects`, `connectors`, `project_personas`, `organization_members`) restrict by `organization_id` (e.g. `current_setting('app.current_org_id')` set per request).
    - **Project-level RLS:** For project-scoped tables (`project_members`, `project_invitations`) restrict by project membership (e.g. user may see rows only for projects they are a member of). See [HLD § Security & Compliance – RLS multi-tenancy strategy](mvp/hld.md#rls-multi-tenancy-strategy).
