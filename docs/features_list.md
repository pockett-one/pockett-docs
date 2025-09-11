# 📄 Product Requirements Document (PRD)  
**Product Name**: (Working name: Pockett Docs)  
**Core Promise**: *“Bring order to your Docs.”*  

---

## 🎯 Vision & Goal  
Freelancers, consultants, and small agencies struggle with messy Google Drives, risky sharing, and client onboarding/offboarding overhead. Our app provides:  
- **Simple insights & control** over their Google Drive.  
- **Flat pricing** that avoids per-user subscription hell.  
- **Project-focused collaboration** without the baggage of Google Workspace.  

---

## 👥 Target Customers  
- Freelancers (designers, developers, writers, accountants, lawyers).  
- Independent consultants & coaches.  
- Small agencies (marketing, design, dev) with <50 collaborators.  
- Students/researchers with project-based collaborations.  

---

## 💰 Subscription Tiers & Feature Sets  

### **1. Free Tier — Insights Only**  
🔎 *Surface the problems, no remediation.*  

- **Browse & Metadata Sync**: Connect Google Drive, fetch file/folder tree.  
- **Analytics Dashboard**:  
  - Most accessed files (7 days).  
  - Largest unused files (90+ days).  
  - Risky shares (e.g. “Anyone with link = Editor”).  
- **Insights Cards (Read-Only)**: Show user risks & inefficiencies.  
- **No actions possible** (read-only).  

👉 *Conversion driver: show the “mess” in Drive, nudge upgrade to fix.*  

---

### **2. Pro Tier — $29/month — Individual Productivity**  
🧑‍💻 *For freelancers & solo consultants.*  

- All Free features, plus:  
- **Watchlist**: Pin important docs for quick access.  
- **Due Dates & Reminders** for key docs.  
- **Storage Cleanup Tools**:  
  - Detect duplicates & near-duplicates.  
  - Find unused large files for deletion/archival.  
- **One-at-a-time Summaries**: Generate summaries for tagging/smart organization.  

👉 *Promise: “Keep your Google Drive lean, organized, and under control.”*  

---

### **3. Team Tier — $49/month flat — up to 50 collaborators**  
👥 *For agencies & teams with rotating clients.*  

- All Pro features, plus:  
- **Project Team Spaces**: Group docs/folders into project workrooms.  
- **Shared Watchlists**: Team-pinned docs.  
- **Assignment Board (Workload View)**:  
  - Columns = collaborators (Editors, Commenters, Viewers).  
  - Rows = documents assigned.  
  - Drag-and-drop assignment.  
  - Permissions sync with Drive automatically.  
- **Access Lifecycle Management**:  
  - Auto-expire/revoke external access after project completion.  
  - One-click revoke all external shares.  
- **Team Engagement Digest**: Weekly summary of doc access across projects.  
- **Client Portal Links**: Branded, expiring, read-only links for clients.  

👉 *Promise: “Collaborate with clients and subcontractors without per-user billing. Secure, project-based document control.”*  

---

## 🚀 Phased Roadmap  

### **Phase I (MVP)**  
- Connect Google Drive (OAuth, API).  
- Fetch file metadata → store in Postgres/Supabase.  
- Build Dashboard: Insights cards (access, storage, shares).  
- Free Tier live.  

### **Phase II**  
- Pro Tier features: Watchlist, reminders, cleanup tools, summaries.  
- Team Tier features: Project Spaces, Shared Watchlists, Assignment Board.  
- Access lifecycle management.  
- Weekly digests.  
- Client Portal (read-only links).  

---

## 📊 Success Metrics  
- **Acquisition**: Waitlist signups → 20% conversion to app connection.  
- **Engagement**: % of users who check Insights weekly.  
- **Conversion**: % Free → Pro (target 5%), % Pro → Team (target 2%).  
- **Retention**: Churn <5% monthly.  
- **Value validation**: “Time saved” and “reduced risks” in user surveys.  

---

## 🛠️ Technical Considerations  
- **Database**: Postgres (Supabase) for relational structure + JSONB for raw metadata.  
- **Frontend**: Next.js + IndexedDB for caching metadata client-side.  
- **Sync**: Incremental sync with Google Drive changes API to avoid hitting rate limits.  
- **Security**: OAuth2 with Google, no password storage.  
- **Scalability**: Team tier capped at 50 active collaborators (fits freelancer/SMB sweet spot).  

---

## ❌ Out of Scope (for now)  
- Full Kanban/project management boards (avoid feature creep).  
- Deep workflow automation (e.g., approval chains).  
- Multi-cloud integrations (Dropbox, Box, OneDrive) until Google Drive PMF validated.  