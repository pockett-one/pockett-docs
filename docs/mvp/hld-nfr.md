# HLD for Professional Client Portal for Document Delivery – Non-Functional Requirements & Gap Analysis (Internal)

**Status:** Internal only. Not for sharing with product customers.

This document holds the **current implementation baseline** (gaps vs prescribed approach) and **gap analysis** against ISO 27001 and ISO 27701. The prescribed approach only is in `hld.md`; gaps and current state are documented here.

---

## Current implementation baseline (gaps vs HLD prescription)

The following describes the **current** state at the time of this document. The prescribed approach for each area is in `hld.md` (Direct-to-Drive, Data & PII Protection, RLS, Enterprise Best Practices).

### Deployment Version Management

**Status:** ✅ **Implemented**

**Purpose:** Ensure user sessions are invalidated when code changes (new deployment), ensuring fresh permission cache after schema or permission logic updates.

**Implementation:**
- **Version Sources** (priority order):
  1. `DEPLOYMENT_VERSION` environment variable (set by CI/CD)
  2. `NEXT_PUBLIC_BUILD_TIMESTAMP` (set at build time)
  3. `DEV_SERVER_START_VERSION` (set at dev server start)
  4. Fallback: `package.json` version + timestamp

**Flow:**
1. Middleware checks `pockett-deployment-version` cookie on each request
2. If version mismatch → Clear session → Redirect to login
3. On login → Set new version cookie → Rebuild permission cache

**Key Distinction:** 
- **Deployment** (code changed) → Invalidate sessions ✅
- **Server restart** (same code) → Cache already lost in memory, rebuilds naturally ✅

**Rationale:** In-memory cache (`UserSettingsPlusCache`) is lost on every server restart. On restart with same code, cache rebuilds naturally on next request. Only need to invalidate sessions when code changes (new deployment) to ensure fresh permissions from updated schema/logic.

### Direct-to-Drive Upload Security

| Measure | Current implementation |
| ------- | ---------------------- |
| **Transport** | Browser → Google Drive over HTTPS (TLS 1.3). Portal API only returns a resumable upload URL. |
| **Server-side file handling** | None. No file bytes stored or proxied. |
| **Upload URL lifecycle** | API issues one-time resumable URL; client uploads directly to Drive. |
| **Token handling** | Connector OAuth tokens used server-side only to obtain upload URL; tokens not sent to browser. |
| **Validation** | Project and folder resolved from DB; upload URL scoped to project's Drive folder. |
| **Audit** | (Optional) Log upload init (who, project, folder) without file content. |

### Data & PII Protection

| Area | Current implementation |
| ---- | ---------------------- |
| **Row-Level Security (RLS)** | Access enforced in application layer only (Prisma queries filter by `organizationId` / `clientId` / `projectId`). No RLS policies at DB level. |
| **Encryption in transit** | HTTPS for all client–server and server–DB traffic. |
| **Encryption at rest (DB)** | Provided by DB host (e.g. Supabase/Postgres disk encryption). |
| **PII in database** | Email, names, and other PII stored in plaintext in PostgreSQL. |
| **Secrets** | Connector tokens and API keys in env / server config. |
| **Logging** | Structured logs; Sentry. |
| **Retention** | No formal policy. |

### RLS – Implementation Status

**Current State:** ✅ **RLS Implemented**

The **data model** (Prisma schema) is aligned: org-scoped tables have `organizationId`; project-scoped tables (`project_members`, `project_invitations`) have `projectId` and no direct `organizationId`. 

**RLS Policies:** Implemented with helper functions for efficient evaluation:
- `portal.get_current_user_organization_ids()`: Returns array of organization IDs user belongs to
- `portal.is_user_project_member(project_id)`: Checks if user is a member of a project
- `portal.is_user_client_member(client_id)`: Checks if user has access to a client

**Isolation Hierarchy:** Strict hierarchical isolation enforced:
- Organization level: Users can only see organizations they belong to
- Client level: Users can only see clients in their organizations AND have explicit access
- Project level: Users can only see projects they are members of AND parent hierarchy is verified
- Document level: Users can only see documents in projects they have access to

**Application Code:** Application code scopes queries by `organizationId` or `projectId` in `lib/actions` and API routes, providing defense-in-depth.

**Session Variables:** The app sets session variables at the start of each request (before any Prisma query): `SET LOCAL app.current_org_id = '<uuid>'; SET LOCAL app.current_user_id = '<uuid>';` (e.g. in middleware or an API wrapper that resolves org and user from the session). If these are not set, RLS policies return no rows for the protected tables.

**Migrations:** Migrations (`20260206000001_rbac_schema`, `20260206000002_admin_schema`, `20260206000003_portal_schema`) include full schema, seed data, and RLS policies.

### Enterprise Best Practices

| Practice | Current implementation |
| -------- | ---------------------- |
| **Access reviews** | Manual. |
| **SSO / SAML** | Google OAuth only. |
| **Audit logging** | Ad hoc. |
| **Backup & DR** | DB backups as per provider. |
| **Incident response** | — |
| **Compliance** | — |

---

## ISO 27001 & ISO 27701 – current adherence

This section maps the **current** implementation (as described in `hld.md`) to typical ISO 27001 (ISMS) and ISO 27701 (PII / privacy) control expectations. “Current” = app-layer access control, no RLS applied in DB yet, PII in plaintext in DB, HTTPS, secrets in env, Supabase encryption at rest, no formal audit log or incident runbooks.

### ISO 27001 (information security) – typical control themes

| Control area | ISO 27001 (typical) | Current implementation | Adheres? | Gap |
| ------------ | -------------------- | ----------------------- | -------- | --- |
| **Access control (logical)** | A.9: Restrict access to information and systems; user access management; access rights review. | Access enforced in **application layer** (Prisma filters) AND **database layer** (RLS policies). Supabase Auth for identity. RLS implemented with helper functions. | **Yes** | — |
| **Cryptography** | A.10: Use crypto for confidentiality/integrity; policy on use; **key management** (protection, lifecycle). | **Transit:** HTTPS. **At rest:** Supabase/Postgres disk encryption. **Application-level:** No field encryption; PII stored in plaintext. Keys: DB credentials and app secrets in env (Vercel). | **Partial** | No field-level encryption; no formal key management policy or key-in-KMS/HSM. |
| **Operations security** | A.12: Logging, monitoring, change management, vulnerability management, backup. | Logging: ad hoc; no immutable audit log. Backups: as per Supabase. Change/vulnerability: no formal process documented here. | **Partial** | No defined audit log for sensitive actions; no documented change/vuln process. |
| **Communications security** | A.13: Protect information in transit. | HTTPS for client–server; TLS for DB (Supavisor). | **Yes** | — |
| **System acquisition & development** | A.14: Secure development, supply chain. | Not described in HLD (codebase practices apply). | **Not assessed** | Out of scope of this doc. |
| **Supplier relationships** | A.15: Agreements, monitoring (e.g. Supabase, Vercel). | Use of Supabase, Vercel, Google; no explicit DPA/security terms referenced here. | **Partial** | DPAs and supplier security expectations should be documented. |
| **Incident management** | A.16: Events and incidents; response procedures. | No runbook or incident process described. | **No** | Define incident response and breach notification process. |
| **Business continuity** | A.17: Backup, recovery. | DB backups as per provider; no RPO/RTO or tested restore documented. | **Partial** | Document and test restore; define RPO/RTO. |
| **Compliance** | A.18: Legal/contractual requirements; audit. | No mapping to ISO/SOC/GDPR or internal audit. | **No** | Map controls to ISO 27001/27701; maintain evidence for audit. |

### ISO 27701 (PII / privacy) – extends 27001 for PII processing

| Control area | ISO 27701 (typical) | Current implementation | Adheres? | Gap |
| ------------ | -------------------- | ----------------------- | -------- | --- |
| **PII collection & purpose** | Purpose limitation; lawful basis; consent where required; minimization. | Product design implies purpose (workspace, projects, invitations). No explicit purpose/consent/minimization doc in HLD. | **Partial** | Document purposes, lawful basis, and minimization for each PII category. |
| **PII confidentiality** | Protect PII (e.g. encryption, access control). | **Access:** App-layer AND DB-layer (RLS policies). **Encryption:** Transit yes; at rest (disk) yes; **field-level no** — PII (e.g. email) in plaintext in DB. | **Partial** | Field-level or column-level encryption for PII (or justify exception). RLS provides DB-level access control. |
| **PII access & disclosure** | Limit who can access PII; log access if required. | App restricts by org/project. RLS enforces access at DB level. No dedicated PII access log. | **Partial** | Consider logging access to PII for audit purposes. |
| **PII retention & disposal** | Retain only as long as needed; secure disposal. | No retention or disposal policy described. | **No** | Define retention per PII type; deletion/anonymization procedure. |
| **Breach notification** | Process to detect and notify breaches (e.g. GDPR 72h). | No incident/breach process described. | **No** | Define breach detection and notification process. |
| **Privacy by design** | Embed privacy in design (minimize, pseudonymize, etc.). | Multi-tenancy and app-layer scoping support isolation; PII not encrypted in DB. | **Partial** | Add encryption of PII at rest (field-level) and document privacy design choices. |

### Summary

- **What the current implementation does adhere to (or partially):** HTTPS/TLS (transit); encryption at rest (disk) via Supabase; application-layer AND database-layer (RLS) access control and multi-tenancy; secrets in env (no keys in logs); deployment version management for cache invalidation. For ISO 27001: communications security (A.13) and access control (A.9) are in place; cryptography is partial (no field encryption). For ISO 27701: purpose and minimization can be documented; confidentiality of PII in DB is partially met (RLS provides access control, but no field encryption).
- **What it does not adhere to currently:** (1) **Field-level encryption** of PII (e.g. email) not implemented; PII in plaintext in DB. (2) **Audit logging** for sensitive actions not defined. (3) **Incident/breach** process and **retention/disposal** not documented. (4) **Compliance mapping** (ISO 27001/27701, evidence for audit) not done. (5) **Supplier/DPA** and **backup/DR** (RPO/RTO, tested restore) not documented.

Closing these gaps (RLS, field encryption or justified exception, audit log, incident and retention policies, compliance mapping) would move the implementation toward ISO 27001 and ISO 27701 alignment. Using a **secret in Vercel env** for field encryption (as described in `hld.md` under “Do you strictly need an external KMS?”) is technically and often certification-acceptable if key handling is documented and keys are protected; an external KMS strengthens key management and eases auditor acceptance.
