import type { Messages } from './en';
import { LOCALES, type Locale } from './locales';

export type { Messages, ScenarioCopy } from './en';
export * from './locales';

/**
 * Catalogue registry. Client bundles must only ship the visitor's language, so
 * catalogues are not imported here: each page loads exactly one through
 * `spec/i18n/load/<locale>.ts`, and build-time code (pages, tests) loads all of
 * them through `spec/i18n/all.ts`. Reading a catalogue that wasn't loaded fails
 * loudly instead of silently falling back to English.
 *
 * Registration is the one deliberate module-level side effect in spec/.
 */
const registry = new Map<Locale, Messages>();

export function registerMessages(locale: Locale, messages: Messages): void {
  registry.set(locale, messages);
}

export function getMessages(locale: Locale): Messages {
  const messages = registry.get(locale);
  if (!messages) {
    throw new Error(
      `Messages for "${locale}" are not loaded. Import "spec/i18n/load/${locale}" in this entry point.`,
    );
  }
  return messages;
}

export function loadedLocales(): Locale[] {
  return LOCALES.filter((locale) => registry.has(locale));
}
