'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
  HelpCircle,
  Cake,
  Lock,
  UserPlus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMerchant } from '@/contexts/MerchantContext';
import { compressOfferImage } from '@/lib/image-compression';

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

// 5 templates beauté / bien-être
const templates: NotificationTemplate[] = [
  {
    id: 'last_minute',
    title: 'Créneau dispo',
    body: 'Un créneau vient de se libérer, réservez vite !',
    offerDescription: 'Bonne nouvelle ! Un créneau vient de se libérer aujourd\'hui. Profitez-en pour prendre soin de vous sans attendre. Premier arrivé, premier servi !',
    icon: Zap,
    color: 'orange',
  },
  {
    id: 'new_service',
    title: 'Nouveau soin',
    body: 'Découvrez notre nouvelle prestation !',
    offerDescription: 'Nous sommes ravis de vous présenter notre nouveau soin ! Venez le découvrir en avant-première et profitez d\'une offre de lancement exclusive pour nos fidèles.',
    icon: Sparkles,
    color: 'violet',
  },
  {
    id: 'promo_beaute',
    title: 'Offre beauté',
    body: '-20% sur une prestation aujourd\'hui !',
    offerDescription: 'Offrez-vous un moment de bien-être à prix doux ! -20% sur la prestation de votre choix, valable uniquement aujourd\'hui. Prenez rendez-vous vite !',
    icon: Megaphone,
    color: 'pink',
  },
  {
    id: 'duo',
    title: 'Offre duo',
    body: 'Venez à deux, -20% sur les 2 prestations !',
    offerDescription: 'Envie d\'un moment entre amies ou en couple ? Profitez de -20% sur les deux prestations ! Partagez ce bon plan et passez un bon moment ensemble.',
    icon: PartyPopper,
    color: 'yellow',
  },
  {
    id: 'calme',
    title: 'Créneau calme',
    body: 'Profitez d\'un moment au calme cette semaine !',
    offerDescription: 'Envie d\'un soin dans une ambiance tranquille ? Nos créneaux en milieu de semaine sont plus calmes, idéals pour se détendre. Réservez votre moment rien qu\'à vous !',
    icon: Crown,
    color: 'amber',
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

  // Offer management (integrated with push)
  const [offerDescription, setOfferDescription] = useState('');
  const [offerImageUrl, setOfferImageUrl] = useState('');
  const [offerDurationType, setOfferDurationType] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [offerCustomDate, setOfferCustomDate] = useState('');
  const [offerActive, setOfferActive] = useState(false);
  const [offerExpiresAt, setOfferExpiresAt] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageOption, setShowImageOption] = useState(false);

  // Current offer details for viewing
  const [currentOfferTitle, setCurrentOfferTitle] = useState('');
  const [currentOfferDescription, setCurrentOfferDescription] = useState('');
  const [currentOfferImageUrl, setCurrentOfferImageUrl] = useState<string | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);

  // Birthday gift config
  const [birthdayGiftEnabled, setBirthdayGiftEnabled] = useState(false);
  const [birthdayGiftDescription, setBirthdayGiftDescription] = useState('');
  const [savingBirthday, setSavingBirthday] = useState(false);
  const [birthdaySaveResult, setBirthdaySaveResult] = useState<{ success: boolean; message: string } | null>(null);

  // History visibility
  const [showHistory, setShowHistory] = useState(false);

  // How it works modal
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Tab navigation — read ?tab=automations from URL
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'send' | 'automations'>(
    searchParams.get('tab') === 'automations' ? 'automations' : 'send'
  );

  // Offer details collapsible in composer
  const [showOfferDetails, setShowOfferDetails] = useState(false);

  // Automation unlock threshold
  const AUTOMATION_UNLOCK_THRESHOLD = 10;
  const automationsUnlocked = (subscriberCount ?? 0) >= AUTOMATION_UNLOCK_THRESHOLD;

  // Forbidden words list
  const FORBIDDEN_WORDS = [
    'sexe', 'sexuel', 'porno', 'xxx', 'nude', 'nu', 'nue',
    'arme', 'armes', 'fusil', 'pistolet', 'couteau', 'munition',
    'drogue', 'cannabis', 'cocaine', 'heroïne', 'crack',
    'violence', 'meurtre', 'tuer', 'mort',
    'nazi', 'hitler', 'raciste', 'racisme',
    'escroquerie', 'arnaque', 'fraude'
  ];

  // Check for forbidden words
  const containsForbiddenWords = (text: string): string | null => {
    const lowerText = text.toLowerCase();
    for (const word of FORBIDDEN_WORDS) {
      if (lowerText.includes(word)) {
        return word;
      }
    }
    return null;
  };

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

  // Fetch current offer status and details
  useEffect(() => {
    const fetchOffer = async () => {
      if (!merchant?.id) return;

      try {
        const response = await fetch(`/api/offers?merchantId=${merchant.id}`);
        const data = await response.json();

        if (response.ok && data.offer) {
          setOfferActive(data.offer.active || false);
          setOfferExpiresAt(data.offer.expiresAt || null);
          setCurrentOfferTitle(data.offer.title || '');
          setCurrentOfferDescription(data.offer.description || '');
          setCurrentOfferImageUrl(data.offer.imageUrl || null);
        }
      } catch (err) {
        console.error('Error fetching offer:', err);
      }
    };

    fetchOffer();
  }, [merchant?.id]);

  // Init birthday config from merchant
  useEffect(() => {
    if (!merchant) return;
    setBirthdayGiftEnabled(merchant.birthday_gift_enabled || false);
    setBirthdayGiftDescription(merchant.birthday_gift_description || '');
  }, [merchant]);

  const handleSaveBirthdayConfig = async () => {
    if (!merchant?.id) return;
    setSavingBirthday(true);
    setBirthdaySaveResult(null);
    try {
      const res = await fetch('/api/merchants/birthday-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: merchant.id,
          birthday_gift_enabled: birthdayGiftEnabled,
          birthday_gift_description: birthdayGiftDescription.trim(),
        }),
      });
      if (res.ok) {
        setBirthdaySaveResult({ success: true, message: 'Sauvegardé !' });
      } else {
        setBirthdaySaveResult({ success: false, message: 'Erreur' });
      }
    } catch {
      setBirthdaySaveResult({ success: false, message: 'Erreur de connexion' });
    } finally {
      setSavingBirthday(false);
      setTimeout(() => setBirthdaySaveResult(null), 3000);
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim() || !merchant?.id) return;

    // Check for forbidden words
    const allText = `${title} ${body} ${offerDescription}`;
    const forbiddenWord = containsForbiddenWords(allText);
    if (forbiddenWord) {
      setSendResult({ success: false, message: `Contenu interdit détecté: "${forbiddenWord}". Veuillez modifier votre message.` });
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      // Save the offer first (works even with 0 subscribers)
      let offerSaved = false;
      if (offerDescription.trim()) {
        const offerResponse = await fetch('/api/offers', {
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
        if (offerResponse.ok) {
          setOfferActive(true);
          setCurrentOfferTitle(title.trim());
          setCurrentOfferDescription(offerDescription.trim());
          setCurrentOfferImageUrl(offerImageUrl.trim() || null);
          offerSaved = true;
        }
      }

      // Send push notification (only if there are subscribers)
      if (subscriberCount && subscriberCount > 0) {
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
          setSendResult({ success: true, sent: data.sent, failed: data.failed });
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
        } else {
          setSendResult({ success: false, message: data.error || 'Erreur lors de l\'envoi' });
        }
      } else {
        // No subscribers — offer was saved, inform user
        if (offerSaved) {
          setSendResult({ success: true, sent: 0, message: 'Offre publiée ! Aucun abonné push pour le moment.' });
          setTitle('');
          setBody('');
          setOfferDescription('');
          setOfferImageUrl('');
        } else {
          setSendResult({ success: false, message: 'Aucun abonné push et aucune offre à publier.' });
        }
      }
    } catch {
      setSendResult({ success: false, message: 'Erreur de connexion' });
    } finally {
      setSending(false);
    }
  };

  const handleSchedule = async () => {
    if (!title.trim() || !body.trim() || !merchant?.id || !scheduleDate) return;

    // Check for forbidden words
    const allText = `${title} ${body} ${offerDescription}`;
    const forbiddenWord = containsForbiddenWords(allText);
    if (forbiddenWord) {
      setSendResult({ success: false, message: `Contenu interdit détecté: "${forbiddenWord}". Veuillez modifier votre message.` });
      return;
    }

    setScheduling(true);

    try {
      // Save the offer if description provided
      if (offerDescription.trim()) {
        const offerResponse = await fetch('/api/offers', {
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
        if (offerResponse.ok) {
          setOfferActive(true);
          setCurrentOfferTitle(title.trim());
          setCurrentOfferDescription(offerDescription.trim());
          setCurrentOfferImageUrl(offerImageUrl.trim() || null);
        }
      }

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
        setOfferDescription('');
        setOfferImageUrl('');
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
      // Compress image before upload
      const compressedFile = await compressOfferImage(file);

      const formData = new FormData();
      formData.append('file', compressedFile);
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
      return Math.min(30, Math.max(1, diffDays));
    }
    return 1;
  };

  // SVG ring calculations for subscriber progress
  const ringSize = 80;
  const ringStroke = 6;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const subscriberProgress = Math.min((subscriberCount ?? 0) / AUTOMATION_UNLOCK_THRESHOLD, 1);
  const ringOffset = ringCircumference - subscriberProgress * ringCircumference;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between p-4 md:p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-violet-600">
              Marketing
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Notifications push & automatisations
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowHowItWorks(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-600 bg-white/80 border border-indigo-100 rounded-xl hover:bg-white transition-colors shadow-sm"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Aide</span>
        </button>
      </div>

      {/* Hero — Subscriber ring + progress */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-4">
          {/* SVG Ring */}
          <div className="relative flex-shrink-0" style={{ width: ringSize, height: ringSize }}>
            <svg width={ringSize} height={ringSize} className="-rotate-90">
              {/* Background circle */}
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                fill="none"
                stroke="#f3f4f6"
                strokeWidth={ringStroke}
              />
              {/* Progress circle */}
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                fill="none"
                stroke={automationsUnlocked ? '#22c55e' : '#6366f1'}
                strokeWidth={ringStroke}
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {loadingCount ? (
                <div className="w-6 h-6 bg-gray-100 rounded animate-pulse" />
              ) : (
                <>
                  <span className="text-xl font-black text-gray-900 leading-none">{subscriberCount ?? 0}</span>
                  <Bell className="w-3 h-3 text-gray-400 mt-0.5" />
                </>
              )}
            </div>
          </div>

          {/* Text + progress bar */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">Abonnés push</p>
            {!loadingCount && (
              <>
                {automationsUnlocked ? (
                  <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Automatisations débloquées
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Encore <span className="font-bold text-indigo-600">{AUTOMATION_UNLOCK_THRESHOLD - (subscriberCount ?? 0)}</span> abonné{(AUTOMATION_UNLOCK_THRESHOLD - (subscriberCount ?? 0)) > 1 ? 's' : ''} pour débloquer les automatisations
                  </p>
                )}
                {/* Linear progress bar */}
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${subscriberProgress * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${automationsUnlocked ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                  />
                </div>
              </>
            )}
            {/* Toggle subscriber list */}
            {subscriberCount !== null && subscriberCount > 0 && !loadingCount && (
              <button
                onClick={() => setShowSubscriberList(!showSubscriberList)}
                className="mt-2 flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {showSubscriberList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showSubscriberList ? 'Masquer la liste' : 'Voir la liste'}
              </button>
            )}
          </div>
        </div>

        {/* Subscriber List (collapsible) */}
        <AnimatePresence>
          {showSubscriberList && subscribers.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {subscribers.map((subscriber) => (
                    <div key={subscriber.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs">
                        {subscriber.first_name?.charAt(0) || '?'}
                      </div>
                      <p className="font-medium text-gray-900 text-sm truncate flex-1">
                        {subscriber.first_name} {subscriber.last_name}
                      </p>
                      <Bell className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('send')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'send'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Send className="w-4 h-4" />
          Envoyer
        </button>
        <button
          onClick={() => setActiveTab('automations')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'automations'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Zap className="w-4 h-4" />
          Automatisations
          {!automationsUnlocked && <Lock className="w-3 h-3 opacity-60" />}
        </button>
      </div>

      {/* ═══════════════ TAB: ENVOYER ═══════════════ */}
      {activeTab === 'send' && (
        <>
          {/* Scheduled Pushes */}
          {!loadingScheduled && scheduledPushes.length > 0 && (
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-3 mb-4">
              <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-blue-600" />
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
            {/* Templates Grid */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Modèles rapides</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${colorMap[template.color] || colorMap.blue}`}
                    >
                      <template.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-semibold truncate">{template.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Composer Form — flex-col on mobile, flex-row on desktop */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Left: Form */}
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Titre de la notification</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Ex: Offre spéciale !"
                    maxLength={50}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-sm"
                  />
                  <p className={`text-[10px] mt-0.5 text-right ${title.length > 40 ? 'text-amber-600' : 'text-gray-400'}`}>
                    {title.length}/50 {title.length <= 30 && title.length > 0 && '✓'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Message court</label>
                  <textarea
                    value={body}
                    onChange={(e) => handleBodyChange(e.target.value)}
                    placeholder="Ex: -20% sur tout aujourd'hui seulement !"
                    maxLength={150}
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none resize-none text-sm"
                  />
                  <p className={`text-[10px] mt-0.5 text-right ${body.length > 100 ? 'text-amber-600' : 'text-gray-400'}`}>
                    {body.length}/150 {body.length <= 80 && body.length > 0 && '✓'}
                  </p>
                </div>

                {/* Collapsible offer section */}
                <div className="border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowOfferDetails(!showOfferDetails)}
                    className="flex items-center gap-2 w-full text-left group"
                  >
                    <Gift className="w-4 h-4 text-pink-500" />
                    <span className="text-xs font-bold text-gray-700 flex-1">Ajouter une offre</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showOfferDetails ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showOfferDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 space-y-3">
                          <p className="text-[10px] text-gray-500">
                            Visible sur la carte fidélité du client
                          </p>

                          {/* Warning if offer already active */}
                          {offerActive && offerExpiresAt && (
                            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-amber-800">
                                  Une offre est déjà active
                                </p>
                                <p className="text-[10px] text-amber-700 mt-0.5">
                                  &ldquo;{currentOfferTitle}&rdquo; expire {(() => {
                                    const expires = new Date(offerExpiresAt);
                                    const today = new Date();
                                    const tomorrow = new Date(today);
                                    tomorrow.setDate(tomorrow.getDate() + 1);
                                    if (expires.toDateString() === today.toDateString()) return "ce soir";
                                    if (expires.toDateString() === tomorrow.toDateString()) return "demain soir";
                                    return expires.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                                  })()}. Envoyer remplacera l&apos;offre actuelle.
                                </p>
                              </div>
                            </div>
                          )}

                          <textarea
                            value={offerDescription}
                            onChange={(e) => setOfferDescription(e.target.value)}
                            placeholder="Décrivez votre offre en détail..."
                            maxLength={300}
                            rows={2}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all outline-none resize-none text-sm"
                          />
                          <p className={`text-[10px] text-right ${offerDescription.length > 250 ? 'text-pink-600' : 'text-gray-400'}`}>
                            {offerDescription.length}/300
                          </p>

                          {/* Image Upload */}
                          <div>
                            <button
                              type="button"
                              onClick={() => setShowImageOption(!showImageOption)}
                              className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>Image (optionnel)</span>
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showImageOption ? 'rotate-180' : ''}`} />
                            </button>

                            {showImageOption && (
                              <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                {offerImageUrl ? (
                                  <div className="relative">
                                    <img
                                      src={offerImageUrl}
                                      alt="Aperçu"
                                      className="w-full h-28 object-cover rounded-lg"
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
                                  <label className="flex flex-col items-center justify-center py-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-pink-300 hover:bg-pink-50/50 transition-all">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleImageUpload}
                                      className="hidden"
                                      disabled={uploadingImage}
                                    />
                                    {uploadingImage ? (
                                      <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
                                    ) : (
                                      <>
                                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                        <span className="text-xs text-gray-500">Cliquer pour uploader</span>
                                        <span className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, WebP (max 2 Mo)</span>
                                      </>
                                    )}
                                  </label>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Duration Selection */}
                          <div>
                            <label className="block text-[10px] font-medium text-gray-500 mb-1.5">Durée de l&apos;offre</label>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => setOfferDurationType('today')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                  offerDurationType === 'today'
                                    ? 'bg-pink-500 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                Aujourd&apos;hui
                              </button>
                              <button
                                type="button"
                                onClick={() => setOfferDurationType('tomorrow')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                  offerDurationType === 'tomorrow'
                                    ? 'bg-pink-500 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                Demain
                              </button>
                              <button
                                type="button"
                                onClick={() => setOfferDurationType('custom')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                                  offerDurationType === 'custom'
                                    ? 'bg-pink-500 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                <CalendarDays className="w-3.5 h-3.5" />
                                Date
                              </button>
                            </div>

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
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right: Notification Preview (desktop only, shown when content exists) */}
              {(title || body) && (
                <div className="md:w-64 flex-shrink-0">
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 sticky top-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Bell className="w-3 h-3" />
                      Aperçu
                    </p>
                    <div className="bg-white rounded-lg shadow-md p-2.5 flex gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-black italic">Q</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-900">{merchant?.shop_name || 'Votre commerce'}</span>
                          <span className="text-[9px] text-gray-400">Maint.</span>
                        </div>
                        <p className="text-[10px] font-semibold text-gray-800 truncate">{title || 'Titre...'}</p>
                        <p className="text-[10px] text-gray-600 line-clamp-2">{body || 'Message...'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Result message */}
            <AnimatePresence>
              {sendResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mt-4 flex items-center gap-3 p-4 rounded-xl ${
                    sendResult.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                  }`}
                >
                  {sendResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                  <p className="flex-1 font-semibold text-sm">
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
                  className="overflow-hidden mt-4"
                >
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-sm font-bold text-blue-900 mb-3">Programmer l&apos;envoi</p>
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
            <div className="flex gap-2 mt-4">
              <div className="flex-1 relative">
                <button
                  onClick={handleSend}
                  disabled={!title.trim() || !body.trim() || sending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Envoyer
                    </>
                  )}
                </button>
                <div className="absolute -right-2 -top-2">
                  <div className="relative group">
                    <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow cursor-help">
                      <AlertTriangle className="w-3 h-3" />
                    </div>
                    <div className="absolute right-0 top-7 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <p className="font-bold text-red-400">Attention !</p>
                      <p>Max 1-2 notifs/semaine</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowSchedule(!showSchedule)}
                disabled={!title.trim() || !body.trim()}
                className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  showSchedule
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                <Clock className="w-4 h-4" />
                {showSchedule ? 'Annuler' : 'Plus tard'}
              </button>
            </div>

            {/* Schedule Confirm */}
            <AnimatePresence>
              {showSchedule && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <button
                    onClick={handleSchedule}
                    disabled={!title.trim() || !body.trim() || scheduling}
                    className="w-full mt-2 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {scheduling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Programmation...
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" />
                        Confirmer la programmation
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Active Offer Indicator */}
          {offerActive && offerExpiresAt && (
            <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Gift className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-900 text-sm">{currentOfferTitle || 'Offre en cours'}</p>
                    <p className="text-xs text-emerald-700">
                      Jusqu&apos;à {(() => {
                        const expires = new Date(offerExpiresAt);
                        const today = new Date();
                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);

                        if (expires.toDateString() === today.toDateString()) {
                          return "ce soir";
                        } else if (expires.toDateString() === tomorrow.toDateString()) {
                          return "demain soir";
                        } else {
                          return expires.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                        }
                      })()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowOfferModal(true)}
                    className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Voir
                  </button>
                  <button
                    onClick={handleDeactivateOffer}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    Stop
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Push History — collapsed by default */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <History className="w-4 h-4 text-gray-400" />
                Historique
                {pushHistory.length > 0 && (
                  <span className="text-xs font-medium text-gray-400">({pushHistory.length})</span>
                )}
              </h2>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4">
                    {loadingHistory ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      </div>
                    ) : pushHistory.length === 0 ? (
                      <div className="text-center py-6 text-gray-400">
                        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Aucune notification envoyée</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {pushHistory.map((item) => {
                          const date = new Date(item.created_at);

                          return (
                            <div key={item.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 truncate text-sm">{item.title}</p>
                                  <p className="text-xs text-gray-600 line-clamp-1">{item.body}</p>
                                  <span className="text-[10px] text-gray-400 mt-1 block">
                                    {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-emerald-600">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span className="font-bold text-sm">{item.sent_count}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* ═══════════════ TAB: AUTOMATISATIONS ═══════════════ */}
      {activeTab === 'automations' && (
        <div className="space-y-4">
          {/* Birthday Gift Card — Always available */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
                  <Cake className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Cadeau anniversaire</h3>
                  <p className="text-[10px] text-gray-500">Envoi auto 3 jours avant, valable 14 jours</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setBirthdayGiftEnabled(!birthdayGiftEnabled);
                  if (birthdayGiftEnabled) {
                    setSavingBirthday(true);
                    fetch('/api/merchants/birthday-config', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        merchant_id: merchant?.id,
                        birthday_gift_enabled: false,
                        birthday_gift_description: birthdayGiftDescription,
                      }),
                    }).then(() => setSavingBirthday(false)).catch(() => setSavingBirthday(false));
                  }
                }}
                className={`relative w-11 h-6 rounded-full transition-colors ${birthdayGiftEnabled ? 'bg-pink-500' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${birthdayGiftEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            <AnimatePresence>
              {birthdayGiftEnabled && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description du cadeau
                      </label>
                      <textarea
                        value={birthdayGiftDescription}
                        onChange={(e) => setBirthdayGiftDescription(e.target.value)}
                        placeholder="Ex: Un brushing offert pour votre anniversaire !"
                        maxLength={200}
                        rows={2}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 resize-none"
                      />
                    </div>
                    <button
                      onClick={handleSaveBirthdayConfig}
                      disabled={savingBirthday || !birthdayGiftDescription.trim()}
                      className="w-full py-2.5 bg-pink-500 text-white font-bold text-sm rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {savingBirthday ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Sauvegarder
                        </>
                      )}
                    </button>
                    {birthdaySaveResult && (
                      <p className={`text-xs text-center font-medium ${birthdaySaveResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
                        {birthdaySaveResult.message}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Lock card — shown if < threshold */}
          {!automationsUnlocked && (
            <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-2xl border border-indigo-100/50 p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Plus d&apos;automatisations bientôt</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                Atteignez <span className="font-bold text-indigo-600">{AUTOMATION_UNLOCK_THRESHOLD} abonnés push</span> pour débloquer les automatisations avancées
              </p>
              <div className="mt-4 max-w-xs mx-auto">
                <div className="flex justify-between text-[10px] font-medium text-gray-400 mb-1">
                  <span>{subscriberCount ?? 0} abonné{(subscriberCount ?? 0) > 1 ? 's' : ''}</span>
                  <span>{AUTOMATION_UNLOCK_THRESHOLD}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${subscriberProgress * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Future automation placeholders */}
          <div className={`space-y-3 ${!automationsUnlocked ? 'opacity-50 pointer-events-none' : ''}`}>
            {[
              { icon: UserPlus, color: 'violet', title: 'Message de bienvenue', desc: 'Envoyez un message automatique aux nouveaux clients' },
              { icon: Clock, color: 'blue', title: 'Relance inactifs', desc: 'Relancez les clients qui ne sont pas venus depuis longtemps' },
              { icon: Sparkles, color: 'amber', title: 'Offre de fidélité', desc: 'Récompensez automatiquement vos clients les plus fidèles' },
            ].map((item) => {
              const colorMap: Record<string, { bg: string; text: string }> = {
                violet: { bg: 'bg-violet-50', text: 'text-violet-500' },
                blue: { bg: 'bg-blue-50', text: 'text-blue-500' },
                amber: { bg: 'bg-amber-50', text: 'text-amber-500' },
              };
              const colors = colorMap[item.color];

              return (
                <div key={item.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                      <item.icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                        <span className="text-[9px] font-bold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          Bientôt
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════ MODALS (hors onglets) ═══════════════ */}

      {/* How it works Modal */}
      <AnimatePresence>
        {showHowItWorks && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowHowItWorks(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-500" />
                  Comment ça marche ?
                </h2>
                <button onClick={() => setShowHowItWorks(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="font-semibold text-gray-900">Rédigez votre notification</p>
                    <p className="text-gray-500">Titre court et accrocheur + message clair</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="font-semibold text-gray-900">Ajoutez les détails de l&apos;offre</p>
                    <p className="text-gray-500">Description visible sur la carte fidélité du client</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="font-semibold text-gray-900">Choisissez la durée</p>
                    <p className="text-gray-500">L&apos;offre disparaît automatiquement après expiration</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">4</div>
                  <div>
                    <p className="font-semibold text-gray-900">Envoyez !</p>
                    <p className="text-gray-500">Immédiatement ou programmez pour plus tard</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="font-bold text-red-700">Important</span>
                  </div>
                  <p className="text-red-600 text-xs">
                    N&apos;envoyez pas plus de 1-2 notifications par semaine. Trop de messages = désabonnements !
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowHowItWorks(false)}
                className="w-full mt-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                J&apos;ai compris
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Offer Modal */}
      <AnimatePresence>
        {showOfferModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowOfferModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-emerald-500" />
                  Offre en cours
                </h2>
                <button onClick={() => setShowOfferModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Titre</p>
                  <p className="font-bold text-gray-900">{currentOfferTitle || '-'}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{currentOfferDescription || '-'}</p>
                </div>

                {currentOfferImageUrl && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Image</p>
                    <img
                      src={currentOfferImageUrl}
                      alt="Offre"
                      className="w-full h-40 object-cover rounded-xl"
                    />
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Expiration</p>
                  <p className="text-gray-700">
                    {offerExpiresAt ? new Date(offerExpiresAt).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowOfferModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    setShowOfferModal(false);
                    handleDeactivateOffer();
                  }}
                  className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <EyeOff className="w-4 h-4" />
                  Désactiver
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
