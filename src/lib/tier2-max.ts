/**
 * Cap du palier 2 fidélité (tampons/visites) :
 * - Merchants créés ≥ TIER2_MAX_STAMPS_CUTOFF → max 20
 * - Anciens merchants → max 30 (legacy, évite de casser les configs existantes)
 */
export const TIER2_MAX_STAMPS_CUTOFF = new Date('2026-04-20T00:00:00Z');
export const TIER2_MAX_STAMPS_NEW = 20;
export const TIER2_MAX_STAMPS_LEGACY = 30;

export function getTier2MaxStamps(createdAt: string | Date | null | undefined): number {
  if (!createdAt) return TIER2_MAX_STAMPS_NEW;
  const dt = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  return dt.getTime() >= TIER2_MAX_STAMPS_CUTOFF.getTime()
    ? TIER2_MAX_STAMPS_NEW
    : TIER2_MAX_STAMPS_LEGACY;
}
