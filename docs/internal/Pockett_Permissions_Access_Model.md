# Pockett – Permissions & Access Control Model  
**Status:** Authoritative  
**Audience:** Product, Backend, Frontend, AI Agents (Cursor / Antigravity)  
**Goal:** Simple, explicit, future-proof access control aligned with Google Drive.

---

## 1. Design Principles

1. **Hierarchy is King:** Organization > Client > Project  
2. **No Role Explosion:** Keep identities simple.  
3. **Capabilities > Roles:** Access is defined by what you can *do*, not who you *are*.  
4. **Google Drive is Truth:** File permissions mirror Drive exactly.  
5. **Explicit or Derived:** Access is either explicitly granted (Projects) or effectively derived (Client Portals).  
6. **Access Clarity:** The product's core value is showing exactly who has access.

**Rule:** If a permission is not explicitly granted (or logically derived), it does not exist.

---

## 2. Core Hierarchy

The data model follows a strict containment hierarchy:

1. **ORGANIZATION (Root)**  
   - The tenant (Accounting Firm).  
   - Owns all data, billing, and staff.

2. **CLIENT (Engagement Portal)**  
   - **Monetization Unit:** We charge per Client Portal.  
   - Represents a customer of the firm (e.g., "Acme Corp").  
   - Example: A firm has 50 Clients -> 50 Engagement Portals.

3. **PROJECT (Folder/Workspace)**  
   - The functional unit of work (e.g., "Tax Return 2024", "Monthly Bookkeeping").  
   - Maps 1:1 to a specific Google Drive Folder.  
   - **Access Granting Layer:** This is where users are invited.

---

## 3. Role Model (Identity Only)

Roles define **who a user is** within the ORGANIZATION.

### System Role
- `SYSTEM_ADMIN`: Platform superuser (Support/Eng only).

### Organization Roles
These apply to the **Accounting Firm's Team**:

| Role | Target Persona | Capabilities |
|---|---|---|
| `ORG_OWNER` | Partner / Owner | Full Org Control, Billing, All Clients, All Projects |
| `ORG_MEMBER` | Accountant / Staff | Can be assigned to Clients/Projects |

### 3. Persona Mapping (The "Who")

We handle the three key business personas using our identity roles + capabilities matrix. This avoids creating rigid "Contractor" or "Vendor" roles that struggle with edge cases.

| Persona | Pockett Identity | Typical Capabilities | Access pattern |
|---|---|---|---|
| **ORG INTERNAL**<br>(Employee) | `ORG_MEMBER` | `can_view`, `can_edit`, `can_manage` | Can be assigned to any Client/Project. Can create Projects. |
| **ORG CONTRACTOR**<br>(Vendor/Augment) | `ORG_GUEST` | `can_edit` | Invited to specific Projects to do work. No billing/org access. |
| **ORG CLIENT**<br>(Customer) | `ORG_GUEST` | `can_view` (Derived) | Sees what is shared. Can upload only if explicit `can_edit` given. |

### How to manage this without overhead?

1. **Internal Staff:** Onboard once as `ORG_MEMBER`. They can self-serve on Projects they create.
2. **Contractors:** Invite to the specific **Key Project** (e.g. "Monthly Bookkeeping"). They get access to just that context. No need to manage distinct "Vendor" permissions.
3. **Clients:** Access is zero-touch. It is **derived** from the fact you shared a Project with them. No "Manage Client Permissions" screen needed.

---

## 4. Client & Project Access Model

### How Access Works (The "Drive" Model)

We do **not** have a `CLIENT_MEMBER` role.  
We do **not** have a `PROJECT_MEMBER` role.

Instead, we use **Capabilities** attached to Projects, which *derive* Client Portal visibility.

#### A. Project Access (The Source of Truth)
Permissions are granted at the **Project** level (matching Drive folders).

| Capability | Drive Equivalent | Description |
|---|---|---|
| `can_view` | Viewer | View files, download, comment. |
| `can_edit` | Editor | Upload, edit, delete files. |
| `can_manage` | Owner/Manager | Manage access, change settings. |

#### B. Client Portal Visibility (Derived)
Access to a Client Portal is **derived** from Project access.

- **Rule:** If a user has `can_view` access to *any* Project within Client X, they automatically gain `can_view` access to Client X's **Portal**.
- This ensures that if you share a folder with a client, they can log in and see their Portal (and that specific folder inside it) without extra admin work.

---

## 5. Permission Truth Table

### Identity + Capability Matrix

| Org Role | Context | Access Level | Use Case |
|---|---|---|---|
| `ORG_OWNER` | **Any Client** | **Full Admin** | Firm Partner overseeing all accounts. |
| `ORG_MEMBER` | **Assigned Client** | **Edit/Manage** | Accountant working on specific client. |
| `ORG_GUEST` | **Client Portal** | **Derived (View)** | Client viewing their dashboard. |
| `ORG_GUEST` | **Specific Project** | **Project Access** | Client uploading docs to "Tax 2024". |

---

## 6. Database Schema (Reference)

### organizations
```sql
organizations (
  id UUID PRIMARY KEY,
  name TEXT,
  slug TEXT UNIQUE, -- e.g. /o/my-cpa-firm
  created_at TIMESTAMP
)
```

### customers (Clients)
The Monetization Unit.
```sql
customers (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  name TEXT, -- e.g. "Acme Corp"
  plan_tier ENUM('CUST_FREE', 'CUST_PRO'), -- Subscription attached here
  created_at TIMESTAMP
)
```

### projects
Must belong to a Customer (Client).
```sql
projects (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  customer_id UUID REFERENCES customers(id), -- REQUIRED Link
  name TEXT,
  drive_folder_id TEXT,
  created_at TIMESTAMP
)
```

### project_access (Single Source of Truth)
This effectively replaces `ProjectMember`. Or `ProjectMember` can be this table.
```sql
project_members (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES users(id),
  -- Capabilities
  can_view BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_manage_access BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NULL
)
```

---

## 7. Operational Flows

### 1. Onboarding a Client
1. Firm creates `Customer`: "Smith Family Trust".
2. Firm creates `Project`: "2024 Tax Return" (linked to Drive Folder).
3. Firm invites `john.smith@gmail.com` to "2024 Tax Return" (as `can_edit`).
   - John gets email.
   - John logs in.
   - John sees "Smith Family Trust" Portal (Derived).
   - John sees "2024 Tax Return" Project (Explicit).

### 2. Monetization Check
- When accessing `/c/[client_id]/**`:
  - Check `customers.plan_tier`.
  - If `CUST_FREE` -> Feature Gating applying.
  - If `CUST_PRO` -> Full features.

### 3. Client Exit
- Dashboard shows all External Users (`ORG_GUEST`) with access to Client's projects.
- "Revoke All" iterates through all projects in that Client and removes the user's access.

---

## 8. What NOT to Build
❌ **Client Roles:** Do not create `CLIENT_ADMIN` or `CLIENT_VIEWER`. It creates sync hell.  
❌ **Implicit Project Access:** Being an `ORG_MEMBER` does not *mechanically* grant Google Drive access automatically (unless we implement group syncing). Stick to explicit invites for non-owners.

---

## 9. Final Authority
This model prioritizes **Client-centricity** for business logic (billing, organization) but remains **Project-centric** for permissions (Drive sync). This is the "Pockett Hybrid Model".
