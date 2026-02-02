# MVP Roadmap

Use this document to track high-level milestones, due dates, and progress status. This keeps the PRD focused on *requirements* rather than *schedule*.

## Status Key
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Completed

## 🚨 HIGH PRIORITY FEATURES

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
- [ ] **Custom Personas Management** 🔴 **HIGH PRIORITY** – Allow organizations to edit default persona names and create custom personas per project. Add UI in Project > Members screen to rename personas and add new custom personas with configurable permissions (`can_view`, `can_edit`, `can_manage`, `can_comment`). This enables flexible role customization for different project types and organizational needs.

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