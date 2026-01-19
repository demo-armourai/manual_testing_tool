-- Revised Comprehensive Migration for shared wcag_compliance_dev database
-- Date: 2026-01-13

DO $$ 
BEGIN
    -- 1. Fix page_audits: remove unique constraint to allow multiple audits
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_page_audit') THEN
        ALTER TABLE page_audits DROP CONSTRAINT uq_page_audit;
    END IF;

    -- 2. Enhance compliance_scores
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compliance_scores' AND column_name = 'audit_source') THEN
        ALTER TABLE compliance_scores ADD COLUMN audit_source TEXT DEFAULT 'manual';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compliance_scores' AND column_name = 'scheduled_audit_id') THEN
        ALTER TABLE compliance_scores ADD COLUMN scheduled_audit_id INTEGER;
    END IF;

    -- 3. Create scheduled_audits table
    CREATE TABLE IF NOT EXISTS scheduled_audits (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        schedule_name TEXT NOT NULL,
        target_url TEXT NOT NULL,
        schedule_type TEXT NOT NULL,
        execution_time TEXT NOT NULL,
        days_of_week JSONB,
        timezone TEXT DEFAULT 'Asia/Kolkata',
        max_runs INTEGER,
        current_run_count INTEGER DEFAULT 0,
        cron_expression TEXT NOT NULL,
        next_run_at TIMESTAMPTZ,
        last_run_at TIMESTAMPTZ,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Create scheduled_audit_results table
    CREATE TABLE IF NOT EXISTS scheduled_audit_results (
        id SERIAL PRIMARY KEY,
        scheduled_audit_id INTEGER NOT NULL REFERENCES scheduled_audits(id) ON DELETE CASCADE,
        execution_status TEXT NOT NULL CHECK (execution_status IN ('running', 'success', 'failed')),
        executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        compliance_score_id INTEGER REFERENCES compliance_scores(id) ON DELETE SET NULL,
        violations_count INTEGER,
        passes_count INTEGER,
        compliance_score NUMERIC(5,2),
        execution_time_ms INTEGER,
        error_message TEXT
    );

    -- 5. Create credit_transactions table
    CREATE TABLE IF NOT EXISTS credit_transactions (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
        amount INTEGER NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- 6. Create user_activities table
    CREATE TABLE IF NOT EXISTS user_activities (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        activity_type TEXT NOT NULL,
        details TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- 7. Create master_admin_audit_logs if missing
    CREATE TABLE IF NOT EXISTS master_admin_audit_logs (
        id SERIAL PRIMARY KEY,
        master_admin_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        target_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        details TEXT,
        ip_address INET,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

END $$;
