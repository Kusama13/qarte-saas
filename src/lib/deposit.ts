import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export function computeDepositAmount(
  totalPrice: number,
  depositFixed?: number | null,
  depositPercent?: number | null,
): number | null {
  if (depositFixed) return Math.min(depositFixed, totalPrice);
  // Garde precision au centime : Math.round(0.40) = 0 cassait l'affichage
  // (acompte 10% sur 4 EUR -> 0 EUR au lieu de 0,40 EUR).
  if (depositPercent) return Math.min(Math.round(totalPrice * depositPercent) / 100, totalPrice);
  return null;
}

/**
 * CA compté pour un RDV no-show : prestation non réalisée → on ne garde que
 * l'acompte conservé (s'il avait été validé), sinon 0. Source unique partagée
 * entre la pastille CA de l'agenda et la page Statistiques.
 */
export function noShowRevenue(
  fullPrice: number,
  depositConfirmed: boolean | null,
  depositFixed?: number | null,
  depositPercent?: number | null,
): number {
  return depositConfirmed === true
    ? (computeDepositAmount(fullPrice, depositFixed, depositPercent) ?? 0)
    : 0;
}

/**
 * Synthese complete du deposit pour le UI (sticky bar + totals box). Single
 * source of truth : evite la duplication observee dans BookingModal qui
 * recalculait rawDeposit/isFullPayment/cappedDeposit dans 2 endroits avec
 * les memes inputs.
 */
export type DepositInfo = {
  amount: number;
  rawDeposit: number;
  isFullPayment: boolean;
  isFixedDeposit: boolean;
  fixedExceedsTotal: boolean;
  remaining: number;
};

export function computeDepositInfo(
  totalPrice: number,
  depositFixed?: number | null,
  depositPercent?: number | null,
): DepositInfo | null {
  if (totalPrice <= 0) return null;
  const isFixedDeposit = !!depositFixed;
  const rawDeposit = isFixedDeposit
    ? Number(depositFixed)
    : depositPercent
      ? Math.round(totalPrice * depositPercent) / 100
      : 0;
  if (rawDeposit <= 0) return null;
  const amount = Math.min(rawDeposit, totalPrice);
  const isFullPayment = rawDeposit >= totalPrice;
  return {
    amount,
    rawDeposit,
    isFullPayment,
    isFixedDeposit,
    fixedExceedsTotal: isFixedDeposit && isFullPayment,
    remaining: Math.max(0, totalPrice - amount),
  };
}

/**
 * Deposit deadline with silent-night grace: if the raw deadline falls between 22h and 9h
 * merchant-local, it's pushed to 9h next morning so the merchant doesn't have to confirm
 * at night. Capped at RDV - 4h.
 */
export function computeDepositDeadline(
  deadlineHours: number,
  rdvDateTime: Date,
  timezone: string,
): Date | null {
  const now = new Date();
  let deadline = new Date(now.getTime() + deadlineHours * 3600_000);

  const deadlineInTz = toZonedTime(deadline, timezone);
  const hourInTz = deadlineInTz.getHours();
  if (hourInTz >= 22 || hourInTz < 9) {
    const next9am = new Date(deadlineInTz);
    if (hourInTz >= 22) next9am.setDate(next9am.getDate() + 1);
    next9am.setHours(9, 0, 0, 0);
    deadline = fromZonedTime(next9am, timezone);
  }

  const rdvMinus4h = new Date(rdvDateTime.getTime() - 4 * 3600_000);
  if (rdvMinus4h.getTime() <= now.getTime()) return null;

  return new Date(Math.min(deadline.getTime(), rdvMinus4h.getTime()));
}

/** Délai laissé à la cliente pour régler l'acompte d'un RDV de suivi après le rappel J-7. */
export const FOLLOWUP_DEPOSIT_WINDOW_HOURS = 48;

/**
 * Deadline d'acompte pour un RDV de suivi (mig 177), posée au moment du rappel J-7.
 * La cliente a un délai fixe (`FOLLOWUP_DEPOSIT_WINDOW_HOURS`, 48h) après le rappel
 * pour régler : deadline = now + 48h. Cappée à RDV − 4h (RDV très proche) et plancher
 * `now` (jamais dans le passé). Indépendant du délai d'annulation du merchant — sinon
 * un délai court (ex: 1j) libérerait le créneau trop tard (impossible à re-remplir) et
 * un délai long (ex: 7j) ne laisserait aucun temps pour payer. Le cron deposit-expiration
 * libère ensuite le créneau si l'acompte n'est pas reçu.
 */
export function computeFollowupDepositDeadline(
  slotDate: string,
  startTime: string,
  timezone: string,
  now: Date = new Date(),
): Date {
  const rdv = fromZonedTime(new Date(`${slotDate}T${startTime}:00`), timezone);
  const window = new Date(now.getTime() + FOLLOWUP_DEPOSIT_WINDOW_HOURS * 3600_000);
  const cap = new Date(rdv.getTime() - 4 * 3600_000); // jamais moins de 4h avant
  let deadline = window.getTime() < cap.getTime() ? window : cap;
  if (deadline.getTime() < now.getTime()) deadline = now;
  return deadline;
}
