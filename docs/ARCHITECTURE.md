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

Services must not make business decisions.

Business conditions such as eligibility, state transitions, pricing, limits, authorization policies tied to domain rules, or calculations belong in rules.

Service code should not contain business `if`, `switch`, or ternary branching. If orchestration appears to require a business branch, extract the decision into a rule and orchestrate the rule's result.

Technical failure propagation and framework-neutral sequencing are allowed, but keep services linear and explicit.

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
- may access several tables directly
- may use Drizzle/SQL joins, aggregation, grouping, projections, CTEs, and optimized read shapes
- may bypass repositories for reads when direct SQL is clearer or more efficient
- return dedicated read-model/projection types
- must not mutate state
- must not contain business decisions
- must not call services

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

## DTOs

DTOs represent external transport contracts. They are not domain/application models.

Keep them at transport boundaries and map them to framework-independent application inputs.

Do not pass Fastify DTO/schema types through services, rules, repositories, or database layers.

## Database placement

Database tables and repository functions may initially live inside a slice when they primarily belong to that capability.

Example:

```text
some-slice/
  db/
    application.table.ts
    insert-application.repository.ts
```

Promote database code into `src/shared/db` when its ownership and usage become genuinely cross-slice.

A useful heuristic is reuse by around three or more slices, but this is not a hard numeric law. Promote based on shared ownership and architectural clarity, not import count alone.

Do not let the first implemented slice become the accidental permanent owner of a broadly shared entity such as User merely because it happened to introduce the table first.

## Repositories

Repositories are narrow database operations used by orchestration code.

Prefer intention-revealing functions such as:

- `insertApplication`
- `markUserVerified`
- `loadApplicationContext`

Avoid generic catch-all CRUD repositories unless a concrete need justifies them.

A repository may read/write the data needed for its operation but must not contain business policy.

One exported repository function/factory per file.

## Tables/entities

Database entities/table declarations represent persistence shape only. Do not put business behavior on persistence entities.

With Drizzle, table definitions should remain declarative and dumb.

Business behavior belongs in rules.

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

## Exports

Default to one primary export per file:

- one rule function
- one service function/factory
- one query function/factory
- one repository function/factory
- one type
- one constant
- one error
- one persistence table/entity definition

Private helper functions/types/constants may remain internal to the file.

Facades and cohesive framework controllers/registrars may expose multiple operations where that is the natural boundary.

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

Cross-slice calls go through the target slice facade rather than importing its internals.

## Time and dates

For real instants:

- PostgreSQL: use `timestamptz`
- normalize/store as UTC
- transport as ISO-8601 UTC strings
- parse/convert to local timezone only at boundaries or when a business rule explicitly requires a timezone
- never rely on server local timezone

For timezone-independent dates such as a birthday, use PostgreSQL `date`.

If local-time scheduling intent matters, preserve the IANA timezone (for example `Asia/Damascus`) separately from the instant.