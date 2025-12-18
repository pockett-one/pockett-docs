# Database Migration & Deployment Guide

## The Golden Rule
**We use Migration Files, not `db push`.**

- **Local Development**: `npx prisma migrate dev`
- **Production**: `npx prisma migrate deploy`

## Workflow

1.  **Make Changes**: Modify `frontend/prisma/schema.prisma`.
2.  **Generate Migration**:
    ```bash
    cd frontend
    npx prisma migrate dev --name describe_your_change
    ```
    *This creates a new SQL file in `prisma/migrations` and applies it locally.*
3.  **Commit**:
    ```bash
    git add prisma/migrations
    git commit -m "chore(db): add new field"
    ```
4.  **Deploy**:
    *   Push to GitHub.
    *   Vercel detects the change.
    *   Vercel runs `npm run build`.
    *   This triggers `postbuild`: `prisma migrate deploy`.
    *   The new migration is applied to Production safely.

## Troubleshooting Connections

### "Tenant or user not found" (FATAL)
This means your `DIRECT_URL` credential format is wrong for the Pooler.

*   **Wrong**: `postgres://postgres:password@aws-0.pooler...`
*   **Correct**: `postgres://postgres.[PROJECT-REF]:password@aws-0.pooler...`

Ensure you add the **Project Reference ID** to the username when connecting to the Supavisor Pooler on Port 5432.

### "Can't reach database" (P1001)
This usually means Vercel (IPv4) is trying to connect to Supabase Direct (IPv6).
*   **Fix**: Switch `DIRECT_URL` to use the **Session Pooler** domain (`pooler.supabase.com` port 5432) instead of the direct domain.

## Configuration Reference
**package.json scripts:**
```json
"build": "next build --webpack",
"postbuild": "prisma generate && prisma migrate deploy"
```

**Vercel Build Settings:**
- Build Command: `npm run build` (Overrides default)
