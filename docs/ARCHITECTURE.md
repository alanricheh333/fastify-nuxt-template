# Architecture

## Core idea

The backend is organized around business-process feature slices. A slice represents a business capability or workflow, not an entity, database table, or framework module.

Examples of slices/use cases:

- register-user
- post-gig
- apply-to-gig
- accept-application
- complete-gig

A slice may coordinate several entities and tables.

Root backend structure:

```text
src/
  slices/
  shared/
  app.ts
  server.ts
```

## Slice shape

Keep small slices flat. Create a folder for a concern only after that concern has more than one file.

Example small slice:

```text
apply-to-gig/
  apply-to-gig.http.ts
  apply-to-gig.facade.ts
  apply-to-gig.service.ts
  get-application-details.query.ts
  can-apply-to-gig.rule.ts
  apply-to-gig-input.type.ts
  README.md
```

Example grown slice:

```text
apply-to-gig/
  apply-to-gig.facade.ts
  apply-to-gig.service.ts
  http/
  rules/
  queries/
  types/
  const/
  errors/
  dto/
  db/
  README.md
```

## Nested use cases

A top-level slice may contain multiple related use cases when they belong to one broader business capability.

```text
gig-management/
  gig-management.facade.ts
  create-gig/
  publish-gig/
  edit-gig/
  cancel-gig/
```

Each nested use case follows the same architectural rules. Keep the public facade at the slice root when it represents the capability boundary.

Do not create nested use-case folders merely for visual symmetry. Use them when the slice contains multiple distinct workflows.

## Public boundary: facade

The facade is the public application boundary of a slice.

Allowed entry flow:

```text
HTTP ───────┐
Events ─────┼──> Facade ──> Service / Query
Jobs ───────┤
Other slice ┘
```

External callers must not bypass the facade to reach service, query, rules, repositories, or tables directly.

The facade may expose multiple operations because it represents a cohesive public boundary.

The facade must remain thin. It delegates commands to services and reads to queries; it does not contain business logic.

The facade may import slice-local DTOs/types and shared code when useful for mapping or exposing the public contract.

## Service

A service is an orchestrator.

Typical command flow:

```text
load data
  -> invoke rule(s)
  -> persist state
  -> emit event(s)
  -> return result
```

Services may:

- call repository functions
- call query/load functions
- invoke rules
- coordinate transactions
- persist results
- emit events
- map technical/application results
- import slice-local DTOs/types and shared code when useful

A service may expose multiple cohesive operations when they belong to the same use case or capability. Do not force one exported service function per file when that would fragment one cohesive workflow.

Services must not make business decisions.

Business conditions such as eligibility, state transitions, pricing, limits, authorization policies tied to domain rules, or calculations belong in rules.

Service code should not contain business `if`, `switch`, or ternary branching. If orchestration appears to require a business branch, extract the decision into a rule and orchestrate the rule's result.

Technical failure propagation and framework-neutral sequencing are allowed, but keep services linear and explicit.

### Transactions

The service/use case owns the transaction boundary when several persistence operations must succeed or fail atomically.

A private helper in the same service file may encapsulate the transaction block for readability. Private transaction helpers are orchestration helpers only and must not introduce business decisions.

Repositories should accept the provided database/transaction context rather than starting hidden independent transactions that prevent the use case from controlling atomicity.

## Rules

Rules contain business logic.

A rule:

- is a pure function
- does one business thing
- receives all input explicitly
- produces a deterministic output or business error
- has no framework dependency
- has no database/network/filesystem/environment/global-state dependency
- can be unit tested using plain values

One exported rule function per file. Private helper functions may remain in the same file.

Every rule must have colocated unit tests.

## Queries

Queries are the read side and are parallel to services.

```text
Facade
  ├── Service -> commands/state changes
  └── Query   -> reads/projections/aggregation
```

Queries:

- are read-only
- may access several tables directly, including tables owned by other slices when building projections
- may use Drizzle/SQL joins, aggregation, grouping, projections, CTEs, and optimized read shapes
- may bypass repositories for reads when direct SQL is clearer or more efficient
- return dedicated read-model/projection types
- may import slice-local DTOs/read-model types and shared code where useful
- must not mutate state
- must not contain business decisions
- must not call services

Use one query file per cohesive read model/projection. Do not combine unrelated projections into one generic query object.

Do not force a read across multiple repositories and then combine the results in application code when one clear SQL query can produce the correct projection.

## HTTP and events

HTTP and event handlers are transport adapters.

Their responsibilities are:

- validate/deserialize external input
- authenticate/obtain identity context where appropriate
- map transport DTOs to facade/application input
- call the facade
- map/serialize the output
- map known application errors to transport responses

They must not call services, rules, repositories, or database tables directly.

Use Fastify schemas/type providers for HTTP request validation and response serialization where practical. Keep Fastify-specific DTO/schema code at the HTTP boundary.

Event payload schemas/DTOs follow the same principle.

A cohesive HTTP/event registrar may contain multiple related handlers. Do not create one controller/route file per endpoint unless size or cohesion justifies it.

## DTOs

DTOs represent transport/application contracts. They are not persistence models and must not contain business behavior.

Facade, service, and query code may import slice-local DTOs when that keeps the contract explicit and does not leak framework-specific behavior.

Rules and repositories should remain independent of transport-specific DTO concerns.

## Swagger / OpenAPI

Every HTTP endpoint must be documented through the Fastify schema/OpenAPI setup.

Each endpoint should define, where relevant:

- tags
- summary
- clear description
- path parameters
- query parameters
- request body
- success response schemas
- relevant error response schemas
- authentication/security requirements

The runtime validation/serialization schema should be the source of truth for generated API documentation. Do not maintain separate hand-written API documentation that can drift from the actual endpoint contract.

Use a consistent shared error response schema once centralized API error handling is introduced. The exact error-handling implementation is intentionally deferred until the Fastify template is scaffolded.

## Database placement and ownership

Database infrastructure such as the Drizzle client, connection/configuration, transaction-related types/helpers, and broadly shared DB utilities live under `src/shared/db`.

Persistence tables and repositories normally live with the slice that owns the corresponding business data.

Example:

```text
some-slice/
  db/
    application.table.ts
    application.repository.ts
```

A slice remains the owner of an entity even when a small number of other slices need behavior involving it. Those other slices must go through the owning slice facade for writes and business behavior.

Reuse by more than three slices is a strong heuristic that ownership may have become genuinely shared and the table/repository may belong under `src/shared/db`. This is not an absolute mechanical threshold: semantic ownership matters more than import count.

Do not let the first implemented slice become the accidental permanent owner of a truly platform-level entity merely because it introduced it first.

Cross-slice read-only queries are different: a query may directly join/read another slice's table when building a projection because queries are the read side and do not own behavior.

## Repositories

Use one repository per persistence entity.

Example:

```text
application.table.ts
application.repository.ts
```

A repository may expose multiple cohesive persistence operations for its entity, for example:

- `findById`
- `findActiveByStudent`
- `insert`
- `markAccepted`

Prefer explicit intention-revealing methods over broad overloaded or generic APIs such as `find`, `save`, or a catch-all CRUD surface when more specific operations make intent clearer.

Repositories may use a provided Drizzle database/transaction context. They should not decide transaction boundaries themselves when the use case needs several operations to be atomic.

A repository must not contain business policy.

## Tables

Use `*.table.ts` for Drizzle persistence definitions.

Example:

```text
application.table.ts
```

Export the table using the plain entity name:

```ts
export const application = pgTable(...)
```

Avoid suffixing the exported value with `Entity` or `Table` unless a concrete naming collision requires it.

Table declarations represent persistence shape only. Keep them declarative and free of business behavior.

## Migrations

Store API migrations under:

```text
apps/api/drizzle/
```

Generate migrations explicitly with Drizzle Kit from reviewed schema changes.

Every generated migration must be reviewed before use. Manual SQL migrations are acceptable when PostgreSQL-specific behavior, data movement, indexing, or operational safety makes them clearer or safer.

Never auto-run destructive production migrations blindly.

## Shared code

`src/shared` is for genuinely cross-cutting or broadly shared code.

Potential examples:

```text
shared/
  db/
  utils/
  types/
  const/
  errors/
```

Do not move business-specific rules to `shared` merely because two places use them. Shared helpers should generally be domain-agnostic or represent genuinely shared infrastructure/contracts.

Avoid turning `shared` into a dumping ground.

`shared` may be imported by slices, but `shared` must not depend back on slices.

## Files and folders

Prefer a flat use-case directory while there is only one file for a concern.

Example:

```text
apply-to-gig/
  can-apply-to-gig.rule.ts
```

Once several rules exist:

```text
apply-to-gig/
  rules/
    can-apply-to-gig.rule.ts
    calculate-application-state.rule.ts
```

Use analogous behavior for `types`, `const`, `errors`, `dto`, `queries`, `db`, etc.

## Exports and cohesion

Use cohesion rather than an arbitrary one-function-per-file rule.

- rules: exactly one exported rule function per file
- queries: one cohesive read model/projection per file
- types: one exported type per type file
- const: one exported constant per const file
- errors: one exported error per error file
- tables: one exported persistence table definition per table file
- services: may expose multiple cohesive operations for the same use case/capability
- repositories: one repository per entity, with multiple cohesive entity-specific persistence methods allowed
- facades: multiple public operations are expected when they form one slice boundary
- HTTP/event registrars/controllers: multiple related handlers are allowed

Private helper functions/types/constants may remain internal to the file.

## Dependency direction

Desired direction:

```text
transport (http/events/jobs)
        ↓
      facade
      ↙   ↘
 service  query
   ↓       ↓
 rules    db/tables
   ↓
 repositories/db
```

Rules are the most framework-independent layer and must not depend outward on transport or infrastructure.

Repositories and queries must not depend on services, facades, HTTP, or events.

HTTP/events must not bypass the facade.

Cross-slice writes and business behavior go through the target slice facade rather than importing its internals.

Read-only queries may directly read cross-slice tables for projections.

## Time and dates

For real instants:

- PostgreSQL: use `timestamptz`
- normalize/store as UTC
- transport as ISO-8601 UTC strings
- parse/convert to local timezone only at boundaries or when a business rule explicitly requires a timezone
- never rely on server local timezone

For timezone-independent dates such as a birthday, use PostgreSQL `date`.

If local-time scheduling intent matters, preserve the IANA timezone (for example `Asia/Damascus`) separately from the instant.

# Frontend Architecture

## Core idea

The Nuxt frontend follows the same business-process feature-slice philosophy as the backend, but the internal concerns are frontend-specific. Do not mirror backend folders mechanically.

Use Nuxt framework directories for framework responsibilities and feature slices for product behavior.

Recommended high-level shape:

```text
app/
  pages/
  layouts/
  slices/
  shared/
  app.vue
```

A frontend slice represents a user-facing business capability or workflow, not a page, database entity, or generic component category.

Examples:

- browse-gigs
- apply-to-gig
- manage-posted-gig
- review-applications

## Pages and layouts

Nuxt `pages/` and `layouts/` are framework/router composition boundaries.

Pages should remain thin. They may:

- read route information
- compose feature-slice components
- provide page-level layout/composition

Pages must not contain business logic, server-state orchestration, or reusable feature logic.

Move feature behavior into the relevant slice.

## Frontend slice shape

Keep slices flat while small.

Example:

```text
apply-to-gig/
  ApplyToGigForm.vue
  use-apply-to-gig.ts
  apply-to-gig.api.ts
  apply-to-gig.mutation.ts
  apply-to-gig.type.ts
  README.md
```

When multiple files exist for a concern, create a folder:

```text
apply-to-gig/
  components/
  composables/
  api/
  queries/
  mutations/
  types/
  const/
  README.md
```

Follow the same anti-spam rule as the backend: do not create folders for a single file without a concrete reason.

## Components

Components should be focused on rendering and user interaction.

A component may:

- receive props
- emit events
- render state
- manage truly local UI state
- call a feature composable

A component should not:

- contain business rules
- perform reusable calculations that belong in pure functions
- directly coordinate multiple API calls
- own cache invalidation strategy
- duplicate server state into global stores
- reach into another slice's internals

Keep components specific to the UI responsibility they serve. Avoid generic-looking components that secretly contain feature-specific behavior.

Promote a component to `shared/components` only when it is genuinely reusable across unrelated slices and is not business-specific.

## Composables

Feature composables orchestrate frontend behavior for a slice.

They may coordinate:

- local UI state
- Pinia Colada queries/mutations
- navigation effects
- user interaction flow
- mapping between API data and view state

Do not move business complexity from components into oversized composables. Extract deterministic decisions/calculations into pure functions and test them independently.

## State management

Use the smallest state mechanism that fits the ownership of the state.

### Pinia Colada

Use Pinia Colada for server/async state:

- remote queries
- mutations
- caching
- invalidation
- optimistic updates when appropriate
- loading/error state related to server operations

Do not copy Pinia Colada server data into Pinia merely to make it globally available.

### Pinia

Use Pinia for genuinely shared client-side application state, for example:

- authenticated-user/session client metadata where appropriate
- selected language/preferences
- application-wide UI preferences
- multi-step workflow state that must survive navigation
- drafts that intentionally persist across unrelated components/routes

Do not use Pinia for component-local state.

### Local component/composable state

Use Vue `ref`, `reactive`, and `computed` for state that belongs to a component or one feature-composable instance.

Default mental model:

```text
server state        -> Pinia Colada
global client state -> Pinia
local UI state      -> Vue refs/reactive/computed
```

## Frontend API layer

API files are transport adapters for backend HTTP communication.

They should:

- build/send requests
- deserialize transport responses
- expose typed request/response contracts

They should not contain business decisions or UI behavior.

Keep authentication/header mechanics centralized where practical instead of duplicating them across slices.

## Frontend queries and mutations

Frontend query/mutation files wrap Pinia Colada behavior and remain feature-specific unless genuinely reusable.

Queries represent server reads. Mutations represent server state changes.

Cache keys and invalidation should be intentional and colocated with the feature that understands their meaning.

## Frontend pure logic

Any deterministic frontend decision or calculation that is not merely rendering logic should be a pure function when practical.

Examples include:

- deriving allowed UI actions from already-fetched permissions/status
- formatting a feature-specific display model when it contains meaningful logic
- calculating client-side values that are not authoritative business decisions

Authoritative business rules belong on the backend. Frontend rules may improve UX but must never be the only enforcement of security, authorization, pricing, eligibility, or state transitions.

## Cross-slice boundaries

A frontend slice must not import deep internal files from another slice.

When cross-slice reuse is truly necessary, expose a small public surface from the target slice or promote genuinely generic code to `shared`.

Avoid hidden coupling such as importing another slice's private component, composable, cache internals, or mutation implementation.

## Internationalization and direction

The frontend must support English and Arabic as first-class languages.

- All user-facing strings should go through the localization system rather than being hard-coded in feature components.
- Components must work in both LTR and RTL layouts.
- Avoid CSS/layout assumptions that only work left-to-right.
- Dates/numbers/currency should be formatted using locale-aware APIs.
- Do not store already-localized strings as authoritative application data when a stable code/key is more appropriate.

## PWA considerations

Because the application is a PWA, frontend work should consider:

- installability
- offline/degraded-network behavior where relevant
- cache freshness and invalidation
- retry behavior
- stale server state
- responsive/mobile layouts
- safe handling of authentication/session data in browser storage

Do not introduce offline writes or background synchronization implicitly. Such behavior requires an explicit product and conflict-resolution decision.