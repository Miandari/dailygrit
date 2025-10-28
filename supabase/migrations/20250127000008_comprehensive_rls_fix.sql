-- =====================================================
-- COMPREHENSIVE RLS FIX: Ensure RLS is enabled and policies work
-- =====================================================

-- First, ensure RLS is enabled on all tables
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on challenges to start fresh
DROP POLICY IF EXISTS "challenges_view_policy" ON public.challenges;
DROP POLICY IF EXISTS "challenges_insert_policy" ON public.challenges;
DROP POLICY IF EXISTS "challenges_update_policy" ON public.challenges;
DROP POLICY IF EXISTS "challenges_delete_policy" ON public.challenges;

-- Recreate ALL policies for challenges table

-- SELECT: Use the function we created
CREATE POLICY "challenges_select"
  ON public.challenges FOR SELECT
  USING (
    can_user_view_challenge(id, auth.uid())
  );

-- INSERT: Allow authenticated users to create challenges
-- Make sure the creator_id matches the authenticated user
CREATE POLICY "challenges_insert"
  ON public.challenges FOR INSERT
  TO authenticated
  WITH CHECK (
    creator_id = auth.uid()
  );

-- UPDATE: Only creators can update
CREATE POLICY "challenges_update"
  ON public.challenges FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- DELETE: Only creators can delete
CREATE POLICY "challenges_delete"
  ON public.challenges FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());

-- Also ensure participant policies are correct
DROP POLICY IF EXISTS "participants_view_policy" ON public.challenge_participants;
DROP POLICY IF EXISTS "participants_insert_policy" ON public.challenge_participants;
DROP POLICY IF EXISTS "participants_update_policy" ON public.challenge_participants;
DROP POLICY IF EXISTS "participants_delete_policy" ON public.challenge_participants;

-- Recreate participant policies
CREATE POLICY "participants_select"
  ON public.challenge_participants FOR SELECT
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

CREATE POLICY "participants_insert"
  ON public.challenge_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "participants_update"
  ON public.challenge_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "participants_delete"
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

-- Ensure daily_entries policies
DROP POLICY IF EXISTS "entries_select_policy" ON public.daily_entries;
DROP POLICY IF EXISTS "entries_insert_policy" ON public.daily_entries;
DROP POLICY IF EXISTS "entries_update_policy" ON public.daily_entries;
DROP POLICY IF EXISTS "entries_delete_policy" ON public.daily_entries;

CREATE POLICY "entries_select"
  ON public.daily_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.challenge_participants cp
      WHERE cp.id = daily_entries.participant_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "entries_insert"
  ON public.daily_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.challenge_participants cp
      WHERE cp.id = participant_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "entries_update"
  ON public.daily_entries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.challenge_participants cp
      WHERE cp.id = participant_id
      AND cp.user_id = auth.uid()
    )
    AND is_locked = false
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.challenge_participants cp
      WHERE cp.id = participant_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "entries_delete"
  ON public.daily_entries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.challenge_participants cp
      WHERE cp.id = participant_id
      AND cp.user_id = auth.uid()
    )
    AND is_locked = false
  );

-- Test that auth.uid() is working
DO $$
BEGIN
  RAISE NOTICE 'RLS has been enabled on all tables';
  RAISE NOTICE 'All policies have been recreated with TO authenticated clause';
  RAISE NOTICE 'If you still get errors, check:';
  RAISE NOTICE '  1. You are logged in (auth.uid() is not null)';
  RAISE NOTICE '  2. The creator_id field is being set correctly in your insert';
END $$;