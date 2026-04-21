'use client';

import { Crown, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface EmptyStateProps {
  onCreateProgram: () => void;
}

export default function EmptyState({ onCreateProgram }: EmptyStateProps) {
  const t = useTranslations('members');

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-8 md:p-10 text-center">
      <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
        <Crown className="w-5 h-5 text-indigo-600" strokeWidth={2.25} />
      </div>

      <h3 className="text-base md:text-lg font-bold text-slate-900 mb-1.5 tracking-tight">
        {t('emptyTitle')}
      </h3>
      <p className="text-sm text-slate-500 mb-5 max-w-sm mx-auto leading-relaxed">
        {t('emptyDesc')}
      </p>

      <button
        type="button"
        onClick={onCreateProgram}
        className="inline-flex items-center justify-center gap-2 h-10 px-5 bg-[#4b0082] hover:bg-[#4b0082]/90 active:scale-[0.98] text-white font-bold text-sm rounded-xl transition-all touch-manipulation"
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        {t('emptyCta')}
      </button>
    </div>
  );
}
