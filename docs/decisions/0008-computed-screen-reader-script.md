# 0008 — A screen reader test script computed from the spec

- Status: accepted
- Date: 2026-10-16

## Context

Phase 3 is testing with real screen readers (NVDA, VoiceOver, TalkBack). A
manual test is only as good as its script: a tester needs to know exactly what
they should hear, and when. Written by hand, that script would drift from the
code the first time an announcement or a timing changed, and nobody would notice
until a tester reported a "failure" that was really a stale script.

## Decision

- `spec/speech-script.ts` simulates a short tester session for each scenario
  (open the link, then press the button that matters: Replay, Try again, Cancel,
  Show all plans) with a simulated clock. It runs the shared reducer, the shared
  announcement and focus rules, the phase timings and the 150 ms announcement
  debounce, and returns, per step, what is spoken (words, politeness, when) and
  where focus moves. `mock-api.ts` exposes `outcomeFor` so the simulation gets
  exactly the server answers the builds get.
- `/accessibility/screen-readers/` (all three languages) renders that transcript
  as the script, with links that open each build on the scenario.
- `tests/e2e/speech.spec.ts` drives every scenario in both builds and all three
  languages on a fake clock and requires the observed announcements and focus
  moves to equal the transcript: same words, politeness and order, each within
  100 ms of the scripted time. It runs in every engine in CI, and fails when the
  script is wrong (checked by planting a wrong rule).
- The fake clock is advanced in 50 ms slices. One long `runFor()` fires all timers
  back to back without yielding, and React schedules renders through a
  MessageChannel, so it would only commit at the end.
- Results live in `site/at-results.ts`, typed, one entry per real run, each
  linked to the GitHub issue it was submitted in (issue form
  `screen-reader-result.yml`). The results table shows "Not tested yet" for
  anything not observed; nothing is inferred.
- Spanish and Arabic review goes through a second issue form,
  `translation-review.yml`.

## Consequences

- The script is a published contract: changing what the dashboard says changes
  the script, and the e2e suite proves the builds follow it.
- What automation cannot judge stays human: whether the speech is clear, timely
  and pleasant with a real screen reader's own verbosity, voice and settings.
  That is what the results table records.
