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
- Organize frontend code by user-facing business-process feature slices, not by generic technical buckets.
- A slice represents a business capability or workflow and may span multiple entities/tables/components.
- The backend slice facade is its public application boundary.
- HTTP handlers, event handlers, jobs, and other slices access a backend slice through its facade.
- Services are orchestration only. They contain no business decisions.
- Business decisions live in pure rule functions.
- Queries are read-only and may fetch/join/aggregate across tables directly.
- Repositories are entity-focused persistence boundaries and may expose multiple cohesive, intention-revealing operations for that entity.
- Database code may start inside a slice and be promoted to `shared/db` when ownership/reuse becomes genuinely cross-slice.
- Keep framework concerns at system boundaries. Rules and application types must not depend on Fastify, Drizzle, Nuxt, or transport-specific DTOs.
- Nuxt pages/layouts are composition boundaries and should stay thin.
- Vue components focus on rendering and interaction; feature logic belongs in slice composables/pure functions.
- Pinia Colada owns server/async state; Pinia owns genuinely shared client state; local UI state stays local.

## Services

A service coordinates work only. It may load data, call rules, persist results, publish events, coordinate transactions, and return results.

A service may expose multiple cohesive operations when they belong to the same use case or capability. Do not split services into one file per function merely for symmetry.

A service must not contain business branching or business decisions. Do not put business conditions in `if`, `switch`, ternary expressions, policy checks, eligibility checks, state-transition decisions, calculations, or similar logic inside a service. Move such decisions into a rule.

Technical sequencing is allowed, but the service should read as a workflow rather than a decision tree.

The service/use case owns the transaction boundary when several persistence operations must succeed or fail atomically. A private helper in the same service file may encapsulate transaction orchestration for readability. Private transaction helpers must remain orchestration-only and must not contain business decisions.

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

Use cohesion, not arbitrary file splitting, as the default boundary.

- Rule file: exactly one exported rule function.
- Query file: one exported query function/factory per read model/projection.
- Type file: one exported type.
- Const file: one exported constant.
- Error file: one exported error.
- Table file: one exported persistence table definition.
- Service file: may expose multiple cohesive operations for the same use case/capability.
- Repository file: one repository per persistence entity; it may expose multiple cohesive persistence operations for that entity.
- Facade: may expose multiple public operations for the slice.
- HTTP/event registrar/controller: may expose or register multiple related handlers.

Private helpers may remain in the same file.

Do not create a folder for a concern that has only one file. When a concern grows to multiple files, create the corresponding folder (`rules/`, `types/`, `const/`, `errors/`, `dto/`, `db/`, `components/`, `composables/`, `queries/`, `mutations/`, etc.).

## HTTP and events

- HTTP and event code are transport adapters.
- They validate/deserialize external input, map it to application input, call the facade, and serialize/map the output.
- They must not call services, rules, repositories, or database tables directly.
- Transport DTOs/schemas stay at the transport boundary and must not leak into rules or repositories.
- Prefer Fastify schemas/type providers for HTTP request validation and response serialization rather than manual parsing when the framework can do it safely.
- Every HTTP endpoint must be documented through the Fastify/OpenAPI schema with clear summary, description, relevant tags, request schema, response schema, security requirements, and meaningful error responses.
- The runtime endpoint schema is the source of truth for Swagger/OpenAPI documentation.

## Queries

- Queries are parallel to services and are called by the facade.
- Queries are strictly read-only.
- Queries may access multiple tables directly and use SQL/Drizzle joins, aggregation, projections, and optimized read shapes.
- Queries return dedicated projection/read-model types.
- Queries may import slice-local DTOs/read-model types and shared code where useful.
- Do not hide business decisions inside SQL queries.
- Queries must not call services or mutate application state.

## Frontend slices

Read the frontend section of `docs/ARCHITECTURE.md` and `docs/DESIGN_SYSTEM.md` before modifying Nuxt UI code.

- Use Nuxt UI as the default component/design-system foundation.
- Keep Nuxt `pages/` and `layouts/` thin; they compose slices and framework concerns only.
- Put feature-specific UI behavior inside `app/slices/<business-process>/`.
- Components render state, handle interaction, emit events, and call feature composables; they do not own business rules or complex orchestration.
- Composables orchestrate frontend behavior but must not become dumping grounds. Extract deterministic logic into pure functions.
- API files handle transport only.
- Pinia Colada is the default for remote/server state, queries, mutations, caching, invalidation, and optimistic updates.
- Pinia is for genuinely shared client-side state only.
- Vue refs/reactive/computed are for local state.
- Do not duplicate server state from Pinia Colada into Pinia without a concrete reason.
- Do not import deep internals of another frontend slice; use a small public surface or promote generic code to `shared`.
- User-facing strings must be localized. English and Arabic are first-class and UI must work in both LTR and RTL.
- Because the frontend is a PWA, consider mobile/responsive behavior, stale/offline/degraded-network behavior, installability, and safe browser storage.
- Do not introduce another general-purpose component library without an explicit architectural reason.
- Use semantic design tokens rather than feature-local hard-coded colors or arbitrary visual conventions.

## Components and frontend tests

- Keep components cohesive and specific to their UI responsibility.
- Prefer Nuxt UI primitives before inventing custom generic primitives.
- Do not wrap every Nuxt UI component; create shared application components only when they add genuine reusable semantics or behavior.
- Promote components to `shared/components` only when they are genuinely reusable and not feature-specific.
- Component test naming: `ComponentName.comp.test.ts` next to `ComponentName.vue` unless the local structure clearly requires a component folder.
- Component tests verify observable rendering/interaction behavior rather than Vue implementation details.
- Do not duplicate authoritative backend business-rule tests in frontend component tests.
- Verify direction-sensitive components and flows in RTL when Arabic affects layout or interaction.

## Database and time

- Prefer PostgreSQL and Drizzle for database access.
- Use parameterized/query-builder database access; never build SQL from untrusted string interpolation.
- Name Drizzle persistence-definition files `*.table.ts`; export the table with the plain entity name (for example `application` from `application.table.ts`).
- Keep table definitions declarative and free of business behavior.
- Prefer one repository per persistence entity. Repository methods should be intention-revealing and added because the application needs them; avoid generic CRUD dumping grounds.
- A slice owns its persistence entities unless ownership becomes genuinely broad. Reuse by more than three slices is a strong heuristic for promotion to `shared/db`, not an absolute law.
- Cross-slice writes and business behavior go through the owning slice facade. Another slice must not directly use the owning slice repository for writes/behavior.
- Read-only queries may directly read/join tables across slices when building projections.
- Services own transaction boundaries for multi-step atomic workflows; repositories accept the provided database/transaction context rather than starting independent transactions that hide the use-case boundary.
- Generate migrations explicitly with Drizzle Kit, review every generated migration, and allow reviewed manual SQL for PostgreSQL-specific needs. Never auto-run destructive production migrations blindly.
- Store API migrations under `apps/api/drizzle/`.
- Store real instants as PostgreSQL `timestamptz`, normalized to UTC.
- Transport instants as ISO-8601 UTC strings.
- Convert to local time only at presentation boundaries or when a business rule explicitly requires a timezone.
- Use PostgreSQL `date` for timezone-independent calendar dates.
- Preserve an IANA timezone separately when local-time scheduling intent is part of the business meaning.
- Never rely on the server machine's local timezone.

## Testing

Read `docs/TESTING.md` before adding or changing behavior.

The development loop is test-driven where practical:

1. Express expected behavior with a test at the correct boundary.
2. Implement the smallest correct change.
3. Run the focused tests.
4. Refactor while keeping tests green.
5. Run the relevant broader validation.

Backend rules require unit tests. Do not write unit/spec tests for orchestration services merely to test call ordering or mocks. Add component tests for meaningful Vue behavior and end-to-end tests when they provide useful confidence for a complete use case, HTTP/event contract, feature-slice flow, or critical user flow.

## Security and production readiness

Read `docs/SECURITY.md` for every externally reachable or data-changing feature.

Treat all external input as untrusted. Consider authentication, authorization, tenant/user ownership, abuse, rate limiting, injection, mass assignment, data exposure, secrets, logging, replay/idempotency, concurrency, and resource exhaustion.

Never weaken security controls merely to make a test pass. Never commit secrets or production credentials.

Always consider both development and production behavior. Avoid solutions that work only because of local state, local filesystem assumptions, development-only services, permissive CORS, disabled TLS, or machine-specific configuration.

The backend will use centralized custom error handling with a consistent external error contract. Until that infrastructure is implemented, do not invent incompatible per-endpoint error shapes; keep error definitions explicit and easy to migrate to the shared handler.

## Documentation

Every feature slice/use case must contain a `README.md` once it is implemented.

Whenever a task touches a use case, update its README when behavior, architecture, API/event contract, rules, data flow, dependencies, frontend behavior, or operational considerations changed.

The README should explain what the use case does, its public facade/API interactions, entry points, business rules, important data interactions, relevant events, frontend behavior when applicable, and meaningful implementation/operational notes. Do not turn it into a line-by-line code description.

## Delivery

Read `docs/DELIVERY.md` before completing a task.

Before declaring work complete:

- Re-read the requirements and acceptance criteria.
- Review the diff for unrelated changes.
- Run relevant unit tests, component tests, type checks, linting, architecture checks, and build steps.
- Run relevant end-to-end tests where they add feature-level confidence.
- Confirm new/changed backend rules have unit coverage.
- Confirm changed Vue components have appropriate component coverage when behavior warrants it.
- Confirm use-case documentation is current.
- Confirm HTTP endpoint schemas keep Swagger/OpenAPI accurate.
- Review security and production implications.
- Report what was implemented, what was tested, and any remaining risks or assumptions.

Never merge a pull request unless the user explicitly instructs you to do so.