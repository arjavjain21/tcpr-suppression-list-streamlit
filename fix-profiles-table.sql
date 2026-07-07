-- ============================================
-- FIX: Create profiles table and setup admin user
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create other necessary tables
CREATE TABLE IF NOT EXISTS setters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  email TEXT,
  domain TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_entity_id UUID NOT NULL,
  lead_type_id UUID NOT NULL,
  setter_id UUID,
  raw_input TEXT NOT NULL,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual_form',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_lead_entities_email ON lead_entities(email);
CREATE INDEX IF NOT EXISTS idx_lead_entities_domain ON lead_entities(domain);
CREATE INDEX IF NOT EXISTS idx_lead_events_entity ON lead_events(lead_entity_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_type ON lead_events(lead_type_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_setter ON lead_events(setter_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_by ON lead_events(created_by);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_at ON lead_events(created_at DESC);

-- Step 5: Insert initial lead types
INSERT INTO lead_types (label, active, sort_order) VALUES
  ('customer', true, 1),
  ('bounced', true, 2),
  ('replied', true, 3),
  ('do not contact', true, 4),
  ('unqualified', true, 5)
ON CONFLICT (label) DO NOTHING;

-- Step 6: Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE setters ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;

-- Step 7: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Add updated_at triggers
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

-- Step 9: RLS Policies for profiles
-- Allow authenticated users to read their own profile
CREATE POLICY IF NOT EXISTS "Users can read own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert their own profile (for signup)
CREATE POLICY IF NOT EXISTS "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admin policy - admins can read all profiles
CREATE POLICY IF NOT EXISTS "Admins can read all profiles"
  ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 10: RLS Policies for setters (admins only)
CREATE POLICY IF NOT EXISTS "Admins can read all setters"
  ON setters
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can insert setters"
  ON setters
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can update setters"
  ON setters
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can delete setters"
  ON setters
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 11: RLS Policies for lead_types (authenticated users can read)
CREATE POLICY IF NOT EXISTS "Authenticated users can read lead types"
  ON lead_types
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Admins can manage lead types"
  ON lead_types
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 12: RLS Policies for lead_entities (authenticated users can read)
CREATE POLICY IF NOT EXISTS "Authenticated users can read lead entities"
  ON lead_entities
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Admins can manage lead entities"
  ON lead_entities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 13: RLS Policies for lead_events (authenticated users can read own)
CREATE POLICY IF NOT EXISTS "Users can read own lead events"
  ON lead_events
  FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY IF NOT EXISTS "Admins can read all lead events"
  ON lead_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Authenticated users can insert lead events"
  ON lead_events
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND created_by = auth.uid());

-- Step 14: Create admin profile for arjav@eagleinfoservice.com
-- This will create the profile with admin role
-- The user needs to already exist in auth.users
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'arjav@eagleinfoservice.com'),
  'arjav@eagleinfoservice.com',
  'Arjav Jain',
  'admin'
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  full_name = 'Arjav Jain';

-- Step 15: Verification queries
SELECT 'Profiles table created successfully' as status;
SELECT COUNT(*) as profile_count FROM profiles WHERE email = 'arjav@eagleinfoservice.com';
SELECT * FROM profiles WHERE email = 'arjav@eagleinfoservice.com';
