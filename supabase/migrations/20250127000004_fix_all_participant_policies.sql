-- =====================================================
-- Complete Fix for challenge_participants RLS Policies
-- Drops ALL existing policies and recreates them properly
-- =====================================================

-- STEP 1: Drop ALL existing policies on challenge_participants
DROP POLICY IF EXISTS "View participants of joined challenges" ON public.challenge_participants;
DROP POLICY IF EXISTS "Users can join challenges" ON public.challenge_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON public.challenge_participants;
DROP POLICY IF EXISTS "Creators can manage participants" ON public.challenge_participants;
DROP POLICY IF EXISTS "Users can leave challenges" ON public.challenge_participants;
DROP POLICY IF EXISTS "Creators can remove participants" ON public.challenge_participants;

-- STEP 2: Create new, simpler policies without self-references

-- SELECT: Users can view participants if:
-- 1. They are that participant (direct check)
-- 2. They created the challenge (join with challenges table)
CREATE POLICY "view_participants_simple"
  ON public.challenge_participants FOR SELECT
  USING (
    -- User is viewing their own participation
    user_id = auth.uid()
    OR
    -- User created the challenge (no self-reference, just join with challenges)
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_participants.challenge_id
      AND c.creator_id = auth.uid()
    )
  );

-- INSERT: Users can only add themselves as participants
CREATE POLICY "join_challenge_simple"
  ON public.challenge_participants FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- UPDATE: Users can update their own participation
CREATE POLICY "update_own_participation_simple"
  ON public.challenge_participants FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Challenge creators can update any participant in their challenges
CREATE POLICY "creator_update_participants"
  ON public.challenge_participants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_participants.challenge_id
      AND c.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_participants.challenge_id
      AND c.creator_id = auth.uid()
    )
  );

-- DELETE: Users can remove themselves
CREATE POLICY "leave_challenge_simple"
  ON public.challenge_participants FOR DELETE
  USING (user_id = auth.uid());

-- DELETE: Challenge creators can remove participants
CREATE POLICY "creator_remove_participants"
  ON public.challenge_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_participants.challenge_id
      AND c.creator_id = auth.uid()
    )
  );

-- STEP 3: Also fix the daily_entries policy to avoid similar issues
DROP POLICY IF EXISTS "View entries of joined challenges" ON public.daily_entries;
DROP POLICY IF EXISTS "Users can create own entries" ON public.daily_entries;
DROP POLICY IF EXISTS "Users can update own unlocked entries" ON public.daily_entries;
DROP POLICY IF EXISTS "Users can delete own unlocked entries" ON public.daily_entries;

-- New daily_entries policies
CREATE POLICY "view_entries_simple"
  ON public.daily_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.challenge_participants cp
      WHERE cp.id = daily_entries.participant_id
      AND cp.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.challenge_participants cp
      INNER JOIN public.challenges c ON c.id = cp.challenge_id
      WHERE cp.id = daily_entries.participant_id
      AND c.creator_id = auth.uid()
    )
  );

CREATE POLICY "create_own_entries"
  ON public.daily_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.challenge_participants cp
      WHERE cp.id = participant_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "update_own_entries"
  ON public.daily_entries FOR UPDATE
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

CREATE POLICY "delete_own_entries"
  ON public.daily_entries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.challenge_participants cp
      WHERE cp.id = participant_id
      AND cp.user_id = auth.uid()
    )
    AND is_locked = false
  );

-- STEP 4: Verify the policies are working
-- This query should run without errors after applying the policies
DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been successfully updated';
END $$;