# TASK_TEMPLATE.md

## Task Name

[Short, specific task name]

## 1. Objective

Describe one feature, bug fix, or narrowly scoped improvement.

[What must change, and why?]

## 2. Mandatory Pre-Work

Before changing code, the agent must:

1. Read `AGENTS.md`.
2. Read `README.md`, `PRD.md`, `SYSTEM_DESIGN.md`, and `API_DESIGN.md` as relevant.
3. Read `DOMAIN_RULES.md`, `LOGGING.md`, `TESTING.md`, and `DECISIONS.md` when relevant.
4. Inspect the files, functions, tests, and configuration affected by this task.
5. Check the current repository state and preserve unrelated changes.
6. Identify existing functionality that can be reused.

Do not begin implementation before completing this review.

## 3. Scope

### Included

- [Specific required behavior]
- [Relevant files or modules, if known]
- [Required tests]

### Excluded

- Unrelated refactoring.
- New features not explicitly requested.
- New dependencies without justification.
- Changes to existing API contracts unless required.
- Architectural changes outside the approved design.

## 4. Existing Behavior to Preserve

List relevant behavior that must continue working.

- [Existing behavior 1]
- [Existing behavior 2]

The agent must inspect the actual code and add further preservation requirements where necessary.

## 5. Acceptance Criteria

The task is complete only when:

- [ ] The requested behavior works.
- [ ] Existing relevant behavior remains intact.
- [ ] Input validation and error handling are appropriate.
- [ ] Relevant tests have been added or updated.
- [ ] Relevant tests and checks have been executed where possible.
- [ ] No dead code or duplicate implementation has been introduced.
- [ ] No unnecessary dependencies or abstractions have been added.
- [ ] Relevant technical documentation has been updated.
- [ ] `CHANGELOG.md` has been updated.
- [ ] The final diff has been reviewed.
- [ ] Limitations and unexecuted checks have been reported honestly.

## 6. Implementation Constraints

- Follow `AGENTS.md` and the approved design documents.
- Reuse existing functions where reasonable.
- Keep the change as small as possible.
- Do not silently change unrelated behavior.
- Do not invent engineering mappings, units, tolerances, or compliance rules.
- Do not introduce external services without authorization.
- Do not fabricate test results.
- Stop and explain any material conflict with the existing architecture.

## 7. Verification

Specify the expected checks:

- Unit tests: [Relevant tests]
- Integration tests: [Relevant tests]
- Type checking: [Command, if configured]
- Linting: [Command, if configured]
- Build: [Command, if appropriate]
- Manual verification: [Required scenario]

Use actual repository commands. Do not invent commands that do not exist.

## 8. Documentation Requirements

Update the relevant documentation only where necessary.

- `PRD.md`: if requirements change.
- `SYSTEM_DESIGN.md`: if architecture changes.
- `API_DESIGN.md`: if API contracts change.
- `DOMAIN_RULES.md`: if domain behavior changes.
- `LOGGING.md`: if logging behavior changes.
- `TESTING.md`: if testing strategy changes.
- `README.md`: if setup or user instructions change.
- `DECISIONS.md`: if a significant technical decision is made.
- `CHANGELOG.md`: for every completed feature or meaningful modification.

## 9. Final Response Format

After implementation, report:

### Changes
- What was implemented.
- Which files were modified.

### Verification
- Tests and checks actually executed.
- Their actual outcomes.
- Any checks not executed and why.

### Documentation
- Documents updated.
- Changelog entry added.

### Remaining Issues
- Known limitations.
- Unresolved blockers.
- Any follow-up work necessary.

Do not claim that the task is complete if a required acceptance criterion remains unmet.