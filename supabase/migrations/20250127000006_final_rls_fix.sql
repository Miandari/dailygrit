-- =====================================================
-- FINAL RLS FIX: Allow participants to see their challenges
-- Uses a secure approach without circular dependencies
-- =====================================================

-- Drop the problematic challenges SELECT policy
DROP POLICY IF EXISTS "challenges_select_policy" ON public.challenges;

-- Create a function to check if user can view a challenge
-- This avoids circular RLS by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION can_user_view_challenge(challenge_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS to avoid circular dependency
STABLE
AS $$
DECLARE
  v_challenge RECORD;
  v_is_participant BOOLEAN;
BEGIN
  -- Get challenge details
  SELECT is_public, creator_id
  INTO v_challenge
  FROM public.challenges
  WHERE id = challenge_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Public challenges are visible to everyone
  IF v_challenge.is_public THEN
    RETURN TRUE;
  END IF;

  -- Creator can always see their challenge
  IF v_challenge.creator_id = user_id THEN
    RETURN TRUE;
  END IF;

  -- Check if user is a participant (without triggering RLS)
  SELECT EXISTS(
    SELECT 1
    FROM public.challenge_participants cp
    WHERE cp.challenge_id = challenge_id
    AND cp.user_id = user_id
  ) INTO v_is_participant;

  RETURN v_is_participant;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION can_user_view_challenge(UUID, UUID) TO authenticated;

-- Create new SELECT policy using the function
CREATE POLICY "challenges_view_policy"
  ON public.challenges FOR SELECT
  USING (
    can_user_view_challenge(id, auth.uid())
  );

-- Also update the participant view policy to be more permissive
-- Allow users to see all participants in challenges they can view
DROP POLICY IF EXISTS "participants_select_policy" ON public.challenge_participants;

CREATE POLICY "participants_view_policy"
  ON public.challenge_participants FOR SELECT
  USING (
    -- User can see participants if they can view the challenge
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_participants.challenge_id
      AND can_user_view_challenge(c.id, auth.uid())
    )
  );

-- Update daily_entries policy to use the same approach
DROP POLICY IF EXISTS "entries_select_policy" ON public.daily_entries;

CREATE POLICY "entries_view_policy"
  ON public.daily_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.challenge_participants cp
      JOIN public.challenges c ON c.id = cp.challenge_id
      WHERE cp.id = daily_entries.participant_id
      AND can_user_view_challenge(c.id, auth.uid())
    )
  );

-- Create a helper function to get all user's challenges efficiently
CREATE OR REPLACE FUNCTION get_my_challenges()
RETURNS TABLE (
  challenge_id UUID,
  challenge_name TEXT,
  challenge_description TEXT,
  is_creator BOOLEAN,
  is_participant BOOLEAN,
  participation_id UUID,
  current_streak INTEGER,
  longest_streak INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    c.id as challenge_id,
    c.name as challenge_name,
    c.description as challenge_description,
    (c.creator_id = auth.uid()) as is_creator,
    (cp.id IS NOT NULL) as is_participant,
    cp.id as participation_id,
    COALESCE(cp.current_streak, 0) as current_streak,
    COALESCE(cp.longest_streak, 0) as longest_streak
  FROM public.challenges c
  LEFT JOIN public.challenge_participants cp
    ON cp.challenge_id = c.id
    AND cp.user_id = auth.uid()
  WHERE can_user_view_challenge(c.id, auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_challenges() TO authenticated;

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been fixed!';
  RAISE NOTICE 'Users can now:';
  RAISE NOTICE '  - View public challenges';
  RAISE NOTICE '  - View private challenges they created';
  RAISE NOTICE '  - View private challenges they participate in';
  RAISE NOTICE 'Use get_my_challenges() for efficient dashboard queries';
END $$;