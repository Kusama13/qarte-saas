'use client';

import {
  Crown,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui';

interface EmptyStateProps {
  onCreateProgram: () => void;
}

export default function EmptyState({ onCreateProgram }: EmptyStateProps) {
  return (
    <div className="relative overflow-hidden text-center py-12 md:py-20 bg-gradient-to-b from-white to-amber-50/40 rounded-2xl md:rounded-[2rem] border border-amber-100/60 shadow-xl shadow-amber-900/5">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-50" />

      <div className="relative mx-auto mb-6 md:mb-10 group inline-block">
        <div className="absolute inset-0 bg-amber-400 opacity-20 blur-3xl rounded-full animate-pulse group-hover:opacity-30 transition-opacity" />
        <div className="relative w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-1 shadow-[0_10px_40px_-10px_rgba(245,158,11,0.5)] rotate-3 group-hover:rotate-0 transition-transform duration-700 ease-out">
          <div className="w-full h-full rounded-xl md:rounded-[1.75rem] bg-white flex items-center justify-center overflow-hidden">
            <Crown className="w-8 h-8 md:w-12 md:h-12 text-amber-500 drop-shadow-sm group-hover:scale-110 transition-transform duration-500" />
          </div>
        </div>
        <Sparkles className="absolute -top-2 -right-4 w-6 h-6 md:w-8 md:h-8 text-amber-400 animate-pulse" />
        <Sparkles className="absolute -bottom-2 -left-4 w-4 h-4 md:w-6 md:h-6 text-amber-300 opacity-60 animate-bounce" />
      </div>

      <div className="relative z-10 px-5 md:px-8">
        <h3 className="text-xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-3 tracking-tight">
          Inaugurez votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">Exp&eacute;rience Elite</span>
        </h3>
        <p className="text-gray-500 mb-6 md:mb-10 max-w-md mx-auto text-sm md:text-lg leading-relaxed">
          Transformez vos clients fid&egrave;les en membres privil&eacute;gi&eacute;s. Commencez par cr&eacute;er votre premier programme.
        </p>
        <Button
          onClick={onCreateProgram}
          className="relative h-12 px-6 md:h-14 md:px-10 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl md:rounded-2xl shadow-lg shadow-amber-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />
          <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform duration-500" />
          D&eacute;marrez maintenant
        </Button>
      </div>
    </div>
  );
}
