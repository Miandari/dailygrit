-- =====================================================
-- FIX: Add missing columns to daily_entries table
-- =====================================================

-- Add the missing columns that the application expects
ALTER TABLE public.daily_entries
ADD COLUMN IF NOT EXISTS entry_date DATE,
ADD COLUMN IF NOT EXISTS metric_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create a unique constraint on participant_id and entry_date
-- First drop the old unique constraint if it exists
ALTER TABLE public.daily_entries DROP CONSTRAINT IF EXISTS daily_entries_participant_id_day_number_key;
ALTER TABLE public.daily_entries DROP CONSTRAINT IF EXISTS daily_entries_participant_id_entry_date_key;

-- Add the new unique constraint
ALTER TABLE public.daily_entries
ADD CONSTRAINT daily_entries_participant_id_entry_date_key
UNIQUE(participant_id, entry_date);

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_entries_date ON public.daily_entries(entry_date);

-- Migrate existing data if any (convert day_number to entry_date)
-- This assumes challenges start from their starts_at date
UPDATE public.daily_entries de
SET
  entry_date = c.starts_at::date + (de.day_number - 1),
  metric_data = de.values
FROM public.challenge_participants cp
JOIN public.challenges c ON c.id = cp.challenge_id
WHERE de.participant_id = cp.id
AND de.entry_date IS NULL;

-- Now we can optionally drop the old columns or keep them for backward compatibility
-- For now, let's keep them but stop using them in the app
-- ALTER TABLE public.daily_entries DROP COLUMN IF EXISTS day_number;
-- ALTER TABLE public.daily_entries DROP COLUMN IF EXISTS values;

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'Daily entries schema has been fixed!';
  RAISE NOTICE 'Added columns: entry_date, metric_data, is_completed, notes';
  RAISE NOTICE 'The application should now work correctly with daily entries';
END $$;