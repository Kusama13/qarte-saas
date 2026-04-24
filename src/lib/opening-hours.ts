import type { Merchant } from '@/types';

/**
 * Alias sur la forme canonique des horaires (cf. src/types/index.ts `Merchant.opening_hours`).
 * JSONB sur merchants, indexe par jour de la semaine (0-6 ou '1'-'7' selon l'ecriture)
 * avec {open, close} + breaks optionnels.
 */
export type OpeningHours = NonNullable<Merchant['opening_hours']>;

/**
 * True si au moins un jour de la semaine a des horaires `open` + `close` renseignes.
 * Utilise par le planning (mode libre) pour bloquer l'activation tant que le merchant
 * n'a pas rempli au moins 1 jour d'ouverture — sinon les slots proposables sont vides.
 */
export function hasValidOpeningHours(
  hours: Merchant['opening_hours'] | undefined,
): boolean {
  if (!hours || typeof hours !== 'object') return false;
  return Object.values(hours).some(
    (h) => !!h && typeof h === 'object' && 'open' in h && 'close' in h && !!h.open && !!h.close,
  );
}
