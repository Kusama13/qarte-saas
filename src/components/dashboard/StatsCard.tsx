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
    <div className="p-3 md:p-6 bg-white border border-gray-100 rounded-xl md:rounded-3xl shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2.5 md:items-start md:gap-3">
        <div
          className="flex items-center justify-center w-8 h-8 md:w-14 md:h-14 rounded-lg md:rounded-2xl shrink-0 md:order-2"
          style={{ background: `${color}14` }}
        >
          <Icon className="w-4 h-4 md:w-7 md:h-7" style={{ color }} />
        </div>
        <div className="flex flex-col min-w-0 flex-1 md:order-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider md:tracking-[0.2em] mb-0.5 md:mb-1.5 leading-tight line-clamp-2">{title}</p>
          <div className="flex items-baseline flex-wrap gap-x-1.5 gap-y-0.5">
            <h3 className="text-xl md:text-3xl font-bold text-slate-900 tracking-[-0.03em] tabular-nums leading-none">{value}</h3>
            {trend && (
              <div className={`flex items-center gap-0.5 px-1.5 py-0 rounded-full border flex-shrink-0 ${trendClasses}`}>
                <TrendIcon className="w-2.5 h-2.5 stroke-[3]" />
                <span className="text-[9px] md:text-[10px] font-black">{trend}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default StatsCard;
