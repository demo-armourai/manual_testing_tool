-- Clear User Data Script
-- Deletes all user-generated audits, findings, and pages.
-- KEEPS the reference_sc_conditions (WCAG Checklist).

BEGIN;

-- 1. Truncate findings (depends on page_sc_results)
TRUNCATE TABLE findings RESTART IDENTITY CASCADE;

-- 2. Truncate page_sc_results (depends on page_audits)
TRUNCATE TABLE page_sc_results RESTART IDENTITY CASCADE;

-- 3. Truncate webcomply_report_summary (depends on page_audits)
TRUNCATE TABLE webcomply_report_summary RESTART IDENTITY CASCADE;

-- 4. Truncate page_audits (depends on pages and compliance_scores)
TRUNCATE TABLE page_audits RESTART IDENTITY CASCADE;

-- 5. Truncate compliance_scores (linked to page_audits)
-- Note: User_id table commented out in schema, so this is standalone or linked by code.
TRUNCATE TABLE compliance_scores RESTART IDENTITY CASCADE;

-- 6. Truncate pages (parent table)
TRUNCATE TABLE pages RESTART IDENTITY CASCADE;

COMMIT;
