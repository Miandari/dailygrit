-- =====================================================
-- JOIN REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.challenge_join_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES public.profiles(id),
    UNIQUE(challenge_id, user_id),
    CONSTRAINT valid_request_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}'::JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_notification_type CHECK (type IN ('join_request', 'join_approved', 'join_rejected', 'challenge_invite', 'challenge_update'))
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_join_requests_challenge_id ON public.challenge_join_requests(challenge_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_user_id ON public.challenge_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON public.challenge_join_requests(status);

-- =====================================================
-- RLS POLICIES FOR JOIN REQUESTS
-- =====================================================
ALTER TABLE public.challenge_join_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own join requests"
ON public.challenge_join_requests FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Challenge creators can view requests for their challenges
CREATE POLICY "Creators can view requests for their challenges"
ON public.challenge_join_requests FOR SELECT
TO authenticated
USING (
    challenge_id IN (
        SELECT id FROM public.challenges
        WHERE creator_id = auth.uid()
    )
);

-- Users can create join requests for private challenges
CREATE POLICY "Users can create join requests"
ON public.challenge_join_requests FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
    AND challenge_id IN (
        SELECT id FROM public.challenges
        WHERE is_public = false
    )
);

-- Challenge creators can update requests (approve/reject)
CREATE POLICY "Creators can update join requests"
ON public.challenge_join_requests FOR UPDATE
TO authenticated
USING (
    challenge_id IN (
        SELECT id FROM public.challenges
        WHERE creator_id = auth.uid()
    )
);

-- =====================================================
-- RLS POLICIES FOR NOTIFICATIONS
-- =====================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- System can create notifications (via service role or triggers)
CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- TRIGGER TO CREATE NOTIFICATION ON JOIN REQUEST
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_creator_of_join_request()
RETURNS TRIGGER AS $$
DECLARE
    challenge_name TEXT;
    challenge_creator UUID;
    requester_username TEXT;
BEGIN
    -- Get challenge details
    SELECT name, creator_id INTO challenge_name, challenge_creator
    FROM public.challenges
    WHERE id = NEW.challenge_id;

    -- Get requester username
    SELECT username INTO requester_username
    FROM public.profiles
    WHERE id = NEW.user_id;

    -- Create notification for challenge creator
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
        challenge_creator,
        'join_request',
        'New join request',
        requester_username || ' wants to join "' || challenge_name || '"',
        jsonb_build_object(
            'challenge_id', NEW.challenge_id,
            'request_id', NEW.id,
            'requester_id', NEW.user_id,
            'requester_username', requester_username
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_on_join_request
    AFTER INSERT ON public.challenge_join_requests
    FOR EACH ROW
    WHEN (NEW.status = 'pending')
    EXECUTE FUNCTION public.notify_creator_of_join_request();

-- =====================================================
-- TRIGGER TO NOTIFY USER ON REQUEST APPROVAL/REJECTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_user_of_request_decision()
RETURNS TRIGGER AS $$
DECLARE
    challenge_name TEXT;
    requester_username TEXT;
BEGIN
    -- Only notify on status change to approved/rejected
    IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
        -- Get challenge name
        SELECT name INTO challenge_name
        FROM public.challenges
        WHERE id = NEW.challenge_id;

        -- Get requester username
        SELECT username INTO requester_username
        FROM public.profiles
        WHERE id = NEW.user_id;

        -- Create notification
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
            NEW.user_id,
            CASE WHEN NEW.status = 'approved' THEN 'join_approved' ELSE 'join_rejected' END,
            CASE
                WHEN NEW.status = 'approved' THEN 'Request approved'
                ELSE 'Request rejected'
            END,
            CASE
                WHEN NEW.status = 'approved' THEN 'Your request to join "' || challenge_name || '" has been approved!'
                ELSE 'Your request to join "' || challenge_name || '" was not approved.'
            END,
            jsonb_build_object(
                'challenge_id', NEW.challenge_id,
                'request_id', NEW.id,
                'status', NEW.status
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_on_request_decision
    AFTER UPDATE ON public.challenge_join_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_user_of_request_decision();
