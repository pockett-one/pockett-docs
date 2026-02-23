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
- Share configuration, **activity status** (to_do / in_progress / done), **comments**, and access data are stored in a **JSONB `settings`** column on `portal.project_document_sharing` using a nested structure (see §2.2).
- The **Shares** tab is a **Project Dashboard** with **Activity Swimlanes** (To Do, In Progress, Done). The assigner can add a comment requesting "updates" from EC or "review" from Guest. New shares default to **To Do**; EC/Guest move them to **In Progress** then **Done**. **Project Lead** can **Finalize** (lock) a share.

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

Store all share configuration, activity status, comments, and access events here to avoid DDL changes. The API and UI support both the **legacy flat** shape and the **new nested** shape; new writes use the nested shape.

**New (nested) shape:**

```ts
{
  share: {
    guest: {
      enabled: boolean,
      options: {
        publish?: boolean,
        addWatermark?: boolean,
        sharePdfOnly?: boolean,
        allowDownload?: boolean
      }
    },
    externalCollaborator: { enabled: boolean },
    createdAt?: string,   // ISO
    updatedAt?: string,   // ISO
    publishedVersionId?: string | null,
    publishedAt?: string | null,
    finalizedAt?: string | null   // Set when Project Lead finalizes (locks)
  },
  activity: {
    status: "to_do" | "in_progress" | "done",
    updatedAt: string     // ISO
  },
  comments: [             // Latest first
    { createdAt: string, commentor: string /* user UUID */, comment: string },
    ...
  ],
  accessLog: [            // Who accessed and when (unchanged)
    { at: string, by: string, userId?, email?, sessionId? },
    ...
  ]
}
```

**Legacy (flat) shape** — still supported for reads; keys at top level: `externalCollaborator`, `guest`, `guestOptions`, `publishedVersionId`, `publishedAt`, `accessLog`.

- **Backward compatibility:** Reads accept either shape; new and updated records are written in the nested shape. See `frontend/lib/sharing-settings.ts` for parsing and building.

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
- **Body:** `{ externalCollaborator?, guest?, guestOptions?: { sharePdfOnly?, allowDownload?, addWatermark?, publish? }, title?, mimeType?, assignerComment? }`.
- **Logic:** Upsert `ProjectDocumentSharing`: persist in **nested** `settings` shape (`share`, `activity`, `comments`). On **create**, set `activity.status` to `to_do` and `activity.updatedAt`. If `assignerComment` is provided, prepend to `comments` (latest first). Do not replace `accessLog`. If `publish` is set to true, call Google Drive API to create major version and store `publishedVersionId` / `publishedAt` in `share`.
- **Returns:** Updated share record.

### 4.3 POST `/api/projects/[projectId]/documents/[documentId]/sharing/access`

- **Auth:** Caller is either External Collaborator (authenticated) or Guest (e.g. token or session).
- **Body:** `{ by: "external_collaborator" | "guest", userId?, email?, sessionId? }`.
- **Logic:** Append one entry to `settings.accessLog` with `at: new Date().toISOString()` and provided fields. Idempotency/rate-limiting per session can be considered later.
- **Returns:** 204 or 200.

### 4.4 GET `/api/projects/[projectId]/shares`

- **Auth:** User must have `project:can_view_internal` (e.g. internal tabs).
- **Returns:** List of share records for the project (join with document title, etc.). Each item includes normalized `settings` (share toggles), `activity` (`status`, `updatedAt`), `comments` (latest first), `finalizedAt`, and `accessLog` for the Shares dashboard UI.

### 4.5 PATCH `/api/projects/[projectId]/documents/[documentId]/sharing/activity`

- **Auth:** Authenticated user (EC or Guest use this to move cards).
- **Body:** `{ status: "to_do" | "in_progress" | "done" }`.
- **Logic:** Update `settings.activity.status` and `settings.activity.updatedAt`. If the share is finalized (`share.finalizedAt` set), return 403.
- **Returns:** Updated share record.

### 4.6 PATCH `/api/projects/[projectId]/documents/[documentId]/sharing/finalize`

- **Auth:** Project Lead only (enforced by caller).
- **Body:** None.
- **Logic:** Set `settings.share.finalizedAt` to current ISO timestamp (locks the share; activity status can no longer be changed).
- **Returns:** Updated share record.

---

## 5. UI

### 5.1 Document Action Menu – Share item

- **Location:** Same menu as other document actions (e.g. open, copy link).
- **Visibility:** Show **Share** only when the current user (or View As persona) has **Project Lead** capability (e.g. `project:can_manage` or a dedicated `project:can_share_document`).
- **Action:** Opens a **Share** modal (see below). No inline share in menu.

### 5.2 Share modal

- **Request (optional):** Assigner can add a comment (e.g. "Please provide updates" or "Please review by Friday"); sent as `assignerComment` and stored in `settings.comments` (latest first).
- **Toggles:**
  - **External Collaborator** (default ON).
  - **Guest** (default OFF).
- **When Guest is ON**, show:
  - Share **PDF version only** (default ON).
  - **Allow download** (default OFF).
  - **Add watermark** (Organization name) (default OFF).
  - **Publish** (default OFF).
- **Publish ON:** Before saving, backend creates a **major version** of the file in Google Drive and marks the document as **non-editable for everyone** in the UI (and stores `publishedVersionId` / `publishedAt` in `share`).
- **Save:** Calls PUT sharing API (persists nested `settings`; on create, activity is set to `to_do`). On success, close modal and refresh file list / Shares tab.

### 5.3 File list visibility

- **Internal members:** See all project documents (existing behavior).
- **External Collaborator (View As):** See documents that have sharing with `externalCollaborator: true`.
- **Guest (View As):** See documents that have sharing with `guest: true` (and optionally apply PDF-only / watermark / download rules when they open the file).
- **View As dropdown:** Must include External Collaborator and Guest personas so that visibility and behavior can be tested without a real external user.

### 5.4 Recording access

- When a user opens or views a shared document **as** External Collaborator or Guest (or when a real EC/Guest opens the share link), the client or server calls **POST …/sharing/access** with `by: "external_collaborator"` or `by: "guest"` and available identifiers (userId, email, sessionId). Server appends to `settings.accessLog`.

### 5.5 Shares tab – Project Dashboard (project page)

- **Tab:** **Shares** tab (gated by `project:can_view_internal`).
- **Content:** **Activity Dashboard** with three **swimlanes** (card columns):
  - **To Do** — new shares start here.
  - **In Progress** — EC or Guest moves items here when they start work.
  - **Done** — EC or Guest moves items here when finished.
- **Cards:** Each shared document is a **card** showing: file-type icon, document name, owner (createdBy), last updated, and latest assigner comment (if any). Cards can be expanded to show **Shared setting** (read-only toggles; change via Action menu → Share), **Comments**, and **Access log**.
- **Moving cards:** EC/Guest use per-card actions to move between To Do ↔ In Progress ↔ Done (calls PATCH `…/sharing/activity` with `status`).
- **Finalize:** Project Lead sees a **Finalize** action per card; once finalized, the share is locked (`share.finalizedAt` set) and activity status can no longer be changed.
- **Data:** From GET `/api/projects/[projectId]/shares` (includes `activity`, `comments`, `finalizedAt`).

---

## 6. Behavior summary

| Feature | Detail |
|--------|--------|
| Share in menu | Only visible to Project Lead. |
| Assigner comment | Optional text when sharing (e.g. request updates / review); stored in `settings.comments`. |
| External Collaborator | Toggle (default ON); shared doc visible in file list for EC. |
| Guest | Toggle (default OFF); sub-options: PDF only, Allow download, Watermark, Publish. |
| Publish | ON → major version in Drive, document non-editable for everyone; store version info in `share`. |
| Activity status | `to_do` \| `in_progress` \| `done`; new shares start as `to_do`; EC/Guest move via PATCH activity. |
| Finalize | Project Lead can lock a share (`share.finalizedAt`); no further activity changes. |
| File list | Shared docs visible to EC/Guest; testable via View As. |
| Access log | Stored in `settings.accessLog`; who (persona/user) and when. |
| Shares tab | Dashboard with swimlanes (To Do, In Progress, Done), cards, move actions, finalize. |

---

## 7. References

- [LLD](lld.md) – Permission-based UI, gates, capabilities.
- [PRD](prd.md) – Personas and who can see what.
- **DB:** `portal.project_document_sharing` with `settings` JSONB; Prisma migration workflow per AGENTS.md.
