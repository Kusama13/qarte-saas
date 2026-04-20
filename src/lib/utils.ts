import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import QRCode from 'qrcode';
import type { MerchantCountry } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TIMEZONE = 'Europe/Paris';

/** Maps each merchant country to its canonical IANA timezone. */
export const COUNTRY_TIMEZONE: Record<MerchantCountry, string> = {
  FR: 'Europe/Paris',
  BE: 'Europe/Brussels',
  CH: 'Europe/Zurich',
  LU: 'Europe/Luxembourg',
  ES: 'Europe/Madrid',
  IT: 'Europe/Rome',
  GB: 'Europe/London',
  US: 'America/New_York',
  CA: 'America/Toronto',
  AU: 'Australia/Sydney',
};

/** Resolve IANA timezone for a given country (defaults to Europe/Paris). */
export function getTimezoneForCountry(country?: string): string {
  return COUNTRY_TIMEZONE[country as MerchantCountry] || TIMEZONE;
}

/** Maps each merchant country to its currency code. */
export const COUNTRY_CURRENCY: Record<MerchantCountry, string> = {
  FR: 'EUR', BE: 'EUR', CH: 'CHF', LU: 'EUR',
  ES: 'EUR', IT: 'EUR',
  GB: 'GBP', US: 'USD', CA: 'CAD', AU: 'AUD',
};

/** Resolve ISO currency code for a given country (defaults to EUR). */
export function getCurrencyForCountry(country?: string): string {
  return COUNTRY_CURRENCY[country as MerchantCountry] || 'EUR';
}

/** Currency symbol for display. */
export function getCurrencySymbol(country?: string): string {
  const currency = getCurrencyForCountry(country);
  switch (currency) {
    case 'GBP': return '£';
    case 'USD': case 'CAD': case 'AUD': return '$';
    case 'CHF': return 'CHF';
    default: return '€';
  }
}

/** Format a monetary amount with the correct currency symbol and locale.
 *  Returns e.g. "19,00 €" (FR), "$19.00" (US), "£19.00" (GB).
 *  Pass `decimals: 0` for compact totals (e.g. dashboard cumul → "15 000 €" instead of "15 000,00 €"). */
export function formatCurrency(amount: number, country?: string, locale: string = 'fr', decimals: number = 2): string {
  const currency = getCurrencyForCountry(country);
  const bcp47 = locale === 'en' ? 'en-US' : 'fr-FR';
  return new Intl.NumberFormat(bcp47, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Ensures a hex color has enough contrast against a white background.
 * Returns the original color if contrast is OK, or a darkened version otherwise.
 * Uses relative luminance per WCAG 2.0.
 */
export function ensureTextContrast(hex: string, minRatio = 3): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  // Contrast ratio against white (luminance = 1)
  const ratio = (1 + 0.05) / (luminance + 0.05);

  if (ratio >= minRatio) return hex;

  // Darken the color until we meet the ratio
  let factor = 0.9;
  let dr = r, dg = g, db = b;
  for (let i = 0; i < 20; i++) {
    dr *= factor;
    dg *= factor;
    db *= factor;
    const lum = 0.2126 * toLinear(dr) + 0.7152 * toLinear(dg) + 0.0722 * toLinear(db);
    if ((1 + 0.05) / (lum + 0.05) >= minRatio) break;
  }

  const toHex = (c: number) => Math.round(c * 255).toString(16).padStart(2, '0');
  return `#${toHex(dr)}${toHex(dg)}${toHex(db)}`;
}

export function generateSlug(shopName: string): string {
  let slug = shopName.toLowerCase().trim();
  slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  slug = slug.replace(/[^a-z0-9\s-]/g, '');
  slug = slug.replace(/\s+/g, '-');
  slug = slug.replace(/-+/g, '-');
  slug = slug.replace(/^-|-$/g, '');
  return slug;
}

// Génère un code de scan unique (8 caractères alphanumériques)
// Exclut 0, O, I, l, 1 pour éviter confusion visuelle
export function generateScanCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const randomBytes = crypto.getRandomValues(new Uint8Array(8));
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(randomBytes[i] % chars.length);
  }
  return code;
}

export function formatDate(date: string | Date, locale: string = 'fr'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (locale === 'en') return format(d, 'MM/dd/yyyy', { locale: enUS });
  return format(d, 'dd/MM/yyyy', { locale: fr });
}

export function formatDateTime(date: string | Date, locale: string = 'fr'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (locale === 'en') return format(d, 'MM/dd/yyyy h:mm a', { locale: enUS });
  return format(d, 'dd/MM/yyyy à HH:mm', { locale: fr });
}

/**
 * Format a "HH:mm" time string for display.
 * FR: "14:00" → "14h00", "09:30" → "09h30" (always zero-padded HH + minutes)
 * EN: "14:00" → "2:00 PM", "14:30" → "2:30 PM"
 */
export function formatTime(time: string, locale: string = 'fr'): string {
  const [h, m] = time.split(':');
  const hour = +h;
  const min = m || '00';
  if (locale === 'en') {
    const period = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return min === '00' ? `${h12}:00 ${period}` : `${h12}:${min} ${period}`;
  }
  return `${String(hour).padStart(2, '0')}h${min}`;
}

/** @deprecated Use formatCurrency(amount, country, locale) for country-aware formatting. */
export function formatEUR(amount: number, locale: string = 'fr'): string {
  if (locale === 'en') return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function calculateCashback(amount: number, percent: number): number {
  return Math.round(amount * percent) / 100;
}

export const MONTH_LABELS_FR: Record<string, string> = {
  '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
  '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
  '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre',
};

/** Format "YYYY-MM" → "Janvier 2026" */
export function formatContestMonth(yyyymm: string): string {
  const [year, month] = yyyymm.split('-');
  return `${MONTH_LABELS_FR[month] || month} ${year}`;
}

export function formatRelativeTime(date: string | Date, locale: string = 'fr'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: locale === 'en' ? enUS : fr });
}

/** Compact relative time: "1min", "5h", "3j", "2sem", "1mo", "1a" (FR) / "1m", "5h", "3d", "2w", "1mo", "1y" (EN). */
export function formatRelativeTimeShort(date: string | Date, locale: string = 'fr'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  const isEN = locale === 'en';
  if (diffSec < 60) return isEN ? 'now' : 'à l\u2019instant';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}${isEN ? 'm' : 'min'}`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}${isEN ? 'd' : 'j'}`;
  const diffW = Math.floor(diffD / 7);
  if (diffW < 4) return `${diffW}${isEN ? 'w' : 'sem'}`;
  const diffMo = Math.floor(diffD / 30);
  if (diffMo < 12) return `${diffMo}mo`;
  const diffY = Math.floor(diffD / 365);
  return `${diffY}${isEN ? 'y' : 'a'}`;
}

/** Get today's date (YYYY-MM-DD) in the merchant's country timezone. */
export function getTodayForCountry(country?: string): string {
  const tz = getTimezoneForCountry(country);
  return formatInTimeZone(new Date(), tz, 'yyyy-MM-dd');
}

/** Get the start-of-day ISO timestamp in the merchant's country timezone.
 *  Used for same-day scan prevention queries (gte filter). */
export function getTodayStartForCountry(country?: string): string {
  const tz = getTimezoneForCountry(country);
  const todayStr = formatInTimeZone(new Date(), tz, 'yyyy-MM-dd');
  // Convert local midnight in that timezone → UTC
  return fromZonedTime(new Date(todayStr + 'T00:00:00'), tz).toISOString();
}

/** @deprecated Use getTodayForCountry(country) for country-aware logic. */
export function getTodayInParis(): string {
  return getTodayForCountry('FR');
}

export function isToday(dateString: string): boolean {
  const today = getTodayInParis();
  return dateString === today;
}

/** @deprecated Use toZonedTime with getTimezoneForCountry(country). */
export function getCurrentDateTimeInParis(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

export function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export interface TrialStatus {
  isActive: boolean;
  isInGracePeriod: boolean;
  isFullyExpired: boolean;
  /** True dès la fin de l'essai (grâce ou au-delà), sauf si abonné. Destiné au blocage customer-facing. */
  isTrialExpired: boolean;
  daysRemaining: number;
  daysUntilDeletion: number;
  gracePeriodDays: number;
}

// Pricing history — old price before 2026-04-05, new price after
const PRICE_CHANGE_DATE = '2026-04-05';

/**
 * Monthly equivalent price for a merchant. Handles both the April 2026 pricing split
 * AND the 2 tiers (Fidélité 19€ / Tout-en-un 24€).
 * - Legacy merchants (billing_period_start before split) → 19€/190€ (tarif historique)
 * - Post-split Fidélité → 19€/190€
 * - Post-split Tout-en-un (default) → 24€/240€
 */
export function getMerchantMonthlyPrice(merchant: {
  billing_interval: string | null;
  billing_period_start: string | null;
  plan_tier?: string | null;
}): number {
  const isLegacy = merchant.billing_period_start && merchant.billing_period_start < PRICE_CHANGE_DATE;
  const isFidelity = !isLegacy && merchant.plan_tier === 'fidelity';
  const annualTotal = isLegacy || isFidelity ? 190 : 240;
  const monthly = isLegacy || isFidelity ? 19 : 24;
  if (merchant.billing_interval === 'annual') {
    return Math.round(annualTotal / 12 * 100) / 100;
  }
  return monthly;
}

export function getTrialStatus(trialEndsAt: string | null, subscriptionStatus: string): TrialStatus {
  const GRACE_PERIOD_DAYS = 3;

  // Si abonné (actif, en cours d'annulation, ou paiement échoué), pas de restriction trial
  if (subscriptionStatus === 'active' || subscriptionStatus === 'canceling' || subscriptionStatus === 'past_due') {
    return {
      isActive: false,
      isInGracePeriod: false,
      isFullyExpired: false,
      isTrialExpired: false,
      daysRemaining: 0,
      daysUntilDeletion: 0,
      gracePeriodDays: GRACE_PERIOD_DAYS,
    };
  }

  if (!trialEndsAt) {
    return {
      isActive: false,
      isInGracePeriod: false,
      isFullyExpired: true,
      isTrialExpired: true,
      daysRemaining: 0,
      daysUntilDeletion: 0,
      gracePeriodDays: GRACE_PERIOD_DAYS,
    };
  }

  const end = new Date(trialEndsAt);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Essai encore actif
  if (daysRemaining > 0) {
    return {
      isActive: true,
      isInGracePeriod: false,
      isFullyExpired: false,
      isTrialExpired: false,
      daysRemaining,
      daysUntilDeletion: daysRemaining + GRACE_PERIOD_DAYS,
      gracePeriodDays: GRACE_PERIOD_DAYS,
    };
  }

  // Période de grâce (0 à 3 jours après expiration)
  const daysExpired = Math.abs(daysRemaining);
  const daysUntilDeletion = GRACE_PERIOD_DAYS - daysExpired;

  if (daysUntilDeletion > 0) {
    return {
      isActive: false,
      isInGracePeriod: true,
      isFullyExpired: false,
      isTrialExpired: true,
      daysRemaining,
      daysUntilDeletion,
      gracePeriodDays: GRACE_PERIOD_DAYS,
    };
  }

  // Plus de 3 jours après expiration
  return {
    isActive: false,
    isInGracePeriod: false,
    isFullyExpired: true,
    isTrialExpired: true,
    daysRemaining,
    daysUntilDeletion: 0,
    gracePeriodDays: GRACE_PERIOD_DAYS,
  };
}

export async function generateQRCode(url: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

export async function generateQRCodeSVG(url: string): Promise<string> {
  try {
    const svg = await QRCode.toString(url, {
      type: 'svg',
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H',
    });
    return svg;
  } catch (error) {
    console.error('Error generating QR SVG:', error);
    throw new Error('Failed to generate QR code');
  }
}

// =============================================
// Locale helpers
// =============================================

/** Convert short locale ('fr', 'en') to BCP 47 tag for Intl APIs */
export function toBCP47(locale: string): string {
  return locale === 'en' ? 'en-US' : 'fr-FR';
}

// =============================================
// Phone: multi-country support
// Storage: E.164 without + (e.g. 33612345678)
// =============================================

export const COUNTRY_FLAGS: Record<MerchantCountry, string> = {
  FR: '🇫🇷', BE: '🇧🇪', CH: '🇨🇭', LU: '🇱🇺',
  US: '🇺🇸', GB: '🇬🇧', CA: '🇨🇦', AU: '🇦🇺',
  ES: '🇪🇸', IT: '🇮🇹',
};

/** Strip non-digits from E.164 phone for wa.me links. */
export function formatPhoneForWhatsApp(phone: string): string {
  return phone.replace(/\D/g, '');
}

export const PHONE_CONFIG: Record<MerchantCountry, {
  prefix: string;
  localLeadingZero: boolean;
  localLengths: number[];
  intlLengths: number[];
  placeholder: string;
}> = {
  FR: {
    prefix: '33',
    localLeadingZero: true,
    localLengths: [10],       // 0612345678
    intlLengths: [11],        // 33612345678
    placeholder: '06 12 34 56 78',
  },
  BE: {
    prefix: '32',
    localLeadingZero: true,
    localLengths: [9, 10],    // 027123456 (fixe 9), 0475123456 (mobile 10)
    intlLengths: [10, 11],    // 327123456 (fixe), 32475123456 (mobile)
    placeholder: '0475 12 34 56',
  },
  CH: {
    prefix: '41',
    localLeadingZero: true,
    localLengths: [10],       // 0791234567
    intlLengths: [11],        // 41791234567
    placeholder: '079 123 45 67',
  },
  LU: {
    prefix: '352',
    localLeadingZero: false,  // Pas de 0 initial au Luxembourg
    localLengths: [6, 7, 8, 9], // 621123, 6211234, 62112345, 621123456
    intlLengths: [9, 10, 11, 12], // 352 + local
    placeholder: '621 123 456',
  },
  US: {
    prefix: '1',
    localLeadingZero: false,
    localLengths: [10],        // 5551234567
    intlLengths: [11],         // 15551234567
    placeholder: '(555) 123-4567',
  },
  GB: {
    prefix: '44',
    localLeadingZero: true,
    localLengths: [10, 11],    // 0201234567 (London 10), 07911123456 (mobile 11)
    intlLengths: [12, 13],     // 44201234567, 447911123456
    placeholder: '07911 123456',
  },
  CA: {
    prefix: '1',
    localLeadingZero: false,
    localLengths: [10],        // 6131234567
    intlLengths: [11],         // 16131234567
    placeholder: '(613) 123-4567',
  },
  AU: {
    prefix: '61',
    localLeadingZero: true,
    localLengths: [10],        // 0412345678
    intlLengths: [11],         // 61412345678
    placeholder: '0412 345 678',
  },
  ES: {
    prefix: '34',
    localLeadingZero: false,
    localLengths: [9],         // 612345678
    intlLengths: [11],         // 34612345678
    placeholder: '612 34 56 78',
  },
  IT: {
    prefix: '39',
    localLeadingZero: false,
    localLengths: [9, 10],     // 312345678 (mobile 9), 0212345678 (fixe 10)
    intlLengths: [11, 12],     // 39312345678, 390212345678
    placeholder: '312 345 6789',
  },
};

/** All supported countries — stable reference for default props */
export const ALL_COUNTRIES = Object.keys(PHONE_CONFIG) as MerchantCountry[];

/**
 * Convertit un numero vers E.164 sans + (ex: 33612345678).
 * Le parametre country determine comment interpreter les numeros locaux.
 * Default 'FR' pour backward-compatibility.
 */
export function formatPhoneNumber(phone: string, country: MerchantCountry = 'FR'): string {
  const cleaned = phone.replace(/\D/g, '');
  const config = PHONE_CONFIG[country];

  // Deja en E.164 pour ce pays ?
  if (cleaned.startsWith(config.prefix) && config.intlLengths.includes(cleaned.length)) {
    return cleaned;
  }

  // Format local avec 0 (FR, BE, CH)
  if (config.localLeadingZero && cleaned.startsWith('0') && config.localLengths.includes(cleaned.length)) {
    return config.prefix + cleaned.slice(1);
  }

  // Luxembourg : pas de 0 initial
  if (!config.localLeadingZero && config.localLengths.includes(cleaned.length) && !cleaned.startsWith(config.prefix)) {
    return config.prefix + cleaned;
  }

  // Deja en E.164 pour un AUTRE pays ? (backward-compat)
  for (const cfg of Object.values(PHONE_CONFIG)) {
    if (cleaned.startsWith(cfg.prefix) && cfg.intlLengths.includes(cleaned.length)) {
      return cleaned;
    }
  }

  // Fallback : retourner tel quel
  return cleaned;
}

/**
 * Valide un numero E.164 sans + pour un pays donne.
 */
export function validatePhone(phone: string, country: MerchantCountry = 'FR'): boolean {
  const cleaned = phone.replace(/\D/g, '');
  const config = PHONE_CONFIG[country];
  return cleaned.startsWith(config.prefix) && config.intlLengths.includes(cleaned.length);
}

/**
 * Affiche un numero E.164 en format local lisible.
 * Ex: 33612345678 → 06 12 34 56 78
 */
export function displayPhoneNumber(phone: string, country: MerchantCountry = 'FR'): string {
  const cleaned = phone.replace(/\D/g, '');
  const config = PHONE_CONFIG[country];

  if (cleaned.startsWith(config.prefix)) {
    const local = cleaned.slice(config.prefix.length);
    if (config.localLeadingZero) {
      const withZero = '0' + local;
      return withZero.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
    }
    // US/CA: (555) 123-4567
    if ((country === 'US' || country === 'CA') && local.length === 10) {
      return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
    }
    // Luxembourg + fallback
    return local.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
  }

  return cleaned.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}

/** Supported phone countries for client-facing input */
export const PHONE_COUNTRIES: MerchantCountry[] = ['FR', 'BE', 'CH'];

// Pre-sorted configs: longer prefixes first to avoid false matches (e.g. '352' before '32')
const SORTED_PHONE_CONFIGS = Object.entries(PHONE_CONFIG).sort(
  ([, a], [, b]) => b.prefix.length - a.prefix.length
);

/**
 * Detecte le pays d'un numero E.164 sans + a partir de son prefix.
 * Ex: '33612345678' → 'FR', '32475123456' → 'BE', '41791234567' → 'CH'
 */
export function detectPhoneCountry(phone: string): MerchantCountry {
  const cleaned = phone.replace(/\D/g, '');
  for (const [country, cfg] of SORTED_PHONE_CONFIGS) {
    if (cleaned.startsWith(cfg.prefix) && cfg.intlLengths.includes(cleaned.length)) {
      return country as MerchantCountry;
    }
  }
  return 'FR';
}

/**
 * Retourne le drapeau + format local lisible d'un numero E.164.
 * Ex: '33612345678' → { flag: '🇫🇷', display: '06 12 34 56 78', country: 'FR' }
 * Ex: '32475123456' → { flag: '🇧🇪', display: '0475 12 34 56', country: 'BE' }
 */
export function displayPhoneWithFlag(phone: string): { flag: string; display: string; country: MerchantCountry } {
  const country = detectPhoneCountry(phone);
  return {
    flag: COUNTRY_FLAGS[country],
    display: displayPhoneNumber(phone, country),
    country,
  };
}

/**
 * Convertit un E.164 en numero local brut + pays detecte.
 * Ex: '33612345678' → { local: '0612345678', country: 'FR' }
 * Utile pour pre-remplir un PhoneInput avec un numero stocke en DB.
 */
export function toLocalPhone(phone: string): { local: string; country: MerchantCountry } {
  const cleaned = phone.replace(/\D/g, '');
  const country = detectPhoneCountry(cleaned);
  const cfg = PHONE_CONFIG[country];
  if (cleaned.startsWith(cfg.prefix)) {
    const local = cleaned.slice(cfg.prefix.length);
    return { local: cfg.localLeadingZero ? '0' + local : local, country };
  }
  return { local: cleaned, country };
}

/**
 * Retourne directement "🇫🇷 06 12 34 56 78" — raccourci pour le JSX.
 */
export function formatPhoneLabel(phone: string): string {
  const { flag, display } = displayPhoneWithFlag(phone);
  return `${flag} ${display}`;
}

/**
 * Genere toutes les variantes E.164 possibles d'un numero pour FR/BE/CH.
 * Permet de retrouver un client peu importe le format stocke.
 * Ex: '33612345678' → ['33612345678', '32612345678', '41612345678']
 */
export function getAllPhoneFormats(phone: string): string[] {
  const cleaned = phone.replace(/\D/g, '');
  const countries = PHONE_COUNTRIES;
  const results = new Set<string>();

  // Si deja E.164 pour un pays connu → extraire le local, generer variantes
  for (const c of countries) {
    const cfg = PHONE_CONFIG[c];
    if (cleaned.startsWith(cfg.prefix) && cfg.intlLengths.includes(cleaned.length)) {
      results.add(cleaned);
      const local = cleaned.slice(cfg.prefix.length);
      for (const c2 of countries) {
        const cfg2 = PHONE_CONFIG[c2];
        const variant = cfg2.prefix + local;
        if (cfg2.intlLengths.includes(variant.length)) results.add(variant);
      }
      return [...results];
    }
  }

  // Format local avec 0 → generer variantes
  if (cleaned.startsWith('0')) {
    const local = cleaned.slice(1);
    for (const c of countries) {
      const cfg = PHONE_CONFIG[c];
      const variant = cfg.prefix + local;
      if (cfg.intlLengths.includes(variant.length)) results.add(variant);
    }
  }

  if (results.size === 0) results.add(cleaned);
  return [...results];
}

export function validateEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
}

export const EMAIL_DOMAINS = [
  'gmail.com', 'hotmail.com', 'hotmail.fr', 'outlook.com', 'outlook.fr',
  'yahoo.com', 'yahoo.fr', 'orange.fr', 'sfr.fr', 'free.fr',
  'laposte.net', 'wanadoo.fr', 'icloud.com', 'live.fr', 'msn.com',
];

const TYPO_DOMAINS: Record<string, string> = {
  // Gmail
  'gmial.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gmaill.com': 'gmail.com',
  'gamil.com': 'gmail.com', 'gmil.com': 'gmail.com', 'gmai.com': 'gmail.com',
  'gnail.com': 'gmail.com', 'gmaol.com': 'gmail.com', 'gmali.com': 'gmail.com',
  'gmail.fr': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com', 'gmail.om': 'gmail.com', 'gemail.com': 'gmail.com',
  'gmail.comp': 'gmail.com', 'gmail.cpm': 'gmail.com', 'gmail.cmo': 'gmail.com',
  // Hotmail
  'hotmal.com': 'hotmail.com', 'hotmial.com': 'hotmail.com', 'hotamil.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com', 'hotmai.com': 'hotmail.com', 'hotmaill.com': 'hotmail.com',
  'hotmil.com': 'hotmail.com', 'hotmail.comp': 'hotmail.com', 'hotmail.cpm': 'hotmail.com',
  'hotmail.cmo': 'hotmail.com',
  // Outlook
  'outloo.com': 'outlook.com', 'outlok.com': 'outlook.com', 'outloock.com': 'outlook.com',
  'outlook.con': 'outlook.com', 'outlook.fr': 'outlook.com', 'outlook.comp': 'outlook.com',
  'outlook.cpm': 'outlook.com', 'outlook.cmo': 'outlook.com',
  // Yahoo
  'yahooo.com': 'yahoo.com', 'yaho.com': 'yahoo.com', 'yahoo.con': 'yahoo.com',
  'yaoo.com': 'yahoo.com', 'yhoo.com': 'yahoo.com',
  // Orange / SFR / Free (FAI français)
  'ornage.fr': 'orange.fr', 'oraneg.fr': 'orange.fr', 'orange.con': 'orange.fr',
  'sfr.con': 'sfr.fr', 'free.con': 'free.fr', 'fre.fr': 'free.fr',
  // iCloud
  'iclou.com': 'icloud.com', 'icoud.com': 'icloud.com', 'icloud.con': 'icloud.com',
  // Wanadoo / LaPoste
  'wanadoo.con': 'wanadoo.fr', 'laposte.con': 'laposte.net',
};

export function suggestEmailCorrection(email: string): string | null {
  if (!email || !email.includes('@')) return null;
  const [local, domain] = email.toLowerCase().split('@');
  if (!domain) return null;
  const correction = TYPO_DOMAINS[domain];
  if (correction) return `${local}@${correction}`;
  return null;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export function getScanUrl(scanCode: string): string {
  return `${getAppUrl()}/scan/${scanCode}`;
}

/** Unwrap Supabase join result that may be T or T[] depending on query shape */
export function unwrapJoin<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomBytes = crypto.getRandomValues(new Uint8Array(6));
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[randomBytes[i] % chars.length];
  return code;
}

// ── Double stamp days helpers ─────────────────────────────────────────────────

/** Week order Mon→Sun (French business convention). */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

/** Short day labels keyed by JS getDay() value, per locale. */
const DAY_LABELS_BY_LOCALE: Record<string, Record<number, string>> = {
  fr: { 0: 'Dim', 1: 'Lun', 2: 'Mar', 3: 'Mer', 4: 'Jeu', 5: 'Ven', 6: 'Sam' },
  en: { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' },
};

/** @deprecated Use getDayLabels(locale) instead */
export const DAY_LABELS = DAY_LABELS_BY_LOCALE.fr;

export function getDayLabels(locale: string = 'fr'): Record<number, string> {
  return DAY_LABELS_BY_LOCALE[locale] || DAY_LABELS_BY_LOCALE.fr;
}

/**
 * Parse a JSON string of JS getDay() values (0–6).
 * Filters out any values outside 0–6. Returns [] on error.
 */
export function parseDoubleDays(json: string | null | undefined): number[] {
  try {
    const parsed = JSON.parse(json || '[]') as unknown[];
    return parsed.filter((d): d is number => typeof d === 'number' && d >= 0 && d <= 6);
  } catch {
    return [];
  }
}

/**
 * Returns double days sorted Mon→Sun and formatted as "Lun · Mer" (FR) or "Mon · Wed" (EN).
 * Returns empty string if none.
 */
export function formatDoubleDays(json: string | null | undefined, locale: string = 'fr'): string {
  const days = parseDoubleDays(json);
  const labels = getDayLabels(locale);
  return WEEK_ORDER.filter(d => days.includes(d)).map(d => labels[d]).join(' · ');
}

const BOOKING_PLATFORMS: { pattern: RegExp; name: string }[] = [
  { pattern: /planity\./i, name: 'Planity' },
  { pattern: /treatwell\./i, name: 'Treatwell' },
  { pattern: /fresha\./i, name: 'Fresha' },
  { pattern: /booksy\./i, name: 'Booksy' },
  { pattern: /kiute\./i, name: 'Kiute' },
  { pattern: /iara\./i, name: 'Iara' },
  { pattern: /calendly\./i, name: 'Calendly' },
  { pattern: /doctolib\./i, name: 'Doctolib' },
  { pattern: /instagram\.com|instagr\.am/i, name: 'Instagram' },
  { pattern: /tiktok\.com/i, name: 'TikTok' },
  { pattern: /facebook\.com|fb\.com|fb\.me/i, name: 'Facebook' },
  { pattern: /snapchat\.com/i, name: 'Snapchat' },
  { pattern: /wa\.me|whatsapp\.com/i, name: 'WhatsApp' },
  { pattern: /t\.me|telegram\./i, name: 'Telegram' },
  { pattern: /linktr\.ee/i, name: 'Linktree' },
];

/**
 * Detects a known booking platform from a URL.
 * Returns the platform name (e.g. "Planity") or null.
 */
export function detectBookingPlatform(url: string | null | undefined): string | null {
  if (!url) return null;
  for (const { pattern, name } of BOOKING_PLATFORMS) {
    if (pattern.test(url)) return name;
  }
  return null;
}
