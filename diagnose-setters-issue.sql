-- ============================================
-- DIAGNOSTIC SCRIPT: Setter Management Issue
-- Run this in Supabase SQL Editor to diagnose the problem
-- ============================================

-- Step 1: Check if user exists in auth.users
DO $$
DECLARE
  user_id UUID;
BEGIN
  RAISE NOTICE '=== STEP 1: Checking auth.users ===';

  SELECT id INTO user_id FROM auth.users WHERE email = 'arjav@eagleinfoservice.com';

  IF user_id IS NULL THEN
    RAISE NOTICE '❌ User NOT found in auth.users';
  ELSE
    RAISE NOTICE '✅ User found: %', user_id;
  END IF;
END $$;

-- Step 2: Check profiles table
RAISE NOTICE '';
RAISE NOTICE '=== STEP 2: Checking profiles table ===';
SELECT
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE email = 'arjav@eagleinfoservice.com';

-- Step 3: Check setters table
RAISE NOTICE '';
RAISE NOTICE '=== STEP 3: Checking setters table ===';
SELECT
  id,
  name,
  email,
  active,
  created_at
FROM setters
ORDER BY created_at DESC;

-- Step 4: Check RLS status on setters
RAISE NOTICE '';
RAISE NOTICE '=== STEP 4: Checking RLS status ===';
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'setters';

-- Step 5: Check existing RLS policies on setters
RAISE NOTICE '';
RAISE NOTICE '=== STEP 5: Existing RLS policies on setters ===';
SELECT
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE tablename = 'setters'
ORDER BY policyname;

-- Step 6: Test INSERT permission (simulate what the app does)
RAISE NOTICE '';
RAISE NOTICE '=== STEP 6: Testing INSERT permission ===';
-- Note: This will test with the current session user
-- The app uses anon key, so we need to test with anon context
DO $$
DECLARE
  test_setter_id UUID;
  test_result TEXT;
BEGIN
  -- Generate test ID
  test_setter_id := gen_random_uuid();

  -- Attempt to insert
  BEGIN
    INSERT INTO setters (id, name, email, active)
    VALUES (test_setter_id, '_Test Setter', 'test@diagnostic.com', true);

    -- Clean up test data
    DELETE FROM setters WHERE id = test_setter_id;

    RAISE NOTICE '✅ INSERT test: SUCCESS (permission granted)';

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ INSERT test: FAILED - %', SQLERRM;
  END;
END $$;

-- Step 7: Test UPDATE permission
RAISE NOTICE '';
RAISE NOTICE '=== STEP 7: Testing UPDATE permission ===';
DO $$
DECLARE
  test_setter_id UUID;
  test_result TEXT;
BEGIN
  -- Create a test setter
  INSERT INTO setters (name, email, active)
  VALUES ('_Update Test', 'updatetest@diagnostic.com', true)
  RETURNING id INTO test_setter_id;

  -- Attempt to update
  BEGIN
    UPDATE setters SET name = '_Updated Test' WHERE id = test_setter_id;
    RAISE NOTICE '✅ UPDATE test: SUCCESS (permission granted)';

    -- Clean up
    DELETE FROM setters WHERE id = test_setter_id;

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ UPDATE test: FAILED - %', SQLERRM;
    -- Clean up
    DELETE FROM setters WHERE id = test_setter_id;
  END;
END $$;

-- Step 8: Test DELETE permission
RAISE NOTICE '';
RAISE NOTICE '=== STEP 8: Testing DELETE permission ===';
DO $$
DECLARE
  test_setter_id UUID;
  test_result TEXT;
BEGIN
  -- Create a test setter
  INSERT INTO setters (name, email, active)
  VALUES ('_Delete Test', 'deletetest@diagnostic.com', true)
  RETURNING id INTO test_setter_id;

  -- Attempt to delete
  BEGIN
    DELETE FROM setters WHERE id = test_setter_id;
    RAISE NOTICE '✅ DELETE test: SUCCESS (permission granted)';

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ DELETE test: FAILED - %', SQLERRM;
    -- Clean up
    DELETE FROM setters WHERE id = test_setter_id;
  END;
END $$;

-- Step 9: Check if we're using anon key or service role
RAISE NOTICE '';
RAISE NOTICE '=== STEP 9: Current session info ===';
SELECT
  current_user as database_user,
  current_database(),
  inet_server_addr() as server_ip,
  session_user;

RAISE NOTICE '';
RAISE NOTICE '=== DIAGNOSTIC COMPLETE ===';
RAISE NOTICE 'Look at the results above:';
RAISE NOTICE '1. Is RLS enabled on setters table?';
RAISE NOTICE '2. Are there policies for INSERT/UPDATE/DELETE?';
RAISE NOTICE '3. Do the permission tests pass or fail?';
RAISE NOTICE 'If tests fail, run the FIX script below.';
