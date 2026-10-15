# 0002 — Implementation boundaries enforced by lint

- Status: accepted
- Date: 2026-10-15

## Context

The project's value depends on the React and vanilla implementations being genuinely
independent. Convention alone erodes; a convenient import is always one line away.

## Decision

`eslint.config.js` encodes the dependency graph with `no-restricted-imports`:

| Folder              | May import                      |
| ------------------- | ------------------------------- |
| `src/spec/`         | nothing (no DOM, no frameworks) |
| `src/impl-react/`   | `spec/`, `react`                |
| `src/impl-vanilla/` | `spec/`                         |
| `src/lab/`          | `spec/`                         |

Shared code is data and pure functions only: types, mock data, the mock API, timings,
copy, formatting, chart geometry and table sorting. Rendering and state management
are written twice. The chrome talks to implementations through `spec/protocol.ts`.

## Consequences

- CI fails on any boundary violation.
- Some logic that _could_ be shared (e.g. the request reducer) deliberately is not,
  because how each approach manages state is exactly what visitors should compare.
- Formatting, copy and chart geometry are shared, so visual parity is by construction.
