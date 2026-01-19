# Database Schema Documentation

PostgreSQL database schema for the WCAG Auditor application.

## Overview

The database consists of 6 main tables that track audits, results, findings, and reports for WCAG accessibility compliance.

## Entity Relationship Diagram

```
┌─────────────────┐
│  pages          │
├─────────────────┤
│ page_id (PK)    │◄────┐
│ domain          │     │
│ page_url        │     │
│ page_name       │     │
└─────────────────┘     │
                        │
                        │
┌─────────────────────┐ │
│  page_audits        │ │
├─────────────────────┤ │
│ page_audit_id (PK)  │ │
│ page_id (FK)        │─┘
│ wcag_version        │
│ status              │◄────┐
│ audited_by          │     │
│ score               │     │
└─────────────────────┘     │
                            │
                            │
┌─────────────────────────┐ │
│  page_sc_results        │ │
├─────────────────────────┤ │
│ result_id (PK)          │ │
│ page_audit_id (FK)      │─┘
│ sc_id                   │
│ result                  │◄────┐
│ checked_conditions      │     │
│ notes                   │     │
└─────────────────────────┘     │
                                │
                                │
┌─────────────────────────────┐ │
│  findings                   │ │
├─────────────────────────────┤ │
│ finding_id (PK)             │ │
│ result_id (FK)              │─┘
│ severity                    │
│ description                 │
│ selector                    │
│ html_snippet                │
└─────────────────────────────┘


┌──────────────────────────┐
│  reference_sc_conditions │
├──────────────────────────┤
│ condition_id (PK)        │
│ sc_id                    │
│ condition_text           │
│ condition_type           │
│ axe_rule_id              │
│ default_checked          │
│ is_active                │
└──────────────────────────┘


┌───────────────────────────┐
│  webcomply_report_summary │
├───────────────────────────┤
│ report_id (PK)            │
│ page_audit_id (FK) ───────┼──┐
│ domain                    │  │
│ page_name                 │  └─ references page_audits
│ page_url                  │
│ audit_status              │
│ audit_score               │
│ pass_count                │
│ fail_count                │
│ na_count                  │
│ pending_count             │
│ compliance_percentage     │
└───────────────────────────┘
```

## Tables

### 1. pages

Stores unique web pages that can be audited.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| page_id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique page identifier |
| domain | TEXT | NOT NULL | Website domain |
| page_url | TEXT | NOT NULL | Full URL of the page |
| page_name | TEXT | - | Human-readable page name |
| created_at | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**Constraints**:
- `UNIQUE (domain, page_url)` - Prevent duplicate pages

**Indexes**:
- `idx_pages_domain` on `domain`

---

### 2. page_audits

Represents audit sessions for pages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| page_audit_id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique audit identifier |
| page_id | UUID | NOT NULL, FOREIGN KEY → pages(page_id) | Reference to audited page |
| wcag_version | VARCHAR(10) | NOT NULL, DEFAULT '2.1', CHECK ('2.1', '2.2') | WCAG version used |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'not_started', CHECK | Audit status |
| audited_by | TEXT | - | Auditor name |
| score | INTEGER | DEFAULT 0, CHECK (0-100) | Overall audit score |
| started_at | TIMESTAMPTZ | DEFAULT now() | Audit start time |
| completed_at | TIMESTAMPTZ | - | Audit completion time |
| compliance_score_id | INTEGER | FOREIGN KEY → compliance_scores(id) | Optional snapshot link |

**Valid status values**: `not_started`, `in_progress`, `completed`, `failed`

**Constraints**:
- `UNIQUE (page_id)` - One active audit per page

**Indexes**:
- `idx_page_audits_page_id` on `page_id`
- `idx_page_audits_compliance_score_id` on `compliance_score_id`

---

### 3. reference_sc_conditions

WCAG success criteria reference data (seeded from Excel/SQL).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| condition_id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique condition identifier |
| sc_id | VARCHAR(20) | NOT NULL | WCAG SC ID (e.g., "1.1.1") |
| condition_text | TEXT | NOT NULL | Condition description |
| condition_type | VARCHAR(20) | NOT NULL, CHECK | Type of check |
| axe_rule_id | TEXT | - | Axe-core rule ID(s) if automated (comma-separated for consolidated conditions) |
| default_checked | BOOLEAN | NOT NULL, DEFAULT FALSE | Pre-checked by default |
| is_active | BOOLEAN | DEFAULT TRUE | Active in checklist |
| created_at | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |

**Valid condition_type values**: `manual`, `automated`, `axe-core`

**Indexes**:
- `idx_conditions_sc_id` on `sc_id`

---

### 4. page_sc_results

Stores audit results for each WCAG success criterion.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| result_id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique result identifier |
| page_audit_id | UUID | NOT NULL, FOREIGN KEY → page_audits | Reference to audit |
| sc_id | VARCHAR(20) | NOT NULL | WCAG SC ID |
| result | VARCHAR(20) | NOT NULL, CHECK | Result status |
| checked_conditions | JSONB | NOT NULL, DEFAULT '{}' | Condition evaluations |
| notes | TEXT | - | Auditor notes |
| reviewed_at | TIMESTAMPTZ | DEFAULT now() | Review timestamp |

**Valid result values**: `pass`, `fail`, `na`, `pending`

**checked_conditions structure**:
```json
{
  "condition_key": {
    "status": "pass|fail|na|pending",
    "tag": "manual|automated|axe-core"
  }
}
```

**Constraints**:
- `UNIQUE (page_audit_id, sc_id)` - One result per SC per audit

**Indexes**:
- `idx_page_sc_results_audit` on `page_audit_id`
- `idx_page_sc_results_sc` on `sc_id`

---

### 5. findings

Specific accessibility defects/issues found during audits.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| finding_id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique finding identifier |
| result_id | UUID | NOT NULL, FOREIGN KEY → page_sc_results | Reference to result |
| severity | VARCHAR(20) | NOT NULL, CHECK | Issue severity |
| description | TEXT | NOT NULL | Detailed description |
| selector | TEXT | - | CSS selector or XPath |
| html_snippet | TEXT | - | HTML code snippet |
| notes | TEXT | - | Additional auditor notes |
| created_at | TIMESTAMPTZ | DEFAULT now() | Finding creation time |

**Valid severity values**: `Critical`, `Serious`, `Moderate`, `Minor`

**Indexes**:
- `idx_findings_result_id` on `result_id`

**Cascade Behavior**:
- Deleted automatically when parent result is deleted

---

### 6. webcomply_report_summary

Generated compliance report snapshots.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| report_id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique report identifier |
| page_audit_id | UUID | NOT NULL, FOREIGN KEY → page_audits | Reference to audit |
| domain | TEXT | NOT NULL | Page domain |
| page_name | TEXT | - | Page name |
| page_url | TEXT | NOT NULL | Page URL |
| audit_status | VARCHAR(20) | NOT NULL | Audit status at report time |
| audit_score | INTEGER | - | Score at report time |
| completed_at | TIMESTAMPTZ | - | Audit completion time |
| pass_count | INTEGER | NOT NULL, DEFAULT 0 | Number of passed criteria |
| fail_count | INTEGER | NOT NULL, DEFAULT 0 | Number of failed criteria |
| na_count | INTEGER | NOT NULL, DEFAULT 0 | Number of N/A criteria |
| pending_count | INTEGER | NOT NULL, DEFAULT 0 | Number of pending criteria |
| compliance_percentage | NUMERIC(5,2) | - | Calculated compliance % |
| generated_at | TIMESTAMPTZ | DEFAULT now() | Report generation time |

**Constraints**:
- `UNIQUE (page_audit_id)` - One report per audit

---

## Database Setup

### Prerequisites

- PostgreSQL 12 or higher
- Database user with CREATE privileges

### Initialize Database

```bash
# Create database
createdb -U postgres auditor_db

# Or via psql
psql -U postgres
CREATE DATABASE auditor_db;
\q

# Run initialization script
cd backend
npm run init-db
```

### Seed Reference Data

```bash
# Seed WCAG conditions
cd backend
npm run seed
```

### Complete Setup (Init + Seed)

```bash
cd backend
npm run setup
```

## Queries

### Get Audit Progress

```sql
SELECT 
  pa.page_audit_id,
  p.page_name,
  COUNT(DISTINCT psr.sc_id) as criteria_evaluated,
  SUM(CASE WHEN psr.result = 'pass' THEN 1 ELSE 0 END) as passed,
  SUM(CASE WHEN psr.result = 'fail' THEN 1 ELSE 0 END) as failed,
  SUM(CASE WHEN psr.result = 'na' THEN 1 ELSE 0 END) as not_applicable,
  SUM(CASE WHEN psr.result = 'pending' THEN 1 ELSE 0 END) as pending
FROM page_audits pa
JOIN pages p ON pa.page_id = p.page_id
LEFT JOIN page_sc_results psr ON pa.page_audit_id = psr.page_audit_id
WHERE pa.page_audit_id = '<audit_id>'
GROUP BY pa.page_audit_id, p.page_name;
```

### Get All Findings for Audit

```sql
SELECT 
  f.finding_id,
  f.severity,
  f.description,
  psr.sc_id,
  psr.result
FROM findings f
JOIN page_sc_results psr ON f.result_id = psr.result_id
WHERE psr.page_audit_id = '<audit_id>'
ORDER BY 
  CASE f.severity
    WHEN 'Critical' THEN 1
    WHEN 'Serious' THEN 2
    WHEN 'Moderate' THEN 3
    WHEN 'Minor' THEN 4
  END,
  f.created_at DESC;
```

### Calculate Compliance Score

```sql
SELECT 
  page_audit_id,
  COUNT(*) FILTER (WHERE result = 'pass') as pass_count,
  COUNT(*) FILTER (WHERE result = 'fail') as fail_count,
  COUNT(*) FILTER (WHERE result IN ('pass', 'fail')) as total_evaluated,
  ROUND(
    (COUNT(*) FILTER (WHERE result = 'pass')::numeric / 
     NULLIF(COUNT(*) FILTER (WHERE result IN ('pass', 'fail')), 0)) * 100,
    2
  ) as compliance_percentage
FROM page_sc_results
WHERE page_audit_id = '<audit_id>'
GROUP BY page_audit_id;
```

## Maintenance

### Backup Database

```bash
pg_dump -U postgres auditor_db > backup.sql
```

### Restore Database

```bash
psql -U postgres auditor_db < backup.sql
```

### Reset Database

```bash
# Drop and recreate
dropdb -U postgres auditor_db
createdb -U postgres auditor_db

# Reinitialize
cd backend
npm run setup
```

## Performance Considerations

- All foreign keys have indexes for join performance
- UUIDs are used for distributed ID generation
- JSONB type used for flexible condition storage
- Timestamps indexed where frequently queried
- Connection pooling configured in `db.js`

## Version History

- **v1.0** (2025-12-29): Initial schema with WCAG 2.1 support

---

**Database**: PostgreSQL 12+  
**Last Updated**: December 29, 2025
