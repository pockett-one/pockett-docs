# Encryption Analysis: Database Schema Review

**Purpose:** Identify data points that require encryption to protect PII and end-user business information.

**Schemas Reviewed:**
- `auth` (Supabase Auth - managed by Supabase)
- `portal` (Application data)
- `admin` (Admin/internal data)

---

## 1. Supabase Auth Schema (`auth.users`)

**Note:** Supabase manages the `auth.users` table. We don't control its schema directly, but we can identify what's stored there.

### Fields in `auth.users` (Supabase-managed):
- `id` (UUID) - **No encryption needed** (identifier)
- `email` - **⚠️ PII - Should be encrypted** (if we had control, but Supabase manages this)
- `encrypted_password` - Already encrypted by Supabase ✅
- `email_confirmed_at` - **No encryption needed** (timestamp)
- `raw_user_meta_data` (JSONB) - **⚠️ May contain PII** (name, avatar_url, etc.)
- `raw_app_meta_data` (JSONB) - **⚠️ May contain sensitive app data**
- `created_at`, `updated_at` - **No encryption needed** (timestamps)

**Recommendation:** 
- Supabase already encrypts passwords
- Email is managed by Supabase (we can't encrypt it there)
- Metadata fields (`raw_user_meta_data`, `raw_app_meta_data`) - Review what's stored; avoid storing sensitive PII here if possible

---

## 2. Portal Schema - PII Fields (Require Encryption)

### 🔴 **HIGH PRIORITY - PII Fields**

#### `portal.connectors`
| Field | Type | Sensitivity | Encryption Required? | Reason |
|-------|------|-------------|---------------------|--------|
| `email` | String | **HIGH** | ✅ **YES** | PII - Google account email |
| `name` | String? | **MEDIUM** | ✅ **YES** | PII - Display name |
| `avatarUrl` | String? | **LOW** | ⚠️ Optional | URL only, but may contain PII |
| `accessToken` | String | **CRITICAL** | ✅ **YES** | OAuth token - sensitive secret |
| `refreshToken` | String? | **CRITICAL** | ✅ **YES** | OAuth refresh token - sensitive secret |
| `externalAccountId` | String | **MEDIUM** | ⚠️ Consider | Provider account identifier (e.g. Google sub, Dropbox account id); unique per org+type |

**Current State:** **`accessToken` and `refreshToken`** — ✅ **Encrypted at rest** (AES-256-GCM via `lib/encryption.ts`; key versioning with `ENCRYPTION_KEY_V1`, `ENCRYPTION_KEY_V2`, … and `CURRENT_KEY_VERSION`; Prisma client extension encrypts on write, decrypts on read; lazy re-encryption on access for key rotation). **`email`, `name`** — still plaintext ❌

#### `portal.project_invitations`
| Field | Type | Sensitivity | Encryption Required? | Reason |
|-------|------|-------------|---------------------|--------|
| `email` | String | **HIGH** | ✅ **YES** | PII - Invitee email address |
| `token` | String | **MEDIUM** | ⚠️ Hash instead | Invitation token (hash for lookup, don't encrypt) |

**Current State:** Email stored in plaintext ❌

#### `portal.customer_requests`
| Field | Type | Sensitivity | Encryption Required? | Reason |
|-------|------|-------------|---------------------|--------|
| `userEmail` | String? | **HIGH** | ✅ **YES** | PII - User email |
| `description` | String | **MEDIUM** | ⚠️ Consider | May contain sensitive business info |
| `errorDetails` | Json? | **MEDIUM** | ⚠️ Consider | May contain sensitive error info |

**Current State:** Email stored in plaintext ❌

---

## 3. Portal Schema - Business Information (Require Encryption)

### 🔴 **HIGH PRIORITY - Business Information**

#### `portal.organizations`
| Field | Type | Sensitivity | Encryption Required? | Reason |
|-------|------|-------------|---------------------|--------|
| `name` | String | **HIGH** | ✅ **YES** | Business name (e.g., "Acme CPA Firm") |
| `slug` | String | **MEDIUM** | ❌ No | URL-friendly identifier (public-facing) |
| `stripeCustomerId` | String? | **MEDIUM** | ⚠️ Consider | Payment processor ID (sensitive) |
| `settings` | Json | **MEDIUM** | ⚠️ Review | May contain sensitive config |

**Current State:** Organization name in plaintext ❌

#### `portal.clients`
| Field | Type | Sensitivity | Encryption Required? | Reason |
|-------|------|-------------|---------------------|--------|
| `name` | String | **HIGH** | ✅ **YES** | Client name (e.g., "Acme Corp") - **End-user's business data** |
| `slug` | String | **MEDIUM** | ❌ No | URL-friendly identifier |
| `industry` | String? | **MEDIUM** | ⚠️ Consider | Business classification |
| `sector` | String? | **MEDIUM** | ⚠️ Consider | Business sector |
| `settings` | Json | **MEDIUM** | ⚠️ Review | May contain sensitive config |

**Current State:** Client name in plaintext ❌

#### `portal.projects`
| Field | Type | Sensitivity | Encryption Required? | Reason |
|-------|------|-------------|---------------------|--------|
| `name` | String | **HIGH** | ✅ **YES** | Project name (e.g., "Tax Return 2024") - **End-user's business data** |
| `slug` | String | **MEDIUM** | ❌ No | URL-friendly identifier |
| `description` | String? | **MEDIUM** | ⚠️ Consider | May contain sensitive project details |
| `connectorRootFolderId` | String? | **LOW** | ❌ No | Connector root folder ID (e.g. Google Drive folder ID; not sensitive) |
| `settings` | Json | **MEDIUM** | ⚠️ Review | May contain sensitive config |

**Current State:** Project name in plaintext ❌

#### `portal.documents`
| Field | Type | Sensitivity | Encryption Required? | Reason |
|-------|------|-------------|---------------------|--------|
| `title` | String | **MEDIUM** | ⚠️ Consider | Document title (may contain sensitive info) |
| `content` | String? | **HIGH** | ⚠️ Consider | Document content (if stored) |
| `summary` | String? | **MEDIUM** | ⚠️ Consider | Document summary (may contain sensitive info) |
| `externalId` | String | **LOW** | ❌ No | Google Drive file ID (not sensitive) |
| `webViewLink` | String? | **LOW** | ❌ No | Google Drive link (not sensitive) |

**Note:** Documents are stored in Google Drive, not in your DB. Only metadata is stored.

---

## 4. Admin Schema

#### `admin.contact_submissions`
| Field | Type | Sensitivity | Encryption Required? | Reason |
|-------|------|-------------|---------------------|--------|
| `email` | String? | **HIGH** | ⚠️ **NO** (Admin use) | PII, but used for admin/support purposes |
| `ipAddress` | String? | **MEDIUM** | ⚠️ Consider | IP address (PII) |
| `role` | String? | **LOW** | ❌ No | User role (not sensitive) |
| `painPoint` | String? | **LOW** | ❌ No | User feedback |
| `featureRequest` | String? | **LOW** | ❌ No | User feedback |
| `comments` | String? | **LOW** | ❌ No | User feedback |

**Recommendation:** Per HLD, do NOT encrypt `contact_submissions` as it's for Portal admins.

---

## 5. Summary: Encryption Requirements

### 🔴 **CRITICAL - Must Encrypt**

#### Secrets (Application Secrets)
1. **`portal.connectors.accessToken`** - OAuth access token
2. **`portal.connectors.refreshToken`** - OAuth refresh token

#### PII (Personally Identifiable Information)
3. **`portal.connectors.email`** - Google account email
4. **`portal.connectors.name`** - Display name
5. **`portal.project_invitations.email`** - Invitee email
6. **`portal.customer_requests.userEmail`** - User email

#### Business Information (End-user's Data)
7. **`portal.organizations.name`** - Organization name (e.g., "Acme CPA Firm")
8. **`portal.clients.name`** - Client name (e.g., "Acme Corp") - **End-user's business data**
9. **`portal.projects.name`** - Project name (e.g., "Tax Return 2024") - **End-user's business data**

### ⚠️ **MEDIUM PRIORITY - Consider Encrypting**

10. **`portal.clients.industry`** - Business industry
11. **`portal.clients.sector`** - Business sector
12. **`portal.projects.description`** - Project description
13. **`portal.organizations.stripeCustomerId`** - Payment processor ID
14. **`portal.customer_requests.description`** - May contain sensitive info
15. **`portal.documents.title`** - Document title (if contains sensitive info)
16. **`portal.documents.summary`** - Document summary

### ❌ **DO NOT ENCRYPT**

- IDs (UUIDs) - Used for relationships and lookups
- Slugs - Public-facing URL identifiers
- Timestamps - `createdAt`, `updatedAt`
- Status fields - Enums (ACTIVE, PENDING, etc.)
- Foreign keys - Used for joins
- `portal.project_invitations.token` - Hash instead of encrypt (for lookup)
- `admin.contact_submissions` - Per HLD, admin use only

---

## 6. Implementation Priority

### Phase 1: Critical Secrets (Week 1)
- ✅ Encrypt `connectors.accessToken`
- ✅ Encrypt `connectors.refreshToken`
- **Impact:** Prevents OAuth token exposure
- **Risk if not done:** High - tokens can be used to access user's Google Drive

### Phase 2: PII Protection (Week 2)
- ✅ Encrypt `connectors.email`
- ✅ Encrypt `connectors.name`
- ✅ Encrypt `project_invitations.email`
- ✅ Encrypt `customer_requests.userEmail`
- **Impact:** Protects user PII for compliance (ISO 27001/27701, GDPR)
- **Risk if not done:** Medium-High - Compliance violations, privacy concerns

### Phase 3: Business Information (Week 3)
- ✅ Encrypt `organizations.name`
- ✅ Encrypt `clients.name`
- ✅ Encrypt `projects.name`
- **Impact:** Protects end-user's business data (client confidentiality)
- **Risk if not done:** Medium - Business data exposure, competitive risk

### Phase 4: Optional Enhancements (Future)
- ⚠️ Encrypt `clients.industry`, `clients.sector`
- ⚠️ Encrypt `projects.description`
- ⚠️ Encrypt `documents.title`, `documents.summary` (if stored)

---

## 7. Technical Approach

### Encryption Method: Field-Level Encryption

**Option A: Env-Based Key (Recommended for MVP)**
- Master key stored in Vercel env (`ENCRYPTION_KEY`)
- AES-256-GCM encryption
- Encrypt before write, decrypt on read
- Simple, cost-effective, acceptable for many audits

**Option B: External KMS (Future)**
- AWS KMS, Google Cloud KMS, or HashiCorp Vault
- Envelope encryption (data key encrypted by KMS master key)
- Better key rotation, stronger audit trail
- Higher cost, more complexity

### Implementation Pattern

```typescript
// Before write
const encryptedEmail = encrypt(plaintextEmail, masterKey)

// After read
const plaintextEmail = decrypt(encryptedEmail, masterKey)
```

### Database Schema Changes

```sql
-- Add encrypted columns (keep original for migration)
ALTER TABLE portal.connectors 
  ADD COLUMN email_encrypted TEXT,
  ADD COLUMN name_encrypted TEXT,
  ADD COLUMN access_token_encrypted TEXT,
  ADD COLUMN refresh_token_encrypted TEXT;

-- After migration, drop plaintext columns
-- ALTER TABLE portal.connectors DROP COLUMN email;
```

---

## 8. Compliance Alignment

### ISO 27001 / ISO 27701
- ✅ **A.10 Cryptography:** Field-level encryption protects PII and business data
- ✅ **A.9 Access Control:** Encryption adds defense-in-depth (even if DB is compromised)
- ✅ **PII Confidentiality:** Encrypted PII meets confidentiality requirements

### GDPR
- ✅ **Article 32 (Security):** Encryption of personal data
- ✅ **Data Protection:** Encrypted data reduces breach impact

### SOC 2
- ✅ **CC6.7:** Cryptographic controls protect sensitive data

---

## 9. Risk Assessment

### Current Risks (Without Encryption)

| Data Type | Risk Level | Impact |
|-----------|------------|--------|
| OAuth Tokens | **CRITICAL** | Full access to user's Google Drive |
| Email Addresses | **HIGH** | PII exposure, spam, phishing |
| Business Names | **HIGH** | Competitive intelligence, client confidentiality breach |
| Project Names | **MEDIUM-HIGH** | Business context exposure |

### Mitigation Priority
1. **Secrets first** (OAuth tokens) - Immediate security risk
2. **PII second** (emails) - Compliance requirement
3. **Business data third** (names) - Client confidentiality

---

## 10. Next Steps

1. ✅ **Review this analysis** - Confirm encryption requirements
2. ⏭️ **Design encryption layer** - Choose env-based vs KMS
3. ⏭️ **Implement Phase 1** - Encrypt OAuth tokens
4. ⏭️ **Implement Phase 2** - Encrypt PII
5. ⏭️ **Implement Phase 3** - Encrypt business information
6. ⏭️ **Add audit logging** - Track encryption/decryption access
7. ⏭️ **Update HLD** - Document encryption approach
