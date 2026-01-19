# API Documentation

Complete API reference for the WCAG Auditor backend.

**Base URL**: `http://localhost:3001/api`

## Table of Contents

- [Health Check](#health-check)
- [Audits](#audits)
- [Conditions](#conditions)
- [Results](#results)
- [Findings](#findings)
- [Reports](#reports)

---

## Health Check

### GET /health

Check server and database status.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-12-29T10:00:00.000Z",
  "uptime": 120.5,
  "environment": "development",
  "database": "connected"
}
```

---

## Audits

### POST /api/audits/start

Start a new audit for a page or resume an existing one.

**Request Body**:
```json
{
  "domain": "example.com",
  "page_url": "https://example.com/page",
  "page_name": "Homepage"
}
```

**Response** (201 Created):
```json
{
  "page_audit_id": "550e8400-e29b-41d4-a716-446655440000",
  "page_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Response** (Existing audit):
```json
{
  "page_audit_id":   "550e8400-e29b-41d4-a716-446655440000",
  "page_id": "660e8400-e29b-41d4-a716-446655440001",
  "message": "Resumed existing audit"
}
```

**Errors**:
- `400`: Missing required fields (domain, page_url)

---

### GET /api/audits

Fetch all audits with page information.

**Response** (200 OK):
```json
[
  {
    "page_audit_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "in_progress",
    "score": 85,
    "wcag_version": "2.1",
    "audited_by": "John Doe",
    "started_at": "2025-12-29T10:00:00.000Z",
    "completed_at": null,
    "domain": "example.com",
    "page_url": "https://example.com/page",
    "page_name": "Homepage"
  }
]
```

---

## Conditions

### GET /api/conditions

Fetch all active WCAG success criteria.

**Response** (200 OK):
```json
[
  {
    "condition_id": "770e8400-e29b-41d4-a716-446655440000",
    "sc_id": "1.1.1",
    "condition_text": "All non-text content has a text alternative",
    "condition_type": "manual",
    "axe_rule_id": "rule-id-1, rule-id-2",
    "default_checked": false,
    "is_active": true,
    "created_at": "2025-12-29T10:00:00.000Z"
  }
]
```

---

## Results

### POST /api/results

Submit or update result for a WCAG success criterion.

**Request Body**:
```json
{
  "page_audit_id": "550e8400-e29b-41d4-a716-446655440000",
  "sc_id": "1.1.1",
  "result": "pass",
  "checked_conditions": {
    "condition_1": {
      "status": "pass",
      "tag": "manual"
    }
  },
  "notes": "All images have appropriate alt text"
}
```

**Valid result values**: `pass`, `fail`, `na`, `pending`

**Response** (200 OK):
```json
{
  "success": true,
  "result_id": "880e8400-e29b-41d4-a716-446655440000"
}
```

**Errors**:
- `400`: Missing required fields or invalid result value

---

### GET /api/results/audit/:page_audit_id

Fetch all results for a specific audit.

**URL Parameters**:
- `page_audit_id` (UUID): Audit ID

**Response** (200 OK):
```json
[
  {
    "result_id": "880e8400-e29b-41d4-a716-446655440000",
    "page_audit_id": "550e8400-e29b-41d4-a716-446655440000",
    "sc_id": "1.1.1",
    "result": "pass",
    "checked_conditions": { },
    "notes": "All images have alt text",
    "reviewed_at": "2025-12-29T11:00:00.000Z"
  }
]
```

---

### GET /api/results/audit/:page_audit_id/sc/:sc_id

Fetch a specific result for an audit and success criterion.

**URL Parameters**:
- `page_audit_id` (UUID): Audit ID
- `sc_id` (string): Success criterion ID (e.g., "1.1.1")

**Response** (200 OK): Same as individual result object above

**Errors**:
- `404`: Result not found

---

### GET /api/results/:result_id

Fetch a specific result with associated findings.

**URL Parameters**:
- `result_id` (UUID): Result ID

**Response** (200 OK):
```json
{
  "result_id": "880e8400-e29b-41d4-a716-446655440000",
  "page_audit_id": "550e8400-e29b-41d4-a716-446655440000",
  "sc_id": "1.1.1",
  "result": "fail",
  "checked_conditions": {},
  "notes": "Several images missing alt text",
  "reviewed_at": "2025-12-29T11:00:00.000Z",
  "findings": [
    {
      "finding_id": "990e8400-e29b-41d4-a716-446655440000",
      "severity": "Serious",
      "description": "Product image missing alt attribute"
    }
  ]
}
```

**Errors**:
- `404`: Result not found

---

### DELETE /api/results/:result_id

Delete a result and all associated findings.

**URL Parameters**:
- `result_id` (UUID): Result ID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Result and associated findings deleted successfully"
}
```

**Errors**:
- `404`: Result not found

---

## Findings

### POST /api/findings

Create a new accessibility finding.

**Request Body**:
```json
{
  "result_id": "880e8400-e29b-41d4-a716-446655440000",
  "severity": "Serious",
  "description": "Product image is missing alt attribute, preventing screen reader users from understanding content",
  "selector": "img.product-image",
  "html_snippet": "<img class=\"product-image\" src=\"product.jpg\">"
}
```

**Valid severity values**: `Critical`, `Serious`, `Moderate`, `Minor`

**Response** (201 Created):
```json
{
  "finding_id": "990e8400-e29b-41d4-a716-446655440000",
  "result_id": "880e8400-e29b-41d4-a716-446655440000",
  "severity": "Serious",
  "description": "Product image is missing alt attribute...",
  "selector": "img.product-image",
  "html_snippet": "<img class=\"product-image\" src=\"product.jpg\">",
  "created_at": "2025-12-29T12:00:00.000Z"
}
```

**Errors**:
- `400`: Missing required fields or invalid severity
- `404`: Associated result not found

---

### GET /api/findings/result/:result_id

Fetch all findings for a specific result.

**URL Parameters**:
- `result_id` (UUID): Result ID

**Response** (200 OK):
```json
[
  {
    "finding_id": "990e8400-e29b-41d4-a716-446655440000",
    "result_id": "880e8400-e29b-41d4-a716-446655440000",
    "severity": "Serious",
    "description": "Product image missing alt attribute",
    "selector": "img.product-image",
    "html_snippet": "<img class=\"product-image\" src=\"product.jpg\">",
    "created_at": "2025-12-29T12:00:00.000Z"
  }
]
```

---

### GET /api/findings/:finding_id

Fetch a specific finding with result details.

**URL Parameters**:
- `finding_id` (UUID): Finding ID

**Response** (200 OK):
```json
{
  "finding_id": "990e8400-e29b-41d4-a716-446655440000",
  "result_id": "880e8400-e29b-41d4-a716-446655440000",
  "severity": "Serious",
  "description": "Product image missing alt attribute",
  "selector": "img.product-image",
  "html_snippet": "<img>",
  "created_at": "2025-12-29T12:00:00.000Z",
  "sc_id": "1.1.1",
  "sc_result": "fail"
}
```

**Errors**:
- `404`: Finding not found

---

### PUT /api/findings/:finding_id

Update an existing finding.

**URL Parameters**:
- `finding_id` (UUID): Finding ID

**Request Body** (all fields optional):
```json
{
  "severity": "Critical",
  "description": "Updated description",
  "selector": "img.new-selector",
  "html_snippet": "<img>"
}
```

**Response** (200 OK): Updated finding object

**Errors**:
- `400`: Invalid severity or no fields to update
- `404`: Finding not found

---

### DELETE /api/findings/:finding_id

Delete a finding.

**URL Parameters**:
- `finding_id` (UUID): Finding ID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Finding deleted successfully"
}
```

**Errors**:
- `404`: Finding not found

---

## Reports

### POST /api/reports/generate

Generate or update compliance report for an audit.

**Request Body**:
```json
{
  "page_audit_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response** (200 OK):
```json
{
  "report_id": "aa0e8400-e29b-41d4-a716-446655440000",
  "page_audit_id": "550e8400-e29b-41d4-a716-446655440000",
  "domain": "example.com",
  "page_name": "Homepage",
  "page_url": "https://example.com/page",
  "audit_status": "completed",
  "audit_score": 85,
  "completed_at": "2025-12-29T15:00:00.000Z",
  "pass_count": 35,
  "fail_count": 5,
  "na_count": 10,
  "pending_count": 0,
  "compliance_percentage": "87.50",
  "generated_at": "2025-12-29T15:30:00.000Z"
}
```

**Errors**:
- `400`: Missing page_audit_id
- `404`: Audit not found

---

### GET /api/reports/audit/:page_audit_id

Fetch report for a specific audit.

**URL Parameters**:
- `page_audit_id` (UUID): Audit ID

**Response** (200 OK): Same as report generation response

**Errors**:
- `404`: Report not found (generate first)

---

### GET /api/reports

Fetch all reports with pagination.

**Query Parameters**:
- `limit` (number, default: 50): Maximum reports to return
- `offset` (number, default: 0): Number of reports to skip

**Response** (200 OK):
```json
{
  "reports": [ /* array of report objects */ ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

---

### GET /api/reports/:report_id

Fetch a specific report by ID.

**URL Parameters**:
- `report_id` (UUID): Report ID

**Response** (200 OK): Report object

**Errors**:
- `404`: Report not found

---

### PUT /api/reports/:report_id

Update report metadata.

**URL Parameters**:
- `report_id` (UUID): Report ID

**Request Body** (all fields optional):
```json
{
  "compliance_percentage": 90.5,
  "audit_score": 90
}
```

**Response** (200 OK): Updated report object

**Errors**:
- `400`: No fields to update
- `404`: Report not found

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Specific error message"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

In development mode, error responses include additional details like stack traces.

---

## Examples

### Complete Audit Workflow

```javascript
// 1. Start an audit
const auditRes = await fetch('http://localhost:3001/api/audits/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    domain: 'example.com',
    page_url: 'https://example.com',
    page_name: 'Homepage'
  })
});
const { page_audit_id } = await auditRes.json();

// 2. Submit a result
await fetch('http://localhost:3001/api/results', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    page_audit_id,
    sc_id: '1.1.1',
    result: 'fail',
    notes: 'Images missing alt text'
  })
});

// 3. Add a finding
await fetch('http://localhost:3001/api/findings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    result_id: '<result_id>',
    severity: 'Serious',
    description: 'Product image missing alt attribute',
    selector: 'img.product'
  })
});

// 4. Generate report
await fetch('http://localhost:3001/api/reports/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ page_audit_id })
});
```

---

**Last Updated**: December 29, 2025
