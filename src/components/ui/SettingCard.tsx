'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type SettingCardTone = 'indigo' | 'emerald' | 'violet';

interface SettingCardProps {
  icon: LucideIcon;
  title: string;
  /** Accent de la carte — porté par la section qui la contient. */
  tone?: SettingCardTone;
  /** Slot droite de l'en-tête : Switch, badge de statut, bouton d'action. */
  headerRight?: ReactNode;
  /** Corps de la carte. Si absent/false, seul l'en-tête est rendu (cas carte toggle off). */
  children?: ReactNode;
  className?: string;
}

const TONE: Record<SettingCardTone, { strip: string; icon: string }> = {
  indigo: { strip: 'bg-indigo-50/50 border-indigo-100/60', icon: 'text-indigo-600' },
  emerald: { strip: 'bg-emerald-50/50 border-emerald-100/60', icon: 'text-emerald-600' },
  violet: { strip: 'bg-violet-50/50 border-violet-100/60', icon: 'text-violet-600' },
};

/**
 * Carte de réglage unifiée — pattern unique de la page Planning > Paramètres.
 * En-tête à bandeau teinté (icône + titre + slot droite), corps optionnel.
 * L'accent (`tone`) est porté par la section : chaque section a sa couleur.
 */
export function SettingCard({ icon: Icon, title, tone = 'indigo', headerRight, children, className }: SettingCardProps) {
  const hasBody = children != null && children !== false;
  const c = TONE[tone];
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden', className)}>
      <div className={cn('flex items-center gap-2.5 px-4 sm:px-5 py-3 border-b', c.strip)}>
        <Icon className={cn('w-4 h-4 shrink-0', c.icon)} />
        <h2 className="text-sm font-bold text-gray-800 min-w-0 truncate">{title}</h2>
        {headerRight != null && headerRight !== false && (
          <div className="ml-auto flex items-center gap-2 shrink-0">{headerRight}</div>
        )}
      </div>
      {hasBody && <div className="p-4 sm:p-5">{children}</div>}
    </div>
  );
}
