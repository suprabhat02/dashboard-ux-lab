// Enforces ADR 0005 (visual language): no decorative effects in shipped styles,
// markup or assets. Runs in CI next to lint.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('../', import.meta.url).pathname;
const SCAN = ['src', 'public'];
const EXTENSIONS = /\.(css|astro|tsx?|svg|html)$/;
const RULES = [
  {
    pattern: /\b(linear|radial|conic|repeating-linear|repeating-radial)-gradient\(/,
    why: 'gradients',
  },
  { pattern: /<(linear|radial)Gradient\b/, why: 'SVG gradients' },
  { pattern: /background-clip:\s*text/, why: 'gradient/clipped text' },
];

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return EXTENSIONS.test(name) ? [path] : [];
  });
}

const problems = [];
for (const file of SCAN.flatMap((dir) => files(join(ROOT, dir)))) {
  // Storyset illustrations are recoloured at build time; their internals are not ours.
  if (file.includes('/assets/illustrations/')) continue;
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    for (const rule of RULES) {
      if (rule.pattern.test(line))
        problems.push(`${relative(ROOT, file)}:${index + 1} — ${rule.why}`);
    }
  });
}

if (problems.length) {
  console.error(`✗ Visual rules (ADR 0005) violated:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log('✓ Visual rules: no gradients or clipped text in src/ and public/');
