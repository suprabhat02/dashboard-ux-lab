import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { illustration, prepareIllustration } from '../../src/site/illustrations';

const slots = ['hero', 'problem', 'approach'] as const;

describe.each(slots)('illustration: %s', (slot) => {
  const raw = readFileSync(`src/assets/illustrations/${slot}.svg`, 'utf8');
  const svg = prepareIllustration(raw);

  it('is registered and decorative', () => {
    expect(illustration(slot)).toBe(svg);
    expect(svg).toMatch(
      /^\s*<svg aria-hidden="true" focusable="false" class="illustration__svg"/,
    );
  });

  it('follows the theme: accent and neutrals become tokens', () => {
    expect(svg).toContain('var(--illustration-accent)');
    expect(svg).toContain('var(--ill-ink)');
    expect(svg).not.toMatch(/#263238|#455a64|#e0e0e0|#ebebeb|#f5f5f5|#fafafa/i);
  });

  it('drops the Storyset scenery, ids and gradients', () => {
    expect(raw).toContain('freepik--background-complete');
    expect(svg).not.toContain('background-complete');
    expect(svg).not.toMatch(/\sid="/);
    expect(svg).not.toMatch(/gradient/i);
    expect(svg.length).toBeLessThan(raw.length);
  });
});
