'use client';

import { useEffect, useState, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Wallet, Clock, ArrowRight, Check, X, Loader2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { computeDepositAmount } from '@/lib/deposit';
import { formatCurrency, getTodayForCountry, unwrapJoin } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import type { MerchantCountry } from '@/types';

interface PendingDeposit {
  id: string;
  client_name: string;
  slot_date: string;
  start_time: string;
  totalPrice: number;
  depositAmount: number | null;
}

interface Props {
  merchantId: string;
  country: MerchantCountry | null;
  depositFixed?: number | null;
  depositPercent?: number | null;
  planningEnabled: boolean;
}

const MAX_PREVIEW = 3;

export default function PendingDepositsWidget({ merchantId, country, depositFixed, depositPercent, planningEnabled }: Props) {
  const t = useTranslations('pendingDeposits');
  const locale = useLocale();
  const { addToast } = useToast();
  const [items, setItems] = useState<PendingDeposit[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmReject, setConfirmReject] = useState<PendingDeposit | null>(null);

  const fetchPending = useCallback(async () => {
    if (!planningEnabled) {
      setLoading(false);
      return;
    }
    const supabase = getSupabase();
    const todayStr = getTodayForCountry(country ?? undefined);
    const { data, count } = await supabase
      .from('merchant_planning_slots')
      .select(
        'id, slot_date, start_time, client_name, planning_slot_services(service:merchant_services!service_id(price))',
        { count: 'exact' }
      )
      .eq('merchant_id', merchantId)
      .eq('deposit_confirmed', false)
      .not('client_name', 'is', null)
      .neq('client_name', '__blocked__')
      .is('primary_slot_id', null)
      .gte('slot_date', todayStr)
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(MAX_PREVIEW);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped = (data || []).map((b: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalPrice = (b.planning_slot_services || []).reduce((sum: number, ps: any) => {
        const s = unwrapJoin(ps.service);
        return sum + (s?.price ? Number(s.price) : 0);
      }, 0);
      return {
        id: b.id,
        client_name: b.client_name,
        slot_date: b.slot_date,
        start_time: b.start_time,
        totalPrice,
        depositAmount: computeDepositAmount(totalPrice, depositFixed, depositPercent),
      };
    });

    setItems(mapped);
    setTotalCount(count || 0);
    setLoading(false);
  }, [merchantId, country, depositFixed, depositPercent, planningEnabled]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleAccept = async (item: PendingDeposit) => {
    setBusyId(item.id);
    try {
      const res = await fetch('/api/planning', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: item.id,
          merchantId,
          client_name: item.client_name,
          deposit_confirmed: true,
        }),
      });
      if (!res.ok) throw new Error('fail');
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setTotalCount((n) => Math.max(0, n - 1));
      addToast(t('toastAccepted'), 'success');
    } catch {
      addToast(t('errorAction'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (item: PendingDeposit) => {
    setBusyId(item.id);
    try {
      const res = await fetch('/api/planning', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, slotIds: [item.id] }),
      });
      if (!res.ok) throw new Error('fail');
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setTotalCount((n) => Math.max(0, n - 1));
      addToast(t('toastRejected'), 'info');
    } catch {
      addToast(t('errorAction'), 'error');
    } finally {
      setBusyId(null);
      setConfirmReject(null);
    }
  };

  if (loading || !planningEnabled || totalCount === 0) return null;

  const formatDay = (slotDate: string) => {
    const todayStr = getTodayForCountry(country ?? undefined);
    const tomorrowDate = new Date(todayStr);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().split('T')[0];
    if (slotDate === todayStr) return t('today');
    if (slotDate === tomorrowStr) return t('tomorrow');
    return new Date(slotDate + 'T12:00:00').toLocaleDateString(
      locale === 'en' ? 'en-US' : 'fr-FR',
      { weekday: 'short', day: 'numeric', month: 'short' }
    );
  };

  return (
    <>
      <div className="overflow-hidden bg-white border border-gray-100 rounded-2xl shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-amber-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              {t('title')}
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold bg-amber-500 text-white">
                {totalCount}
              </span>
            </h2>
          </div>
          {totalCount > MAX_PREVIEW && (
            <Link href="/dashboard/planning?tab=reservations" className="text-xs font-semibold text-gray-400 hover:text-gray-600 flex items-center gap-1">
              {t('viewAll')}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* List */}
        <div className="divide-y divide-gray-100">
          {items.map((item) => {
            const busy = busyId === item.id;
            return (
              <div key={item.id} className="px-4 py-3">
                <Link
                  href={`/dashboard/planning?slot=${item.id}`}
                  className="flex items-center justify-between gap-3 active:opacity-70 transition-opacity touch-manipulation"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.client_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDay(item.slot_date)} · {item.start_time}</span>
                    </div>
                  </div>
                  {item.depositAmount != null && (
                    <span className="text-sm font-bold text-amber-700 shrink-0 tabular-nums">
                      {formatCurrency(item.depositAmount, country ?? undefined, locale, 0)}
                    </span>
                  )}
                </Link>
                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={() => handleAccept(item)}
                    disabled={busy}
                    className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-60 shadow-sm touch-manipulation"
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    {t('accept')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReject(item)}
                    disabled={busy}
                    className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-white border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 active:scale-[0.98] transition-all disabled:opacity-60 touch-manipulation"
                  >
                    <X className="w-3.5 h-3.5" />
                    {t('reject')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reject confirmation modal */}
      {confirmReject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => busyId !== confirmReject.id && setConfirmReject(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-900">{t('rejectConfirmTitle')}</h3>
            <p className="mt-2 text-sm text-gray-600">
              {t('rejectConfirmBody', { name: confirmReject.client_name })}
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2 mt-5">
              <button
                type="button"
                onClick={() => setConfirmReject(null)}
                disabled={busyId === confirmReject.id}
                className="flex-1 h-10 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-60"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleReject(confirmReject)}
                disabled={busyId === confirmReject.id}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {busyId === confirmReject.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                {t('rejectConfirmCta')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
