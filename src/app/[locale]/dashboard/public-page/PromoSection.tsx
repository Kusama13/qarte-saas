'use client';

import { useState, useEffect } from 'react';
import {
  Tag,
  Loader2,
  Check,
  GraduationCap,
} from 'lucide-react';
import { Input } from '@/components/ui';
import { getTodayForCountry } from '@/lib/utils';
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
  const [promoOfferId, setPromoOfferId] = useState<string | null>(null);
  const [studentEnabled, setStudentEnabled] = useState(merchant.student_offer_enabled || false);
  const [studentDescription, setStudentDescription] = useState(merchant.student_offer_description || '');

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await fetch(`/api/merchant-offers?merchantId=${merchant.id}`);
        const data = await res.json();
        if (res.ok && data.offers?.length > 0) {
          const offer = data.offers[0];
          setPromoOfferId(offer.id);
          setPromoTitle(offer.title);
          setPromoDescription(offer.description);
          setPromoExpiresAt(offer.expires_at ? offer.expires_at.split('T')[0] : '');
          const isExpired = offer.expires_at && new Date(offer.expires_at) < new Date();
          setPromoEnabled(offer.active && !isExpired);
        }
      } catch { /* silent */ }
    };
    fetchOffers();
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
