# Sentry Environment Segregation

## Quick Start

Your preview and production environments now send errors to the **same Sentry project** but are segregated by **environment tags**.

## Environment Variables Required

### Both Preview and Production

```bash
# Same DSN for both environments (public key is safe to expose)
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_PUBLIC_KEY@oXXXXXXXX.ingest.us.sentry.io/XXXXXXX

# Server-side DSN (same value, but not exposed to browser)
SENTRY_DSN=https://YOUR_PUBLIC_KEY@oXXXXXXX.ingest.us.sentry.io/XXXXXXX

# Vercel sets this automatically (preview vs production)
NEXT_PUBLIC_VERCEL_ENV=preview  # or "production"
```

## How It Works

### Automatic Environment Tagging

All errors are tagged with the environment:

```typescript
// In sentry.server.config.ts, sentry.edge.config.ts, instrumentation-client.ts
environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development'
```

This means:
- **Development**: `environment: "development"` (Sentry disabled)
- **Preview**: `environment: "preview"` (from `NEXT_PUBLIC_VERCEL_ENV`)
- **Production**: `environment: "production"` (from `NEXT_PUBLIC_VERCEL_ENV`)

### What Gets Sent to Sentry

| Environment | Errors | Warnings | Performance | Session Replay |
|-------------|--------|----------|-------------|----------------|
| Development | ❌ No  | ❌ No    | ❌ No       | ❌ No          |
| Preview     | ✅ Yes | ✅ Yes   | ✅ 10%      | ✅ 10% / 100% errors |
| Production  | ✅ Yes | ✅ Yes   | ✅ 10%      | ✅ 10% / 100% errors |

## Filtering in Sentry Dashboard

### View Only Production Errors

1. Go to **Issues** or **Performance**
2. Click **Add Filter**
3. Select `environment` equals `production`
4. Save as a custom view

**Quick URL**: `https://sentry.io/organizations/YOUR_ORG/issues/?environment=production`

### View Only Preview Errors

Use the same steps but filter by `environment:preview`:

**Quick URL**: `https://sentry.io/organizations/YOUR_ORG/issues/?environment=preview`

### Search Queries

You can also use search syntax:

```
# Production errors only
environment:production

# Preview errors with specific tag
environment:preview user.email:*@test.com

# Critical production errors
environment:production level:error

# Slow transactions in production
environment:production transaction.duration:>1000
```

## Setting Up Alerts

### Production-Only Critical Errors

1. Go to **Alerts** → **Create Alert**
2. Choose "Issues" alert
3. Set conditions:
   - `environment` is equal to `production`
   - `level` is equal to `error`
   - Event is first seen (to avoid duplicate alerts)
4. Set action: Slack, Email, etc.
5. Name: "🚨 Production Critical Errors"

### Performance Degradation (Production)

1. Create new alert → "Metric Alert"
2. Set metric: Transaction Duration (p95)
3. Add filter: `environment:production`
4. Threshold: `p95(transaction.duration) > 1000ms` for 5 minutes
5. Name: "⚠️ Production Performance Degradation"

### Preview Environment Testing (Optional)

You might want alerts for preview to catch issues before production:

1. Create alert for `environment:preview`
2. Set less aggressive thresholds (preview might be slower)
3. Route to a different Slack channel (e.g., `#dev-alerts`)

## Viewing Environment Data

### Issues Tab

- Default view shows **all environments** mixed
- Click filter icon → `environment` → select specific environment
- Create saved searches for quick access

### Performance Tab

- View all transactions or filter by environment
- Use the dropdown: **Environments** → select `production` or `preview`

### Releases Tab

You can tag releases per environment:

```bash
# In your CI/CD (Vercel build)
SENTRY_RELEASE="${VERCEL_GIT_COMMIT_SHA}-${VERCEL_ENV}"
```

This creates releases like:
- `abc123-preview`
- `abc123-production`

### Dashboards

Create custom dashboards with environment filters:

1. **Dashboards** → **Create Dashboard**
2. Add widgets:
   - **Production Error Rate**: Filter by `environment:production`
   - **Preview Error Rate**: Filter by `environment:preview`
   - **Comparison**: Side-by-side widgets

## Best Practices

### 1. Different Alert Channels

Route alerts to different channels based on environment:

- **Production**: `#alerts-production` (critical, immediate attention)
- **Preview**: `#dev-alerts` (informational, can wait)

### 2. Sample Rates

Consider different sample rates per environment:

```typescript
// In sentry config
tracesSampleRate: process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ? 0.1 : 0.5
```

This samples:
- 10% of production transactions
- 50% of preview transactions (more data for testing)

### 3. Release Tracking

Tag releases with git commit SHA + environment:

```bash
# Vercel automatically sets these
SENTRY_RELEASE="${VERCEL_GIT_COMMIT_SHA}"
SENTRY_ENVIRONMENT="${VERCEL_ENV}"  # preview or production
```

### 4. Ignored Errors by Environment

You can ignore certain errors only in preview:

```typescript
beforeSend(event, hint) {
  // Ignore preview health checks
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
      && event.request?.url?.includes('/api/health')) {
    return null
  }
  return event
}
```

## Vercel Integration

If you use Vercel's Sentry integration:

1. Go to Vercel Dashboard → Integrations
2. Install/Configure Sentry
3. It will automatically set:
   - `SENTRY_DSN`
   - `NEXT_PUBLIC_SENTRY_DSN`
   - Release tracking
   - Source maps upload

## Troubleshooting

### Not Seeing Environment Tags?

Check that `NEXT_PUBLIC_VERCEL_ENV` is set:

```bash
# In Vercel dashboard or CLI
vercel env ls
```

Should show `NEXT_PUBLIC_VERCEL_ENV` for Preview and Production.

### All Errors Show as "preview"?

Make sure you're deploying to production branch (usually `main`):

- **Preview**: Any branch that's not production branch
- **Production**: Only production branch (`main` or configured in Vercel)

### Source Maps Not Working?

Ensure your build uploads source maps per environment:

```javascript
// next.config.js
const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig(
  config,
  {
    org: 'your-org',
    project: 'your-project',
    // Upload source maps for both environments
    silent: true,
  }
)
```

## Quick Reference

| Task | Sentry Filter |
|------|---------------|
| View production errors | `environment:production` |
| View preview errors | `environment:preview` |
| Production + Critical | `environment:production level:error` |
| Slow transactions | `environment:production transaction.duration:>1000` |
| User-specific (preview) | `environment:preview user.id:123` |
| Search by release | `release:abc123-production` |

## Example Alert Configurations

### Critical Production Errors

```yaml
Name: 🚨 Production Critical Errors
Type: Issues Alert
Filters:
  - environment equals production
  - level equals error
  - event is first seen
Actions:
  - Send Slack notification to #alerts-production
  - Send email to oncall@company.com
```

### High Error Rate (Production)

```yaml
Name: ⚠️ Production High Error Rate
Type: Metric Alert
Metric: count(error)
Filters:
  - environment equals production
Threshold: > 10 errors in 5 minutes
Actions:
  - Send Slack notification to #alerts-production
  - Create PagerDuty incident
```

### Preview Performance Monitor

```yaml
Name: 📊 Preview Performance Check
Type: Metric Alert
Metric: p95(transaction.duration)
Filters:
  - environment equals preview
Threshold: > 2000ms for 10 minutes
Actions:
  - Send Slack notification to #dev-alerts
```

---

**Need Help?**
- [Sentry Environment Docs](https://docs.sentry.io/platforms/javascript/configuration/environments/)
- [Sentry Alerts Guide](https://docs.sentry.io/product/alerts/)
