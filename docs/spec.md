# Behaviour specification

This is the contract both implementations satisfy. The executable version lives in
`src/spec/` (types, timings, copy, mock API) and `tests/e2e/` (observable behaviour).
When this document and the code disagree, that is a bug in one of them; open an issue.

## 1. Settings

A dashboard request is fully described by four settings. They live in the URL.

| Setting | Values                                                 | URL param | Default   |
| ------- | ------------------------------------------------------ | --------- | --------- |
| Latency | 0–15,000 ms                                            | `latency` | 700       |
| Failure | `never` · `once` · `always`                            | `failure` | `never`   |
| Role    | `analyst` · `viewer` · `none`                          | `role`    | `analyst` |
| Plan    | `all` · `starter` · `growth` · `enterprise` · `legacy` | `plan`    | `all`     |

Presets (`?scenario=loaded|loading|slow|empty|error|restricted`) are named settings
combinations. Explicit params override a preset. Invalid values fall back silently.

## 2. Request lifecycle

```
idle ──▶ loading ──▶ success   (empty is derived from the data, not a status)
            │   ├──▶ error ──retry──▶ loading
            │   └──▶ forbidden        (403: no retry)
            └──cancel──▶ cancelled ──load again──▶ loading
```

- A new request **aborts** the previous one. A response for anything other than the
  latest request is discarded. Cancelled requests never render.
- `failure: once` fails attempt 1 and succeeds on attempt 2. `always` fails every attempt.
- `role: none` returns 403 regardless of the failure setting.

## 3. Loading

“Slow” is not a status. It is the same request observed later.

| Elapsed      | Phase      | What the user sees                                               |
| ------------ | ---------- | ---------------------------------------------------------------- |
| 0–299 ms     | `pending`  | Previous content dimmed; on first load, nothing (space reserved) |
| 300 ms–2.9 s | `skeleton` | Skeletons with the final dimensions of each widget               |
| 3–7.9 s      | `slow`     | Plus a floating notice: “This is taking longer than usual.”      |
| ≥ 8 s        | `stalled`  | Notice offers **Cancel request**                                 |

The notice floats over the skeleton so it never shifts layout.

## 4. States

| State                        | Copy key                | Actions        | Announced                            |
| ---------------------------- | ----------------------- | -------------- | ------------------------------------ |
| Loaded                       | `COPY.loaded`           | —              | Only if the user caused the load     |
| Empty                        | `COPY.empty`            | Show all plans | Always, once                         |
| Error                        | `COPY.error`            | Try again      | Always (assertive on a failed retry) |
| Forbidden                    | `COPY.forbidden`        | —              | Only if the user caused the load     |
| Cancelled                    | `COPY.cancelled`        | Load again     | Always, once                         |
| Widget restricted (`viewer`) | `COPY.widgetRestricted` | —              | No (part of loaded content)          |

## 5. Announcements

- Two live regions (`polite`, `assertive`), always present in the DOM, `aria-atomic`.
- Bursts within 150 ms collapse into one announcement of the final state.
- The initial page load is never announced as “loading”.

## 6. Focus

Focus moves programmatically **only** when the control that had focus disappears:

| Trigger                         | Focus goes to                                    |
| ------------------------------- | ------------------------------------------------ |
| Retry succeeds (button removed) | Dashboard heading (`tabindex="-1"`)              |
| Retry fails again               | Stays on the Retry button                        |
| While retrying                  | Stays on Retry (`aria-disabled`, not `disabled`) |
| Cancel (button removed)         | **Load again** button                            |
| Empty → Show all plans          | Dashboard heading                                |

If the user has already moved focus elsewhere, nothing is moved.

## 7. Markup contract

Both implementations emit the same structure so one stylesheet and one test suite fit both:

- `section.dash[data-implementation][data-view][data-phase]`, labelled by its `h2.dash__title`
- `.dash__content[aria-busy]`; `[data-reserve]` during the first-load pending phase
- `ul.kpis > li.kpi` with `.kpi__label`, `.kpi__value`, `.kpi__delta[data-tone]` (visual label `aria-hidden`, sentence in `.sr-only`)
- `section.widget` labelled by `h3.widget__title`
- Chart: `svg[role="img"]` named by the summary sentence; a disclosure button (`aria-expanded`) reveals a data table
- Accounts: focusable `div[role="region"]` labelled by the table caption; `th > button.sort-btn`; `aria-sort` only on the sorted column
- States: `.state.state--{error|forbidden|empty|cancelled}` with `h3.state__title`
- Live regions: `[aria-live="polite"]`, `[aria-live="assertive"]`

## 8. Lab protocol

The playground chrome and an implementation never import each other. They exchange
`CustomEvent`s defined in `src/spec/protocol.ts`:

- chrome → implementation: `apply(settings)`, `replay`
- implementation → chrome: `ready`, `request`, `state`, `phase`, `announce`, `focus`, `settings`

An implementation must work with no chrome present (it reads the URL on start).
