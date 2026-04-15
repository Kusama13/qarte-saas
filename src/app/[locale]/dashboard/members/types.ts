import type { MemberProgram, Customer } from '@/types';

// ============================================
// Extended types for Members page
// ============================================

export interface ProgramWithCount extends MemberProgram {
  member_cards: { count: number }[];
}

export interface CustomerWithCard {
  id: string;
  customer_id: string;
  customer: Customer;
  current_stamps: number;
}

// ============================================
// Constants
// ============================================

export const DURATION_UNITS = [
  { value: 'day', label: 'Jour(s)', multiplier: 1/30 },
  { value: 'week', label: 'Semaine(s)', multiplier: 0.25 },
  { value: 'month', label: 'Mois', multiplier: 1 },
] as const;

export type DurationUnit = 'day' | 'week' | 'month';

export const PROGRAM_NAME_SUGGESTIONS = [
  'Fidèle',
  'VIP',
  'Premium',
];

export const BENEFIT_SUGGESTIONS = [
  '-10% sur les prestations',
  'Brushing offert',
  'Accès prioritaire',
];

// ============================================
// Utility functions
// ============================================

/** Convert decimal months to human-readable format */
export const formatDuration = (durationMonths: number): string => {
  const days = Math.round(durationMonths * 30);

  if (days < 7) {
    return `${days} jour${days > 1 ? 's' : ''}`;
  }

  if (days < 30 && days % 7 === 0) {
    const weeks = days / 7;
    return `${weeks} semaine${weeks > 1 ? 's' : ''}`;
  }

  if (days >= 30) {
    const months = Math.round(durationMonths);
    if (months === 0) {
      // Less than 1 month but >= 7 days, show days
      return `${days} jours`;
    }
    return `${months} mois`;
  }

  return `${days} jours`;
};

/** Calculate duration in months based on unit and number */
export const calculateDurationMonths = (unit: DurationUnit, number: number): number => {
  const unitConfig = DURATION_UNITS.find(u => u.value === unit);
  return number * (unitConfig?.multiplier || 1);
};
