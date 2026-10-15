/**
 * Storyset illustrations (https://storyset.com), stored as SVG in
 * src/assets/illustrations/<slot>.svg and inlined at build time.
 *
 * Inlining lets them follow the theme: download them from Storyset with the
 * colour set to ILLUSTRATION_KEY_COLOR and every use of that colour becomes
 * var(--illustration-accent), so light and dark themes both stay on-brand.
 * A missing file renders nothing, so pages never ship a broken image.
 * See docs/illustrations.md.
 */

export const ILLUSTRATION_KEY_COLOR = '#00BAFF';

export type IllustrationSlot = 'hero' | 'problem' | 'approach';

const files = import.meta.glob<string>('/src/assets/illustrations/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function prepare(svg: string): string {
  const key = new RegExp(ILLUSTRATION_KEY_COLOR, 'gi');
  return svg
    .replace(/<\?xml[^>]*\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(key, 'var(--illustration-accent)')
    .replace(/<svg\b([^>]*?)\s(?:width|height)="[^"]*"/g, '<svg$1')
    .replace(/<svg\b([^>]*?)\s(?:width|height)="[^"]*"/g, '<svg$1')
    .replace(
      /<svg\b/,
      '<svg aria-hidden="true" focusable="false" class="illustration__svg"',
    );
}

const available = new Map<IllustrationSlot, string>();
for (const [path, svg] of Object.entries(files)) {
  const slot = path
    .split('/')
    .pop()
    ?.replace(/\.svg$/, '');
  if (slot === 'hero' || slot === 'problem' || slot === 'approach')
    available.set(slot, prepare(svg));
}

export function illustration(slot: IllustrationSlot): string | undefined {
  return available.get(slot);
}

/** Storyset's free licence requires attribution wherever an illustration appears. */
export const hasIllustrations = available.size > 0;
