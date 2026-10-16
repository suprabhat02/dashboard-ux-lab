import { localizePath, type Locale, type Messages } from '../spec/i18n';
import { matchScenario } from '../spec/scenarios';
import type { ImplementationId, LabSettings } from '../spec/types';
import { serializeSettings } from '../spec/url';

/**
 * "Export as Playwright test": a native <dialog> (modal, focus contained, Escape
 * closes, focus returns to the opener) holding the generated source, with Copy
 * and Download. The generator is loaded on first use, so it never weighs on the
 * lab's first load.
 */

// The type parameter mirrors querySelector<T>: callers name the element type they expect.
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
function must<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Export markup is missing ${selector}`);
  return element;
}

export interface ExportDialogOptions {
  readonly t: Messages;
  readonly locale: Locale;
  readonly implementation: ImplementationId;
  readonly settings: () => LabSettings;
}

export function initExportDialog(
  opener: HTMLButtonElement,
  dialog: HTMLDialogElement,
  options: ExportDialogOptions,
): void {
  const { t, locale, implementation } = options;
  const code = must<HTMLElement>(dialog, '[data-export-code]');
  const status = must<HTMLElement>(dialog, '[data-export-status]');
  const copy = must<HTMLButtonElement>(dialog, '[data-export-copy]');
  const download = must<HTMLAnchorElement>(dialog, '[data-export-download]');
  let objectUrl: string | null = null;

  const release = (): void => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  };

  opener.addEventListener('click', () => {
    void (async () => {
      const { exportPlaywrightTest } = await import('../spec/export-test');
      const settings = options.settings();
      const scenario = matchScenario(settings);
      const query = serializeSettings(settings);
      const { fileName, source } = exportPlaywrightTest({
        settings,
        implementation,
        messages: t,
        labPath: `${localizePath(locale, `/lab/${implementation}/`)}${query ? `?${query}` : ''}`,
        title: scenario ? t.scenarios[scenario].title : t.exportTest.custom,
        slug: `${scenario ?? 'custom'}-${implementation}-${locale}`,
      });
      code.textContent = source;
      status.textContent = '';
      release();
      objectUrl = URL.createObjectURL(new Blob([source], { type: 'text/plain' }));
      download.href = objectUrl;
      download.download = fileName;
      dialog.showModal();
    })();
  });

  copy.addEventListener('click', () => {
    void navigator.clipboard.writeText(code.textContent).then(
      () => {
        status.textContent = t.exportTest.copied;
      },
      () => {
        status.textContent = t.exportTest.copyFailed;
      },
    );
  });

  must<HTMLButtonElement>(dialog, '[data-export-close]').addEventListener('click', () => {
    dialog.close();
  });
  // A click on the backdrop (the dialog element itself, outside its content) closes it.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', release);
}
