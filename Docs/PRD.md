# KONE TDS–KTOC Compliance Checker

**Product Requirements Document (PRD)**

| Attribute | Details |
|---|---|
| Project Name | KONE TDS–KTOC & Drawing Compliance Checker |
| Document Version | 2.0 |
| Status | Active — Expanded Full-Lifecycle Compliance Scope |
| Product Type | Offline internal engineering compliance tool |
| Primary Objective | Verify consistency across TDS, KTOC order forms, Supply-Line AutoCAD group PDFs, and Customer-Approved drawings (including MS2 material-order impact gating) |
| Input Formats | Excel (`.xlsx`, `.xls`) and PDF (`.pdf` — vector CAD, Adobe text edits, and scanned/handwritten customer markups) |
| Architecture | Offline local modular monolith (Zero third-party cloud APIs) |
| Persistence | No database in MVP |
| Primary Users | Authorized KONE engineering and process-improvement personnel |

---

## 1. Product Overview

### 1.1 Problem Statement

Customer-provided Technical Data Sheets (TDS) contain elevator specifications using customer-facing terminology. KONE's KTOC order form, generated through its ERP system and provided to the supply line, contains corresponding technical specifications that may use different terminology or internal nomenclature.

Manually comparing these documents is time-consuming and susceptible to human error. Differences in terminology, unit representation, formatting, and document layout make direct comparison difficult.

A parameter may be present in both documents but remain undetected as equivalent because its labels differ. Conversely, two similar-looking labels may refer to different technical parameters.

The proposed application will automate the extraction, normalization, mapping, and comparison of relevant elevator specifications from both documents.

### 1.2 Proposed Solution

Build a lightweight document-processing application that accepts:

1. A customer Technical Data Sheet in Excel format.
2. A KONE KTOC order form in PDF format.

The application will extract relevant specifications, map equivalent terminology to canonical parameter identifiers, normalize supported units and values, and compare the results.

The application will present matching specifications, discrepancies, missing parameters, and uncertain mappings in a structured report that allows a human reviewer to verify the results against the source documents.

### 1.3 Product Goal

Reduce manual comparison effort and improve the consistency, traceability, and reliability of technical specification checks before an order proceeds to the supply line.

The application is a decision-support tool. It does not independently authorize an order or replace KONE's established engineering approval processes.

---

## 2. Objectives and Success Criteria

### 2.1 Primary Objectives

- Automate extraction of supported technical specifications from Excel and PDF documents.
- Map differing nomenclature to a common internal parameter model.
- Compare equivalent parameters using deterministic comparison rules.
- Detect mismatched values and parameters missing from either document.
- Display original values, normalized values, and source references.
- Identify ambiguous mappings and extraction failures instead of silently guessing.
- Produce a report that a human reviewer can use to investigate discrepancies.

### 2.2 MVP Success Criteria

The following are initial engineering targets and must be validated against a representative document test set.

| Metric | Initial Target |
|---|---|
| Correct parameter extraction | At least 95% on the agreed supported-parameter test set |
| Correct nomenclature mapping | At least 98% on an independently labelled mapping test set |
| Comparison classification accuracy | 100% on deterministic, explicitly defined unit and comparison test cases |
| Silent incorrect matches | Zero in the approved acceptance test suite |
| Source traceability | Every extracted comparison result includes its source location where available |
| Error handling | Invalid, unsupported, and unreadable files produce actionable errors |
| Data persistence | No permanent storage of uploaded document contents in the MVP |

These targets are not claims about achieved performance. Extraction and mapping metrics must be measured separately. Test sets should include known matches, deliberate mismatches, ambiguous labels, missing fields, and malformed input.

For safety-critical or order-critical parameters, a high overall accuracy percentage is not sufficient. Such parameters require explicit acceptance criteria and review of false-positive compliance results.

---

## 3. Scope

### 3.1 In Scope

**Workflow 1 (Baseline Implemented): TDS ↔ KTOC Order Form**
- Upload one Excel TDS and one KTOC PDF per comparison.
- Validate file extensions, file sizes, and basic file readability.
- Parse supported Excel workbook structures and KTOC order PDFs.
- Normalize parameter names, values, and supported units.
- Map customer-facing terminology dynamically without hardcoded project aliases.
- Compare corresponding parameters (`MATCH`, `MISMATCH`, `MISSING_IN_TDS`, `MISSING_IN_KTOC`, `REVIEW_REQUIRED`, `NOT_COMPARABLE`).
- Display a summary and a detailed comparison table with Excel sheet/cell and PDF page traceability.
- Allow the user to download/export a comparison report.

**Workflow 2 (Top Priority Next Scope): Supply-Line Drawing PDF ↔ Customer-Approved Drawing PDF ("Red-Pen Checklist & MS2 Gate")**
- Upload Rev 1 Supply-Line Drawing PDF(s) (per elevator group) and the corresponding Customer-Approved / Commented Drawing PDF(s).
- Handle both re-saved Adobe text-edited PDFs and printed, handwritten, and scanned customer returns.
- Tolerate asymmetric local layout adjustments (shifted views left/right, resized panels, updated abbreviation/revision tables and dates) via region/sheet-anchored comparison rather than naive whole-page pixel diffing.
- Dynamically parse sheet structures (`G-SHEET`, `I-SHEET`, `LAYOUT_A_B`, and `FLOOR_CHART` including both combined charts and split-stop columns for subset lifts).
- Output a per-group, per-elevator structured discrepancy / red-pen checklist with source sheet/page/lift traceability and cropped visual evidence.
- Classify every discrepancy or markup under the Milestone 2 (`MS2` / `MS2D`) gate: `SUPPLY_LINE_IMPACT`, `LOCAL_CONSTRUCTION_ONLY`, or `REQUIRES_ENGINEERING_REVIEW`.

**Workflow 3 (Planned Next Scope): KTOC Order Form ↔ Supply-Line AutoCAD Drawing PDFs**
- Upload one KTOC PDF and one or more multi-page AutoCAD Group PDFs (e.g., passenger, service, fire groups per tower).
- Extract CAD nomenclature (`SH`, `PH`, `CH`, `BB`, `DD`, `WW`, `WD`, `LL`, `HH`, front wall, false ceiling, handrail codes, finishes, fixture codes) and floor-stop matrices.
- Compare drawing specifications deterministically against agreed KTOC order parameters, dynamically aligning groups and elevator IDs.

**Cross-Cutting Controls**
- Operate **100% locally and offline** using free, open-source tools on CPU-only engineering workstations (~30% free RAM of 16 GB).
- Log processing events, warnings, and errors without exposing confidential document data.
- Clean up temporary files after processing or session termination.

### 3.2 Out of Scope

The application will not implement:

- **Any third-party cloud APIs, external LLMs, or cloud OCR** (e.g., Groq, Gemini, OpenAI) — strictly forbidden by corporate confidentiality & IT policy (`DEC-009`).
- Mandatory runtime dependence on GPU-heavy or large local LLMs that exceed CPU-only / limited-RAM workstation capacity.
- Automated `.dwg` CAD file parsing (customer returns are always PDFs; PDF ↔ PDF is the unified format).
- Automatic drawing/overlay of red-pen annotations onto output PDF files in the initial release (deferred until discrepancy detection accuracy is proven).
- User registration, authentication, authorization, or role management.
- A database or persistent order repository.
- ERP integration or direct access to KTOC.
- Automatic order modification, MS2 release punching, or supply-line submission.
- Multi-user collaboration or concurrent review workflows.
- Automated email notifications.

### 3.3 Scope Principle

Implement the smallest reliable workflow that solves the comparison problem. Additional features must be justified by a demonstrated requirement, not added merely because a full-scale enterprise application normally has them.

---

## 4. Target Users and Primary Use Case

### 4.1 Target Users

**Primary user:** An authorized KONE engineering or process-improvement employee responsible for verifying customer requirements against the ERP-generated order specifications.

**Secondary user:** An engineering reviewer who investigates discrepancies and confirms whether flagged differences require corrective action.

### 4.2 Primary User Journey

1. The user opens the application.
2. The user uploads the customer TDS Excel file.
3. The user uploads the KTOC order form PDF.
4. The application validates both files.
5. The application extracts the supported technical parameters.
6. The application maps source labels to canonical parameter identifiers.
7. The application normalizes values and units.
8. The comparison engine evaluates corresponding parameters.
9. The application displays matching values, discrepancies, missing parameters, and review-required cases.
10. The user inspects source references and verifies relevant findings.
11. The user downloads the comparison report.
12. Temporary document data is cleaned up according to the application's retention policy.

If any required processing stage fails, the application must communicate the failure and avoid presenting an incomplete result as a complete compliance check.

---

## 5. Functional Requirements

### FR-01: Document Upload

The application must accept exactly one TDS workbook and one KTOC order form per comparison run.

**Requirements:**

- Support `.xlsx` for the TDS.
- Support `.pdf` for the KTOC order form.
- Display the selected filename and upload status.
- Allow the user to replace an uploaded document before starting the comparison.
- Validate that both required documents are present.
- Reject unsupported file types and empty files.
- Apply configurable upload size limits.
- Handle corrupt, encrypted, or unreadable documents gracefully.

**Acceptance criteria:**

- The user cannot start a comparison without both required documents.
- Unsupported formats are rejected with an understandable error.
- An invalid document does not produce a successful comparison report.
- The application does not trust a filename extension as the sole file-validation mechanism.

### FR-02: Excel TDS Extraction

The application must extract supported technical specifications from the uploaded Excel workbook.

**Requirements:**

- Inspect workbook sheets and identify relevant data structures.
- Support agreed worksheet layouts, including supported tables and key-value arrangements.
- Extract parameter labels, values, units, and source locations where available.
- Handle empty cells and irrelevant worksheet content.
- Preserve raw values alongside parsed values.
- Detect duplicate or conflicting occurrences of the same parameter.
- Report unsupported workbook layouts rather than silently ignoring required information.

**Acceptance criteria:**

- Each extracted parameter retains its original label and source location.
- Blank values are not interpreted as numeric zero.
- Conflicting values are surfaced for review.
- Formula-derived values are handled according to an explicitly defined formula and cached-value policy.
- Extraction failures are distinguishable from genuinely missing specifications.

### FR-03: KTOC PDF Extraction

The application must extract supported specifications from the KTOC order form.

**Requirements:**

- Extract text from text-based PDFs.
- Identify relevant labels and associated values.
- Preserve PDF page references for extracted parameters.
- Support the specific table layouts and text patterns found in the approved KTOC samples.
- Detect missing, repeated, or ambiguous values.
- Identify scanned or image-based pages that cannot be processed reliably by the selected extraction method.
- Provide a clear error or review-required result when extraction confidence is insufficient.

**Acceptance criteria:**

- Extracted values retain their original labels and page references.
- Values are not assigned to a parameter solely because they appear near a similar label.
- An unreadable or unsupported page cannot silently result in a passing comparison.
- PDF extraction logic is independently testable using representative KTOC fixtures.

### FR-04: Canonical Parameter Mapping

The application must map source-specific nomenclature to a common internal representation.

**Requirements:**

- Assign a stable canonical identifier to every supported technical parameter.
- Maintain explicit mappings for known customer and KONE labels.
- Normalize harmless differences in case, whitespace, and punctuation.
- Support deterministic alias matching.
- Preserve the original source labels.
- Detect ambiguous mappings and avoid arbitrary selection.
- Record the mapping method and mapping rule version.
- Keep the mapping dictionary separate from the comparison engine.

**Example:**

The following labels are illustrative only and must be verified against real TDS and KTOC documents before being treated as valid mappings.

| Source Label | Canonical Identifier |
|---|---|
| Car Width | `car_width` |
| Cabin Width | `car_width` |
| Car Depth | `car_depth` |
| Cabin Depth | `car_depth` |
| Door Opening Width | `door_opening_width` |
| Shaft Width | `shaft_width` |

The canonical identifiers above represent different concepts. For example, `car_width` must not be treated as equivalent to `shaft_width` merely because both are dimensions expressed in millimetres.

**Acceptance criteria:**

- Known aliases map to their approved canonical identifiers.
- Unknown labels are classified as unmapped.
- Multiple plausible mappings result in review-required status.
- No uncertain mapping can independently produce a confirmed compliance match.

### FR-05: Value and Unit Normalization

The application must convert supported source values into comparable representations.

**Requirements:**

- Parse supported numeric values.
- Normalize supported unit representations.
- Convert compatible units to an agreed canonical unit.
- Handle formatting differences such as spaces, decimal separators, and thousands separators where their meaning is unambiguous.
- Preserve raw values for auditing.
- Distinguish numeric values from textual or categorical values.
- Handle missing, invalid, and unsupported units explicitly.
- Apply parameter-specific comparison tolerances only when approved and configured.

**Acceptance criteria:**

- Equivalent values expressed in supported units compare correctly after conversion.
- Incompatible or unknown units are not silently compared.
- Rounding and tolerance rules are deterministic.
- The report includes both the original value and the normalized value when relevant.

### FR-06: Comparison Engine

The application must compare canonical parameters extracted from the two documents.

**Requirements:**

- Compare parameters by canonical identifier.
- Compare normalized values using parameter-specific rules.
- Identify conflicting duplicate values within a document.
- Distinguish a missing parameter from an extraction failure.
- Avoid treating a failed mapping as a valid mismatch or match.
- Keep comparison rules independent of the user interface and document parsers.
- Produce a structured result for every comparison decision.

**Comparison statuses:**

| Status | Meaning |
|---|---|
| `MATCH` | The mapped parameters agree under the applicable comparison rule |
| `MISMATCH` | The parameters correspond, but their values do not satisfy the comparison rule |
| `MISSING_IN_TDS` | The parameter is found in KTOC but not reliably found in the TDS |
| `MISSING_IN_KTOC` | The parameter is found in the TDS but not reliably found in KTOC |
| `REVIEW_REQUIRED` | Mapping, extraction, units, or source values are ambiguous |
| `NOT_COMPARABLE` | The parameter exists, but no valid comparison rule is available |

A parameter that cannot be extracted reliably must be classified separately from a confirmed missing parameter. The implementation may introduce additional extraction-error statuses where needed.

**Acceptance criteria:**

- Each supported parameter pair receives a deterministic classification.
- The classification can be reproduced from the same extracted inputs, mapping rules, and comparison configuration.
- A missing value never defaults to zero.
- An ambiguous or invalid comparison never defaults to `MATCH`.

### FR-07: Comparison Report UI

The application must display the results in a readable, review-oriented interface.

**Requirements:**

- Display an overall summary of the comparison.
- Display counts of matching, mismatching, missing, and review-required parameters.
- Show TDS and KTOC source labels and values side by side.
- Show normalized values and units where relevant.
- Display source locations.
- Allow filtering by comparison status.
- Visually distinguish confirmed matches from discrepancies and unresolved cases.
- Display processing warnings and incomplete-extraction indicators.
- Make the meaning of every status clear to the user.

**Suggested table structure:**

| Parameter | TDS Value | KTOC Value | Status | Source |
|---|---|---|---|---|
| Car Width | Extracted value | Extracted value | MATCH / MISMATCH | Sheet/cell and PDF page |
| Door Opening Width | Extracted value | Extracted value | REVIEW_REQUIRED | Source references |
| Shaft Width | Extracted value | Missing | MISSING_IN_KTOC | Source references |

The table above is illustrative. Actual values and parameter coverage will be determined after inspecting the supplied documents.

**Acceptance criteria:**

- Users can identify discrepancies without opening every row individually.
- Every displayed result links back to available source references.
- Incomplete extraction is visible and cannot be mistaken for successful full-document verification.

### FR-08: Report Export

The application must allow users to download a comparison report.

**Requirements:**

- Export the structured comparison results in a practical format, such as Excel or CSV.
- Include parameter identifiers, original labels, original values, normalized values, statuses, and source references.
- Include unresolved cases and extraction warnings.
- Include the comparison timestamp and mapping-rule version.
- Avoid including unnecessary document contents or sensitive information in the report.
- Ensure exported results match the results displayed in the application.

**Acceptance criteria:**

- The exported report preserves the comparison classifications.
- Users can distinguish confirmed results from unresolved findings.
- Export generation failures are reported explicitly.

### FR-09: Temporary File Handling

The application must avoid unnecessary persistence of uploaded documents.

**Requirements:**

- Process documents using temporary storage or memory where practical.
- Delete temporary files after processing or when the session is terminated.
- Avoid storing document contents in application logs.
- Avoid retaining extracted customer specifications beyond the intended comparison session.
- Document the limits of cleanup on crashes or forced termination.
- Apply KONE's approved handling requirements before processing actual confidential documents.

**Acceptance criteria:**

- No database is required for normal comparison execution.
- Temporary files are cleaned up according to the documented lifecycle.
- Logs do not contain full customer documents or unnecessary sensitive values.

### FR-10: Processing Logs and Error Handling

The application must produce structured operational logs.

**Requirements:**

- Log processing start and completion.
- Log file-validation outcomes.
- Log extraction failures and warnings.
- Log mapping and comparison stage outcomes.
- Assign a correlation identifier to each comparison run.
- Record elapsed time for major processing stages.
- Avoid logging full document contents.
- Provide actionable user-facing errors without exposing internal stack traces.

**Acceptance criteria:**

- Each failed processing run can be investigated using its correlation identifier.
- Logs distinguish extraction, mapping, normalization, and comparison failures.
- A technical failure cannot be misrepresented as a compliant result.

### FR-11: Drawing Group & Sheet Hierarchy Parsing (Workflows 2 & 3)

The application must ingest multi-page AutoCAD-exported elevator group PDFs and customer-returned PDFs without hardcoded page indices or lift-prefix rules.

**Requirements:**

- Support multiple group PDFs per tower (e.g., passenger, service, fire elevator groups).
- Dynamically classify sheets (`G-SHEET`, `I-SHEET`, `LAYOUT_A_B`, `FLOOR_CHART`) from title blocks and headers.
- Parse both unified group floor charts and split/selective-stop floor charts where subsets of elevators skip specific floors.
- Discover elevator identifiers and group names dynamically from document content.

### FR-12: Asymmetric & Scanned Drawing Revision Diff ("Red-Pen Checklist")

The application must compare Rev 1 Supply-Line Drawing PDFs against Customer-Approved Drawing PDFs to enumerate all discrepancies per group and per elevator.

**Requirements:**

- Support vector PDFs, basic Adobe text-edited PDFs, and printed/handwritten/scanned customer PDFs.
- Tolerate local physical drawing adjustments (shifted views left/right, resized views, updated abbreviation tables, revision/date changes) using region-anchored comparison rather than naive full-page pixel matching.
- Detect handwritten/redline markup regions on scanned pages locally on CPU and extract legible text via lightweight offline OCR where possible, falling back to cropped visual region inspection (`REVIEW_REQUIRED`) when handwriting is ambiguous or unreadable.
- Output a per-group, per-elevator discrepancy checklist linking each finding to its sheet, page, elevator(s), and visual/text evidence.

### FR-13: MS2 Material-Order Impact Classification

Every detected change between Supply-Line and Customer-Approved drawings must be evaluated for Milestone 2 (`MS2` / `MS2D`) material-order impact.

**Requirements:**

- Classify each discrepancy as `SUPPLY_LINE_IMPACT` (blocks MS2; notify factory/supply line — e.g., car height `CH`, door/wall finish, button/fixture changes), `LOCAL_CONSTRUCTION_ONLY` (local drawing/site adjustment only; does not alter ordered BOM — e.g., moving landing call station from left to right of door), or `REQUIRES_ENGINEERING_REVIEW` (blocks MS2 until engineer verifies).
- Provide an overall MS2 Readiness Verdict without auto-punching or auto-approving MS2.

### FR-14: KTOC ↔ Supply-Line AutoCAD Drawing Compliance

The application must compare agreed KTOC Order Form specifications against Supply-Line AutoCAD group PDFs.

**Requirements:**

- Parse CAD nomenclature (`SH`, `PH`, `CH`, `BB`, `DD`, `WW`, `WD`, `LL`, `HH`, front wall, false ceiling, handrail codes, finishes) and floor charts.
- Surface code-standard differences (such as IS vs. EN passenger calculations) as explicit review items unless an approved equivalence rule is enabled.

---

## 6. Non-Functional Requirements

### 6.1 Reliability

- Processing stages must fail explicitly.
- Unsupported input must not produce a misleading report.
- The comparison engine must behave deterministically.
- Repeated runs on identical inputs and identical rules must yield identical classifications.

### 6.2 Maintainability

- Separate parsing, mapping, normalization, comparison, reporting, and API logic into independent modules.
- Use explicit TypeScript types for extracted specifications and comparison results.
- Keep business rules out of React components and Express route handlers.
- Maintain automated tests for parsing and comparison logic.
- Version mapping dictionaries and comparison rules.

### 6.3 Performance

The application should provide responsive feedback for normal-sized documents.

Initial performance targets:

- Display upload validation feedback promptly.
- Complete processing of typical supported documents within 10 seconds where practical.
- Handle unusually large or complex files without freezing the interface.
- Enforce file-size and processing limits.

Performance targets must be measured against real document samples before being treated as service guarantees.

### 6.4 Security

- Validate file types, sizes, and readability.
- Treat uploaded files as untrusted input.
- Avoid executing macros, embedded scripts, or arbitrary document content.
- Prevent temporary-file path traversal and unsafe filenames.
- Limit memory and processing resources for malformed or oversized documents.
- Restrict network access and external processing according to organizational policy.
- Do not expose confidential technical specifications through logs, analytics, or external APIs.
- Use only software libraries and deployment environments approved for the intended internal use.

### 6.5 Usability

- The workflow must be understandable without technical training.
- The interface must clearly distinguish confirmed matches from discrepancies and uncertainty.
- Error messages must explain what failed and what the user can do next.
- Users must be able to trace results back to source documents.

---

## 7. Proposed Technical Architecture

The MVP will use a modular monolith. All modules can run within one backend application, with no database or microservice infrastructure.

### 7.1 Logical Processing Pipeline

```text
                  React Frontend
                        |
                        v
                 Express API
                        |
                        v
                Input Validation
                        |
             +----------+----------+
             |                     |
             v                     v
       Excel Parser           PDF Parser
             |                     |
             v                     v
        TDS Extractor         KTOC Extractor
             |                     |
             +----------+----------+
                        |
                        v
             Canonical Mapping Engine
                        |
                        v
              Value Normalization
                        |
                        v
               Comparison Engine
                        |
                        v
              Structured Comparison
                        |
                 +------+------+
                 |             |
                 v             v
             Results UI     Report Export
```

### 7.2 Architectural Principles

- The document parsers must not contain compliance decisions.
- The mapping engine must not silently resolve ambiguous terminology.
- The normalization module must not invent missing units or values.
- The comparison engine must not depend on the frontend.
- The API must return structured results rather than presentation-specific text.
- Report export must use the same structured results displayed by the UI.
- Processing stages must provide enough diagnostic information to investigate failures.

The diagram describes logical modules, not separate deployed services.

---

## 8. Data Model

The MVP will use in-memory data structures and validated TypeScript types.

### 8.1 Extracted Specification

Each extracted specification should contain:

- `canonicalKey`: canonical parameter identifier, if mapping succeeds.
- `sourceLabel`: original label from the source document.
- `rawValue`: original extracted value.
- `normalizedValue`: parsed value, when normalization succeeds.
- `unit`: original or normalized unit, as appropriate.
- `sourceDocument`: `TDS` or `KTOC`.
- `sourceLocation`: worksheet/cell reference or PDF page.
- `mappingMethod`: method used to resolve the label.
- `mappingStatus`: mapping outcome.
- `extractionStatus`: extraction outcome and relevant warnings.

The implementation should use explicit nullable or discriminated types rather than filling unavailable values with arbitrary defaults.

### 8.2 Comparison Result

Each comparison result should contain:

- `canonicalKey`
- `tdsSpecification`
- `ktocSpecification`
- `status`
- `comparisonRule`
- `difference`, where meaningful
- `explanation`
- `sourceReferences`
- `warnings`

The final TypeScript schema will be defined during API design. These fields describe the required concepts, not a finalized wire contract.

### 8.3 Mapping Dictionary

The mapping dictionary should support:

- Canonical parameter identifier.
- Approved aliases.
- Parameter category.
- Expected value type.
- Canonical unit, where applicable.
- Permitted conversion rules.
- Comparison strategy.
- Approved tolerance, if applicable.
- Mapping-rule version.
- Mapping provenance and validation status.

All mappings must be based on verified technical terminology or explicitly approved engineering rules.

---

## 9. API Requirements

The API contract will be finalized in the API Design phase.

The anticipated MVP endpoints are:

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/comparisons` | Accept both documents and initiate a comparison |
| `GET` | `/api/comparisons/:id` | Retrieve a comparison result while it remains available in memory |
| `GET` | `/api/comparisons/:id/report` | Export a completed comparison report |
| `GET` | `/api/health` | Check application health |

The comparison identifier may be an ephemeral identifier used to reference a result during the application's active lifetime. It does not imply database persistence.

For the initial implementation, synchronous processing is preferred if representative files can be handled reliably within the request lifecycle. Background jobs, queues, and polling should be added only if actual performance requirements justify them.

API responses must distinguish:

- Invalid input.
- Unsupported document structures.
- Extraction failures.
- Ambiguous mappings.
- Completed comparisons with discrepancies.
- Successful comparisons with unresolved cases.

A completed comparison containing mismatches is a successful processing operation, not an HTTP or application error.

---

## 10. Logging and Observability Requirements

Structured logs should contain operational metadata such as:

- Timestamp.
- Log level.
- Correlation identifier.
- Processing stage.
- Event type.
- Duration.
- File-validation outcome.
- Extraction warnings.
- Mapping and comparison counts.
- Error category.

Example conceptual log event:

```json
{
  "level": "warn",
  "event": "parameter_mapping_ambiguous",
  "correlationId": "example-run-id",
  "stage": "mapping",
  "parameterKey": null,
  "message": "Multiple canonical mappings require review"
}
```

The example contains no customer specification values. Production logs should follow the same data-minimization principle.

The logging design must not treat a successful HTTP response as proof of compliance. Operational success and technical compliance are separate concepts.

---

## 11. Testing Strategy

### 11.1 Unit Testing

Test each module independently:

- Excel value extraction.
- PDF text extraction.
- Label normalization.
- Alias matching.
- Unit conversion.
- Numeric parsing.
- Tolerance comparison.
- Missing-value handling.
- Duplicate detection.
- Result classification.
- Report serialization.

### 11.2 Integration Testing

Verify that:

- Excel extraction produces valid internal specifications.
- PDF extraction produces valid internal specifications.
- Both outputs pass through the same mapping and normalization pipeline.
- The comparison engine produces the expected results.
- The API returns the correct result schema.
- Exported reports match the displayed comparison results.

### 11.3 Regression Testing

Maintain a controlled test corpus containing representative and, where permitted, sanitized documents.

Each test case should define:

- Expected extracted parameters.
- Expected canonical mappings.
- Expected normalized values.
- Expected comparison statuses.
- Expected source references.
- Known extraction limitations.

When a parser or mapping rule changes, regression tests must detect newly introduced incorrect matches and missed discrepancies.

### 11.4 Essential Edge Cases

- A required parameter appears in only one document.
- The same parameter has different labels across documents.
- Values match after unit conversion.
- Values differ beyond the approved tolerance.
- The same parameter occurs multiple times with conflicting values.
- A parameter label maps to multiple possible canonical identifiers.
- A numeric value has an unknown unit.
- The PDF contains scanned pages.
- The Excel workbook has multiple relevant sheets.
- A value is missing or represented by a nonnumeric symbol.
- A document is encrypted, corrupt, or unsupported.
- Extraction returns incomplete results.
- A user uploads the wrong document type.
- Report generation fails after a successful comparison.

### 11.5 Safety-Critical Test Principle

Tests must emphasize false matches, not just overall accuracy.

A system that correctly identifies 99 ordinary parameters but incorrectly approves one important dimensional discrepancy is not necessarily acceptable. Critical parameter classes must have explicit tests and review requirements.

---

## 12. Acceptance Criteria for MVP Release

The MVP is considered ready for controlled evaluation when all of the following conditions are satisfied:

- [ ] The user can upload one valid TDS Excel file and one valid KTOC PDF.
- [ ] Supported parameters are extracted from both documents.
- [ ] Extracted values retain their source references.
- [ ] Approved aliases map to the correct canonical identifiers.
- [ ] Ambiguous mappings are surfaced for review.
- [ ] Supported units are normalized correctly.
- [ ] The comparison engine classifies known matches and mismatches correctly.
- [ ] Missing parameters are identified in the correct direction.
- [ ] Extraction failures are distinguishable from genuinely missing values.
- [ ] The UI displays results and allows filtering by status.
- [ ] The user can export the comparison report.
- [ ] Logs provide enough information to diagnose failures without exposing unnecessary sensitive data.
- [ ] Temporary document data is handled according to the defined retention policy.
- [ ] Unit, integration, and regression tests pass.
- [ ] The agreed acceptance test corpus meets its documented extraction and mapping targets.
- [ ] The tool does not automatically authorize or release an order.

---

## 13. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| PDF layouts change | Incorrect or incomplete extraction | Template-specific parsing, validation, and regression tests |
| Customer nomenclature is ambiguous | Incorrect parameter mapping | Explicit aliases and review-required classification |
| Units are absent or inconsistent | Invalid comparisons | Unit validation and approved conversion rules |
| Duplicate specifications conflict | Misleading result | Detect duplicates and flag conflicts |
| Extraction silently misses a parameter | False compliance result | Extraction completeness checks and required-parameter validation |
| Scanned PDFs cannot be parsed | Incomplete comparison | Detect scanned pages and establish an approved OCR strategy if needed |
| External processing violates policy | Confidentiality breach | Keep processing local or within an approved environment |
| Mapping rules change over time | Inconsistent results | Version mapping dictionaries and regression-test changes |
| Tolerance rules are incorrectly assumed | Incorrect classification | Obtain approved, parameter-specific comparison requirements |
| Temporary data remains after failure | Confidentiality risk | Explicit cleanup, bounded temporary storage, and operational checks |

---

## 14. Development Phases

### Phase 1: Requirements and Document Analysis

- Obtain representative TDS and KTOC samples.
- Identify workbook sheets, PDF layouts, and extraction patterns.
- Build a verified inventory of supported technical parameters.
- Confirm terminology mappings.
- Identify units, value types, and comparison rules.
- Finalize the PRD and acceptance test cases.

**Deliverable:** Approved PRD and parameter specification inventory.

### Phase 2: API Design

- Define request and response schemas.
- Define comparison status enums.
- Specify validation and error contracts.
- Define report export behavior.
- Define correlation identifiers and result lifetime.

**Deliverable:** API contract and example payloads.

### Phase 3: System Design

- Define module boundaries.
- Select document parsing libraries.
- Design canonical parameter and comparison models.
- Specify the mapping dictionary structure.
- Define temporary file handling and data retention.

**Deliverable:** System design and repository structure.

### Phase 4: Logging and Testing Design

- Define structured log events.
- Define processing failure categories.
- Create test fixtures and expected results.
- Establish regression testing and accuracy measurement.

**Deliverable:** Logging specification and test plan.

### Phase 5: Implementation

Implement in the following order:

1. Project setup and type definitions.
2. Excel extraction.
3. PDF extraction.
4. Canonical parameter mapping.
5. Value normalization.
6. Comparison engine.
7. API endpoints.
8. React upload and results interface.
9. Report export.
10. Logging, cleanup, and error handling.

**Deliverable:** Working end-to-end MVP.

### Phase 6: Validation

- Run the agreed test corpus.
- Measure extraction and mapping accuracy.
- Investigate false matches and missed discrepancies.
- Verify cleanup and logging behavior.
- Conduct controlled review with representative documents.
- Fix critical issues before broader internal evaluation.

**Deliverable:** Tested MVP and validation report.

---

## 15. Definition of Done

A feature is complete only when:

1. Its expected behavior is specified.
2. Its implementation follows the defined module boundaries.
3. Its success and failure paths are handled.
4. Automated tests cover its important cases.
5. Its outputs preserve relevant source traceability.
6. Its logs do not unnecessarily expose confidential information.
7. It does not silently convert uncertain data into a confirmed match.
8. Its behavior is documented where necessary.

The project is complete for MVP purposes when the end-to-end comparison workflow meets the release acceptance criteria and has been validated against the agreed document corpus.

---

## 16. Open Decisions

The following items must be resolved using the actual documents and organizational requirements.

- [ ] Which exact parameters must be compared in the first release?
- [ ] What are the actual customer and KONE labels for each parameter?
- [ ] Are the KTOC PDFs text-based, scanned, or a mixture?
- [ ] Which Excel layouts and worksheet structures must be supported?
- [ ] Which units occur in the source documents?
- [ ] Are tolerances required, and which engineering rules define them?
- [ ] How should conflicting duplicate values be handled?
- [ ] Is OCR required for the initial release?
- [ ] Which local or internally approved software libraries may be used?
- [ ] Should report export support Excel, CSV, or both?
- [ ] What upload size and processing-time limits are appropriate?
- [ ] What document cleanup and retention policy is required?
- [ ] Representative sample project documents (Supply-Line Group PDFs, handwritten/scanned Customer-Approved PDFs, and matching KTOC PDF) to validate sheet layouts and CAD nomenclature.
- [ ] Approved KONE MS2 impact matrix defining which parameter/component categories trigger `SUPPLY_LINE_IMPACT` vs. `LOCAL_CONSTRUCTION_ONLY`.
- [ ] Approved rule for regional code-standard differences (e.g., IS vs. EN passenger count equivalences).
- [ ] Verified local CPU-only OCR library packaging (`RapidOCR` / `Tesseract` / `PyMuPDF`) within KONE workstation RAM limits (~30% free RAM on 16 GB).

No unverified technical mapping or engineering tolerance should be promoted into a production rule merely to make the first version appear complete.

---

## 17. Guiding Engineering Principles

1. **Correctness over apparent completeness:** An unresolved parameter is preferable to an incorrect match.
2. **Deterministic comparison:** The same normalized inputs and rules must produce the same result.
3. **Traceability:** Every result should be explainable using source values, mapping rules, and comparison rules.
4. **Separation of concerns:** Parsing, mapping, normalization, comparison, presentation, and logging must remain independent.
5. **Minimal infrastructure:** No database or distributed architecture unless a demonstrated requirement justifies one.
6. **Human oversight:** The tool assists engineering verification; it does not replace approval authority.
7. **Privacy by design:** Process only what is required and avoid unnecessary document retention.
8. **Test real documents:** The actual TDS and KTOC layouts determine implementation details, not assumptions made during initial planning.

---

**Next engineering artifact:** `API_DESIGN.md`

The API design will translate this PRD into concrete endpoints, request and response schemas, validation rules, error contracts, and comparison result types.
