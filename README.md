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

The template includes architecture/dependency enforcement, centralized runtime configuration and error handling, PostgreSQL/Drizzle runtime wiring, security middleware, health/readiness and graceful shutdown, CI, real PostgreSQL API E2E infrastructure, and a Playwright browser E2E baseline. Deployment/preview infrastructure remains environment-specific and is documented or added as the project evolves.
