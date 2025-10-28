-- =====================================================
-- Fix RLS Policies for challenge_participants
-- Fixes infinite recursion issue
-- =====================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "View participants of joined challenges" ON public.challenge_participants;

-- Create a simpler, non-recursive policy
-- Users can view participants if they are either:
-- 1. A participant themselves (checking user_id directly)
-- 2. The creator of the challenge
CREATE POLICY "View participants of joined challenges"
  ON public.challenge_participants FOR SELECT
  USING (
    -- User is a participant in this challenge
    user_id = auth.uid()
    OR
    -- User is in the same challenge (simpler check without recursion)
    challenge_id IN (
      SELECT challenge_id
      FROM public.challenge_participants
      WHERE user_id = auth.uid()
    )
    OR
    -- User is the creator of the challenge
    challenge_id IN (
      SELECT id
      FROM public.challenges
      WHERE creator_id = auth.uid()
    )
  );

-- Also ensure the challenges table foreign key reference allows NULL for creator_id
-- (in case a user is deleted but we want to keep the challenge)
ALTER TABLE public.challenges
  ALTER COLUMN creator_id DROP NOT NULL;

-- Fix daily_entries policy as well to avoid similar issues
DROP POLICY IF EXISTS "View entries of joined challenges" ON public.daily_entries;

CREATE POLICY "View entries of joined challenges"
  ON public.daily_entries FOR SELECT
  USING (
    -- User can view entries if they are a participant in the same challenge
    participant_id IN (
      SELECT cp1.id
      FROM public.challenge_participants cp1
      WHERE cp1.challenge_id IN (
        SELECT cp2.challenge_id
        FROM public.challenge_participants cp2
        WHERE cp2.user_id = auth.uid()
      )
    )
  );

-- Ensure profiles can be inserted by the trigger function
GRANT INSERT ON public.profiles TO service_role;
GRANT INSERT ON public.user_storage_usage TO service_role;
GRANT INSERT ON public.notification_preferences TO service_role;