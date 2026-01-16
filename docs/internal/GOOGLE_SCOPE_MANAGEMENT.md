# Google OAuth Scope Management Guide

## Understanding Scope Categories

Google Cloud Console categorizes OAuth scopes into three types:

### 1. Non-Sensitive Scopes
- **No verification required**
- Examples: `userinfo.email`, `userinfo.profile`
- Can be used immediately without Google review

### 2. Sensitive Scopes
- **May require verification** depending on usage
- Access private user data
- Examples: Gmail scopes, Calendar scopes (when accessing private data)

### 3. Restricted Scopes
- **Always require verification**
- Cannot be moved to non-sensitive category
- Examples: `drive.readonly`, `drive.activity.readonly`
- Google determines this category - you cannot change it

## Current Scopes in Pockett Docs

Based on your code (`frontend/app/api/connectors/google-drive/route.ts`):

```typescript
const scopes = [
  'https://www.googleapis.com/auth/drive.readonly',        // RESTRICTED ⚠️
  'https://www.googleapis.com/auth/userinfo.email',        // NON-SENSITIVE ✅
  'https://www.googleapis.com/auth/userinfo.profile',      // NON-SENSITIVE ✅
  'https://www.googleapis.com/auth/drive.activity.readonly' // RESTRICTED ⚠️
]
```

## Why Drive Scopes Cannot Be Moved

- **Google's Policy**: Drive scopes are classified as "restricted" by Google
- **Security Requirement**: They access user files and data, so verification is mandatory
- **No Workaround**: There's no way to move restricted scopes to non-sensitive

## How to Remove Unnecessary Scopes

If you have scopes in the "Sensitive" category that you don't need:

### Step 1: Access OAuth Consent Screen
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Scroll to the **Scopes** section

### Step 2: Remove Unnecessary Scopes
1. Find the scope in the **"Your sensitive scopes"** section
2. Click the **trash icon** (🗑️) on the right side of the row
3. Confirm deletion
4. Click **Save and Continue**

### Step 3: Update Your Code
After removing a scope from Google Cloud Console, also remove it from your code:

```typescript
// Remove the scope from the scopes array
const scopes = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/drive.activity.readonly'
  // Remove any scopes you deleted from Google Cloud Console
].join(' ')
```

## Verification Process for Restricted Scopes

Since Drive scopes are restricted, you **must** complete Google's verification process:

### Required Steps:
1. ✅ Complete OAuth consent screen configuration
2. ✅ Provide scope justification (see `GOOGLE_CLOUD_SCOPE_JUSTIFICATION.md`)
3. ✅ Create and upload demo video (see `GOOGLE_CLOUD_SCOPE_JUSTIFICATION.md`)
4. ✅ Submit for review

### Timeline:
- **Review time**: 1-2 weeks typically
- **During review**: Only test users can use the app
- **After approval**: All users can access

## Alternative: Using Less Restrictive Scopes

If you want to avoid verification entirely, you could use more limited scopes, but this would **severely limit functionality**:

### Option 1: `drive.metadata.readonly`
- **Category**: Restricted (still requires verification)
- **Limitation**: Cannot download files, only read metadata
- **Impact**: You'd lose file content analysis features

### Option 2: `drive.file`
- **Category**: Restricted (still requires verification)
- **Limitation**: Only works with files explicitly opened by user
- **Impact**: Cannot browse or analyze all Drive files

### Option 3: Remove Drive Functionality
- **Category**: No verification needed
- **Impact**: App would lose its core purpose

**Recommendation**: Complete the verification process. It's the standard approach for Drive-based apps.

## Summary

- ✅ **Non-sensitive scopes** (`userinfo.*`) don't need verification
- ⚠️ **Restricted scopes** (`drive.*`) always require verification
- 🗑️ **Sensitive scopes** can be removed if not needed
- 📝 **Verification is required** for Drive functionality - this is normal and expected

## Next Steps

1. If you see unnecessary sensitive scopes → Remove them from Google Cloud Console
2. For Drive scopes → Complete the verification process (see `GOOGLE_CLOUD_SCOPE_JUSTIFICATION.md`)
3. Keep only the scopes you actually need in your code



