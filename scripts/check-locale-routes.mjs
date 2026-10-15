// Fails the build if any page exists in one locale but not the others, or if a
// page declares the wrong language/direction. Runs in CI after `astro build`.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const LOCALES = {
  en: { prefix: '', dir: 'ltr' },
  es: { prefix: 'es/', dir: 'ltr' },
  ar: { prefix: 'ar/', dir: 'rtl' },
};
const SKIP = new Set(['404.html']);

function pages(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '_astro' ? [] : pages(path);
    return name.endsWith('.html') ? [relative(DIST, path)] : [];
  });
}

const all = new Set(pages(DIST));
const english = [...all].filter((page) => !SKIP.has(page) && !/^(es|ar)\//.test(page));
const problems = [];

for (const page of english) {
  for (const [locale, { prefix, dir }] of Object.entries(LOCALES)) {
    const localized = `${prefix}${page}`;
    if (!all.has(localized)) {
      problems.push(`missing ${locale}: /${localized}`);
      continue;
    }
    const html = readFileSync(join(DIST, localized), 'utf8');
    if (!html.includes(`<html lang="${locale}" dir="${dir}"`)) {
      problems.push(
        `wrong lang/dir in /${localized} (expected lang="${locale}" dir="${dir}")`,
      );
    }
  }
}
const orphans = [...all].filter(
  (page) => /^(es|ar)\//.test(page) && !all.has(page.slice(3)),
);
problems.push(...orphans.map((page) => `no English source for /${page}`));

if (problems.length) {
  console.error(`✗ Locale route check failed:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(
  `✓ ${english.length} pages × ${Object.keys(LOCALES).length} locales, lang and dir correct`,
);
