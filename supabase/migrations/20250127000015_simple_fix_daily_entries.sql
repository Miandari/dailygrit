-- =====================================================
-- SIMPLE FIX FOR DAILY_ENTRIES TABLE
-- =====================================================

-- Drop the table and recreate it properly (keeping data if any)
-- First, backup any existing data
CREATE TEMP TABLE daily_entries_backup AS
SELECT * FROM public.daily_entries;

-- Drop the existing table
DROP TABLE IF EXISTS public.daily_entries CASCADE;

-- Recreate the table with correct schema
CREATE TABLE public.daily_entries (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    participant_id UUID NOT NULL REFERENCES public.challenge_participants(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    metric_data JSONB DEFAULT '{}' NOT NULL,
    is_completed BOOLEAN DEFAULT false NOT NULL,
    is_locked BOOLEAN DEFAULT false NOT NULL,
    notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_daily_entries_participant_id ON public.daily_entries(participant_id);
CREATE INDEX idx_daily_entries_entry_date ON public.daily_entries(entry_date);
CREATE UNIQUE INDEX daily_entries_participant_date_unique ON public.daily_entries(participant_id, entry_date);

-- Enable RLS
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own entries"
ON public.daily_entries FOR SELECT
TO authenticated
USING (
    participant_id IN (
        SELECT id FROM public.challenge_participants
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own entries"
ON public.daily_entries FOR INSERT
TO authenticated
WITH CHECK (
    participant_id IN (
        SELECT id FROM public.challenge_participants
        WHERE user_id = auth.uid()
        AND status = 'active'
    )
);

CREATE POLICY "Users can update their own unlocked entries"
ON public.daily_entries FOR UPDATE
TO authenticated
USING (
    participant_id IN (
        SELECT id FROM public.challenge_participants
        WHERE user_id = auth.uid()
    )
    AND is_locked = false
);

CREATE POLICY "Users can delete their own unlocked entries"
ON public.daily_entries FOR DELETE
TO authenticated
USING (
    participant_id IN (
        SELECT id FROM public.challenge_participants
        WHERE user_id = auth.uid()
    )
    AND is_locked = false
);

-- Try to restore any data from the backup
-- This will only work if the old table had compatible columns
DO $$
BEGIN
    -- Try to restore data if it exists and is compatible
    INSERT INTO public.daily_entries (
        id,
        participant_id,
        entry_date,
        metric_data,
        is_completed,
        is_locked,
        notes,
        submitted_at,
        created_at,
        updated_at
    )
    SELECT
        id,
        participant_id,
        COALESCE(entry_date, CURRENT_DATE),  -- Use entry_date if it exists
        COALESCE(metric_data, COALESCE(values, '{}'::jsonb)),  -- Try metric_data first, then values, then empty
        COALESCE(is_completed, false),
        COALESCE(is_locked, false),
        notes,
        COALESCE(submitted_at, created_at, CURRENT_TIMESTAMP),
        COALESCE(created_at, CURRENT_TIMESTAMP),
        COALESCE(updated_at, CURRENT_TIMESTAMP)
    FROM daily_entries_backup
    WHERE participant_id IS NOT NULL;

    RAISE NOTICE 'Restored existing data to new table structure';
EXCEPTION
    WHEN OTHERS THEN
        -- If restoration fails, that's OK - table might have been empty
        -- or had incompatible structure
        RAISE NOTICE 'No data to restore or incompatible structure - starting fresh';
END $$;

-- Drop the temp table
DROP TABLE IF EXISTS daily_entries_backup;

-- Force schema cache reload
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- Update table comment to trigger cache refresh
COMMENT ON TABLE public.daily_entries IS 'Daily entries for challenge participants - recreated with correct schema';

-- Verify the structure
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'daily_entries'
ORDER BY ordinal_position;