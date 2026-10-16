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
- **Two brand colours only: synthetic lime `#c8ff00` and bio black `#06110d`.**
  Every neutral is a tint or shade of bio black's green-black hue; the only other
  hues are the dashboard's success, warning and danger states.
  - Dark theme: bio black is the page; surfaces step up in the same hue
    (`#0a1813`, `#0e1d17`, `#14271f`); lime is used for actions, links, focus,
    markers and data (16:1 on the page).
  - Light theme: a bone page (`#f6f8f0`) with white cards; lime is a fill only
    (1.2:1 on white, so never text or a thin line). Primary buttons invert to bio
    black with lime type; brand-coloured text uses `--accent-ink`, a deep
    lime-olive (`#3f5c00`, 7.2:1); thin marks use `--accent-line` (bio black).
  - Two fixed-colour surfaces appear in both themes: the closing call to action
    (lime ground, bio-black ink) and the tool strip (bone ground, so third-party
    logos keep their own colours).
- **Bullets: one style site-wide** (`.bullets`), a filled lime circle, ringed in
  bio black on light grounds.
- **Third-party logos** (the "Built and tested with" strip) are the projects'
  own marks in their own colours (svg-logos, CC0), shown at their own aspect
  ratio. Where an original mark uses a gradient (Astro), its solid brand colour
  is used instead.
- **Glass header:** translucent fill with a backdrop blur; opaque where blur is
  unsupported or `prefers-reduced-transparency: reduce`.
- **Illustrations: Storyset only**, inlined as SVG and recoloured to the theme
  accent at build time (`docs/illustrations.md`), decorative (`aria-hidden`), with
  the required attribution in the footer.
- **Aceternity UI patterns, rebuilt without dependencies.** The home page uses the
  Text Generate, Hero Highlight, 3D Card, Timeline, Card Hover Effect and Infinite
  Moving Cards patterns, re-implemented in CSS and a few lines of TypeScript
  (`src/site/home.ts`) instead of importing the React + Tailwind + Motion
  originals: the page stays static HTML with ~2.5 KB of script, and the
  gradient-based parts of those components are replaced with solid colour.
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
