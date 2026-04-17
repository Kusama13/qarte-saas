import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export function computeDepositAmount(
  totalPrice: number,
  depositFixed?: number | null,
  depositPercent?: number | null,
): number | null {
  if (depositFixed) return Math.min(depositFixed, totalPrice);
  if (depositPercent) return Math.min(Math.round(totalPrice * depositPercent / 100), totalPrice);
  return null;
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
