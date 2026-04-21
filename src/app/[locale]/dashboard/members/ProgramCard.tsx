'use client';

import {
  Crown,
  Clock,
  Users,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import type { ProgramWithCount } from './types';
import { formatDuration } from './types';

export default function ProgramCard({
  program,
  onClick,
}: {
  program: ProgramWithCount;
  onClick: () => void;
}) {
  const t = useTranslations('members');
  const memberCount = program.member_cards?.[0]?.count || 0;

  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative overflow-hidden p-6 bg-white/70 rounded-2xl border border-indigo-100 shadow-md hover:shadow-2xl hover:shadow-indigo-200/30 hover:border-indigo-400 transition-all text-left w-full"
    >
      {/* Golden Shine & Glass Effects */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-400/10 rounded-full blur-3xl group-hover:bg-indigo-400/20 transition-colors duration-500" />

      {/* Decorative Particles */}
      <div className="absolute top-4 left-1/4 w-1 h-1 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="absolute bottom-6 right-1/3 w-1.5 h-1.5 bg-indigo-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

      <div className="relative flex items-center gap-5">
        <div className="relative shrink-0">
          {/* Prestigious Crown Badge */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center shadow-[0_8px_16px_-4px_rgba(79,70,229,0.5)] group-hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all duration-500">
            <Crown className="w-8 h-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
          </div>
          <div className="absolute -inset-1 border border-indigo-200/50 rounded-[1.25rem] scale-100 group-hover:scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h3 className="text-xl font-extrabold text-gray-900 tracking-tight group-hover:text-indigo-900 transition-colors">
              {program.name}
            </h3>
            <ChevronRight className="w-5 h-5 text-indigo-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {!!program.benefit_label && (
              <span className="inline-flex px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-widest">
                {program.benefit_label}
              </span>
            )}
            {!!program.discount_percent && (
              <span className="inline-flex px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold">
                -{program.discount_percent}%
              </span>
            )}
            {program.skip_deposit && (
              <span className="inline-flex px-2 py-0.5 rounded bg-violet-50 border border-violet-100 text-violet-700 text-[10px] font-bold uppercase tracking-widest">
                {t('skipDepositBadge')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-gray-500 group-hover:text-indigo-800 transition-colors">
              <div className="p-1 rounded bg-gray-50 group-hover:bg-indigo-50 transition-colors">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <span className="text-xs font-semibold">{memberCount} membre{memberCount > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 group-hover:text-indigo-800 transition-colors">
              <div className="p-1 rounded bg-gray-50 group-hover:bg-indigo-50 transition-colors">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <span className="text-xs font-semibold">{formatDuration(program.duration_months)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
