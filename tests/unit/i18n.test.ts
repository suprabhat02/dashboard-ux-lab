import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../src/spec/i18n/all';
import { LOCALES, localizePath, splitLocalePath } from '../../src/spec/i18n';

/**
 * Catalogue guardrails. TypeScript already rejects missing or extra keys; these
 * checks catch what types can't: empty strings, arrays of different lengths,
 * functions with different arity, and text left untranslated.
 */

interface Leaf {
  path: string;
  value: unknown;
}

function leaves(value: unknown, path = ''): Leaf[] {
  if (Array.isArray(value))
    return value.flatMap((item, index) => leaves(item, `${path}[${index}]`));
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) =>
      leaves(child, path ? `${path}.${key}` : key),
    );
  }
  return [{ path, value }];
}

/** Product names, technical identifiers and proper nouns that stay as-is. */
const SAME_IN_ALL_LOCALES = new Set([
  'meta.siteName',
  'author.name',
  'nav.github',
  'dashboard.company',
  'notFound.eyebrow',
  'lab.impl.react.label',
  'lab.impl.react.note',
  'compare.builds.react.name',
  // Product names in the comparison table (MSW, Storybook, this project)
  'home.comparison.rows[1].tool',
  'home.comparison.rows[2].tool',
  'home.comparison.rows[5].tool',
  // Assistive technology + browser product names
  'accessibilityPage.rows[3].check',
  'accessibilityPage.rows[4].check',
  'accessibilityPage.rows[5].check',
  'accessibilityPage.rows[6].check',
  // Roadmap stages are identifiers ('done' | 'now' | 'next' | 'later') and link
  // paths are routes (localised at render), not prose
  ...MESSAGES.en.home.roadmap.phases.flatMap((phase, index) => [
    `home.roadmap.phases[${index}].stage`,
    ...(phase.link ? [`home.roadmap.phases[${index}].link.path`] : []),
  ]),
]);
const SAME_IN_SPANISH = new Set([
  'lab.impl.vanilla.label',
  'dashboard.filterLabel',
  'dashboard.columns.plan',
  'dashboard.columns.mrr',
  'dashboard.plans.starter',
  'dashboard.plans.growth',
  'dashboard.plans.enterprise',
  'dashboard.plans.legacy',
  'inspector.heading',
]);

const english = leaves(MESSAGES.en);

describe.each(LOCALES)('catalogue: %s', (locale) => {
  const entries = leaves(MESSAGES[locale]);
  const byPath = new Map(entries.map((entry) => [entry.path, entry.value]));

  it('has exactly the English keys (arrays included)', () => {
    expect(entries.map((entry) => entry.path).sort()).toEqual(
      english.map((entry) => entry.path).sort(),
    );
  });

  it('has no empty strings', () => {
    const empty = entries.filter(
      (entry) => typeof entry.value === 'string' && entry.value.trim() === '',
    );
    expect(empty.map((entry) => entry.path)).toEqual([]);
  });

  it('keeps every function signature (arity) of the English catalogue', () => {
    const mismatched = english
      .filter((entry) => typeof entry.value === 'function')
      .filter((entry) => {
        const own = byPath.get(entry.path);
        return (
          typeof own !== 'function' ||
          own.length !== (entry.value as (...args: never[]) => string).length
        );
      });
    expect(mismatched.map((entry) => entry.path)).toEqual([]);
  });

  if (locale !== 'en') {
    it('translates every string (except an explicit allow-list)', () => {
      const untranslated = english
        .filter((entry) => typeof entry.value === 'string')
        .filter((entry) => !SAME_IN_ALL_LOCALES.has(entry.path))
        .filter((entry) => !(locale === 'es' && SAME_IN_SPANISH.has(entry.path)))
        .filter((entry) => byPath.get(entry.path) === entry.value);
      expect(untranslated.map((entry) => entry.path)).toEqual([]);
    });
  }
});

describe.each(LOCALES)('home copy: %s', (locale) => {
  it('marks exactly one phase as the current one', () => {
    expect(
      MESSAGES[locale].home.roadmap.phases.filter((phase) => phase.stage === 'now'),
    ).toHaveLength(1);
  });

  it('reports the same roadmap stages as English, phase by phase', () => {
    expect(MESSAGES[locale].home.roadmap.phases.map((phase) => phase.stage)).toEqual(
      MESSAGES.en.home.roadmap.phases.map((phase) => phase.stage),
    );
  });
});

/* Search results show about 60 characters of a title and 160 of a description. */
describe.each(LOCALES)('search snippets: %s', (locale) => {
  const { meta, scenarios } = MESSAGES[locale];
  const titles = [
    meta.homeTitle,
    ...Object.values(scenarios).map(
      (s) => `${meta.guideTitle(s.title)} · ${meta.siteName}`,
    ),
  ];
  const descriptions = [
    meta.homeDescription,
    meta.labReactDescription,
    meta.labVanillaDescription,
    meta.scenariosDescription,
    meta.accessibilityDescription,
    ...Object.values(scenarios).map((s) => meta.guideDescription(s.summary)),
  ];

  it('keeps titles within 65 characters', () => {
    expect(titles.filter((title) => title.length > 65)).toEqual([]);
  });

  it('keeps descriptions within 160 characters', () => {
    expect(descriptions.filter((text) => text.length > 160)).toEqual([]);
  });
});

describe('Arabic catalogue', () => {
  it('uses Arabic script for user-facing prose', () => {
    const prose = leaves(MESSAGES.ar).filter(
      (entry) =>
        typeof entry.value === 'string' &&
        entry.value.length > 24 &&
        !SAME_IN_ALL_LOCALES.has(entry.path),
    );
    const latinOnly = prose.filter((entry) => !/[؀-ۿ]/.test(entry.value as string));
    expect(latinOnly.map((entry) => entry.path)).toEqual([]);
  });

  it('pluralises with all six Arabic categories', () => {
    const caption = MESSAGES.ar.dashboard.accountsCaption;
    expect(caption(0, 'x')).toContain('لا توجد حسابات');
    expect(caption(1, 'x')).toContain('حساب واحد');
    expect(caption(2, 'x')).toContain('حسابان');
    expect(caption(5, 'x')).toContain('5 حسابات');
    expect(caption(11, 'x')).toContain('11 حسابًا');
    expect(caption(100, 'x')).toContain('100 حساب');
  });
});

describe('locale paths', () => {
  it('prefixes non-default locales and round-trips', () => {
    expect(localizePath('en', '/lab/react/')).toBe('/lab/react/');
    expect(localizePath('ar', '/lab/react/')).toBe('/ar/lab/react/');
    expect(splitLocalePath('/es/scenarios/slow/')).toEqual({
      locale: 'es',
      path: '/scenarios/slow/',
    });
    expect(splitLocalePath('/lab/react/')).toEqual({ locale: 'en', path: '/lab/react/' });
  });
});
