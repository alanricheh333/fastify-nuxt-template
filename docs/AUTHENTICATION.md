# Authentication

Authentication is optional and product-specific. Do not add authentication to a product merely because the template supports it.

## Default decision process

Before implementing authentication, determine:

1. whether the product needs authentication at all
2. the client types involved (browser/PWA, mobile, server-to-server, enterprise SSO)
3. whether custom email/password authentication is appropriate or an external identity provider should be used
4. session lifetime, device/session management, revocation, logout-all-devices, and password-reset requirements
5. whether cross-site frontend/API deployment changes cookie or CSRF requirements

Do not implement auth before these requirements are clear.

## Recommended custom-auth baseline

When a product needs simple custom email/password authentication, prefer:

```text
email/password
      ↓
Argon2id password hash
      ↓
short-lived access JWT in Secure HttpOnly cookie
      +
rotating refresh token in Secure HttpOnly cookie
      ↓
PostgreSQL-backed auth session
```

The access JWT is short-lived authentication proof. The PostgreSQL session is the long-lived authority over the login.

Do not store access JWTs in PostgreSQL by default.

The session record should own refresh-token/session state such as:

- stable session id
- user id
- refresh-token hash, never the raw refresh token
- creation time
- expiration time
- last-used time when useful
- revocation time/status
- optional user-agent/device metadata
- optional IP/security metadata where justified

The access JWT may contain minimal claims such as:

- `sub`: user id
- `sid`: auth session id
- `iat`
- `exp`

Keep JWT claims minimal. Do not treat JWT contents as a substitute for current business data or authorization state.

## Refresh tokens

Refresh tokens must be rotated when used.

A successful refresh flow should:

1. validate the presented refresh token
2. load and validate the corresponding server-side auth session
3. compare the token against the stored hash
4. invalidate/replace the previous refresh-token state
5. issue a new short-lived access JWT and a new refresh token

Refresh-token reuse should be treated as a potential compromise. Products that require strong session security should revoke the affected session, and may revoke the broader token family or all user sessions depending on the threat model.

Do not store raw refresh tokens in the database.

## Cookies

Browser/PWA auth tokens must not be stored in `localStorage` or other JavaScript-readable persistent storage by default.

Use cookies with appropriate settings:

- `HttpOnly`
- `Secure` in production
- an explicit `SameSite` policy
- narrow domain/path scope where practical
- finite expiry/max-age

Exact lifetimes and SameSite settings are product-specific and must be chosen together with the CSRF and deployment model.

## Passwords

For custom password authentication:

- use Argon2id with current recommended parameters
- never store plaintext or reversible passwords
- never log passwords
- enforce reasonable password-strength rules without arbitrary complexity requirements
- support password reset only through time-limited, single-use secure tokens
- invalidate or rotate relevant auth sessions after sensitive credential changes when required by the product's threat model

## Authentication boundary

Generic authentication belongs at the HTTP/transport boundary.

A Fastify pre-handler/plugin/middleware may:

- read and verify the access credential
- determine whether the request is authenticated
- extract minimal identity/session claims
- attach authenticated request context for the transport layer

Business/application code must not depend on `FastifyRequest`.

Translate transport-specific identity into a framework-neutral actor/auth context before entering the application layer, for example:

```ts
type AuthenticatedActor = {
  userId: string
  sessionId: string
  roles?: string[]
}
```

Keep this context minimal and add fields only when they are stable application concepts.

## Authorization

Separate generic access control from business authorization.

Generic transport-level checks may be implemented in middleware/pre-handlers/decorators, for example:

- authentication required
- generic platform role required
- verified account required where this is genuinely an infrastructure-level policy

Business-specific authorization belongs in rules, for example:

- whether this user owns the resource
- whether this employer may edit this gig
- whether this account may perform a state transition
- whether an actor may approve a domain operation

Do not hide business decisions inside generic auth middleware.

## Identity/user ownership

Authentication and user identity should normally have explicit ownership, commonly an `identity` slice/capability.

Do not move the user model into `shared` merely because many slices reference users.

For commands, writes, and identity behavior, other slices should use the owning slice facade.

Read-only query projections may join/read user tables directly according to the repository's existing query-layer rules.

If a product's identity model is fundamentally external (for example Keycloak, ZITADEL, enterprise SSO, or another OIDC provider), keep application-facing auth context provider-agnostic.

## CSRF

Cookie-based authentication requires an explicit CSRF strategy. Do not treat `SameSite` alone as a complete security design.

Before implementation, evaluate the actual deployment model and apply a defense-in-depth strategy that may include:

- restrictive `SameSite` cookies where compatible with the product
- strict Origin validation on state-changing requests
- Referer validation as an additional signal where appropriate
- explicit CSRF tokens for state-changing requests when the deployment model requires them
- narrow CORS configuration with credentials only for explicitly trusted origins
- rejecting state-changing requests that do not satisfy the product's CSRF policy

Cross-site frontend/API deployments, embedded clients, third-party integrations, or federated login flows must be reviewed explicitly because they can change the correct cookie and CSRF strategy.

## Login and account security

Custom authentication implementations must consider:

- rate limiting and brute-force protection
- account enumeration resistance where appropriate
- safe login and password-reset error messages
- email verification when the product requires trustworthy email ownership
- secure logout and session revocation
- logout-all-devices when required
- refresh-token theft/reuse detection
- session fixation prevention
- audit/security logging without leaking credentials or tokens

## Error handling

Authentication errors must use the repository's centralized typed-error model.

Do not return raw JWT, database, cryptographic, or identity-provider errors to clients.

Map application/auth errors centrally to stable external error codes and appropriate HTTP statuses.

## External identity providers

A product may use an external provider such as Keycloak, ZITADEL, Auth0, Supabase Auth, Entra ID, or another standards-based identity provider when requirements justify it.

Prefer OIDC/OAuth2 standards and keep business code independent of the provider.

The provider-specific adapter should resolve the external identity into the same framework-neutral application auth context used by custom authentication.

Do not hard-wire the application domain to provider SDK types, token payloads, or provider-specific user objects.

## Implementation rule for agents

When asked to add authentication to a new product:

1. read this document, `AGENTS.md`, `SECURITY.md`, and the product requirements
2. determine whether authentication is actually required
3. choose custom auth versus external IdP based on product needs
4. if custom auth is appropriate, default to short-lived access JWT + rotating refresh token + PostgreSQL-backed auth session unless requirements justify another design
5. define the CSRF/cookie/CORS strategy before writing handlers
6. define identity ownership and the framework-neutral actor context
7. keep generic authentication at the HTTP boundary and domain authorization in rules
8. add product-specific tables, errors, flows, and tests only after these decisions are explicit
9. document the resulting auth model in the relevant product/slice README
10. never weaken token, cookie, password, CSRF, authorization, or session controls merely to make implementation easier
