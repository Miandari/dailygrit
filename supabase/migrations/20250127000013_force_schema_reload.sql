-- =====================================================
-- FORCE SCHEMA CACHE RELOAD & VERIFY DAILY ENTRIES TABLE
-- =====================================================

-- Force schema cache reload by calling the reload function
NOTIFY pgrst, 'reload schema';

-- Verify the daily_entries table structure
DO $$
DECLARE
    col_exists boolean;
BEGIN
    -- Check if entry_date column exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'daily_entries'
        AND column_name = 'entry_date'
    ) INTO col_exists;

    IF NOT col_exists THEN
        RAISE EXCEPTION 'Column entry_date does not exist in daily_entries table!';
    END IF;

    -- Check if metric_data column exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'daily_entries'
        AND column_name = 'metric_data'
    ) INTO col_exists;

    IF NOT col_exists THEN
        RAISE EXCEPTION 'Column metric_data does not exist in daily_entries table!';
    END IF;

    RAISE NOTICE 'All required columns exist in daily_entries table';
END $$;

-- Show current table structure for verification
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'daily_entries'
ORDER BY ordinal_position;

-- Ensure RLS is properly configured
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert their own entries" ON public.daily_entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON public.daily_entries;
DROP POLICY IF EXISTS "Users can view their own entries" ON public.daily_entries;

-- Create clean RLS policies
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

CREATE POLICY "Users can update their own entries"
ON public.daily_entries FOR UPDATE
TO authenticated
USING (
    participant_id IN (
        SELECT id FROM public.challenge_participants
        WHERE user_id = auth.uid()
    )
    AND is_locked = false
);

-- Force PostgREST to reload its schema cache
-- This is critical after schema changes
SELECT pg_notify('pgrst', 'reload schema');

-- Alternative method to force reload
ALTER TABLE public.daily_entries SET (autovacuum_enabled = true);

RAISE NOTICE '======================================';
RAISE NOTICE 'Schema cache reload initiated!';
RAISE NOTICE 'Daily entries table is ready to use';
RAISE NOTICE '======================================';