-- Fix the participants SELECT policy to be simpler and more reliable

DROP POLICY IF EXISTS "Users can view participants of accessible challenges" ON public.challenge_participants;

-- New simplified policy using EXISTS instead of nested IN clauses
CREATE POLICY "Users can view participants of accessible challenges"
ON public.challenge_participants FOR SELECT
TO authenticated
USING (
    -- Challenge is public
    EXISTS (
        SELECT 1 FROM public.challenges c
        WHERE c.id = challenge_id AND c.is_public = true
    )
    -- OR user has access
    OR EXISTS (
        SELECT 1 FROM public.user_challenge_access uca
        WHERE uca.challenge_id = challenge_participants.challenge_id
        AND uca.user_id = auth.uid()
        AND uca.can_view = true
    )
);
