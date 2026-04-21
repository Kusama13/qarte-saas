'use client';

import { useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Globe, Scissors, CalendarDays, Users, Calendar, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { sparkleGrand } from '@/lib/sparkles';

export type MilestoneType =
  | 'vitrine_live' | 'services_added' | 'planning_active'
  | 'first_scan' | 'first_booking' | 'first_reward';

interface MilestoneModalProps {
  type: MilestoneType;
  onClose: () => void;
}

const MILESTONE_CONFIG: Record<MilestoneType, {
  icon: React.ElementType;
  iconBg: string;
  iconText: string;
  sparkleColors: string[];
  ctaHref: string;
}> = {
  vitrine_live: {
    icon: Globe,
    iconBg: 'bg-indigo-50',
    iconText: 'text-indigo-600',
    sparkleColors: ['#6366F1', '#818CF8', '#C7D2FE', '#FFD700'],
    ctaHref: '/dashboard/public-page',
  },
  services_added: {
    icon: Scissors,
    iconBg: 'bg-cyan-50',
    iconText: 'text-cyan-600',
    sparkleColors: ['#06B6D4', '#22D3EE', '#CFFAFE', '#FFD700'],
    ctaHref: '/dashboard/public-page',
  },
  planning_active: {
    icon: CalendarDays,
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    sparkleColors: ['#14B8A6', '#34D399', '#A7F3D0', '#FFD700'],
    ctaHref: '/dashboard/planning',
  },
  first_scan: {
    icon: Users,
    iconBg: 'bg-violet-50',
    iconText: 'text-violet-600',
    sparkleColors: ['#7C3AED', '#A78BFA', '#DDD6FE', '#FFD700'],
    ctaHref: '/dashboard/customers',
  },
  first_booking: {
    icon: Calendar,
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    sparkleColors: ['#10B981', '#06B6D4', '#A7F3D0', '#FFD700'],
    ctaHref: '/dashboard/planning',
  },
  first_reward: {
    icon: Gift,
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
    sparkleColors: ['#F59E0B', '#FB923C', '#FDE68A', '#FFD700'],
    ctaHref: '/dashboard/customers',
  },
};

export default function MilestoneModal({ type, onClose }: MilestoneModalProps) {
  const t = useTranslations('milestones');
  const config = MILESTONE_CONFIG[type];
  const Icon = config.icon;

  useEffect(() => {
    sparkleGrand(config.sparkleColors);
  }, [config.sparkleColors]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 max-w-sm w-[90vw] p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`mx-auto w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center mb-4`}>
          <Icon className={`w-5 h-5 ${config.iconText}`} strokeWidth={2.25} />
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-1.5">
          {t(`${type}.title`)}
        </h3>

        <p className="text-sm text-slate-500 mb-5 leading-relaxed">
          {t(`${type}.subtitle`)}
        </p>

        <Link
          href={config.ctaHref}
          onClick={onClose}
          className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-[#4b0082] hover:bg-[#4b0082]/90 active:scale-[0.98] text-white font-bold text-sm transition-all touch-manipulation"
        >
          {t(`${type}.cta`)}
        </Link>
      </motion.div>
    </div>
  );
}
