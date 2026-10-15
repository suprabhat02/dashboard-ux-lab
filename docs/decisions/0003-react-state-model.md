# 0003 — React request state: reducer + effect, no data-fetching library

- Status: accepted
- Date: 2026-10-15

## Context

TanStack Query or SWR would handle caching, retries and cancellation in a few lines.
They would also hide every decision the lab exists to show.

## Decision

- A pure reducer (`impl-react/state.ts`) owns the lifecycle. Requests start only from
  event handlers (`load`, `replay`, `retry`); the reducer is unit-tested.
- One effect performs the active request with an `AbortController`; its cleanup aborts
  when the request is superseded, cancelled or unmounted.
- Each request carries a monotonic id; the reducer drops responses for any other id.
- The loading phase is derived from `startedAt` with timers only at phase boundaries.
- Live-region text is written to DOM nodes via refs, not React state, so repeated
  messages re-announce and announcing never causes a re-render.

## Consequences

- More code than a library, all of it inspectable and explained.
- In a production app with caching needs, a library would usually be the right call;
  the case study should say so.
