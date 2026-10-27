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

- **Status:** Accepted
- **Context:** Customer TDS workbooks employ bespoke terminology, formatting, and elevator naming that differ from KONE KTOC specifications. Monolithic regex dictionary mapping is brittle, yet an LLM must not act as an ungrounded black-box compliance judge.
- **Decision:** Implement a hybrid architecture. Deterministic parsers extract structured evidence into an intermediate model (`ExtractedEvidence`). Bounded requests are sent to a Groq-hosted LLM (`llama-3.3-70b-versatile`) strictly to interpret unmapped labels and propose canonical keys. Groq responses are validated with Zod against strict schemas. The final compliance status (`MATCH`/`MISMATCH`) is strictly computed by the deterministic comparison engine.
- **Alternatives considered:** Pure rule-based regex engine (fails on unseen customer synonyms); end-to-end LLM document analysis (violates auditability, hallucinates dimensions, leaks confidential documents).
- **Reasoning:** Provides semantic flexibility while guaranteeing 100% deterministic, auditable engineering decisions.
- **Consequences:** Groq provider must sit behind an interface (`IGroqProvider`) with a hermetic `MockGroqProvider` for automated testing.
- **Affected documents:** `SYSTEM_DESIGN.md`, `API_DESIGN.md`, `DOMAIN_RULES.md`, `TESTING.md`, `IMPLEMENTATION_PLAN.md`

### DEC-008: Mandatory Three-Tier Security Gate for Hosted LLMs

- **Status:** Accepted
- **Context:** KONE elevator designs, customer tenders, and KTOC specifications contain confidential commercial and engineering IP. Transmitting real production documents to external AI endpoints poses data leakage risks.
- **Decision:** Enforce a strict three-tier execution and security gate:
  1. **Tier 1 (Local):** Local deterministic parsers, mock Groq provider, zero external network calls.
  2. **Tier 2 (Synthetic / Anonymized):** Redacted, synthetic fixtures tested against Groq in non-production environments.
  3. **Tier 3 (Production KONE Documents):** Hosted LLM transmission authorized only after signed corporate legal/data protection clearance.
- **Reasoning:** Prevents accidental transmission of customer or KONE proprietary specifications without formal authorization.
- **Consequences:** Production deployments default to Tier 1 mock or fallback unless explicitly configured with approved credentials and verified approval flags.
- **Affected documents:** `SECURITY.md`, `LOGGING.md`, `IMPLEMENTATION_PLAN.md`

---

## Adding a Decision

When a significant decision is made, add a new numbered entry using the template above.

Do not alter an accepted decision merely to make a new implementation easier. Explain why the original decision no longer satisfies the requirements before proposing a replacement.