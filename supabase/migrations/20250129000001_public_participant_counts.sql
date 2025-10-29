-- =====================================================
-- PUBLIC PARTICIPANT COUNTS FUNCTION
-- =====================================================
-- Allows users to see participant counts for any challenge
-- (for social proof) without exposing participant details

CREATE OR REPLACE FUNCTION public.get_challenge_participant_counts(challenge_ids uuid[])
RETURNS TABLE (challenge_id uuid, participant_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.challenge_id,
    COUNT(*)::bigint as participant_count
  FROM public.challenge_participants cp
  WHERE cp.challenge_id = ANY(challenge_ids)
    AND cp.status = 'active'
  GROUP BY cp.challenge_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_challenge_participant_counts(uuid[]) TO authenticated;
