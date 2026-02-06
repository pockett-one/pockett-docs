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
- [ ] **Feature: File Assignment to External Members** (High Priority):
  - [ ] **Purpose**: Enable Project Leads to assign individual files/folders from the `general` folder to External Collaborator and Client Contact personas. This provides granular file-level sharing beyond project-level access.
  - [ ] **Access Control**: Only Project Leads can assign files to external members. External Collaborator and Client Contact personas do not automatically receive Drive access upon project invitation; they only get access to files explicitly assigned to them.
  - [ ] **Assignment UI**:
    - [ ] When Project Lead selects a file/folder in the file browser, show "Assign to Members" option in the row action menu.
    - [ ] Assignment modal lists External Collaborator and Client Contact members for the project.
    - [ ] Allow multi-select assignment (assign one file to multiple external members).
    - [ ] Show visual indicators (badge/icon) in file browser for files that have been assigned to external members.
  - [ ] **Google Drive Permission Grant**:
    - [ ] When a file is assigned to an External Collaborator, automatically grant `writer` (can_edit) permission to that specific file/folder in Google Drive.
    - [ ] When a file is assigned to a Client Contact, automatically grant `reader` (can_view) permission to that specific file/folder in Google Drive.
    - [ ] Permissions are scoped to the assigned file/folder only, not the entire project folder.
  - [ ] **Assignment Tracking**:
    - [ ] Track file assignments in database (new `FileAssignment` table or extend existing models) to record which files are assigned to which external members.
    - [ ] Store: `fileId` (Google Drive file ID), `projectId`, `memberId` (ProjectMember ID), `assignedAt`, `assignedBy` (userId).
  - [ ] **Revoke Assignment**:
    - [ ] Allow Project Lead to revoke file assignments, which removes Google Drive permissions for that file/folder.
    - [ ] Revocation removes the assignment record and revokes the Drive permission.
  - [ ] **Scope Limitations**:
    - [ ] File assignment only applies to files/folders within the `general` folder (not `confidential` folder).
    - [ ] Cannot assign files to Project Lead or Team Member personas (they already have full access).
    - [ ] Assignment is file-level, not folder-level inheritance (assigning a folder does not automatically assign all files within it).

- [ ] **Feature: Document Review & Collaboration** (High Priority):
  - [ ] **Review System**: Add comments/feedback functionality with threaded discussions to maintain conversation context.
  - [ ] **Approve/Finalize/Publish Workflow**: Allow guests (External Collaborator, Client Contact) to approve, finalize, or publish documents.
  - [ ] **Publish/Finalize to Lock & Version**: When a document is published/finalized, lock it and create a version snapshot.
  - [ ] **Export to PDF**: Enable export of finalized documents to PDF format.
  - [ ] **Watermark Branding**: Add watermarking with organization branding to exported PDFs.
  - [ ] **"Track" Tab**: Add a "Track" tab beside files to show review status, comments, approvals, and version history.

- [ ] **Feature: Project Templates & Duplication** (High Priority):
  - [ ] **Template Projects**: Define template projects with pre-defined folder structures and template documents. Provide ready-made templates for targeted Lines of Business (LOBs).
  - [ ] **Template Selection**: Allow users to choose a template project when starting a new project to begin with reusable assets.
  - [ ] **Duplicate Project**: Enable duplication of existing projects with all folder structures, documents, and configurations.

- [ ] **Feature: Document Relationships & Dependencies** (High Priority):
  - [ ] **Related/Dependent Documents**: Support commitment-based or linked access between documents, not just folder-level access.
  - [ ] **Relationship Management**: Add relationship tracking amongst folders or files (e.g., parent-child, dependencies, references).
  - [ ] **Relationship Tree View**: Display relationship tree visualization showing document dependencies and connections (project task-like structure).

- [ ] **Feature: Client Communication & Follow-ups** (High Priority):
  - [ ] **Automated Consolidated Follow-ups**: Send automated consolidated client follow-up emails on all pending documents.
  - [ ] **Custom Follow-up Messages**: Allow customization of follow-up message templates and scheduling.
  - [ ] **Calendar Integration**: Block calendar through Calendly (or similar) for document discussion scheduling.
  - [ ] **Bi-directional Calendar Requests**: Enable both Team → Client and Client → Team calendar request flows for document discussions.

- [ ] **Feature: UI Enhancements** (High Priority):
  - [ ] **Project Card Images**: Add random/featured images to Project cards for visual appeal and better project identification.

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
  - [ ] **Persona Renaming** (Low Priority):
    - Allow Project Leads to rename default persona names per project (e.g., rename "Team Member" to "Accountant" or "External Collaborator" to "Contractor").
    - Simple rename field in Project > Members screen, edit button next to persona name.
    - **Scope Limitation**: Rename only - no new persona creation, no permission changes, no description editing.
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
    - [x] **External Collaborator & Client Contact**: No automatic Drive access (view-only through Portal UI). Files must be explicitly assigned to these personas via File Assignment feature (see [File Management](#6-file-management)).
    - [x] **Removal**: When any member is removed from a project, their Google Drive folder access is automatically revoked. File assignments are also revoked when a member is removed.
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

## 9. Waitlist System

**Goal**: Build anticipation for Pro plan launch, collect early interest, and drive viral growth through referrals.

### 9.1 Waitlist Signup Flow

- [x] **Public Waitlist Page** (`/waitlist`):
  - [x] **Fixed Email Field**: Always visible at top of page with "Enter your email" label.
  - [x] **Email Validation**: Real-time validation checks email format and waitlist status (debounced 800ms).
  - [x] **Email Locking**: After validation completes, email field locks with lock icon and pencil edit button.
  - [x] **Dynamic Content Branching**:
    - [x] **Branch 1 - Existing Waitlist Member**: Shows waitlist status (position, points, referrals), referral link, and leaderboard.
    - [x] **Branch 2 - New Signup**: Shows registration form (company name, size, role, comments) with email pre-filled (hidden field).
    - [x] **Branch 3 - Success**: Shows confirmation message after successful submission.
  - [x] **Social Proof Counter**: Displays "X people have already joined!" with avatars when total count > 25.
  - [x] **Early Access Offer Banner**: Prominently displays Pro Plus upgrade benefits and referral rewards.

- [x] **Form Fields**:
  - [x] **Email** (required): Pre-filled from email check, hidden in form.
  - [x] **Company Name** (optional): Text input.
  - [x] **Company Size** (optional): Dropdown (Solo, 2-10, 11-50, 51-200, 200+).
  - [x] **Role** (optional): Text input (e.g., Consultant, Accountant, Founder).
  - [x] **Comments** (optional): Textarea for additional context.
  - [x] **Honeypot Field**: Hidden field to prevent bot submissions.
  - [x] **Cloudflare Turnstile**: Captcha verification for spam prevention.

- [x] **Security & Validation**:
  - [x] **Rate Limiting**: 3 submissions per hour per IP address.
  - [x] **Duplicate Prevention**: Checks for existing email before submission.
  - [x] **Server-Side Validation**: Email format, Turnstile verification, honeypot check.
  - [x] **Privacy**: Email addresses masked in logs (first 3 chars + ***).

### 9.2 Referral System

- [x] **Referral Code Generation**:
  - [x] **Format**: 8-character alphanumeric code (uppercase, excludes confusing chars: 0/O, 1/I).
  - [x] **Uniqueness**: Database constraint ensures unique codes.
  - [x] **Auto-Generation**: Created automatically on waitlist signup.

- [x] **Referral Benefits Structure**:

  **For Referrers** (People who share their link):
  - [x] **Position Boost**: Move up 3 positions in waitlist per successful referral.
  - [x] **Points System**: Earn 30 points per referral (used for leaderboard ranking).
  - [x] **Pro Plus Upgrade**: Automatically upgraded to Pro Plus at 5 referrals.
  - [x] **Discount**: 20% off first 3 months when subscribing.

  **For Referees** (People who sign up via referral link):
  - [x] **Skip Ahead**: Start 10 positions higher than normal signups (via createdAt adjustment).
  - [x] **Priority Access**: Early access when Pro plan launches.
  - [x] **Discount**: 15% off first 3 months when subscribing.

- [x] **Referral Link Sharing**:
  - [x] **Format**: `https://pockett.io/waitlist?ref=ABC123XY`
  - [x] **Display**: Prominently shown in waitlist status view.
  - [x] **Copy Functionality**: One-click copy button with visual feedback.
  - [x] **URL Parameter Handling**: Automatically detects and processes referral codes from URL.

- [x] **Position Calculation**:
  - [x] **Normal Signup**: Position = count of people who signed up before them (based on createdAt).
  - [x] **Referral Signup**: Position = count before them - 10 positions (via createdAt timestamp adjustment).
  - [x] **Referrer Boost**: For each referral, referrer's positionBoost increments by 3 (tracked in database).

### 9.3 Leaderboard & Social Proof

- [x] **Leaderboard Display**:
  - [x] **Top 10 Referrers**: Ranked by referral count (points = referrals × 30).
  - [x] **Table Format**: POSITION | EMAIL | POINTS columns.
  - [x] **Rank Badges**: Special styling for #1 (gold), #2 (silver), #3 (bronze).
  - [x] **User Highlighting**: Current user's row highlighted with purple background.
  - [x] **User Inclusion**: If user not in top 10, their row shown below with "..." separator.
  - [x] **Privacy**: Email addresses masked (first 3 chars + ***).

- [x] **User Status Display**:
  - [x] **Current Position**: Shows waitlist position number.
  - [x] **Current Points**: Calculated as referrals × 30.
  - [x] **Referral Count**: Number of successful referrals.
  - [x] **Position Boost**: Total positions gained from referrals.
  - [x] **Points to Move Up**: Shows how many more points needed to advance (if applicable).

- [x] **Social Proof Counter**:
  - [x] **Display Trigger**: Shows when total waitlist count > 25.
  - [x] **Visual Elements**: 3 most recent joiners' avatars (initials) + "+X more" badge.
  - [x] **Count Display**: Large, bold number with "people have already joined" text.

### 9.4 Database Schema

- [x] **Waitlist Table** (`admin.waitlist`):
  - [x] **Core Fields**: `id`, `email`, `plan` (default: "Pro"), `createdAt`.
  - [x] **Profile Fields**: `companyName`, `companySize`, `role`, `comments` (all optional).
  - [x] **Referral Fields**:
    - [x] `referralCode` (String, unique, 8 chars): Unique code for sharing.
    - [x] `referredBy` (String, nullable): referralCode of person who referred them.
    - [x] `referralCount` (Int, default: 0): Number of successful referrals.
    - [x] `positionBoost` (Int, default: 0): Total positions gained from referrals.
  - [x] **Security Fields**: `ipAddress` (for rate limiting).
  - [x] **Indexes**: `email`, `plan`, `createdAt`, `referralCode`, `referredBy`.

### 9.5 User Flows

- [x] **New User Signup Flow**:
  1. User visits `/waitlist`.
  2. Enters email in fixed field at top.
  3. System validates email format and checks waitlist status (debounced).
  4. Email locks after validation.
  5. If not found: Form appears with email pre-filled (hidden).
  6. User completes profile (company, role, etc.).
  7. Completes Turnstile captcha.
  8. Submits form.
  9. Success message displayed.
  10. Email remains locked.

- [x] **Existing User Status Flow**:
  1. User enters email in fixed field.
  2. System checks waitlist status.
  3. Email locks after validation.
  4. Status view displays:
     - Position, points, referrals.
     - Referral link with copy button.
     - Leaderboard with user's position highlighted.
     - Points needed to move up (if applicable).

- [x] **Referral Flow**:
  1. Existing waitlist member shares referral link (`/waitlist?ref=ABC123XY`).
  2. New user clicks link.
  3. Referral code detected in URL.
  4. Banner shows "You were referred!" message.
  5. User signs up via form.
  6. System records `referredBy` field.
  7. Referee skips ahead 10 positions.
  8. Referrer's `referralCount` increments.
  9. Referrer's `positionBoost` increases by 3.
  10. Both users see updated positions.

- [x] **Email Edit Flow**:
  1. User clicks pencil icon on locked email field.
  2. Email unlocks for editing.
  3. Status cleared (allows re-check).
  4. User edits email.
  5. System re-validates and checks status.
  6. Email locks again after validation.

### 9.6 Server Actions

- [x] **`submitWaitlistForm()`**: Handles form submission with rate limiting, honeypot, Turnstile verification, duplicate checks, and referral processing.
- [x] **`getWaitlistStatus()`**: Returns user's waitlist status (position, ahead/behind counts, referral stats).
- [x] **`getWaitlistLeaderboard()`**: Returns top 10 referrers ranked by points, user's rank, and total count.
- [x] **`getWaitlistCount()`**: Returns total waitlist count and recent joiners for social proof.

### 9.7 Admin Features

- [x] **Internal Waitlist View** (`/internal/waitlist`):
  - [x] **Statistics Dashboard**: Total count, breakdown by plan (Pro, Pro Plus, Business, Enterprise).
  - [x] **Waitlist Table**: Shows all entries with email, plan, company info, referral stats, and signup date.
  - [x] **Sorting**: Sortable by date, plan, referral count.
  - [x] **Access**: Internal admin dashboard only.

### 9.8 Future Enhancements

- [ ] **Email Notifications**: Notify users when someone uses their referral link.
- [ ] **Referral Analytics**: Track referral click-through rates and conversion metrics.
- [ ] **Social Sharing**: Direct share buttons for Twitter, LinkedIn, Email.
- [ ] **Referral Milestones**: Badges and achievements for referral milestones (5, 10, 25 referrals).
- [ ] **A/B Testing**: Test different benefit structures and messaging.
- [ ] **Waitlist Management**: Admin tools to manually adjust positions, send bulk emails, export data.
