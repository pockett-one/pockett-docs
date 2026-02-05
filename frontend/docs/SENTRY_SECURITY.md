# Sentry DSN Security Guide

## Overview

This document explains the security considerations around Sentry DSN (Data Source Name) environment variables and best practices for your Next.js application.

## Understanding Sentry DSNs

**Sentry DSNs are designed to be public-facing.** They are not secret keys like API keys or authentication tokens. Here's why:

1. **Read-Only Access**: DSNs can only **send** events to Sentry, not read data, modify settings, or access your account
2. **Public by Nature**: Client-side JavaScript needs access to the DSN to send error reports from browsers
3. **Security Through Other Means**: Sentry protects your data through:
   - Rate limiting
   - Allowed domains/origins configuration
   - Project-level access controls
   - Authentication tokens (separate from DSNs)

## Current Configuration

### Client-Side (Browser)
- **Variable**: `NEXT_PUBLIC_SENTRY_DSN`
- **Location**: `instrumentation-client.ts`
- **Why Public**: Required for browser-side error tracking
- **Security**: Protected by Sentry's allowed origins feature

### Server-Side (Node.js)
- **Variable**: `SENTRY_DSN` (preferred) or `NEXT_PUBLIC_SENTRY_DSN` (fallback)
- **Location**: `sentry.server.config.ts`
- **Why Private**: Server-side code can access non-public env vars
- **Security**: Additional layer of protection (not exposed in browser)

### Edge Runtime
- **Variable**: `SENTRY_DSN` (preferred) or `NEXT_PUBLIC_SENTRY_DSN` (fallback)
- **Location**: `sentry.edge.config.ts`
- **Why Private**: Edge functions can access non-public env vars
- **Security**: Additional layer of protection

## Security Best Practices

### 1. Configure Allowed Origins in Sentry

**Critical**: Configure Sentry to only accept events from your production domains:

1. Go to Sentry Dashboard → Settings → Projects → [Your Project]
2. Navigate to **Client Keys (DSN)**
3. Under **Allowed Domains**, add:
   - `https://pockett.io` (production)
   - `https://*.vercel.app` (preview deployments)
   - `http://localhost:3000` (development - optional)

This prevents unauthorized sites from sending events using your DSN.

### 2. Use Separate DSNs (Optional)

For enhanced security, you can create separate DSNs:
- **Client DSN**: For browser-side errors (public)
- **Server DSN**: For server-side errors (private)

This allows you to:
- Monitor client vs server errors separately
- Apply different rate limits
- Revoke one without affecting the other

### 3. Rate Limiting

Sentry automatically rate-limits events per DSN. If someone abuses your public DSN:
- Sentry will throttle excessive requests
- You'll see alerts in your Sentry dashboard
- You can revoke and regenerate the DSN if needed

### 4. Monitor for Abuse

Regularly check your Sentry dashboard for:
- Unusual spike in events
- Events from unexpected origins
- Suspicious patterns

## Vercel Environment Variables Setup

### Required Variables

**For Client-Side (Public):**
```
NEXT_PUBLIC_SENTRY_DSN=https://...@o4510794686136320.ingest.d.sentry.io/...
```

**For Server-Side (Private - Recommended):**
```
SENTRY_DSN=https://...@o4510794686136320.ingest.d.sentry.io/...
```

**Note**: You can use the same DSN for both, or create separate DSNs for better security isolation.

### Build-Time Variables (Private)
```
SENTRY_ORG=pockett-one
SENTRY_PROJECT=pockett-docs
SENTRY_AUTH_TOKEN=... (for source map uploads)
```

## FAQ

### Q: Is it safe to expose `NEXT_PUBLIC_SENTRY_DSN`?

**A: Yes**, with proper configuration:
- ✅ Configure allowed origins in Sentry
- ✅ Monitor for abuse
- ✅ Use rate limiting
- ✅ DSNs can only send events, not read data

### Q: What if someone steals my DSN?

**A:**
1. Sentry will rate-limit excessive requests
2. You'll see alerts in your dashboard
3. You can revoke and regenerate the DSN
4. They cannot access your Sentry data or account

### Q: Should I use separate DSNs for client and server?

**A: Optional but recommended** for:
- Better security isolation
- Separate monitoring
- Independent rate limiting

### Q: Can I make the client-side DSN private?

**A: No.** Client-side JavaScript runs in the browser and cannot access private environment variables. The DSN will always be visible in the browser's JavaScript bundle.

## Conclusion

The Vercel warning about `NEXT_PUBLIC_*` variables is **informational**, not a security issue. Sentry DSNs are designed to be public. The key is to:

1. ✅ Configure allowed origins in Sentry
2. ✅ Monitor your Sentry dashboard
3. ✅ Use private DSNs for server-side when possible
4. ✅ Set up rate limiting alerts

**You can safely proceed with adding `NEXT_PUBLIC_SENTRY_DSN` to Vercel**, but make sure to configure allowed origins in your Sentry project settings.
