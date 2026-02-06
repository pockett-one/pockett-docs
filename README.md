# pockett-docs
Pockett Document Management System

## Development Utilities

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
