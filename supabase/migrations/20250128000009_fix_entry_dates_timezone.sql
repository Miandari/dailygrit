-- Fix entry_date values that are one day ahead due to timezone issues
-- This subtracts one day from all entry_date values

UPDATE public.daily_entries
SET entry_date = (entry_date::date - interval '1 day')::date
WHERE entry_date > (SELECT MIN(starts_at)::date FROM public.challenges);

-- Note: This assumes all entries are exactly one day ahead.
-- After running this, verify the dates are correct before proceeding.
