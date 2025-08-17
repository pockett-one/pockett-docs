# 📄 Product Requirements Document (PRD)
**Product Name:** Pockett (working title)  
**Version:** v0.1  
**Owner:** You  
**Date:** August 2025  

---

## 🎯 Product Goal
Enable users to connect their **Google Drive / Docs** to a central workspace, organize files into projects, manage sharing, view engagement insights, and prepare the foundation for later **AI-powered search/organization**.  

---

## 🖥 UX Mock Screens  

*(Textual wireframes; think Figma-lite mockups)*

### 1. **Home Dashboard**
```
-------------------------------------------------
| Pockett Logo     | [Connect Google Drive]      |
-------------------------------------------------
| My Projects                                     |
-------------------------------------------------
| Project A   | Files: 45 | Last Accessed: Today |
| Project B   | Files: 120| Last Accessed: 1 mo  |
| Project C   | Files: 8  | Last Accessed: 3 mos |
-------------------------------------------------
[+ Create Project]
```

### 2. **Project Detail View**
```
Project: Project A
-------------------------------------------------
| File Name          | Owner   | Last Accessed  |
-------------------------------------------------
| Doc1.md            | Me      | Today          |
| Spec.docx          | Alice   | Yesterday      |
| Plan.pdf           | Bob     | 2 weeks ago    |
-------------------------------------------------
[Bar Chart: Engagement]
[Pie Chart: File Types]
-------------------------------------------------
Options: [Share Settings] [Export Digest] [Summary]
```

### 3. **Sharing Settings**
```
Project A - Sharing
-------------------------------------------------
| Mode: Private / Team / External                |
| Expiry: [30 days ▼]                            |
-------------------------------------------------
[Save]
```

### 4. **Document Summary (On Demand)**
```
Spec.docx - Summary
-------------------------------------------------
"This document outlines the requirements for..."
-------------------------------------------------
[Smart Tagging Suggestion: 'requirements', 'api']
```

---

## 🚀 Phase I (MVP)

### Features
1. **Project Organization**
   - Connect Google Drive (OAuth flow).
   - Import files/folders into a Project.
   - Store `.pockett` metadata (project name, team name, sharing settings) in DB and/or hidden file in Drive.

2. **Sharing Control**
   - Private (only user).
   - Team (selected Google group/email list).
   - External (shareable link).
   - Expiry date for access.

3. **Engagement Tracking**
   - Classify file access by **Today / This Week / This Month / This Quarter / >3 months**.
   - Bar chart visualization.

4. **Basic Statistics**
   - Pie chart of files by extension (Docs, Sheets, PDFs, Images).
   - Count of files per project.

5. **Document Summarization (Single File)**
   - Export Doc → summarize via simple LLM call (or rule-based for MVP).
   - Use for **temporary smart tagging**.

6. **Offline Access (Optional MVP Stretch)**
   - Allow project metadata + recent files to be cached locally.
   - Basic “offline mode” toggle.

### Technical Requirements
- **Backend:** FastAPI (Python) or Node.js (Express/Nest).  
- **DB:** Postgres with JSON fields for metadata.  
- **Google APIs:** Drive API, Docs API.  
- **Sync:**  
  - Initial tree fetch at onboarding.  
  - Changes feed + webhook listener for updates.  
  - Nightly sync job for consistency.  
- **Auth:** Google OAuth 2.0 with `drive.metadata.readonly`, `docs.readonly`, `drive.file` scopes.  
- **Storage:** Metadata only, no file storage (Drive is source of truth).  

---

## 🌱 Phase II (Enhancements)

### Features
1. **Smart Search**
   - Full-text search across Docs/metadata.
   - Filters: project, tags, date, owner.
   - Potential embedding-based semantic search.

2. **Smart Organization**
   - Auto-suggest project grouping based on:
     - File names.
     - Shared users.
     - Access patterns.  

3. **Workflow & Approvals**
   - Request approval before sharing externally.
   - Notify team when doc changes.
   - Track approval status in `.pockett` metadata.

4. **Advanced Summarization**
   - Multi-doc summary (e.g., weekly digest).
   - Auto-tagging + category clustering.

5. **Analytics Dashboard**
   - Project activity over time (line chart).
   - Top collaborators.
   - Inactive files/projects recommendations.

### Technical Enhancements
- Add **vector DB** (Weaviate, Pinecone, or Postgres+pgvector) for semantic search.  
- Add **Redis** for sync caching.  
- Add **event-driven architecture** (Kafka or lightweight Pub/Sub) for handling large Drive changes at scale.  
- Introduce **graph DB** (Neo4j) if relationships become complex (Projects ↔ Files ↔ Users).  

---

## ⚖️ Dependencies / Risks
- Google API quotas (must request higher limits if scaling).  
- Handling **very large Drives** (thousands of files → sync strategy critical).  
- Security/privacy compliance (sensitive docs → must store **metadata only**).  
- Offline sync complexity.  
