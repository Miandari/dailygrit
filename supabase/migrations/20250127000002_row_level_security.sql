-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_access ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- =====================================================
-- HELPER FUNCTION FOR ACCESS CONTROL
-- =====================================================

-- Function to maintain access table automatically
CREATE OR REPLACE FUNCTION public.maintain_challenge_access()
RETURNS TRIGGER AS $$
BEGIN
    -- When a challenge is created, grant creator full access
    IF (TG_OP = 'INSERT' AND TG_TABLE_NAME = 'challenges') THEN
        INSERT INTO public.user_challenge_access (user_id, challenge_id, can_view, can_edit, access_reason)
        VALUES (NEW.creator_id, NEW.id, true, true, 'creator')
        ON CONFLICT (user_id, challenge_id)
        DO UPDATE SET can_view = true, can_edit = true, access_reason = 'creator';
        RETURN NEW;
    END IF;

    -- When a participant joins, grant view access
    IF (TG_OP = 'INSERT' AND TG_TABLE_NAME = 'challenge_participants') THEN
        INSERT INTO public.user_challenge_access (user_id, challenge_id, can_view, can_edit, access_reason)
        VALUES (NEW.user_id, NEW.challenge_id, true, false, 'participant')
        ON CONFLICT (user_id, challenge_id)
        DO UPDATE SET can_view = true;
        RETURN NEW;
    END IF;

    -- When a participant is removed, revoke access (unless creator)
    IF (TG_OP = 'DELETE' AND TG_TABLE_NAME = 'challenge_participants') THEN
        DELETE FROM public.user_challenge_access
        WHERE user_id = OLD.user_id
        AND challenge_id = OLD.challenge_id
        AND access_reason = 'participant';
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic access management
CREATE TRIGGER maintain_access_on_challenge_insert
    AFTER INSERT ON public.challenges
    FOR EACH ROW EXECUTE FUNCTION public.maintain_challenge_access();

CREATE TRIGGER maintain_access_on_participant_insert
    AFTER INSERT ON public.challenge_participants
    FOR EACH ROW EXECUTE FUNCTION public.maintain_challenge_access();

CREATE TRIGGER maintain_access_on_participant_delete
    AFTER DELETE ON public.challenge_participants
    FOR EACH ROW EXECUTE FUNCTION public.maintain_challenge_access();

-- =====================================================
-- CHALLENGES POLICIES
-- =====================================================

-- View policy: public challenges OR user has access
CREATE POLICY "Users can view accessible challenges"
ON public.challenges FOR SELECT
TO authenticated
USING (
    is_public = true
    OR id IN (
        SELECT challenge_id
        FROM public.user_challenge_access
        WHERE user_id = auth.uid() AND can_view = true
    )
);

-- Allow users to find challenges by invite code (for join flow)
CREATE POLICY "Users can view challenges by invite code"
ON public.challenges FOR SELECT
TO authenticated
USING (
    invite_code IS NOT NULL
    AND invite_code != ''
);

-- Insert policy: authenticated users can create
CREATE POLICY "Authenticated users can create challenges"
ON public.challenges FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

-- Update policy: only creators can update
CREATE POLICY "Creators can update their challenges"
ON public.challenges FOR UPDATE
TO authenticated
USING (
    id IN (
        SELECT challenge_id
        FROM public.user_challenge_access
        WHERE user_id = auth.uid() AND can_edit = true
    )
);

-- Delete policy: only creators can delete
CREATE POLICY "Creators can delete their challenges"
ON public.challenges FOR DELETE
TO authenticated
USING (
    id IN (
        SELECT challenge_id
        FROM public.user_challenge_access
        WHERE user_id = auth.uid() AND can_edit = true
    )
);

-- =====================================================
-- CHALLENGE PARTICIPANTS POLICIES
-- =====================================================

-- View: users can see participants of challenges they have access to
CREATE POLICY "Users can view participants of accessible challenges"
ON public.challenge_participants FOR SELECT
TO authenticated
USING (
    challenge_id IN (
        SELECT id FROM public.challenges
        WHERE is_public = true
        OR id IN (
            SELECT challenge_id
            FROM public.user_challenge_access
            WHERE user_id = auth.uid() AND can_view = true
        )
    )
);

-- Insert: users can join accessible challenges
CREATE POLICY "Users can join accessible challenges"
ON public.challenge_participants FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
    AND challenge_id IN (
        SELECT id FROM public.challenges
        WHERE is_public = true
        OR id IN (
            SELECT challenge_id
            FROM public.user_challenge_access
            WHERE user_id = auth.uid() AND can_view = true
        )
    )
);

-- Update: users can update their own participation
CREATE POLICY "Users can update own participation"
ON public.challenge_participants FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Delete: users can leave challenges (delete their participation)
CREATE POLICY "Users can leave challenges"
ON public.challenge_participants FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- DAILY ENTRIES POLICIES
-- =====================================================

-- View: users can see entries from all participants in accessible challenges
CREATE POLICY "Users can view entries from accessible challenges"
ON public.daily_entries FOR SELECT
TO authenticated
USING (
    participant_id IN (
        SELECT cp.id
        FROM public.challenge_participants cp
        WHERE cp.challenge_id IN (
            SELECT id FROM public.challenges
            WHERE is_public = true
            OR id IN (
                SELECT challenge_id
                FROM public.user_challenge_access
                WHERE user_id = auth.uid() AND can_view = true
            )
        )
    )
);

-- Insert: users can create entries for their participations
CREATE POLICY "Users can create their own entries"
ON public.daily_entries FOR INSERT
TO authenticated
WITH CHECK (
    participant_id IN (
        SELECT id FROM public.challenge_participants
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- Update: users can update their own unlocked entries
CREATE POLICY "Users can update own unlocked entries"
ON public.daily_entries FOR UPDATE
TO authenticated
USING (
    participant_id IN (
        SELECT id FROM public.challenge_participants
        WHERE user_id = auth.uid()
    )
    AND is_locked = false
);

-- Delete: users can delete their own unlocked entries
CREATE POLICY "Users can delete own unlocked entries"
ON public.daily_entries FOR DELETE
TO authenticated
USING (
    participant_id IN (
        SELECT id FROM public.challenge_participants
        WHERE user_id = auth.uid()
    )
    AND is_locked = false
);

-- =====================================================
-- ACCESS TABLE POLICIES
-- =====================================================

-- Users can view their own access records
CREATE POLICY "Users can view own access"
ON public.user_challenge_access FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only system (via triggers) can modify access table
-- No INSERT/UPDATE/DELETE policies for regular users