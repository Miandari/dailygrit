-- =====================================================
-- DailyGrit Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenges table
CREATE TABLE public.challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL CHECK (duration_days BETWEEN 1 AND 365),
  is_public BOOLEAN DEFAULT true,
  is_template BOOLEAN DEFAULT false,
  invite_code TEXT UNIQUE,
  lock_entries_after_day BOOLEAN DEFAULT false,
  failure_mode TEXT DEFAULT 'strict' CHECK (failure_mode IN ('strict', 'flexible', 'grace')),
  metrics JSONB NOT NULL DEFAULT '[]',
  creator_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  starts_at DATE NOT NULL,
  ends_at DATE NOT NULL,
  CONSTRAINT valid_date_range CHECK (ends_at > starts_at)
);

-- Challenge participants table
CREATE TABLE public.challenge_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  missed_days INTEGER DEFAULT 0,
  UNIQUE(challenge_id, user_id)
);

-- Daily entries table
CREATE TABLE public.daily_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  participant_id UUID REFERENCES public.challenge_participants(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL CHECK (day_number > 0),
  values JSONB NOT NULL DEFAULT '{}',
  is_locked BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_id, day_number)
);

-- User storage usage tracking
CREATE TABLE public.user_storage_usage (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  bytes_used BIGINT DEFAULT 0 CHECK (bytes_used >= 0),
  bytes_limit BIGINT DEFAULT 524288000, -- 500MB default
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences
CREATE TABLE public.notification_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email_reminders BOOLEAN DEFAULT true,
  reminder_time TIME DEFAULT '20:00',
  timezone TEXT DEFAULT 'UTC'
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Challenges indexes
CREATE INDEX idx_challenges_public ON public.challenges(is_public) WHERE is_public = true;
CREATE INDEX idx_challenges_template ON public.challenges(is_template) WHERE is_template = true;
CREATE INDEX idx_challenges_creator ON public.challenges(creator_id);
CREATE INDEX idx_challenges_dates ON public.challenges(starts_at, ends_at);

-- Participants indexes
CREATE INDEX idx_participants_user ON public.challenge_participants(user_id);
CREATE INDEX idx_participants_challenge ON public.challenge_participants(challenge_id);
CREATE INDEX idx_participants_status ON public.challenge_participants(status);

-- Entries indexes
CREATE INDEX idx_entries_participant ON public.daily_entries(participant_id);
CREATE INDEX idx_entries_day ON public.daily_entries(day_number);
CREATE INDEX idx_entries_submitted ON public.daily_entries(submitted_at);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_invite_code(length INTEGER DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update streak counts
CREATE OR REPLACE FUNCTION update_participant_streaks()
RETURNS TRIGGER AS $$
DECLARE
  participant_record RECORD;
  challenge_record RECORD;
  consecutive_days INTEGER := 0;
BEGIN
  -- Get participant and challenge data
  SELECT * INTO participant_record FROM public.challenge_participants WHERE id = NEW.participant_id;
  SELECT * INTO challenge_record FROM public.challenges WHERE id = participant_record.challenge_id;

  -- Count consecutive days from the latest entry backwards
  WITH numbered_entries AS (
    SELECT
      day_number,
      day_number - ROW_NUMBER() OVER (ORDER BY day_number DESC) as grp
    FROM public.daily_entries
    WHERE participant_id = NEW.participant_id
    ORDER BY day_number DESC
  ),
  streak_groups AS (
    SELECT grp, COUNT(*) as streak_length
    FROM numbered_entries
    GROUP BY grp
    ORDER BY MIN(day_number) DESC
  )
  SELECT COALESCE(MAX(streak_length), 0) INTO consecutive_days
  FROM streak_groups
  LIMIT 1;

  -- Update participant streaks
  UPDATE public.challenge_participants
  SET
    current_streak = consecutive_days,
    longest_streak = GREATEST(longest_streak, consecutive_days)
  WHERE id = NEW.participant_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.user_storage_usage (user_id)
  VALUES (NEW.id);

  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check storage quota
CREATE OR REPLACE FUNCTION check_storage_quota(p_user_id UUID, p_file_size BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
  v_bytes_used BIGINT;
  v_bytes_limit BIGINT;
BEGIN
  SELECT bytes_used, bytes_limit
  INTO v_bytes_used, v_bytes_limit
  FROM public.user_storage_usage
  WHERE user_id = p_user_id;

  RETURN (v_bytes_used + p_file_size) <= v_bytes_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger to update streaks when entry is added
CREATE TRIGGER on_daily_entry_created
  AFTER INSERT ON public.daily_entries
  FOR EACH ROW EXECUTE FUNCTION update_participant_streaks();

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Create storage bucket for progress files
INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-files', 'progress-files', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users';
COMMENT ON TABLE public.challenges IS 'User-created challenges with custom metrics';
COMMENT ON TABLE public.challenge_participants IS 'Users participating in challenges';
COMMENT ON TABLE public.daily_entries IS 'Daily tracking entries for challenge participants';
COMMENT ON TABLE public.user_storage_usage IS 'Track storage usage per user for file uploads';
COMMENT ON TABLE public.notification_preferences IS 'User preferences for notifications';
