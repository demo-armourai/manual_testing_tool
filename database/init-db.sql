-- 1. compliance_scores
-- WebComply schema table (Moved up due to FK dependency in page_audits)
CREATE TABLE IF NOT EXISTS compliance_scores (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  url TEXT NOT NULL,
  score REAL NOT NULL,
  passes INTEGER NOT NULL,
  violations INTEGER NOT NULL,
  incomplete INTEGER NOT NULL,
  inapplicable INTEGER NOT NULL,
  audit_results JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  -- FOREIGN KEY (user_id) REFERENCES users (id) -- Commented out as users table is not defined in this schema block
);

-- 2. pages 
-- Stores each unique web page that can be audited. 
CREATE TABLE IF NOT EXISTS pages (  
  page_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),  
  domain      TEXT NOT NULL,
  page_url    TEXT NOT NULL,
  page_name   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_pages_domain_url UNIQUE (domain, page_url)
);

CREATE INDEX IF NOT EXISTS idx_pages_domain ON pages(domain);

-- 3. page_audits 
-- Represents the audit session for a page.
CREATE TABLE IF NOT EXISTS page_audits (
  page_audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id       UUID NOT NULL REFERENCES pages(page_id) ON DELETE CASCADE,
  wcag_version  VARCHAR(10) NOT NULL DEFAULT '2.1'
                CHECK (wcag_version IN ('2.1','2.2')),
  status        VARCHAR(20) NOT NULL DEFAULT 'not_started'
                CHECK (status IN ('not_started','in_progress','completed','failed')),
  audited_by    TEXT,
  score         INTEGER DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  started_at    TIMESTAMPTZ DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  -- Optional linkage to a compliance snapshot
  compliance_score_id INTEGER NULL REFERENCES compliance_scores(id) ON DELETE SET NULL,
  CONSTRAINT uq_page_audit UNIQUE (page_id)
);

CREATE INDEX IF NOT EXISTS idx_page_audits_page_id ON page_audits(page_id);
CREATE INDEX IF NOT EXISTS idx_page_audits_compliance_score_id ON page_audits(compliance_score_id);

-- 3. reference_sc_conditions (The "Checklist") 
-- The actual rules that auditors verify.
-- NOTE: Logic for 'condition_type':
-- - If checks come from webcomply schema/automated sources, use 'automated' or 'axe-core'.
-- - If user manually passes/fails/NAs a check, it should be stored as 'manual'.
CREATE TABLE IF NOT EXISTS reference_sc_conditions (
  condition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sc_id        VARCHAR(20) NOT NULL,
  condition_text TEXT NOT NULL,
  condition_type VARCHAR(20) NOT NULL
                 CHECK (condition_type IN ('manual','automated','axe-core')),
  axe_rule_id TEXT,
  default_checked BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conditions_sc_id ON reference_sc_conditions(sc_id);

-- 4. page_sc_results 
-- Stores the final decision for each WCAG Success Criterion.
CREATE TABLE IF NOT EXISTS page_sc_results (
  result_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_audit_id UUID NOT NULL REFERENCES page_audits(page_audit_id) ON DELETE CASCADE,
  sc_id         VARCHAR(20) NOT NULL,
  result        VARCHAR(20) NOT NULL
                CHECK (result IN ('pass','fail','na','pending')),
  -- checked_conditions structure:
  -- {
  --   "<condition_key>": { "status": "pass|fail|na|pending", "tag": "manual|automated|axe-core" }
  -- }
  checked_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes         TEXT,
  reviewed_at   TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_page_sc UNIQUE (page_audit_id, sc_id)
);

CREATE INDEX IF NOT EXISTS idx_page_sc_results_audit ON page_sc_results(page_audit_id);
CREATE INDEX IF NOT EXISTS idx_page_sc_results_sc ON page_sc_results(sc_id);

-- 5. findings 
-- Stores specific accessibility defects (linked to the SC result).
CREATE TABLE IF NOT EXISTS findings (
  finding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id  UUID NOT NULL REFERENCES page_sc_results(result_id) ON DELETE CASCADE,
  severity   VARCHAR(20) NOT NULL
             CHECK (severity IN ('Critical','Serious','Moderate','Minor')),
  description TEXT NOT NULL,
  selector    TEXT,
  html_snippet TEXT,
  notes       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_findings_result_id ON findings(result_id);

-- 6. webcomply_report_summary 
-- Stored snapshot for final reporting.
CREATE TABLE IF NOT EXISTS webcomply_report_summary (
   report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   page_audit_id UUID NOT NULL
       REFERENCES page_audits(page_audit_id) ON DELETE CASCADE,
   domain TEXT NOT NULL,
   page_name TEXT,
   page_url TEXT NOT NULL,
   audit_status VARCHAR(20) NOT NULL,
   audit_score INTEGER,
   completed_at TIMESTAMPTZ,
   pass_count INTEGER NOT NULL DEFAULT 0,
   fail_count INTEGER NOT NULL DEFAULT 0,
   na_count INTEGER NOT NULL DEFAULT 0,
   pending_count INTEGER NOT NULL DEFAULT 0,
   compliance_percentage NUMERIC(5,2),
   generated_at TIMESTAMPTZ DEFAULT now(),
   CONSTRAINT uq_report_per_audit UNIQUE (page_audit_id)
);



