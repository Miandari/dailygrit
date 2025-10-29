-- Add threshold_type to existing metrics in all challenges
-- This migration updates the JSONB metrics array to include threshold_type = 'min' by default

DO $$
DECLARE
  challenge_record RECORD;
  updated_metrics JSONB;
  metric JSONB;
  new_metric JSONB;
BEGIN
  -- Loop through all challenges
  FOR challenge_record IN SELECT id, metrics FROM challenges WHERE metrics IS NOT NULL
  LOOP
    updated_metrics := '[]'::JSONB;

    -- Loop through each metric in the metrics array
    FOR metric IN SELECT * FROM jsonb_array_elements(challenge_record.metrics)
    LOOP
      -- Add threshold_type if not present
      IF metric ? 'threshold' AND NOT metric ? 'threshold_type' THEN
        new_metric := metric || '{"threshold_type": "min"}'::JSONB;
      ELSE
        new_metric := metric;
      END IF;

      -- Append to updated metrics array
      updated_metrics := updated_metrics || jsonb_build_array(new_metric);
    END LOOP;

    -- Update the challenge with the new metrics array
    UPDATE challenges
    SET metrics = updated_metrics
    WHERE id = challenge_record.id;
  END LOOP;
END $$;
