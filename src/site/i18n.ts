/**
 * Astro-side i18n helpers (build time only). Every page lives under
 * src/pages/[...locale]/ and calls `localePaths()`, so one template produces the
 * English, Spanish and Arabic URLs; a page cannot exist in one locale only.
 */
import '../spec/i18n/all';
import {
  DEFAULT_LOCALE,
  getMessages,
  LOCALE_META,
  LOCALES,
  localizePath,
  splitLocalePath,
  type Locale,
  type Messages,
} from '../spec/i18n';

export interface LocaleProps {
  readonly locale: Locale;
}

/** getStaticPaths entries for `[...locale]`: undefined → '/', 'es' → '/es/', … */
export function localePaths(): {
  params: { locale: string | undefined };
  props: LocaleProps;
}[] {
  return LOCALES.map((locale) => ({
    params: { locale: locale === DEFAULT_LOCALE ? undefined : locale },
    props: { locale },
  }));
}

export interface PageI18n {
  readonly locale: Locale;
  readonly t: Messages;
  readonly dir: 'ltr' | 'rtl';
  readonly htmlLang: string;
  /** Prefix a locale-neutral path: href('/lab/react/') → '/ar/lab/react/'. */
  readonly href: (path: string) => string;
}

export function pageI18n(locale: Locale): PageI18n {
  const meta = LOCALE_META[locale];
  return {
    locale,
    t: getMessages(locale),
    dir: meta.dir,
    htmlLang: meta.htmlLang,
    href: (path) => localizePath(locale, path),
  };
}

/** The same page in every locale, for hreflang alternates and the language switcher. */
export function alternatesFor(pathname: string): { locale: Locale; href: string }[] {
  const { path } = splitLocalePath(pathname);
  return LOCALES.map((locale) => ({ locale, href: localizePath(locale, path) }));
}
