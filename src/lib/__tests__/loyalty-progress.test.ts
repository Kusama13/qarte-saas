import { describe, it, expect } from 'vitest';
import { getLoyaltyProgress, computeTier1Redeemed } from '@/lib/loyalty-progress';

describe('getLoyaltyProgress', () => {
  const visitMerchant = { loyalty_mode: 'visit', stamps_required: 10, reward_description: 'Un brushing offert' };

  it('progresse vers le palier 1 (mode passage)', () => {
    const p = getLoyaltyProgress({ current_stamps: 7 }, visitMerchant);
    expect(p.mode).toBe('visit');
    expect(p.target).toBe(10);
    expect(p.remaining).toBe(3);
    expect(p.progressPercent).toBe(70);
    expect(p.rewardReady).toBe(false);
    expect(p.rewardLabel).toBe('Un brushing offert');
  });

  it('récompense prête quand tampons >= requis', () => {
    const p = getLoyaltyProgress({ current_stamps: 10 }, visitMerchant);
    expect(p.isTier1Ready).toBe(true);
    expect(p.rewardReady).toBe(true);
    expect(p.remaining).toBe(0);
  });

  it('walk-in sans carte : hasCard false, rien de prêt', () => {
    const p = getLoyaltyProgress(null, visitMerchant);
    expect(p.hasCard).toBe(false);
    expect(p.currentStamps).toBe(0);
    expect(p.rewardReady).toBe(false);
  });

  it('tier2 : la cible passe au palier 2 une fois le palier 1 atteint', () => {
    const m = { ...visitMerchant, tier2_enabled: true, tier2_stamps_required: 20, tier2_reward_description: 'Une coupe offerte' };
    const p = getLoyaltyProgress({ current_stamps: 12 }, m);
    expect(p.target).toBe(20);
    expect(p.remaining).toBe(8);
    expect(p.isTier1Ready).toBe(true);
    expect(p.isTier2Ready).toBe(false);
    // palier 1 atteint et non consommé → récompense (palier 1) prête
    expect(p.rewardReady).toBe(true);
  });

  it('tier2 : palier 1 déjà consommé → plus prêt tant que le palier 2 n\'est pas atteint', () => {
    const m = { ...visitMerchant, tier2_enabled: true, tier2_stamps_required: 20, tier2_reward_description: 'Une coupe offerte' };
    const p = getLoyaltyProgress({ current_stamps: 12 }, m, true);
    expect(p.rewardReady).toBe(false);
  });

  it('tier2 atteint : récompense palier 2 prête, libellé palier 2', () => {
    const m = { ...visitMerchant, tier2_enabled: true, tier2_stamps_required: 20, tier2_reward_description: 'Une coupe offerte' };
    const p = getLoyaltyProgress({ current_stamps: 20 }, m, true);
    expect(p.isTier2Ready).toBe(true);
    expect(p.rewardReady).toBe(true);
    expect(p.rewardLabel).toBe('Une coupe offerte');
  });

  it('cagnotte : cashback calculé sur le solde', () => {
    const m = { loyalty_mode: 'cagnotte', stamps_required: 10, cagnotte_percent: 5 };
    const p = getLoyaltyProgress({ current_stamps: 4, current_amount: 200 }, m);
    expect(p.mode).toBe('cagnotte');
    expect(p.cashbackValue).toBe(10); // 200 * 5 / 100
    expect(p.currentAmount).toBe(200);
  });
});

describe('computeTier1Redeemed', () => {
  it('faux sans récompense', () => {
    expect(computeTier1Redeemed([])).toBe(false);
  });

  it('vrai si un palier 1 est postérieur au dernier palier 2', () => {
    const r = [
      { tier: 2, redeemed_at: '2026-01-01T10:00:00Z' },
      { tier: 1, redeemed_at: '2026-02-01T10:00:00Z' },
    ];
    expect(computeTier1Redeemed(r)).toBe(true);
  });

  it('faux si le palier 1 précède le dernier palier 2 (cycle réinitialisé)', () => {
    const r = [
      { tier: 1, redeemed_at: '2026-01-01T10:00:00Z' },
      { tier: 2, redeemed_at: '2026-02-01T10:00:00Z' },
    ];
    expect(computeTier1Redeemed(r)).toBe(false);
  });
});
