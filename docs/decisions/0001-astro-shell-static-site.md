# 0001 — Astro as the site shell, static output, GitHub Pages

- Status: accepted
- Date: 2026-10-15

## Context

The lab needs indexable content pages (scenario guides), two interactive lab pages
whose JavaScript must be comparable, zero hosting cost, and no backend.

## Decision

Use Astro with static output. React is enabled only for `src/impl-react/**` and is
hydrated only on `/lab/react/` (`client:only`). Every other page ships no React.
Deploy to GitHub Pages at `lab.suprabhat-dev.com` via GitHub Actions, gated on CI.

## Consequences

- Content pages are plain HTML: fast, crawlable, readable without JavaScript.
- The React page behaves like a client-rendered app, which is the honest comparison.
  SSR + hydration is a valid alternative worth its own article later.
- GitHub Pages cannot set custom HTTP headers; acceptable for a static demo.
- Same stack as suprabhat-dev.com, so no new tooling to maintain.
