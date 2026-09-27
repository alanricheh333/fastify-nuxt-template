# Production Database Migration Workflow

This document defines the release contract for PostgreSQL/Drizzle migrations in production spin-offs.

The goal is to keep schema changes explicit, reviewable, backward-compatible where practical, and independent from application process startup.

## Core rules

- application containers do not auto-run migrations on startup
- migrations are generated and committed with the feature that needs them
- generated SQL must be reviewed before merge
- production migrations run as an explicit one-shot release job
- only one migration job should execute for a release/environment at a time
- application deployment must not proceed when the migration job fails
- schema changes should remain compatible with the currently running application during rolling/zero-downtime deployments where practical
- destructive changes require deliberate multi-step rollouts
- rollback means restoring application compatibility first; schema reversal is not automatic

## Development workflow

When a feature changes persistent schema:

1. update the relevant `*.table.ts` definitions
2. generate the migration
3. inspect the generated SQL
4. adjust/rewrite with reviewed SQL when PostgreSQL-specific behavior or safe rollout requires it
5. run the migration against a disposable/local database
6. run migration/schema checks
7. run relevant API/database E2E tests
8. commit the schema definitions, migration files, and feature code together

Generate migrations with:

```bash
pnpm --filter @app/api db:generate
```

Validate committed migration metadata with:

```bash
pnpm --filter @app/api db:check
```

Apply locally with:

```bash
pnpm --filter @app/api db:migrate
```

Do not modify an already-applied production migration to change history. Create a new forward migration instead.

## CI expectations

CI should fail before merge when:

- Drizzle schema and migration metadata are inconsistent
- migrations cannot be applied to the disposable CI PostgreSQL database
- API E2E tests fail after migrations are applied
- application code requires schema changes that are not committed

The current CI baseline already performs schema checks, applies committed migrations to disposable PostgreSQL, and then runs API E2E tests.

CI proves that a fresh database can reach the expected schema. It does not replace production review of lock duration, data volume, index creation, backfills, or compatibility with the currently deployed version.

## Release order

Default release sequence:

```text
CI green
→ build/tag immutable application images
→ production approval gate when applicable
→ run migration job once
→ stop release if migration fails
→ deploy application images
→ wait for readiness
→ route traffic
→ monitor errors/latency/database health
```

The migration job should use the same release revision/migration files that were reviewed and approved with the application code.

Do not generate migrations dynamically inside production.

## Migration job

The deployment platform should provide a one-shot command/job equivalent to:

```bash
pnpm --filter @app/api db:migrate
```

It receives the production `DATABASE_URL` and any required TLS configuration through the environment/secret store.

The job must:

- terminate successfully after migrations complete
- fail the release on a non-zero exit
- not remain as a long-running service
- not expose public network traffic
- not use development/test credentials
- not run concurrently with another migration job for the same environment

The local `docker-compose.yml` migration service demonstrates this separation but is not itself the production orchestration mechanism.

## Backward-compatible schema changes

Prefer expand-and-contract changes when old and new application versions may overlap.

### Adding columns

The safest default is:

1. add a nullable column or a column with a safe database default
2. deploy application code that can handle old/new data states
3. backfill existing rows if required
4. begin writing the new value
5. verify data completeness
6. only later add `NOT NULL`/strict constraints when safe

Avoid adding a required column without a safe default to a large existing table in the same release that immediately assumes every row contains it.

### Renaming columns

Do not usually rename a production column and deploy code expecting the new name in one rolling release.

Prefer:

```text
add new column
→ application writes/reads compatibly
→ backfill/copy data
→ migrate all readers/writers
→ remove old column in a later release
```

For large datasets, choose a controlled backfill strategy rather than one giant transaction.

### Removing columns/tables

Removal is a contract step, not an expand step.

Before dropping data structures:

- confirm no currently deployed code reads/writes them
- confirm jobs/workers/scripts/analytics consumers no longer depend on them
- keep at least one release boundary between stopping usage and destructive removal where practical
- take/verify appropriate backups for valuable data

### Changing types

Type changes may rewrite tables, lock data, truncate values, or break old application versions.

For risky type changes, prefer adding a new column and migrating data gradually over an in-place destructive cast.

## Indexes and constraints

Large-table indexes/constraints require production-specific review.

Consider:

- lock duration
- table size
- write traffic
- PostgreSQL concurrent index creation where appropriate
- validating constraints separately from creation where useful
- transaction restrictions of PostgreSQL-specific DDL

Drizzle-generated SQL is a starting point, not permission to apply expensive DDL blindly.

Reviewed manual SQL is acceptable when needed for safe PostgreSQL behavior.

## Data backfills

Schema migration and business-data backfill are different operational concerns.

Small deterministic backfills may be appropriate inside a migration.

Large/slow backfills should usually be implemented as a separately controlled job/script so they can be:

- batched
- observed
- throttled
- resumed safely
- retried idempotently
- stopped without holding one enormous transaction

Do not make application startup perform backfills.

When application behavior depends on a completed backfill, define the release phases explicitly.

## Transactions

Do not assume every PostgreSQL migration can or should run inside one transaction.

Some PostgreSQL operations have special transaction/locking constraints. Review the exact SQL rather than relying on a generic transactional rule.

The important guarantee is that failure behavior is understood and recoverable.

## Migration failure

If a production migration job fails:

1. stop the application release
2. do not repeatedly rerun blindly
3. inspect the database/migration state and exact error
4. determine whether the failed migration was atomic or partially applied
5. fix forward with a reviewed migration/operational action
6. re-run only after the resulting state is understood

Do not deploy application code that assumes a migration completed when it did not.

## Rollback strategy

Database rollback is not equivalent to application rollback.

Application images can often be rolled back quickly. Schema changes may be irreversible or may already contain new production data.

Therefore prefer migrations that allow both the old and new application to coexist during the rollout window.

If the new application must be rolled back:

- first restore an application version compatible with the current schema
- leave additive/compatible schema changes in place when harmless
- create a reviewed forward migration for cleanup or repair
- only reverse schema changes when data safety and compatibility are explicitly understood

Never make "down migration" availability the primary production recovery strategy.

## Destructive migrations

Treat these as high-risk:

- dropping tables/columns
- narrowing types
- deleting/rewriting large amounts of data
- adding constraints that may reject existing rows
- large table rewrites
- operations requiring long exclusive locks

Before applying them, require explicit review of:

- affected row/table volume
- expected lock/time cost
- application compatibility
- backup/recovery plan
- whether expand-and-contract can avoid the destructive one-step rollout
- maintenance window needs

## Multiple application instances

Migrations are run once per environment/release, never once per API replica.

The release orchestrator is responsible for serialization. Do not solve this by making every API instance race to acquire a migration lock on startup.

## Preview/staging environments

Each environment should have its own database/schema lifecycle.

Apply the same committed migration chain to preview/staging databases before application instances rely on the new schema.

Never point preview or CI migrations at production data.

Ephemeral preview databases may be created from scratch and migrated fully. Long-lived staging databases should also be tested as incremental migration targets because that more closely resembles production.

## Migration credentials

Use least privilege appropriate to the environment.

The migration job may need DDL permissions that normal application runtime credentials do not need.

Where operationally practical, use separate credentials:

```text
application runtime role → normal read/write application permissions
migration role → controlled schema/DDL permissions
```

Do not hard-code either credential in the repository or image.

## Observability and auditability

For production releases, retain enough deployment/job information to answer:

- which application commit/release ran the migration
- which environment/database was targeted
- when the job started/completed
- whether it succeeded
- what error occurred when it failed

Do not log database passwords or full secret-bearing connection URLs.

## Feature/PR checklist for schema changes

When a task changes the database, its PR/review should answer:

- what schema changes are introduced?
- is the migration additive or destructive?
- can old and new application versions both operate during rollout?
- does this migration lock/rewrite a potentially large table?
- is a data backfill required?
- should the backfill be a separate job?
- are new constraints safe for existing data?
- are indexes safe to build using the generated SQL?
- what happens if the migration fails midway?
- can the application be rolled back without reversing the schema?
- were migrations applied and E2E tests run against real PostgreSQL?

## Spin-off production checklist

Before the first production release, define:

- the platform's one-shot migration job mechanism
- the production migration credential/role
- how migration jobs are serialized
- release gating on migration success
- database backup/recovery policy
- how large backfills are executed/monitored
- whether staging performs incremental migration rehearsal
- how deployment/job logs are retained

## Related documentation

- `docs/DEPLOYMENT.md` — provider-neutral application/container deployment baseline
- `docs/DATABASE_RUNTIME.md` — application DB client ownership and lifecycle
- `docs/SPINOFF.md` — how new products use the template baseline
- `docs/TESTING.md` — real PostgreSQL E2E expectations
- `docs/DELIVERY.md` — feature/release validation and production considerations

The template intentionally defines the migration contract without selecting a specific cloud/database provider. Provider-specific release jobs should implement this contract rather than replacing it with implicit application-startup migrations.
