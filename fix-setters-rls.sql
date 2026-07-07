-- ============================================
-- FIX SCRIPT: Setter Management RLS Policies
-- Run this AFTER running the diagnostic script if permission tests fail
-- This script sets up proper RLS policies for setter management
-- ============================================

-- Step 1: Enable RLS on setters table (if not already enabled)
ALTER TABLE setters ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies on setters (clean slate)
DROP POLICY IF EXISTS "Setters can be read by authenticated" ON setters;
DROP POLICY IF EXISTS "Setters can be inserted by authenticated" ON setters;
DROP POLICY IF EXISTS "Setters can be updated by authenticated" ON setters;
DROP POLICY IF EXISTS "Setters can be deleted by authenticated" ON setters;
DROP POLICY IF EXISTS "Enable read access for all users" ON setters;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON setters;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON setters;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON setters;

-- Step 3: Create comprehensive RLS policies for setter management

-- Policy 1: Authenticated users can READ all setters
CREATE POLICY "Authenticated can read setters"
ON setters
FOR SELECT
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 2: Authenticated users can INSERT setters
CREATE POLICY "Authenticated can insert setters"
ON setters
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 3: Authenticated users can UPDATE setters
CREATE POLICY "Authenticated can update setters"
ON setters
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 4: Authenticated users can DELETE setters
CREATE POLICY "Authenticated can delete setters"
ON setters
FOR DELETE
TO authenticated
USING (true);

-- Step 4: Verify the policies were created
SELECT
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE tablename = 'setters'
ORDER BY policyname;

-- Step 5: Test the policies work correctly
RAISE NOTICE 'Testing RLS policies...';

DO $$
DECLARE
  test_setter_id UUID;
BEGIN
  -- Test INSERT
  BEGIN
    INSERT INTO setters (name, email, active)
    VALUES ('_RLS Test Setter', 'rlstest@diagnostic.com', true)
    RETURNING id INTO test_setter_id;

    RAISE NOTICE '✅ INSERT: Success';

    -- Test UPDATE
    UPDATE setters SET name = '_RLS Test Updated' WHERE id = test_setter_id;
    RAISE NOTICE '✅ UPDATE: Success';

    -- Test SELECT
    PERFORM FROM setters WHERE id = test_setter_id;
    RAISE NOTICE '✅ SELECT: Success';

    -- Test DELETE
    DELETE FROM setters WHERE id = test_setter_id;
    RAISE NOTICE '✅ DELETE: Success';

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Operation failed: %', SQLERRM;
  END;
END $$;

RAISE NOTICE '';
RAISE NOTICE '=== FIX COMPLETE ===';
RAISE NOTICE 'RLS policies have been set up for setter management.';
RAISE NOTICE 'Authenticated users should now be able to:';
RAISE NOTICE '  - View all setters (SELECT)';
RAISE NOTICE '  - Create new setters (INSERT)';
RAISE NOTICE '  - Update existing setters (UPDATE)';
RAISE NOTICE '  - Delete setters (DELETE)';
