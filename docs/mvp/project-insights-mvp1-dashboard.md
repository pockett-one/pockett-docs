# Project Insights: MVP 1 Dashboard (Lean)

Single-page **Dashboard** for the Project Insights tab at MVP 1 launch. Designed for **small firms** to avoid information overload: one view, a small set of metrics, and a few clear actions.

**Full plan (post–MVP 1):** [Project Insights Plan](project-insights-plan.md).

---

## MVP 1 principles

- **One page:** No tabs, no drill-downs. Everything above the fold or in one short scroll.
- **Few numbers:** 3–4 summary cards only. No engagement snapshot, no multiple charts.
- **One activity strip:** Either “Recent activity” (audit) **or** “Urgent comments” — not both in MVP 1 (choose one; recommend **Urgent comments** for signal-over-noise).
- **Actionable, not noisy:** Up to **6** actionable insight rows max (each with one clear CTA). Prefer engagement and delivery blockers over “nice-to-know” analytics.
- **Empty states:** Clear “Connect a data source” or “No urgent comments” so the page never feels broken.

---

## MVP 1 layout (single page)

```
+------------------------------------------------------------------+
|  Project Insights                                                |
+------------------------------------------------------------------+
|  [Card: Documents processed]  [Card: Pending review]  [Card: ...]  |   <- 3–4 cards max
+------------------------------------------------------------------+
|  Urgent comments (or Recent activity)                             |
|  - Message 1 | doc name | author | time → [Open]                   |
|  - Message 2 | ...                                                |   <- 5–10 items, single list
+------------------------------------------------------------------+
|  Engagement health (compact)                                      |
|  - [Stalled urgent: 3] Review →                                   |
|  - [No activity 14d: Yes] Check in →                               |   <- 2–3 items max
+------------------------------------------------------------------+
|  What needs attention                                             |
|  - [Overdue: 2 docs] Open →                                      |
|  - [Unfinalized: 1 share] Open →                                  |   <- up to 6 insight rows, 1 CTA each
+------------------------------------------------------------------+
```

Optional: one very small visual (e.g. “Total → Shared → Finalized” as 3 numbers or a tiny bar) — only if it fits without clutter.

---

## MVP 1 scope checklist

### In scope for MVP 1

| Item | Detail |
|------|--------|
| **Summary API** | `GET /api/projects/[projectId]/insights` returning: `documentsProcessed`, `pendingReview`, `riskyShares` (or drop risky for MVP 1), `projectTimeline` (due date + state). |
| **Summary cards** | 3–4 cards: Documents processed, Pending review, and 1–2 of: Risky shares, Project due (e.g. “Due in X days” / “Overdue”), Stalled urgent count. |
| **Latest comments** | **Urgent only.** List of messages where `reactions.urgent` is non-empty; document name, snippet, author, time; link to document + comment thread. Max 10 items. |
| **Engagement health** | 2–3 compact rows: stalled urgent, no activity (7/14d), hot documents (top 3 by comments). |
| **Actionable insights** | Up to 6 items: Overdue documents, Unfinalized shares, **Stalled urgent**, **No activity**, Hot documents; optionally Project due soon / Risky share alert. Each with single “View” / “Open” CTA. |
| **Empty state** | “Connect a data source to see insights” when project has no (or very few) documents; “No urgent comments” when list is empty. |

### Explicitly out of scope for MVP 1

| Item | Defer to |
|------|----------|
| Activity feed (audit events) | Post–MVP 1 (or replace “Urgent comments” with “Recent activity” if product prefers). |
| Engagement snapshot, multiple charts, due date horizon chart | Full plan |
| Folder depth inefficiency | Full plan |
| “My actions” / Notifications strip | Full plan |
| Tabs (Recent / Trending / Storage / Sharing) | Full plan |
| Persona-specific show/hide (beyond existing project:can_view_internal) | Full plan |

---

## API: MVP 1 minimum

**Endpoint:** `GET /api/projects/[projectId]/insights`

**Response (minimum for MVP 1):**

```json
{
  "documentsProcessed": 12,
  "pendingReview": 2,
  "riskyShares": 0,
  "projectTimeline": {
    "dueDate": "2026-04-15",
    "state": "on_track",
    "daysRemaining": 29
  },
  "engagement": {
    "stalledUrgentCount": 3,
    "noActivityDays": 14,
    "hotDocuments": [
      { "documentId": "...", "documentName": "Scope-v3.docx", "commentCount7d": 9, "ctaUrl": "/.../files/..." }
    ]
  },
  "urgentComments": [
    {
      "id": "...",
      "documentId": "...",
      "documentName": "NDA-v2.docx",
      "snippet": "Please review section 3...",
      "authorUserId": "...",
      "authorEmail": "...",
      "createdAt": "..."
    }
  ],
  "insights": [
    { "id": "overdue", "label": "2 documents overdue", "count": 2, "ctaUrl": "/.../files?filter=overdue" },
    { "id": "unfinalized", "label": "1 share not finalized", "count": 1, "ctaUrl": "/.../shares" },
    { "id": "stalled_urgent", "label": "3 urgent comments stalled", "count": 3, "ctaUrl": "/.../insights?focus=urgent" }
  ]
}
```

- **urgentComments:** From `DocCommentMessage` where `projectId` matches and `reactions.urgent` is a non-empty array; order by `createdAt` desc; limit 10. Join document for `fileName` (as `documentName`).
- **stalledUrgentCount (“unanswered urgent comment”):** a message is counted as stalled if **both** are true:
  - **A:** there is **no subsequent comment** on the same document after that urgent message, and
  - **B:** the urgent message has **no ack reaction** (recommend treating `done` or `thumbs_up` as ack) in `reactions`.
- **noActivityDays:** derived from `PlatformAuditEvent` for the project (e.g. no events in last 7/14 days).
- **hotDocuments:** top 3 documents by comment count in last 7 days.
- **insights:** Derived from the same data. Front end renders up to 6 rows with one CTA each.

---

## UI: MVP 1 components

- Reuse **StatCard**-style blocks from org Insights (or simpler variant) for the 3–4 summary cards.
- **Urgent comments:** Single list; each row = document name, snippet (truncated), author, relative time, [Open] linking to document + comment thread.
- **Engagement health:** A compact list (2–3 rows) with counts + CTAs: stalled urgent, no activity, hot documents.
- **What needs attention:** List of insight rows; each row = short label + count (e.g. “2 documents overdue”) + one primary button/link (e.g. “View” → Files or Shares).

No tabs, no filters, no date pickers in MVP 1. Optional: “Last updated” or “Refreshed at” if we add polling or refetch.

---

## Success criteria for MVP 1

- Small firms see **one** Insights page with 3–4 numbers, one list (urgent comments), an engagement health strip, and up to 6 clear next steps.
- No information overload: no charts, no engagement snapshot, no folder depth, no activity feed (unless we swap in “Recent activity” instead of “Urgent comments” by product choice).
- Placeholder replaced with real data from the new project insights API; empty states are clear and actionable.

After MVP 1, expand incrementally using the [full Project Insights plan](project-insights-plan.md) (activity feed, folder depth inefficiency, visuals, persona matrix).
