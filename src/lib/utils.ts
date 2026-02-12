import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import QRCode from 'qrcode';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TIMEZONE = 'Europe/Paris';

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
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM/yyyy', { locale: fr });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM/yyyy à HH:mm', { locale: fr });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: fr });
}

export function getTodayInParis(): string {
  const now = new Date();
  return formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd');
}

export function isToday(dateString: string): boolean {
  const today = getTodayInParis();
  return dateString === today;
}

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
  isActive: boolean;           // Essai en cours
  isInGracePeriod: boolean;    // Période de grâce (7 jours après expiration)
  isFullyExpired: boolean;     // Plus de 7 jours après expiration
  daysRemaining: number;       // Jours restants (négatif si expiré)
  daysUntilDeletion: number;   // Jours avant suppression des données
  gracePeriodDays: number;     // Constante: 7 jours
}

export function getTrialStatus(trialEndsAt: string | null, subscriptionStatus: string): TrialStatus {
  const GRACE_PERIOD_DAYS = 7;

  // Si abonné (actif, en cours d'annulation, ou paiement échoué), pas de restriction trial
  if (subscriptionStatus === 'active' || subscriptionStatus === 'canceling' || subscriptionStatus === 'past_due') {
    return {
      isActive: false,
      isInGracePeriod: false,
      isFullyExpired: false,
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
      daysRemaining,
      daysUntilDeletion: daysRemaining + GRACE_PERIOD_DAYS,
      gracePeriodDays: GRACE_PERIOD_DAYS,
    };
  }

  // Période de grâce (0 à 7 jours après expiration)
  const daysExpired = Math.abs(daysRemaining);
  const daysUntilDeletion = GRACE_PERIOD_DAYS - daysExpired;

  if (daysUntilDeletion > 0) {
    return {
      isActive: false,
      isInGracePeriod: true,
      isFullyExpired: false,
      daysRemaining,
      daysUntilDeletion,
      gracePeriodDays: GRACE_PERIOD_DAYS,
    };
  }

  // Plus de 7 jours après expiration
  return {
    isActive: false,
    isInGracePeriod: false,
    isFullyExpired: true,
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
// Phone: multi-country support (FR, BE, CH, LU)
// Storage: E.164 without + (e.g. 33612345678)
// =============================================

import type { MerchantCountry } from '@/types';

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
};

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
    // Luxembourg
    return local.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
  }

  return cleaned.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}

/** @deprecated Use validatePhone instead */
export function validateFrenchPhone(phone: string): boolean {
  // Permissif pour les pages sans contexte merchant
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 9;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
