import { describe, it, expect } from 'vitest';
import { computeBookingPrice } from '../booking-pricing';

describe('computeBookingPrice', () => {
  it('garde la précision au centime sans réduction (pas d\'arrondi à l\'euro)', () => {
    const r = computeBookingPrice({ serviceLines: [{ id: 'a', price: 35.5 }] });
    expect(r.finalPrice).toBe(35.5);
    expect(r.hasDiscount).toBe(false);
  });

  it('ne descend jamais sous 0 (member 20% + promo 100%)', () => {
    const r = computeBookingPrice({
      serviceLines: [{ id: 'a', price: 50 }],
      memberPercent: 20,
      promoPercent: 100,
    });
    expect(r.finalPrice).toBe(0);
  });

  it('cumule member + la meilleure des deux offres (welcome vs promo)', () => {
    const r = computeBookingPrice({
      serviceLines: [{ id: 'a', price: 100 }],
      memberPercent: 10,
      welcomePercent: 5,
      promoPercent: 20,
    });
    // member 10 (cumulé) + promo 20 (gagne vs welcome 5) = -30 → 70
    expect(r.finalPrice).toBe(70);
    expect(r.appliedDiscounts.member).toBe(10);
    expect(r.appliedDiscounts.promo).toBe(20);
    expect(r.appliedDiscounts.welcome).toBeUndefined();
  });

  it('promo ciblée ne s\'applique qu\'aux prestations listées', () => {
    const r = computeBookingPrice({
      serviceLines: [{ id: 'a', price: 40 }, { id: 'b', price: 60 }],
      promoPercent: 50,
      promoTargetServiceIds: ['a'],
    });
    // 50% de 40 = 20 → 100 - 20 = 80
    expect(r.finalPrice).toBe(80);
    expect(r.appliedDiscounts.promoAmount).toBe(20);
  });

  it('finalPrice réduit reste au centime', () => {
    const r = computeBookingPrice({ serviceLines: [{ id: 'a', price: 35.5 }], promoPercent: 10 });
    // 35.5 - 3.55 = 31.95
    expect(r.finalPrice).toBe(31.95);
  });
});
