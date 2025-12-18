# GitHub Copilot Instructions

These are the strict operational rules for this project.

## 🚨 CRITICAL GOLDEN RULES 🚨

### 1. Database Migrations (Supabase + Prisma)
*   **NEVER** suggest or run `prisma db push`. It causes data loss in production.
*   **ALWAYS** use the Migration Workflow:
    1.  Edit `schema.prisma`.
    2.  `npx prisma migrate dev --name <change_name>` locally. (Creates migration SQL).
    3.  Commit `prisma/migrations/*.sql`.
    4.  Vercel `postbuild` script applies it via `prisma migrate deploy`.

### 2. Vercel Deployment Config
*   **Build Command**: Vercel Settings **MUST** be set to `npm run build` (triggers `postbuild` hook).
*   **Package.json**: `"build": "next build --webpack"` is mandatory to bypass Next.js 16/Turbopack issues.

### 3. Connection Strings (Supavisor)
*   **Application**: `DATABASE_URL` -> Port **6543** (Transaction Pooler).
*   **Migrations**: `DIRECT_URL` -> Port **5432** (Session Pooler).
    *   **User Format**: `postgres.[project-ref]` (e.g., `postgres.abcdefg`).
    *   **Error "Tenant not found"** means the User format is missing the project ref.

### 4. Git Workflow
*   **NO AUTO-COMMITS**: Never commit or push changes to Git without explicit user instruction.
*   **APPROVAL FIRST**: Always ask "Should I commit this?" or wait for a command like "commit and push".
