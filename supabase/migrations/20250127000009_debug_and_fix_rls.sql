-- =====================================================
-- DEBUG AND FIX: Diagnose and fix RLS issues
-- =====================================================

-- First, let's check if RLS is enabled
DO $$
DECLARE
  rls_status RECORD;
BEGIN
  SELECT relrowsecurity, relforcerowsecurity
  INTO rls_status
  FROM pg_class
  WHERE oid = 'public.challenges'::regclass;

  RAISE NOTICE 'RLS Status for challenges table - Enabled: %, Force: %',
    rls_status.relrowsecurity, rls_status.relforcerowsecurity;
END $$;

-- TEMPORARILY disable RLS to allow inserts (for testing)
-- WARNING: Only do this for debugging!
-- ALTER TABLE public.challenges DISABLE ROW LEVEL SECURITY;

-- Instead, let's create a VERY permissive policy for testing
DROP POLICY IF EXISTS "challenges_insert" ON public.challenges;
DROP POLICY IF EXISTS "challenges_insert_policy" ON public.challenges;

-- Create a super simple INSERT policy that should always work for authenticated users
CREATE POLICY "allow_authenticated_insert"
  ON public.challenges FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Also create a simple ALL policy as a fallback
CREATE POLICY "temp_allow_all_for_authenticated"
  ON public.challenges FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create a function to test auth context
CREATE OR REPLACE FUNCTION debug_auth_context()
RETURNS TABLE (
  current_user_id UUID,
  user_role TEXT,
  jwt_claims JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    auth.uid() as current_user_id,
    current_setting('request.jwt.claim.role', true) as user_role,
    current_setting('request.jwt.claims', true)::json as jwt_claims;
END;
$$;

GRANT EXECUTE ON FUNCTION debug_auth_context() TO authenticated;

-- Output debugging info
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DEBUG POLICIES CREATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created super permissive policies for testing.';
  RAISE NOTICE '';
  RAISE NOTICE 'To debug auth issues, run this query:';
  RAISE NOTICE 'SELECT * FROM debug_auth_context();';
  RAISE NOTICE '';
  RAISE NOTICE 'This will show you:';
  RAISE NOTICE '  - Your current user ID (should not be null)';
  RAISE NOTICE '  - Your current role (should be "authenticated")';
  RAISE NOTICE '  - Your JWT claims';
  RAISE NOTICE '';
  RAISE NOTICE 'If the insert still fails:';
  RAISE NOTICE '  1. Check that auth.uid() returns a value';
  RAISE NOTICE '  2. Verify you are logged in';
  RAISE NOTICE '  3. Check Supabase logs for more details';
  RAISE NOTICE '========================================';
END $$;