# Environment Strategy: Development, Preview, Production

## Overview

This codebase supports **three environments**:
- **`development`** - Local development (`NODE_ENV=development`)
- **`preview`** - Preview deployments on Vercel (`NODE_ENV=preview`)
- **`production`** - Production deployment (`NODE_ENV=production`)

## Environment Detection Pattern

**CRITICAL**: We use explicit checks to avoid hardcoding environment names:

### ✅ Correct Patterns

```typescript
// Check if development (local only)
const isDevelopment = process.env.NODE_ENV === 'development'

// Check if production OR preview (deployed environments)
const isProduction = process.env.NODE_ENV !== 'development'

// Use this pattern for conditional logic
if (isDevelopment) {
  // Development-only behavior
} else {
  // Production + Preview behavior
}
```

### ❌ Avoid These Patterns

```typescript
// DON'T hardcode 'production'
const isProduction = process.env.NODE_ENV === 'production' // ❌ Excludes preview!

// DON'T hardcode 'preview'
const isPreview = process.env.NODE_ENV === 'preview' // ❌ Not maintainable
```

## Environment-Specific Configuration

### Database (Supabase)

Each environment has its own database configured via environment variables:

- **Development**: Local Supabase or dev instance
  ```bash
  DATABASE_URL=postgres://...@localhost:6543/...
  DIRECT_URL=postgres://...@localhost:5432/...
  NODE_ENV=development
  ```

- **Preview**: Preview-specific Supabase instance
  ```bash
  DATABASE_URL=postgres://...@preview-project.supabase.co:6543/...
  DIRECT_URL=postgres://...@preview-project.supabase.co:5432/...
  NODE_ENV=preview
  NEXT_PUBLIC_APP_URL=https://preview.pockett.io
  NEXT_PUBLIC_VERCEL_ENV=preview
  ```

- **Production**: Production Supabase instance
  ```bash
  DATABASE_URL=postgres://...@prod-project.supabase.co:6543/...
  DIRECT_URL=postgres://...@prod-project.supabase.co:5432/...
  NODE_ENV=production
  NEXT_PUBLIC_APP_URL=https://pockett.io
  NEXT_PUBLIC_VERCEL_ENV=production
  ```

### Sentry Error Tracking

All three environments use the **same Sentry project** but are **segregated by environment tag**.

#### Environment Tag

```typescript
// All Sentry configs use this pattern:
environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development'
```

This sets the Sentry environment to:
- `development` - Local development
- `preview` - Preview deployments (from Vercel's `NEXT_PUBLIC_VERCEL_ENV`)
- `production` - Production deployment (from Vercel's `NEXT_PUBLIC_VERCEL_ENV`)

#### Filtering Errors in Sentry

In the Sentry dashboard, you can filter by environment:

1. **View only production errors**: Filter by `environment:production`
2. **View only preview errors**: Filter by `environment:preview`
3. **Create separate alerts**: Set up alert rules based on environment

#### Sentry Configuration Files

All three files use the same pattern:

- `sentry.server.config.ts` - Server-side (API routes, server components)
- `sentry.edge.config.ts` - Edge runtime (middleware)
- `instrumentation-client.ts` - Client-side (browser)

```typescript
// All three configs include:
if (process.env.NODE_ENV !== 'development') {
    Sentry.init({
        dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',
        tracesSampleRate: 0.1,
        // ... other config
    })
}
```

### Logging Strategy

The logger (`lib/logger.ts`) follows this pattern:

- **Development**: All logs (debug, info, warn, error) with colors
- **Preview & Production**: Only warn and error logs, sent to Sentry

```typescript
// Logger checks
if (this.isDevelopment) {
    // Colorful console logs
} else {
    // JSON logs for production/preview
    // Send errors to Sentry
}
```

### Feature Flags

Use environment checks for feature-specific behavior:

```typescript
// Example: Enable debug features only in development
export async function debugUpgradeOrg(organizationId: string) {
    if (process.env.NODE_ENV !== 'development') return
    // Debug logic
}
```

### Cookie Security

Cookies use secure flags in deployed environments:

```typescript
response.cookies.set('cookie-name', value, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development', // true in preview & production
    sameSite: 'lax',
    path: '/',
})
```

## Files Updated

All files below were updated to use the `!== 'development'` pattern:

1. `lib/config.ts` - Environment detection, URL construction
2. `lib/errors/api-error.ts` - Error response formatting
3. `lib/logger.ts` - Logging levels and Sentry integration
4. `lib/billing/subscription-gate.ts` - Debug feature gates
5. `lib/prisma.ts` - Prisma client global caching
6. `middleware.ts` - Cookie security settings
7. `app/auth/callback/route.ts` - Auth callback redirect and cookies
8. `sentry.server.config.ts` - Sentry environment tag
9. `sentry.edge.config.ts` - Sentry environment tag
10. `instrumentation-client.ts` - Sentry environment tag
11. `components/layout/Header.tsx` - Environment detection
12. `app/layout.tsx` - Google Analytics loading

## Best Practices

1. **Always use `=== 'development'` or `!== 'development'`** - Never hardcode 'production' or 'preview'
2. **Use environment variables for environment-specific values** - Don't inline URLs or keys
3. **Tag external services with environment** - Use `NEXT_PUBLIC_VERCEL_ENV` for Sentry, analytics, etc.
4. **Test in all three environments** - Especially preview before production deployments
5. **Use Vercel's environment variables UI** - Set different values per environment (Development, Preview, Production)

## Vercel Environment Variables

In Vercel's dashboard, configure variables for each environment:

### Preview Environment

```bash
# Database
DATABASE_URL=postgres://...@preview.supabase.co:6543/...
DIRECT_URL=postgres://...@preview.supabase.co:5432/...

# App
NEXT_PUBLIC_APP_URL=https://preview.pockett.io
NODE_ENV=preview

# Sentry (same DSN, different environment tag)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_DSN=https://...@sentry.io/...

# Auto-set by Vercel
NEXT_PUBLIC_VERCEL_ENV=preview
```

### Production Environment

```bash
# Database
DATABASE_URL=postgres://...@production.supabase.co:6543/...
DIRECT_URL=postgres://...@production.supabase.co:5432/...

# App
NEXT_PUBLIC_APP_URL=https://pockett.io
NODE_ENV=production

# Sentry (same DSN, different environment tag)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_DSN=https://...@sentry.io/...

# Auto-set by Vercel
NEXT_PUBLIC_VERCEL_ENV=production
```

## Sentry Dashboard Setup

### Creating Environment Filters

1. Navigate to your Sentry project
2. Click "Issues" or "Performance"
3. Add filter: `environment:preview` or `environment:production`
4. Save as a custom view or bookmark the URL

### Alert Rules by Environment

1. Go to "Alerts" → "Create Alert"
2. Add condition: `The event's environment is equal to production`
3. Set up notifications (email, Slack, etc.)
4. Create separate alerts for preview if needed

### Recommended Alert Setup

- **Production Critical**: `environment:production AND level:error`
- **Production Performance**: `environment:production AND transaction.duration > 1000ms`
- **Preview Testing**: `environment:preview` (optional, for monitoring preview errors)

## Summary

This strategy ensures:
- ✅ Clean separation between development, preview, and production
- ✅ Single Sentry project with environment-based filtering
- ✅ No hardcoded environment checks (maintainable code)
- ✅ Consistent behavior across deployed environments (preview + production)
- ✅ Easy debugging in development, production-ready in preview/production
