import { describe, it, expect } from 'vitest';
import { computeFollowupDepositDeadline } from '../deposit';

const TZ = 'Europe/Paris';

describe('computeFollowupDepositDeadline', () => {
  it('pose la deadline à now + 48h (délai fixe après le rappel J-7)', () => {
    // Rappel envoyé "now", RDV bien plus tard → deadline = now + 48h.
    const now = new Date('2026-06-01T08:00:00Z');
    const deadline = computeFollowupDepositDeadline('2026-07-01', '10:00', TZ, now);
    expect(deadline.toISOString()).toBe('2026-06-03T08:00:00.000Z');
  });

  it('cappe à RDV − 4h quand le RDV est trop proche pour 48h', () => {
    // RDV le 2026-07-01 à 10:00 Paris (08:00 UTC), rappel à J-1 (RDV reporté tout près).
    const now = new Date('2026-06-30T08:00:00Z');
    const deadline = computeFollowupDepositDeadline('2026-07-01', '10:00', TZ, now);
    // now + 48h dépasse le RDV → cap = RDV − 4h = 04:00 UTC.
    expect(deadline.toISOString()).toBe('2026-07-01T04:00:00.000Z');
  });

  it('plancher à now si RDV − 4h est déjà passé', () => {
    // now après RDV − 4h → la deadline cappée serait dans le passé → on retombe sur now.
    const now = new Date('2026-07-01T05:00:00Z');
    const deadline = computeFollowupDepositDeadline('2026-07-01', '10:00', TZ, now);
    expect(deadline.getTime()).toBe(now.getTime());
  });
});
