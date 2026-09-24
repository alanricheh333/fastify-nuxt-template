# Database Runtime Lifecycle

The default API runtime instantiates PostgreSQL/Drizzle once in `server.ts`, which acts as the composition root.

## Runtime rules

- create one database client/pool at startup
- use the same client for application database work and readiness checks
- do not attach the database to Fastify as a global `app.db`
- do not create database clients inside slices, repositories, queries, or services
- pass `Database` / `DatabaseExecutor` explicitly to repositories, queries, services, or factories that need persistence access
- register `databaseClient.close` with graceful shutdown

## Readiness

`/health/ready` includes a lightweight `SELECT 1` database check. If PostgreSQL cannot respond, readiness returns `503` while liveness remains independent.

## Spin-off behavior

A new product created from the template only needs a valid `DATABASE_URL` and the existing database environment variables to obtain:

- a single PostgreSQL connection pool
- Drizzle access
- database-backed readiness
- clean pool shutdown

Product-specific repositories and services should receive the shared executor through explicit dependency injection.

## Future infrastructure

Apply the same composition-root lifecycle to future long-lived resources such as Redis, queues, event consumers, schedulers, or workers: construct once, register readiness when appropriate, inject explicitly, and close during graceful shutdown.
