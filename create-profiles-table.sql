-- Create profiles table and add admin user
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/rgnthglafgpmhiwfvluz/sql

-- Step 1: Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies
CREATE POLICY IF NOT EXISTS "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 4: Add admin profile for arjav@eagleinfoservice.com
-- First, let's check if user exists and get their ID
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO user_id FROM auth.users WHERE email = 'arjav@eagleinfoservice.com';

  IF user_id IS NOT NULL THEN
    -- Insert the admin profile
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (user_id, 'arjav@eagleinfoservice.com', 'Arjav Jain', 'admin')
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      full_name = 'Arjav Jain';

    RAISE NOTICE 'Admin profile created for arjav@eagleinfoservice.com';
  ELSE
    RAISE NOTICE 'User arjav@eagleinfoservice.com not found in auth.users';
  END IF;
END $$;

-- Step 5: Verify
SELECT 'Profiles table setup complete' as status;
SELECT * FROM profiles WHERE email = 'arjav@eagleinfoservice.com';
