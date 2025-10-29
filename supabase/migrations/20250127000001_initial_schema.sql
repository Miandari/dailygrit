-- =====================================================
-- INITIAL DATABASE SCHEMA
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CHALLENGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    starts_at DATE NOT NULL,
    ends_at DATE NOT NULL,
    duration_days INTEGER NOT NULL,
    is_public BOOLEAN DEFAULT true,
    is_template BOOLEAN DEFAULT false,
    invite_code TEXT UNIQUE,
    lock_entries_after_day BOOLEAN DEFAULT false,
    failure_mode TEXT DEFAULT 'flexible',
    show_participant_details BOOLEAN DEFAULT true,
    enable_streak_bonus BOOLEAN DEFAULT false,
    streak_bonus_points INTEGER DEFAULT 5,
    enable_perfect_day_bonus BOOLEAN DEFAULT false,
    perfect_day_bonus_points INTEGER DEFAULT 10,
    metrics JSONB DEFAULT '[]'::JSONB,
    creator_settings JSONB DEFAULT '{}'::JSONB,
    cover_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_dates CHECK (ends_at >= starts_at),
    CONSTRAINT valid_duration CHECK (duration_days > 0),
    CONSTRAINT valid_failure_mode CHECK (failure_mode IN ('strict', 'flexible', 'grace'))
);

-- =====================================================
-- CHALLENGE PARTICIPANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.challenge_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active',
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    UNIQUE(challenge_id, user_id),
    CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'completed', 'failed'))
);

-- =====================================================
-- DAILY ENTRIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.daily_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    participant_id UUID NOT NULL REFERENCES public.challenge_participants(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    metric_data JSONB DEFAULT '{}'::JSONB NOT NULL,
    is_completed BOOLEAN DEFAULT false NOT NULL,
    is_locked BOOLEAN DEFAULT false NOT NULL,
    notes TEXT,
    file_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    points_earned INTEGER DEFAULT 0,
    bonus_points INTEGER DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(participant_id, entry_date)
);

-- =====================================================
-- USER CHALLENGE ACCESS TABLE (for RLS)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_challenge_access (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    can_view BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    access_reason TEXT,
    PRIMARY KEY (user_id, challenge_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Challenges indexes
CREATE INDEX IF NOT EXISTS idx_challenges_creator ON public.challenges(creator_id);
CREATE INDEX IF NOT EXISTS idx_challenges_public ON public.challenges(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_challenges_invite ON public.challenges(invite_code) WHERE invite_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON public.challenges(starts_at, ends_at);

-- Participants indexes
CREATE INDEX IF NOT EXISTS idx_participants_challenge ON public.challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON public.challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON public.challenge_participants(status);

-- Daily entries indexes
CREATE INDEX IF NOT EXISTS idx_entries_participant ON public.daily_entries(participant_id);
CREATE INDEX IF NOT EXISTS idx_entries_date ON public.daily_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_entries_completed ON public.daily_entries(is_completed);

-- Access table indexes
CREATE INDEX IF NOT EXISTS idx_access_user ON public.user_challenge_access(user_id);
CREATE INDEX IF NOT EXISTS idx_access_challenge ON public.user_challenge_access(challenge_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON public.challenges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_entries_updated_at BEFORE UPDATE ON public.daily_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- AUTOMATIC PROFILE CREATION
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();