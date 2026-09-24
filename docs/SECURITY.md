# Security Baseline

Security is part of feature design, not a final cleanup step.

For every externally reachable or data-changing feature, explicitly consider the following before implementation is complete.

## Trust boundaries

Treat all external input as untrusted, including:

- HTTP bodies, params, headers, cookies, and query strings
- event payloads
- file uploads
- webhook payloads
- values read from external APIs
- user-controlled database content later reused in another context

Validate at the boundary and keep internal application inputs explicit.

## Authentication and authorization

- Authentication proves identity; authorization decides whether the identity may perform the action.
- Never assume that an authenticated user is authorized for a resource.
- Enforce ownership, role, tenant, and capability checks explicitly.
- Do not trust user-supplied IDs to imply ownership.
- Return only the data the caller is allowed to see.

Business authorization rules that belong to the domain should be expressed as pure rules where practical.

## Input handling

- Use schema validation for externally supplied data.
- Reject unexpected shapes when practical.
- Apply sensible length, range, count, and format limits.
- Prevent mass assignment by mapping explicit accepted fields rather than blindly spreading request bodies into persistence operations.
- Use parameterized Drizzle/SQL APIs. Never concatenate untrusted input into SQL.

## Abuse and resource exhaustion

Consider:

- rate limiting
- brute-force protection
- pagination and maximum page sizes
- upload size/type limits
- expensive search/filter combinations
- repeated event/webhook delivery
- unbounded loops or batch operations
- denial-of-service risks caused by expensive queries

Choose limits appropriate for the feature and production environment.

## Secrets and credentials

- Never commit secrets, tokens, passwords, private keys, or production credentials.
- Read secrets from environment/secret stores.
- Keep `.env.example` free of real secrets.
- Use least-privilege credentials.
- Keep development/test credentials separate from production credentials.

## Logging and errors

- Do not log passwords, tokens, session identifiers, sensitive personal data, or secrets.
- Do not expose stack traces or internal implementation details to clients in production.
- Return stable public errors while retaining useful internal observability.
- Sanitize logs when external values could cause log injection or excessive payload size.

## Browser and HTTP security

For HTTP applications consider:

- secure cookie flags (`HttpOnly`, `Secure`, appropriate `SameSite`)
- CSRF protection when authentication design requires it
- strict CORS configuration in production
- security headers
- TLS at production ingress
- XSS risks for user-generated content
- open redirects
- cache headers for sensitive responses

CORS rules:

- configure trusted origins through `CORS_ALLOWED_ORIGINS`
- use exact origins rather than wildcard production access
- reject unknown browser origins
- allow requests without an `Origin` header so server-to-server clients, CLI tools, and health checks continue to work
- enable credentialed CORS only when a product actually requires cookie/credential-based cross-origin requests
- when credentials are enabled, keep origins explicit and coordinate CORS with the product's cookie and CSRF design
- never use permissive `origin: true` or `*` in production merely to make a frontend error disappear

Security-header rules:

- register `@fastify/helmet` globally on the API
- keep HSTS disabled in local development and enable it in production
- do not define a generic global CSP in the base API template
- define CSP at the layer that actually serves browser documents, usually Nuxt or the ingress/reverse proxy
- if an API-served HTML surface such as Swagger UI needs a special policy, scope that exception to that surface instead of weakening the whole application
- do not disable Helmet headers merely to work around an integration issue without understanding the security impact

## State-changing operations

For writes consider:

- authorization
- idempotency when requests/events may be retried
- concurrency/race conditions
- database constraints
- transaction boundaries
- duplicate submissions
- replay attacks for externally signed/webhook requests

Use the database to enforce invariants such as uniqueness and referential integrity where appropriate, in addition to application rules.

## Events and webhooks

- Validate event payloads.
- Verify signatures for external webhooks when supported.
- Assume at-least-once delivery unless the infrastructure guarantees otherwise.
- Design important consumers to tolerate duplicate delivery.
- Do not trust events merely because they arrived through a queue.

## Dependencies

- Prefer maintained dependencies with clear ownership.
- Avoid adding packages for trivial functionality.
- Keep dependency versions and lockfiles committed.
- Review security implications of new runtime dependencies.

## Production readiness

Before completion ask:

- What changes when multiple application instances run concurrently?
- Does this rely on local process memory or filesystem state?
- Does the operation remain correct under retries?
- Are timeouts and failure paths reasonable?
- Can a user intentionally or accidentally make the query/workload unbounded?
- Are secrets and production configuration externalized?
- Is there a safe migration/deployment path?

Do not claim that an application can never be hacked. Instead, implement defense in depth, minimize attack surface, follow secure defaults, and explicitly flag residual risks.
