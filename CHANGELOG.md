# Changelog

All notable changes to the KONE TDS–KTOC Compliance Checker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-11-25

### Added
- `DEC-009` in `Docs/DECISIONS.md`: Strictly Offline, Zero-Third-Party-API Local Architecture (supersedes `DEC-007` and `DEC-008`, mandates removal of `groq-sdk` and prohibits cloud LLMs/APIs).
- `DEC-010` in `Docs/DECISIONS.md`: PDF-to-PDF Drawing Verification & MS2 Material-Order Impact Gate prioritizing per-group/per-elevator discrepancy reporting over automated PDF red-pen markup rendering.
- `DEC-011` in `Docs/DECISIONS.md`: Fail-Loudly Policy — Accuracy Over Silent Fallback (forbids substituting inferior fallback engines; mandates explicit blocking errors when required hardware/vision capability or verification certainty is missing).
- Expanded `Docs/PRD.md` (`v2.0`, `FR-11`–`FR-14`), `Docs/DOMAIN_RULES.md` (Sections 13–14), `Docs/SYSTEM_DESIGN.md`, `Docs/API_DESIGN.md`, `Docs/SECURITY.md`, `Docs/TESTING.md`, and `Docs/IMPLEMENTATION_PLAN.md` to cover:
  - Supply-Line Drawing PDF ↔ Customer-Approved Drawing PDF ("Red-Pen Checklist") supporting printed/handwritten/scanned customer returns, basic Adobe text edits, asymmetric local view shifts, `G-sheet`/`I-sheet`/`A/B`/`Floor Chart` hierarchies, and `SUPPLY_LINE_IMPACT` vs. `LOCAL_CONSTRUCTION_ONLY` vs. `REQUIRES_ENGINEERING_REVIEW` MS2 classifications.
  - KTOC ↔ Supply-Line AutoCAD Group Drawing PDF verification.
  - Zero-compromise fail-loudly policy requiring best-available local engines during testing and explicit capability/hardware reporting upfront.
- Committed working frontend UI refinements (`frontend/index.html`, `frontend/src/App.tsx`, `frontend/src/components/ProcessingModal.tsx`, `frontend/src/pages/LandingPage.tsx`, `frontend/src/pages/ResultsDashboard.tsx`).

### Changed
- Updated `README.md` with current development ports (`5050` backend, `3030` frontend) and expanded offline compliance tool overview.
- Reorganized `Docs/IMPLEMENTATION_PLAN.md` Phases 1–10 cleanly, scheduling `groq-sdk` removal and de-hardcoding as Phase 5 before drawing workflows (Phases 6–9).

### Verified
- Backend TypeScript build (`npm run build`) and automated suite (`npm test` — 13/13 tests across 6 suites) passed.
- Frontend TypeScript check & Vite build (`npm run build`) passed.
- Note: `groq-sdk` removal and drawing-comparison code implementation are documented and scheduled for upcoming phases, not yet implemented in source code.

## [0.2.0] - 2026-10-27

### Added
- Approved dependencies: `groq-sdk`, `zod`, `multer`, `exceljs`, `pdf-parse` (backend).
- Intermediate evidence model (`ExtractedEvidence`) preserving cell addresses and PDF page references (`src/types/evidence.ts`).
- Compliance comparison models with mapping provenance tracking (`src/types/compliance.ts`).
- Groq semantic interpretation provider interface (`IGroqProvider`) and Zod schemas (`src/services/groq/groq.interface.ts`).
- Hermetic `MockGroqProvider` for fast, zero-cost automated testing (`src/services/groq/groq.mock.ts`).
- Production-ready `GroqProvider` with bounded prompts, structured JSON mode, timeout controls, and canonical key hallucination safeguards (`src/services/groq/groq.service.ts`).
- Automated unit test suite verifying Groq mock provider behavior and human-review fallback routing (`tests/groq.service.test.ts`).
- Architecture decisions `DEC-007` (Hybrid Groq Semantic Interpretation) and `DEC-008` (Three-Tier Security Gate) in `Docs/DECISIONS.md`.
- Updated `Docs/SYSTEM_DESIGN.md`, `Docs/SECURITY.md`, and `Docs/IMPLEMENTATION_PLAN.md` reflecting the Groq-integrated hybrid architecture.

## [0.1.0] - 2026-10-27

### Added
- Project scaffold establishing modular monolith architecture.
- Backend initialization with Node.js, Express, and TypeScript.
- Backend structured logger conforming to `LOGGING.md`.
- Request context middleware providing correlation IDs (`x-correlation-id`).
- Centralized error-handling middleware preventing stack trace leakage.
- Health endpoint (`GET /api/v1/health`) complying with `API_DESIGN.md`.
- Automated test suite for the health endpoint and middleware.
- Frontend initialization with React, TypeScript, and Vite.
- Base TypeScript and environment configurations (`.env.example`).
- Project root `.gitignore` and `README.md`.
