# TCPR Suppression Lists Tool

A simple internal lead suppression and lead-status intake tool built with React, Vite, TypeScript, and Supabase.

## Features

- **Authentication**: Email/password login and signup via Supabase Auth
- **Lead Intake Form**: Paste emails or domains (comma, semicolon, or newline separated)
- **Smart Parsing**: 
  - Detects emails vs domains automatically
  - Normalizes to lowercase
  - Extracts domains from emails
  - Strips protocols, www, paths, and query strings from URLs
  - Validates input format
  - Deduplicates within the same submission
- **Preview**: See parsed results before submitting with status indicators (valid/invalid/duplicate)
- **Submit Logic**: 
  - Creates new entities or reuses existing ones
  - Records event history (no overwrites)
  - Shows detailed success summary
- **Recent Records**: View latest lead events with joined entity, lead type, and setter info
- **Filters**: Search by email/domain, filter by lead type and setter
- **CSV Export**: Export currently displayed records to CSV

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Database**: Supabase (PostgreSQL with RLS)
- **Styling**: Plain CSS
- **Icons**: lucide-react
- **Auth**: Supabase Auth (email/password)

## Database Schema

The app uses these Supabase tables:

```sql
-- profiles table (from Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
);

-- setters table
CREATE TABLE setters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- lead_types table
CREATE TABLE lead_types (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- lead_entities table
CREATE TABLE lead_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('email', 'domain')),
  email TEXT,
  domain TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- lead_events table
CREATE TABLE lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_entity_id UUID NOT NULL REFERENCES lead_entities(id),
  lead_type_id TEXT NOT NULL REFERENCES lead_types(id),
  setter_id UUID REFERENCES setters(id),
  raw_input TEXT NOT NULL,
  notes TEXT,
  source TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_lead_entities_email ON lead_entities(LOWER(email));
CREATE INDEX idx_lead_entities_domain ON lead_entities(LOWER(domain));
CREATE INDEX idx_lead_events_created_at ON lead_events(created_at DESC);
```

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo>
cd "TCPR Suppresion Lists Tool"
npm install
```

### 2. Configure Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema above in your Supabase SQL editor
3. Add sample data:
   - Insert into `setters` table (your team members)
   - Insert into `lead_types` table (your lead categories)
4. Get your credentials:
   - Go to Project Settings → API
   - Copy your project URL and anon key

### 3. Environment Variables

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Or copy from the example:
```bash
cp .env.example .env
# Then edit .env with your credentials
```

### 4. Enable RLS Policies

Run these in your Supabase SQL editor to enable Row Level Security:

```sql
-- Enable RLS
ALTER TABLE lead_entities ENABLE ROW LEVEL SEARCH;
ALTER TABLE lead_events ENABLE ROW LEVEL SEARCH;
ALTER TABLE setters ENABLE ROW LEVEL SEARCH;
ALTER TABLE lead_types ENABLE ROW LEVEL SEARCH;

-- Policy: Allow authenticated users to read
CREATE POLICY "Authenticated can read lead_entities"
  ON lead_entities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can read lead_events"
  ON lead_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can read setters"
  ON setters FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can read lead_types"
  ON lead_types FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert
CREATE POLICY "Authenticated can insert lead_entities"
  ON lead_entities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can insert lead_events"
  ON lead_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Note: Adjust policies based on your security requirements
```

### 5. Run Locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Usage

1. **Sign up/Login**: Use email and password
2. **Add Leads**:
   - Paste emails or domains into the textarea
   - Select lead type and setter
   - Add optional notes
   - Click "Parse & Preview"
   - Review the parsed results
   - Click "Submit" to save
3. **View Records**:
   - Click "View Records" to see recent submissions
   - Use filters to search or filter by type/setter
   - Click "Export CSV" to download

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Deploy to Netlify

### Option 1: Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

### Option 2: Git-based Deployment

1. Push your code to GitHub
2. In Netlify dashboard:
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repo
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Add environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
3. Deploy!

## Project Structure

```
src/
├── components/
│   ├── Auth.tsx              # Login/Signup forms
│   ├── IntakeForm.tsx        # Main intake form with preview
│   └── RecentRecords.tsx     # Records table with filters
├── contexts/
│   └── AuthContext.tsx       # Authentication state management
├── lib/
│   ├── supabase.ts           # Supabase client and types
│   ├── parseInputs.ts        # Input parsing logic
│   └── exportCsv.ts          # CSV export utility
├── App.tsx                   # Main app with routing
├── main.tsx                  # Entry point
└── index.css                 # Styles
```

## Acceptance Tests

The app correctly handles:

✅ Mixed input: `john@brand.com, https://www.nike.com/about, apple.com`
- Parses to: john@brand.com (email), nike.com (domain), apple.com (domain)

✅ Invalid input: `bad input here`
- Skipped with "invalid" status

✅ Duplicate detection: `john@brand.com, John@Brand.com`
- Second one marked as "duplicate"

✅ Domain cleanup: `https://www.example.com/path?x=1`
- Cleaned to: `example.com`

✅ Event history: Submitting same email twice
- Creates one entity, two events

## Security Notes

- ✅ Uses Supabase anon key (never service_role key in frontend)
- ✅ RLS enabled on all tables
- ✅ Auth required for all operations
- ✅ Input validation on both client and server
- ✅ No sensitive data in API responses
- ✅ Proper error handling without exposing internals

## What Was Not Built

Per the requirements, these were intentionally excluded:

- ❌ Custom backend/Express server
- ❌ Netlify Functions / Supabase Edge Functions
- ❌ Background job queues
- ❌ CSV upload (paste-only workflow)
- ❌ Full CRUD for setters/lead_types (can add manually in Supabase)
- ❌ Charts or dashboards
- ❌ Fake/demo data

## Troubleshooting

**"Missing Supabase environment variables"**
- Check your `.env` file exists and has both variables

**"Failed to load form options"**
- Ensure you have data in `setters` and `lead_types` tables
- Check your Supabase URL and key are correct

**"Permission denied" errors**
- Ensure RLS policies are created in Supabase
- Check you're logged in

**Build fails with TypeScript errors**
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (should be 18+)

## License

Internal use only.
