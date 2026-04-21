'use client';

import { MessageSquare } from 'lucide-react';

type Tint = 'indigo' | 'emerald' | 'violet' | 'red' | 'slate';

const TINT: Record<Tint, { bg: string; border: string; iconBg: string; iconText: string; labelText: string; knob: string }> = {
  indigo: {
    bg: 'bg-indigo-50', border: 'border-indigo-200', iconBg: 'bg-indigo-100',
    iconText: 'text-indigo-600', labelText: 'text-indigo-700', knob: 'bg-indigo-600',
  },
  emerald: {
    bg: 'bg-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600', labelText: 'text-emerald-700', knob: 'bg-emerald-600',
  },
  violet: {
    bg: 'bg-violet-50', border: 'border-violet-200', iconBg: 'bg-violet-100',
    iconText: 'text-violet-600', labelText: 'text-violet-700', knob: 'bg-violet-600',
  },
  red: {
    bg: 'bg-red-50', border: 'border-red-200', iconBg: 'bg-red-100',
    iconText: 'text-red-600', labelText: 'text-red-700', knob: 'bg-red-600',
  },
  slate: {
    bg: 'bg-slate-50', border: 'border-slate-200', iconBg: 'bg-slate-100',
    iconText: 'text-slate-600', labelText: 'text-slate-700', knob: 'bg-slate-900',
  },
};

interface SmsToggleProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
  hint?: string;
  isPaid: boolean;
  proLabel: string;
  tint?: Tint;
}

export default function SmsToggle({ checked, onToggle, label, hint, isPaid, proLabel, tint = 'slate' }: SmsToggleProps) {
  const c = TINT[tint];
  return (
    <button
      type="button"
      onClick={() => isPaid && onToggle()}
      aria-pressed={checked}
      disabled={!isPaid}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all touch-manipulation ${
        !isPaid
          ? 'border-slate-100 bg-slate-50 cursor-not-allowed'
          : checked
            ? `${c.border} ${c.bg} active:scale-[0.99]`
            : 'border-slate-200 bg-white hover:border-slate-300 active:scale-[0.99]'
      }`}
    >
      <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${checked ? c.iconBg : 'bg-slate-100'}`}>
        <MessageSquare className={`w-3.5 h-3.5 ${checked ? c.iconText : 'text-slate-400'}`} strokeWidth={2.25} />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className={`text-xs font-semibold ${checked ? c.labelText : 'text-slate-700'}`}>{label}</p>
        {!isPaid && hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
      </div>
      {isPaid ? (
        <div className={`shrink-0 w-9 h-5 rounded-full transition-colors relative ${checked ? c.knob : 'bg-slate-300'}`}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </div>
      ) : (
        <span className="shrink-0 text-[9px] font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-md uppercase tracking-wide">{proLabel}</span>
      )}
    </button>
  );
}
