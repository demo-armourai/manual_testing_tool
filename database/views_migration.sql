-- Migration for shared wcag_compliance_dev database - Views and Functions
-- Date: 2026-01-13

DO $$ 
BEGIN
    -- 1. Create a function to log master admin actions
    CREATE OR REPLACE FUNCTION log_master_admin_action(
        p_master_admin_id TEXT,
        p_action VARCHAR(100),
        p_target_user_id TEXT DEFAULT NULL,
        p_details TEXT DEFAULT NULL,
        p_ip_address INET DEFAULT NULL
    ) RETURNS INTEGER AS $FUNC$
    DECLARE
        new_id INTEGER;
    BEGIN
        INSERT INTO master_admin_audit_logs (
            master_admin_id,
            action,
            target_user_id,
            details,
            ip_address
        ) VALUES (
            p_master_admin_id,
            p_action,
            p_target_user_id,
            p_details,
            p_ip_address
        )
        RETURNING id INTO new_id;
        
        RETURN new_id;
    END;
    $FUNC$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 2. Create a view for master admin dashboard
    CREATE OR REPLACE VIEW master_admin_dashboard_stats AS
    WITH 
    user_stats AS (
        SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
            COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_users,
            COUNT(DISTINCT role) as distinct_roles
        FROM users
    ),
    audit_stats AS (
        SELECT 
            COUNT(*) as total_audits,
            COALESCE(AVG(score), 0) as avg_compliance_score,
            COUNT(DISTINCT user_id) as unique_users_with_audits,
            MAX(created_at) as last_audit_date
        FROM compliance_scores
    ),
    credit_stats AS (
        SELECT 
            COUNT(*) as users_with_credits,
            COALESCE(SUM(credits), 0) as total_credits_available,
            COALESCE(AVG(credits), 0) as avg_credits_per_user
        FROM user_credits
    ),
    recent_activities AS (
        SELECT 
            COUNT(*) as activities_last_24h
        FROM user_activities
        WHERE created_at >= NOW() - INTERVAL '24 hours'
    )
    SELECT 
        u.total_users,
        u.active_users,
        u.inactive_users,
        u.distinct_roles,
        a.total_audits,
        a.avg_compliance_score,
        a.unique_users_with_audits,
        a.last_audit_date,
        c.users_with_credits,
        c.total_credits_available,
        c.avg_credits_per_user,
        r.activities_last_24h
    FROM 
        user_stats u,
        audit_stats a,
        credit_stats c,
        recent_activities r;

    -- 3. Create a view for recent master admin actions
    CREATE OR REPLACE VIEW recent_master_admin_actions AS
    SELECT 
        maal.id,
        maal.master_admin_id,
        u1.username as master_admin_username,
        maal.action,
        maal.target_user_id,
        u2.username as target_username,
        maal.details,
        maal.ip_address,
        maal.created_at
    FROM 
        master_admin_audit_logs maal
        JOIN users u1 ON maal.master_admin_id = u1.id
        LEFT JOIN users u2 ON maal.target_user_id = u2.id
    ORDER BY 
        maal.created_at DESC
    LIMIT 100;

END $$;
