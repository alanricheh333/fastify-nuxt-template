# Observability Baseline

This template keeps observability intentionally lightweight for MVPs while preserving a clean path to richer tooling later.

The goals are:

- make production failures diagnosable without choosing a vendor
- keep logs structured and correlated
- distinguish environments/services/releases
- avoid leaking sensitive data
- define where metrics/tracing/error monitoring can be added later
- avoid forcing OpenTelemetry or a SaaS observability stack before the product needs it

## 1. MVP baseline

For an MVP, the required baseline is:

- structured application logs
- request IDs propagated through request logs/errors
- stable service/environment/release identity where the deployment platform can provide it
- sanitized errors
- liveness/readiness endpoints
- deployment/job logs for migrations/releases

Metrics, distributed tracing, profiling, and a dedicated error-reporting vendor are optional until product/operational complexity justifies them.

## 2. Structured logging

The Fastify API uses Pino-compatible structured JSON logging.

Prefer structured fields over interpolated log strings.

Good:

```ts
request.log.info({ orderId, userId }, 'order submitted')
```

Avoid:

```ts
request.log.info(`order ${orderId} submitted by ${userId}`)
```

Structured fields make filtering and aggregation easier when logs are shipped to a provider later.

## 3. Request correlation

Every HTTP request already has a Fastify request ID and the API returns it as `x-request-id`.

Use the request-scoped logger for request work so logs automatically stay associated with that request context.

When surfacing an API error to a client, include the request ID in the public error envelope where already supported so production support can correlate a client-visible failure with server logs.

Do not trust an arbitrary client-provided request ID unless an explicit trusted propagation strategy is added later.

## 4. Service/environment/release identity

Production telemetry should be attributable to the exact runtime that produced it.

Useful dimensions include:

```text
service=api
environment=production
release=<git sha/tag>
preview_id=pr-123
```

The exact injection mechanism is provider-specific and does not need to be implemented in the generic template.

When a deployment platform exposes commit/release metadata, prefer adding it as structured log/telemetry attributes rather than embedding it in business code.

## 5. Log levels

Use log levels consistently:

- `fatal` — process cannot continue
- `error` — unexpected operation/request failure requiring attention
- `warn` — degraded/unusual condition that is recoverable
- `info` — important lifecycle/business-operational event
- `debug` — detailed diagnostic information, normally disabled in production unless needed
- `trace` — very high-volume diagnostics

Do not log normal expected business rejection as `error` just because it maps to HTTP 4xx.

Typed application errors should remain normal controlled outcomes unless their frequency/shape itself indicates an operational problem.

## 6. Sensitive data

The existing logger redacts common secrets such as authorization headers, cookies, passwords, and tokens.

When a feature introduces new sensitive fields, extend redaction appropriately.

Never log:

- passwords
- session/access/refresh tokens
- authorization/cookie headers
- private keys
- full credential-bearing connection URLs
- payment secrets
- webhook signing secrets
- unnecessary personal/sensitive payloads

Prefer identifiers and metadata over full request/response bodies.

## 7. Error logging

Unexpected errors should be logged once at the appropriate boundary with useful context.

Avoid logging the same exception repeatedly at controller, service, repository, and global-error layers.

The centralized HTTP error handler should remain the primary place for unexpected request failure logging/sanitization.

Public responses must not expose stack traces, SQL errors, infrastructure details, or secret values.

## 8. Business/operational events

Do not turn logs into a shadow analytics/event-sourcing system.

Log business events only when they help operate/debug the system, for example:

- a payment provider request failed
- a background job was permanently abandoned
- an external webhook signature was rejected repeatedly
- an important batch/backfill completed

Do not log every database read/write by default.

## 9. Health and readiness

The template exposes:

```text
GET /health/live
GET /health/ready
```

These are part of the observability baseline because they expose process and dependency readiness to orchestration/load-balancer infrastructure.

Liveness remains lightweight. Readiness may include critical dependencies such as PostgreSQL.

Health endpoints are not a replacement for metrics/tracing/logs.

## 10. Deployment and migration visibility

Release/migration automation should retain enough information to answer:

- which commit/release was deployed
- when deployment started/completed
- which environment was targeted
- whether migrations succeeded
- whether readiness succeeded
- why a deployment failed

This may live in GitHub Actions/provider deployment logs initially.

A dedicated observability platform is not required for MVP release visibility.

## 11. Metrics — deferred by default

Do not add Prometheus/OpenTelemetry metrics merely to make the template appear production-grade.

Add metrics when there are concrete questions that logs/health cannot answer efficiently.

Typical useful metrics later include:

- request count/rate
- latency percentiles
- error rate
- DB pool utilization
- queue depth
- job success/failure duration
- external provider latency/failures
- domain-specific operational counters

Avoid high-cardinality labels such as raw user IDs, request IDs, or arbitrary URLs.

## 12. Distributed tracing — deferred by default

Tracing becomes valuable when a request crosses several services, queues, providers, or workers and log correlation alone becomes difficult.

For an MVP monolith/API + web setup, request IDs and structured logs may be sufficient.

When tracing is introduced, prefer OpenTelemetry-compatible instrumentation so the product is not coupled tightly to one vendor.

Potential future flow:

```text
Fastify/Nuxt/DB/external calls
→ OpenTelemetry SDK
→ OTLP exporter
→ chosen backend (Dash0, Datadog, Grafana, Honeycomb, etc.)
```

Do not add tracing packages until a spin-off actually decides to use them.

## 13. Error monitoring — optional

A dedicated error-monitoring tool such as Sentry may be useful earlier than full tracing/metrics for consumer-facing products.

If introduced:

- keep environment/release tags
- avoid uploading secrets/sensitive request data
- configure source maps securely
- prevent duplicate reporting of expected application errors
- preserve request ID correlation

The template does not choose an error-monitoring vendor.

## 14. Frontend observability

The base Nuxt app does not install browser telemetry by default.

If a product later adds browser error/performance monitoring, explicitly review:

- privacy/consent requirements
- captured URLs/query params
- user identifiers
- session replay implications
- source maps
- sampling/cost

Do not ship broad browser/session telemetry automatically from the template.

## 15. Logs in containers

Application containers should write structured logs to stdout/stderr.

Do not write important logs to local container files because container filesystems are ephemeral and logs become difficult to aggregate.

The deployment platform/log agent is responsible for collection, retention, indexing, and forwarding.

## 16. Retention and cost

Log/trace retention is provider-specific.

When a provider is chosen, define:

- retention duration
- sampling rules
- ingestion limits/cost controls
- who can access logs
- how preview/staging telemetry is separated from production

High-volume debug logging should not remain permanently enabled in production.

## 17. Alerts — post-MVP unless needed

Alerting should answer actionable failure conditions rather than generating noise.

Potential early alerts later:

- API unavailable/readiness failing
- sustained 5xx error rate
- database unavailable
- repeated failed migration/deployment
- critical background job backlog

Do not create alert rules before the product has an operational owner and a real response path.

## 18. When to upgrade beyond the baseline

Add stronger observability when one or more of these become true:

- failures are difficult to reproduce from structured logs
- several services/workers/queues participate in one flow
- traffic/cost requires latency/error-rate monitoring
- external integrations make bottlenecks unclear
- on-call/SLAs are introduced
- customers report failures faster than the team can diagnose them
- performance regressions need historical comparison

## 19. Provider/vendor integration rules

When a vendor is selected:

- integrate at shared/runtime/infrastructure boundaries, not business-rule files
- keep vendor-specific code thin
- preserve structured logging/request IDs
- prefer OpenTelemetry where practical for traces/metrics
- keep vendor API keys in the secret store
- tag telemetry with service/environment/release
- document sampling and privacy behavior

## 20. Spin-off checklist

For an MVP spin-off, confirm:

- production log level is intentional
- structured logs reach the hosting platform
- request IDs are visible in API responses/logs
- sensitive fields are redacted
- production and preview logs are distinguishable
- deployment/migration failures have accessible logs
- liveness/readiness are wired to infrastructure

Then defer metrics/tracing/error-monitoring unless the product actually needs them.

## Related documentation

- `docs/SECURITY.md` — sensitive-data/error/logging rules
- `docs/DEPLOYMENT.md` — runtime, health, container logging, release flow
- `docs/PREVIEWS.md` — preview environment telemetry identity
- `docs/PRODUCTION_CONFIG.md` — secret handling and environment separation
- `docs/ERROR_HANDLING.md` — public error contracts and internal failures
- `docs/DELIVERY.md` — CI/release validation

The baseline is deliberately small: observability should grow because the product needs better operational answers, not because the template mandates an expensive stack before MVP.
