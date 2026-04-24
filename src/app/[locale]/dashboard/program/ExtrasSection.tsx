'use client';

import {
  Star,
  Users,
  Flame,
  Cake,
  Gift,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui';
import { BIRTHDAY_SUGGESTIONS, DUO_OFFER_SUGGESTIONS, REFERRAL_SUGGESTIONS, type ProgramFormData } from './types';

interface ExtrasSectionProps {
  formData: ProgramFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProgramFormData>>;
}

export function ExtrasSection({ formData, setFormData }: ExtrasSectionProps) {
  const t = useTranslations('program');

  const DAYS = [
    { label: t('dayMon'), value: 1 },
    { label: t('dayTue'), value: 2 },
    { label: t('dayWed'), value: 3 },
    { label: t('dayThu'), value: 4 },
    { label: t('dayFri'), value: 5 },
    { label: t('daySat'), value: 6 },
    { label: t('daySun'), value: 0 },
  ];

  return (
    <>
      {/* ═══════ PARRAINAGE ═══════ */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-3 md:p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-start gap-2 md:gap-3 min-w-0 flex-1">
              <div className="shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Gift className="w-4 h-4 text-emerald-600" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm md:text-base font-bold text-slate-900">{t('referralTitle')}</h3>
                <p className="text-[11px] md:text-xs text-slate-400 mt-0.5">{t('referralDesc')}</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formData.referralEnabled}
              onClick={() => setFormData(prev => ({ ...prev, referralEnabled: !prev.referralEnabled }))}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 mt-1 ${
                formData.referralEnabled ? 'bg-emerald-500' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${formData.referralEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mb-3 ml-9 md:ml-12">{t('referralHint')}</p>
          {formData.referralEnabled && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">{t('referralReferred')}</label>
                <textarea
                  value={formData.referralRewardReferred}
                  onChange={(e) => setFormData(prev => ({ ...prev, referralRewardReferred: e.target.value }))}
                  placeholder={t('referralReferredPlaceholder')}
                  maxLength={200}
                  rows={1}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {REFERRAL_SUGGESTIONS.referred.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, referralRewardReferred: s }))}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
                        formData.referralRewardReferred === s
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">{t('referralReferrer')}</label>
                <textarea
                  value={formData.referralRewardReferrer}
                  onChange={(e) => setFormData(prev => ({ ...prev, referralRewardReferrer: e.target.value }))}
                  placeholder={t('referralReferrerPlaceholder')}
                  maxLength={200}
                  rows={1}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {REFERRAL_SUGGESTIONS.referrer.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, referralRewardReferrer: s }))}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
                        formData.referralRewardReferrer === s
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════ AVIS GOOGLE ═══════ */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-3 md:p-5">
          <div className="flex items-start gap-2 md:gap-3 mb-3">
            <div className="shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-600" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm md:text-base font-bold text-slate-900">{t('googleReviewTitle')}</h3>
              <p className="text-[11px] md:text-xs text-slate-400 mt-0.5">{t('googleReviewDesc')}</p>
            </div>
          </div>
          <Input
            type="url"
            className="bg-white border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 h-11 text-sm rounded-xl w-full"
            placeholder="https://g.page/r/votre-commerce/review"
            value={formData.reviewLink}
            onChange={(e) => setFormData(prev => ({ ...prev, reviewLink: e.target.value }))}
          />
        </div>
      </div>

      {/* ═══════ OFFRE DUO ═══════ */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-3 md:p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-2 md:gap-3 min-w-0 flex-1">
              <div className="shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                <Users className="w-4 h-4 text-violet-600" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm md:text-base font-bold text-slate-900">{t('duoOfferTitle')}</h3>
                <p className="text-[11px] md:text-xs text-slate-400 mt-0.5">{t('duoOfferDesc')}</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formData.duoOfferEnabled}
              onClick={() => setFormData(prev => ({ ...prev, duoOfferEnabled: !prev.duoOfferEnabled }))}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 mt-1 ${
                formData.duoOfferEnabled ? 'bg-violet-500' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${formData.duoOfferEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          {formData.duoOfferEnabled && (
            <div className="space-y-2">
              <textarea
                value={formData.duoOfferDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, duoOfferDescription: e.target.value }))}
                placeholder={t('duoOfferPlaceholder')}
                maxLength={200}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none"
              />
              <div className="flex flex-wrap gap-1.5">
                {DUO_OFFER_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, duoOfferDescription: suggestion }))}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
                      formData.duoOfferDescription === suggestion
                        ? 'bg-violet-100 border-violet-300 text-violet-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════ JOURS x2 (passage uniquement) ═══════ */}
      {formData.loyaltyMode !== 'cagnotte' && (
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-3 md:p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-2 md:gap-3 min-w-0 flex-1">
              <div className="shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <Flame className="w-4 h-4 text-amber-600" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm md:text-base font-bold text-slate-900">{t('doubleDaysTitle')}</h3>
                <p className="text-[11px] md:text-xs text-slate-400 mt-0.5">{t('doubleDaysDesc')}</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formData.doubleDaysEnabled}
              onClick={() => setFormData(prev => ({ ...prev, doubleDaysEnabled: !prev.doubleDaysEnabled }))}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 mt-1 ${
                formData.doubleDaysEnabled ? 'bg-amber-400' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${formData.doubleDaysEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {(() => {
            const toggleDay = (day: number) => {
              const current = formData.doubleDaysOfWeek;
              const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
              setFormData(prev => ({ ...prev, doubleDaysOfWeek: updated }));
            };
            const selectedDays = DAYS.filter(d => formData.doubleDaysOfWeek.includes(d.value));
            return (
              <div className={`space-y-3 ${!formData.doubleDaysEnabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS.map(day => {
                    const active = formData.doubleDaysOfWeek.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
                          active
                            ? 'bg-amber-400 border-amber-400 text-white shadow-sm'
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
                {formData.doubleDaysEnabled && formData.doubleDaysOfWeek.length === 0 && (
                  <p className="text-xs text-amber-600 font-medium">{t('doubleDaysSelectAtLeast')}</p>
                )}
                {selectedDays.length > 0 && (
                  <p className="text-xs text-gray-500">
                    {t('doubleDaysSummary', { days: selectedDays.map(d => d.label).join(', ') })}
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      </div>
      )}

      {/* ═══════ CADEAU ANNIVERSAIRE ═══════ */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-3 md:p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-2 md:gap-3 min-w-0 flex-1">
              <div className="shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-lg bg-pink-50 flex items-center justify-center">
                <Cake className="w-4 h-4 text-pink-600" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm md:text-base font-bold text-slate-900">{t('birthdayTitle')}</h3>
                <p className="text-[11px] md:text-xs text-slate-400 mt-0.5">{t('birthdayDesc')}</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formData.birthdayGiftEnabled}
              onClick={() => setFormData(prev => ({ ...prev, birthdayGiftEnabled: !prev.birthdayGiftEnabled }))}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 mt-1 ${
                formData.birthdayGiftEnabled ? 'bg-pink-500' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${formData.birthdayGiftEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          {formData.birthdayGiftEnabled && (
            <div className="space-y-2">
              <textarea
                value={formData.birthdayGiftDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, birthdayGiftDescription: e.target.value }))}
                placeholder={t('birthdayPlaceholder')}
                maxLength={200}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 resize-none"
              />
              <div className="flex flex-wrap gap-1.5">
                {BIRTHDAY_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, birthdayGiftDescription: suggestion }))}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
                      formData.birthdayGiftDescription === suggestion
                        ? 'bg-pink-100 border-pink-300 text-pink-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-pink-50 hover:border-pink-200 hover:text-pink-600'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
