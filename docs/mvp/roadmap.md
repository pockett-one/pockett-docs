# MVP Roadmap

Use this document to track high-level milestones, due dates, and progress status. This keeps the PRD focused on *requirements* rather than *schedule*.

**Release ↔ Plan alignment:** Release 1.0 (MVP) = **Standard** plan; Release 1.5 = **Pro**; Release 2.0 = **Business**; Release 3.0 = **Enterprise**. See [PRD Subscriptions](prd-subscriptions.md) for full feature distribution.

**Standard tier marketing copy** lives in `frontend/config/pricing.ts` (plan card bullets + comparison table) and on the marketing pricing route `frontend/app/(marketing)/pricing/page.tsx`. The section below tracks **implementation** against that Standard list (not Pro/Business/Enterprise upsells).

## Standard tier vs current app

| Standard promise (pricing) | Status | Notes |
|----------------------------|--------|--------|
| Bring your own Google Drive (non-custodial) | 🟢 | Connector + project folder sync; files stay in Drive. |
| Custom branded client portal | 🟢 | Firm `logoUrl`, `themeColorHex`, `brandingSubtext` (e.g. settings + topbar). |
| Org → Client → Project hierarchy | 🟢 | Navigation and data model aligned. |
| Unlimited client workspaces / team / external collaborators | 🟢 | No per-seat billing in product logic today. |
| Google Drive–style document operations in-app | 🟢 | File browser, uploads, previews, actions via connector. |
| Persona-based access (4 roles) | 🟢 | Project Lead, Team Member, External Collaborator, Client Contact (RBAC). |
| Simple permission model (no granular file-by-file in marketing) | 🟢 | Matches current product: **file assignment to externals** is still not built (see below). |
| Document access tracking | 🟡 | Project **Audit** tab and platform audit events cover lifecycle and many document/share actions; `DOCUMENT_ACCESS_LOG_ENTRY` exists in the schema enum but is **not** emitted—there is no dedicated “who opened this file when” access log matching the marketing line end-to-end. |
| In-document comments & feedback | 🟡 | **Doc comments** API + UI (`doc_comment_messages`) with reactions; **chronological stream, not threaded** replies. |
| One-click project closure | 🟢 | Close project: revokes guests / Drive access, view-only; reopen + soft delete as documented below. |
| Active project cap (e.g. 10 on Standard) | 🔴 | **Not enforced** while billing gates are off; no tier-based project counting in create flow. |
| Version history retention (e.g. 90 days Standard per comparison table) | 🔴 | **Not implemented** as a tiered retention policy in the app (Drive holds native history; product does not enforce 90-day UI/policy). |

### Billing & Polar.sh (Standard checkout)

**🔴 Polar.sh integration is completely pending:** no checkout flow, no customer portal links, no `POST /api/webhooks/polar` (or equivalent) handler, and no subscription lifecycle sync from Polar into `Firm` (`polarCustomerId` / `polarSubscriptionId` / `subscriptionPlan` exist in schema but are unused). `checkFeatureAccess` in `frontend/lib/billing/subscription-gate.ts` remains permissive unless `ENFORCE_BILLING_GATES=true`, with feature-to-tier mapping still a placeholder.

## Status Key
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Completed

## Release ↔ Subscription Plan Mapping

| Release | Plan | Projects Included | Target |
|---------|------|-------------------|--------|
| **1.0 (MVP)** | Standard | 10 | Small firms, solo consultants |
| **1.5** | Pro | 25 | Growing firms, advanced review & templates |
| **2.0** | Business | 50 | Established firms, automation |
| **3.0** | Enterprise | 100 (custom available) | Large orgs, compliance & security |

## HIGH PRIORITY FEATURES

### Pricing & Packaging 🔴 **HIGH PRIORITY**
- [x] **Define pricing tiers**: Standard ($49/month), Pro ($99/month), Business ($149/month), Enterprise (Contact Us).
- [ ] 🟡 **Feature flagging by tier**: Tier definitions and comparison live in `frontend/config/pricing.ts`; **runtime gates are not wired**—`subscription-gate.ts` allows all features unless `ENFORCE_BILLING_GATES=true`, and there is no per-feature Standard/Pro/Business map yet.
- [x] **Standard plan value proposition** (product shape): BYO Google Drive, non-custodial; portal + personas; comments and partial audit. **Gaps vs copy:** full “who viewed what” access log, threaded comments, and enforced project limits (see Standard table above).
- [ ] Pre-configured scheduling, reminders, and email notifications to external members *(Business)*
- [ ] Critical project activity auditing *(Enterprise)*
- [ ] Recover from recycle bin + alerts on upcoming recycle bin purges *(Enterprise)*
- [ ] Project due date reminders *(Business)*
- [ ] Document templates *(Pro)*
- [ ] Custom trigger creation for scheduling *(Enterprise)*
- [ ] Document lock on approval and versioning *(Pro)*
- [ ] Download historical versions *(Pro)*
- [ ] Watermarking, disallow download/print, IP theft protection, export to PDF for client contacts *(Pro / Enterprise)*
- [ ] Create project but delay kickoff; schedule future team memberships *(Enterprise)*
- [ ] Weekly project schedule status to org owners and project leads *(Business)*
- [ ] Auto-permit / deliver documents on onboarding to external members *(Business)*
- [ ] Folder badge for pending actions from external members *(Business)*
- [ ] **Payment gateway — Polar.sh** 🔴: **Not started.** Planned provider per HLD (`polar.sh`): checkout, subscriptions, webhooks → firm subscription fields. Replaces generic “consider alternatives” until Polar is integrated.
- [ ] 🟡 **Tiered capacity**: **Documented** in pricing (Standard 10 → Enterprise 100); **not enforced** in app until billing + limits are implemented. Unlimited members; no add-on project packs.
- [ ] **Pricing (monthly, validated)**:
- [ ] Standard: $49/month, 10 active projects
- [ ] Pro: $99/month, 25 active projects
- [ ] Business: $149/month, 50 active projects
- [ ] Enterprise: Contact Us, 100 active projects (custom capacity)

### Project Folder Structure: General & Confidential Folders 🟢 **COMPLETED**
- [x] **Dual-Folder Structure**: Under each project folder, automatically create two subfolders:
  - [x] **`general` folder**: Project Lead and Team Member have default access; external personas follow the current sharing model (project-level / share flows—**per-file assignment** is still a roadmap item below).
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

### Document Review & Collaboration 🔴 **HIGH PRIORITY**
- [ ] 🟡 **Review System** *(Standard)*: **Doc comments** (append-only messages + reactions) shipped; **threaded** discussions / reply-to not implemented.
- [ ] **Approve/Finalize/Publish Workflow** *(Pro)*: Allow guests (External Collaborator, Client Contact) to approve, finalize, or publish documents.
- [ ] **Publish/Finalize to Lock & Version** *(Pro)*: When a document is published/finalized, lock it and create a version snapshot.
- [ ] **Export to PDF** *(Standard marketing / comparison nuance)*: Pricing table ties “Download historical versions” to Pro+; **one-click export-to-PDF for clients** as a Standard deliverable is still **not** implemented (Drive-native export may exist outside the portal story).
- [ ] **Watermark Branding** *(Pro)*: Add watermarking with organization branding to exported PDFs.
- [ ] **Review status & activity tracking** *(Pro)*: Comprehensive tracking of review status, comments, approvals, and version history (e.g. Track tab).

### Project Templates & Duplication 🔴 **HIGH PRIORITY** *(Pro)*
- [ ] **Template Projects**: Define template projects with pre-defined folder structures and template documents. Provide ready-made templates for targeted Lines of Business (LOBs).
- [ ] **Template Selection**: Allow users to choose a template project when starting a new project to begin with reusable assets.
- [ ] **Duplicate Project**: Enable duplication of existing projects with all folder structures, documents, and configurations.

### Document Relationships & Dependencies 🔴 **HIGH PRIORITY** *(Business)*
- [ ] **Related/Dependent Documents**: Support commitment-based or linked access between documents, not just folder-level access.
- [ ] **Relationship Management**: Add relationship tracking amongst folders or files (e.g., parent-child, dependencies, references).
- [ ] **Relationship Tree View**: Display relationship tree visualization showing document dependencies and connections (project task-like structure).

### Client Communication & Follow-ups 🔴 **HIGH PRIORITY** *(Business)*
- [ ] **Automated Consolidated Follow-ups**: Send automated consolidated client follow-up emails on all pending documents.
- [ ] **Custom Follow-up Messages**: Allow customization of follow-up message templates and scheduling.
- [ ] **Calendar Integration**: Block calendar through Calendly (or similar) for document discussion scheduling.
- [ ] **Bi-directional Calendar Requests**: Enable both Team → Client and Client → Team calendar request flows for document discussions.

### PII & Business Data Encryption 🔴 **HIGH PRIORITY** *(Enterprise)*
- [x] **Connector token encryption**: `portal.connectors.accessToken` and `refreshToken` encrypted at rest with AES-256-GCM via `lib/encryption.ts` and Prisma client extension; keys from env (`ENCRYPTION_KEY_V1`, `ENCRYPTION_KEY_V2`, …); `CURRENT_KEY_VERSION` for new encryptions; lazy re-encryption on access for key rotation.
- [x] **Encryption utility**: `lib/encryption.ts` with `encrypt`/`decrypt`, key versioning (`ENCRYPTION_KEY_Vx`), and ciphertext format `v{n}$base64(iv+ciphertext+authTag)`.
- [x] **Prisma integration (connectors)**: Extended Prisma client encrypts on create/update and decrypts on read for connector token fields; re-encryption handled in Google Drive connector on access when key version is outdated.
- [ ] **Field-level encryption (other PII)**: Encrypt Organization Name, Client Name, Project Name, invitee emails at rest using same or extended encryption layer.
- [ ] **Data migration**: One-time migration script to encrypt existing plaintext PII values (for fields added to encryption scope).
- [ ] **Search support**: Add deterministic HMAC hash columns for exact-match search on encrypted fields (e.g., organization name lookup).
- [ ] **External KMS integration** *(Enterprise)*: Support AWS KMS, Google Cloud KMS, or HashiCorp Vault for enterprise key management (optional; env-based keys acceptable for MVP).
- [ ] **Audit logging for PII access**: Log access to PII fields for compliance audit trail.

### UI Enhancements 🔴 **HIGH PRIORITY**
- [ ] **Project cover images** *(Pro)*: Set a cover image per project for quick visual identification in the dashboard.

## MEDIUM PRIORITY (Good to Have)

### Test Project for Free Tier (Acme Corp) 🟡 **MEDIUM**
- [ ] **Demo org for registered free tier users**: Allow free tier users to view a pre-built "Acme Corp" test project as **org_admin** persona so they can explore the product without creating their own data.
- [ ] **Real implementation**: Treat like a real org/client/project — full DB records (organization, client, projects) and sample files in the user's connected Google Drive (or a shared demo Drive).
- [ ] **Acme Corp content**:
  - **Q3 2025 Website Launch** — sample project
  - **Q4 2025 App Platform Impl User Registration** — sample project
- [ ] **Access**: Only visible/accessible to free tier; no impact on paid orgs. Clear labeling as "Demo" or "Test Project" in the UI.

### Onboarding Import from Existing Drive Structure 🟡 **MEDIUM**
- [ ] **Detect existing .pockett hierarchy**: During onboarding (or first Drive link), if the user's Drive already has a folder structure that **strictly** aligns with:
  - `<root>/.pockett/Organization/Client/Project(s)/general/` (and optional files/subfolders under `general/`)
- [ ] **Import and assign roles**: If the strict hierarchy exists, **import** it (create org, client(s), project(s) in DB; link to existing Drive folders) and make the **onboarding user** the **Client Admin** and **Project Admin** for the imported entities.
- [ ] **No match → do nothing**: If the strict hierarchy does not exist (e.g. different depth, missing `.pockett`, or inconsistent naming), do **not** create or modify anything; proceed with normal onboarding only.
- [ ] **Documentation**: Document the exact path convention and validation rules so users can pre-create structure in Drive if they prefer.

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

## Schedule & Reminders
- Self task reminders on a doc
- Invite member - but delay start date
- Set assignment with reminder - set interval and number - auto notify on email
- Assign/ permit file or folder to external members within start date and end date - time bomb

---

**Reference:** Release-to-plan alignment and full feature distribution are in [prd-subscriptions.md](prd-subscriptions.md). Pricing config: `frontend/config/pricing.ts`.
