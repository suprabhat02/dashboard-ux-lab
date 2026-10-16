# Divergence log: React and vanilla

Where the two implementations differ in how they work, and why. Behaviour does not
differ: both pass the same end-to-end and axe suite, and screenshots of the same
scenario are pixel-identical. New entries go at the top.

## How this build was written

The behaviour decisions were first moved out of the React code into `spec/`
([ADR 0006](decisions/0006-vanilla-architecture-and-shared-rules.md)). The vanilla
build was then written against the spec and those shared modules. Its markup
follows the contract in [spec §7](spec.md#7-markup-contract); React's components
were used only to cross-check that contract, so both builds share one stylesheet.

## Entries

### View state that React keeps for free

- **React:** reconciliation keeps a component's state (the table's sort order, the
  chart's "show data as table" toggle) while its data updates in place.
- **Vanilla:** the body is rebuilt when its data changes, so that state lives in a
  `ViewMemory` object owned by the dashboard. It resets when the data leaves the
  screen (placeholders, error), as React's would on unmount.

### Focus survives a rebuild

- **React:** a re-rendered button is the same DOM node, so focus stays put.
- **Vanilla:** controls that can be rebuilt while focused (sort buttons, the
  chart-table toggle, the table region) carry a `data-focus-key`; after a rebuild
  the control with the same key gets focus back.

### Retry panel updates in place

- **React:** the error panel is one component across the failure and its retries.
- **Vanilla:** the same: the panel is keyed as `error` and updated in place (label,
  `aria-disabled`, request ID), never replaced. The button's label sits in a
  `<span>`; the accessible name is identical.

### Loading phase timers

- Both arm the next boundary (300 ms, 3 s, 8 s) in the same task that renders
  `pending`. React uses `useLayoutEffect` for this; vanilla arms it synchronously
  in `render()`.

### Event order on the lab channel

- Both emit `ready`, then `request start`, then `state idle → loading`, then
  `phase pending`, so the inspector timelines read the same.
