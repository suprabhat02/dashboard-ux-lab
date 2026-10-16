# Contributing

Thanks for helping. Two rules matter more than any others.

## 1. Everything ships in English, Spanish and Arabic

No feature, page or message is done until it exists in all three locales.
The build enforces this (see [ADR 0004](docs/decisions/0004-internationalisation.md)).

**Adding text**

1. Add the string to `src/spec/i18n/en.ts`. Use a function for anything interpolated
   (`(plan: string) => \`No accounts on the ${plan} plan\``) and `Intl.PluralRules`
   for counts.
2. Run `npm run check`. TypeScript now lists the missing keys in `es.ts` and `ar.ts`.
3. Add the Spanish and Arabic text. Arabic has six plural categories
   (`zero`, `one`, `two`, `few`, `many`, `other`); see `accountsCount` in `ar.ts`.
4. Never hard-code visible text in components, pages or scripts. Read it from the
   catalogue (`useI18n()` in React, `getMessages(locale)` elsewhere).

**Adding a page**

Create it under `src/pages/[...locale]/` with `export const getStaticPaths = localePaths;`.
It then exists at `/x/`, `/es/x/` and `/ar/x/`. Link with `href('/x/')` from `pageI18n()`.

**Layout and styling**

- Use logical CSS only: `margin-inline-start`, `padding-inline`, `inset-inline`,
  `text-align: start`, `border-inline-start`. No `left`/`right` unless under `[dir='rtl']`.
- Arabic must not get `letter-spacing` or `text-transform: uppercase`.
- Code, IDs and numbers inside Arabic text read left-to-right: wrap in `<bdi>`,
  `dir="ltr"`, or the formatter's isolation.
- Direction-dependent geometry (like the chart) belongs in `src/spec/`, so every
  implementation gets it right without branching.

**Client bundles**

Client code imports catalogues only through `spec/i18n/load/<locale>`.
`spec/i18n/all` is for pages and tests (ESLint enforces this).

## 2. Visual language

See [ADR 0005](docs/decisions/0005-visual-language.md): no gradients, pill badges,
eyebrow labels or boxed icons; icons only from `src/spec/icons.ts` (Lucide);
illustrations only from Storyset via `docs/illustrations.md`; the header stays on
one row at every width and in every language (tested).

## 3. Both implementations follow one spec

- `src/spec/` holds data and pure functions only, framework-free.
- `impl-react/` and `impl-vanilla/` import only from `spec/`, never from each other.
- Behaviour changes go in `spec/` (`dashboard-state.ts`, `dashboard-rules.ts`) so both builds
  pick them up; the shared e2e suite must pass for both.
- Commits are attributed to the people who wrote them. CI rejects AI co-author or
  session trailers (`scripts/check-authorship.mjs`).
- Behaviour changes start in `docs/spec.md` and the shared e2e suite.

## Before you open a pull request

```bash
npm run verify   # lint, format, unit tests, build, e2e
node scripts/check-locale-routes.mjs
node scripts/size-budget.mjs
```

Commits are authored by the project owner; please keep commit messages descriptive.
