# Manual testing checklist

Automated checks (axe, Playwright) catch a portion of accessibility issues. These need
a person.

## Screen readers (each scenario)

Follow the step-by-step script at `/accessibility/screen-readers/`: it lists exactly
what each scenario should say and where focus should go, computed from the spec
and checked against both builds in CI ([ADR 0008](decisions/0008-computed-screen-reader-script.md)).
Submit each run with the “Screen reader result” issue form; accepted runs are
recorded in `src/site/at-results.ts` and appear in the results table.

- [ ] NVDA + Firefox (Windows)
- [ ] VoiceOver + Safari (macOS)
- [ ] VoiceOver + Safari (iOS)
- [ ] TalkBack + Chrome (Android)

For each: is each announcement heard once, at the right time, without interrupting?
Does focus land where docs/spec.md §6 says? Are KPI deltas read as sentences?

## Languages

- [ ] Arabic with VoiceOver (macOS/iOS) and NVDA: correct language switching, numbers read correctly, RTL reading order
- [ ] Arabic layout: chart mirrored, tabs arrow keys reversed, no clipped diacritics, no letter-spacing
- [ ] Spanish and Arabic copy reviewed by a native speaker (“Translation review” issue form)

## Visual and input

- [ ] Keyboard only: every control reachable, visible focus, no traps
- [ ] 400% zoom / 320 CSS px: no loss of content; only the accounts table scrolls sideways
- [ ] Text spacing override (WCAG 1.4.12)
- [ ] Windows forced colours: skeletons, focus rings, chart, segmented control visible
- [ ] prefers-reduced-motion: no shimmer, no bar growth, no list animation
- [ ] Touch: targets ≥ 24px, rail disclosure usable one-handed

## Browsers on real devices

- [ ] Safari macOS · [ ] Safari iOS · [ ] Chrome Android · [ ] Edge Windows · [ ] Firefox
