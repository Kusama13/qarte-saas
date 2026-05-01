/**
 * Conversion d'un montant entier en lettres pour l'eyebrow du bon cadeau.
 * Ex : amountInWords(50, 'fr') → "Cinquante euros"
 *      amountInWords(50, 'en') → "Fifty euros"
 *
 * Couvre 0 à 9999 (largement au-delà des bons cadeaux usuels).
 * Au-delà : retourne `null` pour signaler au caller de fallback sur le format chiffré.
 */

const FR_UNITS = [
  '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
  'dix-sept', 'dix-huit', 'dix-neuf',
];
const FR_TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

const EN_UNITS = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
];
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function fr0to99(n: number): string {
  if (n < 20) return FR_UNITS[n];
  // 70-79 et 90-99 en français : septante = "soixante-dix", "quatre-vingt-dix"
  if (n >= 70 && n < 80) {
    const u = n - 60;
    return `soixante-${FR_UNITS[u]}`;
  }
  if (n >= 90 && n < 100) {
    const u = n - 80;
    return `quatre-vingt-${FR_UNITS[u]}`;
  }
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (u === 0) return FR_TENS[t] + (t === 8 ? 's' : '');
  if (u === 1 && t !== 8) return `${FR_TENS[t]} et un`;
  return `${FR_TENS[t]}-${FR_UNITS[u]}`;
}

function en0to99(n: number): string {
  if (n < 20) return EN_UNITS[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (u === 0) return EN_TENS[t];
  return `${EN_TENS[t]}-${EN_UNITS[u]}`;
}

function frUnder1000(n: number): string {
  if (n < 100) return fr0to99(n);
  const h = Math.floor(n / 100);
  const r = n % 100;
  const cent = h === 1 ? 'cent' : `${FR_UNITS[h]} cent${r === 0 ? 's' : ''}`;
  return r === 0 ? cent : `${cent} ${fr0to99(r)}`;
}

function enUnder1000(n: number): string {
  if (n < 100) return en0to99(n);
  const h = Math.floor(n / 100);
  const r = n % 100;
  const part = `${EN_UNITS[h]} hundred`;
  return r === 0 ? part : `${part} ${en0to99(r)}`;
}

export function amountInWords(value: number, locale: 'fr' | 'en' = 'fr'): string | null {
  if (!Number.isFinite(value) || value < 0 || value > 9999 || !Number.isInteger(value)) {
    return null;
  }
  if (locale === 'en') {
    if (value === 0) return 'Zero euros';
    if (value < 1000) {
      const w = enUnder1000(value);
      return `${w.charAt(0).toUpperCase()}${w.slice(1)} euro${value === 1 ? '' : 's'}`;
    }
    const t = Math.floor(value / 1000);
    const r = value % 1000;
    const thousands = `${EN_UNITS[t]} thousand`;
    const w = r === 0 ? thousands : `${thousands} ${enUnder1000(r)}`;
    return `${w.charAt(0).toUpperCase()}${w.slice(1)} euros`;
  }
  if (value === 0) return 'Zéro euro';
  if (value < 1000) {
    const w = frUnder1000(value);
    return `${w.charAt(0).toUpperCase()}${w.slice(1)} euro${value === 1 ? '' : 's'}`;
  }
  const t = Math.floor(value / 1000);
  const r = value % 1000;
  const thousands = t === 1 ? 'mille' : `${FR_UNITS[t]} mille`;
  const w = r === 0 ? thousands : `${thousands} ${frUnder1000(r)}`;
  return `${w.charAt(0).toUpperCase()}${w.slice(1)} euro${value === 1 ? '' : 's'}`;
}
