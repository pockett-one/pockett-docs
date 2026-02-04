# UserSettingsPlus Cache System

**Status:** Implementation Guide  
**Purpose:** Unified in-memory cache for user permissions, settings, and personalization  
**Built:** On login/auth state change  
**Cache Duration:** 30 minutes TTL

---

## Overview

`UserSettingsPlus` is a unified cache system that stores:
- **Permissions** (RBAC from 5-table system)
- **User Preferences** (theme, notifications, features)
- **Project Settings** (per-project user settings)
- **Organization Settings** (user's view of org settings)
- **Future Personalization** (extensible for new features)

All data is computed from the database on login and cached in-memory for fast access.

---

## Architecture

### Cache Flow

```
Login → Auth State Change → Build UserSettingsPlus → Cache (30min TTL)
                                                          ↓
                                    Fast Permission Checks (no DB queries)
```

### Data Structure

```typescript
interface UserSettingsPlus {
  userId: string
  computedAt: number
  version: string
  
  permissions: {
    organizations: Record<orgId, { role, personas, scopes }>
    projects: Record<projectId, { persona, scopes }>
  }
  
  preferences: {
    theme, viewMode, sidebarCollapsed
    emailNotifications, features, cookieConsent
  }
  
  projectSettings: Record<projectId, { notifications, defaultView, customFields }>
  organizationSettings: Record<orgId, { branding }>
}
```

---

## Usage

### 1. Permission Checks

```typescript
import { checkProjectPermission, getProjectPermissions } from '@/lib/user-settings-plus'

// Check specific permission
const canEdit = await checkProjectPermission(
  userId,
  projectId,
  'project',      // scope
  'can_edit'      // permission
)

// Get all permissions for a project
const permissions = await getProjectPermissions(userId, projectId)
// Returns: { project: ['can_view', 'can_edit'], document: ['can_view'] }
```

### 2. User Preferences

```typescript
import { getUserPreferences } from '@/lib/user-settings-plus'

const preferences = await getUserPreferences(userId)
// Access: preferences.theme, preferences.viewMode, etc.
```

### 3. Project Settings

```typescript
import { getProjectSettings } from '@/lib/user-settings-plus'

const settings = await getProjectSettings(userId, projectId)
// Access: settings.notifications, settings.defaultView, etc.
```

### 4. Organization Settings

```typescript
import { getOrganizationSettings } from '@/lib/user-settings-plus'

const orgSettings = await getOrganizationSettings(userId, orgId)
// Access: orgSettings.branding.logoUrl, etc.
```

---

## Server-Side Usage (Page Components)

```typescript
// app/o/[slug]/c/[clientSlug]/p/[projectSlug]/page.tsx
import { checkProjectPermission } from '@/lib/user-settings-plus'
import { createClient } from '@/utils/supabase/server'

export default async function ProjectPage({ params }) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/signin')
  
  // Fast permission check from cache
  const canView = await checkProjectPermission(user.id, projectId, 'project', 'can_view')
  const canEdit = await checkProjectPermission(user.id, projectId, 'project', 'can_edit')
  const canManage = await checkProjectPermission(user.id, projectId, 'project', 'can_manage')
  
  if (!canView) {
    throw new Error('Unauthorized')
  }
  
  return <ProjectWorkspace canView={canView} canEdit={canEdit} canManage={canManage} />
}
```

---

## Cache Invalidation

### When to Invalidate

Invalidate cache when:
- ✅ User joins/leaves organization
- ✅ User added/removed from project
- ✅ User's persona changes
- ✅ Project deleted
- ✅ Project settings updated
- ✅ Organization settings updated (if user-visible)

### How to Invalidate

```typescript
import { invalidateUserSettingsPlus, invalidateUsersSettingsPlus } from '@/lib/actions/user-settings'

// Single user
await invalidateUserSettingsPlus(userId)

// Multiple users (e.g., project deletion)
await invalidateUsersSettingsPlus([userId1, userId2, userId3])
```

### Example: Project Deletion

```typescript
// lib/actions/project.ts
export async function deleteProject(projectId: string, ...) {
  // Get affected users BEFORE deleting
  const affectedUsers = await prisma.projectMember.findMany({
    where: { projectId },
    select: { userId: true },
    distinct: ['userId']
  })

  // Delete project members
  await prisma.projectMember.deleteMany({ where: { projectId } })
  
  // Invalidate cache for affected users
  if (affectedUsers.length > 0) {
    const { invalidateUsersSettingsPlus } = await import('@/lib/actions/user-settings')
    await invalidateUsersSettingsPlus(affectedUsers.map(u => u.userId))
  }
}
```

---

## Building Cache on Login

Cache is automatically built on:
- ✅ Initial page load (if user is logged in)
- ✅ Sign in event (`SIGNED_IN`)
- ✅ Auth state change

**Implementation:** See `lib/auth-context.tsx` - calls `buildUserSettingsPlus()` server action.

---

## Extending for Future Features

### Adding New Settings Section

1. **Update Type Definition:**

```typescript
// lib/user-settings-plus.ts
export interface PersonalizationSettings {
  savedSearches: string[]
  favoriteProjects: string[]
  customDashboards: Record<string, any>
}

export interface UserSettingsPlus {
  // ... existing fields
  personalization?: PersonalizationSettings  // Add new section
}
```

2. **Add Compute Function:**

```typescript
private async computePersonalization(userId: string): Promise<PersonalizationSettings> {
  // Fetch from database
  const savedSearches = await prisma.savedSearch.findMany({
    where: { userId },
    select: { id: true }
  })
  
  return {
    savedSearches: savedSearches.map(s => s.id),
    favoriteProjects: [],
    customDashboards: {}
  }
}
```

3. **Add to Main Compute:**

```typescript
const [permissions, preferences, projectSettings, organizationSettings, personalization] = 
  await Promise.all([
    this.computePermissions(userId),
    this.computePreferences(userId),
    this.computeProjectSettings(userId),
    this.computeOrganizationSettings(userId),
    this.computePersonalization(userId)  // Add here
  ])
```

4. **Add Convenience Function:**

```typescript
export async function getPersonalization(userId: string): Promise<PersonalizationSettings> {
  const settings = await userSettingsPlus.getUserSettingsPlus(userId)
  return settings.personalization ?? {}
}
```

---

## Performance

### Cache Hit (Fast Path)
- **Latency:** ~0-5ms (in-memory lookup)
- **DB Queries:** 0

### Cache Miss (Slow Path)
- **Latency:** ~100-300ms (compute from DB)
- **DB Queries:** 4-6 (parallel fetches)

### Cache Stats

```typescript
import { userSettingsPlus } from '@/lib/user-settings-plus'

const stats = userSettingsPlus.getStats()
// Returns: { total: 50, valid: 48, expired: 2 }
```

---

## Best Practices

1. **Always check cache first** - Use convenience functions (`checkProjectPermission`, etc.)
2. **Invalidate on mutations** - Always invalidate after permission/settings changes
3. **Don't store sensitive data** - Cache is in-memory, not encrypted
4. **Monitor cache stats** - Track hit/miss rates for optimization
5. **Extend carefully** - Add new sections incrementally

---

## Troubleshooting

### Cache Not Updating

**Problem:** Permissions changed but cache still has old data.

**Solution:** 
1. Check if invalidation is called after mutation
2. Verify cache TTL hasn't expired (30 min default)
3. Check logs for cache invalidation calls

### Performance Issues

**Problem:** Slow permission checks.

**Solution:**
1. Check cache stats - high miss rate?
2. Verify parallel DB queries in compute functions
3. Consider reducing TTL or adding Redis

### Stale Data

**Problem:** User sees old permissions after changes.

**Solution:**
1. Ensure invalidation is called on ALL mutation paths
2. Add validation checks for critical operations
3. Consider shorter TTL for production

---

## Migration from Previous Approach

If migrating from `auth.users.raw_user_meta_data`:

1. ✅ Remove metadata updates from mutation functions
2. ✅ Replace JWT permission checks with cache checks
3. ✅ Add cache invalidation to all mutation functions
4. ✅ Update auth flow to build cache on login
5. ✅ Test thoroughly - cache should be faster!

---

## Future Enhancements

- [ ] Redis backend for multi-instance deployments
- [ ] Cache warming for frequently accessed users
- [ ] Partial cache updates (update only changed sections)
- [ ] Cache versioning for schema migrations
- [ ] Metrics/monitoring integration
