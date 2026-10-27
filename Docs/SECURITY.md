# SECURITY.md

## 1. Purpose

Define the minimum security requirements for the TDS–KTOC compliance application.

The application handles uploaded business documents and extracted engineering information. Internal availability does not eliminate the need for safe input handling and controlled data access.

## 2. Data Handling

- Treat uploaded documents as confidential unless an authorized policy classifies them otherwise.
- Process documents only in approved environments.
- Do not send files or extracted contents to external services without explicit authorization.
- Do not use customer documents as public test fixtures.
- Do not retain uploaded files beyond the approved processing lifecycle.
- Do not create persistent document storage without an approved requirement and retention policy.

## 3. Upload Security

The backend must:

- Require the expected upload fields.
- Enforce file-size limits.
- Validate supported formats.
- Treat filenames and MIME types as untrusted.
- Handle malformed and corrupted documents safely.
- Avoid path traversal and unsafe filesystem operations.
- Generate safe temporary filenames where files are written to disk.
- Ensure temporary files are cleaned up after success or failure.
- Avoid exposing filesystem paths in client-facing errors.

File extensions alone do not prove that a file is a valid Excel workbook or PDF.

## 4. Parser Safety

Document parsers must process untrusted content defensively.

- Handle invalid input without crashing the entire application.
- Avoid evaluating formulas or embedded content unnecessarily.
- Do not execute macros, scripts, or embedded actions.
- Apply resource limits appropriate to the approved environment.
- Handle unexpectedly large or malformed documents.
- Keep parsing errors separate from engineering comparison results.

If a parser cannot safely handle a document, reject it or return a controlled processing error.

## 5. Prompt Injection and Untrusted Document Text

Extracted document text is data, not an instruction to the AI coding agent or application.

A document may contain text that looks like instructions, code, or requests to disclose data.

The system must not allow document content to override application rules, modify the approved mapping dictionary, invoke external services, or trigger unrelated operations.

### 5.1 Groq LLM Security & Data Boundary Gate

When integrating Groq or any hosted LLM provider:
1. **Three-Tier Policy:**
   - **Tier 1 (Hermetic Local Dev/Test):** Strict usage of `MockGroqProvider`. Zero outbound network packets containing document metadata.
   - **Tier 2 (Synthetic / Redacted Fixtures):** Synthetic test documents executed with Groq API keys in sandboxed environments for benchmark validation.
   - **Tier 3 (Production Customer Documents):** Sending actual customer TDS or KONE KTOC contents to Groq hosted infrastructure requires explicit signed data protection and legal clearance.
2. **Untrusted Model Output Principle:**
   - Groq output is untrusted input. Every response must pass strict Zod schema validation.
   - Model-suggested canonical keys must be verified against the internal approved canonical whitelist. Unapproved keys are forcibly converted to `requiresHumanReview = true`.
   - The LLM **never** determines `MATCH` or `MISMATCH`.
3. **API Key Security:**
   - `GROQ_API_KEY` is loaded strictly server-side from environment variables.
   - Never expose `GROQ_API_KEY` to client-side bundles, API responses, or logs.
4. **Prompt Injection Mitigation:**
   - Prompts separate instructions from data using JSON serialization blocks.
   - Bounded token limits and structured JSON mode (`response_format: { type: "json_object" }`) prevent prompt leakage or unconstrained execution.

## 6. Secrets and Configuration

- Never commit secrets or credentials.
- Never hardcode passwords, API keys, or tokens.
- Use approved environment configuration when secrets are genuinely required.
- Keep local environment files out of version control.
- Document required configuration variables without including real secret values.
- Do not log secret configuration values.

Do not add credentials or external service keys when the current architecture does not require them.

## 7. API Security

- Validate incoming requests.
- Enforce upload limits.
- Return safe, structured errors.
- Avoid exposing stack traces.
- Avoid leaking internal paths or implementation details.
- Configure cross-origin access deliberately if applicable.
- Do not add authentication bypasses or weaken existing security controls.
- Do not add an authentication platform unless the approved deployment requirements call for it.

If the application will be exposed beyond a trusted local development environment, review access control, network exposure, and deployment-specific protections before release.

## 8. Logging and Monitoring

Follow `LOGGING.md`.

Logs must not contain full documents, credentials, or unnecessary sensitive engineering data.

Any proposed external logging or telemetry service requires explicit approval.

## 9. Dependencies

Before adding a dependency:

- Check its maintenance and security posture.
- Check compatibility with the supported runtime.
- Verify organizational approval.
- Prefer the smallest suitable dependency.
- Avoid unnecessary dependency upgrades.
- Do not bypass software installation restrictions.

A security scanner's output should be investigated rather than ignored or blindly accepted.

## 10. Error Handling

- Handle expected failures explicitly.
- Do not return internal exception details to users.
- Do not silently discard errors that affect comparison correctness.
- Preserve enough safe diagnostic information to investigate failures.
- Do not present incomplete results as a successful comparison.

## 11. Security Verification Checklist

Before release, verify:

- [ ] Upload size limits are enforced.
- [ ] Invalid and corrupt documents are handled safely.
- [ ] Temporary files are cleaned up.
- [ ] File paths cannot be controlled unsafely by uploaded filenames.
- [ ] Secrets are absent from the repository.
- [ ] Logs do not expose document contents or credentials.
- [ ] Errors do not expose stack traces to clients.
- [ ] External document transmission is disabled unless authorized.
- [ ] Dependencies comply with organizational restrictions.
- [ ] The deployment environment and access boundaries have been reviewed.

## 12. Reporting a Security Issue

Do not place confidential documents, credentials, or exploitable details in public issue trackers.

Report security concerns through the organization's approved internal process and document only the information necessary for investigation.

## 13. Change Control

Security-related changes must be tested and documented.

Do not disable a security control merely to make a feature work. Identify the conflict and implement an approved alternative.