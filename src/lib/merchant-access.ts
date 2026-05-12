import { getTrialStatus } from './utils';

/**
 * Statut d'acces unifie pour un merchant. Combine 2 cas de blocage :
 *  - `trial_expired` : essai termine + grace period 3j passee, jamais abonne
 *  - `past_due_unpaid` : abonne mais paiement echoue depuis plus de 72h
 *
 * Utilise par les API client-facing (checkin, scan, booking, vouchers, etc.)
 * qui retournent 403 si bloque, et par le dashboard layout qui redirect vers
 * /dashboard/subscription si bloque.
 */

export type BlockReason = 'trial_expired' | 'past_due_unpaid';

export interface MerchantAccessStatus {
  blocked: boolean;
  reason: BlockReason | null;
}

interface MerchantAccessInput {
  trial_ends_at: string | null;
  subscription_status: string;
  past_due_since: string | null;
}

const PAST_DUE_GRACE_HOURS = 72;

export function isPastDueBlocked(merchant: Pick<MerchantAccessInput, 'subscription_status' | 'past_due_since'>): boolean {
  if (merchant.subscription_status !== 'past_due') return false;
  if (!merchant.past_due_since) return false;
  const since = new Date(merchant.past_due_since).getTime();
  if (Number.isNaN(since)) return false;
  const hoursSince = (Date.now() - since) / (1000 * 60 * 60);
  return hoursSince >= PAST_DUE_GRACE_HOURS;
}

export function getMerchantAccessStatus(merchant: MerchantAccessInput): MerchantAccessStatus {
  if (isPastDueBlocked(merchant)) {
    return { blocked: true, reason: 'past_due_unpaid' };
  }
  if (getTrialStatus(merchant.trial_ends_at, merchant.subscription_status).isTrialExpired) {
    return { blocked: true, reason: 'trial_expired' };
  }
  return { blocked: false, reason: null };
}

export function isMerchantBlocked(merchant: MerchantAccessInput): boolean {
  return getMerchantAccessStatus(merchant).blocked;
}
