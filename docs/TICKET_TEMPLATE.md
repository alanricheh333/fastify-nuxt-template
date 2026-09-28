# Implementation Ticket Template

Use this template for product implementation tickets, whether they live in Trello, GitHub, or another task system.

The goal is to make each ticket detailed enough that a coding agent can implement it without guessing important product behavior, while avoiding unnecessary low-level design instructions.

A ticket should normally be small enough to map to one focused coding task and one pull request.

## Readiness rule

A ticket is not ready for implementation if an agent would need to guess an important product rule.

Before moving a ticket to `Ready`, confirm:

- the goal is clear
- scope is clear
- important business rules are defined
- acceptance criteria are testable
- hard dependencies are complete
- required resources are available or explicitly accounted for
- no unresolved product decision blocks implementation

If a material requirement is unclear, ask for clarification before implementation.

## Ticket structure

### Summary

Provide a concise description of the capability being implemented.

A reader should understand the purpose of the ticket from this section alone.

### Goal

Describe the user or business outcome that must exist when the ticket is complete.

Focus on behavior rather than implementation details.

### Description

Explain the expected workflow in enough detail for a coding agent to understand what must happen.

Include relevant information such as:

- who uses the capability
- when they use it
- relevant inputs
- expected outputs
- important states
- failure/rejection cases
- interactions with other product capabilities

Do not assume the coding agent will infer missing business behavior from the UI or database model.

### Scope

#### In scope

List the behavior and deliverables required by this ticket.

#### Out of scope

List related behavior intentionally deferred to another ticket or post-MVP.

Use this section to prevent accidental scope expansion.

### Business rules

List the rules that govern the feature.

Include relevant rules such as:

- permissions
- ownership
- validation
- eligibility
- state transitions
- timing
- limits
- uniqueness
- ordering/priority
- failure conditions
- duplicate/idempotency behavior

Where appropriate, these rules should become pure business rules according to `docs/ARCHITECTURE.md`.

Do not hide important product decisions inside implementation notes.

### Acceptance criteria

Provide concrete, externally verifiable outcomes.

Prefer behavior-oriented criteria such as:

- Given X, when Y happens, then Z occurs.
- An authorized user can perform X.
- An unauthorized user cannot perform X and receives the expected failure.
- Required data is persisted correctly.
- The API returns the expected contract.
- The UI reflects the expected state.

Avoid acceptance criteria that only describe internal implementation details.

### Implementation steps

Provide a practical high-level sequence that helps the coding agent approach the work.

Typical steps may include:

1. inspect the existing affected slice/code
2. identify or create the correct business-process slice
3. define/update business rules
4. define/update DTOs/contracts
5. add/update database schema when required
6. generate and review migrations
7. implement repository/query behavior
8. implement service orchestration
9. expose behavior through the facade
10. implement HTTP/event/job entry points
11. implement frontend behavior
12. update relevant documentation
13. add appropriate tests
14. run focused and repository-wide validation

Do not include irrelevant steps.

Do not unnecessarily prescribe exact function names, folders, SQL, component structure, or abstractions when the repository conventions already define how those decisions should be made.

### Technical considerations

Include only concerns that materially apply to the ticket, such as:

- backend impact
- frontend impact
- database impact
- migration compatibility
- transaction boundaries
- API/event contracts
- authentication/authorization
- concurrency/idempotency
- time/timezone handling
- localization/RTL
- external integrations
- performance constraints
- preview/deployment implications

Do not add speculative infrastructure requirements.

### Resources needed

List anything required to complete the ticket, for example:

- credentials
- external provider account
- API documentation
- design assets
- copy/content
- sample/test data
- environment variables
- product decisions
- access to another system
- another ticket

If nothing additional is required, state:

`No additional resources required.`

### Dependencies

List dependencies and classify them where useful.

#### Hard dependencies

Implementation cannot complete until these are resolved.

#### Soft dependencies

Implementation can proceed, but validation/release depends on these.

If there are no dependencies, state that explicitly.

### Blockers / hurdles

List known issues that may prevent or complicate implementation.

Examples:

- unresolved product rule
- missing credential or account
- external API limitation
- migration/compatibility concern
- browser limitation
- dependency on another ticket
- provider constraint
- difficult test setup
- performance/concurrency risk

Do not invent blockers merely to populate the section.

If none are known, state:

`No known blockers.`

### Testing expectations

Describe what behavior must be proven and which test levels are relevant.

Possible levels include:

- pure rule unit tests
- component tests
- API/database E2E
- browser E2E
- manual preview verification

Follow `docs/TESTING.md`.

Do not require mock-heavy service tests merely to verify orchestration call order.

### Documentation impact

State whether the work requires updates to any of the following:

- use-case README
- API/OpenAPI documentation
- environment configuration
- architecture documentation
- deployment documentation
- user-facing copy/localization

If none are required, state that explicitly.

### Definition of done

The ticket is complete only when all applicable items below are true:

- acceptance criteria are satisfied
- repository architecture is respected
- important business rules are implemented and tested
- required migrations are generated, reviewed, and committed
- relevant documentation is updated
- focused validation passes
- required repository-wide validation passes
- changes are limited to the ticket scope
- a pull request is created
- CI passes
- PR preview is available when preview infrastructure is configured
- the PR remains unmerged until human approval

## Ticket quality guidelines

Tickets should be detailed about behavior, rules, constraints, dependencies, and expected outcomes.

Tickets should usually avoid prescribing:

- exact function names
- exact file paths
- exact SQL implementation
- exact component decomposition
- new abstractions without evidence they are required

The coding agent must still inspect the repository and follow `AGENTS.md` plus the relevant documents under `docs/`.

## Suggested task-system states

For Trello or another backlog tool, prefer:

```text
Backlog
Ready
In Progress
Review
Done
```

Move a ticket to `Ready` only when the readiness rule at the top of this document is satisfied.

## Coding-agent handoff

When a coding agent takes a ticket, the expected high-level flow is:

```text
read ticket completely
→ verify it is Ready
→ read AGENTS.md and relevant repository docs
→ inspect existing code
→ implement only ticket scope
→ add/update tests
→ add/review migrations when required
→ update documentation
→ run focused validation
→ run broader validation
→ inspect diff
→ push branch
→ create PR
→ CI
→ preview when configured
→ human review
```

If implementation reveals an undefined product rule, the agent should surface the exact question rather than inventing behavior.

Never merge a feature PR unless explicitly instructed by the user.
