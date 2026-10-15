/**
 * Every catalogue, for build-time code (Astro pages) and tests.
 * Never import this from client-side code: use `load/<locale>` instead.
 */
import { ar } from './ar';
import { en, type Messages } from './en';
import { es } from './es';
import type { Locale } from './locales';
import './load/ar';
import './load/en';
import './load/es';

/** `Record<Locale, …>`: adding a locale without a catalogue is a type error. */
export const MESSAGES: Record<Locale, Messages> = { en, es, ar };
