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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMerchant } from '@/contexts/MerchantContext';
import { supabase } from '@/lib/supabase';

interface NotificationTemplate {
  id: string;
  title: string;
  body: string;
  icon: React.ElementType;
  color: string;
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

export default function MarketingPushPage() {
  const { merchant } = useMerchant();
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(true);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    sent?: number;
    failed?: number;
    message?: string;
  } | null>(null);

  // Fetch subscriber count - count customers who have a loyalty card AND a push subscription
  useEffect(() => {
    const fetchCount = async () => {
      if (!merchant?.id) return;

      try {
        // Get all customer IDs with loyalty cards for this merchant
        const { data: loyaltyCards, error: cardsError } = await supabase
          .from('loyalty_cards')
          .select('customer_id')
          .eq('merchant_id', merchant.id);

        if (cardsError || !loyaltyCards) {
          setLoadingCount(false);
          return;
        }

        if (loyaltyCards.length === 0) {
          setSubscriberCount(0);
          setLoadingCount(false);
          return;
        }

        // Get unique customer IDs
        const customerIds = [...new Set(loyaltyCards.map(c => c.customer_id))];

        // Count push subscriptions for these customers
        const { count, error } = await supabase
          .from('push_subscriptions')
          .select('*', { count: 'exact', head: true })
          .in('customer_id', customerIds);

        if (!error) {
          setSubscriberCount(count || 0);
        }
      } catch (err) {
        console.error('Error fetching subscriber count:', err);
      }
      setLoadingCount(false);
    };

    fetchCount();
  }, [merchant?.id]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim() || !merchant?.id) return;

    setSending(true);
    setSendResult(null);

    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: merchant.id,
          payload: {
            title: title.trim(),
            body: body.trim(),
            url: `/scan/${merchant.scan_code}`,
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
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Users className="w-7 h-7 text-indigo-600" />
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
          {subscriberCount === 0 && !loadingCount && (
            <div className="text-right">
              <p className="text-sm text-gray-400">
                Les clients s'abonnent après leur premier passage
              </p>
            </div>
          )}
        </div>
      </div>

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
            disabled={!title.trim() || !body.trim() || sending || subscriberCount === 0}
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
                Envoyer à {subscriberCount || 0} abonné{(subscriberCount || 0) > 1 ? 's' : ''}
              </>
            )}
          </button>

          {subscriberCount === 0 && !loadingCount && (
            <p className="text-center text-sm text-gray-400">
              Vous pourrez envoyer des notifications quand des clients s'abonneront
            </p>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
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
    </div>
  );
}
