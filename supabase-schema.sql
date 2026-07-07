-- ============================================
-- TCPR Suppression Lists Tool - Database Schema
-- Run this in Supabase SQL Editor to create all tables
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- Stores user profiles with role-based access
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. SETTERS TABLE
-- Stores setter accounts for team management
-- ============================================
CREATE TABLE IF NOT EXISTS setters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. LEAD TYPES TABLE
-- Stores lead type categories
-- ============================================
CREATE TABLE IF NOT EXISTS lead_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. LEAD ENTITIES TABLE
-- Stores unique email/domain entities
-- ============================================
CREATE TABLE IF NOT EXISTS lead_entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('email', 'domain')),
  email TEXT,
  domain TEXT,
  CONSTRAINT lead_entities_email_check CHECK (
    (entity_type = 'email' AND email IS NOT NULL AND domain IS NULL) OR
    (entity_type = 'domain' AND domain IS NOT NULL AND email IS NULL)
  ),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for lookups
CREATE INDEX IF NOT EXISTS idx_lead_entities_email ON lead_entities(email) WHERE entity_type = 'email';
CREATE INDEX IF NOT EXISTS idx_lead_entities_domain ON lead_entities(domain) WHERE entity_type = 'domain';

-- ============================================
-- 5. LEAD EVENTS TABLE
-- Stores lead events/activities
-- ============================================
CREATE TABLE IF NOT EXISTS lead_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_entity_id UUID NOT NULL REFERENCES lead_entities(id) ON DELETE CASCADE,
  lead_type_id UUID NOT NULL REFERENCES lead_types(id) ON DELETE SET NULL,
  setter_id UUID REFERENCES setters(id) ON DELETE SET NULL,
  raw_input TEXT NOT NULL,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual_form',
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT lead_events_setter_fk CHECK (
    -- If setter_id is provided, it must reference a valid setter
    setter_id IS NULL OR EXISTS (SELECT 1 FROM setters WHERE setters.id = lead_events.setter_id)
  )
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_lead_events_entity ON lead_events(lead_entity_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_type ON lead_events(lead_type_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_setter ON lead_events(setter_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_by ON lead_events(created_by);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_at ON lead_events(created_at DESC);

-- ============================================
-- 6. INSERT INITIAL LEAD TYPES
-- ============================================
INSERT INTO lead_types (label, active, sort_order) VALUES
  ('customer', true, 1),
  ('bounced', true, 2),
  ('replied', true, 3),
  ('do not contact', true, 4),
  ('unqualified', true, 5)
ON CONFLICT (label) DO UPDATE SET
  active = true,
  sort_order = EXCLUDED.sort_order;

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS and set up policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE setters ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles, update only their own
CREATE POLICY IF NOT EXISTS "Users can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid()::text = id::text);

-- Setters: Allow read for authenticated users, write for admins
CREATE POLICY IF NOT EXISTS "Authenticated users can view setters" ON setters FOR SELECT USING (true);

-- Lead types: Allow read for authenticated users
CREATE POLICY IF NOT EXISTS "Authenticated users can view lead types" ON lead_types FOR SELECT USING (true);

-- Lead entities: Allow read for authenticated users
CREATE POLICY IF NOT EXISTS "Authenticated users can view lead entities" ON lead_entities FOR SELECT USING (true);

-- Lead events: Allow read for authenticated users, insert for authenticated users
CREATE POLICY IF NOT EXISTS "Authenticated users can view lead events" ON lead_events FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated users can insert lead events" ON lead_events FOR INSERT WITH CHECK (auth.uid()::text = created_by::text);

-- ============================================
-- 8. CREATE UPDATED_AT TRIGGERS
-- Automatically update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for each table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_setters_updated_at ON setters;
CREATE TRIGGER update_setters_updated_at BEFORE UPDATE ON setters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lead_types_updated_at ON lead_types;
CREATE TRIGGER update_lead_types_updated_at BEFORE UPDATE ON lead_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lead_entities_updated_at ON lead_entities;
CREATE TRIGGER update_lead_entities_updated_at BEFORE UPDATE ON lead_entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. VERIFICATION QUERIES
-- Run these to verify the setup
-- ============================================

-- View all created tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'setters', 'lead_types', 'lead_entities', 'lead_events')
ORDER BY table_name;

-- Verify lead types
SELECT * FROM lead_types ORDER BY sort_order;

-- Verify indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('profiles', 'setters', 'lead_types', 'lead_entities', 'lead_events')
  AND schemaname = 'public'
ORDER BY tablename, indexname;
