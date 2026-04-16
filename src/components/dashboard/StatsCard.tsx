'use client';

import { memo } from 'react';
import { TrendingUp } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color: string;
}

const StatsCard = memo(function StatsCard({ title, value, icon: Icon, trend, color }: StatsCardProps) {
  return (
    <div className="group relative p-4 md:p-6 bg-white/70 backdrop-blur-2xl border border-white/50 rounded-2xl md:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(79,70,229,0.1)] hover:-translate-y-1.5 overflow-hidden">
      {/* Premium Gradient Border Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-[10px] font-black text-slate-400/80 uppercase tracking-[0.2em] mb-1 truncate">{title}</p>
          <div className="flex items-baseline gap-2 min-w-0">
            <h3 className="text-xl md:text-3xl font-bold text-slate-900 tracking-[-0.03em] tabular-nums truncate">{value}</h3>
            {trend && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50/80 text-emerald-600 border border-emerald-100/50 shadow-sm flex-shrink-0">
                <TrendingUp className="w-3 h-3 stroke-[3]" />
                <span className="text-[10px] font-black">{trend}</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative group/icon flex-shrink-0">
          <div
            className="absolute inset-0 rounded-2xl blur-xl opacity-20 group-hover/icon:opacity-40 transition-all duration-500 scale-75 group-hover/icon:scale-110"
            style={{ backgroundColor: color }}
          />
          <div
            className="relative flex items-center justify-center w-11 h-11 md:w-14 md:h-14 rounded-2xl transition-all duration-500 ease-out border border-white/50 shadow-inner group-hover:shadow-lg"
            style={{
              background: `linear-gradient(145deg, ${color}10, ${color}25)`
            }}
          >
            <Icon
              className="w-5 h-5 md:w-7 md:h-7 transition-all duration-500 ease-out group-hover:-rotate-12 group-hover:scale-110"
              style={{ color }}
            />
            {/* Animated Highlight */}
            <div className="absolute top-0 left-0 w-full h-full rounded-2xl overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default StatsCard;
