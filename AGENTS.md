# AI Agent & Antigravity Instructions

This file serves as the strict operating manual for AI Agents (Google Antigravity, Cursor, Windsurf, etc.) working on this project.

## 🚨 CRITICAL GOLDEN RULES 🚨

### 1. Database Migrations (Supabase + Prisma)
*   **NEVER** run `prisma db push`. It effectively "resets" production drift and deletes data.
*   **ALWAYS** use the Migration Workflow:
    1.  Edit `schema.prisma`.
    2.  Run `npx prisma migrate dev --name <change_name>` locally. (Creates migration SQL).
    3.  Commit `prisma/migrations/*.sql`.
    4.  Vercel `postbuild` script applies it via `prisma migrate deploy`.

### 2. Vercel Deployment Config
*   **Build Command**: Vercel Settings **MUST** be set to `npm run build`.
    *   This ensures it triggers the `postbuild` hook defined in `package.json`.
*   **Package.json**: `"build": "next build --webpack"` is mandatory to bypass Next.js 16/Turbopack issues with PostCSS.

### 3. Connection Strings (Supavisor)
*   **Application (Runtime)**: `DATABASE_URL` -> Port **6543** (Transaction Pooler).
*   **Migrations (Deploy)**: `DIRECT_URL` -> Port **5432** (Session Pooler).
    *   **User Format**: `postgres.[project-ref]` (e.g., `postgres.abcdefg`).
    *   **Error "Tenant not found"** ALWAYS means the User format is missing the project ref.

### 4. Git Workflow
*   **NO AUTO-COMMITS**: Never commit or push changes to Git without explicit user instruction.
*   **APPROVAL FIRST**: Always ask "Should I commit this?" or wait for a command like "commit and push".

## 📂 Reference
For granular coding patterns, refer to the rules in `.cursor/rules/`.

## Cursor Cloud specific instructions

### Project Structure
- **Monorepo** with the main application in `frontend/` (Next.js 16, App Router, TypeScript).
- A legacy Python/FastAPI backend exists at the root (`pyproject.toml`) but is **not used** — ignore it.
- Database: PostgreSQL via Supabase (Prisma ORM, multi-schema: `public`, `portal`, `admin`, `rbac`).

### Node.js Version
- `package.json` requires `node >= 24`. The VM uses nvm; run `source ~/.nvm/nvm.sh && nvm use 24` before any npm/node commands, or ensure the default alias is set to 24.

### Environment Variables
- The secret `NEXT_PUBLIC_SUPABASE_PROXY_URL` must be written into `frontend/.env.local` as `NEXT_PUBLIC_SUPABASE_URL` (the code references the latter name).
- All `NEXT_PUBLIC_*` variables must be in `frontend/.env.local` so Next.js inlines them at compile time.
- A Python helper writes `.env.local` from injected environment secrets. See the update script for details.

### Running the Dev Server
- `cd frontend && npm run dev` starts the Next.js dev server on port 3000 using webpack mode.
- **Known issue (Next.js 16 route conflict):** The route `/d/o/[slug]/c/[clientSlug]/p/[projectSlug]/page.tsx` conflicts with the optional catch-all `[[...rest]]/page.tsx` at the same level. Next.js 16 rejects this at startup. To work around it, temporarily rename the parent `page.tsx` (e.g., `page.tsx.bak`) before starting the dev server. The catch-all page already handles the base route by redirecting to `/files`.

### Running Tests
- `cd frontend && npm test` runs Vitest (17 unit/integration tests as of setup).

### Linting
- `npm run lint` invokes `next lint`, which was **removed in Next.js 16**. The project still uses `.eslintrc.json` (ESLint v9 requires flat config). Linting is currently broken as a pre-existing issue.

### Prisma
- `npx prisma generate` in `frontend/` regenerates the Prisma client after schema changes.
- **Never** run `prisma db push` (see Golden Rules above).

#