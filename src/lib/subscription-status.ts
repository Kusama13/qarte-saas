/**
 * Helpers de gating sur l'abonnement Stripe — module leaf sans deps Node-only,
 * importable depuis du code client (`'use client'`) sans bundler `web-push` & co.
 *
 * `lib/sms.ts` re-exporte pour rétrocompat (les imports server-side existants).
 */

export const PAID_STATUSES = ['active', 'canceling', 'past_due'] as const;

/**
 * True si le statut est dans la liste des statuts payants (active, canceling, past_due).
 * Utilisé pour gater les features payantes (envoi SMS, soumission de campagne)
 * — les non-abonnés (trial, canceled) sont bloqués UI + API.
 */
export function isPaidStatus(status: string | null | undefined): boolean {
  return (PAID_STATUSES as readonly string[]).includes(status || '');
}

export function isPaidMerchant(m: { subscription_status?: string | null } | null | undefined): boolean {
  return !!m && isPaidStatus(m.subscription_status);
}
