# pockett-docs
Pockett Document Management System

## Development Utilities

### OAuth / branding PNG from app icon

The favicon source of truth is `frontend/app/icon.svg` (same mark as the in-app logo). To regenerate the square PNG used for **Google Cloud Console → OAuth consent screen** branding:

```bash
cd frontend
npm run oauth-brand-png
```

Output: `frontend/public/google-oauth-brand-logo.png` (120×120, transparent background). Upload that file in the OAuth consent branding settings. Edit `OAUTH_SIZE` in the script if Google’s requirements change.

### Organization Cleanup Script

A script is available to cascade delete an organization's data from the database and remove its associated folders from Google Drive. This is useful for resetting the state during testing.

**Usage:**

```bash
cd frontend
npx ts-node scripts/cleanup-org.ts <ORGANIZATION_ID>
```

**Note:**
- You can find the `<ORGANIZATION_ID>` in the database or the URL `/o/[slug]/...`.
- This action is **irreversible**. It will delete all Clients, Projects, and Documents associated with the organization.
