# Project Insights: Product & CMO Plan

Full product plan for the Project Insights tab: recent activities, executive summaries, data visuals, and actionable insights that deliver operational value to both the firm (Pocket One) and the client.

**See also:** [Project Insights MVP 1 Dashboard](project-insights-mvp1-dashboard.md) — lean single-page scope for small firms and MVP 1 launch.

---

## Current state

- **Project Insights tab** exists and is gated by `project:can_view_internal` (Members, Shares, Insights, Sources). Only internal personas see it.
- The UI is a **placeholder**: `frontend/components/projects/project-insights-dashboard.tsx` shows three stat cards (Documents Processed, Pending Review, Risky Shares) hardcoded to `0` and an empty state.
- **Org-level Insights** (`frontend/app/o/[slug]/insights/page.tsx`) already implements a rich pattern: Recent / Trending / Storage / Sharing tabs, summary metrics (stale, large, sensitive, risky), StatCards, FeedItems, and filters. Project Insights should reuse these patterns where applicable, scoped to the **project**.
- **Existing project-scoped data** (no new schema required):
  - **ProjectDocument**: count, `status`, `dueDate`, `fileSize`, `mimeType`, `slug` (shared docs), `parentId` (folder hierarchy).
  - **PlatformAuditEvent**: `projectId`, `eventType`, `eventAt`, `actorUserId`, `projectDocumentId`, `metadata` — used by project audit API.
  - **DocCommentMessage**: comments per document; `reactions` JSON includes `urgent` (array of user IDs when marked urgent).
  - **Notification**: `projectId`, `documentId`, `type`, `readAt`.
  - Project: `kickoffDate`, `dueDate`, `isClosed`.
- **Gap**: No project-scoped **insights/summary API** yet; need one endpoint for counts and aggregates.

---

## 1. Recent activities

**Goal:** One place for “what’s happening in this project” so both firm and client can stay aligned and act quickly.

| Idea | Description | Data source | Value (firm / client) |
|------|-------------|-------------|------------------------|
| **Activity feed** | Chronological feed of project events (last 7–14 days): file added/removed, shared externally, status change, comment added, project updated/closed. | `GET /api/projects/[projectId]/audit` (existing). | Firm: oversight and compliance. Client: transparency and progress. |
| **Latest comments** | **Only comments marked as Urgent.** Show document name, snippet, author, time. Link to document + comment thread. A message is “Urgent” when it has at least one `urgent` reaction (reactions API: `emojiKey: 'urgent'`). | Aggregate `DocCommentMessage` by `projectId` where `reactions.urgent` is a non-empty array; order by `createdAt`; join document `fileName`. | Both: focus on what needs immediate attention; avoid noise. |
| **My actions** | For the current user: “Documents shared with you,” “Pending your review,” “Overdue due dates.” | Audit + `ProjectDocument` (e.g. `dueDate` < today), sharing/activity status from existing sharing APIs. | Client: clear next steps. Firm: fewer chaser emails. |
| **Notifications strip** | Project-filtered notifications (e.g. “New share,” “Comment on X”) with mark-as-read. | Existing `GET /api/notifications`; filter by `projectId` or extend API with `?projectId=`. | Both: timely awareness without leaving the project. |

**Implementation:** Reuse org Insights FeedItem pattern (severity: critical / warning / info) for activity rows; event labels from `PlatformAuditEventType`.

---

## 2. Summaries

**Goal:** At-a-glance health and workload so leads can prioritize and report up.

| Summary | Definition | Data source | Value |
|---------|-------------|-------------|--------|
| **Documents processed** | Count of project documents with `status = PROCESSED` (optionally PROCESSING / ERROR). | `ProjectDocument` count by `projectId` and `status`. | Firm: delivery metrics. Client: “how much is in the portal.” |
| **Pending review** | Documents awaiting client/firm action: shared but not finalized, or activity status `to_do` / `in_progress`. | Project documents with `slug != null` and not finalized; sharing/activity APIs. | Both: focus on what needs attention. |
| **Risky shares** | Project-level attention: external shares, expiring links, public links. | Existing `GET /api/projects/[projectId]/shares`; classify by visibility/expiry. | Firm: compliance and risk. Client: control over exposure. |
| **Engagement snapshot** | Counts: comments this week, shares created, audit events. | `DocCommentMessage` and `PlatformAuditEvent` by `projectId` and date range. | Both: “is this project active?” for governance and billing. |
| **Project timeline** | Kickoff and due date with “on track / due soon / overdue” state. | `Project.kickoffDate`, `Project.dueDate`, `Project.isClosed`. | Firm: delivery and capacity. Client: expectation setting. |

**Implementation:** Add **project insights summary API** (e.g. `GET /api/projects/[projectId]/insights` or `.../insights/summary`) returning these aggregates; wire placeholder cards to it.

---

## 3. Data visuals

**Goal:** Communicate trends and composition at a glance; reuse org Insights patterns.

| Visual | Description | Data source | Value |
|--------|-------------|-------------|--------|
| **Activity over time** | Bar or line: events per day (or week) — uploads, shares, status changes, comments. | Project audit API with `fromDate`/`toDate`; aggregate by day. | Both: “last week was busy” / “engagement dropped.” |
| **Documents by type** | Pie or bar: breakdown by `mimeType` (PDF, DOCX, XLSX, images). | `ProjectDocument` by `projectId`, group by `mimeType`. | Firm: scope of work. Client: what’s in the project. |
| **Documents by status** | Small bar or list: Processed / Processing / Error / Archived. | Same as Documents processed summary, broken down. | Firm: indexing health. Client: clarity on availability. |
| **Share status funnel** | Total files → Shared → Finalized. | Count docs with `slug`; of those, count finalized (sharing API or metadata). | Both: “how much have we delivered and locked.” |
| **Due date horizon** | Documents with `dueDate` in next 7/14/30 days and overdue. | `ProjectDocument` where `projectId` and `dueDate` set; filter by range. | Firm: delivery planning. Client: prioritization. |

---

## 4. Actionable insights

**Goal:** Short, specific recommendations with a clear next step (button or link).

| Insight | Condition | Action | Value |
|---------|-----------|--------|--------|
| **Overdue documents** | `ProjectDocument.dueDate` < today. | “View N overdue” → link to Files (filter by due date) or Due dates list. | Client: catch up. Firm: reduce slippage. |
| **Unfinalized shares** | Shared (slug) but not finalized. | “Finalize N shares” → link to Shares tab with filter. | Firm: lock deliverables. Client: confirm receipt. |
| **Files with open comments** | Documents with recent or unresolved comments (if “resolved” added later, use it). | “Review N documents with comments” → list linking to doc comment threads. | Both: close the loop on feedback. |
| **Low engagement** | No audit events (or no comments) in last 7/14 days. | “No recent activity — send a reminder or check in?” (internal-only or client-facing by persona). | Firm: account health. Client: nudge. |
| **Project due soon** | `Project.dueDate` within 7 days and not closed. | “Project due in X days — review checklist” → Settings or checklist view. | Both: on-time closure. |
| **Risky share alert** | External or expiring share in this project. | “Review N risky shares” → Shares tab filtered by risk. | Firm: compliance. Client: control. |
| **Folder depth inefficiency** | Project folder hierarchy is **more than 3 levels deep** (computed from `ProjectDocument.parentId` chain; root = 1, each child +1). | “Simplify folder structure” → link to Files with guidance; show max depth; recommend ≤3 levels. | Firm: org efficiency, performance, and best practice; aligns with [Folder Hierarchy Organization Recommendations](roadmap.md) in roadmap. |

**Implementation:** Define rules in code (or small config) consuming summary + activity data. Render as cards or compact list with primary CTA; reuse severity and styling from org Insights FeedItem.

---

## 5. Organization inefficiency: folder depth

- **Problem:** Deep folder trees (> 3 levels) hurt findability, performance (permission checks, API calls), and maintainability.
- **Detection:** For the project, load `ProjectDocument` rows with `isFolder: true` and `parentId`; compute depth per node (root = 1, depth(parent) + 1); take max. If max depth > 3, surface as **Folder depth inefficiency** in actionable insights.
- **Data source:** `ProjectDocument` for `projectId`, filter folders, build tree from `parentId`; compute max depth in insights API or a small helper.
- **Placement:** Include in project insights summary API (e.g. `maxFolderDepth`, `folderDepthInefficiency: boolean`) and in the Actionable insights block with CTA to Files and link to best-practice guidance (see [roadmap](roadmap.md)).

---

## 6. Persona and value matrix

| Persona | Recent activities | Summaries | Visuals | Actionable insights |
|---------|-------------------|-----------|---------|---------------------|
| **Firm (org admin / project lead)** | Full activity feed; “my actions” for items they own. | All summary cards; engagement snapshot. | Activity over time; share funnel; due date horizon. | Unfinalized shares; overdue docs; risky shares; project due soon; low engagement; **folder depth inefficiency**. |
| **Client (client admin / member)** | Activity feed; “pending your review.” | Documents processed; pending review; project timeline. | Documents by type; due date horizon (their deliverables). | Overdue documents; open comments; project due soon. |

Show/hide or reorder sections by capability (e.g. `project:can_manage` sees Risky shares, Low engagement, Folder depth; client sees Pending your review, Overdue).

---

## 7. Technical approach (high level)

- **New API:** `GET /api/projects/[projectId]/insights` (or `.../insights/summary`) — document counts by status, share counts (total / finalized), comment/audit aggregates, project timeline, **max folder depth** and folder-depth-inefficiency flag, and precomputed insight flags (overdue count, unfinalized count, etc.). Use existing project auth (`resolveProjectContext`, `canViewProject`).
- **Existing:** Keep `GET /api/projects/[projectId]/audit` for activity feed; optionally extend `GET /api/notifications` with `?projectId=`.
- **UI:** Replace placeholder in `project-insights-dashboard.tsx` with: summary cards from new API; Recent activity (audit feed + **Urgent comments only**); one or two charts; Actionable insights block (including folder depth when > 3 levels). Reuse StatCard, FeedItem, filters from org Insights page.

---

## 8. Out of scope for this plan

- Drive-level metrics (stale/large/sensitive from Google Drive) remain org/connector-level; project-folder scoping can be a later phase.
- Client-facing vs internal-only event visibility (e.g. hide PROJECT_MEMBER_ADDED from client) can follow once activity feed is live.
- Email digests (“Weekly project insights”) not in scope but fit the same data and rules.

---

## 9. Success criteria (operational business value)

- **Firm:** Fewer “what’s the status?” calls; clearer delivery view (processed, shared, finalized) and risk (risky shares, overdue); **awareness of folder inefficiency**; better capacity and compliance.
- **Client:** One place for recent activity and “what I need to do” (pending review, overdue, **urgent comments**); trust through transparency and on-time delivery.
- **Product:** Project Insights is a daily-use tab (not a placeholder), aligned with org-level Insights and audit, with clear next steps and minimal new infrastructure (one new API, existing data).

---

## 10. Documentation and MVP 1

- **Full plan:** This document (`docs/mvp/project-insights-plan.md`), including Latest Comments = **Urgent only**, and **folder depth inefficiency**.
- **MVP 1 (lean):** Single-page Dashboard for small firms, no information overload. See [Project Insights MVP 1 Dashboard](project-insights-mvp1-dashboard.md).
