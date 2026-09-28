# Template Spin-off Workflow

Use this guide when creating a real product from this repository. The goal is to preserve the template's architectural, testing, security, database, and delivery guarantees while replacing only the template-specific product identity and starter UI.

This document is the operational entry point for a new spin-off. The detailed rules remain in `AGENTS.md` and the referenced documents under `docs/`.

Use `docs/TEMPLATE_COMPLETENESS.md` when you need to distinguish what the generic template already guarantees from product-specific work that should be implemented only after spin-off.

## 1. Create the product repository

Create a new repository from the GitHub template instead of copying selected folders manually. Keep the full history-independent template contents so architecture checks, CI, tests, runtime configuration, and documentation start in a known state.

Immediately after creation:

1. Protect the production branch according to the team's workflow.
2. Create an integration/development branch if the product will use one.
3. Confirm coding agents can read `AGENTS.md` and the `docs/` directory.
4. Do not remove infrastructure because the first feature does not use it yet unless the product has an explicit reason to diverge.

## 2. Replace template identity

Update the parts that describe the product rather than the architecture:

- repository name and description
- root package name if desired
- `apps/api/package.json` and `apps/web/package.json` names if the product needs product-specific workspace names
- API Swagger title, description, and version metadata
- Nuxt application metadata when product branding is known
- starter home-page copy and localization strings
- README product description

Do not rename architectural folders merely for branding. `apps/api`, `apps/web`, `src/slices`, `src/shared`, and the documented feature-slice conventions should remain stable unless there is a concrete architectural reason to change them.

## 3. Bootstrap local development

Use the versions pinned by the repository.

```bash
corepack enable
pnpm install --frozen-lockfile
```

Copy the example environment files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Create a local PostgreSQL database and point `DATABASE_URL` at it. Keep development and test databases separate.

Before feature work begins, run:

```bash
pnpm typecheck
pnpm lint
pnpm architecture:check
pnpm test
pnpm build
```

The new repository should start green. If the untouched spin-off fails validation, fix the bootstrap problem before adding product behavior.

## 4. Define product runtime configuration

The API reads runtime configuration once through the centralized runtime-config layer. New infrastructure must consume typed configuration rather than reading `process.env` throughout the codebase.

For every new runtime variable:

1. add it to `apps/api/.env.example`
2. add it to the runtime config type/parser
3. validate/parse it centrally
4. add parser tests for required values, defaults, and invalid values where relevant
5. inject the parsed value into the infrastructure that needs it

Never commit real secrets. Production credentials, signing keys, API tokens, database passwords, and similar values belong in the deployment platform's secret/environment store.

Before the first production deployment, follow [`docs/PRODUCTION_CONFIG.md`](PRODUCTION_CONFIG.md) to classify values as public configuration vs secrets, isolate environments, define least-privilege credentials, and establish rotation/exposure procedures.

Do not put business settings into runtime configuration by default. Product rules that are part of business behavior should remain explicit product/domain concepts rather than becoming arbitrary environment switches.

## 5. Start the product with business-process slices

Before implementing the first feature, identify the business process being changed.

Good slice names describe capabilities/workflows, for example:

```text
apply-to-gig
post-gig
accept-application
checkout
invite-member
```

Avoid entity-only slices such as `user`, `order`, or `application` when the actual feature is a business process spanning multiple entities.

Backend flow should normally remain:

```text
HTTP / Events / Jobs
        ↓
      Facade
     ↙      ↘
 Service    Query
    ↓
  Rules
    ↓
Repository / DB
```

The facade is the public slice boundary. HTTP/event/job adapters and other slices must not deep-import services, rules, repositories, or slice DB internals.

Services orchestrate. Business decisions belong in pure rules. Queries are read-only projections.

Read `docs/ARCHITECTURE.md` before introducing the first slice and whenever a task changes structural boundaries.

## 6. Database workflow in a spin-off

PostgreSQL + Drizzle is the default persistence model.

For new persistent data:

1. place the table in the business slice that owns it
2. use a `*.table.ts` file
3. add an entity-focused repository only when command/write behavior needs one
4. keep read-only projection logic in queries
5. let the service/use case own transaction boundaries
6. pass the current DB/transaction executor into repositories explicitly

Promote tables or DB infrastructure to `shared/db` only when ownership becomes genuinely cross-slice. The more-than-three-slices rule is a heuristic, not an automatic migration trigger.

### Migrations

Generate migrations explicitly:

```bash
pnpm --filter @app/api db:generate
```

Review the generated SQL before committing it. Then verify the migration set:

```bash
pnpm --filter @app/api db:check
```

Apply migrations locally against the intended development/test database with:

```bash
pnpm --filter @app/api db:migrate
```

Never make feature code depend on uncommitted local schema changes. Never blindly auto-run destructive production migrations.

Before the first production release, implement the platform's one-shot migration job and release gate according to [`docs/MIGRATIONS.md`](MIGRATIONS.md). Production migrations are separate from API startup and should use backward-compatible expand-and-contract rollouts where old/new application versions can overlap.

### Time

Use `timestamptz`/UTC for real instants, PostgreSQL `date` for timezone-independent calendar dates, and preserve an IANA timezone separately when local scheduling intent matters.

## 7. Testing from the first feature onward

The template intentionally has multiple test layers. A spin-off should use the smallest layer that proves the relevant behavior rather than testing everything through one boundary.

### Pure business-rule tests

Every meaningful backend business rule should have a colocated unit test.

```text
can-apply.rule.ts
can-apply.rule.test.ts
```

Rule tests use plain inputs and outputs/errors. They do not initialize Fastify, use a database, read environment variables, call networks, or use mocks.

### Service tests

Do not create mock-heavy service tests merely to verify repository/rule call order. Services should remain simple orchestration. If a service requires complex mock-heavy tests, inspect whether business logic has leaked into it.

### Frontend component tests

Use `.comp.test.ts` for meaningful Vue component behavior. Test observable rendering and interaction rather than refs/internal component structure.

Do not mechanically test every presentation-only component. Add tests where behavior, conditional rendering, user interaction, accessibility-relevant behavior, or RTL behavior can regress meaningfully.

### API/database E2E tests

The API E2E suite uses a real PostgreSQL database and an explicit `TEST_DATABASE_URL`.

Local flow:

```bash
DATABASE_URL=postgresql://.../app_test pnpm --filter @app/api db:migrate
TEST_DATABASE_URL=postgresql://.../app_test pnpm --filter @app/api test:e2e
```

Keep the test DB separate from development and production data.

The template's initial DB/readiness E2E tests prove the harness. Product spin-offs should add E2E tests for meaningful boundaries such as:

- complete HTTP use cases
- authorization behavior
- transactions and constraints
- important query behavior
- request/response contracts

Do not add E2E tests mechanically for every trivial endpoint.

### Browser E2E with Playwright

The template contains a minimal Playwright smoke test that proves the Nuxt browser harness works. Once the starter home page is replaced, update that smoke assertion to a stable product-level entry point.

Add Playwright tests for important user journeys, not for every component. Good candidates include authentication, core conversion/transaction flows, navigation boundaries, and critical English/Arabic or LTR/RTL behavior.

Run web E2E locally with:

```bash
pnpm --filter @app/web test:e2e
```

The Playwright configuration starts the Nuxt web server automatically.

## 8. Security is part of each feature

Do not treat the template's existing CORS, Helmet, rate limiting, logging redaction, error sanitization, and request IDs as a complete product security design. They are infrastructure defaults on top of which each feature must still be reviewed.

For every externally reachable or data-changing use case, check:

- authentication requirements
- authorization/resource ownership/tenant checks
- input validation and explicit accepted fields
- mass-assignment risks
- rate/abuse limits
- query/upload/batch bounds
- SQL/injection risks
- sensitive response fields
- concurrency and duplicate submissions
- transaction and DB constraints
- idempotency/replay behavior where relevant
- logging/data exposure

Read `docs/SECURITY.md` for externally reachable/data-changing work.

### CORS

Configure exact trusted origins with `CORS_ALLOWED_ORIGINS`. Do not make production CORS permissive to work around frontend configuration problems.

Enable `CORS_ALLOW_CREDENTIALS` only when the chosen authentication/cookie architecture requires it, and coordinate it with CSRF/cookie behavior.

### Rate limiting

The global rate limiter is a baseline. Add named route-level policies to sensitive endpoints such as login, password reset, expensive searches/exports, or write-heavy actions.

The template's in-memory rate-limit store is appropriate only for the documented single-instance baseline. Before horizontally scaling the API, introduce a shared store such as Redis.

### Authentication

Authentication is intentionally not implemented by this template because products differ. Before adding auth, read `docs/AUTHENTICATION.md` and choose the product's auth model deliberately.

Do not invent a second auth pattern because one feature needs identity. Keep framework request objects out of business code; map authenticated identity to application-level actor/context data.

### Errors and logs

Use typed application errors and centralized HTTP mapping. Do not expose internal exception text, stack traces, SQL details, secrets, or raw database errors.

Do not log passwords, authorization headers, cookies, access/refresh tokens, or other sensitive values. Preserve the existing redaction baseline when adding logging.

## 9. Health and application lifecycle

The API exposes:

```text
GET /health/live
GET /health/ready
```

Keep liveness lightweight. Do not turn it into a database/network dependency test.

When the spin-off adds a long-lived dependency that is required to serve traffic, add a readiness check when appropriate and register it at the composition root.

Every long-lived resource created by startup/composition code must also participate in graceful shutdown. Register cleanup so `SIGTERM`/`SIGINT` can stop traffic, close Fastify, close resources, and terminate within `SHUTDOWN_TIMEOUT_MS`.

## 10. Frontend product rules

Keep `pages/` and `layouts/` thin. Product UI and feature behavior belong in frontend business-process slices.

Use:

- Nuxt UI for base components/design-system primitives
- Pinia Colada for remote/server state
- Pinia only for genuinely shared client-side state
- refs/reactive/computed for local state

Do not copy API state into Pinia just because a store feels convenient.

English and Arabic remain first-class unless the product explicitly changes supported languages. New user-facing strings should use i18n, and direction-sensitive UI must remain valid in RTL.

Because the web app is a PWA baseline, feature work should consider responsive/mobile behavior and safe browser storage where applicable.

## 11. Error handling and API contracts

Every Fastify endpoint should use schemas for validation/serialization and Swagger/OpenAPI documentation.

Transport code should:

1. validate/deserialise external input
2. map it to application input
3. call the slice facade
4. map/serialize the result

Do not place business decisions in controllers.

When introducing a business/application failure:

1. create an `ApplicationError` subclass at the narrowest correct ownership level
2. give it a stable public error code
3. map that code to HTTP status in `application-error-http-map.ts`
4. keep the external error response contract consistent

Read `docs/ERROR_HANDLING.md` before changing error behavior.

## 12. CI must remain green

Do not weaken CI in a spin-off merely because the first product work makes a check inconvenient.

The baseline CI verifies:

```text
install with frozen lockfile
→ typecheck
→ lint
→ architecture check
→ unit/component tests
→ build
→ Drizzle migration/schema check
→ apply migrations to disposable PostgreSQL
→ API E2E tests against real PostgreSQL
→ install Playwright Chromium
→ browser E2E tests
```

When a product adds a new critical validation layer, wire it into CI rather than relying on agent/developer memory.

A dependency change must include the lockfile. A schema change must include reviewed migration artifacts.

## 13. Feature delivery workflow

For every product task, coding agents should follow `AGENTS.md` and `docs/DELIVERY.md`.

At a high level:

```text
understand requirement
→ inspect affected slice
→ identify rules/security/data implications
→ write correct-level tests
→ implement smallest change
→ update use-case README
→ run focused validation
→ run broader validation
→ inspect diff
→ PR/human review
```

Every implemented slice/use case should have a concise README describing its purpose, facade, entry points, business rules, important data interactions, security considerations, and operational notes.

Do not invent product behavior that is not in the requirement just to complete a generic architecture pattern.

## 14. First-feature checklist

Before considering the spin-off successfully initialized, confirm:

- product/repository identity is updated
- local `.env` files exist but are not committed
- development PostgreSQL works
- a separate test PostgreSQL database is available
- baseline validation passes
- API E2E tests pass against the real test DB
- Playwright smoke test reflects the product entry page
- CI passes on the new repository
- first business process is modeled as a feature slice rather than an entity module
- first business rules have pure unit tests
- first DB schema changes have reviewed Drizzle migrations
- first externally reachable feature has an explicit security review
- Swagger/OpenAPI describes the first HTTP contract
- use-case README exists

## 15. What the spin-off should not copy blindly

The template deliberately leaves some product decisions open. Decide these when the product actually needs them rather than pre-installing infrastructure without requirements:

- authentication provider/custom auth implementation
- Redis/shared rate-limit store
- queues/event broker
- email/SMS provider
- object/file storage
- payment provider
- cron/scheduler infrastructure
- multi-tenancy model
- analytics/observability vendor
- preview/deployment provider

The template supplies boundaries and guidance for these decisions, not one universal product implementation.

## 16. Documentation map

Use this document as the starting workflow, then read the specialized documentation when that concern is touched:

- `AGENTS.md` — mandatory coding-agent rules
- `docs/TEMPLATE_COMPLETENESS.md` — template-ready vs spin-off responsibilities
- `docs/ARCHITECTURE.md` — slices, boundaries, services, rules, queries, repositories, frontend structure
- `docs/TESTING.md` — unit, component, DB/API E2E, and browser E2E strategy
- `docs/SECURITY.md` — secure feature and infrastructure baseline
- `docs/PRODUCTION_CONFIG.md` — production secrets, typed runtime configuration, environment separation, rotation, and incident response
- `docs/AUTHENTICATION.md` — auth design guidance when auth is introduced
- `docs/ERROR_HANDLING.md` — typed application errors and HTTP mapping
- `docs/DATABASE_RUNTIME.md` — DB client ownership/runtime lifecycle
- `docs/MIGRATIONS.md` — production migration/release contract, compatibility, failure, backfill, and rollback rules
- `docs/DEPLOYMENT.md` — provider-neutral Docker/runtime/deployment baseline
- `docs/PREVIEWS.md` — provider-neutral PR preview lifecycle and teardown contract
- `docs/OBSERVABILITY.md` — lightweight MVP observability baseline and upgrade triggers
- `docs/DESIGN_SYSTEM.md` — Nuxt UI/design-system conventions
- `docs/DELIVERY.md` — implementation, validation, PR, CI, runtime, and lifecycle workflow

If a spin-off intentionally diverges from a template rule, document the reason in the product repository rather than silently drifting from the baseline.
