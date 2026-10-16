# Dashboard UX Lab

**An interactive lab for how dashboards should behave when data isn’t perfect:**
loading, slow responses, empty results, failures with retry, and restricted access.

The same dashboard is built twice, in **React** and in **framework-free
TypeScript**, from one shared behaviour spec and verified by one shared test suite,
and the two run [side by side](https://lab.suprabhat-dev.com/compare/) so they can be
compared on equal terms.

**The goal:** make a dashboard's behaviour easier to see, hear and test than any
browser developer tool does today.

Available in **English**, **Español** and **العربية** (right-to-left), with every
feature shipped in all three — enforced by the build ([ADR 0004](docs/decisions/0004-internationalisation.md)).

**Live (after first deploy):** https://lab.suprabhat-dev.com · **Author:** [Suprabhat Kumar](https://suprabhat-dev.com)

## Status

| Part                                         | Status                                                               |
| -------------------------------------------- | -------------------------------------------------------------------- |
| Shared spec, mock API, copy, CSS             | ✅ Done                                                              |
| React implementation                         | ✅ Done                                                              |
| Playground: controls + inspector             | ✅ Done                                                              |
| English, Spanish, Arabic (RTL)               | ✅ Done (Spanish/Arabic await native review)                         |
| Scenario guides                              | ✅ Done                                                              |
| Vanilla implementation                       | ✅ Done (16 KB gz; pixel-identical to React)                         |
| Unit + e2e + axe tests                       | ✅ One suite, both builds, three engines, in CI                      |
| Side-by-side comparison page                 | ✅ Done ([ADR 0007](docs/decisions/0007-side-by-side-comparison.md)) |
| Manual screen reader / device testing        | 🚧 Now — see [checklist](docs/manual-testing.md)                     |
| Request timeline you can scrub; tests export | ⏳ Next                                                              |

## What you can do in the lab

- Pick a scenario preset, or tune **latency**, **failure mode**, **role** and **plan filter**.
- Watch the **inspector**: every state transition, every live-region announcement and
  every programmatic focus move.
- Share any combination: settings live in the URL.
- Open **Compare** to run both builds at once: one set of controls, live start-up
  time and download size, and a step-by-step check that both behave the same.

## Architecture

```
src/
  spec/           Framework-free contract: types, mock data + API, timings, i18n catalogues,
                  formatting, chart geometry, table sorting, lab event protocol
  impl-react/     React 19 implementation (reducer + effect, no fetching library)
  impl-vanilla/   Framework-free implementation (DOM + TypeScript, rendering by region)
  lab/            Playground chrome (vanilla TS): controls, explanation, inspector,
                  and the comparison page (host + in-frame bridge)
  styles/         Shared CSS (cascade layers, OKLCH tokens, container queries)
  pages/          Astro pages: home, lab, compare, embedded builds, guides, accessibility
tests/
  unit/           Vitest: spec, shared reducer and rules
  e2e/            Playwright + axe: one suite, run against every implementation
docs/             Behaviour spec, decision log, manual testing checklist
```

Boundaries are enforced by ESLint (see [ADR 0002](docs/decisions/0002-implementation-boundaries.md)):
`spec/` imports nothing, implementations import only `spec/`, and neither imports the other.
Behaviour decisions (state, what to show, announce and focus) live in `spec/` and are
shared by both builds ([ADR 0006](docs/decisions/0006-vanilla-architecture-and-shared-rules.md));
how they differ in implementation is tracked in the [divergence log](docs/divergence-log.md).

**Runtime dependencies:** React + React DOM (React page only) and two self-hosted
variable fonts (Bricolage Grotesque, Geist Mono). No UI, chart, state or CSS library.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md): every change ships in all three languages.

## Develop

Requires Node 22.12+.

```bash
npm install
npm run dev          # http://localhost:4321
npm test             # unit tests
npm run build        # type check + static build
npm run test:e2e     # Playwright (builds must exist: run `npm run build` first)
npm run verify       # everything CI runs
```

## Quality bar

- Zero serious/critical axe violations in every scenario, in light and dark themes.
- Same e2e suite passes for every implementation in Chromium, Firefox and WebKit.
- JavaScript budgets enforced in CI (`scripts/size-budget.mjs`).
- Automated checks are a floor, not proof: manual results are published at
  [/accessibility/](https://lab.suprabhat-dev.com/accessibility/), including known issues.

## Deploy

GitHub Actions builds and deploys to GitHub Pages after CI passes on `main`.
Custom domain: `public/CNAME` → `lab.suprabhat-dev.com` (DNS: `CNAME lab → suprabhat02.github.io`).

## Search and sharing

- Every page carries a canonical URL, `hreflang` alternates for all three
  languages, a description of at most 160 characters (enforced by a unit test),
  and schema.org JSON-LD: the site, its author and the page, plus a
  `WebApplication` for the lab and a `TechArticle` with breadcrumbs for each
  scenario guide (`src/site/seo.ts`).
- Social cards (`public/og/<locale>.png`) and app icons are generated once and
  committed: `CHROMIUM_PATH=… npm run og`.
- The sitemap (with `hreflang`) is built by `@astrojs/sitemap`; `robots.txt`
  points to it.

## Feedback

The most useful contribution is disagreement with the spec. If a behaviour in
[docs/spec.md](docs/spec.md) seems wrong for real users, please open an issue.

## License

MIT. Tool logos are from [devicon](https://devicon.dev/) (MIT,
`src/assets/logos/LICENSE-devicon.txt`); the marks belong to their owners.
Illustrations by [Storyset](https://storyset.com/).
