/**
 * Storyset illustrations (https://storyset.com), stored as SVG in
 * src/assets/illustrations/<slot>.svg and inlined at build time.
 *
 * Inlining lets them follow the theme. At build time each file is normalised:
 * - the Storyset scenery group ("background-complete") is removed, so the figure
 *   sits on the page colour (calmer, and it doesn't fight the text);
 * - the illustration's key colour (whichever accent colour it was downloaded in)
 *   becomes var(--illustration-accent);
 * - Storyset's fixed neutrals (outline ink, paper, mist) become theme tokens, so
 *   outlines stay visible and whites don't glare in the dark theme;
 * - ids are dropped (no references exist, and duplicates across figures would be
 *   invalid HTML), fixed sizes are removed, and the SVG is marked decorative.
 * A missing file renders nothing, so pages never ship a broken image.
 * See docs/illustrations.md.
 */

export type IllustrationSlot = 'hero' | 'problem' | 'approach';
const SLOTS: readonly IllustrationSlot[] = ['hero', 'problem', 'approach'];

/** Storyset's shared neutral palette → theme tokens (see .illustration in pages.css). */
const NEUTRALS: Record<string, string> = {
  '#263238': 'var(--ill-ink)',
  '#455a64': 'var(--ill-ink-2)',
  '#ffffff': 'var(--ill-paper)',
  '#fafafa': 'var(--ill-paper)',
  '#f5f5f5': 'var(--ill-paper)',
  '#f0f0f0': 'var(--ill-mist)',
  '#ebebeb': 'var(--ill-mist)',
  '#e0e0e0': 'var(--ill-mist)',
};
/** Skin and hair tones are left untouched. */
const KEEP = new Set(['#eb996e', '#ffbe9d', '#ffc3bd', '#f28f8f', '#ce7a63', '#000000']);

const HEX = /#(?:[0-9a-f]{6}|[0-9a-f]{3})(?![0-9a-f])/gi;

function normalizeHex(hex: string): string {
  const lower = hex.toLowerCase();
  return lower.length === 4
    ? `#${lower[1]}${lower[1]}${lower[2]}${lower[2]}${lower[3]}${lower[3]}`
    : lower;
}

/** The key colour is the most frequent colour that is neither neutral nor skin. */
function keyColor(svg: string): string | null {
  const counts = new Map<string, number>();
  for (const match of svg.match(HEX) ?? []) {
    const hex = normalizeHex(match);
    if (hex in NEUTRALS || KEEP.has(hex)) continue;
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }
  let best: string | null = null;
  for (const [hex, count] of counts)
    if (!best || count > (counts.get(best) ?? 0)) best = hex;
  return best;
}

/** Remove one <g id="…prefix…"> element, including nested groups. */
function removeGroup(svg: string, idPrefix: string): string {
  const start = svg.indexOf(`<g id="${idPrefix}`);
  if (start === -1) return svg;
  const tag = /<g\b[^>]*?(\/?)>|<\/g>/g;
  tag.lastIndex = start;
  let depth = 0;
  for (let match = tag.exec(svg); match; match = tag.exec(svg)) {
    if (match[0].startsWith('</g')) depth -= 1;
    else if (match[1] !== '/') depth += 1;
    if (depth === 0) return svg.slice(0, start) + svg.slice(tag.lastIndex);
  }
  return svg;
}

export function prepareIllustration(raw: string): string {
  let svg = raw.replace(/<\?xml[^>]*\?>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  svg = removeGroup(svg, 'freepik--background-complete');
  const key = keyColor(svg);
  svg = svg.replace(HEX, (match) => {
    const hex = normalizeHex(match);
    if (hex === key) return 'var(--illustration-accent)';
    return NEUTRALS[hex] ?? match;
  });
  return svg
    .replace(/\sid="[^"]*"/g, '')
    .replace(/<svg\b([^>]*?)\s(?:width|height)="[^"]*"/g, '<svg$1')
    .replace(/<svg\b([^>]*?)\s(?:width|height)="[^"]*"/g, '<svg$1')
    .replace(
      /<svg\b/,
      '<svg aria-hidden="true" focusable="false" class="illustration__svg"',
    );
}

const files = import.meta.glob<string>('/src/assets/illustrations/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const available = new Map<IllustrationSlot, string>();
for (const [path, svg] of Object.entries(files)) {
  const slot = SLOTS.find((name) => path.endsWith(`/${name}.svg`));
  if (slot) available.set(slot, prepareIllustration(svg));
}

export function illustration(slot: IllustrationSlot): string | undefined {
  return available.get(slot);
}

/** Storyset's free licence requires attribution wherever an illustration appears. */
export const hasIllustrations = available.size > 0;
