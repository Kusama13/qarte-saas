'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  CreditCard,
  Phone,
  Gift,
  ChevronRight,
  Search,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { formatPhoneNumber, validatePhone } from '@/lib/utils';

interface CardData {
  merchant_id: string;
  shop_name: string;
  logo_url: string | null;
  primary_color: string;
  stamps_required: number;
  current_stamps: number;
}

export default function CustomerDashboardPage() {
  const t = useTranslations('customerDashboard');
  const [step, setStep] = useState<'phone' | 'cards'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState<string | null>(null);
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check auth via HttpOnly cookie
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/customers/me');
        const data = await res.json();
        if (data.authenticated && data.phone) {
          setPhoneNumber(data.phone);
          fetchCards();
        }
      } catch {
        // Not authenticated
      }
    };
    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCards = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/customers/cards', { method: 'POST' });

      if (res.status === 401) {
        setError(t('noAccountFound'));
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (!data.found) {
        setError(t('noAccountFound'));
        setLoading(false);
        return;
      }

      setFirstName(data.first_name || null);
      setCards(data.cards || []);
      setStep('cards');
    } catch {
      setError(t('searchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePhone(formatPhoneNumber(phoneNumber))) {
      setError(t('invalidPhone'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Login via API (sets HttpOnly cookie)
      const loginRes = await fetch('/api/customers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });

      if (!loginRes.ok) {
        const loginData = await loginRes.json();
        setError(loginData.error || t('noAccountFound'));
        setLoading(false);
        return;
      }

      // Now fetch cards (cookie is set)
      await fetchCards();
    } catch {
      setError(t('searchError'));
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/customers/logout', { method: 'POST' });
    setFirstName(null);
    setCards([]);
    setPhoneNumber('');
    setStep('phone');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-lg">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Qarte</span>
          </Link>
          {step === 'cards' && (
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {t('changeNumber')}
            </button>
          )}
        </div>
      </header>

      <main className="px-4 py-8 mx-auto max-w-lg">
        {step === 'phone' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                {t('myLoyaltyCards')}
              </h1>
              <p className="mt-2 text-gray-600">
                {t('enterPhone')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">
                  {error}
                </div>
              )}

              <div className="relative">
                <Input
                  type="tel"
                  placeholder={t('phonePlaceholder')}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="text-lg pl-12"
                />
                <Phone className="absolute w-5 h-5 text-gray-400 left-4 top-1/2 transform -translate-y-1/2" />
              </div>

              <Button type="submit" loading={loading} className="w-full">
                <Search className="w-5 h-5 mr-2" />
                {t('searchCards')}
              </Button>
            </form>

            <p className="mt-8 text-sm text-center text-gray-500">
              {t('noCardYet')}{' '}
              <span className="text-primary">
                {t('scanPartner')}
              </span>
            </p>
          </div>
        )}

        {step === 'cards' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                {t('hello', { name: firstName || '' })}
              </h1>
              <p className="mt-1 text-gray-600">
                {t('loyaltyCards', { count: cards.length })}
              </p>
            </div>

            {cards.length > 0 ? (
              <div className="space-y-4">
                {cards.map((card) => {
                  const isRewardReady =
                    card.current_stamps >= card.stamps_required;
                  const progress =
                    (card.current_stamps / card.stamps_required) * 100;

                  return (
                    <Link
                      key={card.merchant_id}
                      href={`/customer/card/${card.merchant_id}`}
                      className="block"
                    >
                      <div
                        className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-gray-200"
                        style={{
                          borderLeftWidth: '4px',
                          borderLeftColor: card.primary_color,
                        }}
                      >
                        <div className="flex items-center gap-4">
                          {card.logo_url ? (
                            <img
                              src={card.logo_url}
                              alt={card.shop_name}
                              className="w-14 h-14 rounded-xl object-cover"
                            />
                          ) : (
                            <div
                              className="flex items-center justify-center w-14 h-14 rounded-xl text-white font-bold text-xl"
                              style={{
                                backgroundColor: card.primary_color,
                              }}
                            >
                              {card.shop_name.charAt(0)}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {card.shop_name}
                              </h3>
                              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            </div>

                            <div className="mt-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-600">
                                  {card.current_stamps} /{' '}
                                  {card.stamps_required}
                                </span>
                                {isRewardReady && (
                                  <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                                    <Gift className="w-3 h-3" />
                                    {t('reward')}
                                  </span>
                                )}
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(progress, 100)}%`,
                                    backgroundColor: card.primary_color,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">{t('noCards')}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {t('scanToStart')}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-gray-400">
        <Link href="/" className="hover:text-primary">
          Qarte
        </Link>
        {' - '}
        {t('tagline')}
      </footer>
    </div>
  );
}
