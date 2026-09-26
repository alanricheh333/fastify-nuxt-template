# Testing Strategy

## Principles

Testing should verify behavior, not implementation details.

The strongest default is:

- pure unit tests for business rules
- component tests for meaningful Vue behavior
- end-to-end tests for complete externally visible use-case flows where they provide meaningful confidence
- no mock-heavy orchestration/service tests
- no tests that merely assert internal call order

## Test-driven development

Use a test-driven loop for business behavior where practical:

1. Read the requirement and identify the business behavior.
2. Write the rule/component/E2E test that expresses the behavior at the correct boundary.
3. Run it and confirm it fails for the expected reason.
4. Implement the smallest correct change that makes it pass.
5. Refactor while keeping the test green.
6. Run all tests relevant to the affected slice.

Do not write production logic first and add superficial tests afterwards when the expected behavior can be expressed clearly up front.

## Backend rule tests

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

## Frontend component tests

Use the naming convention:

```text
ComponentName.vue
ComponentName.comp.test.ts
```

Component tests should verify meaningful observable UI behavior such as:

- rendering based on props/state
- emitted events
- user interactions
- loading/error/disabled states
- accessibility-relevant behavior
- important conditional rendering

Do not test Vue implementation details, internal refs, or private component structure merely to increase coverage.

Do not duplicate backend business-rule tests in components. Frontend tests should focus on presentation and interaction behavior.

Prefer testing the smallest component boundary that gives meaningful confidence.

## Frontend composable tests

Pure logic extracted from composables should be tested as pure functions.

Test composables directly only when they contain meaningful frontend orchestration that cannot be validated more clearly through a component or E2E test.

Avoid tests that simply mock Pinia Colada/API functions and assert internal call order. If a composable becomes difficult to test without heavy mocking, simplify it and extract deterministic logic.

## Pinia and Pinia Colada testing

Do not test library behavior owned by Pinia or Pinia Colada.

Test application behavior around them:

- correct loading/error/success UI behavior
- cache invalidation effects when they are important to the feature
- state that must persist across navigation
- feature-specific optimistic update behavior

Avoid copying remote state into Pinia solely to make tests easier.

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
- a complete user workflow across frontend and backend
- critical bilingual/LTR/RTL flows where regressions would materially affect users

End-to-end tests should verify observable behavior rather than private service implementation.

Do not add E2E tests mechanically to every small change. Use them where the boundary itself is important.

## Real PostgreSQL E2E infrastructure

API E2E tests run in a separate Vitest suite configured by `apps/api/vitest.e2e.config.ts` and use a real PostgreSQL database.

The E2E suite must read its database from `TEST_DATABASE_URL`. Keep this separate from the normal application `DATABASE_URL` so test cleanup or destructive setup cannot affect development or production data.

Local workflow:

1. start a disposable/local PostgreSQL instance
2. create a dedicated test database, for example `app_test`
3. set `DATABASE_URL` to that test database and run `pnpm --filter @app/api db:migrate`
4. set `TEST_DATABASE_URL` to the same dedicated test database and run `pnpm --filter @app/api test:e2e`

CI provides PostgreSQL as a GitHub Actions service, applies the committed Drizzle migrations, then runs the API E2E suite against that database.

Keep the E2E suite non-parallel by default while tests share one database. If the suite grows enough to require parallel execution, isolate tests by database/schema rather than allowing concurrent tests to mutate shared state unpredictably.

The initial database E2E test intentionally performs a real SQL query. It is a smoke test for the harness itself and should remain lightweight.

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

## API contract and documentation testing

HTTP endpoint tests should validate important request/response contracts where practical, including expected validation failures and error shapes.

Swagger/OpenAPI generation should remain derived from the same endpoint schemas used for runtime validation/serialization so tests do not need to maintain a separate API contract definition.

## Test data

Keep test data explicit and easy to understand.

Prefer small builders/factories only when repetition becomes material. Do not create large opaque fixture systems that hide the state relevant to a test.

Use deterministic IDs/timestamps where useful.

## What to run before completion

At minimum, run:

- tests for changed backend rules
- relevant frontend component tests
- all unit tests for the affected use case/slice
- relevant E2E tests when applicable
- type checking
- linting
- architecture checks
- build

If a command cannot be run, explicitly report what was not run and why.
