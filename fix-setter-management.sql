-- ============================================
-- COMPLETE FIX: Setter Management Database Access
-- Run this in Supabase SQL Editor to fix setter management
-- This script will verify and fix all issues at once
-- ============================================

-- First, let's check what we have
DO $$
DECLARE
  user_id UUID;
  profile_count INTEGER;
  role_text TEXT;
BEGIN
  RAISE NOTICE 'Step 1: Checking for user...';

  -- Get the user ID from auth.users
  SELECT id INTO user_id FROM auth.users WHERE email = 'arjav@eagleinfoservice.com';

  IF user_id IS NULL THEN
    RAISE NOTICE 'User arjav@eagleinfoservice.com NOT found in auth.users';
    RAISE EXCEPTION 'Please create the user account first through the app signup.';
  END IF;

  RAISE NOTICE 'Found user ID: %', user_id;

  -- Check if profile exists
  SELECT COUNT(*) INTO profile_count FROM profiles WHERE id = user_id;

  IF profile_count = 0 THEN
    RAISE NOTICE 'Profile not found, creating admin profile...';
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (user_id, 'arjav@eagleinfoservice.com', 'Arjav Jain', 'admin');
  ELSE
    -- Check current role
    SELECT role INTO role_text FROM profiles WHERE id = user_id;
    RAISE NOTICE 'Profile exists with role: %', role_text;

    IF role_text != 'admin' THEN
      RAISE NOTICE 'Updating role to admin...';
      UPDATE profiles SET role = 'admin' WHERE id = user_id;
    END IF;
  END IF;

  RAISE NOTICE '✓ Profile setup complete';
END $$;

-- Verify the profile
SELECT 'Final verification:' as step;
SELECT * FROM profiles WHERE email = 'arjav@eagleinfoservice.com';

-- Check RLS policies on setters table
SELECT 'RLS policies on setters:' as step;
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'setters'
ORDER BY policyname;

-- Test actual database access (should work now)
SELECT 'Testing setter access:' as step;
SELECT * FROM setters LIMIT 5;

-- If you see results above without permission errors, the fix worked!
-- If you see permission errors, run the setup-scripts below.