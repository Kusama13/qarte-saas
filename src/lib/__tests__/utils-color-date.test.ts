import { describe, it, expect } from 'vitest';
import { readableTextColor, getDayBoundsForCountry } from '@/lib/utils';

describe('readableTextColor', () => {
  it('texte blanc sur fond sombre', () => {
    expect(readableTextColor('#4b0082')).toBe('#ffffff'); // violet profond
    expect(readableTextColor('#000000')).toBe('#ffffff');
  });

  it('texte sombre sur fond clair', () => {
    expect(readableTextColor('#fde68a')).toBe('#1f2937'); // amber clair
    expect(readableTextColor('#ffffff')).toBe('#1f2937');
  });

  it('fond invalide → blanc (défaut sûr)', () => {
    expect(readableTextColor('#abc')).toBe('#ffffff');
    expect(readableTextColor('rose')).toBe('#ffffff');
  });

  it('accepte un alpha de compositing sans casser', () => {
    expect(readableTextColor('#4b0082', { alpha: 0.9 })).toBe('#ffffff');
  });
});

describe('getDayBoundsForCountry', () => {
  it('journée en heure de Paris — été (UTC+2)', () => {
    const { start, end } = getDayBoundsForCountry('2026-07-08', 'FR');
    expect(start).toBe('2026-07-07T22:00:00.000Z');
    expect(end).toBe('2026-07-08T22:00:00.000Z');
  });

  it('journée en heure de Paris — hiver (UTC+1)', () => {
    const { start, end } = getDayBoundsForCountry('2026-01-08', 'FR');
    expect(start).toBe('2026-01-07T23:00:00.000Z');
    expect(end).toBe('2026-01-08T23:00:00.000Z');
  });

  it('DST-safe : le jour du passage à l\'heure d\'été dure 23h', () => {
    const { start, end } = getDayBoundsForCountry('2026-03-29', 'FR');
    const durationHours = (new Date(end).getTime() - new Date(start).getTime()) / 3_600_000;
    expect(durationHours).toBe(23);
  });
});
