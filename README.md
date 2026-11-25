# KONE TDS–KTOC & Drawing Compliance Tool

Internal, strictly offline compliance-assistance tool for verifying KONE elevator engineering documents:

1. **TDS ↔ KTOC Order Form** *(Implemented Baseline)*: Compare Customer Excel TDS workbooks against KONE KTOC order PDFs.
2. **Supply-Line Drawing ↔ Customer-Approved Drawing (Red-Pen Checklist & MS2 Gate)** *(Planned — Top Priority)*: Detect per-group and per-elevator discrepancies across `G-sheet`, `I-sheet`, `A/B`, and `Floor Chart` PDFs (including scanned/handwritten customer returns and shifted views) and classify `SUPPLY_LINE_IMPACT` vs. `LOCAL_CONSTRUCTION_ONLY` prior to Milestone 2 (`MS2`).
3. **KTOC ↔ AutoCAD Group PDFs** *(Planned)*: Verify system-generated AutoCAD group drawing PDFs against KTOC specifications.

## Architecture & Security Policy

- **100% Local & Offline:** Zero third-party cloud APIs (`groq-sdk` scheduled for removal in Phase 5; no Gemini, OpenAI, or cloud OCR). Built to run on standard CPU-only workstations without a dedicated GPU.
- **Modular Monolith:**
  - `Docs/`: Architecture, PRD, API design, security, logging, testing, domain rules, decisions, and roadmap.
  - `backend/`: Node.js, Express, and TypeScript API server.
  - `frontend/`: React, TypeScript, and Vite single-page application.

## Prerequisites

- Node.js v20+ (tested on Node v22.14.0)
- npm v10+
- Python 3.13+ (for planned local spatial/scanned PDF drawing extraction in Phase 6+)

## Quick Start

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

The backend server runs on `http://localhost:5050`.
Health check: `http://localhost:5050/api/v1/health`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend development server runs on `http://localhost:3030`.

## Verification Commands

### Backend
- Run tests: `npm test`
- Type-check and build: `npm run build`
- Start compiled production server: `npm start`

### Frontend
- Type-check and build: `npm run build`
- Preview production build: `npm run preview`
