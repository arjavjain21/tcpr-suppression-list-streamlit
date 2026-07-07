-- ============================================
# IMMEDIATE FIX: Make setter management work
# Run this in: https://supabase.com/dashboard/project/rgnthglafgpmhiwfvluz/sql
# ============================================

-- Step 1: Verify your profile
DO $$
DECLARE
  user_id UUID;
  current_role TEXT;
BEGIN
  -- Get user ID
  SELECT id INTO user_id FROM auth.users WHERE email = 'arjav@eagleinfoservice.com';

  IF user_id IS NULL THEN
    RAISE NOTICE 'User not found in auth.users';
  END IF;

  -- Get current role
  SELECT role INTO current_role FROM profiles WHERE id = user_id;

  RAISE NOTICE 'User ID: %', user_id;
  RAISE NOTICE 'Current role: %', COALESCE(current_role, 'NO PROFILE');
END $$;

-- Step 2: Ensure profile has admin role
DO $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = 'arjav@eagleinfoservice.com';

  -- Update or insert profile with admin role
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (user_id, 'arjav@eagleinfoservice.com', 'Arjav Jain', 'admin')
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin';

  RAISE NOTICE '✓ Profile set to admin role';
END $$;

-- Step 3: Verify the fix
SELECT 'Final verification:' as step;
SELECT * FROM profiles WHERE email = 'arjav@eagleinfoservice.com';

-- Step 4: Test actual setter access
SELECT 'Testing setter operations:' as step;
SELECT * FROM setters LIMIT 5;

-- Expected:
-- - Profile shows role='admin'
-- - Setters table shows your 3 test setters
-- No permission errors