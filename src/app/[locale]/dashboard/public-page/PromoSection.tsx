'use client';

import { useState, useEffect } from 'react';
import {
  Tag,
  Loader2,
  Check,
} from 'lucide-react';
import { Input } from '@/components/ui';
import { getTodayInParis } from '@/lib/utils';
import { useDashboardSave } from '@/hooks/useDashboardSave';
import type { Merchant } from '@/types';
import type { WelcomeSectionHandle } from './WelcomeSection';

interface PromoSectionProps {
  merchant: Merchant;
  welcomeRef?: React.RefObject<WelcomeSectionHandle | null>;
}

export default function PromoSection({ merchant, welcomeRef }: PromoSectionProps) {
  const { saving, saved, save } = useDashboardSave();
  const [promoEnabled, setPromoEnabled] = useState(false);
  const [promoTitle, setPromoTitle] = useState('');
  const [promoDescription, setPromoDescription] = useState('');
  const [promoExpiresAt, setPromoExpiresAt] = useState('');
  const [promoOfferId, setPromoOfferId] = useState<string | null>(null);

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

      if (promoEnabled && (!promoTitle.trim() || !promoDescription.trim())) throw new Error('Titre et description requis');

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
          <span className="text-sm font-semibold text-gray-700">Offre promotionnelle</span>
          {promoExpiresAt && new Date(promoExpiresAt) < new Date(getTodayInParis()) && (
            <span className="text-[11px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Expir&eacute;e</span>
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
              Titre de l&apos;offre <span className="text-red-400">*</span>
            </label>
            <Input
              placeholder="Ex: Offre de printemps"
              value={promoTitle}
              onChange={(e) => setPromoTitle(e.target.value)}
              className="h-10 text-sm"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['Offre de printemps', 'Offre sp\u00e9ciale', 'Offre du moment', 'Black Friday', 'Offre de rentr\u00e9e'].map((s) => (
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
              Description de l&apos;offre <span className="text-red-400">*</span>
            </label>
            <Input
              placeholder="Ex: -20% sur les balayages, Un soin offert..."
              value={promoDescription}
              onChange={(e) => setPromoDescription(e.target.value)}
              className="h-10 text-sm"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['-10% sur toutes les prestations', '-20% sur un service', 'Un soin offert'].map((s) => (
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
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Date d&apos;expiration (optionnel)</label>
            <Input
              type="date"
              value={promoExpiresAt}
              onChange={(e) => setPromoExpiresAt(e.target.value)}
              className="h-10 text-sm"
              min={getTodayInParis()}
            />
          </div>
        </div>
      )}

      {/* ── Save button for Acquisition section ── */}
      <div className="mt-5 pt-5 border-t border-gray-100">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            saved
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
          }`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
          {saving ? 'Sauvegarde...' : saved ? 'Sauvegard\u00e9' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
