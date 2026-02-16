# Low-Level Design (LLD)

This document specifies low-level implementation details derived from the [HLD](hld.md). It is intended for implementers: API contracts, component props and state, module boundaries, and data access. Product behavior and “who can see what” are in the [PRD](prd.md) (§7.6).

**Scope:** This LLD focuses on the **Permission-based UI** module and related API/component specs. Other areas (File list, Upload, Invitations, Connectors) can be expanded in later sections or separate LLDs using the same structure.

---

## 1. Constraints and non-goals (from HLD)

- **No new system actors or boundaries** — LLD does not introduce new external systems beyond those in the HLD.
- **Stack fixed** — Next.js App Router, React, TypeScript, Prisma, Supabase Auth. LLD specifies patterns and file layout within this stack.
- **Permissions from cache or RBAC** — Permission checks use in-memory cache (UserSettingsPlus) for the real user; for View As, resolution uses RBAC persona grants (Prisma). No ad-hoc permission logic in UI components.

---

## 2. Permission-based UI module

### 2.1 Module layout

| Path | Purpose |
|------|---------|
| `frontend/lib/permissions/types.ts` | Type definitions: `ProjectCapabilityKey`, `CapabilityKey`, `CapabilitySet`, `ProjectGateId`, `GateId`, `GateScope`, `GateConfig`. |
| `frontend/lib/permissions/ui-gates.config.ts` | Declarative gate list: `PROJECT_GATES` (array of `GateConfig`), `getGateById`, `getGatesByScope`. |
| `frontend/lib/permissions/resolve.ts` | Resolution: `resolveProjectCapabilitiesForUser`, `resolveProjectCapabilitiesForPersona`, `canAccessGate`, `getVisibleGates`, `getGateVisibilityMap`. |
| `frontend/lib/permissions/index.ts` | Re-exports all public types and functions for `@/lib/permissions`. |
| `frontend/lib/permissions/README.md` | In-repo guide for extending gates, personas, and capabilities. |

### 2.2 Type definitions (LLD)

**CapabilityKey (project scope only for MVP):**

```ts
type ProjectCapabilityKey =
  | 'project:can_view'           // View project + Files tab
  | 'project:can_view_internal'  // Members, Shares, Insights, Sources
  | 'project:can_manage'         // Settings, edit, manage members
type CapabilityKey = ProjectCapabilityKey
```

**CapabilitySet:** `Partial<Record<CapabilityKey, boolean>>` — each key is `true` iff the user/persona has that capability.

**GateId:** `'project.files' | 'project.members' | 'project.shares' | 'project.insights' | 'project.sources' | 'project.settings'`.

**GateConfig:**

```ts
interface GateConfig {
  id: GateId
  label: string
  scope: GateScope  // 'project' | 'org' | 'client'
  requiredCapabilities: CapabilityKey[]
  requireAll?: boolean   // default true: user must have ALL listed capabilities
  tabValue?: string      // e.g. 'files', 'settings' for URL ?tab=
}
```

### 2.3 Gate config entries (current)

| id | label | requiredCapabilities | tabValue |
|----|-------|----------------------|----------|
| project.files | Files | `['project:can_view']` | files |
| project.members | Members | `['project:can_view_internal']` | members |
| project.shares | Shares | `['project:can_view_internal']` | shares |
| project.insights | Insights | `['project:can_view_internal']` | insights |
| project.sources | Sources | `['project:can_view_internal']` | sources |
| project.settings | Settings | `['project:can_manage']` | settings |

### 2.4 Resolution functions

| Function | Signature | Behavior |
|----------|-----------|----------|
| `resolveProjectCapabilitiesForUser` | `(orgId, clientId, projectId) => Promise<CapabilitySet>` | Calls `canViewProject`, `canViewProjectInternalTabs`, `canViewProjectSettings` from `@/lib/permission-helpers`; returns capability map. |
| `resolveProjectCapabilitiesForPersona` | `(personaSlug: string) => Promise<CapabilitySet>` | Loads persona and grants via Prisma (`rbacPersona`, `grants` with `scope`, `privilege`); sets `project:can_view` from grants, `project:can_view_internal` from static set (sys_admin, org_admin, client_admin, proj_admin, proj_member), `project:can_manage` from project/client can_manage in grants. |
| `canAccessGate` | `(gateId, capabilities) => boolean` | Looks up gate in `PROJECT_GATES`; returns true iff all `requiredCapabilities` are true in `capabilities` (or any if `requireAll === false`). |
| `getVisibleGates` | `(capabilities, scope?) => GateId[]` | Filters `PROJECT_GATES` by scope (if given), returns gate ids for which `canAccessGate` is true. |
| `getGateVisibilityMap` | `(capabilities, scope?) => Record<string, boolean>` | Same as above but returns `{ [gateId]: boolean }`. |

### 2.5 Dependencies

- **resolve.ts** imports: `@/lib/permission-helpers` (canViewProject, canViewProjectSettings, canViewProjectInternalTabs), `@/lib/prisma`. No UI or Next.js headers.
- **permission-helpers** and **view-as-server**: `getViewAsPersonaFromCookie()` (from `next/headers` cookies) is used only in pages/API routes, not inside `lib/permissions`.

---

## 3. API contracts (permission-related)

### 3.1 GET /api/permissions/project-tabs

**Purpose:** Return project tab visibility for the current user (or View As persona) for use by the sidebar.

| Item | Spec |
|------|------|
| **Method** | GET |
| **Path** | `/api/permissions/project-tabs` |
| **Query** | `orgSlug` (string), `clientSlug` (string), `projectSlug` (string). All required. |
| **Headers** | Session cookie (Supabase). No body. |
| **Auth** | `createClient().auth.getUser()`; 401 if no user. |
| **Logic** | Resolve org by slug, client by org+clientSlug, project by client+projectSlug (isDeleted: false). Call `canViewProject(org.id, client.id, project.id)`; 403 if false. Read View As cookie via `getViewAsPersonaFromCookie()`. If cookie set and `canAccessRbacAdmin(user.id)`, use `resolveProjectCapabilitiesForPersona(viewAsSlug)`; else `resolveProjectCapabilitiesForUser(org.id, client.id, project.id)`. Return `canViewInternalTabs = capabilities['project:can_view_internal']`, `canViewSettings = capabilities['project:can_manage']`. |
| **Response 200** | `{ canViewInternalTabs: boolean, canViewSettings: boolean }` |
| **Errors** | 400 missing params; 401 unauthorized; 403 forbidden (no project view); 404 org/client/project not found; 500 server error. |

**File:** `frontend/app/api/permissions/project-tabs/route.ts`.

### 3.2 GET /api/permissions/organization

| Item | Spec |
|------|------|
| **Query** | `orgId` (UUID) or `orgSlug` (string). One required. |
| **Response 200** | `{ canView, canEdit, canManage, canManageClients, canEditClients, canViewClients, scopes? }`. Booleans from cached UserSettingsPlus; no DB query. |
| **File** | `frontend/app/api/permissions/organization/route.ts`. |

### 3.3 GET /api/permissions/project

| Item | Spec |
|------|------|
| **Query** | `orgId`, `clientId`, `projectId` (UUIDs). All required. |
| **Response 200** | `{ canView, canEdit, canManage, canComment, persona, scopes }`. From permission-helpers (cache). |
| **File** | `frontend/app/api/permissions/project/route.ts`. |

---

## 4. Component specs (permission-gated UI)

### 4.1 Project page (server)

| Item | Spec |
|------|------|
| **Path** | `app/d/o/[slug]/c/[clientSlug]/p/[projectSlug]/page.tsx` (and legacy `app/o/...`). |
| **Data** | Await params; get user (Supabase); `getOrganizationHierarchy(slug)`; resolve client and project by slug; `canViewProject(org.id, client.id, project.id)` → notFound() if false. |
| **Capabilities** | `viewAsSlug = getViewAsPersonaFromCookie()`; `applyViewAs = viewAsSlug && canAccessRbacAdmin(user.id)`. If applyViewAs: `capabilities = await resolveProjectCapabilitiesForPersona(viewAsSlug)`; else: `capabilities = await resolveProjectCapabilitiesForUser(org.id, client.id, project.id)`. |
| **Derived props** | `canViewSettings = capabilities['project:can_manage'] ?? false`; `canViewInternalTabs = capabilities['project:can_view_internal'] ?? false`; `canEdit = canManage = canViewSettings`. |
| **Children** | `<ProjectWorkspace ... canViewSettings canViewInternalTabs canEdit canManage ... />`. |

### 4.2 ProjectWorkspace (client)

| Item | Spec |
|------|------|
| **Path** | `frontend/components/projects/project-workspace.tsx`. |
| **Props** | `orgSlug`, `clientSlug`, `projectId`, `connectorRootFolderId`, `orgName`, `clientName`, `projectName`, `canViewSettings` (boolean), `canViewInternalTabs` (boolean), `canEdit`, `canManage`, `projectDescription`, `isClosed`. |
| **Tab visibility** | Files: always rendered. Members, Shares, Insights, Sources: only when `canViewInternalTabs`. Settings: only when `canViewSettings`. |
| **URL fallback** | `tabParam = searchParams.get('tab') || 'files'`. If `tabParam === 'settings' && !canViewSettings`, or tab in `['members','shares','insights','sources']` and `!canViewInternalTabs`, set effective tab to `'files'`. |
| **State** | No permission state; all from props. Uses `useSearchParams`, `usePathname`, `useRouter` for tab switching. |

### 4.3 AppSidebar project sub-menus (client)

| Item | Spec |
|------|------|
| **Path** | `frontend/components/app/app-sidebar.tsx`. |
| **State** | `projectTabPermissions: { canViewInternalTabs: boolean, canViewSettings: boolean } | null`. |
| **Fetch** | When `slug`, `clientSlug`, `projectSlug` all present: `GET /api/permissions/project-tabs?orgSlug=&clientSlug=&projectSlug=`; on success set `projectTabPermissions` from response; on no project context or error set `null`. |
| **Render** | Under “Projects” when `projectSlug` and `isProjectsOpen`: Files link always; Members, Shares, Insights, Sources links only when `projectTabPermissions?.canViewInternalTabs`; Settings link only when `projectTabPermissions?.canViewSettings`. Links use `baseUrl`, `clientSlug`, `projectSlug`, and `?tab=<tabValue>`. |

### 4.4 View As (client)

| Item | Spec |
|------|------|
| **Context** | `lib/view-as-context.tsx`: `ViewAsProvider`, `useViewAs()`. Cookie name: `pockett_view_as`. |
| **Values** | `viewAsPersonaSlug: string | null`, `setViewAsPersonaSlug`, `effectivePermissions` (org-level), `isViewAsActive`, `personas` (list of { slug, displayName }). |
| **Sidebar** | View As dropdown only when real user has org `canManage` (`orgPermissions?.canManage`) and `slug` is set. On persona change: set cookie, call setViewAsPersonaSlug, `window.location.reload()`. |
| **Server** | Project page and project-tabs API read cookie via `getViewAsPersonaFromCookie()` and, if set and user is org admin, use `resolveProjectCapabilitiesForPersona(viewAsSlug)` for capabilities. |

---

## 5. Data access (permission flows)

| Flow | Data source | Notes |
|------|-------------|-------|
| **Real user project capabilities** | In-memory cache (UserSettingsPlus) via `permission-helpers`: `canViewProject`, `canViewProjectInternalTabs`, `canViewProjectSettings`. | No Prisma in permission-helpers for these; cache built from DB at login. |
| **View As persona capabilities** | Prisma: `rbacPersona.findUnique({ where: { slug }, include: { grants: { include: { scope, privilege } } } })`. | Used only when View As cookie is set and user is org admin. |
| **Project-tabs API: resolve org/client/project** | Prisma: `organization.findUnique`, `client.findFirst`, `project.findFirst`. | By slug; project filter `isDeleted: false`. |
| **canViewProject (project page)** | Cache (permission-helpers). | Page calls `canViewProject` before resolving capabilities; notFound() if false. |

---

## 6. Adding a new gate or capability (checklist)

**New project tab (e.g. “Reports”):**

1. **types.ts:** Add `'project.reports'` to `ProjectGateId` (and GateId).
2. **ui-gates.config.ts:** Append to `PROJECT_GATES`: `{ id: 'project.reports', label: 'Reports', scope: 'project', requiredCapabilities: ['project:can_view_internal'], tabValue: 'reports' }` (or the capability that matches desired visibility).
3. **project-workspace.tsx:** Add TabsTrigger and TabsContent for `reports`, gated by `canViewInternalTabs` (or by a new prop if the new tab has different visibility). Add `'reports'` to `internalTabs` for URL fallback if restricted.
4. **app-sidebar.tsx:** Add “Reports” link in project sub-menus when `projectTabPermissions?.canViewInternalTabs` (or new flag if different).
5. **project page:** No change if still using same capabilities; if new capability, add it in types, resolve.ts, and pass a new prop to ProjectWorkspace.

**New capability key:**

1. **types.ts:** Add key to `ProjectCapabilityKey` (e.g. `'project:can_export'`).
2. **resolve.ts:** In `resolveProjectCapabilitiesForUser`, compute the new capability (e.g. new helper in permission-helpers or existing scope/privilege). In `resolveProjectCapabilitiesForPersona`, set it from RBAC grants or static set.
3. **ui-gates.config.ts:** Use the new key in `requiredCapabilities` for the relevant gate(s).
4. **API/Pages:** If any API or page returns a derived boolean for this capability, derive it from the capability set (e.g. `capabilities['project:can_export']`).

---

## 7. References

- [PRD](prd.md) — §7.6 Permission-based UI: Who can see what (matrix).
- [HLD](hld.md) — Permission-based UI framework (implementation); HLD → LLD mapping.
- **In-repo:** `frontend/lib/permissions/README.md` — Extending the framework.
