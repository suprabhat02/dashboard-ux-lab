# 0007 — Side-by-side comparison in iframes, over postMessage

- Status: accepted
- Date: 2026-10-16

## Context

Phase 2 shows both builds at once, driven by one set of controls, with live
start-up time, download size and a check that they behave alike. Mounting both
on one page would let them share globals, the lab channel on `window`, styles,
focus and the URL. A comparison where each build can disturb the other measures
nothing.

## Decision

- Each build runs in its own document, `/embed/<build>/` (per locale, `noindex`,
  out of the sitemap): the dashboard alone, with its own language, direction,
  theme and heading.
- `lab/compare/bridge.ts`, inside each frame, forwards lab-channel telemetry to
  the parent and turns the parent's messages into lab-channel commands. The build
  cannot tell the comparison page from the regular lab chrome. The message types
  and their runtime guards live in `spec/protocol.ts`; both ends also check the
  origin and the sending window.
- An inline buffer in the embed's `<head>` keeps telemetry emitted before the
  bridge module runs (a React island can mount before module scripts execute), so
  no event is lost whatever loads first.
- Measurements are honest about where they come from: start-up time is the
  frame's own `ready` timestamp; download size is Resource Timing's
  `encodedBodySize` for the build's JavaScript, minus the bridge itself. Source
  lines and dependencies are counted from the files at build time.
- **Agreement.** A run is the list of observable steps (requests, state changes,
  loading phases, announcements, focus moves) after a shared command, without
  timestamps. `lab/compare/sequence.ts` compares the two runs. A run is final
  once neither build has a request in flight and both are quiet.
- **Uneven starts.** A command sent while one build is still loading and the
  other has finished starts them from different states (`loading → loading`
  versus `success → loading`). That is timing, not behaviour, so such a run is
  never reported as a difference: it is labelled, and replayed for both once
  both are idle. The comparison found this on its first day; it is now covered
  by an e2e test.
- **One build at a time for assistive technology.** Both builds speak through
  live regions, so a screen reader would hear everything twice. The inactive
  frame is `inert` (out of the tab order and the accessibility tree) but stays
  visible, and the visitor chooses which build is active.

## Consequences

- No build-specific code on the comparison page; adding a third build means one
  more embed page and one more card.
- Download sizes depend on the server: compressed on GitHub Pages, uncompressed
  on a local preview. The page says it measured in the visitor's browser.
- Both frames load at the same moment, so they compete for the network and the
  main thread; start-up numbers are comparable to each other, not to a lab page
  loaded alone.
