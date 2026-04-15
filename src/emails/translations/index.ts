import { fr } from './fr';
import { en } from './en';

export type EmailLocale = 'fr' | 'en';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const translations: Record<EmailLocale, any> = { fr, en };

/**
 * Get a translation function for emails.
 * Usage: const t = getEmailT(locale); t('welcome.heading', { shopName })
 */
export function getEmailT(locale: EmailLocale = 'fr') {
  const dict = translations[locale] || translations.fr;

  return function t(key: string, params?: Record<string, string | number>): string {
    const parts = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let val: any = dict;
    for (const p of parts) {
      val = val?.[p];
      if (val === undefined) return key;
    }
    if (typeof val !== 'string') return key;

    if (!params) return val;

    return Object.entries(params).reduce(
      (str, [pKey, pVal]) => str.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal)),
      val,
    );
  };
}

/** BaseLayout shared translations */
export function getBaseLayoutT(locale: EmailLocale = 'fr') {
  const dict = translations[locale] || translations.fr;
  return dict.baseLayout;
}
