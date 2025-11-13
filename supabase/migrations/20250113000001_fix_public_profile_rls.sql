-- =====================================================
-- Fix RLS Policy for Public Profile Viewing
-- =====================================================
-- Allow viewing challenge_participants for public challenges
-- without requiring the viewer to be a participant

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view participants of accessible challenges" ON public.challenge_participants;

-- Create new policy that allows viewing participants of:
-- 1. Public challenges (anyone can see)
-- 2. Private challenges you have access to
CREATE POLICY "Users can view participants of public or accessible challenges"
ON public.challenge_participants FOR SELECT
TO authenticated
USING (
    -- Can view participants of public challenges
    challenge_id IN (
        SELECT id FROM public.challenges
        WHERE is_public = true
    )
    OR
    -- Can view participants of challenges you have access to
    challenge_id IN (
        SELECT challenge_id
        FROM public.user_challenge_access
        WHERE user_id = auth.uid() AND can_view = true
    )
);
