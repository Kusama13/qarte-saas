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
  gradient: string;
  btnGradient: string;
  sparkleColors: string[];
  ctaHref: string;
}> = {
  vitrine_live: {
    icon: Globe,
    gradient: 'from-indigo-500 to-violet-600',
    btnGradient: 'from-indigo-600 to-violet-600',
    sparkleColors: ['#6366F1', '#818CF8', '#C7D2FE', '#FFD700'],
    ctaHref: '/dashboard/public-page',
  },
  services_added: {
    icon: Scissors,
    gradient: 'from-cyan-500 to-teal-600',
    btnGradient: 'from-cyan-600 to-teal-600',
    sparkleColors: ['#06B6D4', '#22D3EE', '#CFFAFE', '#FFD700'],
    ctaHref: '/dashboard/public-page',
  },
  planning_active: {
    icon: CalendarDays,
    gradient: 'from-teal-500 to-emerald-600',
    btnGradient: 'from-teal-600 to-emerald-600',
    sparkleColors: ['#14B8A6', '#34D399', '#A7F3D0', '#FFD700'],
    ctaHref: '/dashboard/planning',
  },
  first_scan: {
    icon: Users,
    gradient: 'from-violet-500 to-purple-600',
    btnGradient: 'from-violet-600 to-purple-600',
    sparkleColors: ['#7C3AED', '#A78BFA', '#DDD6FE', '#FFD700'],
    ctaHref: '/dashboard/customers',
  },
  first_booking: {
    icon: Calendar,
    gradient: 'from-emerald-500 to-cyan-600',
    btnGradient: 'from-emerald-600 to-cyan-600',
    sparkleColors: ['#10B981', '#06B6D4', '#A7F3D0', '#FFD700'],
    ctaHref: '/dashboard/planning',
  },
  first_reward: {
    icon: Gift,
    gradient: 'from-amber-500 to-orange-600',
    btnGradient: 'from-amber-600 to-orange-600',
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
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-sm w-[90vw] p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon circle */}
        <div className={`mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg mb-5`}>
          <Icon className="w-7 h-7 text-white" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {t(`${type}.title`)}
        </h3>

        {/* Subtitle */}
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          {t(`${type}.subtitle`)}
        </p>

        {/* CTA */}
        <Link
          href={config.ctaHref}
          onClick={onClose}
          className={`inline-flex items-center justify-center w-full px-6 py-3 rounded-xl bg-gradient-to-r ${config.btnGradient} text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-shadow`}
        >
          {t(`${type}.cta`)}
        </Link>
      </motion.div>
    </div>
  );
}
