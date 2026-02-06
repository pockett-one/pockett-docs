# 📄 Product Requirements Document (PRD)  
**Product Name**: (Working name: Pockett Docs)  
**Core Promise**: *“Bring order to your Docs.”*  

---

## 🎯 Vision & Goal  
Freelancers, consultants, and small agencies struggle with messy Google Drives, risky sharing, and client onboarding/offboarding overhead. Our app provides:  
- **Simple insights & control** over their Google Drive.  
- **Flat pricing** that avoids per-user subscription hell.  
- **Project-focused collaboration** without the baggage of Google Workspace.  

---

## 👥 Target Customers  
- Freelancers (designers, developers, writers, accountants, lawyers).  
- Independent consultants & coaches.  
- Small agencies (marketing, design, dev) with <50 collaborators.  
- Students/researchers with project-based collaborations.  

---

## 💰 Subscription Tiers & Feature Sets  

### **1. Free Tier — Insights Only**  
🔎 *Surface the problems, no remediation.*  

- **Browse & Metadata Sync**: Connect Google Drive, fetch file/folder tree.  
- **Analytics Dashboard**:  
  - Most accessed files (7 days).  
  - Largest unused files (90+ days).  
  - Risky shares (e.g. “Anyone with link = Editor”).  
- **Insights Cards (Read-Only)**: Show user risks & inefficiencies.  
- **No actions possible** (read-only).  

👉 *Conversion driver: show the “mess” in Drive, nudge upgrade to fix.*  

---

### **2. Pro Tier — $19/month — Individual Productivity**  
🧑‍💻 *For freelancers & solo consultants.*  

- All Free features, plus:  
- **Watchlist**: Pin important docs for quick access.  
- **Due Dates & Reminders** for key docs.  
- **Storage Cleanup Tools**:  
  - Detect duplicates & near-duplicates.  
  - Find unused large files for deletion/archival.  
- **One-at-a-time Summaries**: Generate summaries for tagging/smart organization.  

👉 *Promise: “Keep your Google Drive lean, organized, and under control.”*  

---

### **3. Team Tier — $49/month flat — up to 50 collaborators**  
👥 *For agencies & teams with rotating clients.*  

- All Pro features, plus:  
- **Project Team Spaces**: Group docs/folders into project workrooms.  
- **Shared Watchlists**: Team-pinned docs.  
- **Assignment Board (Workload View)**:  
  - Columns = collaborators (Editors, Commenters, Viewers).  
  - Rows = documents assigned.  
  - Drag-and-drop assignment.  
  - Permissions sync with Drive automatically.  
- **Access Lifecycle Management**:  
  - Auto-expire/revoke external access after project completion.  
  - One-click revoke all external shares.  
- **Team Engagement Digest**: Weekly summary of doc access across projects.  
- **Client Portal Links**: Branded, expiring, read-only links for clients.  
- **Custom Branding**: White-label client portal with logo, colors, and custom domain options.

👉 *Promise: "Collaborate with clients and subcontractors without per-user billing. Secure, project-based document control."*  

---

## 🚀 Phased Roadmap  

### **Phase I (MVP)**  
- Connect Google Drive (OAuth, API).  
- Fetch file metadata → store in Postgres/Supabase.  
- Build Dashboard: Insights cards (access, storage, shares).  
- Free Tier live.  

### **Phase II**  
- Pro Tier features: Watchlist, reminders, cleanup tools, summaries.  
- Team Tier features: Project Spaces, Shared Watchlists, Assignment Board.  
- Access lifecycle management.  
- Weekly digests.  
- Client Portal (read-only links).  
- Custom Branding (logo, colors, portal customization).  

---

## 📊 Success Metrics  
- **Acquisition**: Waitlist signups → 20% conversion to app connection.  
- **Engagement**: % of users who check Insights weekly.  
- **Conversion**: % Free → Pro (target 5%), % Pro → Team (target 2%).  
- **Retention**: Churn <5% monthly.  
- **Value validation**: “Time saved” and “reduced risks” in user surveys.  

---

## 🛠️ Technical Considerations  
- **Database**: Postgres (Supabase) for relational structure + JSONB for raw metadata.  
- **Frontend**: Next.js + IndexedDB for caching metadata client-side.  
- **Sync**: Incremental sync with Google Drive changes API to avoid hitting rate limits.  
- **Security**: OAuth2 with Google, no password storage.  
- **Scalability**: Team tier capped at 50 active collaborators (fits freelancer/SMB sweet spot).  

---

---

## 🎨 Custom Branding Feature Requirements

### Overview
Custom Branding allows Team Tier users to white-label their client portals with their own logo, brand colors, and customization options. This feature is essential for professional services firms (consulting, advisory, agencies) who need to present a polished, branded experience to clients.

### Feature Tier
**Team Tier Only** ($49/month) - Available for organizations with Team subscription.

### Functional Requirements

#### 1. Logo Management
- **Upload Logo**: 
  - Support for PNG, JPG, SVG formats
  - Maximum file size: 2MB
  - Recommended dimensions: 200x200px (square) or 400x100px (rectangular)
  - Automatic image optimization and resizing
  - Preview of logo as it appears in client portal
- **Change Logo**: 
  - One-click "Change" button to replace existing logo
  - Maintains aspect ratio
  - Shows current logo preview before change
- **Logo Display**:
  - Logo appears in client portal header
  - Logo appears in email notifications (if applicable)
  - Logo appears in branded share links

#### 2. Website Link
- **Custom Website URL**: 
  - Input field for organization's website URL
  - Used as clickable link in client portal footer
  - Validates URL format (must start with http:// or https://)
  - Default: Organization's public website or main domain
  - Example: `https://www.yourfirm.com` or `https://portal.yourfirm.com`

#### 3. Brand Color
- **Primary Brand Color**:
  - Color picker interface (hex, RGB, or visual picker)
  - Color is applied to:
    - Client portal header background
    - Primary action buttons (Save, Share, etc.)
    - Active navigation states
    - Link hover states
  - Preview of color in real-time
  - Default: Pockett brand color (if not set)
  - Color contrast validation (WCAG AA compliance warning)

#### 4. Thumbnails Display
- **Toggle Option**: 
  - Dropdown with options: "Show" / "Hide"
  - Controls whether file thumbnails/previews are displayed in client portal
  - "Show": Displays thumbnail images for supported file types (images, PDFs, etc.)
  - "Hide": Shows only file icons (no preview thumbnails)
  - Default: "Show"

#### 5. Layout Options
- **View Layout**:
  - Dropdown with options: "List" / "Grid" / "Compact"
  - Controls how files and folders are displayed in client portal
  - "List": Traditional list view with file details
  - "Grid": Card-based grid layout with thumbnails
  - "Compact": Dense list view for power users
  - Default: "List"

#### 6. File Format Quality
- **File Format/Quality**:
  - Dropdown with options: "Low" / "Medium" / "High" / "Original"
  - Controls image/document preview quality in client portal
  - "Low": Faster loading, lower quality (for slow connections)
  - "Medium": Balanced quality and performance (default)
  - "High": Higher quality previews
  - "Original": Full resolution (may impact performance)
  - Default: "Medium"
  - Note: Only affects preview quality, not downloadable files

#### 7. Embedded Links
- **Embedded Links Control**:
  - Dropdown with options: "Enabled" / "Disabled"
  - Controls whether embedded content (videos, iframes, etc.) can be displayed in client portal
  - "Enabled": Allows embedded media and external content
  - "Disabled": Blocks embedded content for security/compliance
  - Default: "Disabled" (more secure)
  - Warning message when enabling: "Enabling embedded links may expose clients to external content"

#### 8. Save & Apply
- **Save Button**:
  - Prominent "Save" button (primary action, brand color)
  - Validates all inputs before saving
  - Shows loading state during save
  - Success confirmation message after save
  - Changes apply immediately to all active client portals
  - No "undo" - changes are permanent (with confirmation dialog for destructive changes)

### User Experience Requirements

#### Settings Page Layout
- **Navigation**: Accessible from Organization Settings → Branding
- **Breadcrumb**: `Organization Name > Settings > Branding`
- **Page Header**: "Branding" with organization context
- **Layout**: 
  - Single column form layout
  - Each setting in its own section with label and control
  - Visual preview section (optional) showing how branding appears
  - Save button at bottom (sticky on scroll for long forms)

#### Validation & Error Handling
- **Logo Upload**:
  - File type validation with clear error messages
  - File size validation
  - Image dimension warnings (if too small/large)
- **Website URL**:
  - URL format validation
  - Test link button to verify URL is accessible
- **Color**:
  - Hex color code validation
  - Contrast ratio warnings for accessibility

#### Preview & Testing
- **Live Preview** (Future Enhancement):
  - Preview pane showing how client portal looks with current settings
  - Toggle between preview and settings view
- **Test Portal Link**:
  - "Preview Client Portal" button opens a test portal in new tab
  - Shows exactly how clients will see the branded portal

### Technical Requirements

#### Data Storage
- Store branding settings in `organization` table:
  - `logo_url` (string, nullable)
  - `website_url` (string, nullable)
  - `brand_color` (string, hex color)
  - `show_thumbnails` (boolean)
  - `layout_preference` (enum: 'list', 'grid', 'compact')
  - `file_format_quality` (enum: 'low', 'medium', 'high', 'original')
  - `embedded_links_enabled` (boolean)
- Logo file storage: Upload to cloud storage (Supabase Storage or S3)
  - Generate unique filename: `org-{orgId}-logo-{timestamp}.{ext}`
  - Store public URL in database

#### API Endpoints
- `GET /api/organizations/[slug]/branding` - Get current branding settings
- `PUT /api/organizations/[slug]/branding` - Update branding settings
- `POST /api/organizations/[slug]/branding/logo` - Upload logo (multipart/form-data)

#### Client Portal Application
- Apply branding settings when rendering client portal:
  - Inject brand color CSS variables
  - Display logo in header
  - Apply layout preferences
  - Control thumbnail display
  - Control embedded content

### Security & Permissions
- **Access Control**: Only `ORG_OWNER` role can modify branding settings
- **Logo Upload**: 
  - Validate file type (whitelist: png, jpg, jpeg, svg)
  - Scan for malicious content
  - Rate limiting on uploads (prevent abuse)
- **URL Validation**: 
  - Prevent XSS attacks in website URL
  - Validate URL scheme (http/https only)

### Future Enhancements (Out of Scope for MVP)
- Custom domain support (`portal.yourfirm.com`)
- Custom email templates with branding
- Multiple logo variants (light/dark mode)
- Custom CSS injection (advanced)
- Branding presets/templates
- A/B testing different branding options

---

## 📱 Custom Branding Settings Page - Text Mockup

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Orange Header Bar]                                                     │
│ Pockett Docs > Branding                                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  Branding Settings                                                │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  Logo                                                             │  │
│  │  ┌──────────┐                                                      │  │
│  │  │         │                                                      │  │
│  │  │   [Logo]│  [Change]                                            │  │
│  │  │         │                                                      │  │
│  │  └──────────┘                                                      │  │
│  │  Upload your organization logo (PNG, JPG, SVG, max 2MB)            │  │
│  │                                                                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  Website Link                                                     │  │
│  │  ┌───────────────────────────────────────────────────────────┐  │  │
│  │  │ https://www.yourfirm.com                                    │  │  │
│  │  └───────────────────────────────────────────────────────────┘  │  │
│  │  Your organization's website URL (appears in client portal)     │  │
│  │                                                                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  Color                                                            │  │
│  │  ┌──────────────┐                                                 │  │
│  │  │              │  #FF6B35                                       │  │
│  │  │   [Orange]   │  (or color picker)                              │  │
│  │  │              │                                                 │  │
│  │  └──────────────┘                                                 │  │
│  │  Primary brand color for client portal                           │  │
│  │                                                                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  Thumbnails                                                       │  │
│  │  ┌─────────────────────────────┐                                   │  │
│  │  │ Show                  ▼    │                                   │  │
│  │  └─────────────────────────────┘                                   │  │
│  │  Options: Show | Hide                                             │  │
│  │                                                                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  Layout                                                           │  │
│  │  ┌─────────────────────────────┐                                   │  │
│  │  │ List                   ▼   │                                   │  │
│  │  └─────────────────────────────┘                                   │  │
│  │  Options: List | Grid | Compact                                    │  │
│  │                                                                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  File Format                                                      │  │
│  │  ┌─────────────────────────────┐                                   │  │
│  │  │ Medium                 ▼   │                                   │  │
│  │  └─────────────────────────────┘                                   │  │
│  │  Options: Low | Medium | High | Original                          │  │
│  │                                                                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  Embedded Links                                                   │  │
│  │  ┌─────────────────────────────┐                                   │  │
│  │  │ Disabled                ▼   │                                   │  │
│  │  └─────────────────────────────┘                                   │  │
│  │  Options: Enabled | Disabled                                      │  │
│  │  ⚠️ Enabling may expose clients to external content               │  │
│  │                                                                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                                                      [Save]       │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Mockup Notes:
- **Header**: Orange header bar with breadcrumb navigation
- **Layout**: White card on light gray background
- **Form Structure**: Each setting in its own section with label, control, and helper text
- **Logo Section**: Square preview card with "Change" button
- **Input Fields**: Standard text inputs and dropdowns
- **Color Picker**: Visual color display with hex code
- **Save Button**: Prominent orange button (matches brand color) at bottom
- **Spacing**: Generous padding and spacing between sections for clarity

---

## ❌ Out of Scope (for now)  
- Full Kanban/project management boards (avoid feature creep).  
- Deep workflow automation (e.g., approval chains).  
- Multi-cloud integrations (Dropbox, Box, OneDrive) until Google Drive PMF validated.  