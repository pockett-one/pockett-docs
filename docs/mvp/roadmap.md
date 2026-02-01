# MVP Roadmap

Use this document to track high-level milestones, due dates, and progress status. This keeps the PRD focused on *requirements* rather than *schedule*.

## Status Key
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Completed

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

### Phase 4: Access Control & Invitations (Target: [Date])
- [x] **Personas & RBAC** (Data Model & Seeding)
- [x] **Invitation Flow** (Invite -> Accept -> Join)
- [x] **Member Management** (List & Add)
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