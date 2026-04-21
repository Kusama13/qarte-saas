'use client';

import { memo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color: string;
}

const StatsCard = memo(function StatsCard({ title, value, icon: Icon, trend, color }: StatsCardProps) {
  const isNegative = typeof trend === 'string' && trend.trim().startsWith('-');
  const TrendIcon = isNegative ? TrendingDown : TrendingUp;
  const trendClasses = isNegative
    ? 'bg-red-50 text-red-600 border-red-100'
    : 'bg-emerald-50 text-emerald-600 border-emerald-100';
  return (
    <div className="h-full p-4 md:p-6 bg-white border border-gray-100 rounded-xl md:rounded-3xl shadow-sm transition-shadow hover:shadow-md flex flex-col gap-3 md:gap-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl shrink-0 shadow-md"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            boxShadow: `0 4px 12px ${color}33`,
          }}
        >
          <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" strokeWidth={2.5} />
        </div>
        <p className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight line-clamp-2 flex-1 min-w-0">{title}</p>
      </div>
      <div className="flex items-baseline justify-center flex-wrap gap-x-1.5 gap-y-0.5">
        <h3 className="text-2xl md:text-4xl font-bold text-slate-900 tracking-[-0.03em] tabular-nums leading-none">{value}</h3>
        {trend && (
          <div className={`flex items-center gap-0.5 px-1.5 py-0 rounded-full border flex-shrink-0 ${trendClasses}`}>
            <TrendIcon className="w-2.5 h-2.5 stroke-[3]" />
            <span className="text-[9px] md:text-[10px] font-bold">{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default StatsCard;
