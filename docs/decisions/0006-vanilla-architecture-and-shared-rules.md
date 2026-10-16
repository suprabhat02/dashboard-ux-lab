# 0006 — Vanilla implementation, and the rules both builds share

- Status: accepted
- Date: 2026-10-16
- Amends: [0003](0003-react-state-model.md) (the reducer moves from `impl-react/` to `spec/`)

## Context

The lab claims two independent builds of one behaviour. "Independent" is only
useful if the two cannot quietly disagree about the behaviour itself: when to show
placeholders, what to announce, where focus goes. Duplicating those decisions in
each build would make every comparison partly a comparison of bugs.

## Decision

**Shared, framework-free (in `spec/`):**

- `dashboard-state.ts`: the request reducer (stale responses, retries,
  cancellation), moved unchanged from `impl-react/state.ts`.
- `dashboard-rules.ts`: pure functions for what to show (`screenFor`), what to
  announce (`statusAnnouncement`, `phaseAnnouncement`) and where focus goes
  (`focusTargetFor`).

**Per implementation:** only rendering, timers, the request call and DOM focus.

**Vanilla rendering: by region, not by diffing.** One controller
(`impl-vanilla/dashboard.ts`) builds the shell once (title, filter, live regions)
and replaces the notice or the body only when what they show changes. The error
panel is updated in place, so a focused Retry button is never replaced. No
virtual DOM and no templating library: about 1,100 lines, much like React's, and
16 KB gzipped for the whole lab page against React's 85 KB.

**Parity is a test, not a promise.** Both builds run the same end-to-end and axe
suite in every locale and engine (`tests/e2e/implementations.ts`).

## Consequences

- Behaviour changes are made once, in `spec/`, and both builds pick them up.
- The comparison between builds is about rendering and state ownership only,
  which is the question worth answering.
- Rendering by region means the vanilla build must remember view state React gets
  from reconciliation (table sort, chart disclosure) and restore focus when a
  focused control is rebuilt. See [divergence log](../divergence-log.md).
