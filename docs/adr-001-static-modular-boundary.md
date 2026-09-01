# ADR-001: Static modular boundary

- **Status:** Accepted
- **Date:** 2026-09-01

## Context

OpenPage is a public executive portfolio. It has no application data, authentication, server-side business logic or agent runtime. Its risk is content drift, broken links, accessibility regressions and unsafe releases.

## Decision

Keep the runtime static on Cloudflare Pages. Use a monolith-modular source boundary: canonical project content in `content/projects.json`, validation in `scripts/`, presentation in `index.html`, and release controls in GitHub Actions.

## Consequences

This minimizes latency and operational cost while enabling deterministic checks. OpenTelemetry, OPA/Kyverno and WASM belong in the products represented by the portfolio, not in this presentation layer. If the site gains a backend, create a new ADR before adding runtime infrastructure.
