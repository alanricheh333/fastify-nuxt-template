# Delivery Workflow

This repository is intended to support autonomous agent work while preserving human review and production safety.

## Task intake

For every task:

1. Read the complete request, linked ticket, acceptance criteria, and relevant repository documentation.
2. Restate the implementation goal internally as a small set of verifiable outcomes.
3. Inspect the existing slice/use case before changing structure.
4. Identify missing information that could materially change business behavior, architecture, security, data ownership, API/event contracts, or destructive actions.
5. Ask for clarification when such ambiguity exists.
6. Otherwise choose the smallest reversible assumption consistent with existing patterns and document it in the task/PR summary.

Do not invent product behavior that is absent from the requirements.

## Planning

Before coding, create a concise implementation plan that includes:

- affected slice/use case
- public contract/facade changes
- business rules to add/change
- data/query/repository changes
- DTO/schema changes
- tests to write
- migration implications
- security/authorization considerations
- deployment/backwards-compatibility considerations

Split large work into small steps that can each be validated.

## Implementation order

Preferred order:

1. Tests for new/changed business rules.
2. Pure rules/domain behavior.
3. Types/const/errors needed by the behavior.
4. Repository/database operations required by commands.
5. Query/read models required by reads.
6. Service orchestration.
7. Facade exposure.
8. HTTP/event/job transport adaptation.
9. End-to-end tests when they provide useful use-case confidence.
10. README/documentation updates.
11. Full validation.

This order is a default, not a reason to produce awkward code. Preserve architectural clarity.

## Scope discipline

- Change only what is needed for the task.
- Do not perform unrelated refactors.
- Do not rename broad areas of the codebase unless required.
- Reuse existing conventions that comply with `AGENTS.md` and `docs/ARCHITECTURE.md`.
- Do not introduce new frameworks, architectural layers, or runtime dependencies without a concrete need.

## Use-case README

Every implemented slice/use case must contain a `README.md`.

When touching a use case, update the README if any of the following changed:

- purpose/behavior
- facade/public operations
- HTTP/event entry points
- business rules
- important inputs/outputs
- data reads/writes
- emitted/consumed events
- authorization/security considerations
- operational or production considerations

Recommended README shape:

```md
# <Use case name>

## Purpose

## Public facade

## Entry points

## Business rules

## Data interactions

## Events

## Security / authorization

## Operational notes
```

Keep README content concise and behavioral. Do not duplicate implementation line by line.

## Validation before completion

Run the relevant repository commands for:

- formatting, if configured
- linting
- TypeScript/type checking
- architecture/dependency rules
- changed rule unit tests
- affected slice/unit test suite
- relevant E2E tests
- build

Also inspect the final diff manually.

Verify:

- requirements and acceptance criteria are satisfied
- no business decisions leaked into services
- every changed/new rule is pure and unit tested
- HTTP/events call only the facade
- queries are read-only
- DTOs remain at boundaries
- no unsafe direct SQL string interpolation exists
- authorization/security checks are present where needed
- production behavior has been considered
- migrations are safe and backwards-compatible where required
- use-case README is current
- no unrelated files were changed

## Pull requests

When publishing work as a PR, prefer a draft PR until implementation and validation are complete.

PR description should include:

- task/ticket reference
- summary of behavior implemented
- architecture notes when relevant
- tests/validation executed
- database/migration impact
- security considerations
- preview/deployment notes when available
- assumptions, limitations, or known risks

Never merge the PR unless explicitly instructed by the user.

## CI and preview environments

Treat CI as an independent verification layer. Local/agent tests passing do not replace CI.

Preview environments should be created by deterministic CI/hosting workflows rather than ad-hoc agent state.

When a preview environment exists, use it to verify meaningful user-facing flows before marking work ready for human review.

## Production

A merge to the protected production branch may trigger deployment workflows. Do not bypass branch protection, CI gates, environment approvals, or production safety controls.

If a change requires an unsafe one-step database/schema/application rollout, redesign it into a backwards-compatible migration path where practical.

## Graceful shutdown

The API listens for `SIGTERM` and `SIGINT` and begins graceful shutdown rather than terminating immediately.

Shutdown behavior should remain ordered and explicit:

1. stop accepting new HTTP work through `app.close()`
2. allow Fastify to complete in-flight requests
3. close registered application resources such as database pools, queues, consumers, schedulers, or workers
4. finish before `SHUTDOWN_TIMEOUT_MS`; a timeout or cleanup failure should result in a non-zero exit code

Any long-lived resource added to the application must participate in the shutdown lifecycle through the composition root. For example, when the database client is instantiated there, register its `close()` function as a cleanup callback.

Deployment infrastructure should allow at least the configured shutdown timeout between sending `SIGTERM` and force-killing the process. If a future product adds long-running jobs, queue consumers, or scheduled work, define how they stop accepting new jobs and whether active work is completed, requeued, or abandoned before deployment.
