# Preview Environment Contract

This document defines the provider-neutral contract for pull-request preview environments.

The goal is to support the development flow:

```text
agent/developer opens PR
→ CI validates source
→ preview environment is created deterministically
→ preview URL/status is attached to the PR
→ human verifies behavior
→ PR update refreshes the preview
→ merge/close destroys the preview
```

The template deliberately does not select a hosting provider. A spin-off should implement this contract with its chosen platform rather than allowing agents to create ad-hoc infrastructure.

## 1. Ownership and boundaries

Preview infrastructure is owned by CI/deployment automation, not by coding agents.

Agents may:

- change application code
- change reviewed infrastructure-as-code/workflow files when explicitly tasked
- open/update the PR
- inspect preview status/logs
- use the preview URL for validation

Agents must not:

- manually create long-lived preview servers outside the approved workflow
- invent untracked cloud resources
- create production-like secrets ad hoc
- bypass preview teardown
- mutate production data to make a preview work

The desired pattern is deterministic:

```text
PR state + repository config
→ reproducible preview resources
```

## 2. Trigger lifecycle

### Create/update

A preview should normally be created or refreshed when:

- a pull request is opened
- a new commit is pushed to the PR
- a previously failed preview is explicitly re-run

Only deploy a commit that has passed the required CI gates for preview deployment.

If CI and preview deployment are separate jobs/workflows, preview must depend on the required validation job rather than racing it.

### Teardown

Destroy preview resources when:

- the PR is merged
- the PR is closed without merge
- the PR is otherwise made ineligible for previews
- an expiry/TTL policy removes abandoned previews

Teardown must be automatic and idempotent. Re-running cleanup should not fail merely because resources are already absent.

## 3. Stable preview identity

Use a deterministic identifier based on repository + PR number, for example:

```text
pr-123
```

Use that identity consistently for:

- web service
- API service
- database/schema/database branch
- URLs
- secrets/config namespaces
- logs
- resource tags/labels

Do not identify preview infrastructure only by commit SHA because every PR update would create a new environment and leak resources.

The PR owns the environment; the commit updates it.

## 4. URLs

Prefer predictable URLs, for example:

```text
https://pr-123.preview.example.com
https://api-pr-123.preview.example.com
```

or the equivalent provider-generated preview URLs.

The web preview must point `NUXT_PUBLIC_API_BASE_URL` at that PR's API preview, never at production.

The API `CORS_ALLOWED_ORIGINS` must allow only the intended preview web origin(s), not a broad wildcard simply because preview URLs are dynamic.

## 5. Database isolation

A preview must never use the production database.

Preferred models, depending on the provider:

1. one isolated database per PR
2. one isolated database branch per PR
3. one isolated schema per PR, only when operationally safe and the tooling fully supports isolation

A shared mutable preview database for all PRs is discouraged because one PR can change data/schema underneath another preview.

The preview database should be disposable.

## 6. Preview migrations

Apply the committed migration chain before starting/updating application services that depend on it.

The preview release flow should resemble:

```text
CI green
→ provision/resolve preview database
→ run committed migrations once
→ deploy/update API + web
→ wait for readiness
→ publish preview URL
```

If migrations fail:

- mark preview deployment failed
- do not pretend the preview is healthy
- do not deploy code that assumes the new schema exists
- surface the failure on the PR

Ephemeral preview databases can be created from scratch and fully migrated.

Follow `docs/MIGRATIONS.md` for schema-change rules. Preview success does not remove the need to assess production locks, data volume, backfills, and backward compatibility.

## 7. Seed/test data

Preview environments may need deterministic non-production data so reviewers can exercise flows.

Seed data must:

- contain no production personal/confidential data
- be safe to delete
- be deterministic enough for validation
- avoid external side effects by default

If a product requires seeded users/accounts, use preview-specific credentials or generated sandbox identities.

Do not clone production data into PR previews by default.

## 8. Secrets and external integrations

Preview environments must follow `docs/PRODUCTION_CONFIG.md`.

By default:

- use sandbox/test credentials
- use isolated databases/storage
- omit privileged integrations that are not required
- never provide production secrets to untrusted PRs
- scope credentials to the preview environment where possible

For external systems such as payments, email, SMS, webhooks, object storage, or AI providers, prefer test/sandbox modes.

When a preview can cause external side effects, make that behavior explicit and constrained.

## 9. Pull requests from forks/untrusted contributors

Untrusted code must not automatically receive sensitive deployment credentials.

A spin-off should choose one of these patterns:

- do not create privileged previews for untrusted forks
- require maintainer approval before deployment
- deploy with a reduced/no-secret sandbox capability

Do not use workflow patterns that execute untrusted PR code with unrestricted production/repository secrets.

## 10. Preview access control

Whether previews are public or access-controlled is product-specific.

Consider authentication/access restriction when previews expose:

- unreleased product features
- private business flows
- internal APIs/docs
- meaningful sandbox data
- costly external integrations

Provider access controls, identity-aware proxies, or preview passwords may be appropriate.

Do not rely on an obscure preview URL as the only protection for sensitive content.

## 11. Health/readiness

API preview deployment should use the same health contracts as production:

```text
GET /health/live
GET /health/ready
```

Do not mark a preview ready merely because the container process started.

Publish the preview URL only after the deployment is actually reachable and required readiness checks pass.

## 12. Trusted proxies

Preview ingress/proxy topology must follow `docs/TRUSTED_PROXY.md`.

Do not enable broad forwarding-header trust just because a preview platform sits behind a proxy.

Configure `TRUSTED_PROXY_CIDRS` only when the provider topology is understood and direct origin access is controlled appropriately.

## 13. PR status and feedback

A preview workflow should provide clear PR feedback.

At minimum surface:

- deployment status: pending/success/failure
- web preview URL
- API preview URL when useful
- deployed commit SHA
- meaningful failure link/log location

Prefer a GitHub deployment/check/status integration when the provider supports it.

A bot comment is acceptable, but update one canonical comment rather than adding a new noisy comment on every commit.

The PR should make it easy for a human to answer:

```text
Which commit is deployed?
Where do I test it?
Is it healthy?
```

## 14. PR updates and concurrency

When a newer commit is pushed to a PR:

- cancel/supersede obsolete in-progress deployments where practical
- deploy only the newest desired PR revision
- prevent an older slow deployment from overwriting a newer preview

Use concurrency keyed by the PR identity.

Conceptually:

```text
preview-pr-123
```

with older in-progress runs cancelled or prevented from becoming final.

## 15. Failure handling

Preview deployment failure must not silently fall back to an older preview while claiming success.

When an update fails:

- surface the failed revision/status
- make clear whether an older preview remains accessible
- do not mark the new commit as preview-validated
- keep enough logs to diagnose build/migration/runtime/readiness failures

CI source validation and preview deployment are separate signals. Both matter.

## 16. Teardown behavior

Teardown should remove all resources owned by the PR preview, including where applicable:

- API/web services
- preview database/database branch/schema
- temporary storage/buckets
- routes/domains
- preview-specific secrets/config entries
- background workers/queues

Do not delete shared provider infrastructure that is not owned by the PR.

Resource ownership should be tagged/identified deterministically so cleanup does not rely on guesswork.

## 17. TTL and abandoned previews

Automatic PR close cleanup is required, but a TTL/garbage-collection mechanism is still valuable in case cleanup workflows fail.

Examples:

- periodically delete preview resources whose PR no longer exists/is closed
- delete previews older than a configured maximum inactivity period

Garbage collection must validate resource ownership before deletion.

## 18. Costs and resource limits

Preview infrastructure can become expensive.

Set explicit limits appropriate to the product/provider:

- small instance sizes
- database limits
- sleep/scale-to-zero where practical
- TTL for abandoned environments
- quotas on expensive integrations

A PR preview is for validation, not production-scale performance testing unless explicitly provisioned for that purpose.

## 19. Observability

Preview logs should be attributable to PR/environment identity.

Useful dimensions include:

```text
preview_id=pr-123
git_sha=<commit>
environment=preview
```

Do not mix preview and production telemetry without environment labels.

Error reporting should distinguish preview failures from production incidents.

## 20. Browser/API E2E against preview

Local/CI E2E tests remain the primary automated validation baseline.

A spin-off may additionally run a small post-deploy smoke suite against the preview URL when it adds value.

Good post-deploy checks:

- web root loads
- API readiness succeeds
- one or two critical integrated flows work

Do not duplicate the entire test suite against the remote preview unless there is a concrete need.

## 21. Agent workflow

The desired AI-agent development loop is:

```text
receive task
→ create branch/worktree
→ implement + validate locally
→ push/open PR
→ CI validates
→ deterministic preview workflow deploys PR
→ agent may inspect deployment result
→ human tests preview
→ human approves/merges
→ preview workflow tears down
```

Agents should not merge merely because CI/preview succeeds. Human/explicit merge authorization remains separate.

## 22. Provider implementation requirements

When a hosting provider is chosen, its workflow must implement this contract:

- PR-scoped stable environment identity
- isolated non-production data
- migrations before dependent app rollout
- safe preview credentials/secrets
- deterministic update behavior
- readiness-aware success
- PR-visible status/URL
- automatic close/merge teardown
- concurrency protection
- garbage collection/TTL strategy

Provider convenience features are welcome as long as these guarantees are preserved.

## 23. Spin-off checklist

Before enabling previews for a real product, decide and document:

- hosting/provider
- preview URL pattern
- database isolation model
- migration execution mechanism
- seed/test data strategy
- preview secret policy
- external integration sandbox behavior
- public vs protected preview access
- trusted proxy configuration
- PR status/comment integration
- concurrency/cancellation strategy
- close/merge teardown
- TTL/garbage collection
- cost/resource limits
- whether post-deploy smoke tests run

## Related documentation

- `docs/DELIVERY.md` — PR/CI and agent delivery workflow
- `docs/DEPLOYMENT.md` — container/runtime deployment contract
- `docs/MIGRATIONS.md` — migration execution and safe schema evolution
- `docs/PRODUCTION_CONFIG.md` — secrets and environment isolation
- `docs/TRUSTED_PROXY.md` — ingress/proxy trust
- `docs/TESTING.md` — automated test boundaries
- `docs/SPINOFF.md` — new-product initialization

This template defines the preview lifecycle before choosing infrastructure so provider-specific automation stays deterministic and replaceable.
