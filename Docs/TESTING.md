# TESTING.md

## 1. Purpose

Define the testing strategy for the TDS–KTOC compliance application.

The objective is to verify extraction correctness, parameter mapping, unit normalization, comparison logic, API behavior, and preservation of existing functionality.

A successful build alone does not prove that engineering comparisons are correct.

## 2. Testing Principles

- Test behavior, not implementation details.
- Keep tests deterministic.
- Use synthetic or authorized test data.
- Test edge cases and failure paths.
- Do not weaken tests merely to make a change pass.
- Avoid unnecessary test frameworks or elaborate test infrastructure.
- Preserve existing tests unless their expected behavior has legitimately changed.
- Every bug fix should include a regression test when practical.

## 3. Testing Layers

### 3.1 Unit tests

Test individual functions in isolation.

Required areas include:

- Alias normalization and lookup.
- Canonical parameter mapping.
- Numeric parsing.
- Unit conversion.
- Tolerance evaluation.
- Comparison status determination.
- Error classification.
- Report formatting.

Unit tests should be fast and independent of external services.

### 3.2 Parser tests

Test Excel and PDF extraction independently from the comparison engine.

Cover:

- Valid documents.
- Missing expected sheets, tables, or fields.
- Empty documents.
- Corrupt documents.
- Unexpected layouts.
- Different supported formatting patterns.
- Invalid numeric values.
- Missing units.
- Repeated or ambiguous parameter labels.
- Source-location preservation.

Use small, synthetic fixtures that exercise specific cases.

### 3.3 API tests

Test:

- Successful upload of both required documents.
- Missing upload fields.
- Unsupported file types.
- Oversized files.
- Invalid multipart requests.
- Corrupt documents.
- Unprocessable content.
- Structured error responses.
- Correlation IDs.
- Unexpected internal errors.
- Cleanup after success and failure.

Verify the response status and response schema, not merely whether a request returns a response.

### 3.4 Frontend tests

Test important user-visible behavior:

- Both files are required.
- Invalid files produce understandable errors.
- Processing states are displayed correctly.
- Results show the correct status.
- Review-required results are not displayed as matches.
- A new comparison does not display stale results.
- Source references are displayed when available.
- API errors are handled gracefully.

Avoid testing purely decorative details unless they affect functionality or accessibility.

### 3.5 Integration tests

Verify the full flow using synthetic TDS and KTOC documents:

1. Upload documents.
2. Validate inputs.
3. Extract parameters.
4. Map canonical identifiers.
5. Normalize values.
6. Compare results.
7. Return structured results.
8. Confirm source traceability.
9. Verify cleanup.

Keep integration tests small enough to diagnose failures.

## 4. Core Comparison Test Matrix

| Scenario | Expected behavior |
|---|---|
| Same parameter and equivalent values | `MATCH` |
| Same parameter with different values outside approved tolerance | `MISMATCH` |
| Parameter absent from TDS | `MISSING_IN_TDS` |
| Parameter absent from KTOC | `MISSING_IN_KTOC` |
| Unknown parameter label | `REVIEW_REQUIRED` |
| Ambiguous alias | `REVIEW_REQUIRED` |
| Unknown or incompatible unit | `NOT_COMPARABLE` |
| Extraction failed | Warning or failure state as appropriate; never an automatic match |
| Invalid document | Appropriate request or processing error |
| Equivalent supported units | Match after normalization |
| Values at the approved tolerance boundary | Result follows the documented boundary rule |

The final two cases must use actual approved conversion and tolerance rules. Do not invent numeric thresholds for tests.

## 5. Regression Testing

Before changing existing functionality:

1. Identify relevant tests.
2. Run the narrowest useful test set.
3. Implement the change.
4. Run those tests again.
5. Run broader checks when the change affects shared modules or contracts.

When fixing a defect, create a test that reproduces the defect before or alongside the fix when practical.

## 6. Test Data

- Prefer small synthetic Excel workbooks and PDFs.
- Do not commit confidential customer documents.
- Do not copy production values into public fixtures without authorization.
- Keep fixtures focused on a specific behavior.
- Document any special fixture assumptions.
- Avoid large fixture collections that duplicate the same test case.

## 7. Test Naming

Use descriptive names that state the behavior being verified.

Examples:

- `mapsApprovedCarWidthAlias`
- `rejectsUnknownUnit`
- `returnsReviewRequiredForAmbiguousAlias`
- `preservesExcelCellReference`
- `doesNotTreatExtractionFailureAsMatch`

Adapt naming conventions to the existing testing framework.

## 8. Commands

Document the actual test commands once the project setup exists.

Expected categories may include:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

These are placeholders for anticipated scripts, not a guarantee that they already exist. Do not add fake package scripts simply to match this document.

## 9. Completion Criteria

A task is test-complete when:

- Relevant tests have been executed where the environment permits.
- New behavior has appropriate tests.
- Existing tests have not been silently removed or weakened.
- Relevant type checks, linting, or build checks have been performed.
- Failures and unexecuted checks are reported honestly.
- The changelog and relevant documentation have been updated.

## 10. Critical Rule

**Never claim that a comparison feature is correct solely because the application compiles or the API returns HTTP 200.**