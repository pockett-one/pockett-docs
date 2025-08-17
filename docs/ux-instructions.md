# 🎨 UX Design Instructions for Pockett
*"An Executive Assistant for your Document Store"*

Based on the PRD mockups, this document provides detailed UX guidelines for implementing the Pockett interface with Google Drive-inspired design.

---

## 🎯 Design Principles

1. **Google Drive Familiarity**: Leverage Google Drive's proven UI patterns and visual language
2. **Data-Driven**: Prominently display metrics and insights about document usage
3. **Quick Actions**: Primary actions should be easily accessible
4. **Progressive Disclosure**: Show details on demand, keep overview simple
5. **Connector-First**: Design around multiple document store integrations

---

## 📱 Screen-by-Screen UX Instructions

### 1. Public Landing Page

**Layout & Components:**
```
┌─────────────────────────────────────────────────────────┐
│ [Pockett Logo]                    [Sign In] [Sign Up]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│        🗂️ An Executive Assistant for your Document Store │
│                                                         │
│   "Organize, track, and get insights from your         │
│    documents across Google Drive, Box, and Dropbox"    │
│                                                         │
│                    [Get Started Free]                  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ ✅ Connect multiple document stores                     │
│ ✅ Track document engagement and usage                  │
│ ✅ Smart organization and project management           │
│ ✅ Sharing controls with expiry dates                  │
│ ✅ Document summarization with AI                      │
├─────────────────────────────────────────────────────────┤
│         [Screenshots of Dashboard & Analytics]         │
└─────────────────────────────────────────────────────────┘
```

**UX Requirements:**
- **Hero Section**: Large, centered text with clear value proposition
- **Feature List**: Checkmarks with benefit-focused copy
- **Call-to-Action**: Prominent "Get Started Free" button
- **Screenshots**: Show actual product interface
- **Navigation**: Simple header with logo left, auth buttons right

---

### 2. Sign Up Page

**Layout & Components:**
```
┌─────────────────────────────────────────────────────────┐
│ [Pockett Logo]                           [Sign In]      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    Create your account                  │
│                                                         │
│ First Name: [_____________________]                     │
│ Last Name:  [_____________________]                     │
│ Email:      [_____________________]                     │
│ Organization: [___________________] (Optional)          │
│                                                         │
│ □ I agree to the Terms of Service and Privacy Policy   │
│                                                         │
│                    [Create Account]                     │
│                                                         │
│           Already have an account? [Sign In]           │
└─────────────────────────────────────────────────────────┘
```

**UX Requirements:**
- **Form Validation**: Real-time validation with error messages
- **Optional Fields**: Clear labeling for non-required fields
- **Terms Checkbox**: Required before enabling submit button
- **Social Auth**: Consider "Continue with Google" option
- **Mobile Responsive**: Stack fields vertically on mobile

---

### 3. Sign In Page

**Layout & Components:**
```
┌─────────────────────────────────────────────────────────┐
│ [Pockett Logo]                           [Sign Up]      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    Welcome back                         │
│                                                         │
│ Email: [_____________________]                          │
│                                                         │
│                    [Send Login Code]                    │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Check your email for a 6-digit code                │ │
│ │ Code: [___] [___] [___] [___] [___] [___]           │ │
│ │                                                     │ │
│ │ Didn't receive it? [Resend Code]                   │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│           Don't have an account? [Sign Up]             │
└─────────────────────────────────────────────────────────┘
```

**UX Requirements:**
- **Two-Step Process**: Email entry → OTP verification
- **OTP Input**: Individual boxes for each digit
- **Auto-focus**: Automatically move between OTP fields
- **Resend Logic**: Disable resend for 60 seconds, show countdown
- **Error Handling**: Clear messages for invalid codes

---

### 4. Dashboard - Connectors Setup

**Layout & Components:**
```
┌─────────────────────────────────────────────────────────┐
│ [Pockett Logo] [Profile Menu ▼]                         │
├─────────────────────────────────────────────────────────┤
│                     Connect Your Documents              │
│                                                         │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐ │
│ │   [G] Drive     │ │   [B] Box       │ │ [D] Dropbox │ │
│ │                 │ │                 │ │             │ │
│ │   [Connect]     │ │ [Coming Soon]   │ │[Coming Soon]│ │
│ └─────────────────┘ └─────────────────┘ └─────────────┘ │
│                                                         │
│ Connected Services:                                     │
│ • None yet - connect your first service above          │
└─────────────────────────────────────────────────────────┘
```

**UX Requirements:**
- **Connector Cards**: Large, visual cards for each service
- **Status Indicators**: Clear visual difference between available and coming soon
- **Connected List**: Show active connections below
- **Empty State**: Helpful guidance when no connectors are set up

---

### 5. Google Drive Authorization Flow

**Layout & Components:**
```
Step 1: Authorization Request
┌─────────────────────────────────────────────────────────┐
│                   Connect Google Drive                  │
│                                                         │
│ Pockett needs permission to:                           │
│ • View your Google Drive files and folders             │
│ • Read document metadata and sharing settings          │
│ • Track access patterns for insights                   │
│                                                         │
│ We will NOT:                                           │
│ • Store or download your actual documents              │
│ • Modify or delete your files                          │
│ • Share your documents with third parties              │
│                                                         │
│           [Cancel] [Authorize with Google]             │
└─────────────────────────────────────────────────────────┘

Step 2: Success & Import
┌─────────────────────────────────────────────────────────┐
│                ✅ Google Drive Connected                │
│                                                         │
│ Importing your documents...                            │
│ [▓▓▓▓▓▓▓▓░░] 80% complete                              │
│                                                         │
│ Found: 1,247 documents across 45 folders              │
│                                                         │
│                [Continue to Dashboard]                  │
└─────────────────────────────────────────────────────────┘
```

**UX Requirements:**
- **Permission Clarity**: Explicitly state what access is needed and what won't be done
- **Progress Indicator**: Show import progress with file counts
- **Success State**: Clear confirmation of successful connection

---

### 6. Main Dashboard - Documents Tab

**Layout & Components:**
```
┌─────────────────────────────────────────────────────────┐
│ [Pockett] [📁 Documents] [📊 Engagement] [📈 Visualizations] [🔗 Shared] [👥 Contributors] │
├─────────────────────────────────────────────────────────┤
│ Connected: Google Drive (1,247 documents)              │
├─────────────────────────────────────────────────────────┤
│ [📁] My Documents     [🔍 Search documents...]         │
├─────────────────────────────────────────────────────────┤
│ Name ↕                    Modified ↕     Size ↕   Type │
├─────────────────────────────────────────────────────────┤
│ 📁 Project Alpha          Today         -      Folder  │
│ 📄 Q4 Planning.docx       Yesterday    2.1MB    Doc    │
│ 📊 Budget Analysis.xlsx    3 days ago   890KB   Sheet  │
│ 📄 Meeting Notes.docx      1 week ago   456KB    Doc   │
│ 📁 Archive                 2 weeks ago    -     Folder │
│ 📄 Proposal.pdf           3 weeks ago   1.2MB    PDF   │
│ 📄 Specs.docx             1 month ago   678KB    Doc   │
│ 📊 Metrics.xlsx           1 month ago   1.1MB   Sheet  │
│ 📄 Draft.docx             2 months ago  234KB    Doc   │
│ 📁 Old Projects           3 months ago    -     Folder │
├─────────────────────────────────────────────────────────┤
│                      [View More (90 remaining)]        │
└─────────────────────────────────────────────────────────┘
```

**UX Requirements:**
- **Google Drive Look**: Mimic Google Drive's file list styling exactly
- **File Icons**: Use Google Drive's icon system (folder, doc, sheet, etc.)
- **Sortable Columns**: All columns should be sortable
- **Pagination**: "View More" loads next 10 items
- **Search**: Real-time search with filters
- **Breadcrumbs**: Show current folder path

---

### 7. Dashboard - Engagement Tab

**Layout & Components:**
```
┌─────────────────────────────────────────────────────────┐
│ [📁 Documents] [📊 Engagement] [📈 Visualizations] [🔗 Shared] [👥 Contributors] │
├─────────────────────────────────────────────────────────┤
│ Document Access Timeline                                │
├─────────────────────────────────────────────────────────┤
│ [Past Hour] [Past 7 days] [Past 30 days] [Past 90 days] [Dormant] [Duplicates] │
├─────────────────────────────────────────────────────────┤
│ Past 7 days (23 documents accessed)                    │
├─────────────────────────────────────────────────────────┤
│ Document Name                Last Accessed    Access Count │
├─────────────────────────────────────────────────────────┤
│ 📄 Q4 Planning.docx          2 hours ago           12   │
│ 📊 Budget Analysis.xlsx       Yesterday             8   │
│ 📄 Meeting Notes.docx         3 days ago            6   │
│ 📄 Project Specs.docx         5 days ago            4   │
│ 📊 Weekly Report.xlsx         6 days ago            3   │
│ 📄 Proposal Draft.docx        1 week ago            2   │
├─────────────────────────────────────────────────────────┤
│                      [View More (17 remaining)]        │
└─────────────────────────────────────────────────────────┘
```

**UX Requirements:**
- **Timeline Filters**: Prominent filter buttons for different time periods
- **Access Metrics**: Show both last accessed time and total access count
- **Special Categories**: 
  - Dormant: Documents not accessed in 90+ days
  - Duplicates: Files with identical names or content
- **Heat Indicators**: Color-code by access frequency

---

### 8. Dashboard - Visualizations Tab

**Layout & Components:**
```
┌─────────────────────────────────────────────────────────┐
│ [📁 Documents] [📊 Engagement] [📈 Visualizations] [🔗 Shared] [👥 Contributors] │
├─────────────────────────────────────────────────────────┤
│ Document Analytics & Insights                           │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────┬─────────────────────────────────┐ │
│ │   File Types        │        Access Heatmap           │ │
│ │   [Pie Chart]       │     [User Activity Grid]        │ │
│ │ • Docs (45%)        │   Mon Tue Wed Thu Fri Sat Sun   │ │
│ │ • Sheets (30%)      │ 9  ██  ██  █   ██  █   ░   ░    │ │
│ │ • PDFs (15%)        │10  ██  ██  ██  ██  ██  ░   ░    │ │
│ │ • Images (10%)      │11  ██  ██  ██  ██  ██  ░   ░    │ │
│ └─────────────────────┴─────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │              Folder Structure Sunburst                  │ │
│ │    [Interactive Sunburst showing folder hierarchy]      │ │
│ │         Root → Projects → Active → Documents            │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**UX Requirements:**
- **Interactive Charts**: Hover tooltips with detailed data
- **Pie Chart**: File types with percentages and counts
- **Heatmap**: Weekly activity patterns by hour/day
- **Sunburst**: Hierarchical folder structure with size/activity indicators
- **Export Options**: Download charts as PNG/PDF

---

### 9. Dashboard - Shared Tab

**Layout & Components:**
```
┌─────────────────────────────────────────────────────────┐
│ [📁 Documents] [📊 Engagement] [📈 Visualizations] [🔗 Shared] [👥 Contributors] │
├─────────────────────────────────────────────────────────┤
│ Shared Documents Management                             │
├─────────────────────────────────────────────────────────┤
│ Document Name            Created      Expires    Status │
├─────────────────────────────────────────────────────────┤
│ 📄 Q4 Budget.xlsx         Dec 1      Jan 15     Active │
│ 📄 Project Plan.docx      Nov 28     Dec 28     Active │
│ 📄 Meeting Notes.docx     Nov 25     Permanent  Active │
│ 📄 Draft Proposal.pdf     Nov 20     Dec 20     Expired│
│ 📊 Analytics Report.xlsx  Nov 15     Dec 15     Expiring│
│ 📄 Team Guidelines.docx   Oct 30     Permanent  Active │
├─────────────────────────────────────────────────────────┤
│ [🔗 Create New Share] [⚙️ Manage Permissions]          │
└─────────────────────────────────────────────────────────┘
```

**UX Requirements:**
- **Status Indicators**: Color-coded status (Active=green, Expiring=orange, Expired=red)
- **Expiry Management**: Easy-to-scan expiry dates with warnings
- **Quick Actions**: Extend, revoke, or modify sharing permissions
- **Share Creation**: Direct link to create new shared access

---

### 10. Dashboard - Contributors Tab

**Layout & Components:**
```
┌─────────────────────────────────────────────────────────┐
│ [📁 Documents] [📊 Engagement] [📈 Visualizations] [🔗 Shared] [👥 Contributors] │
├─────────────────────────────────────────────────────────┤
│ Top Contributors & Collaboration Insights              │
├─────────────────────────────────────────────────────────┤
│ [Past Hour] [Past 7 days] [Past 30 days] [Past 90 days] │
├─────────────────────────────────────────────────────────┤
│ Past 7 days Activity                                   │
├─────────────────────────────────────────────────────────┤
│ Contributor             Documents    Edits    Comments  │
├─────────────────────────────────────────────────────────┤
│ 👤 Alice Johnson           15         23        8      │
│ 👤 Bob Smith               12         18        12     │
│ 👤 Carol Davis             8          14        6      │
│ 👤 You                     25         45        15     │
│ 👤 Dave Wilson             5          7         3      │
├─────────────────────────────────────────────────────────┤
│ Team Collaboration Summary:                            │
│ • Most active document: Q4 Planning.docx (5 contributors) │
│ • Total team edits: 107                               │
│ • Average response time: 2.3 hours                    │
└─────────────────────────────────────────────────────────┘
```

**UX Requirements:**
- **Timeline Filters**: Same filter system as Engagement tab
- **Activity Metrics**: Documents accessed, edits made, comments added
- **Team Insights**: Collaboration patterns and summary statistics
- **Profile Links**: Click contributor to see their activity details

---

---

## 🎨 Updated Design System (Google Drive Inspired)

### Colors
- **Primary**: `#1a73e8` (Google Blue)
- **Secondary**: `#5f6368` (Google Gray)
- **Success**: `#34a853` (Google Green)
- **Warning**: `#fbbc04` (Google Yellow)
- **Error**: `#ea4335` (Google Red)
- **Background**: `#ffffff` (White)
- **Surface**: `#f8f9fa` (Light Gray)
- **Border**: `#dadce0` (Google Border Gray)

### Typography
- **Font Family**: `'Google Sans', 'Roboto', sans-serif`
- **H1**: 28px, 400 weight
- **H2**: 22px, 400 weight
- **H3**: 16px, 500 weight
- **Body**: 14px, 400 weight
- **Small**: 12px, 400 weight

### Google Drive UI Elements
- **File Icons**: Use Google's Material Design icons
- **Hover States**: Light gray background `#f1f3f4`
- **Selected States**: Light blue background `#e8f0fe`
- **Buttons**: Google's button styling with subtle shadows
- **Tables**: Minimal borders, zebra striping optional

### Spacing (Following Google's 8px Grid)
- **Base unit**: 8px
- **Component padding**: 16px (2 units)
- **Section spacing**: 24px (3 units)
- **Page margins**: 24px (3 units)

### Components
- **Button height**: 36px (Google standard)
- **Input height**: 36px
- **Border radius**: 4px (Google standard)
- **Card elevation**: `0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)`
- **Tab height**: 48px

---

## 📱 Responsive Behavior

### Mobile (< 768px)
- Convert tab navigation to bottom sheet or hamburger menu
- Stack visualizations vertically
- Use Google Drive mobile patterns for file lists
- Full-width buttons and inputs

### Tablet (768px - 1024px)  
- Maintain desktop tab layout
- Two-column layout for connector cards
- Responsive charts that scale appropriately

### Desktop (> 1024px)
- Full tab-based navigation
- Maximum content width: 1200px
- Google Drive-style sidebar for navigation

---

## ♿ Accessibility Requirements

- **Keyboard Navigation**: Full keyboard support following Google's patterns
- **Screen Readers**: Proper ARIA labels for all interactive elements
- **Color Contrast**: Meet WCAG AA standards (4.5:1 minimum)
- **Focus Management**: Clear focus indicators matching Google's style
- **Alt Text**: Descriptive text for all icons and images

---

## 🔄 Interaction Patterns

### Loading States
- Google-style skeleton screens with shimmer effects
- Progress bars for file imports
- Subtle loading spinners for quick actions

### Error States
- Google-style inline error messages with red text
- Toast notifications for system-level errors
- Retry mechanisms with clear instructions

### Success States
- Green checkmark confirmations
- Toast notifications for completed actions
- Smooth transitions for state changes

### Navigation Flow & Implementation
1. **Landing Page** (`/`) → Sign Up/Sign In
   - Added demo instructions section with step-by-step guide
   - Quick skip link to dashboard for immediate preview
   - OTP code hint: `123456` prominently displayed
2. **Authentication** → Connector Setup
   - Sign up form automatically redirects to sign in
   - OTP verification redirects to connectors setup
3. **Connector Setup** (`/setup`) → Google Drive Authorization
   - Google Drive connects, other connectors show "coming soon"
   - Clear visual status indicators for available vs pending connectors
4. **Authorization Complete** (`/auth/google-drive`) → Main Dashboard
   - Animated import progress with live document counting
   - Clear permission explanations before authorization
5. **Dashboard Tabs** (`/dashboard`): Documents → Engagement → Visualizations → Shared → Contributors
   - All tabs fully implemented with mock data and interactive components

### Demo Flow Enhancements
- **OTP Code**: `123456` (clearly displayed on sign-in page)
- **Automatic Redirects**: Seamless flow between all pages
- **Loading States**: Realistic progress indicators and animations
- **Mock Data**: Comprehensive test data across all dashboard tabs
- **Error Handling**: Form validation and user-friendly error messages

---

## 📊 Data Visualization Guidelines

### Charts and Graphs
- Use Google's Material Design color palette
- Interactive tooltips with detailed information
- Consistent axis labeling and legends
- Export functionality for all visualizations

### File Type Icons
- Use Google Drive's official file type icons
- Consistent sizing (24px for list view, 16px for compact)
- Fallback icons for unknown file types

### Status Indicators
- Traffic light system: Green (active), Yellow (warning), Red (error)
- Consistent iconography throughout the application
- Clear visual hierarchy for different states

---

## 🛠 Implementation Notes

### Technical Architecture
- **Framework**: Next.js 14 with App Router and TypeScript
- **Styling**: Tailwind CSS with Google Drive-inspired color scheme
- **Components**: shadcn/ui for consistent UI primitives
- **Charts**: Tremor for data visualizations
- **Icons**: Lucide React for consistent iconography
- **State Management**: React hooks for local component state

### Component Structure
```
frontend/
├── app/                     # Next.js App Router pages
│   ├── page.tsx            # Landing page
│   ├── signup/page.tsx     # Sign up form
│   ├── signin/page.tsx     # Sign in with OTP
│   ├── setup/page.tsx      # Connectors setup
│   ├── auth/google-drive/  # Google Drive authorization
│   └── dashboard/page.tsx  # Main dashboard with tabs
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── dashboard/          # Tab-specific components
└── lib/
    └── utils.ts            # Utility functions
```

### Key Implementation Features
- **Responsive Design**: Works across mobile, tablet, and desktop
- **Form Validation**: Real-time validation with error messages
- **Loading States**: Skeleton screens and progress indicators
- **Mock Data**: Realistic data for all dashboard functionality
- **Navigation**: Seamless flow between all pages
- **Accessibility**: Keyboard navigation and screen reader support

### Demo Enhancements Made
1. **Landing Page**: Added comprehensive demo instructions with step-by-step guide
2. **Authentication**: Streamlined flow with clear OTP hints (`123456`)
3. **Connectors**: Visual status indicators for available vs coming soon integrations
4. **Dashboard**: All 5 tabs fully implemented with realistic mock data
5. **Error Handling**: Graceful degradation and user-friendly feedback


---

## 📱 Responsive Behavior

### Mobile (< 768px)
- Stack charts vertically in project detail
- Convert table to card layout for file lists
- Full-width buttons
- Reduce padding to 16px

### Tablet (768px - 1024px)
- Maintain desktop layout with adjusted proportions
- Two-column layout for dashboard project cards

### Desktop (> 1024px)
- Full layout as specified
- Maximum content width: 1200px, centered

---

## ♿ Accessibility Requirements

- **Keyboard Navigation**: All interactive elements must be keyboard accessible
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Minimum 4.5:1 ratio for text
- **Focus Indicators**: Clear visual focus states
- **Alt Text**: Descriptive alt text for all images and icons

---

## 🔄 Interaction Patterns

### Loading States
- Skeleton screens for initial data loading
- Spinners for action-triggered loading
- Progressive loading for large file lists

### Error States
- Inline error messages for form validation
- Toast notifications for system errors
- Retry mechanisms for failed actions

### Success States
- Toast notifications for successful actions
- Visual feedback for state changes
- Confirmation dialogs for destructive actions