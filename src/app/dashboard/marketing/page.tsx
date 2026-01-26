'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Users,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Gift,
  Clock,
  Megaphone,
  X,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  UserPlus,
  Crown,
  Moon,
  Filter,
  History,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMerchant } from '@/contexts/MerchantContext';

interface NotificationTemplate {
  id: string;
  title: string;
  body: string;
  icon: React.ElementType;
  color: string;
}

interface Subscriber {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  loyalty_card_id: string | null;
  current_stamps: number;
  stamps_required: number;
  last_visit: string | null;
  total_visits: number;
  card_created_at: string | null;
}

type FilterType = 'all' | 'close_to_reward' | 'inactive' | 'new' | 'vip' | 'reward_ready';

interface MarketingFilter {
  id: FilterType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

interface PushHistoryItem {
  id: string;
  title: string;
  body: string;
  filter_type: string;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

const templates: NotificationTemplate[] = [
  {
    id: 'reminder',
    title: 'On vous attend !',
    body: 'Cela fait un moment... Passez nous voir !',
    icon: Clock,
    color: 'blue',
  },
  {
    id: 'promo',
    title: 'Offre spéciale',
    body: '-20% sur tout aujourd\'hui seulement !',
    icon: Megaphone,
    color: 'orange',
  },
  {
    id: 'reward',
    title: 'Récompense proche !',
    body: 'Plus que quelques points avant votre cadeau !',
    icon: Gift,
    color: 'emerald',
  },
  {
    id: 'news',
    title: 'Nouveauté',
    body: 'Découvrez notre nouvelle carte !',
    icon: Sparkles,
    color: 'violet',
  },
];

const marketingFilters: MarketingFilter[] = [
  {
    id: 'all',
    label: 'Tous',
    description: 'Tous les abonnés',
    icon: Users,
    color: 'gray',
  },
  {
    id: 'close_to_reward',
    label: 'Presque récompensés',
    description: 'Plus que 1-2 points',
    icon: Target,
    color: 'emerald',
  },
  {
    id: 'reward_ready',
    label: 'Récompense prête',
    description: 'Peuvent utiliser leur récompense',
    icon: Gift,
    color: 'amber',
  },
  {
    id: 'inactive',
    label: 'Inactifs',
    description: 'Pas de visite depuis 30+ jours',
    icon: Moon,
    color: 'blue',
  },
  {
    id: 'new',
    label: 'Nouveaux',
    description: 'Inscrits depuis moins de 7 jours',
    icon: UserPlus,
    color: 'violet',
  },
  {
    id: 'vip',
    label: 'VIP',
    description: '10+ visites au total',
    icon: Crown,
    color: 'yellow',
  },
];

export default function MarketingPushPage() {
  const { merchant } = useMerchant();
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingCount, setLoadingCount] = useState(true);
  const [showSubscriberList, setShowSubscriberList] = useState(false);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    sent?: number;
    failed?: number;
    message?: string;
  } | null>(null);
  const [pushHistory, setPushHistory] = useState<PushHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Fetch subscriber count and list via API (uses service role to bypass RLS)
  useEffect(() => {
    const fetchSubscribers = async () => {
      if (!merchant?.id) return;

      try {
        const response = await fetch(`/api/push/subscribers?merchantId=${merchant.id}&details=true`);
        const data = await response.json();

        if (response.ok) {
          setSubscriberCount(data.count || 0);
          setSubscribers(data.subscribers || []);
        } else {
          console.error('Error fetching subscribers:', data.error);
        }
      } catch (err) {
        console.error('Error fetching subscribers:', err);
      }
      setLoadingCount(false);
    };

    fetchSubscribers();
  }, [merchant?.id]);

  // Fetch push history
  useEffect(() => {
    const fetchHistory = async () => {
      if (!merchant?.id) return;

      try {
        const response = await fetch(`/api/push/history?merchantId=${merchant.id}&limit=10`);
        const data = await response.json();

        if (response.ok) {
          setPushHistory(data.history || []);
        } else {
          console.error('Error fetching push history:', data.error);
        }
      } catch (err) {
        console.error('Error fetching push history:', err);
      }
      setLoadingHistory(false);
    };

    fetchHistory();
  }, [merchant?.id]);

  // Filter subscribers based on selected filter
  const getFilteredSubscribers = (subs: Subscriber[]): Subscriber[] => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    switch (selectedFilter) {
      case 'close_to_reward':
        // Customers with 1-2 stamps remaining
        return subs.filter(s =>
          s.stamps_required - s.current_stamps <= 2 &&
          s.stamps_required - s.current_stamps > 0
        );

      case 'reward_ready':
        // Customers who can redeem
        return subs.filter(s => s.current_stamps >= s.stamps_required);

      case 'inactive':
        // No visit in last 30 days
        return subs.filter(s => {
          if (!s.last_visit) return true; // Never visited = inactive
          const lastVisitDate = new Date(s.last_visit);
          return lastVisitDate < thirtyDaysAgo;
        });

      case 'new':
        // Card created within last 7 days
        return subs.filter(s => {
          if (!s.card_created_at) return false;
          const createdDate = new Date(s.card_created_at);
          return createdDate >= sevenDaysAgo;
        });

      case 'vip':
        // 10+ visits total
        return subs.filter(s => s.total_visits >= 10);

      case 'all':
      default:
        return subs;
    }
  };

  const filteredSubscribers = getFilteredSubscribers(subscribers);
  const filteredCount = filteredSubscribers.length;

  const handleSend = async () => {
    if (!title.trim() || !body.trim() || !merchant?.id) return;
    if (filteredCount === 0) return;

    setSending(true);
    setSendResult(null);

    try {
      // Get customer IDs to send to (filtered)
      const targetCustomerIds = filteredSubscribers.map(s => s.id);

      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: merchant.id,
          customerIds: targetCustomerIds.length < subscribers.length ? targetCustomerIds : undefined, // Only pass if filtered
          filterType: selectedFilter,
          payload: {
            title: merchant.shop_name || 'Qarte',
            body: `${title.trim()}: ${body.trim()}`,
            url: `/customer/card/${merchant.id}`,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSendResult({
          success: true,
          sent: data.sent,
          failed: data.failed,
        });
        // Clear form on success
        if (data.sent > 0) {
          setTitle('');
          setBody('');
          // Refresh history
          try {
            const historyResponse = await fetch(`/api/push/history?merchantId=${merchant.id}&limit=10`);
            const historyData = await historyResponse.json();
            if (historyResponse.ok) {
              setPushHistory(historyData.history || []);
            }
          } catch (e) {
            console.error('Error refreshing history:', e);
          }
        }
      } else {
        setSendResult({
          success: false,
          message: data.error || 'Erreur lors de l\'envoi',
        });
      }
    } catch (error) {
      setSendResult({
        success: false,
        message: 'Erreur de connexion',
      });
    } finally {
      setSending(false);
    }
  };

  const applyTemplate = (template: NotificationTemplate) => {
    setTitle(template.title);
    setBody(template.body);
    setSendResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Notifications Push</h1>
            <p className="text-gray-500 text-sm">Envoyez des messages à vos clients</p>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Bell className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Abonnés aux notifications</p>
              {loadingCount ? (
                <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mt-1" />
              ) : (
                <p className="text-3xl font-black text-gray-900">{subscriberCount}</p>
              )}
            </div>
          </div>
          {subscriberCount !== null && subscriberCount > 0 && !loadingCount && (
            <button
              onClick={() => setShowSubscriberList(!showSubscriberList)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors"
            >
              {showSubscriberList ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Masquer la liste
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Voir la liste
                </>
              )}
            </button>
          )}
          {subscriberCount === 0 && !loadingCount && (
            <div className="text-right">
              <p className="text-sm text-gray-400">
                Les clients s'abonnent après leur premier passage
              </p>
            </div>
          )}
        </div>

        {/* Subscriber List */}
        <AnimatePresence>
          {showSubscriberList && subscribers.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  Liste des abonnés ({subscribers.length})
                </p>
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {subscribers.map((subscriber) => (
                    <div
                      key={subscriber.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                        {subscriber.first_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {subscriber.first_name} {subscriber.last_name}
                        </p>
                        {subscriber.phone_number && (
                          <p className="text-xs text-gray-500">{subscriber.phone_number}</p>
                        )}
                      </div>
                      <Bell className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filter Section */}
      {subscriberCount !== null && subscriberCount > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            Ciblage
          </h2>
          <div className="flex flex-wrap gap-2">
            {marketingFilters.map((filter) => {
              const count = filter.id === 'all'
                ? subscribers.length
                : getFilteredSubscribers(subscribers).length === filteredCount && filter.id === selectedFilter
                  ? filteredCount
                  : filter.id === selectedFilter
                    ? filteredCount
                    : (() => {
                        const tempFilter = selectedFilter;
                        // Quick count for this filter
                        const now = new Date();
                        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        switch (filter.id) {
                          case 'close_to_reward':
                            return subscribers.filter(s => s.stamps_required - s.current_stamps <= 2 && s.stamps_required - s.current_stamps > 0).length;
                          case 'reward_ready':
                            return subscribers.filter(s => s.current_stamps >= s.stamps_required).length;
                          case 'inactive':
                            return subscribers.filter(s => !s.last_visit || new Date(s.last_visit) < thirtyDaysAgo).length;
                          case 'new':
                            return subscribers.filter(s => s.card_created_at && new Date(s.card_created_at) >= sevenDaysAgo).length;
                          case 'vip':
                            return subscribers.filter(s => s.total_visits >= 10).length;
                          default:
                            return subscribers.length;
                        }
                      })();

              const isSelected = selectedFilter === filter.id;
              const colorClasses: Record<string, { bg: string; text: string; border: string; selectedBg: string }> = {
                gray: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', selectedBg: 'bg-gray-600' },
                emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', selectedBg: 'bg-emerald-600' },
                amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', selectedBg: 'bg-amber-600' },
                blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', selectedBg: 'bg-blue-600' },
                violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', selectedBg: 'bg-violet-600' },
                yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', selectedBg: 'bg-yellow-600' },
              };
              const colors = colorClasses[filter.color] || colorClasses.gray;

              return (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95 ${
                    isSelected
                      ? `${colors.selectedBg} text-white border-transparent shadow-lg`
                      : `${colors.bg} ${colors.text} ${colors.border} hover:shadow-md`
                  }`}
                >
                  <filter.icon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{filter.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-black/5'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          {selectedFilter !== 'all' && (
            <p className="text-sm text-gray-500 mt-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              {filteredCount} client{filteredCount > 1 ? 's' : ''} ciblé{filteredCount > 1 ? 's' : ''} • {marketingFilters.find(f => f.id === selectedFilter)?.description}
            </p>
          )}
        </div>
      )}

      {/* Composer */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Send className="w-5 h-5 text-gray-400" />
          Composer une notification
        </h2>

        {/* Templates */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-500 mb-3">Modèles rapides</p>
          <div className="flex flex-wrap gap-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all hover:scale-105 active:scale-95 ${
                  template.color === 'blue'
                    ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                    : template.color === 'orange'
                    ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
                    : template.color === 'emerald'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100'
                }`}
              >
                <template.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{template.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Titre de la notification
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Offre spéciale !"
              maxLength={50}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/50</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Ex: -20% sur tout aujourd'hui seulement ! Passez nous voir."
              maxLength={150}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{body.length}/150</p>
          </div>

          {/* Preview */}
          {(title || body) && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Aperçu
              </p>
              <div className="bg-white rounded-xl shadow-lg p-3 flex gap-3 max-w-sm">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-black italic">Q</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-gray-900">
                      {merchant?.shop_name || 'Votre commerce'}
                    </span>
                    <span className="text-[10px] text-gray-400">Maintenant</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    {title || 'Titre...'}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {body || 'Message...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Result message */}
          <AnimatePresence>
            {sendResult && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex items-center gap-3 p-4 rounded-xl ${
                  sendResult.success
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-red-50 text-red-800'
                }`}
              >
                {sendResult.success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold">
                        {sendResult.sent === 0
                          ? 'Aucun abonné à notifier'
                          : `${sendResult.sent} notification${sendResult.sent! > 1 ? 's' : ''} envoyée${sendResult.sent! > 1 ? 's' : ''} !`}
                      </p>
                      {sendResult.failed && sendResult.failed > 0 && (
                        <p className="text-sm opacity-75">
                          {sendResult.failed} échec(s)
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="font-semibold">{sendResult.message}</p>
                  </>
                )}
                <button
                  onClick={() => setSendResult(null)}
                  className="p-1 hover:bg-black/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!title.trim() || !body.trim() || sending || filteredCount === 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg shadow-lg shadow-amber-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Envoyer à {filteredCount} {selectedFilter !== 'all' ? 'client' : 'abonné'}{filteredCount > 1 ? 's' : ''}
                {selectedFilter !== 'all' && (
                  <span className="text-sm opacity-75">({marketingFilters.find(f => f.id === selectedFilter)?.label})</span>
                )}
              </>
            )}
          </button>

          {subscriberCount === 0 && !loadingCount && (
            <p className="text-center text-sm text-gray-400">
              Vous pourrez envoyer des notifications quand des clients s'abonneront
            </p>
          )}

          {subscriberCount !== null && subscriberCount > 0 && filteredCount === 0 && selectedFilter !== 'all' && (
            <p className="text-center text-sm text-gray-400">
              Aucun client ne correspond à ce filtre
            </p>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 mb-6">
        <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-600" />
          Conseils pour des notifications efficaces
        </h3>
        <ul className="space-y-2 text-sm text-amber-800">
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            <span>Soyez concis et direct - les gens lisent vite</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            <span>Ajoutez un sentiment d'urgence ou d'exclusivité</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            <span>N'envoyez pas trop souvent (1-2 fois par semaine max)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            <span>Personnalisez avec le nom de votre commerce</span>
          </li>
        </ul>
      </div>

      {/* Push History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-gray-400" />
          Historique des envois
        </h2>

        {loadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : pushHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune notification envoyée</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pushHistory.map((item) => {
              const filterInfo = marketingFilters.find(f => f.id === item.filter_type);
              const FilterIcon = filterInfo?.icon || Users;
              const date = new Date(item.created_at);
              const formattedDate = date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={item.id}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{item.title}</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{item.body}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs font-medium text-gray-600 border border-gray-200">
                          <FilterIcon className="w-3 h-3" />
                          {filterInfo?.label || 'Tous'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formattedDate}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-bold">{item.sent_count}</span>
                      </div>
                      {item.failed_count > 0 && (
                        <div className="flex items-center gap-1 text-red-500 text-sm">
                          <AlertCircle className="w-3 h-3" />
                          <span>{item.failed_count}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
