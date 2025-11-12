-- =====================================================
-- USER PREFERENCES TABLE
-- =====================================================
-- Table to store user preferences and settings
-- Designed to be easily expandable

CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Email notification preferences
    email_notifications_enabled BOOLEAN DEFAULT true,
    email_daily_reminder BOOLEAN DEFAULT true,
    email_challenge_updates BOOLEAN DEFAULT true,
    email_join_requests BOOLEAN DEFAULT true,
    email_weekly_summary BOOLEAN DEFAULT true,

    -- App notification preferences
    app_notifications_enabled BOOLEAN DEFAULT true,

    -- Privacy settings
    profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'friends')),
    show_email BOOLEAN DEFAULT false,

    -- Display preferences
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    timezone TEXT DEFAULT 'UTC',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ensure one preferences row per user
    UNIQUE(user_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id
ON public.user_preferences(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences"
ON public.user_preferences FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
ON public.user_preferences FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
ON public.user_preferences FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Users can delete their own preferences
CREATE POLICY "Users can delete own preferences"
ON public.user_preferences FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- TRIGGER: Update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_timestamp
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_preferences_updated_at();

-- =====================================================
-- FUNCTION: Initialize preferences for new users
-- =====================================================

CREATE OR REPLACE FUNCTION public.initialize_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create preferences when profile is created
CREATE TRIGGER initialize_preferences_on_profile_creation
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.initialize_user_preferences();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.user_preferences IS 'Stores user preferences and settings. Designed to be easily expandable with new preference fields.';
COMMENT ON COLUMN public.user_preferences.email_notifications_enabled IS 'Master toggle for all email notifications';
COMMENT ON COLUMN public.user_preferences.profile_visibility IS 'Controls who can view the user profile: public, private, or friends';
COMMENT ON COLUMN public.user_preferences.theme IS 'UI theme preference: light, dark, or system';
