# Testing Strategy

## Principles

Testing should verify behavior, not implementation details.

The strongest default is:

- pure unit tests for business rules
- end-to-end tests for complete externally visible use-case flows where they provide meaningful confidence
- no mock-heavy orchestration/service tests
- no tests that merely assert internal call order

## Test-driven development

Use a test-driven loop for business behavior where practical:

1. Read the requirement and identify the business behavior.
2. Write the rule test that expresses the behavior.
3. Run it and confirm it fails for the expected reason.
4. Implement the smallest pure rule change that makes it pass.
5. Refactor while keeping the test green.
6. Run all tests relevant to the affected slice.

Do not write production logic first and add superficial tests afterwards when the business rule can be expressed clearly up front.

## Rule tests

Every business rule must have colocated unit tests.

Example:

```text
rules/
  can-apply-to-gig.rule.ts
  can-apply-to-gig.rule.test.ts
```

Rule tests:

- use plain values
- do not use mocks
- do not initialize Fastify
- do not access a database
- do not call a network
- do not depend on environment variables
- verify successful behavior and meaningful edge/failure cases

Rules that use current time must receive the relevant time value as input rather than reading the system clock directly.

## Service tests

Do not create unit/spec tests for services simply to mock repositories/rules and assert calls such as:

```text
expect(repo.save).toHaveBeenCalled()
expect(rule).toHaveBeenCalledWith(...)
```

Services are orchestration and should remain simple enough that such tests provide little value.

If a service becomes complex enough that mock-heavy tests seem necessary, first check whether business decisions or too much responsibility have leaked into the service.

## End-to-end tests

Use end-to-end tests when they provide confidence across a meaningful application boundary.

Good candidates:

- a complete HTTP use case
- authentication/authorization behavior
- request validation and response contract
- a complete feature-slice workflow
- an important database transaction
- an important event-driven flow
- behavior that depends on real Fastify/Drizzle integration

End-to-end tests should verify observable behavior rather than private service implementation.

Do not add E2E tests mechanically to every small change. Use them where the boundary itself is important.

## Database tests

Pure business-rule tests should not require the database.

When database behavior must be verified, prefer a real disposable PostgreSQL test database/container over mocking Drizzle internals.

Particularly valuable database tests include:

- non-trivial joins/aggregations
- transaction semantics
- concurrency-sensitive writes
- migrations/constraints
- PostgreSQL-specific behavior

## Query testing

Simple queries may be covered by feature-level E2E tests.

Complex queries that contain joins, aggregation, CTEs, pagination, or PostgreSQL-specific logic should be tested against a real test database when failure risk justifies it.

Do not mock the SQL builder merely to test generated call structure.

## Test data

Keep test data explicit and easy to understand.

Prefer small builders/factories only when repetition becomes material. Do not create large opaque fixture systems that hide the state relevant to a test.

Use deterministic IDs/timestamps where useful.

## What to run before completion

At minimum, run:

- tests for changed rules
- all unit tests for the affected use case/slice
- relevant E2E tests when applicable
- type checking
- linting
- architecture checks
- build

If a command cannot be run, explicitly report what was not run and why.