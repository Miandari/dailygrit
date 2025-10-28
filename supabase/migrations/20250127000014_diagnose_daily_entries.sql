-- =====================================================
-- DIAGNOSE DAILY_ENTRIES TABLE STRUCTURE
-- =====================================================

-- 1. Show exact table structure
SELECT
    'Column: ' || column_name ||
    ' | Type: ' || data_type ||
    ' | Nullable: ' || is_nullable ||
    ' | Default: ' || COALESCE(column_default::text, 'none') as table_structure
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'daily_entries'
ORDER BY ordinal_position;

-- 2. Check if we have the old schema or new schema
DO $$
DECLARE
    has_old_schema boolean := false;
    has_new_schema boolean := false;
    has_day_number boolean;
    has_values boolean;
    has_entry_date boolean;
    has_metric_data boolean;
BEGIN
    -- Check for old columns
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'daily_entries' AND column_name = 'day_number'
    ) INTO has_day_number;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'daily_entries' AND column_name = 'values'
    ) INTO has_values;

    -- Check for new columns
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'daily_entries' AND column_name = 'entry_date'
    ) INTO has_entry_date;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'daily_entries' AND column_name = 'metric_data'
    ) INTO has_metric_data;

    has_old_schema := has_day_number OR has_values;
    has_new_schema := has_entry_date AND has_metric_data;

    RAISE NOTICE '=== SCHEMA STATUS ===';
    RAISE NOTICE 'Has OLD schema (day_number, values): %', has_old_schema;
    RAISE NOTICE '  - day_number column: %', has_day_number;
    RAISE NOTICE '  - values column: %', has_values;
    RAISE NOTICE 'Has NEW schema (entry_date, metric_data): %', has_new_schema;
    RAISE NOTICE '  - entry_date column: %', has_entry_date;
    RAISE NOTICE '  - metric_data column: %', has_metric_data;

    IF NOT has_new_schema THEN
        RAISE NOTICE '';
        RAISE NOTICE '!!! WARNING: New schema columns are missing !!!';
        RAISE NOTICE 'The migration to add new columns may not have run properly.';

        -- Try to add the missing columns again
        RAISE NOTICE 'Attempting to add missing columns...';

        IF NOT has_entry_date THEN
            ALTER TABLE public.daily_entries ADD COLUMN entry_date DATE;
            RAISE NOTICE 'Added entry_date column';
        END IF;

        IF NOT has_metric_data THEN
            ALTER TABLE public.daily_entries ADD COLUMN metric_data JSONB DEFAULT '{}';
            RAISE NOTICE 'Added metric_data column';
        END IF;

        -- Also add other expected columns
        ALTER TABLE public.daily_entries ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;
        ALTER TABLE public.daily_entries ADD COLUMN IF NOT EXISTS notes TEXT;

        RAISE NOTICE 'Columns have been added. Schema should now be correct.';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '✓ New schema columns exist correctly';
    END IF;
END $$;

-- 3. Show constraints
SELECT
    'Constraint: ' || constraint_name || ' | Type: ' || constraint_type as constraint_info
FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND table_name = 'daily_entries';

-- 4. Force schema cache reload multiple ways
-- Method 1: NOTIFY
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- Method 2: Touch the table
COMMENT ON TABLE public.daily_entries IS 'Daily entries for challenge participants - schema updated';

-- Method 3: Dummy ALTER
ALTER TABLE public.daily_entries SET (autovacuum_enabled = true);

-- Method 4: Force statistics update
ANALYZE public.daily_entries;

-- 5. Final sanity check - try a test insert
DO $$
BEGIN
    -- This will fail if columns don't exist, giving us immediate feedback
    INSERT INTO public.daily_entries (
        participant_id,
        entry_date,
        metric_data,
        is_completed,
        notes
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        CURRENT_DATE,
        '{}'::jsonb,
        false,
        'Test entry - will be rolled back'
    );

    RAISE NOTICE '✓ Test insert successful - columns exist and are accessible';

    -- Rollback the test insert
    RAISE EXCEPTION 'Rolling back test insert' USING ERRCODE = 'P0001';
EXCEPTION
    WHEN SQLSTATE 'P0001' THEN
        -- Expected rollback
        NULL;
    WHEN OTHERS THEN
        RAISE NOTICE '✗ Test insert failed: %', SQLERRM;
        RAISE NOTICE 'This indicates the columns may not exist properly';
END $$;