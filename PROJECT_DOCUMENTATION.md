# TCPR Suppression Lists Tool

## 🎯 Overview

A professional internal lead suppression and lead-status intake tool built with React, TypeScript, and Supabase. The application enables teams to manage contact lists (emails/domains) for suppression purposes, track lead sources (setters), categorize lead types, and maintain a complete audit trail.

---

## 🚀 Features

### Authentication & Authorization
- Email/password authentication via Supabase Auth
- Automatic profile creation on signup
- Role-based access control (Admin/User)
- Protected routes with authentication guard

### Dashboard
- **Real-time Metrics**: Total records, today's records, weekly and monthly counts
- **Visual Charts**: Lead type distribution, entity type breakdown (email vs domain), 7-day trend analysis
- **Recent Activity**: Latest 10 lead events with full details

### Manual Lead Intake
- **Smart Parsing**:
  - Auto-detects emails vs domains
  - Normalizes to lowercase
  - Extracts domains from emails
  - Strips protocols, www, paths from URLs
  - Validates format and deduplicates
- **Preview System**: Review parsed results before submission
- **Event History**: No overwrites - creates new events each time

### CSV Bulk Import
- **Template System**: Downloadable CSV template
- **Validation Pipeline**: File format validation, row-by-row validation, error reporting
- **Batch Processing**: Configurable batch sizes with continue-on-error mode
- **Rate Limiting**: 1000 imports per day quota
- **Progress Tracking**: 5-step wizard (upload → validation → preview → importing → complete)

### Records Management
- **Table View**: All lead events with joined entity, lead type, and setter info
- **Filters**: Search by email/domain, filter by lead type and setter
- **CSV Export**: Export displayed records

### Admin Panel
- **Setter Management**: CRUD operations for team members
- **Auto Role Grant**: Automatic admin assignment on access
- **Active/Inactive Toggle**: Quick status changes

---

## 🏗️ Architecture

### Tech Stack
```
Frontend:  React 18 + TypeScript + Vite
Database:  Supabase (PostgreSQL)
Auth:      Supabase Auth (email/password)
Styling:   Plain CSS + Tailwind CSS
Icons:     Lucide React
Charts:    Recharts
Routing:  React Router v7
```

### Database Schema

```sql
profiles          -- User profiles (linked to Supabase Auth)
  ├── id (UUID, PK)
  ├── email
  ├── full_name
  ├── role (admin/user)
  └── created_at

setters           -- Team members who manage leads
  ├── id (UUID, PK)
  ├── name
  ├── email
  ├── active (boolean)
  └── created_at

lead_types        -- Categories for lead classification
  ├── id (TEXT, PK)
  ├── label
  ├── active
  └── sort_order

lead_entities     -- Unique emails/domains
  ├── id (UUID, PK)
  ├── entity_type (email/domain)
  ├── email
  ├── domain
  ├── created_at
  └── updated_at

lead_events       -- Audit trail for lead events
  ├── id (UUID, PK)
  ├── lead_entity_id (FK)
  ├── lead_type_id (FK)
  ├── setter_id (FK)
  ├── raw_input
  ├── notes
  ├── source
  ├── created_by (FK)
  └── created_at
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Admin/
│   │   ├── index.tsx                    -- Admin wrapper
│   │   └── SetterManagement.tsx         -- Setter CRUD
│   ├── Auth.tsx                        -- Login/Signup
│   ├── Dashboard/
│   │   ├── index.tsx                   -- Main dashboard
│   │   ├── MetricCard.tsx              -- Metric cards
│   │   ├── LeadTypeChart.tsx           -- Lead type chart
│   │   ├── EntityTypeChart.tsx         -- Entity type chart
│   │   ├── TrendChart.tsx              -- 7-day trend chart
│   │   └── RecentActivity.tsx          -- Recent activity table
│   ├── Import/
│   │   ├── index.tsx                   -- Import wizard
│   │   ├── TemplateSection.tsx         -- Template download
│   │   ├── UploadSection.tsx           -- File upload
│   │   ├── ValidationResults.tsx        -- Validation display
│   │   ├── ConfirmPreview.tsx           -- Preview before import
│   │   ├── ProgressTracker.tsx          -- Step indicator
│   │   └── ResultsSummary.tsx          -- Import results
│   ├── IntakeForm.tsx                  -- Manual intake
│   ├── Records/
│   │   ├── index.tsx                   -- Records page
│   │   ├── RecordsTable.tsx            -- Records table
│   │   └── FiltersBar.tsx              -- Filter controls
│   ├── Settings.tsx                    -- Settings page
│   └── layout/
│       ├── AppLayout.tsx               -- Main layout
│       ├── Sidebar.tsx                 -- Sidebar navigation
│       ├── TopBar.tsx                  -- Top bar with user menu
│       └── MobileNavigation.tsx        -- Mobile nav
├── contexts/
│   ├── AuthContext.tsx                -- Authentication state
│   ├── NavigationContext.tsx          -- Mobile nav state
│   └── ToastContext.tsx               -- Notification system
├── lib/
│   ├── supabase.ts                    -- DB client + types
│   ├── parseInputs.ts                 -- Input parsing
│   ├── csvParser.ts                   -- CSV parsing
│   ├── csvValidator.ts                -- CSV validation
│   ├── importService.ts               -- Bulk import
│   ├── exportCsv.ts                   -- CSV export
│   ├── roleCheck.ts                   -- Role helpers
│   └── logger.ts                      -- Logging utility
├── router/
│   ├── index.tsx                      -- Route configuration
│   └── ProtectedRoute.tsx             -- Auth guard
├── App.tsx                            -- Root + providers
└── main.tsx                           -- Entry point
```

---

## 🔄 End-to-End Workflows

### User Registration & Login
```
User → /auth → Sign up → Auto profile creation → Redirect to Dashboard
User → /auth → Login → Session created → Dashboard
```

### Adding Leads (Manual)
```
Dashboard → "Add New" → Add Leads Page
  → Paste input → Parse → Preview → Submit → Success
```

### Adding Leads (CSV Import)
```
Dashboard → Import → Download Template
  → Fill CSV → Upload → Validate → Preview → Import → Results
```

### Viewing Records
```
Dashboard → View All Records → Apply Filters → Export CSV
```

### Admin: Managing Setters
```
Dashboard → Admin → Add/Edit/Delete Setters
```

---

## ⚙️ Setup & Deployment

### Local Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Run locally
npm run dev
# App at http://localhost:3000
```

### Database Setup

1. Create Supabase project at https://supabase.com
2. Run the SQL schema (see README.md for full schema)
3. Insert sample data into `setters` and `lead_types`
4. Configure RLS policies (see `fix-setters-rls.sql`)
5. Get credentials from Project Settings → API

### Deployment to Netlify

```bash
# Build for production
npm run build

# Or use Git-based deployment:
# Push to GitHub → Connect in Netlify → Auto-deploy
```

Environment variables in Netlify:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 🐛 Current Known Issue

### Setter Management Persistence Issue

**Problem**: When editing or deleting a setter in the admin panel, the UI updates temporarily but changes don't persist after page refresh.

**Root Cause**: Row Level Security (RLS) policies on the `setters` table are blocking INSERT/UPDATE/DELETE operations.

**Fix**: Run the `fix-setters-rls.sql` script in Supabase SQL Editor to create proper RLS policies.

**Status**: Fix scripts provided - see `SETTER_FIX_ACTION_PLAN.md` for detailed instructions.

**Files for Fix**:
- `diagnose-setters-issue.sql` - Diagnostic script
- `fix-setters-rls.sql` - Fix script
- `SETTER_FIX_ACTION_PLAN.md` - Complete guide

---

## 📊 Acceptance Tests

✅ Mixed input parsing: `john@brand.com, https://www.nike.com/about, apple.com`
✅ Invalid input handling: `bad input here` → skipped
✅ Duplicate detection: Same input twice → second marked duplicate
✅ Domain cleanup: `https://www.example.com/path?x=1` → `example.com`
✅ Event history: Same email twice → one entity, two events
✅ CSV import with validation and batch processing
✅ Admin role auto-assignment on admin page access
✅ Optimistic UI updates with error reverts

---

## 🔐 Security

- ✅ Supabase anon key (never service_role in frontend)
- ✅ RLS enabled on all tables
- ✅ Auth required for all operations
- ✅ Input validation on client and server
- ✅ No sensitive data in API responses
- ✅ Proper error handling

---

## 📝 License

Internal use only.
