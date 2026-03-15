import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale } from './config';

export const routing = defineRouting({
  locales,
  defaultLocale,
  // French (default) has no prefix, English gets /en/
  localePrefix: 'as-needed',
});
