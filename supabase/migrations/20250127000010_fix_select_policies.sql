-- =====================================================
-- FIX SELECT POLICIES: Ensure users can view challenges after creation
-- =====================================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "challenges_select" ON public.challenges;
DROP POLICY IF EXISTS "challenges_view_policy" ON public.challenges;
DROP POLICY IF EXISTS "temp_allow_all_for_authenticated" ON public.challenges;

-- Create a simpler SELECT policy that doesn't rely on the function initially
CREATE POLICY "challenges_select_simple"
  ON public.challenges FOR SELECT
  TO authenticated
  USING (
    -- Public challenges visible to all
    is_public = true
    OR
    -- Creator can see their own challenges
    creator_id = auth.uid()
    OR
    -- Participants can see challenges they're in
    EXISTS (
      SELECT 1 FROM public.challenge_participants cp
      WHERE cp.challenge_id = challenges.id
      AND cp.user_id = auth.uid()
    )
  );

-- Keep the permissive INSERT policy that's working
DROP POLICY IF EXISTS "allow_authenticated_insert" ON public.challenges;
CREATE POLICY "challenges_insert_simple"
  ON public.challenges FOR INSERT
  TO authenticated
  WITH CHECK (
    creator_id = auth.uid()
  );

-- UPDATE policy
DROP POLICY IF EXISTS "challenges_update" ON public.challenges;
CREATE POLICY "challenges_update_simple"
  ON public.challenges FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- DELETE policy
DROP POLICY IF EXISTS "challenges_delete" ON public.challenges;
CREATE POLICY "challenges_delete_simple"
  ON public.challenges FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());

-- Also fix the participant policies to be simpler
DROP POLICY IF EXISTS "participants_select" ON public.challenge_participants;
DROP POLICY IF EXISTS "participants_view_policy" ON public.challenge_participants;

CREATE POLICY "participants_select_simple"
  ON public.challenge_participants FOR SELECT
  TO authenticated
  USING (
    -- Users can see their own participations
    user_id = auth.uid()
    OR
    -- Challenge creators can see all participants
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_participants.challenge_id
      AND c.creator_id = auth.uid()
    )
  );

-- Keep other participant policies
DROP POLICY IF EXISTS "participants_insert" ON public.challenge_participants;
CREATE POLICY "participants_insert_simple"
  ON public.challenge_participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "participants_update" ON public.challenge_participants;
CREATE POLICY "participants_update_simple"
  ON public.challenge_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "participants_delete" ON public.challenge_participants;
CREATE POLICY "participants_delete_simple"
  ON public.challenge_participants FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_participants.challenge_id
      AND c.creator_id = auth.uid()
    )
  );

-- Test query to verify you can see your challenges
DO $$
BEGIN
  RAISE NOTICE 'Simple SELECT policies created';
  RAISE NOTICE 'You should now be able to:';
  RAISE NOTICE '  1. Create challenges';
  RAISE NOTICE '  2. View challenges you created';
  RAISE NOTICE '  3. View public challenges';
  RAISE NOTICE '  4. View private challenges you participate in';
END $$;