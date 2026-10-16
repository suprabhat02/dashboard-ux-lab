/**
 * One ready-made Playwright test per scenario, build and language, published at
 * /exports/<scenario>-<build>-<locale>.spec.ts. The same generator backs the
 * lab's "Export" dialog; CI runs these exact files against both builds
 * (scripts/collect-exported-tests.mjs), so a published test is a passing test.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import '../../spec/i18n/all';
import { exportPlaywrightTest } from '../../spec/export-test';
import { getMessages, LOCALES, localizePath, type Locale } from '../../spec/i18n';
import { getScenario, SCENARIO_IDS } from '../../spec/scenarios';
import type { ImplementationId, ScenarioId } from '../../spec/types';

const IMPLEMENTATIONS: readonly ImplementationId[] = ['react', 'vanilla'];

interface Props {
  readonly scenario: ScenarioId;
  readonly implementation: ImplementationId;
  readonly locale: Locale;
}

export const getStaticPaths = (() =>
  LOCALES.flatMap((locale) =>
    SCENARIO_IDS.flatMap((scenario) =>
      IMPLEMENTATIONS.map((implementation) => ({
        params: { file: `${scenario}-${implementation}-${locale}.spec.ts` },
        props: { scenario, implementation, locale } satisfies Props,
      })),
    ),
  )) satisfies GetStaticPaths;

export const GET: APIRoute<Props> = ({ props }) => {
  const { scenario, implementation, locale } = props;
  const messages = getMessages(locale);
  const { source } = exportPlaywrightTest({
    settings: getScenario(scenario).settings,
    implementation,
    messages,
    labPath: `${localizePath(locale, `/lab/${implementation}/`)}?scenario=${scenario}`,
    title: messages.scenarios[scenario].title,
    slug: `${scenario}-${implementation}-${locale}`,
  });
  return new Response(source, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
