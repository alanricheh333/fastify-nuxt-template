# Deployment Baseline

This template ships with container definitions that are intentionally provider-neutral. The goal is to give spin-off projects a predictable production runtime shape without coupling the repository to one hosting platform.

## Principles

- build API and web as separate production containers
- keep database migrations separate from application startup
- inject runtime configuration through environment variables/secrets
- run containers as non-root users
- expose liveness/readiness to the deployment platform
- allow enough termination grace time for graceful shutdown
- keep PostgreSQL external in production; the Compose database is for local/container verification only
- do not bake secrets into images

## Container images

### API

`Dockerfile.api` builds the Fastify TypeScript application and runs:

```text
node apps/api/dist/server.js
```

The runtime image:

- runs with `NODE_ENV=production`
- binds to `HOST=0.0.0.0`
- defaults to port `3001`
- runs as the non-root `node` user
- uses `/health/live` as the Docker health check
- does not run database migrations automatically

The application itself exposes both `/health/live` and `/health/ready`. Deployment infrastructure should prefer readiness for traffic routing when supported, while liveness answers whether the process itself is alive.

### Web

`Dockerfile.web` builds the Nuxt application and copies only the Nitro `.output` runtime artifact into the final image.

The runtime image:

- runs with `NODE_ENV=production`
- binds Nitro to `0.0.0.0`
- defaults to port `3000`
- runs as the non-root `node` user
- health-checks the root document

`NUXT_PUBLIC_API_BASE_URL` must point browser clients at the externally reachable API URL for the environment.

## Build images

From the repository root:

```bash
docker build -f Dockerfile.api -t app-api .
docker build -f Dockerfile.web -t app-web .
```

Do not pass secrets through Docker build arguments. Runtime secrets belong in the deployment environment.

## Local container verification

`docker-compose.yml` provides a provider-neutral local stack containing:

```text
PostgreSQL
API
Nuxt web
one-shot migration service
```

The Compose PostgreSQL credentials are development-only defaults and must never be copied into production.

### First start

Build the images:

```bash
docker compose build
```

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Run committed Drizzle migrations explicitly:

```bash
docker compose --profile tools run --rm migrate
```

Then start the applications:

```bash
docker compose up -d api web
```

Verify:

```text
http://localhost:3001/health/live
http://localhost:3001/health/ready
http://localhost:3000
```

For a disposable local stack:

```bash
docker compose down -v
```

The `-v` flag deletes the local Compose PostgreSQL volume. Never use destructive volume removal against an environment containing valuable data.

## Why migrations are separate

The API container deliberately does not execute `db:migrate` on startup.

Automatically migrating from every API replica creates problems when:

- several instances start concurrently
- a migration is long-running
- a schema change is incompatible with the previous application version
- rollback is required
- production requires an approval gate before schema mutation

Instead, deployment should have an explicit migration/release step:

```text
build immutable images
→ validate release
→ run reviewed migration job once
→ deploy/start application instances
→ route traffic after readiness succeeds
```

The exact safe migration strategy is documented separately because production schema rollout deserves its own policy.

## Runtime configuration

### API

The deployment environment must supply the product's real values for runtime configuration, including at least:

```text
NODE_ENV
HOST
PORT
LOG_LEVEL
SHUTDOWN_TIMEOUT_MS
CORS_ALLOWED_ORIGINS
CORS_ALLOW_CREDENTIALS
RATE_LIMIT_MAX
RATE_LIMIT_WINDOW_MS
DATABASE_URL
DB_POOL_MAX
DB_IDLE_TIMEOUT_MS
DB_CONNECTION_TIMEOUT_MS
DB_SSL
```

Use `apps/api/.env.example` as the canonical inventory, not as a production secret file.

The API runtime parser remains the authority for validation. Deployment configuration should fail fast rather than silently inserting production guesses.

### Web

The primary environment-specific web setting currently is:

```text
NUXT_PUBLIC_API_BASE_URL
```

Use `apps/web/.env.example` as the baseline inventory.

Values prefixed with `NUXT_PUBLIC_` are browser-visible. Never place secrets in public Nuxt runtime config.

## Database

Production should use a managed or deliberately operated PostgreSQL service rather than the PostgreSQL container from `docker-compose.yml`.

`DATABASE_URL` must refer to that environment's database. Configure `DB_SSL` to match the provider's TLS requirements.

Use separate databases/credentials for development, CI/test, staging, preview, and production where those environments exist.

## Health checks

### Liveness

```text
GET /health/live
```

Use this to determine whether the API process is alive. Keep it free of external dependency checks.

### Readiness

```text
GET /health/ready
```

Use this for routing/load-balancer readiness when the platform supports it. It becomes `503` during graceful shutdown or when a registered critical readiness dependency fails.

Do not route traffic to a new instance until readiness passes.

## Graceful shutdown

The API handles `SIGTERM` and `SIGINT` and performs ordered shutdown.

Deployment platforms must not immediately send `SIGKILL` after `SIGTERM`. Give the application at least `SHUTDOWN_TIMEOUT_MS` plus a small infrastructure margin.

The Compose baseline uses:

```text
stop_grace_period: 15s
```

with the current application default of a 10-second shutdown timeout.

If a product increases `SHUTDOWN_TIMEOUT_MS`, update the platform termination grace period accordingly.

The web container also receives a termination grace period even though its lifecycle is currently simpler.

## Reverse proxies and TLS

Production HTTP should normally sit behind a trusted ingress/reverse proxy/load balancer that terminates TLS.

Examples include managed platform ingress, Cloudflare, Traefik, Nginx, or cloud load balancers.

Do not enable Fastify `trustProxy` globally until the actual deployment topology is known. Incorrect proxy trust can allow clients to spoof forwarding headers and undermine IP-based controls such as rate limiting.

Trusted proxy configuration is therefore a separate deployment decision in this template roadmap.

## CORS

`CORS_ALLOWED_ORIGINS` must contain the actual browser origins for the environment.

For example, a production product may have:

```text
https://app.example.com
```

Do not leave `http://localhost:3000` configured in production merely because it is present in Compose.

If the product later uses cross-origin cookies, coordinate credentialed CORS with the authentication/CSRF design instead of changing CORS independently.

## Secrets

Do not commit production `.env` files and do not copy them into Docker images.

Supply secrets through the hosting platform's secret manager/environment system. Common secrets include:

- PostgreSQL credentials/URL
- auth/session signing material
- third-party API tokens
- webhook signing secrets
- email/SMS credentials
- object storage credentials

Secrets and production configuration are covered in greater detail by the dedicated secrets/config roadmap step.

## Filesystem assumptions

Treat containers as replaceable and their filesystem as ephemeral.

Do not persist uploads, generated business files, sessions, queues, or important state inside the API/web container filesystem. Use appropriate external storage/services when a product requires persistent data.

## Horizontal scaling

The current HTTP runtime can be replicated, but product spin-offs must review process-local infrastructure before adding multiple API replicas.

In particular, the template's default rate limiter uses process memory. Before horizontal scaling, move rate limiting to a shared store such as Redis.

Also review:

- scheduled jobs
- queue consumers
- in-memory caches
- websocket/session affinity if introduced
- concurrency/idempotency behavior

## CI and image validation

Normal repository CI validates source, architecture, tests, E2E behavior, migrations, and builds. A product's release pipeline should additionally build the exact Docker images that will be deployed.

Recommended release shape:

```text
CI green
→ build immutable API/web images
→ tag by commit SHA/release
→ push to registry
→ run migration/release job
→ deploy images
→ readiness check
→ expose traffic
```

Do not rebuild different source code separately on the production host after approval; deploy the immutable artifact that was validated.

## Provider-specific configuration

This baseline intentionally does not prescribe:

- AWS / Azure / GCP
- Fly.io / Render / Railway
- Kubernetes
- Docker Compose on a VPS
- Cloudflare deployment
- Traefik vs Nginx
- container registry choice

A spin-off may add provider-specific deployment files once the hosting decision is known. Keep those files thin and preserve the runtime contracts defined here.

## Spin-off checklist

When a new product adopts this deployment baseline:

- build both Dockerfiles successfully
- replace Compose development values with platform environment/secrets in deployed environments
- provision external PostgreSQL
- define an explicit migration job
- configure real CORS origins
- configure `NUXT_PUBLIC_API_BASE_URL`
- configure TLS/ingress
- wire `/health/ready` into traffic readiness where supported
- ensure termination grace exceeds application shutdown timeout
- decide trusted-proxy behavior before relying on forwarded client IPs
- move process-local infrastructure to shared services before horizontal scaling where required
- never use the Compose PostgreSQL credentials/volume as the production database strategy
