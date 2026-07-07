# Setter Management - Troubleshooting Guide

## Problem Description
When users try to **delete** or **edit** a setter in the admin panel, the UI updates temporarily, but when the page is refreshed, the changes are gone and the data is reset to its original state.

## Root Cause Analysis

The issue is caused by **Row Level Security (RLS) policies** on the `setters` table that are blocking INSERT/UPDATE/DELETE operations from the Supabase client (which uses the `anon` key).

### What's Happening

1. User clicks "Update" or "Delete"
2. **Optimistic update**: UI immediately shows the change
3. Supabase operation is called
4. **RLS blocks the database write** (silently or with error)
5. If error is thrown, state should revert
6. **User refreshes page** → original data loads from database (change was never saved)

## How to Fix

### Step 1: Run the Diagnostic Script

Go to your Supabase dashboard:
1. Navigate to: https://supabase.com/dashboard/project/rgnthglafgpmhiwfvluz/sql
2. Copy the contents of `diagnose-setters-issue.sql`
3. Paste and run it
4. Look at the results:

**Expected if broken:**
```
❌ INSERT test: FAILED - permission denied for table setters
❌ UPDATE test: FAILED - permission denied for table setters
❌ DELETE test: FAILED - permission denied for table setters
```

**Expected if working:**
```
✅ INSERT test: SUCCESS (permission granted)
✅ UPDATE test: SUCCESS (permission granted)
✅ DELETE test: SUCCESS (permission granted)
```

### Step 2: Apply the Fix

If the diagnostic tests failed, run the fix script:

1. Copy the contents of `fix-setters-rls.sql`
2. Paste and run it in Supabase SQL editor
3. Verify you see this output:
```
✅ INSERT: Success
✅ UPDATE: Success
✅ SELECT: Success
✅ DELETE: Success
=== FIX COMPLETE ===
```

### Step 3: Verify in Browser

1. Go to http://localhost:3000/admin
2. Open Browser Console (F12)
3. Try to edit a setter
4. Check console logs:
   - **If working**: `handleSave: Supabase update succeeded`
   - **If broken**: `handleSave: Supabase update error: ...`

### Step 4: Test Persistence

1. Create a test setter
2. Refresh the page (Cmd+R or F5)
3. Verify the setter still exists

## What the Fix Does

The `fix-setters-rls.sql` script creates these RLS policies:

```sql
-- Allow authenticated users to perform all CRUD operations
CREATE POLICY "Authenticated can read setters" ...
CREATE POLICY "Authenticated can insert setters" ...
CREATE POLICY "Authenticated can update setters" ...
CREATE POLICY "Authenticated can delete setters" ...
```

These policies allow **any authenticated user** to manage setters. If you want to restrict this to **admins only**, you would need more complex policies.

## Alternative: Admin-Only Policies

If you want only admins to manage setters, use these policies instead:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated can insert setters" ON setters;
DROP POLICY IF EXISTS "Authenticated can update setters" ON setters;
DROP POLICY IF EXISTS "Authenticated can delete setters" ON setters;

-- Create admin-only policies
CREATE POLICY "Admins can insert setters"
ON setters FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update setters"
ON setters FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete setters"
ON setters FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

## Quick Check Command

Run this in Supabase SQL Editor to quickly check if RLS is the issue:

```sql
-- Quick RLS check for setters
SELECT
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'setters') as policy_count
FROM pg_tables
WHERE tablename = 'setters';
```

Expected result:
```
tablename | rls_enabled | policy_count
----------|--------------|-------------
setters   | true         | 4
```

If `policy_count` is 0 or only has 1 (SELECT only), that's the problem!

## Browser Console Debugging

If you want to see exactly what's happening in the browser:

1. Open http://localhost:3000/admin
2. Open Console (F12)
3. Add this snippet to watch all Supabase operations:

```javascript
// Add to browser console to log all Supabase calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('🔍 Supabase Request:', args[0]);
  return originalFetch.apply(this, args).then(response => {
    console.log('📦 Supabase Response:', response.status, response.statusText);
    return response;
  });
};
```

This will show you every request to Supabase and whether it succeeded or failed.
