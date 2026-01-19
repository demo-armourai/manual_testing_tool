-- Migration: Remove unique constraint to allow multiple audits per page
-- Date: 2026-01-13

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_page_audit') THEN
        ALTER TABLE page_audits DROP CONSTRAINT uq_page_audit;
    END IF;
END $$;
