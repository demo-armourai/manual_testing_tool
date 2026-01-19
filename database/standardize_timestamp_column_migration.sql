-- Migration to standardize timestamp column names
-- Rename completed_at to last_saved_at in webcomply_report_summary for consistency with page_audits

BEGIN;

-- Check if column exists before renaming
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'webcomply_report_summary' 
               AND column_name = 'completed_at') THEN
        ALTER TABLE webcomply_report_summary RENAME COLUMN completed_at TO last_saved_at;
    END IF;
END $$;

COMMIT;
