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
  Megaphone,
  X,
  ChevronDown,
  ChevronUp,
  History,
  AlertTriangle,
  Calendar,
  Trash2,
  PartyPopper,
  Zap,
  Crown,
  Clock,
  Gift,
  ImageIcon,
  Eye,
  EyeOff,
  Upload,
  CalendarDays,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMerchant } from '@/contexts/MerchantContext';

interface NotificationTemplate {
  id: string;
  title: string;
  body: string;
  offerDescription: string; // Longer description for offer details
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

interface PushHistoryItem {
  id: string;
  title: string;
  body: string;
  filter_type: string;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

interface ScheduledPush {
  id: string;
  title: string;
  body: string;
  scheduled_time: string;
  scheduled_date: string;
  status: string;
}

// 5 templates d'offres avec descriptions longues pour l'offre
const templates: NotificationTemplate[] = [
  {
    id: 'promo',
    title: 'Promo du jour',
    body: '-20% aujourd\'hui seulement !',
    offerDescription: 'Profitez de -20% sur l\'ensemble de nos produits et services. Offre valable uniquement aujourd\'hui, ne tardez pas !',
    icon: Megaphone,
    color: 'orange',
  },
  {
    id: 'flash',
    title: 'Vente flash',
    body: '2h pour en profiter ! Offre limitée',
    offerDescription: 'Vente flash exceptionnelle ! Pendant 2 heures seulement, bénéficiez de remises incroyables sur une sélection de produits. Stocks limités !',
    icon: Zap,
    color: 'yellow',
  },
  {
    id: 'new_product',
    title: 'Nouveauté',
    body: 'Découvrez notre nouveau produit !',
    offerDescription: 'Nous sommes ravis de vous présenter notre toute dernière nouveauté ! Venez la découvrir en avant-première et profitez d\'une offre de lancement exclusive.',
    icon: Sparkles,
    color: 'violet',
  },
  {
    id: 'happy_hour',
    title: 'Happy Hour',
    body: 'De 17h à 19h, offres spéciales !',
    offerDescription: 'C\'est l\'heure du Happy Hour ! De 17h à 19h, profitez d\'offres spéciales sur une sélection de produits. L\'occasion parfaite pour vous faire plaisir !',
    icon: PartyPopper,
    color: 'pink',
  },
  {
    id: 'exclusive',
    title: 'Exclusivité',
    body: 'Offre réservée à nos fidèles clients',
    offerDescription: 'En tant que client fidèle, vous bénéficiez d\'une offre exclusive ! Cette promotion est réservée uniquement à nos meilleurs clients comme vous.',
    icon: Crown,
    color: 'amber',
  },
];

const TIPS_SHOWN_KEY = 'qarte_marketing_tips_shown';

export default function MarketingPushPage() {
  const { merchant } = useMerchant();
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingCount, setLoadingCount] = useState(true);
  const [showSubscriberList, setShowSubscriberList] = useState(false);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    sent?: number;
    failed?: number;
    message?: string;
  } | null>(null);
  const [pushHistory, setPushHistory] = useState<PushHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Scheduling
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState<'10:00' | '18:00'>('10:00');
  const [scheduling, setScheduling] = useState(false);
  const [scheduledPushes, setScheduledPushes] = useState<ScheduledPush[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(true);

  // Tips popup
  const [showTipsPopup, setShowTipsPopup] = useState(false);

  // Offer management (integrated with push)
  const [offerDescription, setOfferDescription] = useState('');
  const [offerImageUrl, setOfferImageUrl] = useState('');
  const [offerDurationType, setOfferDurationType] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [offerCustomDate, setOfferCustomDate] = useState('');
  const [offerActive, setOfferActive] = useState(false);
  const [offerExpiresAt, setOfferExpiresAt] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageOption, setShowImageOption] = useState(false);

  // Check if first visit
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tipsShown = localStorage.getItem(TIPS_SHOWN_KEY);
      if (!tipsShown) {
        setShowTipsPopup(true);
        localStorage.setItem(TIPS_SHOWN_KEY, 'true');
      }
    }
  }, []);

  // Set default schedule date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setScheduleDate(today);
  }, []);

  // Fetch subscriber count and list
  useEffect(() => {
    const fetchSubscribers = async () => {
      if (!merchant?.id) return;

      try {
        const response = await fetch(`/api/push/subscribers?merchantId=${merchant.id}&details=true`);
        const data = await response.json();

        if (response.ok) {
          setSubscriberCount(data.count || 0);
          setSubscribers(data.subscribers || []);
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
        }
      } catch (err) {
        console.error('Error fetching push history:', err);
      }
      setLoadingHistory(false);
    };

    fetchHistory();
  }, [merchant?.id]);

  // Fetch scheduled pushes
  useEffect(() => {
    const fetchScheduled = async () => {
      if (!merchant?.id) return;

      try {
        const response = await fetch(`/api/push/schedule?merchantId=${merchant.id}`);
        const data = await response.json();

        if (response.ok) {
          setScheduledPushes(data.scheduled || []);
        }
      } catch (err) {
        console.error('Error fetching scheduled:', err);
      }
      setLoadingScheduled(false);
    };

    fetchScheduled();
  }, [merchant?.id]);

  // Fetch current offer status
  useEffect(() => {
    const fetchOffer = async () => {
      if (!merchant?.id) return;

      try {
        const response = await fetch(`/api/offers?merchantId=${merchant.id}`);
        const data = await response.json();

        if (response.ok && data.offer) {
          setOfferActive(data.offer.active || false);
          setOfferExpiresAt(data.offer.expiresAt || null);
        }
      } catch (err) {
        console.error('Error fetching offer:', err);
      }
    };

    fetchOffer();
  }, [merchant?.id]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim() || !merchant?.id) return;
    if (subscriberCount === 0) return;

    setSending(true);
    setSendResult(null);

    try {
      // Send push notification
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: merchant.id,
          filterType: 'all',
          payload: {
            title: merchant.shop_name || 'Qarte',
            body: `${title.trim()}: ${body.trim()}`,
            url: `/customer/card/${merchant.id}`,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Also save the offer if description is provided
        if (offerDescription.trim()) {
          await fetch('/api/offers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              merchantId: merchant.id,
              title: title.trim(),
              description: offerDescription.trim(),
              imageUrl: offerImageUrl.trim() || null,
              durationDays: getDurationDays(),
            }),
          });
          setOfferActive(true);
        }

        setSendResult({ success: true, sent: data.sent, failed: data.failed });
        if (data.sent > 0) {
          setTitle('');
          setBody('');
          setOfferDescription('');
          setOfferImageUrl('');
          // Refresh history
          const historyResponse = await fetch(`/api/push/history?merchantId=${merchant.id}&limit=10`);
          const historyData = await historyResponse.json();
          if (historyResponse.ok) {
            setPushHistory(historyData.history || []);
          }
        }
      } else {
        setSendResult({ success: false, message: data.error || 'Erreur lors de l\'envoi' });
      }
    } catch {
      setSendResult({ success: false, message: 'Erreur de connexion' });
    } finally {
      setSending(false);
    }
  };

  const handleSchedule = async () => {
    if (!title.trim() || !body.trim() || !merchant?.id || !scheduleDate) return;

    setScheduling(true);

    try {
      const response = await fetch('/api/push/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: merchant.id,
          title: title.trim(),
          body: body.trim(),
          scheduledTime: scheduleTime,
          scheduledDate: scheduleDate,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSendResult({ success: true, message: `Programmé pour ${scheduleTime === '10:00' ? '10h' : '18h'}` });
        setTitle('');
        setBody('');
        setShowSchedule(false);
        // Refresh scheduled list
        const scheduledResponse = await fetch(`/api/push/schedule?merchantId=${merchant.id}`);
        const scheduledData = await scheduledResponse.json();
        if (scheduledResponse.ok) {
          setScheduledPushes(scheduledData.scheduled || []);
        }
      } else {
        setSendResult({ success: false, message: data.error || 'Erreur' });
      }
    } catch {
      setSendResult({ success: false, message: 'Erreur de connexion' });
    } finally {
      setScheduling(false);
    }
  };

  const handleCancelScheduled = async (id: string) => {
    try {
      const response = await fetch(`/api/push/schedule?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setScheduledPushes(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('Error canceling scheduled push:', err);
    }
  };

  const applyTemplate = (template: NotificationTemplate) => {
    setTitle(template.title);
    setBody(template.body);
    // Also fill offer description with longer text
    setOfferDescription(template.offerDescription);
    setSendResult(null);
  };

  const handleDeactivateOffer = async () => {
    if (!merchant?.id) return;

    try {
      const response = await fetch(`/api/offers?merchantId=${merchant.id}`, { method: 'DELETE' });
      if (response.ok) {
        setOfferActive(false);
      }
    } catch (err) {
      console.error('Error deactivating offer:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateStr === today.toISOString().split('T')[0]) return "Aujourd'hui";
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Demain';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // Generate offer description based on keywords in title/body
  const generateOfferDescription = (notifTitle: string, notifBody: string): string => {
    const text = `${notifTitle} ${notifBody}`.toLowerCase();

    // Detect percentage discounts
    const percentMatch = text.match(/(\d+)\s*%/);
    if (percentMatch) {
      return `Profitez de ${percentMatch[1]}% de réduction sur l'ensemble de nos produits et services. Offre exceptionnelle à ne pas manquer !`;
    }

    // Detect euro discounts
    const euroMatch = text.match(/(\d+)\s*€/);
    if (euroMatch) {
      return `Économisez ${euroMatch[1]}€ sur votre prochain achat ! Une offre exclusive réservée à nos clients fidèles.`;
    }

    // Detect flash sale keywords
    if (text.includes('flash') || text.includes('2h') || text.includes('limité')) {
      return `Vente flash exceptionnelle ! Cette offre est limitée dans le temps, ne tardez pas pour en profiter. Stocks limités !`;
    }

    // Detect free/gratuit keywords
    if (text.includes('gratuit') || text.includes('offert') || text.includes('cadeau')) {
      return `Profitez de cette offre exceptionnelle, c'est cadeau ! Une attention spéciale pour vous remercier de votre fidélité.`;
    }

    // Detect new product keywords
    if (text.includes('nouveau') || text.includes('nouveauté') || text.includes('découvr')) {
      return `Découvrez notre nouveauté en avant-première ! Soyez parmi les premiers à en profiter avec une offre de lancement exclusive.`;
    }

    // Detect exclusive keywords
    if (text.includes('exclusi') || text.includes('fidèle') || text.includes('réservé')) {
      return `En tant que client fidèle, vous bénéficiez d'une offre exclusive ! Cette promotion est réservée uniquement à nos meilleurs clients.`;
    }

    // Detect happy hour keywords
    if (text.includes('happy') || text.includes('17h') || text.includes('18h') || text.includes('19h')) {
      return `C'est l'heure des bonnes affaires ! Profitez d'offres spéciales sur une sélection de produits. L'occasion parfaite pour vous faire plaisir !`;
    }

    // Default: use notification content as base
    return `${notifTitle}: ${notifBody}. Rendez-vous vite en boutique pour profiter de cette offre !`;
  };

  // Auto-fill offer description when body changes (if not from template)
  const handleBodyChange = (newBody: string) => {
    setBody(newBody);
    // Only auto-generate if offer description is empty or was auto-generated
    if (!offerDescription || offerDescription === generateOfferDescription(title, body)) {
      const generated = generateOfferDescription(title, newBody);
      setOfferDescription(generated);
    }
  };

  // Auto-fill offer description when title changes
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!offerDescription || offerDescription === generateOfferDescription(title, body)) {
      const generated = generateOfferDescription(newTitle, body);
      setOfferDescription(generated);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !merchant?.id) return;

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('merchantId', merchant.id);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.url) {
        setOfferImageUrl(data.url);
      } else {
        alert(data.error || 'Erreur lors de l\'upload');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Erreur lors de l\'upload');
    } finally {
      setUploadingImage(false);
    }
  };

  // Calculate duration days based on type
  const getDurationDays = (): number => {
    if (offerDurationType === 'today') return 1;
    if (offerDurationType === 'tomorrow') return 2;
    if (offerDurationType === 'custom' && offerCustomDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const customDate = new Date(offerCustomDate);
      const diffTime = customDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return Math.max(1, diffDays);
    }
    return 1;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* First time tips popup */}
      <AnimatePresence>
        {showTipsPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowTipsPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Conseils importants</h2>
              </div>
              <ul className="space-y-3 text-sm text-gray-700 mb-6">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span><strong className="text-red-600">N'envoyez pas trop souvent</strong> (1-2 fois par semaine max)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Soyez <strong>concis et direct</strong> - les gens lisent vite</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Ajoutez un sentiment d'<strong>urgence ou d'exclusivité</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Meilleurs moments :</strong> 10h ou 18h</span>
                </li>
              </ul>
              <button
                onClick={() => setShowTipsPopup(false)}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
              >
                J'ai compris !
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <Users className="w-7 h-7 text-amber-600" />
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
              {showSubscriberList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showSubscriberList ? 'Masquer' : 'Voir la liste'}
            </button>
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
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {subscribers.map((subscriber) => (
                    <div key={subscriber.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                        {subscriber.first_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {subscriber.first_name} {subscriber.last_name}
                        </p>
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

      {/* Scheduled Pushes */}
      {!loadingScheduled && scheduledPushes.length > 0 && (
        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 mb-6">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Programmés
          </h3>
          <div className="space-y-2">
            {scheduledPushes.map((push) => (
              <div key={push.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-blue-100">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{push.title}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(push.scheduled_date)} à {push.scheduled_time === '10:00' ? '10h' : '18h'}
                  </p>
                </div>
                <button
                  onClick={() => handleCancelScheduled(push.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
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
          <p className="text-sm font-medium text-gray-500 mb-3">Modèles</p>
          <div className="flex flex-wrap gap-2">
            {templates.map((template) => {
              const colorMap: Record<string, string> = {
                blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
                orange: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100',
                emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
                violet: 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100',
                amber: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
                yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100',
                pink: 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100',
                red: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
                purple: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
                indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100',
              };

              return (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all hover:scale-105 active:scale-95 ${colorMap[template.color] || colorMap.blue}`}
                >
                  <template.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{template.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* SECTION 1: Notification */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Titre de la notification</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ex: Offre spéciale !"
                maxLength={50}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
              />
              <p className={`text-xs mt-1 text-right ${title.length > 40 ? 'text-amber-600' : 'text-gray-400'}`}>
                {title.length}/50 {title.length <= 30 && title.length > 0 && '(optimal)'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Message court</label>
              <textarea
                value={body}
                onChange={(e) => handleBodyChange(e.target.value)}
                placeholder="Ex: -20% sur tout aujourd'hui seulement !"
                maxLength={150}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none resize-none"
              />
              <p className={`text-xs mt-1 text-right ${body.length > 100 ? 'text-amber-600' : 'text-gray-400'}`}>
                {body.length}/150 {body.length <= 80 && body.length > 0 && '(optimal)'}
              </p>
            </div>
          </div>

          {/* APERÇU NOTIFICATION - Entre notification et offre */}
          {(title || body) && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Bell className="w-3.5 h-3.5" />
                Aperçu notification (ce que reçoit le client)
              </p>
              <div className="bg-white rounded-xl shadow-lg p-3 flex gap-3 max-w-sm mx-auto">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-black italic">Q</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-gray-900">{merchant?.shop_name || 'Votre commerce'}</span>
                    <span className="text-[10px] text-gray-400">Maintenant</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 truncate">{title || 'Titre...'}</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{body || 'Message...'}</p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: Détails de l'offre */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-pink-500" />
              <label className="text-sm font-bold text-gray-700">Détails de l'offre</label>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Ce texte apparaît sur la carte fidélité quand le client clique sur "Offre en cours"
            </p>
            <textarea
              value={offerDescription}
              onChange={(e) => setOfferDescription(e.target.value)}
              placeholder="Décrivez votre offre en détail... (généré automatiquement depuis le message)"
              maxLength={300}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all outline-none resize-none"
            />
            <p className={`text-xs mt-1 text-right ${offerDescription.length > 250 ? 'text-pink-600' : 'text-gray-400'}`}>
              {offerDescription.length}/300
            </p>

            {/* Duration Selection - Aujourd'hui / Demain / Calendrier */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-500 mb-2">Durée de l'offre</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOfferDurationType('today')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    offerDurationType === 'today'
                      ? 'bg-pink-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Aujourd'hui
                </button>
                <button
                  type="button"
                  onClick={() => setOfferDurationType('tomorrow')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    offerDurationType === 'tomorrow'
                      ? 'bg-pink-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Demain
                </button>
                <button
                  type="button"
                  onClick={() => setOfferDurationType('custom')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                    offerDurationType === 'custom'
                      ? 'bg-pink-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  Date
                </button>
              </div>

              {/* Custom date picker */}
              {offerDurationType === 'custom' && (
                <div className="mt-2">
                  <input
                    type="date"
                    value={offerCustomDate}
                    onChange={(e) => setOfferCustomDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 rounded-lg border border-pink-200 text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Image Upload (collapsible) */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowImageOption(!showImageOption)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Ajouter une image (optionnel)</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showImageOption ? 'rotate-180' : ''}`} />
              </button>

              {showImageOption && (
                <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  {offerImageUrl ? (
                    <div className="relative">
                      <img
                        src={offerImageUrl}
                        alt="Aperçu"
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '';
                          setOfferImageUrl('');
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setOfferImageUrl('')}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-pink-300 hover:bg-pink-50/50 transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                      {uploadingImage ? (
                        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">Cliquer pour uploader</span>
                          <span className="text-xs text-gray-400 mt-1">JPG, PNG, WebP (max 2 Mo)</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Result message */}
          <AnimatePresence>
            {sendResult && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex items-center gap-3 p-4 rounded-xl ${
                  sendResult.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                }`}
              >
                {sendResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
                <p className="flex-1 font-semibold">
                  {sendResult.message || (sendResult.sent === 0
                    ? 'Aucun abonné à notifier'
                    : `${sendResult.sent} notification${sendResult.sent! > 1 ? 's' : ''} envoyée${sendResult.sent! > 1 ? 's' : ''} !`)}
                </p>
                <button onClick={() => setSendResult(null)} className="p-1 hover:bg-black/10 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Schedule Section */}
          <AnimatePresence>
            {showSchedule && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm font-bold text-blue-900 mb-3">Programmer l'envoi</p>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-blue-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-blue-700 mb-1">Heure</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setScheduleTime('10:00')}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                            scheduleTime === '10:00'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-blue-700 border border-blue-200'
                          }`}
                        >
                          10h
                        </button>
                        <button
                          onClick={() => setScheduleTime('18:00')}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                            scheduleTime === '18:00'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-blue-700 border border-blue-200'
                          }`}
                        >
                          18h
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {/* Schedule Toggle */}
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className={`px-4 py-4 rounded-xl font-bold transition-all flex items-center gap-2 ${
                showSchedule
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <Calendar className="w-5 h-5" />
            </button>

            {/* Main Send/Schedule Button */}
            <div className="flex-1 relative">
              <button
                onClick={showSchedule ? handleSchedule : handleSend}
                disabled={!title.trim() || !body.trim() || sending || scheduling || (subscriberCount === 0 && !showSchedule)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg shadow-lg shadow-amber-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {sending || scheduling ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {showSchedule ? 'Programmation...' : 'Envoi...'}
                  </>
                ) : showSchedule ? (
                  <>
                    <Calendar className="w-5 h-5" />
                    Programmer
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {offerDescription.trim() ? 'Envoyer + Publier l\'offre' : 'Envoyer maintenant'}
                  </>
                )}
              </button>

              {/* Big Danger Icon */}
              {!showSchedule && (
                <div className="absolute -right-3 -top-3">
                  <div className="relative group">
                    <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg animate-pulse cursor-help">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="absolute right-0 top-12 w-64 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <p className="font-bold mb-1 text-red-400">Attention !</p>
                      <p>N'envoyez pas plus de 1-2 notifications par semaine pour éviter les désabonnements.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Offer Indicator */}
      {offerActive && offerExpiresAt && (
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Gift className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-emerald-900">Offre en cours</p>
                <p className="text-sm text-emerald-700">
                  Valable jusqu'à {(() => {
                    const expires = new Date(offerExpiresAt);
                    const today = new Date();
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);

                    if (expires.toDateString() === today.toDateString()) {
                      return "ce soir";
                    } else if (expires.toDateString() === tomorrow.toDateString()) {
                      return "demain soir";
                    } else {
                      return expires.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
                    }
                  })()}
                </p>
              </div>
            </div>
            <button
              onClick={handleDeactivateOffer}
              className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
            >
              <EyeOff className="w-4 h-4" />
              Désactiver
            </button>
          </div>
        </div>
      )}

      {/* Push History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-gray-400" />
          Historique
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
              const date = new Date(item.created_at);

              return (
                <div key={item.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{item.title}</p>
                      <p className="text-sm text-gray-600 line-clamp-1">{item.body}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs font-medium text-gray-600 border">
                          <Users className="w-3 h-3" />
                          Tous
                        </span>
                        <span className="text-xs text-gray-400">
                          {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-bold">{item.sent_count}</span>
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
