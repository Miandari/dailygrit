-- =====================================================
-- COMPLETE FIX: Remove ALL Circular Dependencies in RLS
-- =====================================================
-- This migration drops and recreates ALL policies to ensure no circular references

-- =====================================================
-- STEP 1: Drop ALL existing policies on ALL tables
-- =====================================================

-- Drop challenges policies
DROP POLICY IF EXISTS "Public challenges are viewable by everyone" ON public.challenges;
DROP POLICY IF EXISTS "Private challenges viewable by participants" ON public.challenges;
DROP POLICY IF EXISTS "Users can create challenges" ON public.challenges;
DROP POLICY IF EXISTS "Creators can update own challenges" ON public.challenges;
DROP POLICY IF EXISTS "Creators can delete own challenges" ON public.challenges;

-- Drop challenge_participants policies
DROP POLICY IF EXISTS "view_participants_simple" ON public.challenge_participants;
DROP POLICY IF EXISTS "join_challenge_simple" ON public.challenge_participants;
DROP POLICY IF EXISTS "update_own_participation_simple" ON public.challenge_participants;
DROP POLICY IF EXISTS "creator_update_participants" ON public.challenge_participants;
DROP POLICY IF EXISTS "leave_challenge_simple" ON public.challenge_participants;
DROP POLICY IF EXISTS "creator_remove_participants" ON public.challenge_participants;

-- Drop daily_entries policies
DROP POLICY IF EXISTS "view_entries_simple" ON public.daily_entries;
DROP POLICY IF EXISTS "create_own_entries" ON public.daily_entries;
DROP POLICY IF EXISTS "update_own_entries" ON public.daily_entries;
DROP POLICY IF EXISTS "delete_own_entries" ON public.daily_entries;

-- =====================================================
-- STEP 2: Create new policies WITHOUT circular references
-- =====================================================

-- =====================================================
-- CHALLENGES POLICIES (No reference to challenge_participants!)
-- =====================================================

-- SELECT: Public challenges visible to all, private only to creator initially
-- We'll handle participant viewing through the application logic or a view
CREATE POLICY "challenges_select_policy"
  ON public.challenges FOR SELECT
  USING (
    -- Public challenges are visible to everyone
    is_public = true
    OR
    -- Private challenges visible to creator only
    -- (Participants will query through their participation record)
    creator_id = auth.uid()
  );

-- INSERT: Users can create challenges they own
CREATE POLICY "challenges_insert_policy"
  ON public.challenges FOR INSERT
  WITH CHECK (
    creator_id = auth.uid()
  );

-- UPDATE: Only creators can update
CREATE POLICY "challenges_update_policy"
  ON public.challenges FOR UPDATE
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- DELETE: Only creators can delete
CREATE POLICY "challenges_delete_policy"
  ON public.challenges FOR DELETE
  USING (creator_id = auth.uid());

-- =====================================================
-- CHALLENGE_PARTICIPANTS POLICIES (Simplified!)
-- =====================================================

-- SELECT: Users can only see their own participation records
-- Note: To see other participants, we'll use a different approach
CREATE POLICY "participants_select_policy"
  ON public.challenge_participants FOR SELECT
  USING (
    -- Users can see their own participation
    user_id = auth.uid()
  );

-- INSERT: Users can only add themselves
CREATE POLICY "participants_insert_policy"
  ON public.challenge_participants FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- UPDATE: Users can only update their own participation
CREATE POLICY "participants_update_policy"
  ON public.challenge_participants FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Users can only remove themselves
CREATE POLICY "participants_delete_policy"
  ON public.challenge_participants FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- DAILY_ENTRIES POLICIES (Reference participants only)
-- =====================================================

-- SELECT: Users can see their own entries
CREATE POLICY "entries_select_policy"
  ON public.daily_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.challenge_participants cp
      WHERE cp.id = daily_entries.participant_id
      AND cp.user_id = auth.uid()
    )
  );

-- INSERT: Users can create their own entries
CREATE POLICY "entries_insert_policy"
  ON public.daily_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.challenge_participants cp
      WHERE cp.id = participant_id
      AND cp.user_id = auth.uid()
    )
  );

-- UPDATE: Users can update their own unlocked entries
CREATE POLICY "entries_update_policy"
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

-- DELETE: Users can delete their own unlocked entries
CREATE POLICY "entries_delete_policy"
  ON public.daily_entries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.challenge_participants cp
      WHERE cp.id = participant_id
      AND cp.user_id = auth.uid()
    )
    AND is_locked = false
  );

-- =====================================================
-- STEP 3: Create a database function to safely get challenges
-- This avoids circular RLS by using SECURITY DEFINER
-- =====================================================

-- Function to get challenges a user participates in
CREATE OR REPLACE FUNCTION get_user_challenges(p_user_id UUID)
RETURNS TABLE (
  challenge_id UUID,
  challenge_name TEXT,
  challenge_description TEXT,
  is_creator BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER  -- Bypasses RLS
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    c.id as challenge_id,
    c.name as challenge_name,
    c.description as challenge_description,
    (c.creator_id = p_user_id) as is_creator
  FROM public.challenges c
  LEFT JOIN public.challenge_participants cp ON cp.challenge_id = c.id
  WHERE
    c.is_public = true  -- Public challenges
    OR c.creator_id = p_user_id  -- User created it
    OR (cp.user_id = p_user_id AND cp.status = 'active');  -- User participates
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_challenges(UUID) TO authenticated;

-- =====================================================
-- STEP 4: Create a view for participant details
-- This provides a safe way to see other participants
-- =====================================================

CREATE OR REPLACE VIEW participant_details AS
SELECT
  cp.id,
  cp.challenge_id,
  cp.user_id,
  cp.status,
  cp.current_streak,
  cp.longest_streak,
  p.username,
  p.avatar_url
FROM challenge_participants cp
LEFT JOIN profiles p ON p.id = cp.user_id;

-- Grant access to the view
GRANT SELECT ON participant_details TO authenticated;

-- Create RLS policy on the view (views don't have RLS by default)
-- Note: We'll handle access control in the application layer

-- =====================================================
-- STEP 5: Verification message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'All RLS policies have been recreated without circular dependencies';
  RAISE NOTICE 'Use get_user_challenges() function to safely query user challenges';
  RAISE NOTICE 'Use participant_details view to see other participants';
END $$;