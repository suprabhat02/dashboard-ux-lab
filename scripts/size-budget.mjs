// Fails the build if the JavaScript shipped to a lab page exceeds its budget.
// Budgets are gzip sizes of every <script type="module"> chunk the page loads.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = new URL('../dist/', import.meta.url).pathname;
const BUDGETS_KB = {
  // React 19 client runtime alone is ~64 KB gz; implementation + spec + chrome ~15 KB.
  'lab/react/index.html': 90,
  'lab/vanilla/index.html': 20,
  'index.html': 5,
};

function chunksFor(html) {
  const imports = new Set();
  const pending = [
    ...html.matchAll(
      /(?:src|component-url|renderer-url|before-hydration-url)="(\/_astro\/[^"]+\.js)"/g,
    ),
  ].map((m) => m[1]);
  while (pending.length) {
    const path = pending.pop();
    if (imports.has(path)) continue;
    imports.add(path);
    const source = readFileSync(join(DIST, path), 'utf8');
    for (const m of source.matchAll(
      /from\s*["'](\.\/[^"']+\.js)["']|import\(["'](\.\/[^"']+\.js)["']\)/g,
    )) {
      pending.push(`/_astro/${(m[1] ?? m[2]).slice(2)}`);
    }
  }
  return [...imports];
}

let failed = false;
for (const [page, budget] of Object.entries(BUDGETS_KB)) {
  const html = readFileSync(join(DIST, page), 'utf8');
  const inline = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1])
    .join('');
  const bytes =
    chunksFor(html).reduce(
      (sum, path) => sum + gzipSync(readFileSync(join(DIST, path))).length,
      0,
    ) + gzipSync(inline).length;
  const kb = bytes / 1024;
  const ok = kb <= budget;
  failed ||= !ok;
  console.log(
    `${ok ? '✓' : '✗'} ${page.padEnd(26)} ${kb.toFixed(1).padStart(6)} KB gz  (budget ${budget} KB)`,
  );
}
if (failed) process.exit(1);
