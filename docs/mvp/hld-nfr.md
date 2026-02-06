# HLD for Professional Client Portal for Document Delivery – Non-Functional Requirements & Gap Analysis (Internal)

**Status:** Internal only. Not for sharing with product customers.

This document holds the **current implementation baseline** (gaps vs prescribed approach) and **gap analysis** against ISO 27001 and ISO 27701. The prescribed approach only is in `hld.md`; gaps and current state are documented here.

---

## Current implementation baseline (gaps vs HLD prescription)

The following describes the **current** state at the time of this document. The prescribed approach for each area is in `hld.md` (Direct-to-Drive, Data & PII Protection, RLS, Enterprise Best Practices).

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

### RLS – current state vs strategy

The **data model** (Prisma schema) is aligned: org-scoped tables have `organizationId`; project-scoped tables (`project_members`, `project_invitations`) have `projectId` and no direct `organizationId`. **Application code** scopes queries by `organizationId` or `projectId` in `lib/actions` and API routes. **Migrations:** A squashed migration (`20260124000000_squashed_init_rls`) includes full schema, seed data, and RLS policies. **For RLS to take effect**, the app must set session variables at the start of each request (before any Prisma query): `SET LOCAL app.current_org_id = '<uuid>'; SET LOCAL app.current_user_id = '<uuid>';` (e.g. in middleware or an API wrapper that resolves org and user from the session). If these are not set, RLS policies return no rows for the protected tables.

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
| **Access control (logical)** | A.9: Restrict access to information and systems; user access management; access rights review. | Access enforced in **application layer** only (Prisma filters by `organizationId` / `projectId`). Supabase Auth for identity. No RLS in DB yet. | **Partial** | RLS not applied; DB-level access restriction missing. Session variables for RLS not set. |
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
| **PII confidentiality** | Protect PII (e.g. encryption, access control). | **Access:** App-layer only; no RLS. **Encryption:** Transit yes; at rest (disk) yes; **field-level no** — PII (e.g. email) in plaintext in DB. | **No** | Field-level or column-level encryption for PII (or justify exception); RLS for DB-level access. |
| **PII access & disclosure** | Limit who can access PII; log access if required. | App restricts by org/project. No dedicated PII access log. | **Partial** | Consider logging access to PII; RLS to enforce access at DB. |
| **PII retention & disposal** | Retain only as long as needed; secure disposal. | No retention or disposal policy described. | **No** | Define retention per PII type; deletion/anonymization procedure. |
| **Breach notification** | Process to detect and notify breaches (e.g. GDPR 72h). | No incident/breach process described. | **No** | Define breach detection and notification process. |
| **Privacy by design** | Embed privacy in design (minimize, pseudonymize, etc.). | Multi-tenancy and app-layer scoping support isolation; PII not encrypted in DB. | **Partial** | Add encryption of PII at rest (field-level) and document privacy design choices. |

### Summary

- **What the current implementation does adhere to (or partially):** HTTPS/TLS (transit); encryption at rest (disk) via Supabase; application-layer access control and multi-tenancy; secrets in env (no keys in logs). For ISO 27001: communications security (A.13) is in place; access control and cryptography are partial (no RLS, no field encryption). For ISO 27701: purpose and minimization can be documented; confidentiality of PII in DB is not yet met.
- **What it does not adhere to currently:** (1) **RLS** not applied; session variables not set. (2) **Field-level encryption** of PII (e.g. email) not implemented; PII in plaintext in DB. (3) **Audit logging** for sensitive actions not defined. (4) **Incident/breach** process and **retention/disposal** not documented. (5) **Compliance mapping** (ISO 27001/27701, evidence for audit) not done. (6) **Supplier/DPA** and **backup/DR** (RPO/RTO, tested restore) not documented.

Closing these gaps (RLS, field encryption or justified exception, audit log, incident and retention policies, compliance mapping) would move the implementation toward ISO 27001 and ISO 27701 alignment. Using a **secret in Vercel env** for field encryption (as described in `hld.md` under “Do you strictly need an external KMS?”) is technically and often certification-acceptable if key handling is documented and keys are protected; an external KMS strengthens key management and eases auditor acceptance.
