'use client';

import { useEffect, useState, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Gift, ArrowRight } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

interface Props {
  merchantId: string;
  giftCardEnabled: boolean;
}

/**
 * Widget compact sur le dashboard accueil quand >= 1 bon cadeau en
 * pending_payment. Pousse le merchant à valider rapidement (sinon l'offreur
 * s'inquiète). Auto-cancel cron prend le relais après 3j.
 */
export default function PendingGiftCardsWidget({ merchantId, giftCardEnabled }: Props) {
  const t = useTranslations('giftCards');
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    if (!giftCardEnabled) {
      setLoading(false);
      return;
    }
    const supabase = getSupabase();
    const { count: c } = await supabase
      .from('gift_cards')
      .select('id', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .eq('status', 'pending_payment');
    setCount(c || 0);
    setLoading(false);
  }, [merchantId, giftCardEnabled]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  if (loading || !giftCardEnabled || count === 0) return null;

  return (
    <Link
      href="/dashboard/gift-cards"
      className="group block rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 via-fuchsia-50 to-violet-50 p-4 sm:p-5 hover:shadow-md transition-all touch-manipulation"
    >
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 via-fuchsia-500 to-violet-600 flex items-center justify-center shadow-md shadow-fuchsia-500/30 shrink-0">
          <Gift className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-fuchsia-900 leading-tight">
            {t('widgetTitle')}
          </p>
          <p className="text-xs text-fuchsia-700 mt-0.5">
            {count === 1 ? t('widgetSingular') : t('widgetPlural', { count })}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-fuchsia-700 group-hover:text-fuchsia-900 transition-colors">
          {t('widgetCta')}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
