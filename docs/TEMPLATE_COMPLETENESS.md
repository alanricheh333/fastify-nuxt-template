# Template Completeness Checklist

Use this checklist to decide whether the generic template baseline is complete enough to spin off a real product without first redesigning infrastructure.

The checklist distinguishes between what the template itself must provide and what a product must decide after spin-off.

## 1. Repository and developer workflow

Template baseline:

- [x] pnpm workspace/monorepo
- [x] Turborepo scripts
- [x] pinned Node/pnpm versions
- [x] frozen-lockfile CI install
- [x] linting
- [x] type checking
- [x] architecture/dependency checks
- [x] agent guidance in `AGENTS.md`
- [x] delivery workflow documentation

Spin-off responsibility:

- [ ] rename product/repository identity
- [ ] configure branch protection/review rules appropriate for the product

## 2. Architecture

Template baseline:

- [x] business-process feature-slice architecture
- [x] facade boundary
- [x] orchestration-only services
- [x] pure business rules
- [x] read-only query layer
- [x] repository/data ownership guidance
- [x] backend/frontend boundary rules
- [x] dependency enforcement

Spin-off responsibility:

- [ ] model actual product capabilities as slices
- [ ] document intentional deviations

## 3. Runtime configuration

Template baseline:

- [x] centralized typed runtime config
- [x] fail-fast parsing
- [x] `.env.example` inventories
- [x] production configuration/secrets contract
- [x] public-vs-secret Nuxt guidance

Spin-off responsibility:

- [ ] populate provider/environment values
- [ ] provision secret storage
- [ ] add product-specific integration variables through the central parser

## 4. Database

Template baseline:

- [x] PostgreSQL + Drizzle
- [x] explicit DB client ownership
- [x] repository executor/transaction pattern
- [x] migration generation/check/apply commands
- [x] production migration workflow
- [x] expand-and-contract guidance
- [x] real PostgreSQL CI/E2E baseline

Spin-off responsibility:

- [ ] provision databases for actual environments
- [ ] choose runtime/migration credentials
- [ ] implement provider-specific production migration job

## 5. Testing

Template baseline:

- [x] pure rule unit-test guidance
- [x] no-mock default
- [x] Vue component-test convention
- [x] real PostgreSQL API E2E harness
- [x] Playwright browser E2E baseline
- [x] CI runs unit/component/API E2E/browser E2E

Spin-off responsibility:

- [ ] add tests for actual business rules and critical flows
- [ ] update starter smoke test after product UI replaces template page

## 6. HTTP/API behavior

Template baseline:

- [x] Fastify runtime
- [x] request/response schema convention
- [x] Swagger/OpenAPI baseline
- [x] typed application errors
- [x] centralized HTTP error mapping
- [x] sanitized production errors
- [x] request IDs

Spin-off responsibility:

- [ ] define real product HTTP contracts
- [ ] update Swagger metadata/product description

## 7. Security baseline

Template baseline:

- [x] Helmet
- [x] explicit CORS configuration
- [x] rate limiting
- [x] sensitive log redaction
- [x] security review checklist
- [x] trusted-proxy configuration that is disabled by default
- [x] proxy/CIDR deployment guidance
- [x] authentication design guidance without forcing a provider

Spin-off responsibility:

- [ ] implement the chosen authentication/session model when needed
- [ ] implement product authorization/ownership rules
- [ ] configure exact production CORS origins
- [ ] configure trusted proxy CIDRs only after deployment topology is known
- [ ] move rate limiting to a shared store before multi-instance deployment when required

## 8. Lifecycle and health

Template baseline:

- [x] graceful SIGTERM/SIGINT shutdown
- [x] cleanup callback mechanism
- [x] shutdown timeout
- [x] liveness endpoint
- [x] readiness endpoint
- [x] real DB readiness check
- [x] health checks excluded from rate limiting

Spin-off responsibility:

- [ ] register readiness/cleanup for new critical long-lived dependencies
- [ ] configure platform health probes and termination grace periods

## 9. Containers and deployment

Template baseline:

- [x] production API Dockerfile
- [x] production Nuxt Dockerfile
- [x] non-root runtime containers
- [x] Docker health checks
- [x] `.dockerignore`
- [x] local Compose verification stack
- [x] separate migration service concept
- [x] provider-neutral deployment contract

Spin-off responsibility:

- [ ] choose hosting/cloud provider
- [ ] configure registry/release pipeline
- [ ] provision production ingress/TLS/PostgreSQL
- [ ] configure provider-specific deploy/release jobs

## 10. Preview environments

Template baseline:

- [x] deterministic PR preview contract
- [x] isolated DB/data requirements
- [x] preview migration ordering
- [x] secrets/untrusted-fork rules
- [x] concurrency/superseding rules
- [x] readiness-aware publish behavior
- [x] PR status/URL expectations
- [x] automatic teardown/TTL guidance
- [x] clear agent-vs-CI responsibility boundary

Spin-off responsibility:

- [ ] implement provider-specific preview workflow
- [ ] decide preview database isolation mechanism
- [ ] decide preview access control and sandbox integrations

## 11. Observability

Template baseline:

- [x] structured JSON logging
- [x] request correlation
- [x] sensitive-data logging rules
- [x] health/release visibility
- [x] lightweight observability guidance
- [x] clear conditions for adding metrics/tracing/error monitoring later

Spin-off responsibility:

- [ ] ensure platform captures stdout/stderr logs
- [ ] choose vendor/OpenTelemetry only when product needs it
- [ ] add alerts/retention/sampling when operational ownership exists

## 12. Frontend baseline

Template baseline:

- [x] Nuxt/Vue
- [x] Nuxt UI
- [x] Pinia
- [x] Pinia Colada
- [x] English/Arabic i18n
- [x] RTL/LTR support
- [x] PWA baseline
- [x] thin-page/feature-slice frontend guidance

Spin-off responsibility:

- [ ] replace template branding/content
- [ ] implement actual product UI/design system decisions
- [ ] configure product PWA metadata/icons

## 13. Deliberately product-specific decisions

The following are intentionally not implemented in the generic template:

- authentication provider/custom auth implementation
- email/SMS provider
- payments
- Redis/shared rate-limit store
- queues/event broker
- object/file storage
- scheduler/cron infrastructure
- multi-tenancy model
- analytics product
- observability vendor
- hosting/cloud provider
- provider-specific previews

An agent should choose/implement these only when the spin-off requirements require them.

## 14. Template-ready definition

The generic template is considered ready when:

- CI is green on `integration`
- repository docs reflect the current code/CI behavior
- a new product can start from `docs/SPINOFF.md`
- architecture/security/testing/database/deployment constraints are discoverable without tribal knowledge
- provider/product-specific choices are explicitly marked as spin-off responsibilities rather than hidden missing work
- no generic infrastructure is added merely to anticipate hypothetical future needs

## 15. Recommended final proof

After this checklist is green, the strongest remaining validation is a disposable spin-off exercise:

```text
create repo from template
→ replace identity/config
→ implement one small business-process feature
→ add rule tests
→ add DB migration
→ add API endpoint/E2E
→ update web UI
→ run CI
→ build/run containers
→ optionally implement the chosen provider preview workflow
```

If an agent can complete that exercise by following the repository documentation without needing architectural redesign, the template has achieved its intended purpose.
