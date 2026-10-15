# 0005 — Visual language: flat, editorial, no decorative effects

- Status: accepted
- Date: 2026-10-15

## Context

Early designs used gradient text, gradient logo tiles, pill badges, boxed icons and
glow shadows. Those patterns now read as generic, machine-made landing pages and
distract from a project whose credibility depends on restraint and precision.

## Decision

- **No gradients anywhere** (backgrounds, text, borders, skeletons, favicon).
  Skeletons pulse in opacity instead of shimmering.
- **No pill badges or eyebrow labels.** Status is plain text; deltas are an icon
  plus text in the tone colour.
- **No boxed icons.** Icons sit inline, coloured by meaning.
- **One icon library: Lucide** (ISC), consumed as data from `src/spec/icons.ts`, so
  Astro pages and both implementations render identical glyphs. Icons that point
  in the reading direction mirror in right-to-left layouts.
- **Hierarchy from type, space and thin rules**, not stacks of bordered cards.
  Cards remain inside the dashboard itself, where they are part of the product.
- **The accent colour is reserved** for actions, links, focus and data.
- **Illustrations: Storyset only**, inlined as SVG and recoloured to the theme
  accent at build time (`docs/illustrations.md`), decorative (`aria-hidden`), with
  the required attribution in the footer.
- **Motion is scroll-linked and optional** (home page, `src/styles/home.css`).
  Reveals animate transform, blur and colour only — never opacity, so text is
  always legible and contrast checks never see a half-faded frame. Scroll-driven
  effects sit inside `@supports (animation-timeline: view())` and
  `prefers-reduced-motion: no-preference`; without either, the page is static and
  complete. The live state preview follows the APG tabbed-carousel pattern: a
  Pause control (WCAG 2.2.2), no auto-rotation under reduced motion, a pause while
  it has focus or the pointer, and announcements only when the visitor drives it.
- **Header: always one row.** Language and theme are dropdowns (APG disclosure
  pattern); on narrow screens the section links move into a Menu dropdown.

## Consequences

- New UI must pass the same review: if an effect is decorative and not
  informative, it does not ship.
- `scripts/check-visual-rules.mjs` fails CI on any gradient or clipped text in
  `src/` or `public/` (Storyset files are exempt; they are recoloured at build time).
