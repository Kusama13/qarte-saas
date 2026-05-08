'use client';

import { useState, useEffect } from 'react';
import {
  Tag,
  Loader2,
  Check,
  GraduationCap,
  ChevronDown,
} from 'lucide-react';
import { Input } from '@/components/ui';
import { getTodayForCountry } from '@/lib/utils';
import { parseDiscountPercent } from '@/lib/booking-pricing';
import { useDashboardSave } from '@/hooks/useDashboardSave';
import { useTranslations } from 'next-intl';
import type { Merchant } from '@/types';
import type { WelcomeSectionHandle } from './WelcomeSection';

interface PromoSectionProps {
  merchant: Merchant;
  welcomeRef?: React.RefObject<WelcomeSectionHandle | null>;
}

export default function PromoSection({ merchant, welcomeRef }: PromoSectionProps) {
  const t = useTranslations('publicPage');
  const { saving, saved, save } = useDashboardSave();
  const [promoEnabled, setPromoEnabled] = useState(false);
  const [promoTitle, setPromoTitle] = useState('');
  const [promoDescription, setPromoDescription] = useState('');
  const [promoExpiresAt, setPromoExpiresAt] = useState('');
  const [promoDiscountPercent, setPromoDiscountPercent] = useState<string>('');
  const [promoOfferId, setPromoOfferId] = useState<string | null>(null);
  const [promoTargetServiceIds, setPromoTargetServiceIds] = useState<string[]>([]);
  const [services, setServices] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [targetPickerOpen, setTargetPickerOpen] = useState(false);
  const [studentEnabled, setStudentEnabled] = useState(merchant.student_offer_enabled || false);
  const [studentDescription, setStudentDescription] = useState(merchant.student_offer_description || '');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [offersRes, svcRes] = await Promise.all([
          fetch(`/api/merchant-offers?merchantId=${merchant.id}`),
          fetch(`/api/services?merchantId=${merchant.id}`),
        ]);
        const offersData = await offersRes.json();
        if (offersRes.ok && offersData.offers?.length > 0) {
          const offer = offersData.offers[0];
          setPromoOfferId(offer.id);
          setPromoTitle(offer.title);
          setPromoDescription(offer.description);
          setPromoExpiresAt(offer.expires_at ? offer.expires_at.split('T')[0] : '');
          setPromoDiscountPercent(offer.discount_percent != null ? String(offer.discount_percent) : '');
          setPromoTargetServiceIds(Array.isArray(offer.target_service_ids) ? offer.target_service_ids : []);
          const isExpired = offer.expires_at && new Date(offer.expires_at) < new Date();
          setPromoEnabled(offer.active && !isExpired);
        }
        if (svcRes.ok) {
          const svcData = await svcRes.json();
          if (Array.isArray(svcData.services)) {
            setServices(svcData.services.map((s: { id: string; name: string; price: number | string }) => ({
              id: s.id,
              name: s.name,
              price: Number(s.price || 0),
            })));
          }
        }
      } catch { /* silent */ }
    };
    fetchData();
  }, [merchant]);

  const handleSave = () => {
    save(async () => {
      // Save welcome section first
      await welcomeRef?.current?.save();

      // Save student offer
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase();
      await supabase.from('merchants').update({
        student_offer_enabled: studentEnabled,
        student_offer_description: studentEnabled && studentDescription.trim() ? studentDescription.trim() : null,
      }).eq('id', merchant.id);

      if (promoEnabled && (!promoTitle.trim() || !promoDescription.trim())) throw new Error(t('promoFieldsRequired'));

      // Validation du % côté client (entier 1-100, vide accepté = pas de réduction calculée)
      let normalizedDiscount: number | null;
      try {
        normalizedDiscount = parseDiscountPercent(promoDiscountPercent.trim());
      } catch {
        throw new Error(t('promoDiscountInvalid'));
      }

      // Promo ciblée : si % vide on ne stocke pas de cible (sans réduction
      // calculée la cible n'a aucun effet → évite la confusion UX).
      // Si tous les services sont sélectionnés → on envoie null (= toutes prestations).
      const targetsPayload = (normalizedDiscount && promoTargetServiceIds.length > 0 && promoTargetServiceIds.length < services.length)
        ? promoTargetServiceIds
        : null;

      if (promoEnabled) {
        if (promoOfferId) {
          await fetch('/api/merchant-offers', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              offerId: promoOfferId,
              merchantId: merchant.id,
              active: true,
              title: promoTitle.trim(),
              description: promoDescription.trim(),
              expires_at: promoExpiresAt || null,
              discountPercent: normalizedDiscount,
              targetServiceIds: targetsPayload,
            }),
          });
        } else {
          const res = await fetch('/api/merchant-offers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              merchantId: merchant.id,
              title: promoTitle.trim(),
              description: promoDescription.trim(),
              expiresAt: promoExpiresAt || null,
              discountPercent: normalizedDiscount,
              targetServiceIds: targetsPayload,
            }),
          });
          const data = await res.json();
          if (res.ok && data.offer) {
            setPromoOfferId(data.offer.id);
          }
        }
      } else if (promoOfferId) {
        await fetch('/api/merchant-offers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offerId: promoOfferId, merchantId: merchant.id, active: false }),
        });
      }
    });
  };

  return (
    <div className="pt-5 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-gray-700">{t('promoOfferLabel')}</span>
          {promoExpiresAt && new Date(promoExpiresAt) < new Date(getTodayForCountry(merchant.country)) && (
            <span className="text-[11px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{t('promoExpired')}</span>
          )}
        </div>
        <button
          role="switch"
          aria-checked={promoEnabled}
          onClick={() => setPromoEnabled(!promoEnabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
            promoEnabled ? 'bg-amber-500' : 'bg-gray-200'
          }`}
        >
          <span className={`pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${promoEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      {promoEnabled && (
        <div className="space-y-3 mt-3">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
              {t('promoTitleLabel')} <span className="text-red-400">*</span>
            </label>
            <Input
              placeholder={t('promoTitlePlaceholder')}
              value={promoTitle}
              onChange={(e) => setPromoTitle(e.target.value)}
              className="h-10 text-sm"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[t('promoSugg1'), t('promoSugg2'), t('promoSugg3'), 'Black Friday', t('promoSugg5')].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPromoTitle(s)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
              {t('promoDiscountLabel')} <span className="text-[11px] font-normal text-gray-500">{t('promoDiscountOptional')}</span>
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={100}
                step={1}
                placeholder="10"
                value={promoDiscountPercent}
                onChange={(e) => setPromoDiscountPercent(e.target.value.replace(/[^\d]/g, ''))}
                className="h-10 text-sm w-20 text-center"
              />
              <span className="text-sm font-semibold text-gray-700">%</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">{t('promoDiscountHelp')}</p>
            {!!merchant.auto_booking_enabled && !promoDiscountPercent.trim() && (
              <p className="text-[11px] text-amber-700 mt-1.5 leading-snug font-medium">
                {t('promoDiscountMissingWarn')}
              </p>
            )}
          </div>

          {/* Multi-select prestations ciblées (mig 157). Visible uniquement si % > 0
              car sans réduction calculée, cibler n'a aucun effet visible. */}
          {promoDiscountPercent && services.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                {t('promoTargetLabel')}
              </label>
              <button
                type="button"
                onClick={() => setTargetPickerOpen(!targetPickerOpen)}
                className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm hover:border-amber-300 transition-colors"
              >
                <span className="truncate text-gray-700">
                  {promoTargetServiceIds.length === 0 || promoTargetServiceIds.length === services.length
                    ? t('promoTargetAll')
                    : t('promoTargetCount', { count: promoTargetServiceIds.length })}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${targetPickerOpen ? 'rotate-180' : ''}`} />
              </button>
              {targetPickerOpen && (
                <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 space-y-1">
                  <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-amber-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={promoTargetServiceIds.length === 0 || promoTargetServiceIds.length === services.length}
                      onChange={(e) => setPromoTargetServiceIds(e.target.checked ? [] : services.map((s) => s.id))}
                      className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">{t('promoTargetAll')}</span>
                  </label>
                  <div className="border-t border-gray-100 my-1" />
                  {services.map((s) => {
                    const all = promoTargetServiceIds.length === 0;
                    const checked = all || promoTargetServiceIds.includes(s.id);
                    return (
                      <label key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-amber-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const baseline = all ? services.map((x) => x.id) : promoTargetServiceIds;
                            const next = e.target.checked
                              ? Array.from(new Set([...baseline, s.id]))
                              : baseline.filter((id) => id !== s.id);
                            setPromoTargetServiceIds(next);
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700 flex-1 truncate">{s.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">{t('promoTargetHelp')}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
              {t('promoDescLabel')} <span className="text-red-400">*</span>
            </label>
            <Input
              placeholder={t('promoDescPlaceholder')}
              value={promoDescription}
              onChange={(e) => setPromoDescription(e.target.value)}
              className="h-10 text-sm"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[t('promoDescSugg1'), t('promoDescSugg2'), t('promoDescSugg3')].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPromoDescription(s)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{t('promoExpiryLabel')}</label>
            <Input
              type="date"
              value={promoExpiresAt}
              onChange={(e) => setPromoExpiresAt(e.target.value)}
              className="h-10 text-sm"
              min={getTodayForCountry(merchant.country)}
            />
          </div>
        </div>
      )}

      {/* ── Student offer ── */}
      <div className="pt-5 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-gray-700">{t('studentOfferLabel')}</span>
          </div>
          <button
            role="switch"
            aria-checked={studentEnabled}
            onClick={() => setStudentEnabled(!studentEnabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
              studentEnabled ? 'bg-blue-500' : 'bg-gray-200'
            }`}
          >
            <span className={`pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${studentEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {studentEnabled && (
          <div className="space-y-3 mt-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                {t('studentOfferDescLabel')}
              </label>
              <Input
                placeholder={t('studentOfferPlaceholder')}
                value={studentDescription}
                onChange={(e) => setStudentDescription(e.target.value)}
                className="h-10 text-sm"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[t('studentSugg1'), t('studentSugg2'), t('studentSugg3')].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStudentDescription(s)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-gray-400">{t('studentOfferHint')}</p>
          </div>
        )}
      </div>

      {/* ── Save button for Acquisition section ── */}
      <div className="mt-5 pt-5 border-t border-gray-100">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-2.5 rounded-xl text-sm font-bold active:scale-[0.98] touch-manipulation transition-all flex items-center justify-center gap-2 ${
            saved
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : 'bg-[#4b0082] text-white hover:bg-[#4b0082]/90'
          }`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
          {saving ? t('infoSaving') : saved ? t('infoSaved') : t('infoSave')}
        </button>
      </div>
    </div>
  );
}
