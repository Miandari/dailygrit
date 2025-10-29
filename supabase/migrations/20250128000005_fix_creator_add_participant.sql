-- Fix RLS policy to allow creators to add participants via approved join requests

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can join accessible challenges" ON public.challenge_participants;

-- Create new policy that allows:
-- 1. Users to join themselves (public challenges or with access)
-- 2. Creators to add participants who have approved join requests
CREATE POLICY "Users can join accessible challenges"
ON public.challenge_participants FOR INSERT
TO authenticated
WITH CHECK (
    -- Users can join themselves
    (
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
        )
    )
    -- OR creators can add users with approved join requests
    OR EXISTS (
        SELECT 1
        FROM public.challenges c
        INNER JOIN public.challenge_join_requests jr
            ON jr.challenge_id = c.id
        WHERE c.id = challenge_id
        AND c.creator_id = auth.uid()
        AND jr.user_id = challenge_participants.user_id
        AND jr.status = 'approved'
    )
);
