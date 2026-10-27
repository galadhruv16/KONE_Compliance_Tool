# KONE TDS–KTOC Compliance Checker

# API Design Document

| Attribute | Details |
|---|---|
| Document Version | 1.0 |
| Status | Proposed |
| Backend | Node.js + Express + TypeScript |
| API Style | REST |
| API Version | `/api/v1` |
| Request Format | `multipart/form-data` for document uploads |
| Response Format | JSON |
| Processing Model | Synchronous |
| Persistence | No database |
| Primary Purpose | Extract, normalize, map, and compare technical specifications |

---

# 1. Purpose

This document defines the HTTP API contract for the KONE TDS–KTOC Compliance Checker.

The API accepts a customer Technical Data Sheet (TDS) in Excel format and a KONE KTOC order form in PDF format. It orchestrates document extraction, canonical parameter mapping, value normalization, and comparison, then returns structured results to the frontend.

The API must provide:

- Explicit request and response schemas.
- Server-side input validation.
- Predictable HTTP status codes.
- Structured error responses.
- Parameter-level comparison results.
- Source traceability.
- Report export.
- Processing diagnostics without exposing confidential document contents.

The API must not implement compliance decisions inside route handlers. Those decisions belong to the comparison engine.

---

# 2. API Design Principles

## 2.1 RESTful Resource Structure

The API exposes comparison operations as resources.

A comparison represents the processing of one TDS and one KTOC document.

## 2.2 Stateless Request Handling

The comparison endpoint does not require a user session or database record.

The initial comparison request contains both files and returns the completed result in the same HTTP response.

For report downloads, the backend may retain completed results temporarily in a bounded in-memory cache. This cache is optional and ephemeral, not persistent storage.

## 2.3 Deterministic Responses

Given identical extracted specifications, mapping rules, and comparison rules, the comparison engine must return identical classifications.

Operational metadata, such as timestamps and generated comparison identifiers, may differ between requests.

## 2.4 Separation of Processing and Compliance

A completed request does not imply that the specifications match.

For example:

- HTTP `200 OK` with mismatches means the comparison completed successfully and detected discrepancies.
- HTTP `400 Bad Request` means the request was invalid.
- HTTP `422 Unprocessable Content` means the documents could not be processed sufficiently under the defined contract.

## 2.5 Explicit Uncertainty

The API must distinguish confirmed results from unresolved cases. Ambiguous mappings, unknown units, and extraction failures must never silently become confirmed matches.

---

# 3. Base URL and Versioning

Development base URL:

```text
http://localhost:5000/api/v1
```

The host and port should be configurable through environment variables.

API versioning is included in the URL so future incompatible changes can be introduced without silently breaking existing clients.

---

# 4. Endpoint Overview

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/comparisons` | Upload both documents and execute comparison |
| `GET` | `/comparisons/:comparisonId` | Retrieve a temporarily retained comparison result |
| `GET` | `/comparisons/:comparisonId/report` | Download a report for a retained result |
| `GET` | `/health` | Check application health |

The two retrieval endpoints depend on an optional in-memory result cache. If the application is implemented without that cache, the initial comparison response can contain the full results and the frontend can generate a CSV export locally.

No database is required for either approach.

---

# 5. Endpoint 1: Create a Comparison

## 5.1 Request

```http
POST /api/v1/comparisons
Content-Type: multipart/form-data
```

### Multipart fields

| Field | Type | Required | Description |
|---|---|---|---|
| `tdsFile` | File | Yes | Customer TDS workbook |
| `ktocFile` | File | Yes | KTOC order form PDF |

Example conceptual request:

```text
tdsFile  = customer-tds.xlsx
ktocFile = ktoc-order.pdf
```

The frontend must submit both files in the same request.

### Validation rules

- `tdsFile` must be a supported Excel workbook.
- `ktocFile` must be a supported PDF.
- Both files must be present and non-empty.
- File sizes must remain below configured limits.
- The backend must validate actual file content and readability, not only filename extensions.
- Encrypted, corrupt, or unsupported files must produce explicit errors.
- The application must not execute embedded macros or document scripts.
- Temporary files must be cleaned up on success and failure.

Initial upload size limits should be configurable and finalized after inspecting representative documents.

## 5.2 Processing workflow

The endpoint executes the following pipeline:

1. Validate the multipart request.
2. Parse the Excel workbook.
3. Extract supported TDS parameters.
4. Parse the KTOC PDF.
5. Extract supported KTOC parameters.
6. Map source labels to canonical parameter identifiers.
7. Normalize values and units.
8. Compare corresponding parameters.
9. Construct the summary and detailed result.
10. Return the structured response.
11. Release temporary resources.

If either document cannot be processed at all, the request must not return a normal completed comparison.

If the documents can be processed but some parameters remain unresolved, the response may contain a completed comparison with warnings, provided its limitations are explicitly represented.

## 5.3 Successful Response

HTTP status:

```http
200 OK
Content-Type: application/json
```

Example response:

```json
{
  "success": true,
  "data": {
    "comparisonId": "cmp_example_001",
    "status": "COMPLETED_WITH_WARNINGS",
    "createdAt": "2026-10-27T10:30:00.000Z",
    "summary": {
      "totalParameters": 4,
      "matched": 2,
      "mismatched": 1,
      "missingInTds": 0,
      "missingInKtoc": 0,
      "reviewRequired": 1,
      "notComparable": 0
    },
    "results": [
      {
        "canonicalKey": "car_width",
        "displayName": "Car Width",
        "tds": {
          "sourceLabel": "Cabin Width",
          "rawValue": "1600 mm",
          "normalizedValue": 1600,
          "unit": "mm",
          "source": {
            "document": "TDS",
            "sheetName": "Elevator Details",
            "cellReference": "B12"
          }
        },
        "ktoc": {
          "sourceLabel": "Car Width",
          "rawValue": "1600",
          "normalizedValue": 1600,
          "unit": "mm",
          "source": {
            "document": "KTOC",
            "pageNumber": 2
          }
        },
        "status": "MATCH",
        "difference": 0,
        "explanation": "Normalized values are equal.",
        "warnings": []
      },
      {
        "canonicalKey": "car_depth",
        "displayName": "Car Depth",
        "tds": {
          "sourceLabel": "Cabin Depth",
          "rawValue": "1400 mm",
          "normalizedValue": 1400,
          "unit": "mm",
          "source": {
            "document": "TDS",
            "sheetName": "Elevator Details",
            "cellReference": "B13"
          }
        },
        "ktoc": {
          "sourceLabel": "Car Depth",
          "rawValue": "1350",
          "normalizedValue": 1350,
          "unit": "mm",
          "source": {
            "document": "KTOC",
            "pageNumber": 2
          }
        },
        "status": "MISMATCH",
        "difference": -50,
        "explanation": "The normalized KTOC value differs from the TDS value.",
        "warnings": []
      },
      {
        "canonicalKey": "shaft_width",
        "displayName": "Shaft Width",
        "tds": null,
        "ktoc": {
          "sourceLabel": "Shaft Width",
          "rawValue": "2100 mm",
          "normalizedValue": 2100,
          "unit": "mm",
          "source": {
            "document": "KTOC",
            "pageNumber": 3
          }
        },
        "status": "MISSING_IN_TDS",
        "difference": null,
        "explanation": "The parameter was extracted from KTOC but was not reliably found in the TDS.",
        "warnings": []
      },
      {
        "canonicalKey": "door_opening_width",
        "displayName": "Door Opening Width",
        "tds": {
          "sourceLabel": "Door Width",
          "rawValue": "900 mm",
          "normalizedValue": 900,
          "unit": "mm",
          "source": {
            "document": "TDS",
            "sheetName": "Door Details",
            "cellReference": "C8"
          }
        },
        "ktoc": {
          "sourceLabel": "Opening Width",
          "rawValue": "900",
          "normalizedValue": 900,
          "unit": "mm",
          "source": {
            "document": "KTOC",
            "pageNumber": 4
          }
        },
        "status": "REVIEW_REQUIRED",
        "difference": null,
        "explanation": "The mapping requires verification before the values can be considered equivalent.",
        "warnings": [
          "Ambiguous parameter mapping"
        ]
      }
    ],
    "warnings": [
      "One parameter requires manual review."
    ]
  }
}
```

**Important:** All parameter names, document labels, cell references, and values in this example are illustrative. They are not verified KONE mappings or actual document data.

### Response semantics

- `success` indicates that the API operation completed, not that every parameter is compliant.
- `status` describes the processing outcome.
- `summary` contains counts for the parameter-level results.
- `results` contains one result for each parameter comparison or unresolved finding.
- `warnings` describes relevant limitations.
- `source` provides traceability to the originating document.

### Comparison statuses

| Status | Meaning |
|---|---|
| `MATCH` | Corresponding values satisfy the applicable comparison rule |
| `MISMATCH` | Corresponding values violate the applicable comparison rule |
| `MISSING_IN_TDS` | The parameter is found in KTOC but not reliably found in the TDS |
| `MISSING_IN_KTOC` | The parameter is found in the TDS but not reliably found in KTOC |
| `REVIEW_REQUIRED` | Mapping or source information requires human verification |
| `NOT_COMPARABLE` | No valid comparison can be performed |

The summary counts must be derived from the final result array. They must not be calculated independently using separate logic.

## 5.4 Failure Responses

### Missing file

HTTP `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "code": "MISSING_REQUIRED_FILE",
    "message": "Both TDS and KTOC files are required.",
    "details": {
      "missingFields": ["ktocFile"]
    }
  }
}
```

### Unsupported file type

HTTP `415 Unsupported Media Type`

```json
{
  "success": false,
  "error": {
    "code": "UNSUPPORTED_FILE_TYPE",
    "message": "The uploaded file type is not supported.",
    "details": {
      "field": "tdsFile",
      "expectedFormat": "xlsx"
    }
  }
}
```

### File too large

HTTP `413 Content Too Large`

```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "The uploaded file exceeds the configured size limit.",
    "details": {
      "field": "ktocFile"
    }
  }
}
```

### Document cannot be processed

HTTP `422 Unprocessable Content`

```json
{
  "success": false,
  "error": {
    "code": "DOCUMENT_PROCESSING_FAILED",
    "message": "The KTOC PDF could not be processed.",
    "details": {
      "document": "KTOC",
      "stage": "PDF_EXTRACTION"
    }
  }
}
```

Use `422` when the request is syntactically valid but the document cannot be processed under the supported input contract. Reserve `500 Internal Server Error` for unexpected server-side failures.

---

# 6. Endpoint 2: Retrieve a Comparison

## 6.1 Request

```http
GET /api/v1/comparisons/:comparisonId
```

Example:

```http
GET /api/v1/comparisons/cmp_example_001
```

## 6.2 Purpose

Retrieve a completed comparison from the optional in-memory result cache.

This endpoint is useful if the frontend needs to refresh or navigate back to a result without re-uploading the documents.

## 6.3 Successful Response

HTTP `200 OK`

```json
{
  "success": true,
  "data": {
    "comparisonId": "cmp_example_001",
    "status": "COMPLETED",
    "summary": {
      "totalParameters": 4,
      "matched": 2,
      "mismatched": 1,
      "missingInTds": 0,
      "missingInKtoc": 0,
      "reviewRequired": 1,
      "notComparable": 0
    },
    "results": []
  }
}
```

The `results` array is abbreviated in this example. The actual endpoint must return the complete result schema.

## 6.4 Failure Response

HTTP `404 Not Found`

```json
{
  "success": false,
  "error": {
    "code": "COMPARISON_NOT_FOUND",
    "message": "The comparison does not exist or is no longer available."
  }
}
```

A result may be unavailable because it has expired from memory or because the application restarted.

This endpoint must not imply durable history.

---

# 7. Endpoint 3: Download a Comparison Report

## 7.1 Request

```http
GET /api/v1/comparisons/:comparisonId/report?format=xlsx
```

Supported formats:

- `xlsx`
- `csv`

Example:

```http
GET /api/v1/comparisons/cmp_example_001/report?format=xlsx
```

If no format is provided, `xlsx` may be the default.

## 7.2 Purpose

Generate a downloadable report from the structured results of a completed comparison.

The report generator must consume the same result object used by the frontend. It must not independently extract values or reimplement comparison rules.

## 7.3 Successful Response

For Excel output:

```http
200 OK
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="comparison-report.xlsx"
```

For CSV output:

```http
200 OK
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="comparison-report.csv"
```

## 7.4 Report Contents

The exported report should include:

- Comparison identifier.
- Comparison timestamp.
- Canonical parameter identifier.
- Display name.
- Original TDS label and value.
- Original KTOC label and value.
- Normalized values and units.
- Comparison status.
- Difference, where meaningful.
- Explanation and warnings.
- Excel sheet/cell or PDF page references.
- Mapping-rule version.
- Comparison-rule version.

The report should make unresolved cases distinguishable from confirmed matches.

## 7.5 Failure Responses

- `400 Bad Request`: unsupported export format.
- `404 Not Found`: comparison is unavailable.
- `500 Internal Server Error`: unexpected report-generation failure.

If report generation fails, the original comparison result should remain available for the duration of its retention period.

### Alternative without a backend result cache

If the MVP does not retain results in memory, generate the report in the frontend from the comparison response. In that architecture, the report endpoint can be omitted entirely.

This is the simplest stateless option, but backend-generated reports offer more consistent formatting and centralized report logic.

---

# 8. Endpoint 4: Health Check

## 8.1 Request

```http
GET /api/v1/health
```

## 8.2 Successful Response

HTTP `200 OK`

```json
{
  "success": true,
  "data": {
    "status": "UP",
    "service": "kone-compliance-checker"
  }
}
```

The health endpoint must not expose environment variables, file paths, dependency secrets, or detailed internal configuration.

---

# 9. Error Response Contract

All API errors should use a consistent response structure.

## 9.1 Standard Schema

```typescript
export interface ApiErrorResponse {
  success: false;

  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    correlationId?: string;
  };
}
```

The API should avoid returning raw stack traces or internal exception messages.

## 9.2 HTTP Status Code Policy

| Status | Usage |
|---|---|
| `200 OK` | Comparison completed or report retrieved successfully |
| `400 Bad Request` | Missing fields, malformed request, or invalid parameters |
| `404 Not Found` | Comparison identifier is unavailable |
| `413 Content Too Large` | File exceeds upload limits |
| `415 Unsupported Media Type` | Unsupported input format |
| `422 Unprocessable Content` | Document cannot be processed under the input contract |
| `500 Internal Server Error` | Unexpected internal failure |

A comparison that finds mismatches must not return `400`, `409`, or `500` merely because the specifications differ.

---

# 10. TypeScript API Types

The following types represent the proposed API boundary. They should be shared between the frontend and backend through a common types package or a carefully maintained shared module.

## 10.1 Comparison Status

```typescript
export type ComparisonStatus =
  | "MATCH"
  | "MISMATCH"
  | "MISSING_IN_TDS"
  | "MISSING_IN_KTOC"
  | "REVIEW_REQUIRED"
  | "NOT_COMPARABLE";

export type ProcessingStatus =
  | "COMPLETED"
  | "COMPLETED_WITH_WARNINGS"
  | "FAILED";
```

## 10.2 Source Reference

```typescript
export interface ApiSourceReference {
  document: "TDS" | "KTOC";

  sheetName?: string;
  cellReference?: string;

  pageNumber?: number;
}
```

## 10.3 Parameter Value

```typescript
export interface ApiSpecificationValue {
  sourceLabel: string;
  rawValue: unknown;

  normalizedValue?: number | string | boolean;

  originalUnit?: string;
  normalizedUnit?: string;

  source: ApiSourceReference;
}
```

## 10.4 Comparison Item

```typescript
export interface ApiComparisonItem {
  canonicalKey: string;
  displayName: string;

  tds: ApiSpecificationValue | null;
  ktoc: ApiSpecificationValue | null;

  status: ComparisonStatus;

  difference: number | null;

  explanation: string;
  warnings: string[];
}
```

## 10.5 Comparison Summary

```typescript
export interface ApiComparisonSummary {
  totalParameters: number;

  matched: number;
  mismatched: number;

  missingInTds: number;
  missingInKtoc: number;

  reviewRequired: number;
  notComparable: number;
}
```

## 10.6 Comparison Response

```typescript
export interface ApiComparisonResponse {
  success: true;

  data: {
    comparisonId: string;

    status: ProcessingStatus;
    createdAt: string;

    summary: ApiComparisonSummary;

    results: ApiComparisonItem[];

    warnings: string[];
  };
}
```

These interfaces define the conceptual wire contract. Runtime validation is still required because TypeScript types do not validate incoming HTTP requests or arbitrary JSON at runtime.

---

# 11. Input Validation

Validation must occur before document extraction.

## 11.1 Validation Responsibilities

The backend must validate:

1. Both multipart fields exist.
2. Both values are files.
3. The file size is within configured limits.
4. The Excel input is a readable, supported workbook.
5. The PDF input is a readable, supported PDF.
6. The document structure is compatible with the supported extraction strategy.
7. Parsing does not exceed configured resource limits.

## 11.2 Validation Boundaries

The frontend may validate extensions and display helpful messages, but the backend is authoritative.

The server must not trust:

- File extensions alone.
- User-supplied MIME types alone.
- Client-provided parameter mappings.
- Client-provided comparison statuses.
- Client-provided claims that a document was successfully parsed.

The comparison result must be derived from the server-side processing pipeline.

---

# 12. API Processing and Timeouts

The MVP uses synchronous processing.

This means the client waits for the comparison request to finish.

The implementation should:

- Enforce upload size limits.
- Configure appropriate request and processing timeouts.
- Return a clear error if processing cannot finish within the supported request lifecycle.
- Avoid returning partially calculated results as a completed comparison.
- Record the failing stage in structured logs.
- Ensure temporary files are cleaned up when requests fail or are cancelled.

If representative documents cannot be processed reliably within the synchronous request lifecycle, asynchronous jobs can be considered later. That would require additional job-status endpoints and lifecycle management.

Do not introduce a queue merely because queues exist. The application has not earned one yet.

---

# 13. Correlation IDs and Request Diagnostics

Every comparison request should receive a unique correlation identifier.

The identifier should be:

- Generated by the server or validated according to an explicit policy.
- Included in operational logs.
- Returned in the comparison response metadata or error response.
- Used to connect extraction, mapping, comparison, and reporting events for the same run.

Example:

```json
{
  "success": false,
  "error": {
    "code": "DOCUMENT_PROCESSING_FAILED",
    "message": "The uploaded document could not be processed.",
    "correlationId": "req_example_001"
  }
}
```

Correlation identifiers are diagnostic references, not authentication credentials or authorization mechanisms.

Do not log document contents or unnecessary technical specification values merely to make requests easier to debug.

---

# 14. Security Requirements

- Accept only the required input formats.
- Apply server-side file validation.
- Enforce configurable upload size limits.
- Use safe temporary-file handling.
- Prevent unsafe filenames and path traversal.
- Avoid executing document-embedded code.
- Do not send uploaded documents to unapproved external services.
- Avoid exposing stack traces through the API.
- Clean up temporary data after processing.
- Avoid persistent storage of uploaded documents in the MVP.
- Configure Cross-Origin Resource Sharing (CORS) for the approved frontend origin.
- Keep configuration and secrets out of source control.
- Use approved dependencies and deployment environments.

The API is not an authorization system. If the application is later deployed to a shared internal environment, network access controls and organizational authentication requirements must be addressed separately.

---

# 15. API Testing Strategy

## 15.1 Unit Tests

Test:

- Request validation.
- File-type validation.
- Response serialization.
- Error mapping.
- Summary count calculation.
- Report-format validation.

## 15.2 Integration Tests

Test the complete API using representative documents:

- Valid Excel and PDF.
- Missing TDS.
- Missing KTOC.
- Unsupported file types.
- Corrupt workbook.
- Unreadable PDF.
- Oversized file.
- Valid documents with matching values.
- Valid documents with mismatches.
- Ambiguous mappings.
- Incomplete extraction.
- Report generation failure.
- Expired or unavailable comparison identifiers.

## 15.3 API Invariants

The tests must verify that:

- A mismatch does not cause an HTTP failure.
- An extraction failure is not reported as a confirmed missing parameter.
- A missing parameter is not reported as a match.
- Summary counts agree with the result array.
- Every available result includes source references.
- Report data agrees with the comparison response.
- Unexpected server errors do not leak stack traces.
- Temporary resources are cleaned up after failures.

---

# 16. Definition of Done

The API implementation is complete when:

- [ ] All required routes are implemented.
- [ ] Multipart upload validation is working.
- [ ] The comparison endpoint returns the agreed schema.
- [ ] Error responses follow the standard contract.
- [ ] Comparison statuses are consistent with the comparison engine.
- [ ] Summary counts are derived from the final result set.
- [ ] Source references are included wherever available.
- [ ] Report export works if the backend export route is enabled.
- [ ] In-memory result expiration is implemented if retrieval endpoints are enabled.
- [ ] Correlation IDs are included in diagnostic logs.
- [ ] Invalid and unreadable documents are handled safely.
- [ ] Unit and integration tests pass.
- [ ] No database is required for the normal comparison workflow.

---

# 17. Next Engineering Artifact

**Next: `LOGGING.md`**

The logging design will define structured event schemas, severity levels, correlation IDs, stage-level timing, error categories, and privacy controls.

After that, implementation should begin with request validation and the document extraction modules, using the actual TDS and KTOC files to validate the API contract before expanding the frontend.
