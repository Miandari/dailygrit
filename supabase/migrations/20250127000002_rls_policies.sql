-- =====================================================
-- Row Level Security Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_storage_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Anyone can view profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- CHALLENGES POLICIES
-- =====================================================

-- Public challenges viewable by everyone
CREATE POLICY "Public challenges are viewable by everyone"
  ON public.challenges FOR SELECT
  USING (is_public = true);

-- Private challenges viewable by participants
CREATE POLICY "Private challenges viewable by participants"
  ON public.challenges FOR SELECT
  USING (
    is_public = false
    AND (
      creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.challenge_participants
        WHERE challenge_id = id
        AND user_id = auth.uid()
      )
    )
  );

-- Users can create challenges
CREATE POLICY "Users can create challenges"
  ON public.challenges FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Creators can update their own challenges
CREATE POLICY "Creators can update own challenges"
  ON public.challenges FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Creators can delete their own challenges
CREATE POLICY "Creators can delete own challenges"
  ON public.challenges FOR DELETE
  USING (auth.uid() = creator_id);

-- =====================================================
-- CHALLENGE PARTICIPANTS POLICIES
-- =====================================================

-- Users can view participants of challenges they're in
CREATE POLICY "View participants of joined challenges"
  ON public.challenge_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.challenge_participants cp
      WHERE cp.challenge_id = challenge_participants.challenge_id
      AND cp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_participants.challenge_id
      AND c.creator_id = auth.uid()
    )
  );

-- Users can join challenges
CREATE POLICY "Users can join challenges"
  ON public.challenge_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own participation
CREATE POLICY "Users can update own participation"
  ON public.challenge_participants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Challenge creators can update any participant (for kicking users)
CREATE POLICY "Creators can manage participants"
  ON public.challenge_participants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.challenges
      WHERE id = challenge_id
      AND creator_id = auth.uid()
    )
  );

-- Users can leave challenges
CREATE POLICY "Users can leave challenges"
  ON public.challenge_participants FOR DELETE
  USING (auth.uid() = user_id);

-- Creators can remove participants
CREATE POLICY "Creators can remove participants"
  ON public.challenge_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.challenges
      WHERE id = challenge_id
      AND creator_id = auth.uid()
    )
  );

-- =====================================================
-- DAILY ENTRIES POLICIES
-- =====================================================

-- Users can view entries of challenges they're in
CREATE POLICY "View entries of joined challenges"
  ON public.daily_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.challenge_participants cp1
      INNER JOIN public.challenge_participants cp2
        ON cp1.challenge_id = cp2.challenge_id
      WHERE cp1.id = daily_entries.participant_id
      AND cp2.user_id = auth.uid()
    )
  );

-- Users can create their own entries
CREATE POLICY "Users can create own entries"
  ON public.daily_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.challenge_participants
      WHERE id = participant_id
      AND user_id = auth.uid()
    )
  );

-- Users can update their own unlocked entries
CREATE POLICY "Users can update own unlocked entries"
  ON public.daily_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.challenge_participants
      WHERE id = participant_id
      AND user_id = auth.uid()
    )
    AND is_locked = false
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.challenge_participants
      WHERE id = participant_id
      AND user_id = auth.uid()
    )
  );

-- Users can delete their own unlocked entries
CREATE POLICY "Users can delete own unlocked entries"
  ON public.daily_entries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.challenge_participants
      WHERE id = participant_id
      AND user_id = auth.uid()
    )
    AND is_locked = false
  );

-- =====================================================
-- STORAGE USAGE POLICIES
-- =====================================================

-- Users can view their own storage usage
CREATE POLICY "Users can view own storage usage"
  ON public.user_storage_usage FOR SELECT
  USING (auth.uid() = user_id);

-- System can update storage usage (handled by triggers/functions)
CREATE POLICY "System can update storage usage"
  ON public.user_storage_usage FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- NOTIFICATION PREFERENCES POLICIES
-- =====================================================

-- Users can view their own preferences
CREATE POLICY "Users can view own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- STORAGE POLICIES (for file uploads)
-- =====================================================

-- Users can upload files to their own folder
CREATE POLICY "Users can upload own files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'progress-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can view files in challenges they're part of
CREATE POLICY "Users can view challenge files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'progress-files'
    AND (
      -- Own files
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      -- Files from same challenge participants
      EXISTS (
        SELECT 1
        FROM public.challenge_participants cp1
        INNER JOIN public.challenge_participants cp2
          ON cp1.challenge_id = cp2.challenge_id
        WHERE cp1.user_id = auth.uid()
        AND cp2.user_id::text = (storage.foldername(name))[1]
      )
    )
  );

-- Users can update their own files
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'progress-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own files
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'progress-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
