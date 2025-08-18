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
│          Connect your documents and unlock powerful     │
│              insights in minutes                        │
│          🛡️ Enterprise-grade security • SOC 2 compliant │
│                                                         │
│ First Name: [_____________________]                     │
│ Last Name:  [_____________________]                     │
│ Email:      [_____________________]                     │
│ Organization: [___________________] (Optional - Progressive) │
│                                                         │
│ □ I agree to the Terms of Service and Privacy Policy   │
│                                                         │
│           [🔄 Creating account...] / [✅ Account created!] │
│                                                         │
│                        ────── or ──────                │
│                [Continue with Google]                   │
│                                                         │
│           Already have an account? [Sign In]           │
└─────────────────────────────────────────────────────────┘
```

**UX Requirements:**
- **Value Proposition**: Clear benefit statement with trust signals
- **Smart Defaults**: Auto-capitalize names, trim/lowercase emails
- **Progressive Disclosure**: Organization field appears after email validation
- **Micro-interactions**: Loading spinners, success states with checkmarks
- **Enhanced Loading**: "Creating account..." → "Account created! Sending code..."
- **Trust Signals**: Security badges and SOC 2 compliance indicators

---

### 3. Sign In Page

**Layout & Components:**
```
┌─────────────────────────────────────────────────────────┐
│ [Pockett Logo]                           [Sign Up]      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    Welcome back                         │
│           🛡️ 256-bit encrypted • Secure authentication  │
│                                                         │
│ Email: [_____________________]                          │
│                                                         │
│            [🔄 Sending code...] / [Send Login Code]     │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Check your email for a 6-digit code                │ │
│ │ 💡 Demo hint: Use code 123456                      │ │
│ │ Code: [___] [___] [___] [___] [___] [___]           │ │
│ │                                                     │ │
│ │ Didn't receive it? [Resend in 60s] / [Resend Code] │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│        [🔄 Verifying...] / [✅ Success! Redirecting...] │
│                                                         │
│           Don't have an account? [Sign Up]             │
└─────────────────────────────────────────────────────────┘
```

**UX Requirements:**
- **Trust Signals**: Security indicators with shield icons
- **Enhanced OTP UX**: Auto-advance between fields, paste support for 6-digit codes
- **Micro-interactions**: Loading spinners, success confirmations with checkmarks
- **Better Error Messages**: "The code you entered is incorrect. Please check your email and try again."
- **Improved Loading States**: "Sending code..." → "Verifying..." → "Success! Redirecting..."
- **Paste Support**: Detect 6-digit paste in first field, auto-fill all fields

---

### 3a. Consolidated Authentication Flow (NEW)

**Layout & Components:**
```
┌─────────────────────────────────────────────────────────┐
│ [Pockett Logo]                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│               Welcome to Pockett                        │
│           Enter your email to get started              │
│           🛡️ 256-bit encrypted • Secure authentication  │
│                                                         │
│ Email: [_____________________]                          │
│                                                         │
│                  [🔄 Checking...] / [Continue]          │
│                                                         │
│                        ────── or ──────                │
│                [Continue with Google]                   │
└─────────────────────────────────────────────────────────┘

│ ↓ Existing User Detected → OTP Flow                    │
│ ↓ New User Detected → Sign Up Form                     │

┌─────────────────────────────────────────────────────────┐
│                   Create your account                   │
│          Connect your documents and unlock powerful     │
│              insights in minutes                        │
│           🛡️ Enterprise-grade security • SOC 2 compliant│
│                                                         │
│ First Name: [John] (auto-capitalized)                  │
│ Last Name:  [Smith] (auto-capitalized)                 │
│ Organization: [___________________] (appears progressively)│
│                                                         │
│ □ I agree to the Terms of Service and Privacy Policy   │
│                                                         │
│         [✅ Account created! Sending code...]           │
└─────────────────────────────────────────────────────────┘
```

**UX Requirements:**
- **Smart User Detection**: Automatically determines sign-in vs sign-up flow
- **Single Entry Point**: One email field handles both scenarios
- **Progressive Enhancement**: Organization field appears after email validation
- **Contextual Messaging**: Different security badges for different flow stages
- **Seamless Transitions**: Smooth flow between email → form → OTP
- **Google OAuth Priority**: Prominently placed as primary authentication method

---

### 4. Dashboard - Profile Bubble & User Management

**Layout & Components:**
```
┌─────────────────────────────────────────────────────────┐
│ [Pockett Logo]                         [JS ▼]          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Profile Dropdown (when clicked):                       │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [JS]  John Smith                                   │ │
│ │       📧 john.smith@verylongcompanyname.com        │ │
│ │       🏢 John's Organization Name That Might Be    │ │
│ │           Very Long And Need Text Wrapping         │ │
│ │ ───────────────────────────────────────────────────│ │
│ │ 🚪 Sign out                                        │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**UX Requirements:**
- **Profile Avatar**: Colored circle with user initials (auto-generated from first/last name)
- **Data Persistence**: All profile information stored in browser localStorage
- **Smart Organization Defaults**: If no organization provided during signup, automatically set to "<FirstName>'s Organization"
- **Text Overflow Handling**: Long emails use `break-all`, organization names use `break-words`
- **Responsive Layout**: Fixed maximum width with proper text wrapping for long content
- **Loading States**: Skeleton animation while loading profile data from localStorage
- **Logout Functionality**: Clears authentication session but preserves user profile for returning users
- **Click Outside to Close**: Dropdown closes when clicking elsewhere
- **Profile Details Display**:
  - **Full Name**: firstName + lastName from signup form
  - **Email Address**: Actual email from signup/signin with overflow protection
  - **Organization**: User-provided or auto-generated "<FirstName>'s Organization"
  - **Visual Icons**: User icon for email, building icon for organization

### 5. Dashboard - Connectors Setup

**Layout & Components:**
```
┌─────────────────────────────────────────────────────────┐
│ [Pockett Logo]                         [JS ▼]          │
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
│ Found: 1,247 documents across 89 folders              │
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
│                  [View Less] [View More (90 remaining)]        │
└─────────────────────────────────────────────────────────┘
```

**UX Requirements:**
- **Google Drive Look**: Mimic Google Drive's file list styling exactly
- **File Icons**: Use Google Drive's icon system (folder, doc, sheet, etc.)
- **Sortable Columns**: All columns should be sortable
- **Pagination**: Google Drive-style pagination with 10 items per page:
  - "View More" button loads next 10 items
  - "View Less" button resets to first 10 items 
  - Shows remaining count: "(X remaining)"
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
│                  [View Less] [View More (17 remaining)]        │
└─────────────────────────────────────────────────────────┘
```

**UX Requirements:**
- **Timeline Filters**: Prominent filter buttons for different time periods
- **Access Metrics**: Show both last accessed time and total access count
- **Special Categories**: 
  - Dormant: Documents not accessed in 90+ days
  - Duplicates: Files with identical names or content
- **Heat Indicators**: Color-code by access frequency
- **Pagination**: Same Google Drive-style pagination pattern (10 items per page, View More/Less)

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
- **Pagination**: Same Google Drive-style pagination pattern (10 items per page, View More/Less)

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
- **Pagination**: Same Google Drive-style pagination pattern (10 items per page, View More/Less)

---

## 📊 Data Consistency & Pagination Requirements

### Mock Data Synchronization
All document counts throughout the application must be consistent and synchronized:

**Synchronized Document Count: 1,247 documents across 89 folders**

- **Google Drive Import**: Shows exactly 1,247 documents found during authorization
- **Dashboard Header**: "Connected: Google Drive (1,247 documents)"
- **Engagement Tab Filters**: Total counts must add up correctly
  - Past Hour: 5 documents
  - Past 7 days: 23 documents  
  - Past 30 days: 89 documents
  - Past 90 days: 234 documents
  - Dormant (90+ days): 896 documents (1,247 - 351 active)
  - Duplicates: 12 documents
- **All dashboard tabs**: Document lists should reference the same total pool

### Google Drive-Style Pagination Pattern
Implement consistent pagination across all document lists:

**Pagination Specification:**
- **Page Size**: 10 items per page (Google Drive standard)
- **View More**: Loads next 10 items, shows remaining count
- **View Less**: Resets view to first 10 items only
- **Button Labels**: 
  - "View More (X remaining)" where X = total - current_shown
  - "View Less" (only shown when currentPage > 1)
- **Progressive Loading**: Each "View More" click adds 10 more items
- **Reset Behavior**: "View Less" immediately returns to showing only first 10 items

**Implementation Locations:**
- Dashboard Documents tab
- Engagement tab (all time filter results)
- Shared documents tab
- Contributors tab (contributor lists)

### Data Flow Consistency
- **Import Progress**: Animated counter reaching exactly 1,247 documents
- **Filter Totals**: All engagement filters must mathematically add up
- **Cross-Tab References**: Same documents referenced across different views
- **Realistic Timestamps**: Consistent "last accessed" times across tabs

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
1. **Landing Page** (`/`) → Authentication
   - Added demo instructions section with step-by-step guide
   - Quick skip link to dashboard for immediate preview
   - OTP code hint: `123456` prominently displayed

2. **Authentication Options:**
   - **Traditional Flow**: `/signin` and `/signup` (enhanced with micro-interactions)
   - **Consolidated Flow**: `/auth` (NEW - smart user detection)
     - Single email entry → automatic user detection
     - Existing users: Email → OTP verification
     - New users: Email → Sign up form → OTP verification
     - All flows include loading spinners, success states, and trust signals

3. **Connector Setup** (`/setup`) → Google Drive Authorization
   - OTP verification redirects to connectors setup
   - Google Drive connects, other connectors show "coming soon"
   - Clear visual status indicators for available vs pending connectors

4. **Authorization Complete** (`/auth/google-drive`) → Main Dashboard
   - Animated import progress with live document counting
   - Clear permission explanations before authorization

5. **Dashboard Tabs** (`/dashboard`): Documents → Engagement → Visualizations → Shared → Contributors
   - All tabs fully implemented with mock data and interactive components
   - Enhanced profile bubble with localStorage integration and overflow protection
   - Real-time profile display showing actual user signup information

### Demo Flow Enhancements
- **OTP Code**: `123456` (clearly displayed on sign-in page)
- **Automatic Redirects**: Seamless flow between all pages
- **Loading States**: Realistic progress indicators and animations
- **Mock Data**: Comprehensive test data across all dashboard tabs
- **Error Handling**: Form validation and user-friendly error messages

### Recent UX Improvements (2024)

#### Micro-interactions
- **Loading Animations**: Replaced static text with animated spinners (`Loader2` icons)
- **Success States**: Added checkmark confirmations before redirects
- **Smart Defaults**: Auto-capitalize names, trim/lowercase emails automatically

#### Flow Optimization
- **Consolidated Auth**: New `/auth` page with smart user detection
- **Progressive Disclosure**: Organization field appears after email validation
- **Seamless Transitions**: Smooth flow between authentication steps

#### Trust & Security
- **Security Badges**: "256-bit encrypted", "SOC 2 compliant" indicators
- **Trust Signals**: Shield icons throughout authentication flows
- **Clear Value Props**: "Connect your documents and unlock powerful insights in minutes"

#### Enhanced OTP Experience
- **Auto-advance**: Automatic focus between OTP input fields
- **Paste Support**: Detect 6-digit code paste, auto-fill all fields
- **Better Errors**: "The code you entered is incorrect. Please check your email and try again."
- **Loading States**: "Sending code..." → "Verifying..." → "Success! Redirecting..."

#### Implementation Files
- **Enhanced Pages**: `/signin/page.tsx`, `/signup/page.tsx` with improved UX
- **New Consolidated Flow**: `/auth/page.tsx` with smart user detection
- **Micro-interactions**: Loading spinners, success confirmations, error improvements
- **Trust Elements**: Security badges, value propositions, progressive disclosure

#### Profile & Data Management (2024)
- **LocalStorage Integration**: User profile data persists across browser sessions
- **Smart Organization Defaults**: Auto-generates "<FirstName>'s Organization" if not provided
- **Profile Bubble Enhancement**: Real-time profile display with overflow protection
- **Data Flow**: Sign up → localStorage → Profile bubble displays actual user data
- **Logout Handling**: Clears authentication session but preserves user profile data for returning users
- **Loading States**: Skeleton animation while loading profile from localStorage

#### Navigation State Management (2024)
- **Clean URL Structure**: Restructured from query parameters to intuitive path-based navigation
  - `/dashboard/documents` → Documents tab (default landing)
  - `/dashboard/engagement` → Engagement analytics
  - `/dashboard/shared` → Shared documents management
  - `/dashboard/contributors` → Team collaboration insights
  - `/dashboard/connectors` → Document storage connections
- **Active State Logic**: Simple URL matching with trailing slash normalization for reliable highlighting
- **Visual Hierarchy**: Active navigation items show with light blue background (`bg-blue-50`) and blue text (`text-blue-700`) with medium font weight and blue border
- **Redirect Handling**: Legacy URLs (`/dashboard`, `/setup`) automatically redirect to new structure
- **Reliable State Management**: Uses `window.location` and `useEffect` for consistent URL tracking across navigation changes

#### Recent Navigation Improvements Summary (2024)
- **Fixed Menu Highlighting**: Completely rewrote active state detection logic for consistent visual feedback
- **Simplified URL Structure**: Moved from complex query parameters to clean path-based navigation
- **Enhanced User Experience**: Light blue highlighting provides clear visual indication of current page
- **Robust Implementation**: Removed dependency on problematic React hooks, using direct DOM APIs for reliability
- **Consistent Routing**: All dashboard sections follow `/dashboard/{section}` pattern
- **Backward Compatibility**: Legacy URL redirects ensure existing bookmarks continue to work
- **Performance Optimized**: Eliminated unnecessary re-renders and complex state management

---

## 🎨 Landing Page Card Layout Specifications (2025)

### Feature Cards Design System

All feature cards on the landing page follow a consistent flexbox layout pattern to ensure labels stick to the bottom of each card regardless of content length:

**Layout Structure:**
```jsx
<div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200 hover:-translate-y-1 overflow-hidden flex flex-col h-full">
  <div className="p-6 flex-1">
    {/* Card content */}
  </div>
  <div className="bg-green-100 text-green-700 text-center py-2 text-xs font-medium border-t border-green-200 mt-auto">
    Label Text
  </div>
</div>
```

**Key CSS Classes:**
- **Container**: `flex flex-col h-full` - Creates vertical flex container with full height
- **Content Area**: `flex-1` - Expands to fill available space
- **Label**: `mt-auto` - Pushes label to bottom of container

**Label Types:**
- **Featured** (Green): `bg-green-100 text-green-700 border-green-200`
  - Connect multiple document stores
  - Track document engagement and usage  
  - Advanced analytics and insights
- **Coming Soon** (Blue): `bg-blue-100 text-blue-700 border-blue-200`
  - Sharing controls with expiry dates
  - Document summarization with AI
  - Smart organization and project management

**Implementation Requirements:**
1. **Consistent Heights**: All cards maintain equal height using `h-full`
2. **Bottom Alignment**: Labels consistently stick to card bottom via `mt-auto`
3. **Responsive Hover**: Cards lift on hover with `hover:-translate-y-1`
4. **Visual Hierarchy**: Clear distinction between "Featured" and "Coming Soon" labels
5. **Accessibility**: Proper color contrast and semantic structure

**File Location:** `/frontend/app/page.tsx` (lines 189-277)

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
│   ├── auth/page.tsx       # Consolidated auth flow
│   ├── setup/page.tsx      # Connectors setup
│   ├── auth/google-drive/  # Google Drive authorization
│   └── dashboard/page.tsx  # Main dashboard with tabs
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── navigation/
│   │   └── sidebar.tsx     # Enhanced sidebar with profile bubble
│   └── dashboard/          # Tab-specific components
└── lib/
    ├── utils.ts            # Utility functions
    └── auth-utils.ts       # LocalStorage user data management
```

### Profile System Technical Implementation

**LocalStorage Data Schema:**
```typescript
interface UserData {
  firstName: string
  lastName: string
  email: string
  organization: string    // Auto-generated if not provided
  initials: string       // Auto-generated from first/last name
}

// Separate authentication session management
interface AuthSession {
  isAuthenticated: boolean
  timestamp: number
}
```

**Key Functions (`lib/auth-utils.ts`):**
- `saveUserData()` - Saves profile with auto-generated defaults (persistent)
- `getUserData()` - Retrieves profile from localStorage (persistent)
- `setAuthSession()` - Sets authentication state (session-based)
- `getAuthSession()` - Checks if user is currently authenticated
- `clearAuthSession()` - Clears auth session on logout (keeps user profile)
- `generateInitials()` - Creates initials from names
- `getDefaultUserData()` - Fallback data for new sessions

**Data Persistence Strategy:**
- **User Profile Data**: Persists across browser sessions for returning user convenience
- **Authentication State**: Cleared on logout for security, requiring re-authentication
- **Returning User Experience**: Profile data pre-populates sign-in forms and profile bubble

**Profile Bubble Features:**
- **Responsive Design**: Maximum width constraints with text wrapping
- **Overflow Protection**: `break-all` for emails, `break-words` for organization names
- **Loading Animation**: Skeleton UI while loading from localStorage
- **Click Outside Handling**: Auto-close dropdown when clicking elsewhere
- **Error Resilience**: Graceful fallback to default data if localStorage fails

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