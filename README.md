# Fastify + Nuxt Template

Reusable full-stack project template optimized for human and coding-agent development.

## Intended stack

- Nuxt / Vue frontend
- Fastify backend
- PostgreSQL
- Drizzle
- pnpm workspace/monorepo
- TypeScript

The backend uses business-process feature slices rather than framework modules or entity-oriented modules.

## Starting a new product

When creating a real project from this template, start with [`docs/SPINOFF.md`](docs/SPINOFF.md). It explains how to initialize the product and how the architecture, database, runtime configuration, security baseline, tests, CI, health checks, and delivery rules should be used from the first feature onward.

## Agent guidance

Coding agents must read `AGENTS.md` first.

Detailed guidance:

- [`docs/SPINOFF.md`](docs/SPINOFF.md) — operational workflow for creating and starting a real product from the template
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — feature-slice structure, boundaries, services, rules, queries, repositories, DTOs, DB placement, and time handling
- [`docs/TESTING.md`](docs/TESTING.md) — pure rule unit tests, TDD, real PostgreSQL API E2E, Playwright browser E2E, and testing boundaries
- [`docs/SECURITY.md`](docs/SECURITY.md) — secure defaults and production-readiness checklist
- [`docs/PRODUCTION_CONFIG.md`](docs/PRODUCTION_CONFIG.md) — production secrets, typed runtime configuration, environment isolation, least privilege, rotation, and exposure response
- [`docs/TRUSTED_PROXY.md`](docs/TRUSTED_PROXY.md) — safe Fastify proxy trust, forwarding-header handling, client IP/rate-limit implications, and deployment verification
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — provider-neutral Docker/runtime baseline, health checks, graceful shutdown, runtime configuration, and release shape
- [`docs/MIGRATIONS.md`](docs/MIGRATIONS.md) — production schema migration, compatibility, backfill, failure, and rollback workflow
- [`docs/PREVIEWS.md`](docs/PREVIEWS.md) — provider-neutral PR preview lifecycle, isolation, migrations, secrets, status reporting, concurrency, and teardown
- [`docs/OBSERVABILITY.md`](docs/OBSERVABILITY.md) — lightweight MVP observability baseline for structured logs, request correlation, health, release visibility, and future metrics/tracing hooks
- [`docs/DELIVERY.md`](docs/DELIVERY.md) — task planning, implementation order, validation, use-case README updates, CI, lifecycle, and PR workflow

## Core backend structure

```text
src/
  slices/
  shared/
  app.ts
  server.ts
```

A feature slice represents a business capability/workflow, not an entity or database model.

Typical flow:

```text
HTTP / Events / Jobs / Other slices
                ↓
              Facade
             ↙      ↘
        Service     Query
           ↓          ↓
         Rules       SQL/DB
           ↓
      Repository/DB
```

Business decisions belong in pure rules. Services orchestrate only. Queries are read-only projections and may join/aggregate across tables directly.

## Status

The template includes architecture/dependency enforcement, centralized runtime configuration and error handling, PostgreSQL/Drizzle runtime wiring, security middleware, health/readiness and graceful shutdown, CI, real PostgreSQL API E2E infrastructure, Playwright browser E2E, provider-neutral Docker deployment, production migration guidance, production secrets/configuration guidance, a safe trusted-proxy baseline, a provider-neutral preview-environment contract, and a lightweight MVP observability baseline. Provider-specific preview/deployment configuration and richer telemetry are added when a spin-off needs them.
