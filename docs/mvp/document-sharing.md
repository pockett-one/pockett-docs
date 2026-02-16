# Document Sharing – Design

This document specifies the full design for **Document Sharing**: DB schema, APIs, UI (Share action, modal, file list visibility, View As), access tracking, and the **Shares** tab on the project page.

---

## 1. Overview

- **Share** is added to the **Document Action Menu** and is **visible only to Project Lead**.
- Sharing has two main toggles: **External Collaborator** (default ON) and **Guest** (default OFF).
- When **Guest** is ON, sub-options: Share PDF only, Allow download, Add watermark (org name), **Publish**.
- If **Publish** is ON: document is **major-versioned in Google Drive** and shown as **non-editable for everyone** in the UI.
- Shared documents appear in the file list for **External Collaborator** and **Guest**; behavior is testable via **View As**.
- Access by External Collaborator or Guest is **recorded** (who, when).
- Share configuration and access data are stored in a **JSONB `settings`** column on `portal.project_document_sharing` to avoid future DDL churn.
- The **Shares** tab on the project page shows share records and **who accessed the share and when**.

---

## 2. DB schema

### 2.1 Table: `portal.project_document_sharing`

| Column       | Type      | Purpose |
|-------------|-----------|---------|
| `id`        | UUID PK   | Primary key. |
| `createdAt` | timestamp | When the share was created. |
| `updatedAt` | timestamp | Last update to the row. |
| `projectId` | UUID FK   | References `portal.projects(id)`. |
| `documentId`| UUID FK   | References `portal.documents(id)`. |
| `createdBy` | UUID      | User ID who created the share (audit). |
| `settings`  | JSONB     | Share options + access log (see below). |

- **Unique constraint:** `(projectId, documentId)` so each document has at most one share record per project.
- **Indexes:** `(projectId)`, `(documentId)` for listing by project and by document.

### 2.2 `settings` JSONB shape

Store all share configuration and access events here to avoid DDL changes.

```ts
interface ProjectDocumentSharingSettings {
  // Share toggles (persisted when user saves share settings)
  externalCollaborator?: boolean   // default true
  guest?: boolean                  // default false
  guestOptions?: {
    sharePdfOnly?: boolean          // default true
    allowDownload?: boolean        // default false
    addWatermark?: boolean         // default false (org name as watermark)
    publish?: boolean             // default false → major version in Drive, non-editable for everyone
  }
  // Set when publish is turned ON (Drive version id or similar if needed)
  publishedVersionId?: string | null
  publishedAt?: string | null      // ISO date

  // Access log: who (persona or "guest") accessed and when
  accessLog?: Array<{
    at: string       // ISO date
    by: string       // "external_collaborator" | "guest"
    userId?: string  // if known (e.g. EC with account)
    email?: string   // if known
    sessionId?: string
  }>
}
```

- **Backward compatibility:** New keys can be added under `settings` without migrations.

---

## 3. Prisma schema addition

```prisma
model ProjectDocumentSharing {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  projectId  String   @db.Uuid
  documentId String   @db.Uuid
  createdBy  String   @db.Uuid
  settings  Json      @default("{}")

  project  Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  document Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@schema("portal")
  @@unique([projectId, documentId])
  @@index([projectId])
  @@index([documentId])
  @@map("project_document_sharing")
}
```

- On `Document`: add `projectDocumentSharings ProjectDocumentSharing[]`.
- On `Project`: add `projectDocumentSharings ProjectDocumentSharing[]`.

---

## 4. APIs

### 4.1 GET `/api/projects/[projectId]/documents/[documentId]/sharing`

- **Auth:** User must be Project Lead (or equivalent capability that allows managing share).
- **Returns:** Share row if exists: `{ id, projectId, documentId, createdBy, settings }`. Else `{ sharing: null }`.

### 4.2 PUT `/api/projects/[projectId]/documents/[documentId]/sharing`

- **Auth:** Project Lead only.
- **Body:** `{ externalCollaborator?, guest?, guestOptions?: { sharePdfOnly?, allowDownload?, addWatermark?, publish? } }`.
- **Logic:** Upsert `ProjectDocumentSharing`: merge body into `settings` (do not replace `accessLog`). If `publish` is set to true, call Google Drive API to create major version and store `publishedVersionId` / `publishedAt` in `settings`.
- **Returns:** Updated share record.

### 4.3 POST `/api/projects/[projectId]/documents/[documentId]/sharing/access`

- **Auth:** Caller is either External Collaborator (authenticated) or Guest (e.g. token or session).
- **Body:** `{ by: "external_collaborator" | "guest", userId?, email?, sessionId? }`.
- **Logic:** Append one entry to `settings.accessLog` with `at: new Date().toISOString()` and provided fields. Idempotency/rate-limiting per session can be considered later.
- **Returns:** 204 or 200.

### 4.4 GET `/api/projects/[projectId]/shares`

- **Auth:** User must have `project:can_view_internal` (e.g. internal tabs).
- **Returns:** List of share records for the project (join with document title, etc.), each including `settings` (with `accessLog`) for the Shares tab UI.

---

## 5. UI

### 5.1 Document Action Menu – Share item

- **Location:** Same menu as other document actions (e.g. open, copy link).
- **Visibility:** Show **Share** only when the current user (or View As persona) has **Project Lead** capability (e.g. `project:can_manage` or a dedicated `project:can_share_document`).
- **Action:** Opens a **Share** modal (see below). No inline share in menu.

### 5.2 Share modal

- **Toggles:**
  - **External Collaborator** (default ON).
  - **Guest** (default OFF).
- **When Guest is ON**, show:
  - Share **PDF version only** (default ON).
  - **Allow download** (default OFF).
  - **Add watermark** (Organization name) (default OFF).
  - **Publish** (default OFF).
- **Publish ON:** Before saving, backend creates a **major version** of the file in Google Drive and marks the document as **non-editable for everyone** in the UI (and stores `publishedVersionId` / `publishedAt` in `settings`).
- **Save:** Calls PUT sharing API; on success, close modal and refresh file list / Shares tab if needed.

### 5.3 File list visibility

- **Internal members:** See all project documents (existing behavior).
- **External Collaborator (View As):** See documents that have sharing with `externalCollaborator: true`.
- **Guest (View As):** See documents that have sharing with `guest: true` (and optionally apply PDF-only / watermark / download rules when they open the file).
- **View As dropdown:** Must include External Collaborator and Guest personas so that visibility and behavior can be tested without a real external user.

### 5.4 Recording access

- When a user opens or views a shared document **as** External Collaborator or Guest (or when a real EC/Guest opens the share link), the client or server calls **POST …/sharing/access** with `by: "external_collaborator"` or `by: "guest"` and available identifiers (userId, email, sessionId). Server appends to `settings.accessLog`.

### 5.5 Shares tab (project page)

- **Tab:** Existing **Shares** tab (gated by `project:can_view_internal`).
- **Content:** List of shared documents for this project. Each row:
  - Document name, who created the share, when.
  - Expand or side panel: **Share settings** (toggles) and **Access log** (who accessed, when, and by which persona: External Collaborator vs Guest).
- **Data:** From GET `/api/projects/[projectId]/shares`.

---

## 6. Behavior summary

| Feature | Detail |
|--------|--------|
| Share in menu | Only visible to Project Lead. |
| External Collaborator | Toggle (default ON); shared doc visible in file list for EC. |
| Guest | Toggle (default OFF); sub-options: PDF only, Allow download, Watermark, Publish. |
| Publish | ON → major version in Drive, document non-editable for everyone; store version info in `settings`. |
| File list | Shared docs visible to EC/Guest; testable via View As. |
| Access log | Stored in `settings.accessLog`; who (persona/user) and when. |
| Shares tab | Shows share settings and who accessed the share and when. |

---

## 7. References

- [LLD](lld.md) – Permission-based UI, gates, capabilities.
- [PRD](prd.md) – Personas and who can see what.
- **DB:** `portal.project_document_sharing` with `settings` JSONB; Prisma migration workflow per AGENTS.md.
