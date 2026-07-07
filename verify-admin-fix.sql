-- ============================================
-- QUICK FIX: Verify and fix admin profile for setter management
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check if profile exists
SELECT * FROM profiles WHERE email = 'arjav@eagleinfoservice.com';

-- Step 2: If profile exists but role is not 'admin', update it:
-- UPDATE profiles SET role = 'admin' WHERE email = 'arjav@eagleinfoservice.com';

-- Step 3: If profile doesn't exist, create it (replace YOUR_USER_ID with actual UUID from auth.users):
-- First get the user ID: SELECT id, email FROM auth.users WHERE email = 'arjav@eagleinfoservice.com';
-- Then run:
-- INSERT INTO profiles (id, email, full_name, role)
-- VALUES ('YOUR_USER_ID', 'arjav@eagleinfoservice.com', 'Arjav Jain', 'admin');

-- Step 4: Verify RLS policies exist for setters
SELECT *
FROM pg_policies
WHERE tablename = 'setters';

-- Step 5: Test if admin can access setters
SELECT * FROM setters LIMIT 1;

-- Expected results:
-- Step 1 should show a profile with role='admin'
-- Step 4 should show 4 policies (Admins can read/insert/update/delete setters)
-- Step 5 should return setters data (might be empty table, but no permission error)