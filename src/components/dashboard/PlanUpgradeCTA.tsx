'use client';

import { Lock, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface PlanUpgradeCTAProps {
  title: string;
  description: string;
  cta?: string;
  className?: string;
}

/**
 * Empty-state shown to Fidélité-tier merchants when they hit a Tout-en-un feature.
 * Friendly, not punitive: explains the value, leads to /dashboard/subscription.
 */
export default function PlanUpgradeCTA({
  title,
  description,
  cta = 'Passer en Tout-en-un',
  className = '',
}: PlanUpgradeCTAProps) {
  return (
    <div className={`rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-8 md:p-12 text-center ${className}`}>
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200/50 mb-5">
        <Lock className="w-6 h-6 text-white" />
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 max-w-md mx-auto mb-6">{description}</p>
      <Link
        href="/dashboard/subscription"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
      >
        {cta}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
