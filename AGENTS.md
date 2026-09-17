# Agent Instructions

This repository is designed to be implemented and maintained by coding agents as well as humans. Follow these instructions for every task.

## Priority

1. The explicit task requirements and acceptance criteria.
2. This `AGENTS.md`.
3. The referenced documentation under `docs/`.
4. Existing local patterns, when they do not conflict with the rules above.

If requirements conflict, stop and ask for clarification before changing behavior.

## Before implementing

1. Read the task, acceptance criteria, this file, and the relevant files in `docs/`.
2. Inspect the existing slice and neighboring slices before introducing a new pattern.
3. Identify whether the requested work belongs in an existing business-process slice or requires a new slice/use case.
4. Write a short implementation plan and split the work into small, verifiable steps.
5. Identify the business rules that must be expressed as pure functions and tested first.
6. Identify security, authorization, data integrity, migration, production, and backwards-compatibility implications.

Ask for clarification when ambiguity can materially change business behavior, architecture, security, data ownership, API/event contracts, destructive actions, or production behavior. For small reversible implementation details, choose the simplest consistent option and document the assumption.

## Architecture

Read `docs/ARCHITECTURE.md` before modifying application structure.

Core rules:

- Organize backend code by business-process feature slices, not by entities or framework modules.
- A slice represents a business capability or workflow and may span multiple entities/tables.
- The slice facade is its public application boundary.
- HTTP handlers, event handlers, jobs, and other slices access a slice through its facade.
- Services are orchestration only. They contain no business decisions.
- Business decisions live in pure rule functions.
- Queries are read-only and may fetch/join/aggregate across tables directly.
- Repository functions perform narrow database operations used by orchestration code.
- Database code may start inside a slice and be promoted to `shared/db` when ownership/reuse becomes genuinely cross-slice.
- Keep framework concerns at system boundaries. Rules and application types must not depend on Fastify, Drizzle, Nuxt, or transport-specific DTOs.

## Services

A service coordinates work only. It may load data, call rules, persist results, publish events, coordinate transactions, and return results.

A service must not contain business branching or business decisions. Do not put business conditions in `if`, `switch`, ternary expressions, policy checks, eligibility checks, state-transition decisions, calculations, or similar logic inside a service. Move such decisions into a rule.

Technical sequencing is allowed, but the service should read as a workflow rather than a decision tree.

## Rules

- One exported rule function per rule file.
- Rules are pure functions.
- Rules do one business thing.
- Rules have no framework, database, filesystem, network, clock, random, environment, or global-state dependency.
- Pass every value needed by a rule explicitly as plain input.
- Private helper functions are allowed in the same rule file when they improve readability.
- Every rule must have colocated unit tests.
- Rule unit tests use plain inputs and outputs/errors and must not use mocks.

## Files and exports

Prefer functions over classes unless a framework or concrete technical reason makes a class clearly better.

Default rule: one primary export per file.

- Rule file: one exported rule function.
- Service file: one exported service function/factory.
- Query file: one exported query function/factory.
- Repository file: one exported repository function/factory.
- Type file: one exported type.
- Const file: one exported constant.
- Error file: one exported error.
- Entity/table file: one exported entity/table definition.

Private helpers may remain in the same file.

Facades and framework controllers/handlers may expose multiple methods/handlers when that is the natural cohesive boundary.

Do not create a folder for a concern that has only one file. When a concern grows to multiple files, create the corresponding folder (`rules/`, `types/`, `const/`, `errors/`, `dto/`, `db/`, etc.).

## HTTP and events

- HTTP and event code are transport adapters.
- They validate/deserialize external input, map it to application input, call the facade, and serialize/map the output.
- They must not call services, rules, repositories, or database tables directly.
- Transport DTOs/schemas stay at the transport boundary and must not leak into rules or repositories.
- Prefer Fastify schemas/type providers for request validation and response serialization rather than manual parsing when the framework can do it safely.

## Queries

- Queries are parallel to services and are called by the facade.
- Queries are strictly read-only.
- Queries may access multiple tables directly and use SQL/Drizzle joins, aggregation, projections, and optimized read shapes.
- Queries return dedicated projection/read-model types rather than persistence entities.
- Do not hide business decisions inside SQL queries.
- Queries must not call services or mutate application state.

## Database and time

- Prefer PostgreSQL and Drizzle for database access.
- Use parameterized/query-builder database access; never build SQL from untrusted string interpolation.
- Use narrow, intention-revealing repository functions rather than generic CRUD repositories.
- Store real instants as PostgreSQL `timestamptz`, normalized to UTC.
- Transport instants as ISO-8601 UTC strings.
- Convert to local time only at presentation boundaries or when a business rule explicitly requires a timezone.
- Use PostgreSQL `date` for timezone-independent calendar dates.
- Preserve an IANA timezone separately when local-time scheduling intent is part of the business meaning.
- Never rely on the server machine's local timezone.

## Testing

Read `docs/TESTING.md` before adding or changing behavior.

The development loop is test-driven where practical:

1. Express expected business behavior with tests.
2. Implement the smallest correct rule/application change.
3. Run the focused tests.
4. Refactor while keeping tests green.
5. Run the relevant broader validation.

Rules require unit tests. Do not write unit/spec tests for orchestration services merely to test call ordering or mocks. Add end-to-end tests when they provide useful confidence for a complete use case, HTTP/event contract, or feature-slice flow.

## Security and production readiness

Read `docs/SECURITY.md` for every externally reachable or data-changing feature.

Treat all external input as untrusted. Consider authentication, authorization, tenant/user ownership, abuse, rate limiting, injection, mass assignment, data exposure, secrets, logging, replay/idempotency, concurrency, and resource exhaustion.

Never weaken security controls merely to make a test pass. Never commit secrets or production credentials.

Always consider both development and production behavior. Avoid solutions that work only because of local state, local filesystem assumptions, development-only services, permissive CORS, disabled TLS, or machine-specific configuration.

## Documentation

Every feature slice/use case must contain a `README.md` once it is implemented.

Whenever a task touches a use case, update its README when behavior, architecture, API/event contract, rules, data flow, dependencies, or operational considerations changed.

The README should explain what the use case does, its public facade operations, entry points, business rules, important data interactions, relevant events, and meaningful implementation/operational notes. Do not turn it into a line-by-line code description.

## Delivery

Read `docs/DELIVERY.md` before completing a task.

Before declaring work complete:

- Re-read the requirements and acceptance criteria.
- Review the diff for unrelated changes.
- Run relevant unit tests, type checks, linting, architecture checks, and build steps.
- Run relevant end-to-end tests where they add feature-level confidence.
- Confirm new/changed rules have unit coverage.
- Confirm use-case documentation is current.
- Review security and production implications.
- Report what was implemented, what was tested, and any remaining risks or assumptions.

Never merge a pull request unless the user explicitly instructs you to do so.