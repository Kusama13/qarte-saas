'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Clock, Pencil, X, Plus } from 'lucide-react';
import { formatCurrency, getCurrencySymbol, parsePriceEuros, CUSTOM_SERVICE_DEFAULT_NAME } from '@/lib/utils';
import { SERVICE_COLORS, colorBorderStyle } from './utils';
import type { CustomServiceDraft } from './usePlanningState';

type CustomFormState = { name: string; durationStr: string; priceStr: string; color: string };

interface CustomServicePickerProps {
  value: CustomServiceDraft | null;
  onChange: (next: CustomServiceDraft | null) => void;
  country?: string;
  locale: string;
  /** When true, adds top margin to the trigger button (when other prestations are above) */
  hasSiblings?: boolean;
}

export default function CustomServicePicker({ value, onChange, country, locale, hasSiblings = false }: CustomServicePickerProps) {
  const t = useTranslations('planning');
  const [form, setForm] = useState<CustomFormState | null>(null);

  const open = () => {
    if (value) {
      setForm({
        name: value.name,
        durationStr: String(value.duration),
        priceStr: value.price > 0 ? value.price.toFixed(2).replace('.', ',') : '',
        color: value.color,
      });
    } else {
      setForm({
        name: '',
        durationStr: '',
        priceStr: '',
        color: SERVICE_COLORS[Math.floor(Math.random() * SERVICE_COLORS.length)],
      });
    }
  };

  const close = () => setForm(null);

  const submit = () => {
    if (!form) return;
    const trimmedName = form.name.trim();
    if (!trimmedName) return;
    const duration = parseInt(form.durationStr, 10);
    if (!Number.isFinite(duration) || duration <= 0) return;
    onChange({
      name: trimmedName,
      duration,
      price: parsePriceEuros(form.priceStr),
      color: form.color,
    });
    setForm(null);
  };

  return (
    <>
      {value && (
        <div
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-700 text-[13px]"
          style={colorBorderStyle(value.color)}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center border bg-indigo-600 border-indigo-600">
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="font-medium truncate">
              {value.name?.trim() || CUSTOM_SERVICE_DEFAULT_NAME}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/60 text-indigo-700 border border-indigo-200 shrink-0">
              {t('customServiceBadge')}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 shrink-0 ml-2">
            {value.price > 0 && (
              <span className="text-indigo-700 font-medium">{formatCurrency(value.price, country, locale)}</span>
            )}
            <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{value.duration}</span>
            <button type="button" onClick={open} className="p-1 rounded hover:bg-indigo-100 transition-colors" aria-label={t('customServiceEdit')}>
              <Pencil className="w-3 h-3 text-indigo-600" />
            </button>
            <button type="button" onClick={() => onChange(null)} className="p-1 rounded hover:bg-red-100 transition-colors" aria-label={t('customServiceRemove')}>
              <X className="w-3 h-3 text-gray-400 hover:text-red-600" />
            </button>
          </div>
        </div>
      )}

      {form && (
        <div
          className="mt-2 p-3 rounded-lg border-2 border-dashed bg-white space-y-2"
          style={{ borderColor: form.color }}
        >
          <div className="text-[11px] font-semibold text-gray-700">
            {value ? t('customServiceEditTitle') : t('customServiceAddTitle')}
          </div>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => f ? { ...f, name: e.target.value } : f)}
            placeholder={t('customServiceNamePlaceholder')}
            maxLength={100}
            required
            className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 text-[13px] focus:outline-none focus:border-indigo-400"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-gray-500 mb-0.5 block">
                {t('customServiceDurationLabel')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={720}
                  step={5}
                  value={form.durationStr}
                  onChange={(e) => setForm((f) => f ? { ...f, durationStr: e.target.value } : f)}
                  placeholder="60"
                  className="w-full px-2.5 py-1.5 pr-8 rounded-md border border-gray-200 text-[13px] focus:outline-none focus:border-indigo-400"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">min</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-medium text-gray-500 mb-0.5 block">
                {t('customServicePriceLabel')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.priceStr}
                  onChange={(e) => setForm((f) => f ? { ...f, priceStr: e.target.value } : f)}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 pr-6 rounded-md border border-gray-200 text-[13px] focus:outline-none focus:border-indigo-400"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
                  {getCurrencySymbol(country)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={close}
              className="px-3 py-1.5 rounded-md text-[12px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!form.name.trim() || !form.durationStr || parseInt(form.durationStr, 10) <= 0}
              className="px-3 py-1.5 rounded-md text-[12px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {value ? t('customServiceUpdate') : t('customServiceConfirm')}
            </button>
          </div>
        </div>
      )}

      {!form && !value && (
        <button
          type="button"
          onClick={open}
          className={`w-full flex items-center justify-center gap-1.5 py-2 ${hasSiblings ? 'mt-2' : ''} rounded-lg border border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50 text-[12px] font-medium text-gray-600 hover:text-indigo-700 transition-colors`}
        >
          <Plus className="w-3.5 h-3.5" />
          {t('customServiceAddButton')}
        </button>
      )}
    </>
  );
}
