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
- **One idea, one moment of motion.** The home page is built around a single
  device: a request is a span of time, drawn as a ruler from 0 to 12 s with the
  spec's thresholds marked (placeholders at 300 ms, "slow" at 3 s, Cancel at 8 s).
  The hero replays each scenario along it in real time; the scenario index repeats
  it in miniature (`src/site/ruler.ts` keeps both on one scale). That replay is
  the page's only motion: no scroll reveals, counters, marquees or hover theatre.
- **Structure means something.** Only real sequences are numbered (the
  "usually handled" steps); sets such as the rules are plain lists. No accented
  word inside a headline, no labels above headings, no arrows appended to links
  and buttons.
- **The replay is accessible** (APG tabbed carousel): a Pause control that also
  freezes a request mid-flight (WCAG 2.2.2), no auto-rotation under reduced
  motion (each scenario then shows the one frame that explains it), a pause while
  it has focus or the pointer, and announcements only when the visitor drives it.
- **Header: always one row.** Language and theme are dropdowns (APG disclosure
  pattern); on narrow screens the section links move into a Menu dropdown.

## Consequences

- New UI must pass the same review: if an effect is decorative and not
  informative, it does not ship.
- `scripts/check-visual-rules.mjs` fails CI on any gradient or clipped text in
  `src/` or `public/` (Storyset files are exempt, being recoloured at build time,
  and so are the devicon brand logos, which are shown as their owners draw them).
