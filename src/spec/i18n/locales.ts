/**
 * Locale registry: the single list every route, test and message catalogue derives
 * from. Adding a locale here makes TypeScript, the route check and the e2e suite
 * demand everything else (see docs/decisions/0004-internationalisation.md).
 */

export const LOCALES = ['en', 'es', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export type Direction = 'ltr' | 'rtl';

export interface LocaleMeta {
  /** Endonym shown in the language switcher (a language, not a flag). */
  readonly label: string;
  /** Compact label for narrow screens. */
  readonly short: string;
  readonly dir: Direction;
  /** Value for <html lang> and hreflang. */
  readonly htmlLang: string;
  /**
   * Locale passed to Intl. Arabic uses Latin digits (`nu-latn`): dashboards are
   * scanned and compared column-wise, and most Arabic-language business software
   * (and the Gulf and Maghreb markets) use 0–9. Decision recorded in ADR 0004.
   */
  readonly intl: string;
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  en: { label: 'English', short: 'EN', dir: 'ltr', htmlLang: 'en', intl: 'en-US' },
  es: { label: 'Español', short: 'ES', dir: 'ltr', htmlLang: 'es', intl: 'es-ES' },
  ar: { label: 'العربية', short: 'ع', dir: 'rtl', htmlLang: 'ar', intl: 'ar-u-nu-latn' },
};

export function isLocale(value: string | undefined | null): value is Locale {
  return (
    value !== undefined &&
    value !== null &&
    (LOCALES as readonly string[]).includes(value)
  );
}

/** '/lab/react/' → '/es/lab/react/' (the default locale has no prefix). */
export function localizePath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return locale === DEFAULT_LOCALE ? clean : `/${locale}${clean}`;
}

/** '/ar/lab/react/' → { locale: 'ar', path: '/lab/react/' }. */
export function splitLocalePath(pathname: string): { locale: Locale; path: string } {
  const [, first, ...rest] = pathname.split('/');
  if (isLocale(first) && first !== DEFAULT_LOCALE) {
    return { locale: first, path: `/${rest.join('/')}` };
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
}
