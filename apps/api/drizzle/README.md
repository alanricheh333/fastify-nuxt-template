# Database Migrations

This directory contains generated and reviewed PostgreSQL migrations for the API.

Use:

- `pnpm --filter @app/api db:generate` after changing `*.table.ts` definitions.
- Review generated SQL before committing it.
- `pnpm --filter @app/api db:check` to validate migration consistency.
- `pnpm --filter @app/api db:migrate` only against the intended environment.

Do not hand-edit generated snapshots unless a concrete migration-recovery task requires it. PostgreSQL-specific manual SQL migrations are allowed when reviewed and documented.

Production migrations must be an explicit deployment step. Do not automatically run destructive migrations on application startup.
