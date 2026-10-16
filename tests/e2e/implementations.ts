import '../../src/spec/i18n/all';
import {
  getMessages,
  LOCALES,
  localizePath,
  type Locale,
  type Messages,
} from '../../src/spec/i18n';
import type { ImplementationId } from '../../src/spec/types';

/**
 * Implementations under test. Every test in the suite runs against each of them
 * unchanged: that is the parity contract.
 */
export const IMPLEMENTATIONS: readonly ImplementationId[] = ['react', 'vanilla'];

/**
 * Every behaviour test runs in every locale. Adding a locale to LOCALES adds it
 * here automatically, so a feature can't pass CI in English only.
 */
export interface Variant {
  readonly impl: ImplementationId;
  readonly locale: Locale;
  readonly t: Messages;
  readonly name: string;
}

export const VARIANTS: readonly Variant[] = IMPLEMENTATIONS.flatMap((impl) =>
  LOCALES.map((locale) => ({
    impl,
    locale,
    t: getMessages(locale),
    name: `${impl}/${locale}`,
  })),
);

export const labPath = (variant: Pick<Variant, 'impl' | 'locale'>, query = ''): string =>
  `${localizePath(variant.locale, `/lab/${variant.impl}/`)}${query ? `?${query}` : ''}`;

const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Accessible name that starts with `text` (radios include their summary). */
export const startsWith = (text: string): RegExp => new RegExp(`^${escape(text)}`);
export const contains = (text: string): RegExp => new RegExp(escape(text));
