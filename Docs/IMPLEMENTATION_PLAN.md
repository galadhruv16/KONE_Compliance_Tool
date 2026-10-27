# IMPLEMENTATION_PLAN.md

## 1. Purpose

This document defines the implementation order for the TDS–KTOC compliance application.

Build and validate the project incrementally. Each phase must produce a working, testable result before the next phase begins.

Do not implement every phase in one large coding-agent request.

## 2. Working Rules

- Follow `AGENTS.md`.
- Review the relevant documentation before each phase.
- Complete one small, coherent task at a time.
- Do not begin the next phase while the current phase has unresolved critical defects.
- Update `CHANGELOG.md` after every completed feature or meaningful modification.
- Update technical documentation when the design or behavior changes.
- Do not add features merely because a later phase might need them.
- Respect organizational restrictions on runtimes, packages, and document handling.

## Phase 0: Repository and Environment Verification

### Objectives

- Inspect the repository and current Git state.
- Confirm the available runtime and package manager.
- Confirm which dependencies and tools are approved.
- Review all project documents.
- Identify any conflicts between the proposed architecture and the target environment.

### Acceptance criteria

- The repository structure is understood.
- Required documentation exists or missing files are identified.
- Runtime and dependency restrictions are documented.
- No production functionality has been added prematurely.

## Phase 1: Project Skeleton

### Objectives

- Establish the approved frontend and backend structure.
- Configure TypeScript and basic development commands.
- Add only necessary dependencies.
- Establish basic validation and testing conventions.
- Implement a minimal health endpoint if appropriate.

### Acceptance criteria

- The application builds.
- The backend starts.
- The health endpoint behaves as documented.
- Basic tests, type checking, and linting work where configured.
- No document-processing or comparison framework has been added prematurely.

## Phase 2: Canonical Data Model & Intermediate Evidence

### Objectives

- Define the normalized representation of an extracted parameter (`ExtractedEvidence`).
- Define source-reference structures (sheet, cell address, column header, page, section).
- Define comparison result types, elevator grouping, and statuses.
- Define Groq provider interface (`IGroqProvider`) and Zod validation schemas.
- Implement hermetic `MockGroqProvider` for test isolation.

### Acceptance criteria

- Types reflect `DOMAIN_RULES.md` and `API_DESIGN.md`.
- Source traceability can be preserved to the cell/page level.
- Missing, invalid, ambiguous, and incomparable values are distinguishable.
- Provider abstraction permits switching between Mock and real Groq without code churn.
- No arbitrary engineering tolerances or unapproved aliases are introduced.

## Phase 3: Excel TDS Extraction (exceljs)

### Objectives

- Accept supported Excel workbook formats (`.xlsx`).
- Validate the uploaded workbook worksheets (`1.1_PL-FL-01`, etc.).
- Extract parameters preserving sheet names and cell coordinates.
- Separate requirement columns from supplier confirmations and comments.
- Preserve contextual headers and units.

### Acceptance criteria

- Cell references (e.g. `B14`) and sheet names are stored with extracted evidence.
- Supplier notes or MEP comments are tagged and not conflated with customer baseline requirements.
- Parsing failures yield descriptive errors rather than silent data loss.

## Phase 4: PDF KTOC Extraction (pdf-parse)

### Objectives

- Extract selectable text from multi-page KTOC order PDFs.
- Preserve page numbers and identify elevator column group boundaries.
- Extract parameter labels, raw values, and units.
- Associate specifications with candidate elevator tags (e.g. `C-PL01`).

### Acceptance criteria

- Page-level source references are preserved.
- Grouped column associations are maintained.
- Ambiguous multi-elevator associations are flagged.

## Phase 5: Groq Semantic Interpretation Service

### Objectives

- Implement `GroqProvider` utilizing official `groq-sdk` with bounded requests.
- Configure `llama-3.3-70b-versatile` with JSON schema enforcement.
- Validate LLM outputs with Zod schemas.
- Fall back safely to `requiresHumanReview = true` upon network timeout, rate limit, or unwhitelisted key proposal.
- Test against synthetic evaluation fixtures using `MockGroqProvider`.

### Acceptance criteria

- Zero false matches: model never computes compliance or invents canonical keys.
- Unapproved terms are routed to human review.
- Automated tests run hermetically without requiring a live Groq API key.
- Handle malformed and unexpected inputs.

### Acceptance criteria

- Valid synthetic fixtures are parsed correctly.
- Invalid documents produce controlled errors.
- Unsupported structures do not silently generate incorrect values.
- Tests cover the supported layouts and important failure cases.

## Phase 4: PDF KTOC Extraction

### Objectives

- Accept the approved KTOC PDF format.
- Extract the initial agreed parameter set.
- Preserve page references.
- Identify unsupported or ambiguous layouts.

### Acceptance criteria

- Synthetic PDF fixtures produce expected extraction results.
- Corrupt or unsupported PDFs are handled safely.
- Missing fields and extraction failures remain distinguishable.
- OCR is not added unless required by the actual input documents and explicitly approved.

## Phase 5: Mapping and Normalization

### Objectives

- Implement approved alias lookup.
- Normalize supported values and units.
- Reject ambiguous mappings.
- Preserve original values and source references.

### Acceptance criteria

- Approved aliases map deterministically.
- Unknown aliases require review.
- Unit conversions are tested.
- Incompatible units cannot produce an automatic match.
- Domain rules are documented and approved for enabled parameters.

## Phase 6: Comparison Engine

### Objectives

- Compare normalized TDS and KTOC parameters.
- Apply approved comparison rules.
- Classify missing, matching, mismatching, and review-required values.

### Acceptance criteria

- The engine is independent of the frontend and HTTP layer.
- All supported statuses behave according to `DOMAIN_RULES.md`.
- Comparison results are deterministic.
- Tests cover tolerance boundaries and edge cases.
- Every result retains relevant source information.

## Phase 7: API Integration

### Objectives

- Implement the documented upload endpoint.
- Connect file validation, extraction, mapping, and comparison.
- Return the documented response structure.
- Implement consistent error handling and correlation IDs.

### Acceptance criteria

- The endpoint works with synthetic integration fixtures.
- Response schemas match `API_DESIGN.md`.
- Expected errors return appropriate HTTP statuses.
- Temporary files are cleaned up after successful and failed requests.
- No unnecessary database or background processing system is introduced.

## Phase 8: Frontend Integration

### Objectives

- Implement the two-file upload flow.
- Display processing states.
- Display comparison results.
- Highlight mismatches and review-required parameters.
- Show source references and useful errors.

### Acceptance criteria

- The UI consumes the API rather than duplicating business logic.
- Stale results are not shown as results for new inputs.
- All important statuses are visually distinguishable.
- The workflow can be demonstrated with synthetic documents.

## Phase 9: Reporting

### Objectives

- Provide a readable comparison report or export.
- Preserve canonical parameter names, original values, normalized values, statuses, and source references where available.

### Acceptance criteria

- Exported results agree with the API response.
- Export does not omit important statuses.
- No unapproved document content is sent externally.
- Reporting does not introduce unnecessary persistence.

## Phase 10: Security and Reliability Review

### Objectives

- Review upload limits and file validation.
- Verify temporary-file cleanup.
- Review error responses and logging.
- Review dependency security and approved software constraints.
- Run relevant tests and build checks.

### Acceptance criteria

- Important error paths have been tested.
- Sensitive information is not exposed through logs or responses.
- Known limitations are documented.
- No unresolved critical issues are hidden.

## 3. Phase Completion Rule

A phase is complete only when its acceptance criteria have been verified and the relevant documentation and changelog are updated.

Do not mark a phase complete because the coding agent generated code that looks plausible.

## 4. Scope Change Rule

If a phase reveals a requirement that materially changes the architecture or domain rules:

1. Stop implementation of the affected part.
2. Explain the newly discovered requirement.
3. Update the relevant design document after the decision is approved.
4. Record the decision in `DECISIONS.md`.
5. Revise this plan if necessary.

Keep the initial implementation narrow. A reliable comparison of a few approved parameters is more valuable than a large application that compares everything incorrectly.