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

## Agent guidance

Coding agents must read `AGENTS.md` first.

Detailed guidance:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — feature-slice structure, boundaries, services, rules, queries, repositories, DTOs, DB placement, and time handling
- [`docs/TESTING.md`](docs/TESTING.md) — pure rule unit tests, TDD, E2E guidance, and testing boundaries
- [`docs/SECURITY.md`](docs/SECURITY.md) — secure defaults and production-readiness checklist
- [`docs/DELIVERY.md`](docs/DELIVERY.md) — task planning, implementation order, validation, use-case README updates, and PR workflow

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

This repository currently contains the architecture and agent guidance. Project scaffolding, linting/architecture enforcement, CI, preview environments, and application code will be added incrementally.