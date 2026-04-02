# Pockett Docs — SaaS Architecture Overview

> **Document Purpose:** A detailed reference describing the main architectural components of the Pockett Docs SaaS platform — frontend, backend, database, and deployment — along with key integrations, design patterns, and system decisions.

---

## Table of Contents

1. [Tech Stack at a Glance](#1-tech-stack-at-a-glance)
2. [Frontend](#2-frontend)
3. [Backend — API Layer](#3-backend--api-layer)
4. [Database](#4-database)
5. [Deployment](#5-deployment)
6. [Key Integrations](#6-key-integrations)
7. [Connectors / Adapters Pattern](#7-connectors--adapters-pattern)
8. [Permissions & Auth System](#8-permissions--auth-system)
9. [Notable Design Decisions](#9-notable-design-decisions)

---

## 1. Tech Stack at a Glance

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, `--webpack` flag) |
| Language | TypeScript 5 |
| Runtime | Node.js ≥ 24 |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 6 (multi-schema) |
| Auth | Supabase Auth (Google OAuth only) |
| UI | Tailwind CSS 3 + Radix UI + shadcn/ui primitives |
| Background jobs | Inngest |
| Monitoring | Sentry |
| Deployment | Vercel |

---

## 2. Frontend

### Framework & Build

The app uses **Next.js 16 App Router** with the legacy webpack bundler (`--webpack`). This was a deliberate workaround for a Next.js 16/Turbopack PostCSS incompatibility. The effective build command is:

```bash
prisma generate && NEXT_PUBLIC_BUILD_TIMESTAMP=$(date +%s) next build --webpack
```

The `postbuild` hook runs `prisma migrate deploy`, applying pending DB migrations automatically on every Vercel deployment.

### Route Architecture

Routes fall into three zones:

#### Public / Marketing
| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/signin`, `/signup` | Auth pages |
| `/pricing`, `/waitlist`, `/faq`, `/contact` | Marketing |
| `/blog/[category]/[slug]` | Blog (MDX) |
| `/resources/docs/**` | User-facing documentation |
| `/solutions/**` | **301 → `/`** (legacy); audience & use-case content lives on `/` (`#target-audience` and in-page anchors) |
| `/terms`, `/privacy`, `/trust-center` | Legal / trust |

#### Application (`/d/**` — authenticated dashboard)

The `/d` prefix namespace isolates the authenticated app. URL hierarchy mirrors the data model exactly:

```
/d                                                       → Dashboard root (org selection)
/d/onboarding                                            → Onboarding wizard
/d/o/[slug]                                              → Organization dashboard
/d/o/[slug]/connectors                                   → Google Drive connector setup
/d/o/[slug]/insights                                     → Org-level insights
/d/o/[slug]/c                                            → Clients list
/d/o/[slug]/c/[clientSlug]                               → Client project list
/d/o/[slug]/c/[clientSlug]/p/[projectSlug]/[[...rest]]   → Project view (files, members, shares, insights, sources, settings)
```

#### Internal / Admin (`/internal/**`)
| Route | Purpose |
|---|---|
| `/internal/customer-success` | Customer success dashboard |
| `/internal/waitlist` | Waitlist management |
| `/internal/links` | Link management |

### Component Architecture

Components are organized by domain in `frontend/components/`:

| Folder | Responsibility |
|---|---|
| `app/` | `AppSidebar` — main collapsible navigation |
| `projects/` | Org selector, client/project views, member tabs, share dialogs |
| `onboarding/` | Multi-step onboarding form and sidebar |
| `dashboard/` | Insight cards, file review modals, storage charts |
| `google-drive/` | Drive picker, Drive manager UI |
| `files/` | Document header, version history, edit sheet |
| `ui/` | Design system atoms — shadcn/ui pattern (Button, Dialog, Select, Tabs, Avatar, Tooltip, etc.) |
| `landing/`, `blog/`, `legal/`, `docs/` | Content-focused components |

### UI Library & Dependencies

| Library | Role |
|---|---|
| Radix UI | Accessible primitives (Dialog, DropdownMenu, Select, Tabs, Tooltip, Avatar, etc.) |
| Tailwind CSS 3 | Utility-first styling with tailwind-animate, tailwind-merge, tailwind-scrollbar |
| Framer Motion | Animations |
| Lucide React | Icons |
| Recharts | Data visualizations |
| @dnd-kit | Drag-and-drop |
| @xenova/transformers | Client-side ML (embedding generation) |

### Client-Side State (React Context)

| Context | Provides |
|---|---|
| `AuthContext` | Supabase session + user, `signInWithGoogle`, `signOut` |
| `SidebarContext` | Sidebar collapsed/expanded state |
| `SidebarOrganizationsContext` | Pre-loaded org list passed from server layout |
| `ViewAsContext` | "View As Persona" feature — lets admins preview other roles |

---

## 3. Backend — API Layer

All API logic is implemented as **Next.js Route Handlers** in `frontend/app/api/`. There are ~52 route files, grouped by domain:

### Onboarding (`/api/onboarding/`)

Manages the multi-step flow for new organizations:

| Endpoint | Purpose |
|---|---|
| `detect-orgs` | Detects existing Pockett structures in connected Drive |
| `create-org` | Creates org in DB + Drive folder structure + sets JWT metadata |
| `create-client` | Creates a client within an org |
| `create-project` | Creates a project within a client |
| `ensure-org` | Idempotent org creation / location |
| `import-orgs` | Scans Drive and imports existing Pockett folder structure |
| `test-org` | Creates a sandbox / demo org |

### Connectors (`/api/connectors/`)

| Endpoint | Purpose |
|---|---|
| `connectors/route.ts` | List user's connectors |
| `connectors/google-drive/route.ts` | Connect / read Google Drive |
| `connectors/google-drive/callback` | OAuth callback |
| `connectors/google-drive/token` | Token refresh |
| `connectors/google-drive/import` | Import Drive folder structure |
| `connectors/google-drive/linked-files` | List files linked to a project |
| `connectors/google-drive/upload` | Upload file to Drive |
| `connectors/google-drive/test` | Test Drive connection health |

### Projects & Documents (`/api/projects/[projectId]/`)

| Endpoint | Purpose |
|---|---|
| `documents/[documentId]/sharing/route.ts` | Document-level sharing CRUD |
| `documents/[documentId]/sharing/finalize` | Finalize share workflow |
| `documents/[documentId]/sharing/regrant` | Re-grant Drive permissions |
| `documents/[documentId]/sharing/activity` | Share audit log |
| `index-project` | Trigger full project search indexing |
| `index-file` | Index individual file for search |
| `search` | Full-text + vector search within project |
| `shares/route.ts` | Project shares CRUD |
| `shares/order` | Reorder shares |
| `resolve-path` | Resolve slug path → IDs |

### Permissions (`/api/permissions/`)

| Endpoint | Purpose |
|---|---|
| `organization` | Check org-level permissions |
| `project` | Check project-level permissions |
| `project-tabs` | Which project tabs (Members, Shares, Insights) the user can see |
| `can-use-view-as` | Whether the user can use the "View As" feature |
| `rbac/effective-permissions` | Full effective permission set for a user |

### Other Notable Routes

| Endpoint | Purpose |
|---|---|
| `provision` | User provisioning on first sign-in |
| `inngest` | Inngest webhook handler (background jobs) |
| `organization-storage` | Storage quota management |
| `proxy/thumbnail/[externalId]` | Drive thumbnail proxying |
| `invite/[token]` | Invitation acceptance |
| `demo/documents/**` | Unauthenticated demo endpoints (stream, search, folder) |

---

## 4. Database

The database is **PostgreSQL** hosted on **Supabase**, accessed via **Prisma 6** with the `multiSchema` preview feature. Three schemas are in use.

### Schema: `platform` — Core Application Data

```
Connector ──1:N── Organization ──1:N── Client ──1:N── Project
                      │                                   │
                  OrgMember                         ProjectFile
                  OrgInvitation                     ProjectMember
                                                    ProjectInvitation
                                                    FilePersonaGrant
                                                    ProjectDocumentSearchIndex
                                                    ProjectDocumentSharing
                                                    ProjectDocumentSharingUser
```

#### Key Models

| Model | Description |
|---|---|
| `Connector` | OAuth connection per user+type. Stores encrypted `accessToken`/`refreshToken`, `status`, and `settings` JSON (Drive folder ID map). Unique on `(type, userId)`. |
| `Organization` | Top-level tenant. Has `slug`, `orgFolderId` (Drive folder), branding fields (`logoUrl`, `themeColorHex`), subscription fields (`stripeCustomerId`, `subscriptionStatus`), domain access controls. |
| `Client` | A client/customer within an org. Has `driveFolderId`, `slug` (unique within org). |
| `Project` | A project within a client. Has `connectorRootFolderId` (Drive folder), `isClosed`, `isDeleted`, `sandboxOnly`. |
| `Persona` | Seeded role definition records (`org_owner`, `org_member`, `project_admin`, `project_editor`, `project_viewer`, `sys_admin`). |
| `OrgMember` / `ClientMember` / `ProjectMember` | Junction tables: `userId` (Supabase UUID) → entity → `Persona`. Support `isDefault` on OrgMember. |
| `OrgInvitation` / `ProjectInvitation` | Token-based invitations with `status` (PENDING / ACCEPTED / JOINED / EXPIRED) and expiry. |
| `ProjectFile` | Mirrors Drive files/folders for fast lookup. Stores `externalFileId` (Drive ID), `type` (`folder` | `document`), `parentId` (self-referential). |
| `FilePersonaGrant` | Per-file permission grants scoped to a persona within a project. Powers fine-grained file visibility. |
| `ProjectDocumentSearchIndex` | Full-text + vector search index. Has `content`, `embedding` (pgvector `vector` type), `mimeType`, `fileSize`, `metadata` JSON. |
| `ProjectDocumentSharing` | A named shareable link (unique `slug`) for a document or folder. |
| `ProjectDocumentSharingUser` | Tracks per-user share grants, including `googlePermissionId` for Drive-level permission management. |
| `CustomerRequest` | Bug/request/enquiry tickets with `TicketType` and `TicketStatus` enums. |
| `PlatformConfig` | Key/value store for platform-wide configuration. |

### Schema: `system` — System / Admin Data

| Model | Description |
|---|---|
| `SystemAdmin` | Admin user records |
| `ContactSubmission` | Contact form submissions |
| `Waitlist` | Waitlist entries with referral system (codes, counts, position boost) |

### Transparent Encryption (Prisma Extension)

`frontend/lib/prisma.ts` defines a Prisma client with `$allModels.$allOperations` hooks that automatically encrypt/decrypt specified fields on write and read respectively. Callsites always deal in plaintext — the ORM layer handles crypto transparently.

**Encrypted fields:**
- `Organization.name`, `Client.name`, `Project.name`, `ProjectFile.name`
- `Connector.accessToken`, `Connector.refreshToken`

### Connection Strategy (Supavisor)

| URL | Port | Mode | Used For |
|---|---|---|---|
| `DATABASE_URL` | **6543** | Transaction Pooler | Application runtime queries |
| `DIRECT_URL` | **5432** | Session Mode | `prisma migrate deploy` during build |

> **Error "Tenant not found"** always means the user format is missing the project ref (must be `postgres.[project-ref]`).

### Vector Search

The `ProjectDocumentSearchIndex.embedding` field uses PostgreSQL's `vector` type via `Unsupported("vector")` in Prisma. A dedicated index (`pdsi_embedding_idx_v2`) enables similarity search. `@xenova/transformers` can generate embeddings client-side.

---

## 5. Deployment

### Vercel

| Setting | Value |
|---|---|
| **Build Command** | `npm run build` |
| **Node.js** | ≥ 24.0.0 |
| **Framework Preset** | Next.js |

The `npm run build` script is critical — it triggers the `postbuild` hook that runs `prisma migrate deploy` after the Next.js build completes, applying pending migrations automatically.

### Key npm Scripts

| Script | Command |
|---|---|
| `dev` | `next dev --webpack` (with `DEV_SERVER_START_VERSION` timestamp) |
| `build` | `prisma generate && next build --webpack` |
| `postbuild` | `prisma migrate deploy` |
| `db:migrate` | `prisma migrate dev` (local dev only — **never run on production**) |
| `inngest:dev` | `inngest-cli dev` (local background job runner) |
| `test` | `vitest run` |

### Migration Workflow

```
1. Edit frontend/prisma/schema.prisma
2. Run: npx prisma migrate dev --name <change_name>   ← creates migration SQL
3. Commit: prisma/migrations/<timestamp>_<name>/migration.sql
4. Deploy → Vercel postbuild runs: prisma migrate deploy
```

> **NEVER run `prisma db push`** — it resets production drift and can cause data loss.

---

## 6. Key Integrations

### Supabase Auth

- Authentication is **Google OAuth only** via `@supabase/supabase-js`
- `AuthContext` wraps `onAuthStateChange` for reactive session state
- `/app/auth/callback/route.ts` handles the OAuth redirect
- **JWT metadata injection**: After org creation, `app_metadata.active_org_id` and `app_metadata.active_persona` are written via the Supabase Admin API. These are readable in subsequent JWT claims for fast, DB-free permission checks.
- **Admin client** (`utils/supabase/admin.ts`) uses `SUPABASE_SERVICE_ROLE_KEY` for privileged server-side operations
- **RLS enforcement**: PostgreSQL Row Level Security is fully enabled on all `platform.*` tables. The `getPrismaWithRls` function injects the decoded JWT into the Postgres session via `set_config('request.jwt.claims', ...)`, and `CREATE POLICY` rules on each table read `current_setting('request.jwt.claims')` to enforce tenant isolation at the database layer. This means even a compromised application layer cannot return rows belonging to another tenant — the database itself enforces the boundary.

### Google Drive

- `google-drive-connector.ts` wraps the Drive v3 REST API (OAuth token storage/refresh, file listing, metadata, thumbnail proxying)
- `GoogleDriveAdapter` in `lib/connectors/adapters/google-drive-adapter.ts` implements `IConnectorStorageAdapter` for storage-agnostic use
- `react-google-drive-picker` handles the client-side Google Picker UI

### Inngest — Background Jobs

Inngest provides durable, retryable background function execution. Webhook at `/api/inngest`.

| Function | Event Trigger | Purpose |
|---|---|---|
| `index-file-for-search` | `file.index.requested` | Index a single Drive file into search index |
| `index-batch-for-search` | `file.index.batch.requested` | Batch index (10 files at a time) |
| `scan-and-index-project` | `project.index.scan.requested` | Walk Drive folder tree, index all files |
| `revoke-project-sharing` | sharing events | Revoke Drive + DB sharing permissions |
| `revoke-by-disabled-persona` | persona events | Auto-revoke when persona is disabled |
| `revoke-by-member-persona-change` | member events | Auto-revoke when member role changes |
| `grant-permissions-for-new-member` | member events | Auto-grant Drive permissions on invite accept |

Events are fired via `safeInngestSend`, which swallows errors so background job failures never surface to users.

### Sentry

`@sentry/nextjs` is installed for error monitoring. A `SentryTestButton` component exists in the internal customer success page for error capture verification.

### Nodemailer

Available for transactional email (invitations, notifications).

---

## 7. Connectors / Adapters Pattern

The connector system is designed to be **storage-agnostic and extensible**. The DB schema pre-defines `ConnectorType` enums for 8 services — Google Drive, Dropbox, OneDrive, Box, Notion, Confluence, Google Calendar, Google Tasks — though only Google Drive is currently implemented.

### The Interface (`lib/connectors/types.ts`)

```typescript
interface IConnectorStorageAdapter {
  listFolderChildren(connectionId, folderId): Promise<{id, name}[]>
  readFileContent(connectionId, fileId): Promise<string | null>
  writeFile(connectionId, parentFolderId, fileName, content, mimeType?): Promise<void>
  createFolder(connectionId, parentFolderId, name): Promise<string>
  findOrCreateFolder(connectionId, parentFolderId, name): Promise<string>
  getFileParent(connectionId, fileId): Promise<string | null>
  getFolderName(connectionId, fileId): Promise<string | null>
  fileExists(connectionId, fileId): Promise<boolean>
  search(connectionId, query): Promise<{id, name}[]>
  restrictFolderToOwnerOnly?(connectionId, folderId): Promise<void>  // optional
}
```

### The Pockett Structure Service

`lib/connectors/pockett-structure.service.ts` is storage-agnostic business logic for managing the Pockett folder structure in any connected drive. Key operations:

| Method | Purpose |
|---|---|
| `detectExistingStructure` | Detects a `.pockett/meta.json` root marker |
| `setupOrgFolder` | Creates the initial org folder structure with `.pockett` metadata files |
| `importStructureFromDrive` | Scans an existing Pockett folder tree and creates missing DB records |
| `ensureAppFolderStructure` | Idempotently ensures the full hierarchy exists |

### Drive Folder Structure

```
[User's selected root folder]/
├── .pockett/
│   └── meta.json               { type: "root", version: 1 }
└── [Org Name]/
    ├── .pockett/meta.json      { type: "organization", slug, isDefault }
    └── [Client Name]/
        ├── .pockett/meta.json  { type: "client", slug }
        └── [Project Name]/
            ├── .pockett/meta.json   { type: "project", slug }
            ├── General/
            ├── Confidential/        (owner-only restricted)
            └── Staging/             (owner-only restricted)
```

Name collision handling: if the org name already exists as a folder, the slug is used as fallback. A collision audit trail is stored in `meta.json` (`originalName`, `folderName`, `collision: true`).

---

## 8. Permissions & Auth System

The RBAC system uses a **three-tier architecture**: database-level Row Level Security as the foundational enforcement layer, a fast in-memory cache for application-layer checks, and JWT claims as the stateless fast path.

### Personas (Roles)

Personas are seeded DB records (not hardcoded enums), mapped to capabilities in `lib/permissions/persona-map.ts`:

| Persona | org:can_manage | client:can_manage | project:can_view | project:can_view_internal | project:can_manage |
|---|---|---|---|---|---|
| `org_owner` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `org_member` | ✗ | ✗ | ✓ | ✓ | ✗ |
| `project_admin` | ✗ | ✗ | ✓ | ✓ | ✓ |
| `project_editor` | ✗ | ✗ | ✓ | ✓ | ✗ |
| `project_viewer` | ✗ | ✗ | ✓ | ✗ | ✗ |
| `sys_admin` | ✗ | ✗ | ✓ | ✓ | ✓ |

### UserSettingsPlus Cache

`lib/user-settings-plus.ts` implements a **30-minute in-memory cache per `userId`**. On cache miss, it computes the full permission tree from DB in a single pass (org → client → project memberships), using `getCapabilitiesForPersona` to resolve capabilities from persona slugs.

The result is a hierarchical `UserPermissions` object:

```
UserPermissions
└── organizations[]
    ├── id, role, personas[], scopes{}, isDefault
    └── clients[]
        ├── id, scopes{}
        └── projects[]
            └── id, persona, scopes{}
```

Cache is invalidated via `userSettingsPlus.invalidateUser(userId)` after mutations (org creation, role changes, invite acceptance).

### Permission Check Flow

Access control is enforced at three independent layers, each acting as a backstop for the one above:

1. **DB layer (RLS)**: Every query runs through a Prisma client extension that sets `request.jwt.claims` in the Postgres session. `CREATE POLICY` rules on all `platform.*` tables enforce tenant isolation at the database itself — rows from other orgs are never returned, regardless of application code.
2. **Fast path**: Check `user.app_metadata.active_org_id` + `active_persona` from JWT → resolve via `PERSONA_CAPABILITY_MAP` (no DB, no cache)
3. **Cache path**: Look up `UserSettingsPlus` cache → traverse hierarchy → check scopes. Falls back to a direct `orgMember` DB query if the cache is stale.

### Server-Side Auth Pattern

API routes authenticate by:
1. Reading `Authorization: Bearer <token>` header
2. Calling `supabase.auth.getUser(token)` to validate and get the user
3. Checking application-layer membership (`WHERE userId = ...`) for the requested resource

Server Components and layouts use `createClient()` (cookie-based Supabase client).

### "View As" Feature

Admins with `canUseViewAs` permission can **impersonate any persona** to preview the UI from that role's perspective. `ViewAsContext` stores the selected `viewAsPersonaSlug` and `effectivePermissions`, which sidebar and permission-gated components use instead of real permissions.

---

## 9. Notable Design Decisions

| Decision | Rationale |
|---|---|
| **Org-scoped connector settings as JSON blob** | `Connector.settings` stores a nested map of org-scoped folder IDs, avoiding a separate folder registry table. Flexible but denormalized. |
| **Sandbox orgs** | `sandboxOnly: true` flag on orgs/clients/projects marks demo/test data, skipped during Drive import scans. Enables in-product demos without polluting real data. |
| **Transparent encryption via Prisma extension** | Callsites never handle encryption — the ORM layer handles crypto. Reduces security mistakes at the cost of a non-standard Prisma pattern. |
| **Slug-based routing** | URLs use human-readable slugs everywhere. Slugs are unique within their parent scope (e.g., `clientId_slug` unique index on Project). Better UX and shareable URLs. |
| **Server layout + client page split** | `/d/layout.tsx` is a Server Component that fetches orgs and passes them to `DLayoutClient`. Individual pages handle routing to avoid redirect loops in RSC streaming. |
| **Custom window event bus** | A `pockett:refresh-organizations` window event triggers sidebar refresh cross-component without a full page reload. Simple but effective for this scope. |
| **`safeInngestSend`** | Background job failures are silently swallowed to prevent user-facing errors. Acceptable for async indexing / permission sync, but requires monitoring. |
| **Legacy webpack build** | Using `--webpack` instead of Turbopack is intentional to fix a PostCSS incompatibility. Should be revisited when the upstream bug is resolved. |
| **Defence-in-depth security (RLS + application layer)** | Tenant isolation is enforced at two independent layers: Postgres RLS policies at the DB level, and explicit membership checks at the application layer. A compromised API route cannot leak another tenant's data because the database itself enforces the boundary. |

---

*Last updated: March 2026*
