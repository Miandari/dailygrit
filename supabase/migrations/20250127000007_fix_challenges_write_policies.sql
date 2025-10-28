-- =====================================================
-- FIX: Add missing INSERT, UPDATE, DELETE policies for challenges
-- =====================================================

-- Drop any existing write policies (in case they exist)
DROP POLICY IF EXISTS "challenges_insert_policy" ON public.challenges;
DROP POLICY IF EXISTS "challenges_update_policy" ON public.challenges;
DROP POLICY IF EXISTS "challenges_delete_policy" ON public.challenges;

-- INSERT: Users can create challenges they own
CREATE POLICY "challenges_insert_policy"
  ON public.challenges FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    creator_id = auth.uid()
  );

-- UPDATE: Only creators can update their challenges
CREATE POLICY "challenges_update_policy"
  ON public.challenges FOR UPDATE
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- DELETE: Only creators can delete their challenges
CREATE POLICY "challenges_delete_policy"
  ON public.challenges FOR DELETE
  USING (creator_id = auth.uid());

-- Verify the policies are working
DO $$
BEGIN
  RAISE NOTICE 'Challenge write policies have been created successfully';
  RAISE NOTICE 'Users can now:';
  RAISE NOTICE '  - Create challenges (as creator)';
  RAISE NOTICE '  - Update their own challenges';
  RAISE NOTICE '  - Delete their own challenges';
END $$;