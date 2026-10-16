import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import '../../src/spec/i18n/all';
import { exportPlaywrightTest } from '../../src/spec/export-test';
import { getMessages, LOCALES, localizePath } from '../../src/spec/i18n';
import { getScenario, SCENARIO_IDS } from '../../src/spec/scenarios';

/** Syntax errors only: the file must at least parse as TypeScript. */
function syntaxErrors(source: string): string[] {
  const output = ts.transpileModule(source, {
    reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return (output.diagnostics ?? []).map((diagnostic) =>
    ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
  );
}

describe('exported Playwright tests', () => {
  it('parses for every scenario, build and language', () => {
    for (const locale of LOCALES) {
      const t = getMessages(locale);
      for (const id of SCENARIO_IDS) {
        for (const implementation of ['react', 'vanilla'] as const) {
          const { source, fileName } = exportPlaywrightTest({
            settings: getScenario(id).settings,
            implementation,
            messages: t,
            labPath: `${localizePath(locale, `/lab/${implementation}/`)}?scenario=${id}`,
            title: t.scenarios[id].title,
            slug: `${id}-${implementation}-${locale}`,
          });
          expect(fileName).toBe(`${id}-${implementation}-${locale}.spec.ts`);
          expect(syntaxErrors(source)).toEqual([]);
          // No unused names: every live region declared is asserted on.
          for (const [, region] of source.matchAll(/const (polite|assertive) =/g)) {
            expect(source).toContain(`expect(${region ?? ''})`);
          }
        }
      }
    }
  });

  it('asserts the scripted words and focus moves, in order', () => {
    const t = getMessages('en');
    const { source } = exportPlaywrightTest({
      settings: getScenario('slow').settings,
      implementation: 'react',
      messages: t,
      labPath: '/lab/react/?scenario=slow',
      title: 'Slow response',
      slug: 'slow-react-en',
    });
    const order = [
      t.dashboard.loading.slowTitle,
      t.lab.replay,
      t.dashboard.loading.announce,
      t.dashboard.loading.cancel,
      t.dashboard.cancelled.action,
      t.dashboard.cancelled.announce,
    ].map((text) => source.indexOf(JSON.stringify(text)));
    expect(order.every((position) => position > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(source).toContain('process.env.LAB_URL');
  });

  it('cannot be broken by hostile text in the title or copy', () => {
    const t = getMessages('en');
    const hostile = 'Quote " back` tick ${x} */ \n newline';
    const { source } = exportPlaywrightTest({
      settings: getScenario('error').settings,
      implementation: 'vanilla',
      messages: {
        ...t,
        dashboard: { ...t.dashboard, error: { ...t.dashboard.error, retry: hostile } },
      },
      labPath: '/lab/vanilla/?scenario=error',
      title: hostile,
      slug: 'hostile',
    });
    expect(syntaxErrors(source)).toEqual([]);
    expect(source).toContain(JSON.stringify(hostile));
  });
});
