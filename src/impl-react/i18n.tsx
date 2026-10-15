import { createContext, use, useMemo, type ReactNode } from 'react';
import { getFormatter, type Formatter } from '../spec/format';
import {
  getMessages,
  LOCALE_META,
  type Direction,
  type Locale,
  type Messages,
} from '../spec/i18n';

export interface I18n {
  readonly locale: Locale;
  readonly dir: Direction;
  /** The message catalogue for `locale`. */
  readonly t: Messages;
  readonly fmt: Formatter;
}

const I18nContext = createContext<I18n | null>(null);

/**
 * Locale is fixed per page (each locale has its own URL), so the value is
 * computed once and never changes: no re-renders from i18n.
 */
export function I18nProvider({
  locale,
  children,
}: {
  readonly locale: Locale;
  readonly children: ReactNode;
}) {
  const value = useMemo<I18n>(
    () => ({
      locale,
      dir: LOCALE_META[locale].dir,
      t: getMessages(locale),
      fmt: getFormatter(locale),
    }),
    [locale],
  );
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n(): I18n {
  const value = use(I18nContext);
  if (!value) throw new Error('useI18n() must be used inside <I18nProvider>.');
  return value;
}
