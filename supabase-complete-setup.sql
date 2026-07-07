-- ============================================
-- TCPR Suppression Lists Tool - Complete Database Setup
-- ============================================
-- This is a comprehensive, single-file setup that:
-- 1. Creates all tables with proper constraints
-- 2. DISABLES RLS (Row Level Security) to prevent 404 errors
-- 3. Manually inserts the admin user (arjav@eagleinfoservice.com)
-- 4. Inserts initial lead types
-- 5. Creates all necessary indexes and triggers
--
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- Enable UUID extension for generating UUID primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- Stores user profiles with role-based access control
-- Roles: 'admin' has full access, 'user' has limited access
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
-- Setters are team members who can be assigned to leads
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
-- Stores lead type categories for classification
-- Examples: customer, bounced, replied, do not contact, unqualified
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
-- entity_type is either 'email' or 'domain'
-- Constraint ensures only one of email/domain is populated per entity
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

-- Create indexes for lead_entities to optimize lookups
-- Partial indexes on entity_type for better query performance
CREATE INDEX IF NOT EXISTS idx_lead_entities_email ON lead_entities(email) WHERE entity_type = 'email';
CREATE INDEX IF NOT EXISTS idx_lead_entities_domain ON lead_entities(domain) WHERE entity_type = 'domain';

-- ============================================
-- 5. LEAD EVENTS TABLE
-- Stores lead events/activities tracking
-- Links to lead_entities, lead_types, setters, and profiles
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

-- Create indexes for lead_events to optimize common queries
CREATE INDEX IF NOT EXISTS idx_lead_events_entity ON lead_events(lead_entity_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_type ON lead_events(lead_type_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_setter ON lead_events(setter_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_by ON lead_events(created_by);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_at ON lead_events(created_at DESC);

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS) - DISABLED
-- RLS is DISABLED to prevent 404 errors
-- Application-level authorization will be used instead
-- ============================================

-- Explicitly DISABLE RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE setters DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_entities DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_events DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. INSERT ADMIN USER
-- Manually insert the admin user with email arjav@eagleinfoservice.com
-- This user will have full admin privileges
-- ============================================

-- First check if admin exists, if not insert
INSERT INTO profiles (email, full_name, role)
VALUES ('arjav@eagleinfoservice.com', 'Arjav', 'admin')
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  full_name = 'Arjav';

-- ============================================
-- 8. INSERT INITIAL LEAD TYPES
-- Populate lead_types table with standard lead categories
-- Uses upsert to handle re-runs safely
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
-- 9. CREATE UPDATED_AT TRIGGERS
-- Automatically update updated_at timestamp on row updates
-- ============================================

-- Create the trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist (safe re-run)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_setters_updated_at ON setters;
DROP TRIGGER IF EXISTS update_lead_types_updated_at ON lead_types;
DROP TRIGGER IF EXISTS update_lead_entities_updated_at ON lead_entities;

-- Create triggers for each table with updated_at column
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_setters_updated_at BEFORE UPDATE ON setters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_types_updated_at BEFORE UPDATE ON lead_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_entities_updated_at BEFORE UPDATE ON lead_entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. VERIFICATION QUERIES
-- Run these to verify the setup completed successfully
-- ============================================

-- View all created tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'setters', 'lead_types', 'lead_entities', 'lead_events')
ORDER BY table_name;

-- Verify admin user was created
SELECT id, email, full_name, role, created_at
FROM profiles
WHERE email = 'arjav@eagleinfoservice.com';

-- Verify lead types were inserted
SELECT id, label, active, sort_order
FROM lead_types
ORDER BY sort_order;

-- Verify indexes were created
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('profiles', 'setters', 'lead_types', 'lead_entities', 'lead_events')
  AND schemaname = 'public'
ORDER BY tablename, indexname;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'setters', 'lead_types', 'lead_entities', 'lead_events')
ORDER BY tablename;

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- Next steps:
-- 1. Verify the admin user exists
-- 2. Test the application can access all tables without 404 errors
-- 3. Implement application-level authorization in your code
-- ============================================
