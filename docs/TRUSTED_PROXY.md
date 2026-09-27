# Trusted Proxy Strategy

Fastify must only trust forwarding headers when the application is behind a known reverse proxy, ingress, or load balancer whose network identity is explicitly trusted.

The template is safe by default: when `TRUSTED_PROXY_CIDRS` is empty, Fastify uses the direct socket peer and ignores client-supplied forwarding headers for proxy-derived request information.

## Why this matters

Infrastructure such as rate limiting commonly relies on `request.ip`.

When `trustProxy` is enabled, Fastify may derive client information from forwarding headers such as `X-Forwarded-For` and related proxy metadata.

If arbitrary internet clients can reach the API directly and their forwarding headers are trusted, an attacker may spoof the apparent client IP. That can undermine:

- IP-based rate limiting
- abuse detection
- audit/log interpretation
- IP allow/deny logic added by a spin-off
- scheme/host assumptions derived from proxy metadata

Do not enable universal proxy trust merely because production uses HTTPS or a reverse proxy.

## Runtime configuration

Configure trusted proxy networks with:

```text
TRUSTED_PROXY_CIDRS
```

It is a comma-separated list of proxy IP addresses or CIDR ranges.

Example:

```text
TRUSTED_PROXY_CIDRS=10.0.0.0/8,192.168.10.0/24
```

The exact values must come from the actual deployment topology/provider.

Do not copy example CIDRs into production unless they really describe the network peers allowed to connect to the API.

An empty value means:

```text
trustProxy = false
```

and is the correct default for local development and any deployment where the API is directly internet-facing without a trusted intermediary.

## Network topology requirement

Proxy trust is only meaningful when the trusted proxy is also the actual network path to the application.

A production deployment should ideally enforce:

```text
Internet
  ↓
trusted ingress / load balancer / reverse proxy
  ↓
private/restricted API service
```

The API should not simultaneously be publicly reachable around the proxy if the security model depends on proxy-derived client IPs.

Firewall/security-group/private-network rules should restrict direct access where the platform supports it.

Application-level `trustProxy` configuration does not replace network access control.

## One proxy hop

If one known load balancer connects directly to the API, trust only that load balancer's source IP/range.

Then Fastify can use the forwarding chain supplied through that trusted peer to determine the originating client.

Do not replace this with `true` just because there is exactly one hop.

## Multiple proxy hops

Some deployments look like:

```text
client
→ CDN/WAF
→ cloud load balancer
→ API
```

In that case, understand which peer directly connects to the API and how each proxy appends or rewrites forwarding headers.

Trust the required proxy networks according to that documented chain.

Verify the resulting `request.ip`/`request.ips` behavior in the real environment before using it for security-sensitive decisions.

Do not assume all providers format or preserve `X-Forwarded-For` identically.

## Cloudflare/CDN considerations

A CDN may expose provider-specific client-IP headers in addition to standard forwarding headers.

Do not automatically trust a provider-specific header merely because it exists.

First ensure requests can only reach the origin through that trusted provider or otherwise verify the connecting peer. Then decide whether standard Fastify proxy processing is sufficient or the product requires explicitly validated provider-specific handling.

Provider-specific logic belongs in the spin-off deployment configuration, not in this generic template.

## Rate limiting

The template rate limiter keys by `request.ip`.

Therefore:

- no trusted proxy configured → the direct socket peer is the client identity
- correctly configured trusted proxy → the forwarded originating client IP can become the key
- incorrectly broad trust → attackers may spoof the key and weaken IP-based limits

Before relying on IP limits in production, verify the value of `request.ip` through the actual ingress path.

## HTTPS and protocol detection

TLS is usually terminated by the ingress/load balancer, so the API's direct connection may be plain HTTP even though the browser used HTTPS.

Trusted proxy configuration can allow framework-level protocol/host information to reflect validated proxy metadata.

Do not trust forwarding headers solely to make HTTPS detection appear correct. Configure the proxy trust boundary first.

Security-sensitive cookies and redirect/origin behavior should be reviewed against the real production topology.

## Local development

Use:

```text
TRUSTED_PROXY_CIDRS=
```

unless you are intentionally testing through a local reverse proxy.

Do not enable trusted proxy behavior in ordinary local development because production has a proxy; keeping it disabled helps expose assumptions that depend incorrectly on forwarding headers.

## Docker Compose baseline

The default Compose setup does not require trusted proxy configuration because the browser/API development path does not use a reverse proxy in front of Fastify.

Keep `TRUSTED_PROXY_CIDRS` empty there.

If a spin-off later adds Traefik, Nginx, Caddy, or another local ingress to Compose, configure only that proxy/network as trusted and document the topology.

## Testing a production topology

Before launch, test requests through the real ingress and confirm:

- normal client request yields the expected `request.ip`
- adding a fake `X-Forwarded-For` from the browser/internet does not override identity improperly
- direct access to the API origin is blocked where proxy trust is part of the security model
- rate limits distinguish real clients as expected
- health probes still work
- HTTPS/protocol/host-derived behavior is correct

A useful security test is to send conflicting forwarding headers and verify that only headers received through the trusted proxy chain influence Fastify's derived request information.

## Do not use hop-count trust as the default

Fastify/proxy libraries can support trust configurations based on hop count.

This template deliberately prefers explicit proxy IP/CIDR trust.

Hop counts can become unsafe when different network paths have different numbers of intermediaries. An attacker reaching the service through a shorter path may cause an untrusted address to be interpreted as trusted client information.

Use hop-based strategies only when a specific deployment has been reviewed and they are demonstrably appropriate.

## Changing providers

`TRUSTED_PROXY_CIDRS` is deployment configuration, not a permanent product constant.

When ingress/provider/network topology changes:

1. obtain/document the new trusted proxy source ranges
2. update deployment configuration
3. verify direct-origin restrictions
4. test spoofed forwarding headers
5. verify `request.ip` and rate limiting
6. remove obsolete trusted ranges

Do not leave historical proxy ranges trusted indefinitely.

## Logging and privacy

Client IP addresses can be personal data depending on context/jurisdiction.

Only log/store them when operationally justified, follow the product's retention/privacy requirements, and do not add broad IP logging merely because trusted proxy support makes the value available.

## Spin-off checklist

Before enabling `TRUSTED_PROXY_CIDRS` in a real environment:

- draw/document the ingress path to the API
- identify the network peer(s) that directly connect to Fastify
- obtain authoritative IP/CIDR ranges from the provider/topology
- restrict direct API-origin access where practical
- configure only required ranges
- test spoofed forwarding headers
- verify `request.ip` through production ingress
- verify IP-based rate limiting
- review HTTPS/host-derived behavior
- document provider-specific assumptions

If the deployment topology is not yet known, leave trusted proxy configuration empty.

## Related documentation

- `docs/SECURITY.md` — rate limiting and general HTTP security baseline
- `docs/DEPLOYMENT.md` — reverse proxy/TLS and deployment topology
- `docs/PRODUCTION_CONFIG.md` — environment-specific configuration contract
- `docs/SPINOFF.md` — product initialization workflow
