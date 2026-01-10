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
} from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatDate, formatDateTime, formatPhoneNumber } from '@/lib/utils';
import type { Merchant, LoyaltyCard, Customer, Visit, Redemption } from '@/types';

interface CardWithDetails extends LoyaltyCard {
  merchant: Merchant;
  customer: Customer;
}

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

  useEffect(() => {
    const fetchData = async () => {
      const savedPhone = localStorage.getItem('qarte_customer_phone');
      if (!savedPhone) {
        router.push('/customer/dashboard');
        return;
      }

      const formattedPhone = formatPhoneNumber(savedPhone);

      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('phone_number', formattedPhone)
        .single();

      if (!customerData) {
        router.push('/customer/dashboard');
        return;
      }

      const { data: cardData } = await supabase
        .from('loyalty_cards')
        .select(`
          *,
          merchant:merchants (*),
          customer:customers (*)
        `)
        .eq('customer_id', customerData.id)
        .eq('merchant_id', merchantId)
        .single();

      if (!cardData) {
        router.push('/customer/dashboard');
        return;
      }

      setCard(cardData as CardWithDetails);

      const { data: visitsData } = await supabase
        .from('visits')
        .select('*')
        .eq('loyalty_card_id', cardData.id)
        .order('visited_at', { ascending: false })
        .limit(20);

      if (visitsData) {
        setVisits(visitsData);
      }

      setLoading(false);
    };

    fetchData();
  }, [merchantId, router]);

  const handleRedeem = async () => {
    if (!card) return;

    setRedeeming(true);

    try {
      await supabase.from('redemptions').insert({
        loyalty_card_id: card.id,
        merchant_id: card.merchant.id,
        customer_id: card.customer.id,
        stamps_used: card.current_stamps,
      });

      await supabase
        .from('loyalty_cards')
        .update({ current_stamps: 0 })
        .eq('id', card.id);

      setCard({ ...card, current_stamps: 0 });
      setRedeemSuccess(true);
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
        <Link href="/customer/dashboard" className="mt-4">
          <Button variant="outline">Retour</Button>
        </Link>
      </div>
    );
  }

  const { merchant } = card;
  const isRewardReady = card.current_stamps >= merchant.stamps_required;

  return (
    <div className="min-h-screen" style={{ backgroundColor: `${merchant.primary_color}08` }}>
      <header
        className="sticky top-0 z-10 flex items-center gap-4 h-16 px-4"
        style={{ backgroundColor: merchant.primary_color }}
      >
        <Link
          href="/customer/dashboard"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        {merchant.logo_url ? (
          <img
            src={merchant.logo_url}
            alt={merchant.shop_name}
            className="w-10 h-10 rounded-lg object-cover"
          />
        ) : (
          <span className="text-lg font-bold text-white">{merchant.shop_name}</span>
        )}
      </header>

      {merchant.promo_message && (
        <div
          className="px-4 py-2 text-center text-sm text-white"
          style={{ backgroundColor: merchant.secondary_color }}
        >
          {merchant.promo_message}
        </div>
      )}

      <main className="px-4 py-6 mx-auto max-w-lg">
        <div className="p-6 bg-white rounded-2xl shadow-sm mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {merchant.program_name || 'Programme Fidélité'}
          </h1>
          <p className="text-gray-600 text-sm mb-6">{merchant.welcome_message}</p>

          <div className="flex justify-center gap-2 mb-4 flex-wrap">
            {[...Array(merchant.stamps_required)].map((_, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all"
                style={{
                  borderColor: merchant.primary_color,
                  backgroundColor:
                    i < card.current_stamps ? merchant.primary_color : 'transparent',
                }}
              >
                {i < card.current_stamps && (
                  <Check className="w-5 h-5 text-white" />
                )}
              </div>
            ))}
          </div>

          <p
            className="text-center text-lg font-semibold mb-2"
            style={{ color: merchant.primary_color }}
          >
            {card.current_stamps} / {merchant.stamps_required} passages
          </p>

          {!isRewardReady && card.current_stamps > 0 && (
            <p className="text-center text-sm text-gray-600">
              Plus que {merchant.stamps_required - card.current_stamps} passage
              {merchant.stamps_required - card.current_stamps > 1 ? 's' : ''} pour
              votre récompense
            </p>
          )}

          <div
            className="mt-6 p-4 rounded-xl text-center"
            style={{ backgroundColor: `${merchant.secondary_color}20` }}
          >
            <Gift className="w-8 h-8 mx-auto mb-2" style={{ color: merchant.primary_color }} />
            <p className="font-medium" style={{ color: merchant.primary_color }}>
              {merchant.reward_description}
            </p>
          </div>

          {isRewardReady && !redeemSuccess && (
            <Button
              onClick={() => setShowRedeemModal(true)}
              className="w-full mt-6"
              size="lg"
              style={{ backgroundColor: merchant.primary_color }}
            >
              <Gift className="w-5 h-5 mr-2" />
              Utiliser ma récompense
            </Button>
          )}

          {redeemSuccess && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
              <Check className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="font-medium text-green-800">Récompense utilisée !</p>
              <p className="text-sm text-green-600">Votre compteur est remis à zéro</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              Historique des visites
            </h2>
          </div>

          {visits.length > 0 ? (
            <ul className="divide-y divide-gray-50">
              {visits.map((visit) => (
                <li key={visit.id} className="flex items-center gap-4 px-4 py-3">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-full"
                    style={{ backgroundColor: `${merchant.primary_color}10` }}
                  >
                    <Check className="w-5 h-5" style={{ color: merchant.primary_color }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Passage validé</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(visit.visited_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Aucune visite enregistrée</p>
            </div>
          )}
        </div>
      </main>

      <Modal
        isOpen={showRedeemModal}
        onClose={() => setShowRedeemModal(false)}
        title="Utiliser ma récompense"
      >
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
      </Modal>

      <footer className="py-4 text-center text-xs text-gray-400">
        Powered by{' '}
        <Link href="/" className="hover:text-primary">
          Qarte
        </Link>
      </footer>
    </div>
  );
}
