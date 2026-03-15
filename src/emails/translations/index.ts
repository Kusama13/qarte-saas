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
    const [ns, ...rest] = key.split('.');
    const k = rest.join('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (dict as any)?.[ns]?.[k];
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
