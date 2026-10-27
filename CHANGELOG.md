# Changelog

All notable changes to the KONE TDS–KTOC Compliance Checker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
