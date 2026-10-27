# Changelog

All notable changes to the KONE TDS–KTOC Compliance Checker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
