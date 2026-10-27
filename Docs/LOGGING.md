# LOGGING.md

## 1. Purpose

Define a consistent, minimal, secure logging strategy for the TDS–KTOC compliance application.

Logs should help developers diagnose failures and understand processing behavior without exposing sensitive business documents.

## 2. Principles

- Use structured logs.
- Use consistent log levels.
- Include a correlation ID for each request.
- Record meaningful processing stages and failures.
- Never log secrets or entire uploaded documents.
- Avoid logging the same exception repeatedly at multiple layers.
- Keep logging implementation proportional to the application.
- Do not add external logging services without approval.

## 3. Log Levels

| Level | Usage |
|---|---|
| `error` | Unexpected failures that prevent a request or processing operation from completing. |
| `warn` | Recoverable problems, unsupported extraction cases, or degraded processing. |
| `info` | Significant lifecycle events, such as request completion and processing outcomes. |
| `debug` | Detailed diagnostic information needed during development. |

Debug logging should be configurable and should not expose sensitive values.

Do not introduce verbose per-cell or per-line logging by default.

## 4. Correlation IDs

Every incoming API request should have a correlation ID.

- Accept an incoming correlation ID only after validating its format and length.
- Otherwise, generate a new ID.
- Return the ID in the response using the documented API convention.
- Include it in logs associated with that request.
- Propagate it through processing modules where needed.

Do not create separate unrelated IDs for every internal function call.

## 5. Events to Log

Record relevant events such as:

- Request received.
- Upload validation failed.
- Document parsing started.
- Document parsing completed.
- Extraction completed with warnings.
- Parameter mapping required review.
- Comparison completed.
- Report generation completed.
- Temporary-file cleanup failed.
- Unexpected processing error.
- Request completed, including duration and outcome.

Avoid excessive logging of routine internal operations.

## 6. Sensitive Information

Never log:

- Credentials, access tokens, or API keys.
- Full document contents.
- Complete extracted engineering tables.
- Customer-confidential data without a documented need and authorization.
- Raw multipart request bodies.
- Unfiltered parser exceptions containing document text.
- Internal secrets or environment configuration values.

Prefer logging metadata such as:

- Correlation ID.
- Processing stage.
- Document type.
- File size.
- Number of extracted parameters.
- Number of matched and mismatched parameters.
- Duration.
- Error category.

Even filenames may contain customer or project information. Avoid logging them by default unless the approved logging policy permits it.

## 7. Error Logging

Expected validation errors should be handled as normal application outcomes, with appropriate warning-level logging where useful.

Unexpected errors should be logged once at the appropriate handling boundary with:

- Correlation ID.
- Error category.
- Safe error message.
- Relevant processing stage.
- Stack trace in controlled development or diagnostic environments, when appropriate.

Do not expose internal stack traces in HTTP responses.

Do not swallow exceptions without recording or propagating them appropriately.

## 8. Log Format

Use the project's existing structured logger if one is configured. Otherwise, select a minimal implementation consistent with `SYSTEM_DESIGN.md` and approved dependencies.

Example structure:

```json
{
  "level": "info",
  "timestamp": "2026-10-27T10:00:00.000Z",
  "correlationId": "example-request-id",
  "event": "comparison.completed",
  "durationMs": 420,
  "status": "COMPLETED_WITH_WARNINGS",
  "parameterCount": 18,
  "mismatchCount": 2
}
```

All example values are illustrative.

Do not create a custom logging framework.

## 9. Retention and Storage

Follow the approved environment's logging and retention requirements.

Do not introduce a database merely to store logs.

Do not retain uploaded files or detailed extracted values through the logging system.

If persistent logs are required, document the storage location, access restrictions, and retention policy before implementation.

## 10. Testing

Test that:

- Correlation IDs are generated and propagated.
- Expected failures produce appropriate log events.
- Unexpected errors are logged safely.
- Secrets and document contents are not logged.
- Log levels behave as configured.
- Logging failures do not expose sensitive data.

## 11. Documentation Maintenance

When logging behavior changes, update this file and `CHANGELOG.md`.

Do not claim that a logging or redaction feature exists unless it has been implemented and verified.