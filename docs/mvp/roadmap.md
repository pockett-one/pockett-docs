# MVP Roadmap

Use this document to track high-level milestones, due dates, and progress status. This keeps the PRD focused on *requirements* rather than *schedule*.

## Status Key
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Completed

## 🚨 HIGH PRIORITY FEATURES

### Pricing & Packaging 🔴 **HIGH PRIORITY**
- [ ] **Define pricing tiers**: Pro and Enterprise.
- [ ] **Feature flagging by tier**: Gate enterprise-only capabilities behind pricing tier.
- [ ] Pre-configured scheduling, reminders, and email notifications to external members
- [ ] Critical project activity auditing
- [ ] Recover from recycle bin + alerts on upcoming recycle bin purges
- [ ] Project due date reminders
- [ ] Document templates
- [ ] Custom trigger creation for scheduling
- [ ] Document lock on approval and versioning
- [ ] Download historical versions
- [ ] Watermarking, disallow download/print, IP theft protection, export to PDF for client contacts
- [ ] Create project but delay kickoff; schedule future team memberships
- [ ] Weekly project schedule status to org owners and project leads
- [ ] Auto-permit / deliver documents on onboarding to external members
- [ ] Folder badge for pending actions from external members
- [ ] **Payment gateway requirement**: Indian founder setup with trusted global checkout for US/EU/SG/AU customers; tax-friendly invoicing; Stripe is invite-only in India (consider alternatives).
- [ ] **Capacity-based pricing**: 10 active projects included in both Pro and Enterprise; unlimited members; add 10-project packs as needed.
- [ ] **Draft pricing suggestion (monthly, to validate)**:
- [ ] Pro: $99/month for 10 active projects; add 10-project pack for $49/month
- [ ] Enterprise: $299/month for 10 active projects + enterprise features; add 10-project pack for $99/month

### Project Folder Structure: General & Confidential Folders 🟢 **COMPLETED**
- [x] **Dual-Folder Structure**: Under each project folder, automatically create two subfolders:
  - [x] **`general` folder**: Maintains current access control design - accessible to Project Lead and Team Member by default, with External Collaborator and Client Contact getting access when files are explicitly assigned.
  - [x] **`confidential` folder**: Restricted exclusively to Project Lead persona only. Cannot be granted access to any other role under any circumstances.
- [x] **Automatic Creation**: Both folders created automatically when a project is created and linked to Google Drive.
- [x] **Permission Enforcement**: 
  - [x] `general` folder inherits project-level permissions (Project Lead & Team Member get `writer` access automatically).
  - [x] `confidential` folder permissions are restricted to Project Lead only - system prevents granting access to any other persona.
- [x] **UI Integration**: File browser starts at `general` folder by default, with breadcrumb navigation showing org > client > project > general/confidential. Project Lead can switch between general and confidential folders.

### Project Settings & Lifecycle 🟢 **COMPLETED**
- [x] **Creator as Project Lead**: On project creation, the creator is automatically added as a Project Lead member so they see files from the start.
- [x] **Settings (Project Lead only)**: Prominent settings icon beside project name; visible only to Project Lead (in-code role config; will later move to permissions/personas table).
- [x] **Settings modal**: Project Properties (Name, Description, Save); disabled when project is closed.
- [x] **Close project**: Amber button; sets `isClosed: true`; project becomes view-only; removes org guests from project and revokes their Drive access.
- [x] **Reopen project**: Amber button when closed; sets `isClosed: false`.
- [x] **Delete project**: Red button; soft delete (`isDeleted: true`); removes all members; revokes all Drive permissions on project folder (folder not deleted in Drive); deleted projects excluded from hierarchy.

### File Assignment to External Members 🔴 **HIGH PRIORITY**
- [ ] **File Assignment UI**: Add ability for Project Leads to assign individual files/folders from the `general` folder to External Collaborator and Client Contact personas. This enables granular file-level sharing beyond project-level access.
- [ ] **Assignment Modal**: When Project Lead selects a file/folder, show "Assign to Members" option that lists External Collaborator and Client Contact members. Allow multi-select assignment.
- [ ] **Google Drive Permission Grant**: When a file is assigned to an external member, automatically grant appropriate Google Drive permissions (`reader` for Client Contact, `writer` for External Collaborator) to that specific file/folder.
- [ ] **Assignment Tracking**: Track file assignments in database (new `FileAssignment` table or extend existing models) to show which files are assigned to which external members.
- [ ] **Assignment Indicators**: Show visual indicators in file browser (badge/icon) for files that have been assigned to external members.
- [ ] **Revoke Assignment**: Allow Project Lead to revoke file assignments, which removes Google Drive permissions for that file/folder.

### Folder Hierarchy Organization Recommendations 🔴 **HIGH PRIORITY**
- [ ] **Best Practices Guidance**: Provide UI guidance and recommendations for maintaining shallow folder hierarchies (max 2-3 levels deep) to improve document organization and system performance.
- [ ] **Depth Indicators**: Show visual indicators (badges/tips) when folder depth exceeds recommended levels (e.g., > 2 levels).
- [ ] **Organization Health Score**: Track and display average folder depth per project as an "organization health" metric.
- [ ] **Folder Creation Warnings**: When creating nested folders, warn users if depth exceeds recommended levels and suggest alternative flat structures.
- [ ] **Documentation**: Add best practices documentation recommending structures like `general/[category]/[files]` (max 2 levels) with before/after examples.
- [ ] **Performance Benefits**: Shallow hierarchies reduce API calls and improve permission checking performance, benefiting both user experience and system scalability.

## 📅 Milestones

### Phase 1: Onboarding & Org Structure (Target: [Date])
- [x] **Authentication Flow** (Google Sign-in)
- [x] **Workspace Creation** (Org Provisioning)
- [x] **Dashboard Redirect Logic**

### Phase 2: Client & Project Management (Target: [Date])
- [x] **Client CRUD** Ops
- [x] **Project Creation** + Google Drive Folder Sync
- [x] **Sidebar Navigation** (Clients -> Projects)

### Phase 3: Drive Integration & File UI (Target: [Date])
- [x] **File Browser** (Headless Drive UI)
- [x] **Direct Uploads** (Browser -> Drive)
- [x] **Conflict Resolution** (Uploads)
- [ ] **Folder Hierarchy Recommendations** – UI guidance and best practices for maintaining shallow folder structures to improve organization and performance

### Phase 4: Access Control & Invitations (Target: [Date])
- [x] **Personas & RBAC** (Data Model & Seeding)
- [x] **Invitation Flow** (Invite -> Accept -> Join)
- [x] **Member Management** (List & Add)
- [x] **Project creator as Project Lead** – On project creation, the creator is automatically added as a Project Lead member so they see files from the start; persona-based file visibility unchanged.
- [x] **Project settings & lifecycle** – Settings icon (Project Lead only, in-code role config); modal: Project Properties (Name, Description, Save; disabled when closed), Close project (amber; removes org guests + revokes Drive), Reopen project (amber when closed), Delete project (red; soft delete, remove all members, revoke all Drive permissions on folder; folder not deleted in Drive). `Project.isClosed` and `Project.isDeleted` flags; deleted projects excluded from hierarchy.
- [ ] **Persona Renaming** 🟡 **LOW PRIORITY** – Allow Project Leads to rename default persona names per project (e.g., rename "Team Member" to "Accountant" or "External Collaborator" to "Contractor"). This provides basic customization without the complexity of creating new personas or changing permissions. UI: Edit button next to persona name in Project > Members screen. Max implementation: Simple rename field, no permission changes, no new persona creation.

### Phase 5: Project Types & Templates (Target: [Date])
- [x] **Landing Page: Project Types Section** – Added "Use Cases / Project Types" section showcasing 6 project types (Engagement, Case, Audit, Consultation, Project, Retainer) with "Coming Soon" badge and benefits footer
- [ ] **Project Type Selection** – Add project type field to Project model (Engagement, Case, Audit, Consultation, Project, Retainer)
- [ ] **Project Type UI** – Update project creation flow to include type selection
- [ ] **Templated Files** – Add "+ Add" menu option to create templated files based on project type (e.g., Engagement templates for bookkeeping, Case templates for legal matters)
- [ ] **Type-based Filtering** – Filter and report projects by type
- [ ] **Type-based Metrics** – Track metrics grouped by project type

### Phase 6: Launch Prep (Target: [Date])
- [ ] **QA & Bug Bash**
- [ ] **Production Deployment**
- [ ] **Dev: Sentry Spotlight** – [Sentry for Development](https://github.com/getsentry/spotlight): real-time errors, traces, logs in dev (CLI / Electron); optional MCP for AI-assisted debugging.