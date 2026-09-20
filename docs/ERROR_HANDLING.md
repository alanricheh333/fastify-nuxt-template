# Error handling

## Goals

The API uses typed application/business errors internally and one centralized Fastify error handler externally.

Business logic must not depend on HTTP status codes. Rules and services throw or propagate typed errors. The HTTP layer maps stable application error codes to transport status codes at the application composition root.

## Error flow

```text
rule / service
  -> throws typed ApplicationError subclass
  -> facade / HTTP handler lets it propagate
  -> centralized Fastify error handler
  -> explicit error-code-to-status mapping
  -> shared API error response
```

## Application errors

All meaningful business/application errors extend `ApplicationError`.

Example:

```ts
export class ApplicationAlreadyExistsError extends ApplicationError {
  constructor() {
    super({
      code: 'APPLICATION_ALREADY_EXISTS',
      message: 'An application already exists.',
    })
  }
}
```

Errors should live as close as possible to their ownership:

- use-case-specific error -> that use case's `errors/` folder
- reused by multiple use cases in one slice -> slice-level `errors/`
- genuinely reused across slices -> `shared/errors/`

Do not move errors to `shared` merely for convenience.

## HTTP mapping

HTTP status codes are transport concerns. Do not put status codes on business errors.

Register mappings in `apps/api/src/application-error-http-map.ts`:

```ts
export const applicationErrorHttpMap = {
  GIG_NOT_FOUND: 404,
  APPLICATION_ALREADY_EXISTS: 409,
} satisfies ApplicationErrorHttpMap
```

Every business error exposed through HTTP must be explicitly registered. An unmapped application error is treated as a configuration/programming error: it is logged internally and returned as a sanitized 500 response.

This keeps `shared` independent from slices and avoids a central handler importing every product-specific error class.

## API response contract

All handled API errors use the same external shape:

```json
{
  "error": {
    "code": "APPLICATION_ALREADY_EXISTS",
    "message": "An application already exists.",
    "requestId": "req-123"
  }
}
```

Validation errors may additionally include `details`.

The client may use `code` for stable programmatic handling. Human-readable `message` must not be treated as a stable identifier.

## Validation errors

Fastify validation errors are normalized to:

- HTTP 400
- code `VALIDATION_ERROR`
- safe public message
- request ID
- validation details when available

## Not found

Unknown routes are normalized through the not-found handler to:

- HTTP 404
- code `ROUTE_NOT_FOUND`
- shared error response shape

## Unexpected errors

Unexpected errors and unmapped application errors:

- are logged with the request context
- return HTTP 500
- return code `INTERNAL_SERVER_ERROR`
- never expose stack traces, database messages, secrets, or raw internal exception text

## Rules

Rules may throw typed application/business errors. This is preferred when returning a result object would force business branching into a service.

Services should normally let typed business errors propagate. Do not catch and translate an error unless the service has a real application-level reason to do so.

Controllers/HTTP handlers should not repeat try/catch blocks simply to map known application errors. Let the centralized handler perform transport mapping.

## Swagger

`apiErrorSchema` is the shared OpenAPI schema for the external error contract. Endpoints should reference or use this common shape for documented error responses rather than inventing endpoint-specific formats.
