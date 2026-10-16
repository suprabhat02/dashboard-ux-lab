# Vanilla implementation

The dashboard in plain TypeScript and the DOM: no framework, no virtual DOM, no
templating library. 16 KB gzipped for the whole lab page.

| File           | Role                                                                       |
| -------------- | -------------------------------------------------------------------------- |
| `dashboard.ts` | The controller: state, phase timers, request, rendering by region, effects |
| `views.ts`     | KPIs, placeholders, state panels, notice (pure builders)                   |
| `chart.ts`     | SVG chart and its data-table disclosure                                    |
| `table.ts`     | APG sortable table                                                         |
| `dom.ts`       | `h()`, `s()`, `icon()`: typed element builders                             |
| `entries/*.ts` | One entry per locale, each bundling only its own catalogue                 |

Rules for this folder:

- Import only from `../spec/`. No React, no lab chrome (ESLint enforces this).
- Behaviour decisions are not made here: they come from `spec/dashboard-state.ts`
  and `spec/dashboard-rules.ts`, shared with the React build
  ([ADR 0006](../../docs/decisions/0006-vanilla-architecture-and-shared-rules.md)).
- Emit the markup contract in `docs/spec.md` §7, so the shared CSS and tests apply.
- Never replace a node that may hold focus unless what it shows has changed; when
  you must, give the control a `data-focus-key`.
- Record any difference in how it works (not what it does) in
  [`docs/divergence-log.md`](../../docs/divergence-log.md).
- Every change ships in all three locales and passes the shared e2e suite.
