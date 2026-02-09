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

  // Si abonné, pas de restriction
  if (subscriptionStatus === 'active') {
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

// Formats supportes : FR (+33), BE (+32), CH (+41), LU (+352)
// FR stocke en format local (0612345678) pour retrocompatibilite BDD
// BE/CH/LU stockes en format international sans + (32470123456)
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  // France international → local : 33612345678 → 0612345678
  if (cleaned.startsWith('33') && cleaned.length === 11) {
    return '0' + cleaned.slice(2);
  }
  // France local : 0612345678 → 0612345678
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return cleaned;
  }
  // International (BE/CH/LU) : garder tel quel avec indicatif
  return cleaned;
}

// Pays supportes : FR, BE, CH, LU
const PHONE_RULES: { prefix: string; totalDigits: number }[] = [
  { prefix: '33', totalDigits: 11 },   // France : 33 + 9 digits
  { prefix: '32', totalDigits: 10 },   // Belgique : 32 + 8 digits (fixe)
  { prefix: '32', totalDigits: 11 },   // Belgique : 32 + 9 digits (mobile)
  { prefix: '41', totalDigits: 11 },   // Suisse : 41 + 9 digits
  { prefix: '352', totalDigits: 9 },   // Luxembourg : 352 + 6 digits
  { prefix: '352', totalDigits: 10 },  // Luxembourg : 352 + 7 digits
  { prefix: '352', totalDigits: 11 },  // Luxembourg : 352 + 8 digits
  { prefix: '352', totalDigits: 12 },  // Luxembourg : 352 + 9 digits
];

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // Format local francais : 0X + 8 digits = 10
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return true;
  }
  // Format international
  return PHONE_RULES.some(r => cleaned.startsWith(r.prefix) && cleaned.length === r.totalDigits);
}

/** @deprecated Use validatePhone instead */
export const validateFrenchPhone = validatePhone;

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
