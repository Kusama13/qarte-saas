/**
 * Tokens partagés pour le modal de gestion client (`CustomerManagementModal` + tabs).
 * Une seule source de vérité pour les couleurs sémantiques afin d'éviter les
 * conflits où la même teinte porte 2-3 sens différents (ex: orange = ban + voucher utilisé + contraindication).
 *
 * Règle d'usage : utiliser `ROLES[role]` partout dans le scope du modal.
 * Ne pas hard-coder bg-emerald-50 / text-amber-700 / etc. dans les composants.
 */

export type Role = 'primary' | 'success' | 'premium' | 'warning' | 'danger' | 'neutral' | 'birthday';

export interface RoleStyle {
  /** text-{color}-700 — pour le texte principal */
  text: string;
  /** bg-{color}-50 — fond léger (cards, pills) */
  bg: string;
  /** bg-{color}-100 — fond plus saturé (icon container) */
  bgSolid: string;
  /** border-{color}-200 — bordure des cards */
  border: string;
  /** bg-{color}-600 hover:bg-{color}-700 — boutons solides primaires */
  solid: string;
  /** bg-{color}-500 — barres d'accent verticales sur headers de section */
  bar: string;
  /** text-{color}-600 — icônes */
  icon: string;
  /** hover:bg-{color}-50 — hover léger (full literal, Tailwind JIT compatible) */
  hoverBg: string;
  /** hover:bg-{color}-100 — hover plus saturé */
  hoverBgSolid: string;
  /** hover:text-{color}-600 — hover sur icône */
  hoverIcon: string;
}

export const ROLES: Record<Role, RoleStyle> = {
  // CTAs principaux, header, edit, "passages" (visit), preference (Journal), welcome offer, promo offer
  primary: {
    text: 'text-indigo-700',
    bg: 'bg-indigo-50',
    bgSolid: 'bg-indigo-100',
    border: 'border-indigo-200',
    solid: 'bg-indigo-600 hover:bg-indigo-700',
    bar: 'bg-indigo-500',
    icon: 'text-indigo-600',
    hoverBg: 'hover:bg-indigo-50',
    hoverBgSolid: 'hover:bg-indigo-100',
    hoverIcon: 'hover:text-indigo-600',
  },
  // Vouchers actifs, redemption tier1, points gagnés, validation
  success: {
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    bgSolid: 'bg-emerald-100',
    border: 'border-emerald-200',
    solid: 'bg-emerald-600 hover:bg-emerald-700',
    bar: 'bg-emerald-500',
    icon: 'text-emerald-600',
    hoverBg: 'hover:bg-emerald-50',
    hoverBgSolid: 'hover:bg-emerald-100',
    hoverIcon: 'hover:text-emerald-600',
  },
  // Tier 2 stamps + redemption + reward card. Réservé strictement à tier2 et formula (Journal).
  premium: {
    text: 'text-violet-700',
    bg: 'bg-violet-50',
    bgSolid: 'bg-violet-100',
    border: 'border-violet-200',
    solid: 'bg-violet-600 hover:bg-violet-700',
    bar: 'bg-violet-500',
    icon: 'text-violet-600',
    hoverBg: 'hover:bg-violet-50',
    hoverBgSolid: 'hover:bg-violet-100',
    hoverIcon: 'hover:text-violet-600',
  },
  // Annulation de récompense, ajustement manuel (action de modification réversible)
  warning: {
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    bgSolid: 'bg-amber-100',
    border: 'border-amber-200',
    solid: 'bg-amber-600 hover:bg-amber-700',
    bar: 'bg-amber-500',
    icon: 'text-amber-600',
    hoverBg: 'hover:bg-amber-50',
    hoverBgSolid: 'hover:bg-amber-100',
    hoverIcon: 'hover:text-amber-600',
  },
  // Allergies, contre-indications, delete, erreurs
  danger: {
    text: 'text-red-700',
    bg: 'bg-red-50',
    bgSolid: 'bg-red-100',
    border: 'border-red-200',
    solid: 'bg-red-600 hover:bg-red-700',
    bar: 'bg-red-500',
    icon: 'text-red-600',
    hoverBg: 'hover:bg-red-50',
    hoverBgSolid: 'hover:bg-red-100',
    hoverIcon: 'hover:text-red-600',
  },
  // Voucher déjà consommé, observation neutre, note general, bordures, texte secondaire
  neutral: {
    text: 'text-gray-700',
    bg: 'bg-gray-50',
    bgSolid: 'bg-gray-100',
    border: 'border-gray-200',
    solid: 'bg-gray-600 hover:bg-gray-700',
    bar: 'bg-gray-400',
    icon: 'text-gray-500',
    hoverBg: 'hover:bg-gray-50',
    hoverBgSolid: 'hover:bg-gray-100',
    hoverIcon: 'hover:text-gray-600',
  },
  // Single-purpose : anniversaire (header pill + birthday voucher)
  birthday: {
    text: 'text-pink-700',
    bg: 'bg-pink-50',
    bgSolid: 'bg-pink-100',
    border: 'border-pink-200',
    solid: 'bg-pink-600 hover:bg-pink-700',
    bar: 'bg-pink-500',
    icon: 'text-pink-600',
    hoverBg: 'hover:bg-pink-50',
    hoverBgSolid: 'hover:bg-pink-100',
    hoverIcon: 'hover:text-pink-600',
  },
};

/**
 * Header de section uniforme : barre verticale colorée + label uppercase + count optionnel.
 * Utilisé dans Rewards/History/Journal pour une hiérarchie visuelle cohérente entre tabs.
 */
export interface SectionHeaderProps {
  role: Role;
  label: string;
  count?: number | null;
}
