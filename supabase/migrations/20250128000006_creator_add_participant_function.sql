-- Create a function that allows creators to add approved participants
-- This bypasses RLS by using SECURITY DEFINER

CREATE OR REPLACE FUNCTION public.add_approved_participant(
    p_challenge_id UUID,
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_creator_id UUID;
    v_join_request_status TEXT;
    v_participant_id UUID;
BEGIN
    -- Get challenge creator
    SELECT creator_id INTO v_creator_id
    FROM public.challenges
    WHERE id = p_challenge_id;

    -- Check if caller is the creator
    IF v_creator_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Challenge not found');
    END IF;

    IF v_creator_id != auth.uid() THEN
        RETURN json_build_object('success', false, 'error', 'Only the creator can add participants');
    END IF;

    -- Check if join request exists and is pending (ready to be approved)
    SELECT status INTO v_join_request_status
    FROM public.challenge_join_requests
    WHERE challenge_id = p_challenge_id
    AND user_id = p_user_id;

    IF v_join_request_status IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No join request found');
    END IF;

    IF v_join_request_status != 'pending' THEN
        RETURN json_build_object('success', false, 'error', 'Join request must be pending to approve');
    END IF;

    -- Check if user is already a participant
    IF EXISTS (
        SELECT 1 FROM public.challenge_participants
        WHERE challenge_id = p_challenge_id AND user_id = p_user_id
    ) THEN
        RETURN json_build_object('success', false, 'error', 'User is already a participant');
    END IF;

    -- Add participant (SECURITY DEFINER bypasses RLS)
    INSERT INTO public.challenge_participants (challenge_id, user_id, status)
    VALUES (p_challenge_id, p_user_id, 'active')
    RETURNING id INTO v_participant_id;

    RETURN json_build_object('success', true, 'participant_id', v_participant_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
