// Copies the Playwright tests the site publishes (dist/exports/*.spec.ts, built by
// src/pages/exports/[file].ts) into the e2e suite, so CI runs exactly what a
// visitor downloads, against both builds, in every language. Needs `astro build`.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../', import.meta.url).pathname;
const FROM = join(ROOT, 'dist/exports');
const TO = join(ROOT, 'tests/e2e/exported');

if (!existsSync(FROM)) {
  console.error('✗ No dist/exports: run `npm run build` first.');
  process.exit(1);
}
rmSync(TO, { recursive: true, force: true });
mkdirSync(TO, { recursive: true });
const files = readdirSync(FROM).filter((name) => name.endsWith('.spec.ts'));
for (const name of files) cpSync(join(FROM, name), join(TO, name));
console.log(`✓ ${files.length} exported tests ready in tests/e2e/exported/`);
