import { AlertTriangle, Beaker, Heart, Eye, StickyNote, Ban } from 'lucide-react';
import { ROLES, type Role } from '@/lib/customer-modal-styles';

/**
 * Style appliqué à chaque type de note customer (Journal).
 * Mappe `note_type` → rôle du modal pour cohérence sémantique cross-tabs.
 *
 * Choix sémantiques :
 * - allergy + contraindication = danger (risque médical, code rouge)
 * - preference = primary (le souhait du client guide l'action merchant)
 * - formula = premium (formule = recette VIP, valeur métier élevée)
 * - observation + general = neutral (information passive)
 */
const NOTE_TYPE_TO_ROLE: Record<string, Role> = {
  allergy: 'danger',
  contraindication: 'danger',
  preference: 'primary',
  formula: 'premium',
  observation: 'neutral',
  general: 'neutral',
};

const NOTE_TYPE_TO_ICON: Record<string, typeof AlertTriangle> = {
  allergy: AlertTriangle,
  contraindication: Ban,
  preference: Heart,
  formula: Beaker,
  observation: Eye,
  general: StickyNote,
};

interface NoteStyle {
  /** Texte principal (titre du type, label) */
  color: string;
  /** Fond + bordure d'une card de note pinned */
  bgColor: string;
  /** Fond d'une pill de type sélectionnée */
  pillBg: string;
  /** Texte d'une pill de type sélectionnée */
  pillText: string;
  /** Icône du type */
  icon: typeof AlertTriangle;
}

export function getTypeStyle(noteType: string): NoteStyle {
  const role: Role = NOTE_TYPE_TO_ROLE[noteType] ?? 'neutral';
  const r = ROLES[role];
  return {
    color: r.text,
    bgColor: `${r.bg} ${r.border}`,
    pillBg: r.bgSolid,
    pillText: r.text,
    icon: NOTE_TYPE_TO_ICON[noteType] ?? StickyNote,
  };
}
