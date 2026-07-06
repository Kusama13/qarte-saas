import { describe, it, expect } from 'vitest';
import {
  isSlotBeforeLeadTime,
  isSlotInPast,
  leadCutoffDate,
  normalizeBookingMinLead,
} from '../booking-window';

// Référence fixe : mardi 10 juin 2026, 14:00 heure de Paris (12:00 UTC en été).
const NOW = new Date('2026-06-10T12:00:00Z');

describe('normalizeBookingMinLead', () => {
  it('accepte les valeurs valides', () => {
    expect(normalizeBookingMinLead(0)).toBe(0);
    expect(normalizeBookingMinLead(24)).toBe(24);
    expect(normalizeBookingMinLead(72)).toBe(72);
  });
  it('retombe sur 0 pour toute valeur invalide/legacy', () => {
    expect(normalizeBookingMinLead(null)).toBe(0);
    expect(normalizeBookingMinLead(undefined)).toBe(0);
    expect(normalizeBookingMinLead(48)).toBe(0);
    expect(normalizeBookingMinLead('24')).toBe(0);
  });
});

describe('isSlotBeforeLeadTime', () => {
  it('délai 0 → jamais bloqué (comportement historique)', () => {
    expect(isSlotBeforeLeadTime('2026-06-10', '14:00', 0, 'FR', NOW)).toBe(false);
    expect(isSlotBeforeLeadTime('2020-01-01', '09:00', 0, 'FR', NOW)).toBe(false);
  });

  it('24 h : bloque le lendemain avant l\'heure, laisse passer après', () => {
    // seuil = mercredi 11 juin 14:00
    expect(isSlotBeforeLeadTime('2026-06-11', '13:00', 24, 'FR', NOW)).toBe(true);
    expect(isSlotBeforeLeadTime('2026-06-11', '15:00', 24, 'FR', NOW)).toBe(false);
    // jour même = toujours trop tôt
    expect(isSlotBeforeLeadTime('2026-06-10', '23:00', 24, 'FR', NOW)).toBe(true);
  });

  it('72 h : le délai s\'étale sur plusieurs jours', () => {
    // seuil = vendredi 13 juin 14:00
    expect(isSlotBeforeLeadTime('2026-06-12', '18:00', 72, 'FR', NOW)).toBe(true);
    expect(isSlotBeforeLeadTime('2026-06-13', '13:59', 72, 'FR', NOW)).toBe(true);
    expect(isSlotBeforeLeadTime('2026-06-13', '14:01', 72, 'FR', NOW)).toBe(false);
  });

  it('sémantique stricte < (pile au seuil = accepté)', () => {
    expect(isSlotBeforeLeadTime('2026-06-11', '14:00', 24, 'FR', NOW)).toBe(false);
  });

  it('délai 0 n\'assume pas le rôle du past-guard (concerns séparés)', () => {
    // Un créneau déjà passé + délai 0 → isSlotBeforeLeadTime reste false (le
    // passé est géré ailleurs par isSlotInPast, qui lui renvoie true).
    const d = '2026-06-10', t = '11:00'; // avant NOW (14:00 Paris)
    expect(isSlotBeforeLeadTime(d, t, 0, 'FR', NOW)).toBe(false);
    expect(isSlotInPast(d, t, 'FR', NOW)).toBe(true);
  });
});

describe('leadCutoffDate', () => {
  it('délai 0 → aujourd\'hui (fuseau merchant)', () => {
    expect(leadCutoffDate(0, 'FR', NOW)).toBe('2026-06-10');
  });
  it('24 h / 72 h → date du seuil', () => {
    expect(leadCutoffDate(24, 'FR', NOW)).toBe('2026-06-11');
    expect(leadCutoffDate(72, 'FR', NOW)).toBe('2026-06-13');
  });
});
