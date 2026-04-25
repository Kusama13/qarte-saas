// Source de verite pour les 6 raisons d'annulation du save-offer modal.
// Reference depuis :
//   - /api/merchant/cancellation-reason/route.ts (zod enum)
//   - /dashboard/subscription/page.tsx (boucle des boutons)
//   - src/types/index.ts (Merchant.cancellation_reason union)
// La CHECK constraint en migration 127 doit matcher cette liste.

export const CANCELLATION_REASONS = [
  'too_expensive',
  'not_using',
  'missing_feature',
  'switching',
  'temporary',
  'other',
] as const;

export type CancellationReason = (typeof CANCELLATION_REASONS)[number];
