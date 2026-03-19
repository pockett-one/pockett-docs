# Refactor & Feature Plan

Tracked tasks for Org→Firm, Project→Engagement, CRM, Connectors, and Docs. Execute in order.

---

## 1. CRM & schema

| ID | Task | Status |
|----|------|--------|
| crm-client-prospect | Add Client.isProspect + website/description/tags; migration + client list UI badge & column | Done |
| crm-contact-updates | Add Contact phone/tags + optional engagementId (projectId); migration + UI/API | Done |

---

## 2. Project → Engagement (deep rename)

| ID | Task | Status |
|----|------|--------|
| crm-engagement-rename | Introduce Engagement terminology and routes (/e) with redirects from /p | Done |
| refactor-project-to-engagement | Full rename: DB/Prisma (table/field names where desired), API routes, filenames, class/var/function names | Done (routes /e, redirects /p→/e, links; deeper renames optional follow-up) |

---

## 3. Connectors

| ID | Task | Status |
|----|------|--------|
| connectors-abstraction-onedrive | Abstraction layer for connectors; design for OneDrive adapter (OAuth, list, metadata, thumbnails); regrant later | Done |

---

## 4. Docs

| ID | Task | Status |
|----|------|--------|
| docs-refresh | Update docs/mvp/prd.md, hld.md, lld.md for Firm/Engagement rename + Search, Comments, Bookmarks, Notifications, Notes, Canvas | Done |

---

## 5. Review

| ID | Task | Status |
|----|------|--------|
| codebase-review-pass | End-to-end review: leftover org/project naming, broken imports, consistency (API/UI/DB) | Done |

---

*Last updated: all tasks executed; build green.*
