# DECISIONS.md

## Purpose

Record significant technical and domain decisions that affect the implementation.

This file prevents repeated reconsideration of settled choices and helps future contributors understand why the application is structured as it is.

## Decision Rules

- Record decisions that materially affect architecture, API behavior, security, dependencies, or compliance logic.
- Do not record every minor implementation detail.
- Do not silently reverse an existing decision.
- If a decision must change, document the reason, consequences, and replacement decision.
- Update the relevant design documents when a decision changes the implementation.
- Use `CHANGELOG.md` to record the resulting implementation changes.

## Decision Statuses

- **Proposed:** Awaiting review or approval.
- **Accepted:** Approved for implementation.
- **Superseded:** Replaced by a later decision.
- **Rejected:** Considered and not adopted.

## Decision Record Template

### DEC-XXX: [Short title]

- **Status:** Proposed / Accepted / Superseded / Rejected
- **Date:** YYYY-MM-DD
- **Context:** What problem or requirement prompted this decision?
- **Decision:** What was selected?
- **Alternatives considered:** What reasonable alternatives were evaluated?
- **Reasoning:** Why was this choice made?
- **Consequences:** What benefits, limitations, or trade-offs follow?
- **Affected documents:** Which documents must remain consistent?
- **Approval:** Who approved the decision, if approval is required?

---

## Initial Decisions

### DEC-001: Modular Monolith

- **Status:** Accepted
- **Context:** The application processes two documents and compares a bounded set of engineering parameters.
- **Decision:** Keep the application in a small frontend and backend structure with clearly separated modules.
- **Reasoning:** The initial requirements do not justify distributed services or independently deployed processing components.
- **Consequences:** Modules can be tested independently without introducing unnecessary deployment and communication complexity.
- **Affected documents:** `SYSTEM_DESIGN.md`, `AGENTS.md`

### DEC-002: Deterministic Comparison

- **Status:** Accepted
- **Context:** Compliance results must be explainable and reproducible.
- **Decision:** Use explicit mapping rules, approved unit conversions, and deterministic comparison logic.
- **Reasoning:** Probabilistic model output must not independently determine engineering compliance.
- **Consequences:** Unknown or ambiguous mappings require review. Approved mappings must be maintained deliberately.
- **Affected documents:** `DOMAIN_RULES.md`, `TESTING.md`, `SYSTEM_DESIGN.md`

### DEC-003: No Database in the Initial Version

- **Status:** Accepted
- **Context:** The initial workflow accepts two documents and returns a comparison result.
- **Decision:** Do not add persistent database storage unless an approved requirement demands it.
- **Reasoning:** Persistence adds setup, security, maintenance, and data-retention obligations that are not required by the initial workflow.
- **Consequences:** Results should be returned directly unless a separately approved bounded retrieval mechanism is implemented.
- **Affected documents:** `SYSTEM_DESIGN.md`, `API_DESIGN.md`

### DEC-004: No External Document Transmission by Default

- **Status:** Accepted
- **Context:** Uploaded documents may contain confidential business information.
- **Decision:** Do not transmit document contents to external services without explicit authorization and security approval.
- **Reasoning:** Internal document confidentiality takes priority over convenience.
- **Consequences:** Parsing and processing choices must comply with the approved execution environment.
- **Affected documents:** `SECURITY.md`, `LOGGING.md`, `AGENTS.md`

### DEC-005: Review-Required Is Not a Match

- **Status:** Accepted
- **Context:** Different nomenclature and incomplete extraction can make parameter correspondence uncertain.
- **Decision:** Unknown or ambiguous mappings must not produce `MATCH`.
- **Reasoning:** False compliance matches can hide engineering discrepancies.
- **Consequences:** The UI and API must preserve review-required and not-comparable states.
- **Affected documents:** `DOMAIN_RULES.md`, `API_DESIGN.md`, `TESTING.md`

### DEC-006: Dependency Approval

- **Status:** Accepted
- **Context:** The application may be developed or executed in a restricted corporate environment.
- **Decision:** Verify software and dependency approval before introducing new packages or external integrations.
- **Reasoning:** A technically valid dependency is not necessarily permitted in the target environment.
- **Consequences:** An unavailable or prohibited dependency must trigger an explicit blocker and an approved alternative, not a security-policy bypass.
- **Affected documents:** `AGENTS.md`, `SECURITY.md`, `IMPLEMENTATION_PLAN.md`

### DEC-007: Hybrid Groq LLM Semantic Interpretation & Provider Abstraction

- **Status:** Superseded (by `DEC-009` on 2026-11-25)
- **Context:** Customer TDS workbooks employ bespoke terminology, formatting, and elevator naming that differ from KONE KTOC specifications. Monolithic regex dictionary mapping is brittle, yet an LLM must not act as an ungrounded black-box compliance judge.
- **Decision:** Implement a hybrid architecture. Deterministic parsers extract structured evidence into an intermediate model (`ExtractedEvidence`). Bounded requests are sent to a Groq-hosted LLM (`llama-3.3-70b-versatile`) strictly to interpret unmapped labels and propose canonical keys. Groq responses are validated with Zod against strict schemas. The final compliance status (`MATCH`/`MISMATCH`) is strictly computed by the deterministic comparison engine.
- **Alternatives considered:** Pure rule-based regex engine (fails on unseen customer synonyms); end-to-end LLM document analysis (violates auditability, hallucinates dimensions, leaks confidential documents).
- **Reasoning:** Superseded because corporate IT and confidentiality policies prohibit transmitting confidential documents or metadata to external cloud LLM APIs (Groq, Gemini, etc.).
- **Consequences:** Retained only as historical context; `groq-sdk` and external Groq integration are scheduled for removal in Phase 5.
- **Affected documents:** `SYSTEM_DESIGN.md`, `API_DESIGN.md`, `DOMAIN_RULES.md`, `TESTING.md`, `IMPLEMENTATION_PLAN.md`

### DEC-008: Mandatory Three-Tier Security Gate for Hosted LLMs

- **Status:** Superseded (by `DEC-009` on 2026-11-25)
- **Context:** KONE elevator designs, customer tenders, and KTOC specifications contain confidential commercial and engineering IP. Transmitting real production documents to external AI endpoints poses data leakage risks.
- **Decision:** Enforce a strict three-tier execution and security gate:
  1. **Tier 1 (Local):** Local deterministic parsers, mock Groq provider, zero external network calls.
  2. **Tier 2 (Synthetic / Anonymized):** Redacted, synthetic fixtures tested against Groq in non-production environments.
  3. **Tier 3 (Production KONE Documents):** Hosted LLM transmission authorized only after signed corporate legal/data protection clearance.
- **Reasoning:** Superseded by `DEC-009` to establish an unconditional ban on all third-party cloud APIs across development and production.
- **Consequences:** All processing must run strictly offline on local hardware with free, open-source tooling.
- **Affected documents:** `SECURITY.md`, `LOGGING.md`, `IMPLEMENTATION_PLAN.md`

### DEC-009: Strictly Offline, Zero-Third-Party-API Local Architecture

- **Status:** Accepted
- **Date:** 2026-11-25
- **Context:** Uploaded TDS workbooks, KTOC forms, and engineering drawings contain highly confidential customer and KONE engineering data. Corporate IT policy strictly forbids sending any documents, parameters, or snippets to external third-party APIs (including Groq, Gemini, OpenAI, or cloud OCR services). Additionally, development and target hardware are CPU-only workstations without dedicated GPUs and constrained free RAM (~30% of 16 GB available during typical use).
- **Decision:**
  1. Completely remove `groq-sdk` and all external cloud AI/API integrations; prohibit outbound network calls during document processing.
  2. All parsing, drawing comparison, OCR, and classification must run 100% locally using free, open-source components.
  3. Do not require heavy local LLMs (e.g., 7B+ Ollama models) as a mandatory runtime dependency. Rely on deterministic structure-aware extraction, region/anchor-based comparison, lightweight CPU-friendly computer vision / local OCR when needed for scanned markups, and explicit `REVIEW_REQUIRED` flagging as the clean fallback. Any future local model assistance must remain strictly optional, bind only to `127.0.0.1`, and operate within workstation RAM/CPU limits.
  4. Replace hardcoded mock mappings, dates, and elevator prefix assumptions with dynamic document discovery and explicit human-review flags for unresolved associations.
- **Alternatives considered:** Tiered cloud API usage (`DEC-007`/`DEC-008` — violates corporate IT policy); mandatory local 7B+ VLM/LLM inference via Ollama (unfeasible on GPU-less laptops with ~4–5 GB free RAM).
- **Reasoning:** Guarantees zero confidential data exfiltration, zero API cost, deterministic behavior, and reliable execution on standard KONE engineering laptops.
- **Consequences:** Unrecognized handwritten notes or novel terminology route to `REVIEW_REQUIRED` with cropped visual/source evidence rather than speculative AI guesses.
- **Affected documents:** `PRD.md`, `SYSTEM_DESIGN.md`, `SECURITY.md`, `DOMAIN_RULES.md`, `IMPLEMENTATION_PLAN.md`, `TESTING.md`
- **Approval:** Approved by project owner (2026-11-25)

### DEC-010: PDF-to-PDF Drawing Verification & MS2 Material-Order Impact Gate

- **Status:** Accepted
- **Date:** 2026-11-25
- **Context:** Beyond TDS ↔ KTOC checks, engineering verification spans two drawing workflows: (a) comparing KTOC order specs against system-generated AutoCAD group PDFs, and (b) comparing Rev 1 Supply-Line drawings against Customer-Approved drawings to prepare "red-pen" feedback and determine whether changes impact the factory material order prior to Milestone 2 (`MS2` / `MS2D`). Customer-approved drawings always return as PDFs (predominantly printed, handwritten, and scanned back, or occasionally edited with basic Adobe text tools), and drawings often undergo asymmetric local layout shifts (shifted views, resized elements, revised abbreviation/revision tables).
- **Decision:**
  1. Standardize drawing ingestion on **PDF ↔ PDF** rather than proprietary `.dwg` CAD files, since customer approvals/redlines always arrive as PDFs.
  2. Prioritize automated **per-group, per-elevator discrepancy extraction + MS2 Impact Classification** (`SUPPLY_LINE_IMPACT`, `LOCAL_CONSTRUCTION_ONLY`, `REQUIRES_ENGINEERING_REVIEW`) before attempting automated PDF red-pen annotation rendering.
  3. Support multi-sheet group hierarchies (`G-sheet`, `I-sheet`, `A/B` layout sheets, shared and selective-stop `Floor Charts`) and asymmetric region-anchored comparison so physical view shifts do not trigger false page-wide failures.
- **Alternatives considered:** Requiring `.dwg` CAD uploads (unsupported for customer returns, proprietary binary format); naive full-page pixel diffing (breaks when local engineers shift or resize views); immediate PDF red-pen auto-drawing (deferred until discrepancy detection accuracy is proven).
- **Reasoning:** Directly automates the highest-effort manual verification bottleneck while preserving engineering safety at the MS2 release gate.
- **Consequences:** Requires spatial PDF extraction, scanned-page markup region detection with lightweight CPU OCR fallback, and explicit MS2 impact rules verified against sample project documents.
- **Affected documents:** `PRD.md`, `SYSTEM_DESIGN.md`, `API_DESIGN.md`, `DOMAIN_RULES.md`, `IMPLEMENTATION_PLAN.md`, `TESTING.md`
- **Approval:** Approved by project owner (2026-11-25)

---

## Adding a Decision

When a significant decision is made, add a new numbered entry using the template above.

Do not alter an accepted decision merely to make a new implementation easier. Explain why the original decision no longer satisfies the requirements before proposing a replacement.