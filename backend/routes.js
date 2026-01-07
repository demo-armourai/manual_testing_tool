const express = require('express');
const router = express.Router();
const db = require('./db');

/**
 * ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================
 */

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(err => {
        console.error('SERVER ERROR:', err);
        next(err);
    });

/**
 * ============================================================================
 * AUDIT MANAGEMENT ROUTES
 * ============================================================================
 */

/**
 * @route   POST /api/audits/start
 * @desc    Start a new audit for a page or resume an existing incomplete one.
 *          Upserts the page into the 'pages' table and inserts/retrieves the audit in 'page_audits'.
 * @body    {string} domain - The domain of the page being audited
 * @body    {string} page_url - The full URL of the page
 * @body    {string} page_name - Human-readable name for the page
 * @returns {object} { page_audit_id, page_id, message? }
 * @access  Public
 */
router.post('/audits/start', asyncHandler(async (req, res) => {
    const { domain, page_url, page_name } = req.body;

    // Validate required fields
    if (!domain || !page_url) {
        return res.status(400).json({ error: 'Domain and page_url are required' });
    }

    // Upsert Page - Insert new or update timestamp if exists
    let pageResult = await db.query(
        `INSERT INTO pages (domain, page_url, page_name) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (domain, page_url) DO UPDATE SET updated_at = now() 
         RETURNING page_id`,
        [domain, page_url, page_name]
    );
    const page_id = pageResult.rows[0].page_id;

    // Insert Audit (or get existing active one)
    try {
        let auditResult = await db.query(
            `INSERT INTO page_audits (page_id, status) 
             VALUES ($1, 'in_progress') 
             RETURNING page_audit_id`,
            [page_id]
        );
        res.json({
            page_audit_id: auditResult.rows[0].page_audit_id,
            page_id
        });
    } catch (err) {
        // If unique constraint violation, get the existing one
        if (err.code === '23505') { // unique_violation
            const existing = await db.query(
                `SELECT page_audit_id FROM page_audits WHERE page_id = $1`,
                [page_id]
            );
            res.json({
                page_audit_id: existing.rows[0].page_audit_id,
                page_id,
                message: "Resumed existing audit"
            });
        } else {
            throw err;
        }
    }
}));

/**
 * @route   GET /api/audits
 * @desc    Fetch a list of all audits with their associated page information.
 *          Returns page details, audit status, score, and timestamps.
 * @returns {array} Array of audit objects with page details
 * @access  Public
 */
router.get('/audits', asyncHandler(async (req, res) => {
    const result = await db.query(`
        SELECT 
            pa.page_audit_id,
            pa.page_id,
            pa.status,
            pa.score,
            pa.wcag_version,
            pa.audited_by,
            pa.started_at,
            pa.completed_at,
            p.domain,
            p.page_url,
            p.page_name
        FROM page_audits pa
        JOIN pages p ON pa.page_id = p.page_id
        ORDER BY pa.started_at DESC
    `);
    res.json(result.rows);
}));

/**
 * @route   PUT /api/audits/:page_audit_id
 * @desc    Update audit metadata such as status, score, and audited_by.
 */
router.put('/audits/:page_audit_id', asyncHandler(async (req, res) => {
    const { page_audit_id } = req.params;
    const { status, score, audited_by } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status) {
        updates.push(`status = $${paramCount++}`);
        values.push(status);
        if (status === 'completed') {
            updates.push(`completed_at = now()`);
        }
    }

    if (score !== undefined) {
        updates.push(`score = $${paramCount++}`);
        values.push(score);
    }

    if (audited_by !== undefined) {
        updates.push(`audited_by = $${paramCount++}`);
        values.push(audited_by);
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(page_audit_id);
    const result = await db.query(
        `UPDATE page_audits SET ${updates.join(', ')} WHERE page_audit_id = $${paramCount} RETURNING *`,
        values
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Audit not found' });
    }

    res.json(result.rows[0]);
}));

/**
 * @route   DELETE /api/audits/:page_audit_id
 * @desc    Permanently delete an audit and all its cascaded data (results, findings, reports).
 */
router.delete('/audits/:page_audit_id', asyncHandler(async (req, res) => {
    const { page_audit_id } = req.params;

    const result = await db.query(
        'DELETE FROM page_audits WHERE page_audit_id = $1 RETURNING *',
        [page_audit_id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Audit not found' });
    }

    res.json({ success: true, message: 'Audit deleted successfully', deleted: result.rows[0] });
}));

/**
 * @route   GET /api/conditions
 * @desc    Fetch all active WCAG success criteria and conditions from the reference table.
 *          This is used to populate the checklist on the frontend.
 * @returns {array} Array of WCAG condition objects
 * @access  Public
 */
router.get('/conditions', asyncHandler(async (req, res) => {
    const result = await db.query(
        `SELECT * FROM reference_sc_conditions 
         WHERE is_active = TRUE 
         ORDER BY sc_id`
    );
    res.json(result.rows);
}));

/**
 * ============================================================================
 * RESULTS MANAGEMENT ROUTES
 * ============================================================================
 */

/**
 * @route   POST /api/results
 * @desc    Submit or update the result for a specific WCAG Success Criterion.
 *          Stores the result (pass/fail/na/pending), notes, and detailed checked conditions.
 * @body    {string} page_audit_id - UUID of the audit
 * @body    {string} sc_id - WCAG Success Criterion ID (e.g., "1.1.1")
 * @body    {string} result - Result status: pass, fail, na, or pending
 * @body    {object} checked_conditions - JSONB object with condition statuses
 * @body    {string} notes - Optional notes from the auditor
 * @returns {object} { success: true, result_id }
 * @access  Public
 */
router.post('/results', asyncHandler(async (req, res) => {
    const { page_audit_id, sc_id, result, checked_conditions, notes } = req.body;

    // Validate required fields
    if (!page_audit_id || !sc_id || !result) {
        return res.status(400).json({
            error: 'page_audit_id, sc_id, and result are required'
        });
    }

    // Validate result value
    const validResults = ['pass', 'fail', 'na', 'pending'];
    if (!validResults.includes(result)) {
        return res.status(400).json({
            error: `Invalid result. Must be one of: ${validResults.join(', ')}`
        });
    }

    // Upsert the result for the given audit and success criterion
    const dbResult = await db.query(
        `INSERT INTO page_sc_results (page_audit_id, sc_id, result, checked_conditions, notes, reviewed_at)
         VALUES ($1, $2, $3, $4, $5, now())
         ON CONFLICT (page_audit_id, sc_id) 
         DO UPDATE SET 
            result = EXCLUDED.result, 
            checked_conditions = EXCLUDED.checked_conditions, 
            notes = EXCLUDED.notes, 
            reviewed_at = now()
         RETURNING result_id`,
        [page_audit_id, sc_id, result, checked_conditions || {}, notes]
    );

    res.json({
        success: true,
        result_id: dbResult.rows[0].result_id
    });
}));

/**
 * @route   GET /api/results/audit/:page_audit_id
 * @desc    Fetch all results for a specific audit.
 *          Returns all WCAG success criterion evaluations for the audit.
 * @param   {string} page_audit_id - UUID of the audit
 * @returns {array} Array of result objects
 * @access  Public
 */
router.get('/results/audit/:page_audit_id', asyncHandler(async (req, res) => {
    const { page_audit_id } = req.params;

    const result = await db.query(
        `SELECT 
            result_id,
            page_audit_id,
            sc_id,
            result,
            checked_conditions,
            notes,
            reviewed_at
         FROM page_sc_results
         WHERE page_audit_id = $1
         ORDER BY sc_id`,
        [page_audit_id]
    );

    res.json(result.rows);
}));

/**
 * @route   GET /api/results/audit/:page_audit_id/sc/:sc_id
 * @desc    Fetch a specific result for a success criterion within an audit.
 * @param   {string} page_audit_id - UUID of the audit
 * @param   {string} sc_id - WCAG Success Criterion ID
 * @returns {object} Result object or 404 if not found
 * @access  Public
 */
router.get('/results/audit/:page_audit_id/sc/:sc_id', asyncHandler(async (req, res) => {
    const { page_audit_id, sc_id } = req.params;

    const result = await db.query(
        `SELECT 
            result_id,
            page_audit_id,
            sc_id,
            result,
            checked_conditions,
            notes,
            reviewed_at
         FROM page_sc_results
         WHERE page_audit_id = $1 AND sc_id = $2`,
        [page_audit_id, sc_id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Result not found' });
    }

    res.json(result.rows[0]);
}));

/**
 * @route   GET /api/results/:result_id
 * @desc    Fetch a specific result by its result_id.
 * @param   {string} result_id - UUID of the result
 * @returns {object} Result object with associated findings
 * @access  Public
 */
router.get('/results/:result_id', asyncHandler(async (req, res) => {
    const { result_id } = req.params;

    // Get the result
    const result = await db.query(
        `SELECT 
            r.result_id,
            r.page_audit_id,
            r.sc_id,
            r.result,
            r.checked_conditions,
            r.notes,
            r.reviewed_at
         FROM page_sc_results r
         WHERE r.result_id = $1`,
        [result_id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Result not found' });
    }

    // Get associated findings
    const findings = await db.query(
        `SELECT * FROM findings WHERE result_id = $1 ORDER BY created_at DESC`,
        [result_id]
    );

    res.json({
        ...result.rows[0],
        findings: findings.rows
    });
}));

/**
 * @route   DELETE /api/results/:result_id
 * @desc    Delete a specific result and all associated findings (cascade).
 * @param   {string} result_id - UUID of the result to delete
 * @returns {object} { success: true, message }
 * @access  Public
 */
router.delete('/results/:result_id', asyncHandler(async (req, res) => {
    const { result_id } = req.params;

    const result = await db.query(
        `DELETE FROM page_sc_results WHERE result_id = $1 RETURNING result_id`,
        [result_id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Result not found' });
    }

    res.json({
        success: true,
        message: 'Result and associated findings deleted successfully'
    });
}));

/**
 * ============================================================================
 * FINDINGS MANAGEMENT ROUTES
 * ============================================================================
 */

/**
 * @route   POST /api/findings
 * @desc    Create a new accessibility finding (defect) linked to a result.
 *          Findings capture specific instances where WCAG criteria fail.
 * @body    {string} result_id - UUID of the associated result
 * @body    {string} severity - Severity level: Critical, Serious, Moderate, or Minor
 * @body    {string} description - Detailed description of the issue
 * @body    {string} selector - CSS selector or XPath to locate the element
 * @body    {string} html_snippet - HTML code snippet showing the issue
 * @returns {object} { finding_id, result_id, severity, ... }
 * @access  Public
 */
/**
 * @route   GET /api/findings
 * @desc    Fetch all findings across all audits.
 */
router.get('/findings', asyncHandler(async (req, res) => {
    const result = await db.query(`
        SELECT 
            f.finding_id,
            f.result_id,
            f.severity,
            f.description,
            f.selector,
            f.html_snippet,
            f.created_at,
            f.notes,
            r.sc_id,
            pa.page_audit_id as auditId,
            p.domain,
            p.page_url as url,
            p.page_name as page
        FROM findings f
        JOIN page_sc_results r ON f.result_id = r.result_id
        JOIN page_audits pa ON r.page_audit_id = pa.page_audit_id
        JOIN pages p ON pa.page_id = p.page_id
        ORDER BY f.created_at DESC
    `);
    res.json(result.rows);
}));

router.post('/findings', asyncHandler(async (req, res) => {
    const { result_id, severity, description, selector, html_snippet, notes } = req.body;

    // Validate required fields
    if (!result_id || !severity || !description) {
        return res.status(400).json({
            error: 'result_id, severity, and description are required'
        });
    }

    // Validate severity value
    const validSeverities = ['Critical', 'Serious', 'Moderate', 'Minor'];
    if (!validSeverities.includes(severity)) {
        return res.status(400).json({
            error: `Invalid severity. Must be one of: ${validSeverities.join(', ')}`
        });
    }

    // Verify that the result exists
    const resultCheck = await db.query(
        `SELECT result_id FROM page_sc_results WHERE result_id = $1`,
        [result_id]
    );

    if (resultCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Associated result not found' });
    }

    // Insert the finding
    const result = await db.query(
        `INSERT INTO findings (result_id, severity, description, selector, html_snippet, notes)
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [result_id, severity, description, selector, html_snippet, notes]
    );

    res.status(201).json(result.rows[0]);
}));

/**
 * @route   GET /api/findings/audit/:page_audit_id
 * @desc    Fetch all findings associated with a specific audit (across all results).
 *          optimized endpoint to retrieve all findings in one request.
 * @param   {string} page_audit_id - UUID of the audit
 * @returns {array} Array of finding objects
 * @access  Public
 */
router.get('/findings/audit/:page_audit_id', asyncHandler(async (req, res) => {
    const { page_audit_id } = req.params;

    const result = await db.query(
        `SELECT 
            f.finding_id,
            f.result_id,
            f.severity,
            f.description,
            f.selector,
            f.html_snippet,
            f.created_at,
            f.notes,
            r.sc_id,
            pa.page_audit_id as auditId,
            p.domain,
            p.page_url as url,
            p.page_name as page
         FROM findings f
         JOIN page_sc_results r ON f.result_id = r.result_id
         JOIN page_audits pa ON r.page_audit_id = pa.page_audit_id
         JOIN pages p ON pa.page_id = p.page_id
         WHERE r.page_audit_id = $1
         ORDER BY f.created_at DESC`,
        [page_audit_id]
    );

    res.json(result.rows);
}));

/**
 * @route   GET /api/findings/result/:result_id
 * @desc    Fetch all findings associated with a specific result.
 *          Returns all defects found for a particular WCAG success criterion evaluation.
 * @param   {string} result_id - UUID of the result
 * @returns {array} Array of finding objects
 * @access  Public
 */
router.get('/findings/result/:result_id', asyncHandler(async (req, res) => {
    const { result_id } = req.params;

    const result = await db.query(
        `SELECT 
            finding_id,
            result_id,
            severity,
            description,
            selector,
            html_snippet,
            created_at
         FROM findings
         WHERE result_id = $1
         ORDER BY created_at DESC`,
        [result_id]
    );

    res.json(result.rows);
}));

/**
 * @route   GET /api/findings/:finding_id
 * @desc    Fetch a specific finding by its ID.
 * @param   {string} finding_id - UUID of the finding
 * @returns {object} Finding object with associated result details
 * @access  Public
 */
router.get('/findings/:finding_id', asyncHandler(async (req, res) => {
    const { finding_id } = req.params;

    const result = await db.query(
        `SELECT 
            f.finding_id,
            f.result_id,
            f.severity,
            f.description,
            f.selector,
            f.html_snippet,
            f.created_at,
            r.sc_id,
            r.result as sc_result
         FROM findings f
         JOIN page_sc_results r ON f.result_id = r.result_id
         WHERE f.finding_id = $1`,
        [finding_id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Finding not found' });
    }

    res.json(result.rows[0]);
}));

/**
 * @route   PUT /api/findings/:finding_id
 * @desc    Update an existing finding.
 *          Allows modification of severity, description, selector, and HTML snippet.
 * @param   {string} finding_id - UUID of the finding to update
 * @body    {string} severity - Updated severity level
 * @body    {string} description - Updated description
 * @body    {string} selector - Updated CSS selector
 * @body    {string} html_snippet - Updated HTML snippet
 * @returns {object} Updated finding object
 * @access  Public
 */
router.put('/findings/:finding_id', asyncHandler(async (req, res) => {
    const { finding_id } = req.params;
    const { severity, description, selector, html_snippet, notes } = req.body;

    // Validate severity if provided
    if (severity) {
        const validSeverities = ['Critical', 'Serious', 'Moderate', 'Minor'];
        if (!validSeverities.includes(severity)) {
            return res.status(400).json({
                error: `Invalid severity. Must be one of: ${validSeverities.join(', ')}`
            });
        }
    }

    // Build dynamic update query based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (severity !== undefined) {
        updates.push(`severity = $${paramCount++}`);
        values.push(severity);
    }
    if (description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(description);
    }
    if (selector !== undefined) {
        updates.push(`selector = $${paramCount++}`);
        values.push(selector);
    }
    if (html_snippet !== undefined) {
        updates.push(`html_snippet = $${paramCount++}`);
        values.push(html_snippet);
    }
    if (notes !== undefined) {
        updates.push(`notes = $${paramCount++}`);
        values.push(notes);
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(finding_id);

    const result = await db.query(
        `UPDATE findings 
         SET ${updates.join(', ')}
         WHERE finding_id = $${paramCount}
         RETURNING *`,
        values
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Finding not found' });
    }

    res.json(result.rows[0]);
}));

/**
 * @route   DELETE /api/findings/:finding_id
 * @desc    Delete a specific finding.
 * @param   {string} finding_id - UUID of the finding to delete
 * @returns {object} { success: true, message }
 * @access  Public
 */
router.delete('/findings/:finding_id', asyncHandler(async (req, res) => {
    const { finding_id } = req.params;

    const result = await db.query(
        `DELETE FROM findings WHERE finding_id = $1 RETURNING finding_id`,
        [finding_id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Finding not found' });
    }

    res.json({
        success: true,
        message: 'Finding deleted successfully'
    });
}));

/**
 * ============================================================================
 * REPORTS MANAGEMENT ROUTES
 * ============================================================================
 */

/**
 * @route   POST /api/reports/generate
 * @desc    Generate or update a compliance report summary for an audit.
 *          Aggregates all results and calculates compliance metrics.
 * @body    {string} page_audit_id - UUID of the audit to generate report for
 * @returns {object} Generated report summary
 * @access  Public
 */
router.post('/reports/generate', asyncHandler(async (req, res) => {
    const { page_audit_id } = req.body;

    if (!page_audit_id) {
        return res.status(400).json({ error: 'page_audit_id is required' });
    }

    // Get audit and page details
    const auditData = await db.query(
        `SELECT 
            pa.page_audit_id,
            pa.status,
            pa.score,
            pa.completed_at,
            p.domain,
            p.page_name,
            p.page_url
         FROM page_audits pa
         JOIN pages p ON pa.page_id = p.page_id
         WHERE pa.page_audit_id = $1`,
        [page_audit_id]
    );

    if (auditData.rows.length === 0) {
        return res.status(404).json({ error: 'Audit not found' });
    }

    const audit = auditData.rows[0];

    // Aggregate results
    const resultsAgg = await db.query(
        `SELECT 
            result,
            COUNT(*) as count
         FROM page_sc_results
         WHERE page_audit_id = $1
         GROUP BY result`,
        [page_audit_id]
    );

    // Initialize counts
    let pass_count = 0;
    let fail_count = 0;
    let na_count = 0;
    let pending_count = 0;

    // Populate counts from aggregation
    resultsAgg.rows.forEach(row => {
        switch (row.result) {
            case 'pass': pass_count = parseInt(row.count); break;
            case 'fail': fail_count = parseInt(row.count); break;
            case 'na': na_count = parseInt(row.count); break;
            case 'pending': pending_count = parseInt(row.count); break;
        }
    });

    // Calculate compliance percentage
    const total_evaluated = pass_count + fail_count;
    const compliance_percentage = total_evaluated > 0
        ? ((pass_count / total_evaluated) * 100).toFixed(2)
        : 0;

    // Upsert report summary
    const report = await db.query(
        `INSERT INTO webcomply_report_summary (
            page_audit_id,
            domain,
            page_name,
            page_url,
            audit_status,
            audit_score,
            completed_at,
            pass_count,
            fail_count,
            na_count,
            pending_count,
            compliance_percentage,
            generated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
         ON CONFLICT (page_audit_id)
         DO UPDATE SET
            audit_status = EXCLUDED.audit_status,
            audit_score = EXCLUDED.audit_score,
            completed_at = EXCLUDED.completed_at,
            pass_count = EXCLUDED.pass_count,
            fail_count = EXCLUDED.fail_count,
            na_count = EXCLUDED.na_count,
            pending_count = EXCLUDED.pending_count,
            compliance_percentage = EXCLUDED.compliance_percentage,
            generated_at = now()
         RETURNING *`,
        [
            page_audit_id,
            audit.domain,
            audit.page_name,
            audit.page_url,
            audit.status,
            Math.round(compliance_percentage), // Update score based on compliance %
            audit.completed_at,
            pass_count,
            fail_count,
            na_count,
            pending_count,
            compliance_percentage
        ]
    );

    // Also update the score in page_audits
    await db.query(
        `UPDATE page_audits SET score = $1 WHERE page_audit_id = $2`,
        [Math.round(compliance_percentage), page_audit_id]
    );

    res.json(report.rows[0]);
}));

/**
 * @route   GET /api/reports/audit/:page_audit_id
 * @desc    Fetch the report summary for a specific audit.
 * @param   {string} page_audit_id - UUID of the audit
 * @returns {object} Report summary object
 * @access  Public
 */
router.get('/reports/audit/:page_audit_id', asyncHandler(async (req, res) => {
    const { page_audit_id } = req.params;

    const result = await db.query(
        `SELECT * FROM webcomply_report_summary WHERE page_audit_id = $1`,
        [page_audit_id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({
            error: 'Report not found. Generate a report first using POST /api/reports/generate'
        });
    }

    res.json(result.rows[0]);
}));

/**
 * @route   GET /api/reports
 * @desc    Fetch all report summaries with optional pagination.
 * @query   {number} limit - Maximum number of reports to return (default: 50)
 * @query   {number} offset - Number of reports to skip (default: 0)
 * @returns {object} { reports: [...], total, limit, offset }
 * @access  Public
 */
router.get('/reports', asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    // Get total count
    const countResult = await db.query(
        `SELECT COUNT(*) as total FROM webcomply_report_summary`
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated reports
    const result = await db.query(
        `SELECT * FROM webcomply_report_summary 
         ORDER BY generated_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    );

    res.json({
        reports: result.rows,
        total,
        limit,
        offset
    });
}));

/**
 * @route   GET /api/reports/:report_id
 * @desc    Fetch a specific report by its report_id.
 * @param   {string} report_id - UUID of the report
 * @returns {object} Report summary object
 * @access  Public
 */
router.get('/reports/:report_id', asyncHandler(async (req, res) => {
    const { report_id } = req.params;

    const result = await db.query(
        `SELECT * FROM webcomply_report_summary WHERE report_id = $1`,
        [report_id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
    }

    res.json(result.rows[0]);
}));

/**
 * @route   PUT /api/reports/:report_id
 * @desc    Update report metadata (e.g., manual adjustments to compliance percentage).
 *          Note: Use POST /api/reports/generate to recalculate from results.
 * @param   {string} report_id - UUID of the report
 * @body    {number} compliance_percentage - Updated compliance percentage
 * @body    {number} audit_score - Updated audit score
 * @returns {object} Updated report object
 * @access  Public
 */
router.put('/reports/:report_id', asyncHandler(async (req, res) => {
    const { report_id } = req.params;
    const { compliance_percentage, audit_score } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (compliance_percentage !== undefined) {
        updates.push(`compliance_percentage = $${paramCount++}`);
        values.push(compliance_percentage);
    }
    if (audit_score !== undefined) {
        updates.push(`audit_score = $${paramCount++}`);
        values.push(audit_score);
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(report_id);

    const result = await db.query(
        `UPDATE webcomply_report_summary 
         SET ${updates.join(', ')}
         WHERE report_id = $${paramCount}
         RETURNING *`,
        values
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
    }

    res.json(result.rows[0]);
}));

/**
 * @route   GET /api/reports/audit/:page_audit_id/json
 * @desc    Get comprehensive JSON data for PDF report generation.
 *          Returns all test results, findings, and metadata in a format suitable for PDF generation.
 * @param   {string} page_audit_id - UUID of the audit
 * @returns {object} Comprehensive report JSON data
 * @access  Public
 */
router.get('/reports/audit/:page_audit_id/json', asyncHandler(async (req, res) => {
    const { page_audit_id } = req.params;

    // Get audit and page details
    const auditData = await db.query(
        `SELECT 
            pa.page_audit_id,
            pa.status,
            pa.score,
            pa.completed_at,
            pa.started_at,
            pa.wcag_version,
            p.domain,
            p.page_name,
            p.page_url
         FROM page_audits pa
         JOIN pages p ON pa.page_id = p.page_id
         WHERE pa.page_audit_id = $1`,
        [page_audit_id]
    );

    if (auditData.rows.length === 0) {
        return res.status(404).json({ error: 'Audit not found' });
    }

    const audit = auditData.rows[0];

    // Get all test results (page_sc_results)
    const resultsData = await db.query(
        `SELECT 
            r.result_id,
            r.sc_id,
            r.result,
            r.checked_conditions,
            r.notes,
            r.reviewed_at
         FROM page_sc_results r
         WHERE r.page_audit_id = $1
         ORDER BY r.sc_id`,
        [page_audit_id]
    );

    // Get all findings
    const findingsData = await db.query(
        `SELECT 
            f.finding_id,
            f.result_id,
            f.severity,
            f.description,
            f.selector,
            f.html_snippet,
            f.notes,
            f.created_at,
            r.sc_id
         FROM findings f
         JOIN page_sc_results r ON f.result_id = r.result_id
         WHERE r.page_audit_id = $1
         ORDER BY f.created_at DESC`,
        [page_audit_id]
    );

    // Get reference conditions to map axe rules
    const conditionsData = await db.query(
        `SELECT 
            condition_id,
            sc_id,
            condition_text,
            condition_type,
            axe_rule_id
         FROM reference_sc_conditions
         WHERE is_active = true
         ORDER BY sc_id, condition_id`
    );

    // Build axe rule to SC mapping
    const axeRuleToSC = new Map();
    conditionsData.rows.forEach(cond => {
        if (cond.axe_rule_id) {
            if (!axeRuleToSC.has(cond.axe_rule_id)) {
                axeRuleToSC.set(cond.axe_rule_id, []);
            }
            axeRuleToSC.get(cond.axe_rule_id).push(cond.sc_id);
        }
    });

    // Axe rule descriptions mapping
    const axeRuleDescriptions = {
        'aria-allowed-attr': 'Ensure an element\'s role supports its ARIA attributes',
        'aria-conditional-attr': 'Ensure ARIA attributes are used as described in the specification of the element\'s role',
        'aria-deprecated-role': 'Ensure elements do not use deprecated roles',
        'aria-hidden-body': 'Ensure aria-hidden="true" is not present on the document body.',
        'aria-hidden-focus': 'Ensure aria-hidden elements are not focusable nor contain focusable elements',
        'aria-prohibited-attr': 'Ensure ARIA attributes are not prohibited for an element\'s role',
        'aria-required-attr': 'Ensure elements with ARIA roles have all required ARIA attributes',
        'aria-roles': 'Ensure all elements with a role attribute use a valid value',
        'aria-valid-attr-value': 'Ensure all ARIA attributes have valid values',
        'aria-valid-attr': 'Ensure attributes that begin with aria- are valid ARIA attributes',
        'button-name': 'Ensure buttons have discernible text',
        'bypass': 'Ensure each page has at least one mechanism for a user to bypass navigation and jump straight to the content',
        'document-title': 'Ensure each HTML document contains a non-empty <title> element',
        'duplicate-id-aria': 'Ensure every id attribute value used in ARIA and in labels is unique',
        'form-field-multiple-labels': 'Ensure form field does not have multiple label elements',
        'html-has-lang': 'Ensure every HTML document has a lang attribute',
        'html-lang-valid': 'Ensure the lang attribute of the <html> element has a valid value',
        'image-alt': 'Ensure <img> elements have alternative text or a role of none or presentation',
        'label': 'Ensure every form element has a label',
        'link-in-text-block': 'Ensure links are distinguished from surrounding text in a way that does not rely on color',
        'link-name': 'Ensure links have discernible text',
        'list': 'Ensure that lists are structured correctly',
        'listitem': 'Ensure <li> elements are used semantically',
        'nested-interactive': 'Ensure interactive controls are not nested as they are not always announced by screen readers or can cause focus problems for assistive technologies'
    };

    // Build tests array - prioritize axe rules, then SC-based tests
    const tests = [];
    const processedRuleIds = new Set();
    const processedSCIds = new Set();

    // First, process all SC results and map to axe rules where possible
    resultsData.rows.forEach(result => {
        // Only process Level A SCs (format: X.Y.Z)
        if (!result.sc_id.match(/^\d+\.\d+\.\d+$/)) {
            return;
        }

        const scId = result.sc_id;
        processedSCIds.add(scId);

        // Find axe rules for this SC
        const scConditions = conditionsData.rows.filter(c => c.sc_id === scId && c.axe_rule_id);
        const scFindings = findingsData.rows.filter(f => f.sc_id === scId);

        // Determine impact from findings
        let impact = 'minor';
        if (scFindings.length > 0) {
            const severities = scFindings.map(f => f.severity);
            if (severities.includes('critical')) impact = 'critical';
            else if (severities.includes('serious')) impact = 'serious';
            else if (severities.includes('moderate')) impact = 'moderate';
        }

        // Convert result status
        let resultStatus = 'Pass';
        if (result.result === 'fail') resultStatus = 'Fail';
        else if (result.result === 'na') resultStatus = 'N/A';
        else if (result.result === 'pending') resultStatus = 'Pending';

        // If SC has associated axe rules, create tests for those rules
        if (scConditions.length > 0) {
            scConditions.forEach(cond => {
                const ruleId = cond.axe_rule_id;
                if (!processedRuleIds.has(ruleId)) {
                    processedRuleIds.add(ruleId);

                    // Check if any SC with this rule has failed
                    const allSCsWithRule = conditionsData.rows
                        .filter(c => c.axe_rule_id === ruleId)
                        .map(c => c.sc_id);
                    const anyFailed = allSCsWithRule.some(id => {
                        const r = resultsData.rows.find(res => res.sc_id === id);
                        return r && r.result === 'fail';
                    });

                    const ruleImpact = anyFailed ? impact : 'minor';
                    const ruleResult = anyFailed ? 'Fail' : 'Pass';

                    tests.push({
                        id: ruleId,
                        description: axeRuleDescriptions[ruleId] || `Axe-core rule: ${ruleId}`,
                        result: ruleResult,
                        impact: ruleImpact
                    });
                }
            });
        } else {
            // No axe rule, create SC-based test
            tests.push({
                id: scId,
                description: `WCAG ${scId} compliance check`,
                result: resultStatus,
                impact: impact
            });
        }
    });

    // Also include any axe rules from conditions that might not have results yet
    conditionsData.rows.forEach(cond => {
        if (cond.axe_rule_id && !processedRuleIds.has(cond.axe_rule_id)) {
            // Check if this rule has any test results
            const ruleSCs = conditionsData.rows
                .filter(c => c.axe_rule_id === cond.axe_rule_id)
                .map(c => c.sc_id);
            const ruleResults = resultsData.rows.filter(r => ruleSCs.includes(r.sc_id));

            if (ruleResults.length > 0) {
                const anyFailed = ruleResults.some(r => r.result === 'fail');
                const failedResult = ruleResults.find(r => r.result === 'fail');
                const impact = failedResult ?
                    (findingsData.rows.find(f => f.sc_id === failedResult.sc_id)?.severity || 'minor') :
                    'minor';

                processedRuleIds.add(cond.axe_rule_id);
                tests.push({
                    id: cond.axe_rule_id,
                    description: axeRuleDescriptions[cond.axe_rule_id] || `Axe-core rule: ${cond.axe_rule_id}`,
                    result: anyFailed ? 'Fail' : 'Pass',
                    impact: impact
                });
            }
        }
    });

    // If no tests were generated from results, check if we have any results at all
    // If no results exist, return empty tests array (will show as no data)
    // If results exist but no tests generated, create default set
    if (tests.length === 0 && resultsData.rows.length === 0) {
        // No results at all - return empty array so PDF can show appropriate message
        // Don't create fake/default tests
    } else if (tests.length === 0 && resultsData.rows.length > 0) {
        // We have results but no tests generated - this shouldn't happen but handle it
        console.warn('Warning: Results exist but no tests generated. Creating SC-based tests.');
        resultsData.rows.forEach(result => {
            if (result.sc_id.match(/^\d+\.\d+\.\d+$/)) {
                const scFindings = findingsData.rows.filter(f => f.sc_id === result.sc_id);
                const impact = scFindings.length > 0 ? scFindings[0].severity : 'minor';

                tests.push({
                    id: result.sc_id,
                    description: `WCAG ${result.sc_id} compliance check`,
                    result: result.result === 'pass' ? 'Pass' : (result.result === 'fail' ? 'Fail' : 'N/A'),
                    impact: impact
                });
            }
        });
    }

    // Build findings array
    const findings = findingsData.rows.map(f => ({
        id: f.finding_id,
        scId: f.sc_id,
        severity: f.severity,
        description: f.description,
        selector: f.selector,
        htmlSnippet: f.html_snippet,
        notes: f.notes,
        createdAt: f.created_at
    }));

    // Calculate compliance metrics
    const passedTests = tests.filter(t => t.result === 'Pass').length;
    const failedTests = tests.filter(t => t.result === 'Fail').length;
    const totalTests = tests.length;
    const complianceScore = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    const reportJson = {
        assessment: {
            targetWebsite: audit.page_url,
            projectName: audit.page_name || 'ArmourWebComply',
            assessmentDate: audit.completed_at || audit.started_at || new Date().toISOString(),
            reportVersion: '1.0',
            testingTechnology: 'axe-core v4.10.3',
            complianceStandard: `WCAG ${audit.wcag_version || '2.2'} Level A`,
            aiRemediation: 'Included',
            preparedFor: 'User',
            preparedBy: {
                organization: 'Professional Accessibility Testing Team',
                email: 'accessibility@wcag-audit.com',
                role: 'Certified WCAG Auditor'
            }
        },
        compliance: {
            level: complianceScore === 100 ? 'Fully Compliant' : 'Partially Compliant',
            score: complianceScore,
            testsPassed: passedTests,
            totalTests: totalTests,
            issuesDetected: failedTests,
            successRate: complianceScore,
            testingStatus: 'Complete'
        },
        tests: tests.sort((a, b) => a.id.localeCompare(b.id)),
        findings: findings,
        summary: {
            totalTests: totalTests,
            passed: passedTests,
            failed: failedTests,
            violations: failedTests
        }
    };

    res.json(reportJson);
}));

module.exports = router;
