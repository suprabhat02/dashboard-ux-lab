// Fails the build if the JavaScript shipped to a lab page exceeds its budget.
// Budgets are gzip sizes of the JavaScript a page loads up front: every module
// script and its static imports. Code loaded on demand is reported, not budgeted.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = new URL('../dist/', import.meta.url).pathname;
const LOCALE_PREFIXES = ['', 'es/', 'ar/'];
const BASE_BUDGETS_KB = {
  // React 19 client runtime alone is ~64 KB gz; implementation + spec + chrome ~15 KB.
  // The lab chrome includes the request timeline (~4 KB gz since Phase 4); the
  // Playwright export loads on demand and is reported separately.
  'lab/react/index.html': 95,
  'lab/vanilla/index.html': 25,
  'index.html': 5,
  // The comparison page itself only drives the frames; each frame is one build plus a ~1 KB bridge.
  'compare/index.html': 10,
  'embed/react/index.html': 91,
  'embed/vanilla/index.html': 21,
};
// Every locale gets the same budget: a page must not grow because of other languages.
const BUDGETS_KB = Object.fromEntries(
  LOCALE_PREFIXES.flatMap((prefix) =>
    Object.entries(BASE_BUDGETS_KB).map(([page, kb]) => [`${prefix}${page}`, kb]),
  ),
);

/**
 * Every chunk a page loads up front: its scripts and their static imports.
 * Chunks reached only through import() load on demand (an "Export" dialog, say)
 * and are reported separately, not counted against the first-load budget.
 */
function chunksFor(html) {
  const eager = new Set();
  const lazy = new Set();
  const pending = [
    ...html.matchAll(
      /(?:src|component-url|renderer-url|before-hydration-url)="(\/_astro\/[^"]+\.js)"/g,
    ),
  ].map((m) => ({ path: m[1], lazy: false }));
  while (pending.length) {
    const next = pending.pop();
    const seen = next.lazy ? lazy : eager;
    if (seen.has(next.path) || (next.lazy && eager.has(next.path))) continue;
    seen.add(next.path);
    if (!next.lazy) lazy.delete(next.path);
    const source = readFileSync(join(DIST, next.path), 'utf8');
    for (const m of source.matchAll(/from\s*["'](\.\/[^"']+\.js)["']/g)) {
      pending.push({ path: `/_astro/${m[1].slice(2)}`, lazy: next.lazy });
    }
    for (const m of source.matchAll(/import\(["'`](\.\/[^"'`]+\.js)["'`]\)/g)) {
      pending.push({ path: `/_astro/${m[1].slice(2)}`, lazy: true });
    }
  }
  return { eager: [...eager], lazy: [...lazy].filter((path) => !eager.has(path)) };
}

const gz = (paths) =>
  paths.reduce((sum, path) => sum + gzipSync(readFileSync(join(DIST, path))).length, 0);

let failed = false;
for (const [page, budget] of Object.entries(BUDGETS_KB)) {
  const html = readFileSync(join(DIST, page), 'utf8');
  const inline = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1])
    .join('');
  const { eager, lazy } = chunksFor(html);
  const bytes = gz(eager) + gzipSync(inline).length;
  const kb = bytes / 1024;
  const ok = kb <= budget;
  failed ||= !ok;
  const later = lazy.length ? `  + ${(gz(lazy) / 1024).toFixed(1)} KB on demand` : '';
  console.log(
    `${ok ? '✓' : '✗'} ${page.padEnd(26)} ${kb.toFixed(1).padStart(6)} KB gz  (budget ${budget} KB)${later}`,
  );
}
if (failed) process.exit(1);
