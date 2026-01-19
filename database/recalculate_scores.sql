-- Database Maintenance: Recalculate all audit scores based on 78 Success Criteria
-- This fixes legacy scores that were calculated using 50 as the total.

WITH calculated_scores AS (
    SELECT 
        pa.page_audit_id,
        COALESCE(COUNT(CASE WHEN r.result = 'pass' THEN 1 END), 0) as pass_count,
        COALESCE(COUNT(CASE WHEN r.result = 'na' THEN 1 END), 0) as na_count,
        78 as total_scs
    FROM page_audits pa
    LEFT JOIN page_sc_results r ON pa.page_audit_id = r.page_audit_id
    GROUP BY pa.page_audit_id
)
UPDATE page_audits
SET score = CASE 
    WHEN (total_scs - na_count) > 0 
    THEN ROUND((pass_count::float / (total_scs - na_count)) * 100)
    ELSE 0 
END,
last_saved_at = NOW()
FROM calculated_scores
WHERE page_audits.page_audit_id = calculated_scores.page_audit_id;

-- Verify results
SELECT p.page_url, pa.score 
FROM page_audits pa 
JOIN pages p ON pa.page_id = p.page_id 
ORDER BY pa.score DESC;
