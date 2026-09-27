# Production Secrets and Configuration

This document defines how spin-off projects should handle runtime configuration, secrets, environment separation, and credential lifecycle in production.

The goals are:

- keep secrets out of source control and container images
- make configuration explicit and typed
- separate public configuration from confidential values
- isolate environments from each other
- use least-privilege credentials
- make rotation and incident response practical
- fail startup when required configuration is missing or malformed

## 1. Configuration categories

Every runtime value should be classified before it is introduced.

### Public/non-secret configuration

Examples:

- `NODE_ENV`
- `HOST`
- `PORT`
- `LOG_LEVEL`
- CORS origins
- rate-limit thresholds
- timeout values
- feature-neutral operational limits
- public API base URLs

These values do not need secrecy, but they still belong in environment-specific configuration rather than being scattered through application code.

### Secrets

Examples:

- database passwords/connection strings containing credentials
- JWT/session signing keys
- refresh-token encryption/signing material
- OAuth client secrets
- webhook signing secrets
- email/SMS provider credentials
- object-storage credentials
- payment provider secrets
- third-party API tokens
- private keys and certificates

Secrets must never be committed, copied into Docker images, stored in public Nuxt runtime config, or printed to logs.

### Build-time values

Avoid build-time secrets.

A value should be supplied at image build time only when the produced artifact genuinely must differ by build. Prefer runtime injection so the same immutable image can be promoted across environments.

Do not use Docker `ARG` for secrets. Build arguments can leak through image metadata, build logs, caches, or CI history.

## 2. Source-of-truth rules

### API

`apps/api/.env.example` is the inventory of supported API environment variables, but it contains placeholders/development-safe values only.

The centralized runtime-config parser is the application authority for:

- required vs optional values
- defaults
- types
- validation
- allowed ranges/enums

Infrastructure modules must consume the typed config object instead of reading `process.env` independently.

When adding a new API variable, update together:

1. `.env.example`
2. runtime config type
3. runtime config parser
4. parser tests
5. infrastructure/application wiring
6. production configuration documentation when operationally relevant

### Web

`apps/web/.env.example` is the web configuration inventory.

Anything under Nuxt public runtime config, including names prefixed with `NUXT_PUBLIC_`, must be treated as publicly visible browser data.

Never put secrets into `NUXT_PUBLIC_*` values.

If the web server later needs server-only secrets, place them in Nuxt server/private runtime config and keep their usage strictly server-side.

## 3. Environment separation

Use separate configuration and credentials for each environment.

Typical environments:

```text
local development
CI/test
preview
staging
production
```

Do not reuse production credentials in lower environments.

At minimum, isolate:

- PostgreSQL database/credentials
- auth/session signing material
- third-party provider credentials
- webhook secrets
- storage credentials
- encryption keys

This limits blast radius and prevents test/preview systems from affecting production.

## 4. Local development

Local `.env` files are allowed for developer convenience and must remain ignored by Git.

Use `.env.example` to document variable names and safe local defaults/placeholders.

Never paste real production secrets into `.env.example` or documentation.

If a developer temporarily needs access to a real external sandbox credential, store it only in their local environment/approved password or secret manager, not in the repository.

## 5. CI configuration

CI should use dedicated test credentials and disposable/test infrastructure.

Rules:

- never use production database credentials in CI
- use CI secret storage for confidential values
- keep secret exposure limited to the job/step that needs it
- do not echo secret-bearing variables
- avoid passing secrets as command-line arguments when process listings/logs may expose them
- prefer short-lived/federated credentials when the platform/provider supports them

Pull requests from untrusted forks must not automatically receive production or sensitive repository secrets.

## 6. Production secret storage

Use the hosting/cloud platform's secret manager or secure environment-variable mechanism.

Examples of acceptable patterns include:

- managed secret stores
- deployment-platform encrypted secrets
- workload identity/federated credentials
- mounted secret files when the platform supports secure file injection

The repository intentionally does not prescribe one vendor.

Do not store production `.env` files in Git, Docker images, release artifacts, tickets, or chat messages.

## 7. Least privilege

Each credential should have only the permissions required by the process using it.

Examples:

```text
API runtime DB role
→ normal application read/write permissions
→ no schema migration privileges where practical

migration DB role
→ controlled DDL/migration permissions
→ used only by migration jobs

object storage runtime credential
→ access only to required bucket/path/actions

CI credential
→ access only to resources CI needs
```

Avoid one shared admin credential used by local development, CI, application runtime, migrations, and production operations.

## 8. Database credentials

`DATABASE_URL` is a secret whenever it contains credentials.

Production recommendations:

- use a dedicated runtime DB user
- use a separate migration role when practical
- require TLS when supported/required by the provider
- restrict network access to expected application/migration sources
- rotate credentials when exposure is suspected
- never log the full connection URL

Do not expose production DB credentials to the web application/browser.

## 9. Authentication and cryptographic material

When a spin-off introduces authentication, signing/encryption keys become high-value secrets.

Rules:

- generate strong random keys with an approved cryptographic generator
- do not derive production secrets from human-memorable strings
- separate environments
- support rotation where token/session design requires it
- avoid logging keys/tokens
- document which keys invalidate existing sessions/tokens when rotated

If key rotation requires simultaneous old/new keys, represent that explicitly in the auth design rather than replacing values ad hoc.

## 10. Public URLs and CORS

Values such as these are normally non-secret:

```text
CORS_ALLOWED_ORIGINS
NUXT_PUBLIC_API_BASE_URL
```

They are still environment-specific and must be configured correctly for production.

Do not treat obscurity of an API URL as a security boundary.

CORS is a browser policy, not authentication. Sensitive endpoints still require proper authentication/authorization.

## 11. Logging and secret redaction

The API logging baseline already redacts common sensitive fields. New features/integrations must extend protection when they introduce new sensitive headers/fields.

Never log:

- passwords
- access/refresh tokens
- authorization headers
- cookies/session IDs
- private keys
- database passwords/full credential-bearing URLs
- webhook signatures/secrets
- provider secret keys

When diagnosing configuration problems, log the variable name/state, not the secret value.

Good:

```text
PAYMENT_API_KEY is missing
```

Bad:

```text
PAYMENT_API_KEY=sk_live_...
```

## 12. Startup behavior

Production applications should fail fast when required configuration is missing or invalid.

Do not silently replace required production values with insecure defaults.

Examples of unsafe fallback behavior:

- generating a new session-signing secret every boot
- defaulting production DB credentials
- enabling wildcard CORS because origins are missing
- disabling TLS verification automatically
- switching off authentication/security middleware because config is absent

The central runtime-config parser should reject invalid state before long-lived resources are created.

## 13. Configuration changes and deployment

Treat significant configuration changes like code changes.

Before applying production config changes:

- understand the runtime effect
- verify compatibility with the deployed application version
- avoid changing unrelated values simultaneously
- use environment approval/audit mechanisms where available
- confirm readiness/health after rollout

When possible, deploy code that understands both old and new configuration before making a breaking configuration change.

## 14. Secret rotation

Every important production credential should have a known rotation path.

Rotate when:

- a secret may have been exposed
- a developer/service no longer needs access
- a provider recommends/forces rotation
- regular security policy requires it

General rotation flow:

```text
create new credential/key
→ grant required access
→ configure application to use new value
→ deploy/restart safely
→ verify behavior
→ revoke old credential
→ verify old credential no longer works
```

For systems that support dual keys, use overlap to avoid downtime.

Do not revoke the old credential before the running application has successfully switched unless the incident requires immediate containment.

## 15. Secret exposure response

If a secret is committed or otherwise exposed:

1. assume it is compromised
2. revoke/rotate it immediately
3. update affected environments
4. verify application recovery
5. inspect relevant logs/audit trails
6. remove the secret from current source files
7. clean repository history when appropriate, but understand that history cleanup does not replace revocation
8. document the incident/remediation according to the product's process

Deleting the Git commit alone is not sufficient because clones, caches, CI logs, and third-party indexes may retain the value.

## 16. Configuration naming

Prefer explicit environment variable names that describe the integration/behavior.

Good:

```text
DATABASE_URL
STRIPE_SECRET_KEY
EMAIL_PROVIDER_API_KEY
AUTH_ACCESS_TOKEN_TTL_SECONDS
```

Avoid ambiguous names such as:

```text
KEY
SECRET
TOKEN
URL
```

Use consistent units in names for time/count values, such as `_MS`, `_SECONDS`, or `_MAX`.

## 17. Feature flags and business configuration

Do not turn business rules into environment variables just because environment config is convenient.

Environment variables are appropriate for deployment/runtime concerns.

If a value controls business behavior and may need auditing, user/tenant-specific values, runtime editing, or product ownership, model it as product data/configuration instead.

Feature flags may be environment/runtime configuration when they are operational rollout controls, but document ownership and removal criteria.

## 18. Preview environments

Preview environments must not receive production secrets by default.

Use sandbox/test provider credentials and isolated databases.

If a preview does not need a privileged integration, omit that secret entirely rather than copying production configuration for convenience.

Remember that preview URLs and logs may have broader visibility than production infrastructure.

## 19. Backups are not configuration management

Database backups and container images are not substitutes for secret/config management.

Do not depend on recovering credentials from old VM snapshots, images, or backup archives.

Configuration should be reproducible from the deployment platform/secret store plus documented non-secret settings.

## 20. Spin-off checklist

Before the first production deployment, confirm:

- all required variables are represented in `.env.example` without real secrets
- the API parser validates required production configuration
- production secrets live in an approved secret/environment store
- production credentials are different from development/CI/staging credentials
- browser-visible Nuxt config contains no secrets
- database runtime and migration roles follow least privilege where practical
- logs redact all known sensitive fields
- CI cannot expose production secrets to untrusted pull requests
- credential rotation procedures are understood for critical integrations
- significant configuration changes are auditable
- no production `.env` file is committed or baked into an image

## 21. Related documentation

- `docs/SECURITY.md` — application/security baseline
- `docs/DEPLOYMENT.md` — provider-neutral runtime/container deployment
- `docs/MIGRATIONS.md` — migration roles and release execution
- `docs/SPINOFF.md` — new-product operational workflow
- `docs/AUTHENTICATION.md` — auth-specific credential/key guidance when auth is introduced
- `apps/api/.env.example` — API configuration inventory
- `apps/web/.env.example` — web configuration inventory

Provider-specific secret-manager configuration should be added only after the hosting platform is selected. It should implement these rules rather than replacing them with hard-coded values or repository-managed production secrets.
