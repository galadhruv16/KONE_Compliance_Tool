# KONE TDS–KTOC Compliance Tool

Internal compliance-assistance tool for comparing customer Technical Data Sheets (TDS) against KONE KTOC order forms.

## Architecture

This project is structured as a **modular monolith** with a TypeScript backend and a React frontend:

- `Docs/`: Architecture, API design, security, logging, testing, and domain documentation.
- `backend/`: Node.js, Express, and TypeScript API server.
- `frontend/`: React, TypeScript, and Vite single-page application.

## Prerequisites

- Node.js v20+ (tested on Node v22.14.0)
- npm v10+

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

The frontend development server runs on `http://localhost:5180`.

## Verification Commands

### Backend
- Run tests: `npm test`
- Type-check and build: `npm run build`
- Start compiled production server: `npm start`

### Frontend
- Type-check and build: `npm run build`
- Preview production build: `npm run preview`
