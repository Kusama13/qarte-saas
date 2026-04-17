import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { compressOfferImage } from '@/lib/image-compression';
import { formatTime } from '@/lib/utils';
import type {
  Subscriber,
  PushHistoryItem,
  ScheduledPush,
  SendResult,
  NotificationTemplate,
} from './types';
import {
  containsForbiddenWords,
  generateOfferDescription,
} from './types';

interface MerchantData {
  id: string;
  shop_name?: string;
}

export function useMarketingData(merchant: MerchantData | null) {
  // Subscribers
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingCount, setLoadingCount] = useState(true);

  // Push history
  const [pushHistory, setPushHistory] = useState<PushHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Scheduled pushes
  const [scheduledPushes, setScheduledPushes] = useState<ScheduledPush[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(true);

  // Current offer
  const [offerActive, setOfferActive] = useState(false);
  const [offerExpiresAt, setOfferExpiresAt] = useState<string | null>(null);
  const [currentOfferTitle, setCurrentOfferTitle] = useState('');
  const [currentOfferDescription, setCurrentOfferDescription] = useState('');
  const [currentOfferImageUrl, setCurrentOfferImageUrl] = useState<string | null>(null);

  // Fetch subscribers
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

  // Fetch current offer
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

  return {
    subscriberCount,
    subscribers,
    loadingCount,
    pushHistory,
    setPushHistory,
    loadingHistory,
    scheduledPushes,
    setScheduledPushes,
    loadingScheduled,
    offerActive,
    setOfferActive,
    offerExpiresAt,
    currentOfferTitle,
    setCurrentOfferTitle,
    currentOfferDescription,
    setCurrentOfferDescription,
    currentOfferImageUrl,
    setCurrentOfferImageUrl,
    handleCancelScheduled,
    handleDeactivateOffer,
  };
}

export function useNotificationComposer(merchant: MerchantData | null, deps: {
  subscriberCount: number | null;
  setPushHistory: (fn: (prev: PushHistoryItem[]) => PushHistoryItem[]) => void;
  setScheduledPushes: (fn: (prev: ScheduledPush[]) => ScheduledPush[]) => void;
  setOfferActive: (v: boolean) => void;
  setCurrentOfferTitle: (v: string) => void;
  setCurrentOfferDescription: (v: string) => void;
  setCurrentOfferImageUrl: (v: string | null) => void;
}) {
  const locale = useLocale();
  const tMarketing = useTranslations('marketing');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);

  // Scheduling
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState<'10:00' | '18:00'>('10:00');
  const [scheduling, setScheduling] = useState(false);

  // Offer composer
  const [offerDescription, setOfferDescription] = useState('');
  const [offerImageUrl, setOfferImageUrl] = useState('');
  const [offerDurationType, setOfferDurationType] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [offerCustomDate, setOfferCustomDate] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageOption, setShowImageOption] = useState(false);
  const [showOfferDetails, setShowOfferDetails] = useState(false);

  // Set default schedule date
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setScheduleDate(today);
  }, []);

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

  const applyTemplate = (template: NotificationTemplate) => {
    setTitle(template.title);
    setBody(template.body);
    setOfferDescription(template.offerDescription);
    setSendResult(null);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!offerDescription || offerDescription === generateOfferDescription(title, body, tMarketing)) {
      setOfferDescription(generateOfferDescription(newTitle, body, tMarketing));
    }
  };

  const handleBodyChange = (newBody: string) => {
    setBody(newBody);
    if (!offerDescription || offerDescription === generateOfferDescription(title, body, tMarketing)) {
      setOfferDescription(generateOfferDescription(title, newBody, tMarketing));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !merchant?.id) return;
    setUploadingImage(true);
    try {
      const compressedFile = await compressOfferImage(file);
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('merchantId', merchant.id);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (response.ok && data.url) {
        setOfferImageUrl(data.url);
      } else {
        setSendResult({ success: false, message: data.error || 'Erreur lors de l\'upload' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setSendResult({ success: false, message: 'Erreur lors de l\'upload' });
    } finally {
      setUploadingImage(false);
    }
  };

  const resetComposer = () => {
    setTitle('');
    setBody('');
    setOfferDescription('');
    setOfferImageUrl('');
  };

  const saveOffer = async (): Promise<boolean> => {
    if (!offerDescription.trim() || !merchant?.id) return false;
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
      deps.setOfferActive(true);
      deps.setCurrentOfferTitle(title.trim());
      deps.setCurrentOfferDescription(offerDescription.trim());
      deps.setCurrentOfferImageUrl(offerImageUrl.trim() || null);
      return true;
    }
    return false;
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim() || !merchant?.id) return;
    const allText = `${title} ${body} ${offerDescription}`;
    const forbiddenWord = containsForbiddenWords(allText);
    if (forbiddenWord) {
      setSendResult({ success: false, message: tMarketing('send.forbiddenContentDetected', { forbiddenWord }) });
      return;
    }
    setSending(true);
    setSendResult(null);
    try {
      const offerSaved = await saveOffer();
      if (deps.subscriberCount && deps.subscriberCount > 0) {
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
          resetComposer();
          const historyResponse = await fetch(`/api/push/history?merchantId=${merchant.id}&limit=10`);
          const historyData = await historyResponse.json();
          if (historyResponse.ok) {
            deps.setPushHistory(() => historyData.history || []);
          }
        } else {
          setSendResult({ success: false, message: data.error || 'Erreur lors de l\'envoi' });
        }
      } else {
        if (offerSaved) {
          setSendResult({ success: true, sent: 0, message: 'Offre publiée ! Aucun abonné push pour le moment.' });
          resetComposer();
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
    const allText = `${title} ${body} ${offerDescription}`;
    const forbiddenWord = containsForbiddenWords(allText);
    if (forbiddenWord) {
      setSendResult({ success: false, message: tMarketing('send.forbiddenContentDetected', { forbiddenWord }) });
      return;
    }
    setScheduling(true);
    try {
      await saveOffer();
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
        setSendResult({ success: true, message: locale === 'en' ? `Scheduled for ${formatTime(scheduleTime, 'en')}` : `Programmé pour ${formatTime(scheduleTime, 'fr')}` });
        resetComposer();
        setShowSchedule(false);
        const scheduledResponse = await fetch(`/api/push/schedule?merchantId=${merchant.id}`);
        const scheduledData = await scheduledResponse.json();
        if (scheduledResponse.ok) {
          deps.setScheduledPushes(() => scheduledData.scheduled || []);
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

  return {
    title,
    body,
    sending,
    sendResult,
    setSendResult,
    showSchedule,
    setShowSchedule,
    scheduleDate,
    setScheduleDate,
    scheduleTime,
    setScheduleTime,
    scheduling,
    offerDescription,
    setOfferDescription,
    offerImageUrl,
    setOfferImageUrl,
    offerDurationType,
    setOfferDurationType,
    offerCustomDate,
    setOfferCustomDate,
    uploadingImage,
    showImageOption,
    setShowImageOption,
    showOfferDetails,
    setShowOfferDetails,
    applyTemplate,
    handleTitleChange,
    handleBodyChange,
    handleImageUpload,
    handleSend,
    handleSchedule,
  };
}
