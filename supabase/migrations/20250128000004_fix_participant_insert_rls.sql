-- Fix RLS policy for joining challenges via approved join requests

-- Drop the old policy
DROP POLICY IF EXISTS "Users can join accessible challenges" ON public.challenge_participants;

-- Create new policy that allows joining if:
-- 1. Challenge is public, OR
-- 2. User has access in user_challenge_access table, OR
-- 3. User has an approved join request
CREATE POLICY "Users can join accessible challenges"
ON public.challenge_participants FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
    AND (
        -- Public challenges
        challenge_id IN (
            SELECT id FROM public.challenges
            WHERE is_public = true
        )
        -- OR user has access
        OR challenge_id IN (
            SELECT challenge_id
            FROM public.user_challenge_access
            WHERE user_id = auth.uid() AND can_view = true
        )
        -- OR user has an approved join request
        OR challenge_id IN (
            SELECT challenge_id
            FROM public.challenge_join_requests
            WHERE user_id = auth.uid() AND status = 'approved'
        )
    )
);
