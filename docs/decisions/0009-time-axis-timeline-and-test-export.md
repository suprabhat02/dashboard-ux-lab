# 0009 — One time axis, a scrubbable request timeline, and exported tests

- Status: accepted
- Date: 2026-10-16

## Context

Phase 4 is "see time, not just state": scrub through a request and see what was
on screen, heard and focused at any moment, and turn any scenario into a
Playwright test. The home page already drew time (the hero ruler), with labels
placed by hand-tuned translates and right-to-left overrides; it broke on phones
and would not have scaled to a second timeline.

## Decision

**One time axis** (`spec/time-axis.ts`). A pure model: a square-root scale with
an exact inverse (for scrubbing), and the loading phases as zones cut at the
spec's boundaries. Every drawn timeline uses it.

- The hero **ribbon** draws the zones as CSS grid columns (`fr` sizes from the
  model), so rows line up and mirror in Arabic without special cases. Moments
  (playhead, response) are zero-width anchors that centre their contents, which
  works in both directions. Each zone fills itself from `--t` in pure CSS, so the
  cuts between zones stay visible. A container query moves the meanings into a
  legend when the component, not the viewport, is narrow.

**Recording** (`spec/recording.ts`). Telemetry, timed from the start of a run,
answers "what was true at this moment?": the screen in plain words, the last
announcement, the last focus move, the request in flight. Empty results are
derived from the run's settings and the shared data, not guessed. Recordings are
capped (500 events).

**The lab timeline** (`lab/timeline.ts`) only draws those answers: lanes for what
was on screen, what was heard (rings polite, filled assertive) and focus moves,
an accessible range input whose `aria-valuetext` states the moment, step buttons
to jump between changes, and a "Follow live" toggle. Lanes are rebuilt only when
the recording or the axis length changes; each frame sets two CSS variables.
Labels that do not fit are hidden, never cut; the readout always says them.

Two ordering hazards are handled explicitly:

- A build can speak before the lab's script runs (the vanilla build starts first;
  a React island can mount before module scripts). `components/EarlyTelemetry.astro`
  buffers telemetry inline and `lab/early-telemetry.ts` hands it to the first
  consumer. The comparison bridge uses the same pair.
- A build can answer a lab command before the timeline hears it (listeners run in
  subscription order). Events stamped at or after the command move into the new run.

**Exported tests** (`spec/export-test.ts`). `scriptFor(settings)` derives a
tester's session for any settings (the presets' published scripts are derived the
same way), and the generator writes a Playwright test that asserts every
announcement and focus move at the moment the spec gives. All catalogue text goes
through `JSON.stringify`; generated files declare only what they use.

- The lab's "Export as Playwright test" dialog (native `<dialog>`) generates for the
  current settings, build and language; the generator loads on demand.
- The build publishes `/exports/<scenario>-<build>-<locale>.spec.ts` (36 files);
  the screen reader script page links them.
- CI copies those exact files into the suite (`scripts/collect-exported-tests.mjs`)
  and runs them against both builds. A published test is a passing test.

## Consequences

- Any future timeline (a comparison overlay, a recorded session from a real API)
  starts from the same axis and recording model.
- The size budget now counts first-load JavaScript only and reports on-demand
  chunks separately; the lab budgets grew by the timeline's measured ~4 KB gz.
- Generated tests are excluded from the source type-check (they are validated by
  running them and by the generator's own unit tests).
