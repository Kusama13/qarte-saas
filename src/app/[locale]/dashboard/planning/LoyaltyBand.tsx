'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Heart, Gift, Sparkles, CalendarCheck, Wallet, Crown, Ticket, ChevronRight, Loader2, HelpCircle, QrCode, Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Modal } from '@/components/ui';
import type { LoyaltyProgress } from '@/lib/loyalty-progress';

interface SnapshotCard { loyaltyCardId: string; currentStamps: number; currentAmount: number; tier1Redeemed: boolean }
interface SnapshotCustomer { firstName: string; lastName: string; phoneNumber: string; birthMonth: number | null; birthDay: number | null }

/** Données passées au parent pour ouvrir la fiche complète (CustomerManagementModal). */
export interface FullCardPayload {
  customerId: string;
  card: SnapshotCard;
  customer: SnapshotCustomer;
}

interface Snapshot {
  hasCard: boolean;
  progress: LoyaltyProgress;
  visitsCount: number;
  lastVisitDate: string | null;
  spent: number;
  spentScope: 'all' | 'bookings';
  rewardsEarned: number;
  vouchersCount: number;
  member: { programName: string; benefitLabel: string; discountPercent: number | null } | null;
  bookingEarnsLoyalty: boolean;
  card: SnapshotCard | null;
  customer: SnapshotCustomer | null;
}

interface LoyaltyBandProps {
  customerId: string;
  merchantId: string;
  merchantCountry: string;
  locale: string;
  /** Vrai si ce créneau (résa en ligne à venir) créditera un point à la venue → hint ludique. */
  slotEarnsPoint?: boolean;
  /** Ouvre la fiche fidélité complète directement (sans passer par la page Clients). */
  onOpenFullCard?: (payload: FullCardPayload) => void;
}

const DOTS_MAX = 12;

/**
 * Bande « Fidélité » sur la fiche résa : relie la réservation à la carte de la cliente.
 * Accent rose/emerald (couleur fidélité du design system), métaphore carte à tampons,
 * état de récompense mis en avant, infos rapides, hint ludique quand le RDV complète la carte.
 */
export default function LoyaltyBand({ customerId, merchantId, merchantCountry, locale, slotEarnsPoint, onOpenFullCard }: LoyaltyBandProps) {
  const t = useTranslations('planning');
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/customers/loyalty-snapshot?customerId=${customerId}&merchantId=${merchantId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (!cancelled) setSnap(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [customerId, merchantId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 flex items-center gap-2 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">{t('loyaltyLoading')}</span>
      </div>
    );
  }
  if (!snap) return null;

  const money = (v: number) => formatCurrency(v, merchantCountry, locale, 0);
  const p = snap.progress;
  const isCagnotte = p.mode === 'cagnotte';
  const reward = p.rewardReady;
  const canEarn = !!slotEarnsPoint && snap.bookingEarnsLoyalty;

  // Hint ludique (hors récompense prête, gérée par son propre encadré) : complète la carte > +1 à la venue.
  let hint: string | null = null;
  if (canEarn && !isCagnotte && p.remaining === 1) hint = t('loyaltyHintCompletes', { target: p.target });
  else if (canEarn) hint = isCagnotte ? t('loyaltyHintEarnCagnotte') : t('loyaltyHintEarnPoint');

  const filled = Math.min(p.currentStamps, p.target);
  const showDots = snap.hasCard && !isCagnotte && p.target > 0 && p.target <= DOTS_MAX;

  const openFullCard = () => {
    if (!snap.card || !snap.customer || !onOpenFullCard) return;
    onOpenFullCard({ customerId, card: snap.card, customer: snap.customer });
  };

  // Infos rapides : on n'affiche un item que s'il porte une info (pas de « 0 € », pas de « 0 bon »).
  const stats: React.ReactNode[] = [
    <span key="visits" className="inline-flex items-center gap-1"><CalendarCheck className="w-3 h-3 text-gray-400" />{t('loyaltyVisits', { count: snap.visitsCount })}</span>,
  ];
  if (snap.lastVisitDate) stats.push(<span key="last" className="text-gray-400">{t('loyaltyLastVisit', { date: formatDate(snap.lastVisitDate, locale) })}</span>);
  if (snap.spent > 0) {
    stats.push(
      <span key="spent" className="inline-flex items-center gap-1"><Wallet className="w-3 h-3 text-gray-400" />
        {snap.spentScope === 'bookings' ? t('loyaltySpentBookings', { amount: money(snap.spent) }) : t('loyaltySpent', { amount: money(snap.spent) })}
      </span>,
    );
  }
  if (snap.member) stats.push(<span key="member" className="inline-flex items-center gap-1 text-rose-600 font-semibold"><Crown className="w-3 h-3" />{snap.member.programName}</span>);
  if (snap.vouchersCount > 0) stats.push(<span key="vouchers" className="inline-flex items-center gap-1 text-emerald-600 font-semibold"><Ticket className="w-3 h-3" />{t('loyaltyVouchers', { count: snap.vouchersCount })}</span>);

  return (
    <>
    <div className={`rounded-2xl border p-4 ${reward ? 'border-emerald-200 bg-emerald-50/60' : 'border-rose-100 bg-rose-50/40'}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-500">
            <Heart className="w-3.5 h-3.5" fill="currentColor" />{t('loyaltyBandTitle')}
          </span>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            aria-label={t('loyaltyHelpTitle')}
            className="text-rose-400 hover:text-rose-600 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
        {!snap.hasCard ? (
          <span className="text-[11px] text-gray-400 font-medium">{t('loyaltyNoCard')}</span>
        ) : isCagnotte ? (
          <span className="text-lg font-bold text-gray-900 tabular-nums">{money(p.currentAmount)}</span>
        ) : (
          <span className="text-sm font-bold text-gray-900 tabular-nums">{t('loyaltyStampsCount', { current: p.currentStamps, target: p.target })}</span>
        )}
      </div>

      {/* Récompense prête : encadré dédié avec le libellé de la récompense */}
      {reward && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-white border border-emerald-200 px-3 py-2.5">
          <span className="shrink-0 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center"><Gift className="w-4 h-4 text-white" /></span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-emerald-700 leading-tight">{t('loyaltyRewardReady')}</p>
            {p.rewardLabel && <p className="text-xs text-emerald-800/80 leading-snug">{p.rewardLabel}</p>}
          </div>
        </div>
      )}

      {/* Progression — carte à tampons (pastilles) ou barre selon la cible */}
      {snap.hasCard && !reward && (
        <div className="mt-3">
          {showDots ? (
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: p.target }).map((_, i) => (
                <span key={i} className={`w-3.5 h-3.5 rounded-full ${i < filled ? 'bg-rose-500' : 'bg-white border border-rose-200'}`} />
              ))}
            </div>
          ) : (
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className={`h-full rounded-full ${isCagnotte ? 'bg-amber-400' : 'bg-rose-500'}`} style={{ width: `${Math.max(5, p.progressPercent)}%` }} />
            </div>
          )}
          {isCagnotte && p.cashbackValue > 0 && (
            <p className="mt-1.5 text-[11px] text-amber-700 font-medium">{t('loyaltyCashback', { amount: money(p.cashbackValue) })}</p>
          )}
        </div>
      )}

      {/* Hint ludique */}
      {hint && !reward && (
        <p className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
          <Sparkles className="w-3 h-3" />{hint}
        </p>
      )}

      {/* Infos rapides */}
      <div className="mt-3 pt-3 border-t border-rose-100/80 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
        {stats}
      </div>

      {/* Fiche complète — ouvre le modal fidélité directement */}
      {snap.hasCard && onOpenFullCard && (
        <button
          type="button"
          onClick={openFullCard}
          className="mt-3 inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-600 hover:text-rose-700 transition-colors"
        >
          {t('loyaltyOpenFullCard')}<ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>

    <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title={t('loyaltyHelpTitle')} size="md">
      <div className="space-y-5">
        {/* Automatique */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-2">{t('loyaltyHelpAutoLabel')}</p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center"><QrCode className="w-4 h-4 text-rose-500" /></div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">{t('loyaltyHelpScanTitle')}</p>
                <p className="text-[13px] text-gray-600 leading-snug">{t('loyaltyHelpScanDesc')}</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center"><CalendarCheck className="w-4 h-4 text-emerald-600" /></div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">{t('loyaltyHelpBookingTitle')}</p>
                <p className="text-[13px] text-gray-600 leading-snug">{t('loyaltyHelpBookingDesc')}</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Manuel */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">{t('loyaltyHelpManualLabel')}</p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center"><Plus className="w-4 h-4 text-gray-600" /></div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">{t('loyaltyHelpManualTitle')}</p>
                <p className="text-[13px] text-gray-600 leading-snug">{t('loyaltyHelpManualDesc')}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </Modal>
    </>
  );
}
