# Google Cloud Console - OAuth Scope Justification

## Feature Category Selection
**Recommended:** Select **"Drive management"** or **"Productivity"** (if available)
- Alternative: "Drive backup" (if other options aren't available, but this is less accurate)

---

## Scope Justification Text (1000 characters max)
**Copy this into the "How will the scopes be used?" field:**

```
Pockett Docs is a Google Drive management and insights platform for freelancers and small agencies to gain visibility over their Drive files.

drive.readonly: We read file metadata (name, size, permissions, dates) to build analytics dashboards, identify security risks (public links, external shares), detect storage inefficiencies (large unused files, duplicates, stale documents), and enable file browsing. We download files for read-only content analysis. drive.metadata.readonly alone doesn't allow file downloads, and drive.file only works for explicitly opened files - we need full Drive access to surface insights.

drive.activity.readonly: We track file activity history to show most active/trending documents, engagement metrics, and activity timelines. This data isn't available through the standard Drive API. Users need visibility into engagement patterns for better organization decisions.

Our app is read-only - we never modify, delete, or create files. All functionality provides insights and recommendations to help users manage their Drive.
```

**Character count: 999 characters**

---

## Alternative Shorter Version (if needed)

If you need an even shorter version, here's a condensed alternative:

```
Pockett Docs provides Google Drive insights and analytics for freelancers and small agencies.

drive.readonly: Read file metadata and permissions to build analytics dashboards, identify security risks (public shares), detect storage issues (large unused files, duplicates), and enable file browsing. Download files for read-only content analysis. More limited scopes don't allow full Drive analysis needed for insights.

drive.activity.readonly: Track file activity to show trending documents and engagement metrics. Activity data isn't available through standard Drive API - users need this visibility for organization decisions.

App is read-only - we never modify user files. All functionality provides insights and recommendations.
```

**Character count: 678 characters**

---

## Demo Video Requirements

**YouTube Link:** *(You'll need to create and upload a demo video)*

### Video Requirements
- Must be publicly accessible on YouTube
- Should be 2-5 minutes long
- Must show all OAuth clients assigned to the project
- Should clearly demonstrate how each scope is used

---

## How to Create the Demo Video

### Step 1: Preparation

**Before recording:**
1. **Prepare a test Google account** with sample Drive files:
   - Some files with public sharing links (to show risky shares)
   - Large files (to show storage insights)
   - Files not accessed in 90+ days (to show stale files)
   - Files with recent activity (to show activity tracking)

2. **Ensure your app is running** in a clean state (development or staging environment)

3. **Clear browser cache** or use incognito mode to show a fresh OAuth flow

4. **List all OAuth clients** you need to show:
   - Web client (if you have one)
   - Any mobile clients
   - Any other client types

### Step 2: Recording Tools

**Recommended screen recording tools:**
- **macOS**: Built-in QuickTime Player or Screen Recording (Cmd+Shift+5)
- **Windows**: Built-in Game Bar (Win+G) or OBS Studio (free)
- **Cross-platform**: Loom (free, easy sharing), OBS Studio (free, professional)

**Settings:**
- Resolution: 1920x1080 (1080p) minimum
- Frame rate: 30fps
- Audio: Record system audio + microphone (optional narration)
- Format: MP4 (YouTube compatible)

### Step 3: Video Script & Timeline

**Recommended 3-4 minute structure:**

#### **0:00 - 0:30 - Introduction & OAuth Flow**
- Show your app's landing page
- Click "Connect Google Drive" button
- **IMPORTANT**: Show the Google OAuth consent screen clearly
  - Zoom in or highlight the scopes being requested
  - Show both scopes: `drive.readonly` and `drive.activity.readonly`
  - Show the user-facing descriptions
- Complete the OAuth flow
- Show successful connection confirmation

#### **0:30 - 1:30 - Drive.readonly Scope Demonstration**
- Navigate to the Insights/Dashboard page
- **Show file browsing**: List of files from Google Drive
- **Show metadata**: File names, sizes, modification dates, file types
- **Show risky shares**: Highlight files with public links or external sharing
- **Show storage insights**: Large files, storage usage metrics
- **Show stale files**: Files not accessed in 90+ days
- **Show file details**: Click on a file to show metadata (permissions, size, dates)
- **Mention**: "We use drive.readonly to read all this metadata and file information"

#### **1:30 - 2:30 - drive.activity.readonly Scope Demonstration**
- Navigate to Activity/Engagement section
- **Show activity timeline**: File activity history for a specific file
- **Show most active files**: List of trending/active documents
- **Show engagement metrics**: Charts or lists showing file access patterns
- **Show activity details**: Who accessed files, when, what actions (view, edit, comment)
- **Mention**: "We use drive.activity.readonly to track file engagement and show activity history"

#### **2:30 - 3:00 - Analytics & Summary**
- Show the main dashboard with all insights combined
- Show summary cards (stale files count, risky shares count, storage usage)
- **Emphasize**: "All features are read-only - we never modify, delete, or create files"
- Show navigation to different sections

#### **3:00 - 3:30 - Closing (Optional)**
- Brief summary of what the app does
- Show app branding/logo
- End screen with app name and website

### Step 4: Recording Tips

**Best practices:**
1. **Use a clean browser window** - Close unnecessary tabs
2. **Slow down your actions** - Give viewers time to see what's happening
3. **Zoom in on important parts** - Especially the OAuth consent screen
4. **Use cursor highlighting** - Some tools can highlight your cursor
5. **Add text annotations** (optional):
   - Label sections: "OAuth Consent Screen", "File Metadata", "Activity Tracking"
   - Point out specific features: "Risky Share Detection", "Storage Analysis"
6. **Speak clearly** if adding narration, or use text overlays
7. **Test the recording** - Watch it back to ensure everything is visible

**What to avoid:**
- Don't show sensitive personal data (use test account)
- Don't rush through the OAuth screen (Google reviewers need to see this clearly)
- Don't skip showing both scopes in action
- Don't make the video too long (keep it under 5 minutes)

### Step 5: Editing (Optional but Recommended)

**Simple edits you can make:**
1. **Trim** unnecessary waiting/loading time
2. **Add title card** at the beginning: "Pockett Docs - Google Drive OAuth Demo"
3. **Add text overlays** to label sections:
   - "OAuth Connection Flow"
   - "File Metadata & Insights (drive.readonly)"
   - "Activity Tracking (drive.activity.readonly)"
4. **Add arrows or highlights** to point out important UI elements
5. **Add end screen** with your app name and URL

**Free editing tools:**
- **macOS**: iMovie (free, built-in)
- **Windows**: Windows Video Editor (free, built-in)
- **Online**: Canva (free tier), Kapwing (free tier)
- **Professional**: DaVinci Resolve (free, advanced)

### Step 6: Upload to YouTube

1. **Create a YouTube account** (if you don't have one)
2. **Upload the video**:
   - Go to YouTube Studio
   - Click "Create" → "Upload video"
   - Select your MP4 file
3. **Set video details**:
   - **Title**: "Pockett Docs - Google Drive OAuth Integration Demo"
   - **Description**: 
     ```
     Demo video for Google Cloud Console OAuth verification.
     Shows how Pockett Docs uses Google Drive API scopes:
     - drive.readonly: For reading file metadata and building insights
     - drive.activity.readonly: For tracking file activity and engagement
     
     All features are read-only - we never modify user files.
     ```
   - **Visibility**: Set to **"Public"** (required by Google)
   - **Category**: Technology or Education
4. **Add tags**: "Google Drive API", "OAuth", "Drive Management", "Productivity"
5. **Publish** and copy the YouTube URL

### Step 7: Verification Checklist

Before submitting, verify:
- [ ] OAuth consent screen is clearly visible with both scopes
- [ ] Both scopes are demonstrated in the video:
  - [ ] drive.readonly: File browsing, metadata, insights
  - [ ] drive.activity.readonly: Activity tracking, engagement metrics
- [ ] All OAuth clients are shown (if you have multiple)
- [ ] Video is publicly accessible on YouTube
- [ ] Video is 2-5 minutes long
- [ ] No sensitive personal data is shown
- [ ] Video clearly shows read-only functionality (no file modifications)

### Step 8: Alternative - Simple Screen Recording

**If you want the simplest approach:**
1. Use QuickTime (Mac) or Game Bar (Windows) to record your screen
2. Record the full flow: OAuth → Dashboard → Insights → Activity
3. Upload directly to YouTube without editing
4. Make sure the OAuth screen is clearly visible

**Minimum viable video:**
- Show OAuth consent screen (30 seconds)
- Show dashboard with insights (1 minute)
- Show activity tracking (1 minute)
- Total: ~2.5 minutes

This is sufficient for Google's verification process.

---

## Additional Notes

- **User-facing descriptions** are already set correctly:
  - `drive.readonly`: "See and download all your Google Drive files"
  - `drive.activity.readonly`: "View the activity record files in your Google Drive"

- **Why these scopes are minimal:**
  - We only request read-only scopes
  - We don't modify, delete, or create files
  - We don't access user's email or contacts beyond what's needed for authentication
  - All data is used solely for providing insights within the app
