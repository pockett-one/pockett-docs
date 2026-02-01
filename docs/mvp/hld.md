# High-Level Design (HLD): Pockett Docs MVP

This document describes the high-level architecture of the Pockett Docs MVP using Mermaid diagrams. It aligns with the [PRD](prd.md) and [Roadmap](roadmap.md).

**How to view the diagrams (Markdown Preview Mermaid Support):**
1. Open this file (`hld.md`) and use **Markdown: Open Preview** (**Cmd+Shift+V** / **Ctrl+Shift+V**) — *not* another extension’s preview (e.g. “Markdown Preview Enhanced”).
2. **If diagrams disappear after closing and reopening the preview:** Use **Markdown: Open Preview to the Side** (**Cmd+K V** / **Ctrl+K V**) and keep that preview pane open. The side preview tends to re-render Mermaid more reliably than reopening a closed tab. If it still doesn’t show diagrams, run **Developer: Reload Window** (Cmd+Shift+P → “Reload Window”), then open preview again.
3. Alternative: copy a `mermaid` code block into [mermaid.live](https://mermaid.live) or push and view on GitHub.

---

## 1. System Context (C4 Level 1)

Users interact with the Pockett web application. Pockett uses Google Drive for file storage, Supabase for authentication, and PostgreSQL (Supavisor) for application data.

```mermaid
flowchart TB
    subgraph Users
        U[User]
    end

    subgraph Pockett["Pockett Docs"]
        direction TB
        APP[Web Application]
    end

    subgraph External["External Systems"]
        DRIVE[Google Drive API]
        SUPABASE[Supabase Auth]
        DB[(PostgreSQL)]
    end

    U -->|"HTTPS"| APP
    APP -->|"OAuth2 / Drive API"| DRIVE
    APP -->|"Auth / Session"| SUPABASE
    APP -->|"Prisma / SQL"| DB
```

---

## 2. Container Diagram (C4 Level 2)

The web application is a Next.js app comprising the browser UI and API routes. Application data is stored in PostgreSQL; file content lives in Google Drive.

```mermaid
flowchart TB
    subgraph User
        BROWSER[Browser]
    end

    subgraph Pockett["Pockett Docs - Next.js"]
        direction TB
        FE[Frontend<br/>Next.js App Router<br/>React Components]
        API[API Routes<br/>Next.js Route Handlers]
        FE --> API
    end

    subgraph Data["Data & External"]
        PRISMA[Prisma ORM]
        PG[(PostgreSQL<br/>Supavisor)]
        DRIVE[Google Drive API]
        AUTH[Supabase Auth]
    end

    BROWSER -->|"SSR / Client Nav"| FE
    FE -->|"fetch / Server Actions"| API
    API --> PRISMA
    API -->|"Drive API calls"| DRIVE
    API -->|"Session / JWT"| AUTH
    PRISMA --> PG
```

---

## 3. Authentication Flow

Users sign in with Google (Supabase). Session is used for API authorization and for obtaining a Google access token (e.g. for Drive Picker and Drive API).

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as API Routes
    participant Supabase as Supabase Auth
    participant Drive as Google Drive

    U->>FE: Sign in (Google)
    FE->>Supabase: OAuth / signInWithOAuth
    Supabase->>U: Redirect to Google
    U->>Supabase: Callback with code
    Supabase->>FE: Session (access_token, refresh_token)
    FE->>FE: Store session (e.g. cookie / context)

    Note over U,Drive: Using app (e.g. File list / Picker)
    FE->>API: Request (Bearer session.access_token)
    API->>API: Validate session (Supabase)
    API->>API: Get or refresh Google token
    API->>Drive: files.list, create folder, etc.
    Drive->>API: Response
    API->>FE: JSON
```

---

## 4. Project File List & Upload Flow

File browser lists contents of the project’s Drive folder. Uploads go directly from the browser to Google Drive (resumable upload); the API only issues the upload URL and metadata.

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as API Routes
    participant Drive as Google Drive

    Note over U,Drive: List files
    FE->>API: GET folder children with Bearer
    API->>API: Resolve project and connector token
    API->>Drive: files.list for folderId
    Drive->>API: File list
    API->>FE: JSON (files)
    FE->>U: Render table (breadcrumbs, sort, filter)

    Note over U,Drive: Upload file (direct to Drive)
    U->>FE: Select file(s)
    FE->>API: POST init resumable upload (metadata, Bearer)
    API->>Drive: Create file / get resumable upload URL
    Drive->>API: Upload URL
    API->>FE: Upload URL
    FE->>Drive: PUT file bytes (XHR, progress)
    Drive->>FE: 200 OK
    FE->>U: Update queue, show file location optional
```

---

## 5. Core Data Model (Simplified)

Organizations contain Clients and Connectors. Projects belong to a Client and reference a Drive folder. Members and Invitations are scoped to Organization and Project; Personas define project-level roles.

```mermaid
erDiagram
    Organization ||--o{ Client : has
    Organization ||--o{ Connector : has
    Organization ||--o{ Project : has
    Organization ||--o{ ProjectPersona : has
    Client ||--o{ Project : has
    Project ||--o{ ProjectMember : has
    Project ||--o{ ProjectInvitation : has
    Project }o--o| Connector : "Drive via org connector"
    ProjectPersona ||--o{ ProjectMember : "persona"
    ProjectPersona ||--o{ ProjectInvitation : "persona"
    Organization ||--o{ OrganizationMember : has
    Role ||--o{ OrganizationMember : "role"
    Role ||--o{ ProjectPersona : "role"

    Organization {
        uuid id PK
        string name
        string slug UK
    }
    Client {
        uuid id PK
        uuid organizationId FK
        string name
        string slug
    }
    Project {
        uuid id PK
        uuid clientId FK
        string name
        string slug
        string driveFolderId
    }
    Connector {
        uuid id PK
        uuid organizationId FK
        string type
        string accessToken
    }
    ProjectPersona {
        uuid id PK
        uuid organizationId FK
        uuid roleId FK
        string name
        json permissions
    }
    ProjectMember {
        uuid id PK
        uuid projectId FK
        uuid userId
        uuid personaId FK
    }
    ProjectInvitation {
        uuid id PK
        uuid projectId FK
        string email
        uuid personaId FK
        string status
        string token UK
    }
```

---

## 6. Deployment Context

Next.js is built and deployed (e.g. Vercel). PostgreSQL is hosted (e.g. Supabase/Supavisor). Environment distinguishes runtime URL (transaction pooler) vs migration URL (session pooler).

```mermaid
flowchart LR
    subgraph Build["Build (e.g. Vercel)"]
        NEXT[Next.js build]
        MIGRATE[Prisma migrate deploy]
        NEXT --> MIGRATE
    end

    subgraph Runtime["Runtime"]
        APP[Next.js App]
    end

    subgraph Data["Data"]
        PG[(PostgreSQL)]
    end

    Build --> Runtime
    APP -->|"DATABASE_URL (pooler)"| PG
    Build -->|"DIRECT_URL (migrations)"| PG
```

---

## References

- [PRD](prd.md) – Product requirements and feature list
- [Roadmap](roadmap.md) – Milestones and schedule
- [AGENTS.md](../../AGENTS.md) – Database migrations, Vercel, Git workflow
