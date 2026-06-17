import { describe, it, expect } from 'vitest';
import { computeFollowupDepositDeadline } from '../deposit';

const TZ = 'Europe/Paris';

describe('computeFollowupDepositDeadline', () => {
  it('pose la deadline à RDV − cancel_deadline_days (même heure)', () => {
    // RDV le 2026-07-01 à 10:00 Paris, délai d'annulation 2 jours, "now" bien avant.
    const now = new Date('2026-06-01T08:00:00Z');
    const deadline = computeFollowupDepositDeadline('2026-07-01', '10:00', 2, TZ, now);
    // RDV − 2 jours = 2026-06-29 10:00 Paris = 08:00 UTC (heure d'été).
    expect(deadline.toISOString()).toBe('2026-06-29T08:00:00.000Z');
  });

  it('cappe à RDV − 4h quand cancel_deadline_days = 0', () => {
    const now = new Date('2026-06-01T08:00:00Z');
    const deadline = computeFollowupDepositDeadline('2026-07-01', '10:00', 0, TZ, now);
    // RDV 10:00 Paris (08:00 UTC) − 4h = 04:00 UTC.
    expect(deadline.toISOString()).toBe('2026-07-01T04:00:00.000Z');
  });

  it('plancher à now si la deadline calculée est déjà passée', () => {
    // RDV dans 1 jour, délai 7 jours → RDV − 7j est dans le passé → on retombe sur now.
    const now = new Date('2026-06-30T09:00:00Z');
    const deadline = computeFollowupDepositDeadline('2026-07-01', '10:00', 7, TZ, now);
    expect(deadline.getTime()).toBe(now.getTime());
  });
});
