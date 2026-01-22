'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Gift,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  Star,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { formatDateTime, formatPhoneNumber } from '@/lib/utils';
import type { Merchant, LoyaltyCard, Customer, Visit } from '@/types';

interface CardWithDetails extends LoyaltyCard {
  merchant: Merchant;
  customer: Customer;
}

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

export default function CustomerCardPage({
  params,
}: {
  params: Promise<{ merchantId: string }>;
}) {
  const { merchantId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [card, setCard] = useState<CardWithDetails | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitsExpanded, setVisitsExpanded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const savedPhone = getCookie('customer_phone');
      if (!savedPhone) {
        router.push('/customer/cards');
        return;
      }

      const formattedPhone = formatPhoneNumber(savedPhone);

      try {
        const response = await fetch(
          `/api/customers/card?phone=${encodeURIComponent(formattedPhone)}&merchant_id=${merchantId}`
        );
        const data = await response.json();

        if (!response.ok || !data.found) {
          router.push('/customer/cards');
          return;
        }

        setCard(data.card as CardWithDetails);
        setVisits(data.visits || []);
      } catch (error) {
        console.error('Error fetching card:', error);
        router.push('/customer/cards');
        return;
      }

      setLoading(false);
    };

    fetchData();
  }, [merchantId, router]);

  const handleRedeem = async () => {
    if (!card) return;

    const savedPhone = getCookie('customer_phone');
    if (!savedPhone) return;

    setRedeeming(true);

    try {
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loyalty_card_id: card.id,
          customer_phone: savedPhone,
        }),
      });

      if (response.ok) {
        setCard({ ...card, current_stamps: 0 });
        setRedeemSuccess(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <AlertCircle className="w-16 h-16 mb-4 text-red-500" />
        <p className="text-gray-600">Carte introuvable</p>
        <Link href="/customer/cards" className="mt-4">
          <Button variant="outline">Retour</Button>
        </Link>
      </div>
    );
  }

  const { merchant } = card;
  const isRewardReady = card.current_stamps >= merchant.stamps_required;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, white, ${merchant.primary_color}10)` }}>
      <header
        className="relative h-64 w-full overflow-hidden flex flex-col items-center justify-center text-white px-6"
        style={{ background: `linear-gradient(135deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})` }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        <div className="absolute top-6 left-6">
          <Link
            href="/customer/cards"
            className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
        </div>

        <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mb-4 p-1 shadow-2xl overflow-hidden">
          {merchant.logo_url ? (
            <img
              src={merchant.logo_url}
              alt={merchant.shop_name}
              className="w-full h-full rounded-2xl object-cover"
            />
          ) : (
            <span className="text-3xl font-black text-white">{merchant.shop_name[0]}</span>
          )}
        </div>
        <h1 className="text-2xl font-black tracking-tight drop-shadow-sm">{merchant.shop_name}</h1>
      </header>

      
      <main className="flex-1 -mt-12 px-4 pb-12 w-full max-w-lg mx-auto z-10">
        {/* Review Section - Above Card */}
        {merchant.review_link && (
          <a
            href={merchant.review_link}
            target="_blank"
            rel="noopener noreferrer"
            className="group block p-4 bg-gradient-to-br from-amber-50 via-white to-amber-50/30 border border-amber-100 rounded-3xl shadow-lg shadow-amber-900/5 mb-4 hover:shadow-xl hover:shadow-amber-900/10 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">Votre avis compte !</p>
                <p className="text-sm text-gray-600">Laissez-nous un avis</p>
              </div>
              <div className="p-2 rounded-xl bg-white shadow-sm border border-amber-50 group-hover:bg-amber-500 group-hover:text-white transition-all">
                <ExternalLink className="w-4 h-4" />
              </div>
            </div>
          </a>
        )}

        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 overflow-hidden">
          <div className="text-center mb-10">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-6xl font-black" style={{ color: merchant.primary_color }}>{card.current_stamps}</span>
              <span className="text-2xl font-bold text-gray-300">/{merchant.stamps_required}</span>
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-3">Passages cumulés</p>
          </div>

          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden mb-10">
            <div
              className="h-full transition-all duration-1000 ease-out rounded-full shadow-sm"
              style={{
                width: `${Math.min(100, (card.current_stamps / merchant.stamps_required) * 100)}%`,
                background: `linear-gradient(90deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})`
              }}
            />
          </div>

          <div
            className="rounded-2xl p-4 border mb-8 text-center bg-gradient-to-r from-white to-transparent"
            style={{
              backgroundColor: `${merchant.primary_color}05`,
              borderColor: `${merchant.primary_color}15`
            }}
          >
            <p className="font-bold text-gray-700">
              {isRewardReady
                ? "🎉 Félicitations ! Votre cadeau est prêt."
                : `Plus que ${merchant.stamps_required - card.current_stamps} passage${merchant.stamps_required - card.current_stamps > 1 ? 's' : ''} avant le bonheur !`
              }
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/50 p-6 flex items-center gap-5 transition-all hover:shadow-lg">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
              style={{ backgroundColor: `${merchant.primary_color}15` }}
            >
              <Gift className="w-7 h-7" style={{ color: merchant.primary_color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Votre récompense</p>
              <p className="text-lg font-bold text-gray-900 leading-tight truncate">{merchant.reward_description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors" />
          </div>

          {isRewardReady && !redeemSuccess && (
            <Button
              onClick={() => setShowRedeemModal(true)}
              className="w-full mt-8 h-16 rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              style={{
                background: `linear-gradient(135deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})`
              }}
            >
              <Gift className="w-6 h-6 mr-3" />
              Profiter de ma récompense
            </Button>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100/50 overflow-hidden mb-12">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-lg flex items-center gap-3">
              <div className="p-2 bg-gray-50 rounded-xl">
                <Calendar className="w-5 h-5 text-gray-500" />
              </div>
              Historique des visites
            </h2>
            {visits.length > 3 && (
              <button
                onClick={() => setVisitsExpanded(!visitsExpanded)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl transition-all"
                style={{ color: merchant.primary_color, backgroundColor: `${merchant.primary_color}10` }}
              >
                {visitsExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Réduire
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Tout voir ({visits.length})
                  </>
                )}
              </button>
            )}
          </div>

          {visits.length > 0 ? (
            <ul className="divide-y divide-gray-50">
              {(visitsExpanded ? visits : visits.slice(0, 3)).map((visit) => (
                <li key={visit.id} className="flex items-center gap-4 px-6 py-5 hover:bg-gray-50/40 transition-colors">
                  <div
                    className="flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm"
                    style={{ backgroundColor: `${merchant.primary_color}10` }}
                  >
                    <Check className="w-6 h-6" style={{ color: merchant.primary_color }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Passage validé</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDateTime(visit.visited_at)}
                    </p>
                  </div>
                  <div
                    className="px-3 py-1.5 rounded-xl text-sm font-bold"
                    style={{ backgroundColor: `${merchant.primary_color}10`, color: merchant.primary_color }}
                  >
                    +1 pt
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Aucune visite enregistrée</p>
            </div>
          )}
        </div>

        <footer className="py-8 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <span className="text-[11px] font-medium text-gray-400">Créé avec</span>
            <span className="text-sm">❤️</span>
            <span className="text-[11px] font-medium text-gray-400">en France</span>
          </div>
          <div className="inline-flex items-center gap-2 group cursor-default transition-all duration-300 hover:opacity-70">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
              <span className="text-white text-xs font-black italic">Q</span>
            </div>
            <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              QARTE
            </span>
          </div>
        </footer>
      </main>

      <Modal
        isOpen={showRedeemModal}
        onClose={() => !redeemSuccess && setShowRedeemModal(false)}
        title={redeemSuccess ? "Félicitations !" : "Utiliser ma récompense"}
      >
        {redeemSuccess ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 bg-green-100">
              <Check className="w-10 h-10 text-green-600" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Récompense utilisée !
            </h3>

            <p className="text-gray-600 mb-6">
              Votre compteur a été remis à zéro. Merci de votre fidélité !
            </p>

            <Button
              onClick={() => {
                setShowRedeemModal(false);
                setRedeemSuccess(false);
              }}
              className="w-full"
              size="lg"
              style={{ backgroundColor: merchant.primary_color }}
            >
              Retour à ma carte
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
              style={{ backgroundColor: `${merchant.primary_color}20` }}
            >
              <Gift className="w-10 h-10" style={{ color: merchant.primary_color }} />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {merchant.reward_description}
            </h3>

            <p className="text-gray-600 mb-6">
              Montrez cet écran au commerçant pour valider votre récompense.
            </p>

            <Button
              onClick={handleRedeem}
              loading={redeeming}
              className="w-full"
              size="lg"
              style={{ backgroundColor: merchant.primary_color }}
            >
              Confirmer l&apos;utilisation
            </Button>

            <button
              onClick={() => setShowRedeemModal(false)}
              className="mt-4 text-gray-500 hover:text-gray-700"
            >
              Annuler
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
