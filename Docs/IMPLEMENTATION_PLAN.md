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

## Phase 1: Project Skeleton (Completed Baseline)

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

## Phase 2: Canonical Data Model & Intermediate Evidence (Completed Baseline)

### Objectives

- Define the normalized representation of an extracted parameter (`ExtractedEvidence`).
- Define source-reference structures (sheet, cell address, column header, page, section).
- Define comparison result types, elevator grouping, and statuses.

### Acceptance criteria

- Types reflect `DOMAIN_RULES.md` and `API_DESIGN.md`.
- Source traceability can be preserved to the cell/page level.
- Missing, invalid, ambiguous, and incomparable values are distinguishable.
- No arbitrary engineering tolerances or unapproved aliases are introduced.

## Phase 3: Excel TDS & PDF KTOC Extraction (Baseline Implemented — Hardcoded Debt Pending Phase 5)

### Objectives

- Accept supported Excel workbook formats (`.xlsx`) and text-based KTOC PDFs (`.pdf`).
- Extract elevator specifications preserving sheet names, cell coordinates, and PDF page/column provenance.
- Separate customer project requirements from supplier confirmations and comments.

### Acceptance criteria

- Valid synthetic fixtures are parsed correctly.
- Invalid documents produce controlled errors.
- Unsupported structures do not silently generate incorrect values.
- Tests cover supported layouts and failure cases.

## Phase 4: Deterministic TDS ↔ KTOC Comparison & Studio UI (Baseline Implemented)

### Objectives

- Compare normalized TDS and KTOC parameters deterministically.
- Expose `POST /api/v1/compliance/compare` and render the React Studio Upload / Results Dashboard.

### Acceptance criteria

- Comparison engine is independent of the frontend and HTTP layer.
- Results classify `MATCH`, `MISMATCH`, `MISSING_IN_TDS`, `MISSING_IN_KTOC`, `REVIEW_REQUIRED`, and `NOT_COMPARABLE`.
- Source references are displayed in the UI.

## Phase 5: Strictly Offline Policy Alignment & De-Hardcoding (Next Immediate Step)

### Objectives

- Remove `groq-sdk`, `GroqProvider`, and all external cloud AI configuration per `DEC-009`.
- Remove hardcoded dates (`29th Oct 2025`, `05.10.2026`), hardcoded lift prefixes (`C-`), hardcoded dimension overrides (`2607`), and static elevator alias maps from `MockGroqProvider`, `excel.parser.ts`, `pdf.parser.ts`, and `compliance.engine.ts`.
- Replace hardcoded elevator matching with dynamic, document-driven discovery and explicit `REVIEW_REQUIRED` fallback for ambiguous lift pairs.

### Acceptance criteria

- Zero references to `groq-sdk`, `GROQ_API_KEY`, or external third-party AI APIs remain in code or `package.json`.
- Any project/elevator naming convention is discovered dynamically from uploaded files without hardcoded sheet-to-lift maps.
- Existing TDS ↔ KTOC tests pass offline with zero outbound network activity.

## Phase 6: Local Drawing PDF Extractor (Vector, Scanned & Asymmetric Layouts)

### Objectives

- Build a 100% local extractor for multi-page elevator group drawing PDFs (`G-sheet`, `I-sheet`, `A/B` layouts, and `Floor Charts` including split-stop lift columns).
- Support both vector Supply-Line PDFs and Customer-Approved PDFs (printed, handwritten, and scanned back, plus basic Adobe text edits).
- Handle asymmetric local engineering shifts (shifted/resized views, modified abbreviation/revision tables) using region-anchored matching rather than naive pixel overlap.
- Benchmark the highest-accuracy free local vision/OCR engines on sample scanned/handwritten drawings and enforce `DEC-011` (Fail Loudly with an explicit hardware/capability error if reliable verification cannot be achieved—zero inferior fallback).

### Acceptance criteria

- Extracts sheet hierarchy, elevator groups, floor-stop matrices, and CAD nomenclature pairs deterministically from vector drawings.
- Accurately locates and reads customer markups on sample scanned drawings with zero missed critical discrepancies in benchmark evaluation, OR fails explicitly with documented hardware/model upgrade requirements (`DEC-011`).
- Never silently skips an unreadable page or substitutes a low-recall heuristic.

## Phase 7: Drawing Revision Diff & MS2 Impact Engine ("Red-Pen Checklist")

### Objectives

- Compare Supply-Line Drawing PDF vs. Customer-Approved Drawing PDF per group and per elevator.
- Produce a structured discrepancy list (`Red-Pen Checklist`) preserving sheet/page/lift/coordinate provenance and cropped visual diff previews.
- Classify every discrepancy under the MS2 gate (`SUPPLY_LINE_IMPACT`, `LOCAL_CONSTRUCTION_ONLY`, `REQUIRES_ENGINEERING_REVIEW`) using approved rules.
- Expose `POST /api/v1/drawings/compare-revisions`.

### Acceptance criteria

- Correctly surfaces per-group and per-elevator differences across `G-sheet`, `I-sheet`, `A/B`, and `Floor Charts`.
- Never auto-clears MS2 on ambiguous, handwritten, or unmapped changes.
- Automated tests validate `SUPPLY_LINE_IMPACT`, `LOCAL_CONSTRUCTION_ONLY`, shifted views, and scanned customer markups.

## Phase 8: Drawing Revision & MS2 UI Workflow (Stitch Cycle + Export)

### Objectives

- Add workflow mode switching in the UI while preserving existing TDS ↔ KTOC functionality.
- Present MS2 Release Readiness status, group/elevator discrepancy filters, cropped visual markup inspection, and downloadable checklist export (CSV/Excel).
- Note: Automatic red-pen annotation rendering onto output PDFs remains excluded until discrepancy detection is validated.

### Acceptance criteria

- Follows the approved Stitch design → MCP/design review → implementation → verification cycle.
- All MS2 blocking and review-required items are unmistakably highlighted.
- Exported checklist matches UI state deterministically.

## Phase 9: KTOC Order Form ↔ Supply-Line AutoCAD Drawing Verification

### Objectives

- Expand KTOC extraction beyond initial 13 numeric parameters to include finishes, ceiling, handrail, front wall, fixture/button codes, and stop schedules as verified against real samples.
- Compare KTOC Order Form against Supply-Line AutoCAD Group PDFs (`G-sheet`, `I-sheet`, `A/B`, `Floor Charts`).
- Expose `POST /api/v1/drawings/verify-ktoc` and its corresponding UI view.

### Acceptance criteria

- Group PDFs are matched dynamically to KTOC elevator groups.
- Code-standard differences (e.g., IS vs. EN passenger calculations) and unmapped parameters flag `REVIEW_REQUIRED` unless explicitly covered by an approved rule.

## Phase 10: Security, Accuracy Benchmarking & End-to-End Validation

### Objectives

- Verify upload limits, MIME/magic-byte validation, and temporary-file cleanup across all workflows.
- Verify zero outbound network calls (strict IT compliance).
- Benchmark accuracy (zero missed discrepancies) and hardware utilization (CPU/RAM/GPU requirements) using real multi-page group PDFs, surfacing any upgrade requirements explicitly.
- Run full unit, parser, API, and UI verification suites.

### Acceptance criteria

- Zero third-party API calls or secret exposure.
- Any unsupported hardware/engine constraint fails explicitly upfront (`DEC-011`).
- All documented security and testing checklists pass honestly.

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