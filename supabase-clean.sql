-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Setters table
CREATE TABLE IF NOT EXISTS setters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead types table
CREATE TABLE IF NOT EXISTS lead_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead entities table
CREATE TABLE IF NOT EXISTS lead_entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  email TEXT,
  domain TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_entities_email ON lead_entities(email);
CREATE INDEX IF NOT EXISTS idx_lead_entities_domain ON lead_entities(domain);

-- Lead events table
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

CREATE INDEX IF NOT EXISTS idx_lead_events_entity ON lead_events(lead_entity_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_type ON lead_events(lead_type_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_setter ON lead_events(setter_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_by ON lead_events(created_by);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_at ON lead_events(created_at DESC);

-- Insert lead types
INSERT INTO lead_types (label, active, sort_order) VALUES
  ('customer', true, 1),
  ('bounced', true, 2),
  ('replied', true, 3),
  ('do not contact', true, 4),
  ('unqualified', true, 5)
ON CONFLICT (label) DO UPDATE SET
  active = true,
  sort_order = EXCLUDED.sort_order;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE setters ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
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

-- Make arjav@eagleinfoservice.com an admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'arjav@eagleinfoservice.com';
