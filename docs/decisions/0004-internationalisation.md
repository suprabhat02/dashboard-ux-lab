# 0004 — Three locales (English, Spanish, Arabic) as a build-time guarantee

- Status: accepted
- Date: 2026-10-15

## Context

Every page, feature and message must exist in English, Spanish and Arabic, now and
for every future change. Arabic is right-to-left, has six plural forms and needs its
own typeface. "Remember to translate" is not a process; the build has to enforce it.

## Decision

**One registry, one shape.** `src/spec/i18n/locales.ts` lists the locales.
`en.ts` defines the catalogue and its type (`Messages`); `es.ts` and `ar.ts` are typed
`Messages`, so a missing or extra key is a compile error. All visitor-facing text —
dashboard, lab chrome, inspector, scenario guides, pages, metadata — lives there.
Interpolation uses functions so word order can change; plurals use
`Intl.PluralRules` inside the catalogue.

**One template per page.** Pages live in `src/pages/[...locale]/` and their
`getStaticPaths` comes from `localePaths()`. A page cannot be created for one locale:
the same file produces `/x/`, `/es/x/` and `/ar/x/`.

**Locale-aware spec.** Formatting (`getFormatter(locale)`), chart geometry and table
sorting take a locale. RTL is handled in the spec where it is geometry (the chart
mirrors its time axis and moves the value axis) and in CSS where it is layout
(logical properties only; `[dir='rtl']` overrides for the few physical cases).

**Numbers.** Arabic uses Latin digits (`ar-u-nu-latn`): dashboards are scanned
column-wise and most Arabic-language business software uses 0–9. Currency uses the
narrow symbol and is isolated left-to-right inside Arabic text.

**Code-split catalogues.** Client bundles ship only the visitor's language. Each page
loads one catalogue through `spec/i18n/load/<locale>.ts` (per-locale React island
and lab-chrome entries); build-time code and tests use `spec/i18n/all.ts`. ESLint
forbids importing `all` from client code; size budgets apply to every locale.

**Typography.** Space Grotesk has no Arabic glyphs; Noto Kufi Arabic (geometric, a
good match) is self-hosted with a `unicode-range`, so English and Spanish pages
never download it. Arabic disables letter-spacing and uppercase, and uses taller
line-height.

## Enforcement (what fails CI)

| Check                             | Catches                                                                                                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript (`Messages` type)      | missing or extra keys in any locale                                                                                                                         |
| `tests/unit/i18n.test.ts`         | empty strings, different array lengths or function arity, untranslated strings (allow-list for product names), Latin-only Arabic prose, Arabic plural forms |
| `scripts/check-locale-routes.mjs` | a page missing in a locale; wrong `lang`/`dir`                                                                                                              |
| e2e suite (`VARIANTS`)            | every behaviour test runs in every locale; hreflang, language switch, RTL chart, 320px reflow, axe per locale                                               |
| `scripts/size-budget.mjs`         | a locale's page growing because of other catalogues                                                                                                         |

## Consequences

- Adding a feature means adding its strings in three files; TypeScript lists what
  is missing. See CONTRIBUTING.md.
- Spanish and Arabic were drafted by the author and still need native review; the
  accessibility page says so.
- Adding a fourth locale: add it to `LOCALES`/`LOCALE_META`, create the catalogue,
  a `load/` module and the island/lab entries. Every check above then covers it.
