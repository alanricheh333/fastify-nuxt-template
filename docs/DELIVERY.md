# Delivery Workflow

This repository is intended to support autonomous agent work while preserving human review and production safety.

## Task intake

For every task:

1. Read the complete request, linked ticket, acceptance criteria, and relevant repository documentation.
2. If the task originated from a product backlog, verify that the ticket follows `docs/TICKET_TEMPLATE.md` closely enough to remove material ambiguity.
3. Restate the implementation goal internally as a small set of verifiable outcomes.
4. Inspect the existing slice/use case before changing structure.
5. Identify missing information that could materially change business behavior, architecture, security, data ownership, API/event contracts, or destructive actions.
6. Ask for clarification when such ambiguity exists.
7. Otherwise choose the smallest reversible assumption consistent with existing patterns and document it in the task/PR summary.

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

The repository CI workflow runs on pull requests and pushes to `main` or `integration`. It currently performs, in order:

1. repository checkout
2. Node setup from `.nvmrc`
3. Corepack/pnpm setup using the repository-pinned package manager
4. `pnpm install --frozen-lockfile`
5. type checking
6. linting
7. architecture/dependency rules
8. unit/component tests
9. repository build
10. Drizzle migration/schema check
11. apply committed migrations to disposable PostgreSQL
12. API E2E tests against that real PostgreSQL database
13. install Playwright Chromium
14. browser E2E tests

A dependency change is incomplete until the committed lockfile is updated. CI intentionally rejects package manifests that do not match `pnpm-lock.yaml`.

Preview environments are governed by [`docs/PREVIEWS.md`](PREVIEWS.md). They must be created and updated by deterministic CI/hosting workflows rather than ad-hoc agent state.

The intended flow is:

```text
PR opened/updated
→ required CI passes
→ PR-scoped preview database/resources are resolved
→ committed migrations run once
→ API/web preview is deployed
→ readiness succeeds
→ preview URL/status is attached to the PR
→ human verifies behavior
→ merge/close triggers automatic teardown
```

Agents may inspect preview results and use the preview during validation, but they must not manually create untracked preview infrastructure or bypass teardown/security rules.

When a preview environment exists, use it to verify meaningful user-facing flows before marking work ready for human review.

## Runtime configuration

Runtime environment variables are parsed once at API startup through the centralized runtime configuration layer. Infrastructure modules must consume the typed configuration passed to them rather than reading `process.env` independently.

Configuration rules:

- fail startup immediately when required values are missing or malformed
- keep development-safe defaults explicit
- parse booleans and numeric values centrally rather than at call sites
- add new runtime variables to `.env.example`, the runtime config type/parser, and parser tests together
- do not open long-lived resources before runtime configuration has validated successfully
- secrets remain environment/deployment configuration and must never be committed

## Production

A merge to the protected production branch may trigger deployment workflows. Do not bypass branch protection, CI gates, environment approvals, or production safety controls.

If a change requires an unsafe one-step database/schema/application rollout, redesign it into a backwards-compatible migration path where practical.

Production deployment, migration, configuration, proxy, preview, and observability guidance lives in the dedicated documents referenced by `docs/SPINOFF.md`.

## Graceful shutdown

The API listens for `SIGTERM` and `SIGINT` and begins graceful shutdown rather than terminating immediately.

Shutdown behavior should remain ordered and explicit:

1. mark the instance not ready so infrastructure can stop routing new traffic to it
2. stop accepting new HTTP work through `app.close()`
3. allow Fastify to complete in-flight requests
4. close registered application resources such as database pools, queues, consumers, schedulers, or workers
5. finish before `SHUTDOWN_TIMEOUT_MS`; a timeout or cleanup failure should result in a non-zero exit code

Any long-lived resource added to the application must participate in the shutdown lifecycle through the composition root. For example, when the database client is instantiated there, register its `close()` function as a cleanup callback.

Deployment infrastructure should allow at least the configured shutdown timeout between sending `SIGTERM` and force-killing the process. If a future product adds long-running jobs, queue consumers, or scheduled work, define how they stop accepting new jobs and whether active work is completed, requeued, or abandoned before deployment.

## Health checks

The API exposes separate liveness and readiness endpoints:

- `GET /health/live` answers whether the Node/Fastify process is alive. Keep this check lightweight and do not add database or external-service calls to it.
- `GET /health/ready` answers whether the instance is ready to receive production traffic. It returns `503` when the application is shutting down or when any registered readiness dependency check fails.

Readiness checks are registered explicitly in the composition root as infrastructure dependencies are added. For example, once the application owns a PostgreSQL client at startup, register a lightweight database readiness check there. Do not fake dependency checks when the dependency is not yet part of the application lifecycle.

Liveness and readiness endpoints are exempt from application rate limiting so deployment infrastructure can probe them reliably.
