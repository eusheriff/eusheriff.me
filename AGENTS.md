# Agent operating contract

## Scope

This repository is a static Cloudflare Pages portfolio. Keep product claims factual and preserve the existing cyber-executive visual language.

## Required checks

- Run `npm run check` before proposing a release.
- Keep `content/projects.json` and `schema/projects.schema.json` valid.
- Every project in `content/projects.json` must have a matching `data-project` and URL in `index.html`.
- Do not add secrets, tokens, personal identifiers or credentials to source files.
- Do not introduce a backend, OPA, WASM runtime or LLM dependency unless the task explicitly changes the product boundary.

## Release policy

Changes to `_headers`, analytics, external URLs or claims require human review. Deploy only from the validated working tree and keep the Cloudflare Pages production branch as `main`.
