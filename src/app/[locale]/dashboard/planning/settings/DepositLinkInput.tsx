'use client';

import { Check, AlertTriangle } from 'lucide-react';
import { detectPaymentProvider, normalizePaymentLink, isValidPaymentLink } from '@/lib/payment-providers';

interface DepositLinkInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: boolean;
}

export function DepositLinkInput({ value, onChange, placeholder, error = false }: DepositLinkInputProps) {
  const normalized = normalizePaymentLink(value);
  const detected = normalized ? detectPaymentProvider(normalized) : null;
  const looksInvalid = !!normalized && !isValidPaymentLink(value);
  return (
    <div>
      <div className="relative">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${detected ? 'pr-28' : ''} px-3 py-2 sm:px-3.5 sm:py-2.5 text-base sm:text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors ${
            error ? 'border-red-300 bg-red-50/30'
              : looksInvalid ? 'border-amber-300 bg-amber-50/30'
              : 'border-gray-200'
          }`}
        />
        {detected && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            <Check className="w-2.5 h-2.5" />
            {detected}
          </span>
        )}
      </div>
      {looksInvalid && (
        <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-amber-700 leading-snug">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
          <span>Ça ne ressemble pas à un lien. Colle l&apos;URL complète depuis ton compte (ex&nbsp;: revolut.me/tonpseudo).</span>
        </p>
      )}
    </div>
  );
}
