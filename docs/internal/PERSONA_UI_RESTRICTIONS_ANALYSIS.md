# Persona-Based UI Restrictions Analysis

This document maps UI elements (tabs, buttons, settings, links) to RBAC scope + privilege and persona, and notes current vs recommended state. Use it to implement and test permission-restricted UI and "View As" behavior.

**Scopes:** `organization` | `client` | `project` | `document`  
**Privileges:** `can_view` | `can_edit` | `can_manage` | `can_comment`

---

## 1. Organization level

| UI element | Location | Recommended permission | Current state |
|------------|----------|------------------------|---------------|
| **Organization workspace / Dashboard (Projects list)** | Sidebar: "Projects", org home | `organization` + `can_view` | ✅ Sidebar uses `canViewOrg` → `showOrganizationWorkspace` |
| **Settings → Connectors** | Sidebar | `organization` + `can_manage` | ✅ `showSettings` = `canManageOrg` |
| **More → Insights** | Sidebar | `organization` + `can_view` | ✅ `showMore` uses `canViewOrg` |
| **View As dropdown** | Sidebar (below org selector) | Only when user really has `organization` + `can_manage` | ✅ `canShowViewAsDropdown` = real `orgPermissions?.canManage` |
| **New Client button** | Org home: `OrganizationClientsView` | `client` + `can_manage` (at org scope) | ✅ Uses `/api/permissions/organization` → `canManageClients`; **gap:** does not use View As effective permissions (API returns real user only) |
| **Client list / client cards** | Org home | `client` + `can_view` | ⚠️ No gate: all org members see clients. Restrict to `canViewClients` if desired. |
| **Insights page** (`/d/o/[slug]/insights`) | Page | `organization` + `can_view` (or keep as org-wide) | ⚠️ No page-level check; access follows sidebar (if they have link they can open). Consider server-side `canViewOrg` and `notFound()` if no access. |

**Summary – Org:** Sidebar visibility is already gated. "New Client" is gated by `canManageClients` but ignores View As. Client list visibility is not gated by `can_view` clients. Insights page has no server-side permission check.

---

## 2. Client level

| UI element | Location | Recommended permission | Current state |
|------------|----------|------------------------|---------------|
| **Client selector / client breadcrumb** | Client page header | `client` + `can_view` | ⚠️ Anyone who can open org can open client URL; hierarchy includes all clients. Gate by client membership or org `can_view` clients. |
| **New Project button** | Client page: `ClientProjectView` | `client` + `can_manage` (create project under client) | ❌ **Not gated:** button always shown. Should show only when user has client scope `can_manage` (or project create permission at client). |
| **Project list / project cards** | Client page | `project` + `can_view` per project | ✅ Project page does `canViewProject` → `notFound()`. Listing is from hierarchy (user sees only projects they have access to via hierarchy). |
| **Client details modal** | Client breadcrumb click | `client` + `can_view` (or `can_edit` for edit) | ⚠️ No explicit permission check before opening. |

**Summary – Client:** "New Project" must be gated by client-level `can_manage`. Client details and client selector should respect `can_view` (and optionally `can_edit`) at client scope when you introduce client-level permissions in the cache.

---

## 3. Project level

| UI element | Location | Recommended permission | Current state |
|------------|----------|------------------------|---------------|
| **Project page access** | `/d/o/.../p/[projectSlug]` | `project` + `can_view` | ✅ Server: `canViewProject` → `notFound()` if no access. |
| **Project Settings (gear)** | `ProjectWorkspace` header | `project` + `can_manage` | ✅ `canViewSettings` = `canManage` from server. |
| **Files tab** | Project workspace | `document` + `can_view` (view), `can_edit` (upload/rename/delete) | ✅ `ProjectFileList` receives `canEdit`, `canManage`; upload/edit actions should check these. |
| **Members tab** | Project workspace | `project` + `can_view` to see; `can_manage` to invite/change | ✅ `ProjectMembersTab` gets `canManage`; invite/remove gated. |
| **Shares tab** | Project workspace | `project` or `document` + `can_view` / `can_manage` TBD | Placeholder; gate when feature is implemented. |
| **Insights tab** | Project workspace | `project` + `can_view` (or `document` + `can_view`) | ⚠️ No tab-level hide; if user can open project they see all tabs. Optionally hide tab when only `can_view` documents and no project-level insights. |
| **Sources tab** | Project workspace | `project` + `can_manage` (or `can_edit`) | Placeholder; gate when implemented. |
| **Sidebar project subnav** (Files, Members, Shares, Insights, Sources) | Sidebar under project | Same as project tabs | ⚠️ No per-tab permission; all visible if project is visible. |
| **Upload / New folder / Delete in Files** | `ProjectFileList` | `document` + `can_edit` or `can_manage` | ✅ `canEdit` passed; used for showing upload/actions. |
| **Invite member / Manage members** | `ProjectMembersTab` / `MemberList` | `project` + `can_manage` | ✅ `canManage` controls invite and manage actions. |

**Summary – Project:** Page access and Settings/Members/Files actions are well gated. Consider hiding or disabling specific tabs (e.g. Sources, or Insights for view-only) by project/document privilege when you want finer granularity.

---

## 4. View As behavior

- **Reload:** Changing "View As" persona triggers a full workspace reload so server and client state reflect the selected persona.
- **Sidebar:** Uses `effectivePermissions` when View As is active; org-level nav (Settings, More, etc.) already reflects the selected persona.
- **Gaps for View As:**
  - **Org:** "New Client" and client list use `/api/permissions/organization`, which does not read View As cookie/header, so they always show real user permissions. To make View As accurate, either (a) have the permissions API accept a `view_as` param/cookie and return effective permissions for that persona, or (b) have org-level components use `useViewAs().effectivePermissions` when `isViewAsActive` and skip the API for those flags.
  - **Client:** "New Project" does not use any permission today; once gated by client `can_manage`, View As will need the same treatment (effective permissions for client scope when View As is on).
  - **Project:** Project page and project components use server-side `canViewProject` / `canEditProject` / `canManageProject`, which use the real user. View As is client-side only, so when viewing as Guest the project page still loads with real user's permissions. To make View As affect project pages, you’d need either server-side support for View As (e.g. cookie/header and use effective persona for permission checks) or a client-side overlay that hides/disabled project-level UI based on `effectivePermissions` (less secure; server should remain source of truth).

---

## 5. Recommended next steps

1. **Org – View As:** In `OrganizationClientsView`, when `useViewAs().isViewAsActive` and `effectivePermissions` exist, use `effectivePermissions.canManageClients` (and optionally `canViewClients`) instead of fetching `/api/permissions/organization` for the "New Client" button and, if desired, client list visibility.
2. **Client – New Project:** Add client-level permission check (e.g. from `/api/permissions/organization` or hierarchy that includes client roles). Show "New Project" only when user has client scope `can_manage`. Then optionally wire View As the same way as org.
3. **Project – Tabs:** Optionally hide or disable project tabs (e.g. Sources, Insights) based on `canManage` / `canEdit` so view-only personas don’t see management surfaces.
4. **Insights page:** Add server-side check: if user does not have `organization` + `can_view`, call `notFound()`.
5. **View As on server (optional):** If you want View As to affect project and org pages fully, have the permissions API and server actions read a secure `view_as` cookie/header and compute effective permissions for that persona so all gates (including "New Project", project page, etc.) are consistent with the selected persona.
