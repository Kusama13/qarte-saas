'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Send,
  MessageSquareText,
  Flame,
  HelpCircle,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMerchant } from '@/contexts/MerchantContext';
import { useMarketingData, useNotificationComposer } from './hooks';
import PushTab from './PushTab';
import SmsTab from './SmsTab';
import AutomationsTab from './AutomationsTab';
import SmsBalancePanel from './SmsBalancePanel';
import BuyPackModal from './BuyPackModal';
import { HowItWorksModal, OfferModal } from './Modals';
import { getPlanFeatures, getPlanTier } from '@/lib/plan-tiers';

export default function MarketingPushPage() {
  const t = useTranslations('marketing');
  const { merchant } = useMerchant();
  const searchParams = useSearchParams();

  const initialTab = ((): 'push' | 'sms' | 'automations' => {
    const t = searchParams.get('tab');
    if (t === 'push') return 'push';
    if (t === 'sms') return 'sms';
    return 'automations';
  })();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'push' | 'sms' | 'automations'>(initialTab);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showBuyPack, setShowBuyPack] = useState(searchParams.get('buy') === '1');
  const [packBanner, setPackBanner] = useState<'success' | 'canceled' | null>(() => {
    const p = searchParams.get('pack');
    return p === 'success' || p === 'canceled' ? p : null;
  });

  // Nettoie les params transients (?pack=, ?buy=) sans recharger, pour éviter
  // que le banner / modal réapparaissent au refresh ou au partage du lien.
  useEffect(() => {
    if (packBanner || showBuyPack) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('pack');
      params.delete('buy');
      const qs = params.toString();
      router.replace(`/dashboard/marketing${qs ? `?${qs}` : ''}`, { scroll: false });
    }
    // Auto-dismiss success après 8s (cancel reste jusqu'au clic sur la croix).
    if (packBanner === 'success') {
      const timer = setTimeout(() => setPackBanner(null), 8000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = useMarketingData(merchant);
  const composer = useNotificationComposer(merchant, {
    subscriberCount: data.subscriberCount,
    setPushHistory: data.setPushHistory,
    setScheduledPushes: data.setScheduledPushes,
    setOfferActive: data.setOfferActive,
    setCurrentOfferTitle: data.setCurrentOfferTitle,
    setCurrentOfferDescription: data.setCurrentOfferDescription,
    setCurrentOfferImageUrl: data.setCurrentOfferImageUrl,
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-4 md:mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900">
            {t('title')}
          </h1>
          <p className="mt-0.5 text-xs md:text-sm text-slate-500">
            {t('subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowHowItWorks(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-600 bg-white/80 border border-indigo-100 rounded-xl hover:bg-white transition-colors shadow-sm"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('help')}</span>
        </button>
      </div>

      {/* Banner feedback achat pack (success auto-dismiss 8s, cancel persistent jusqu'au clic) */}
      {packBanner === 'success' && (
        <div className="mb-3 flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <p className="flex-1 leading-snug">{t('packSuccess')}</p>
          <button onClick={() => setPackBanner(null)} className="p-0.5 -m-0.5 rounded hover:bg-emerald-100" aria-label="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {packBanner === 'canceled' && (
        <div className="mb-3 flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm">
          <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-gray-500" />
          <p className="flex-1 leading-snug">{t('packCanceled')}</p>
          <button onClick={() => setPackBanner(null)} className="p-0.5 -m-0.5 rounded hover:bg-gray-100" aria-label="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SMS Balance Panel — masqué pour Fidélité (pas de quota marketing) */}
      {getPlanFeatures(merchant).marketingSms && (
        <SmsBalancePanel
          merchantId={merchant?.id}
          onBuyPack={() => setShowBuyPack(true)}
        />
      )}

      {/* Tab Bar */}
      <div className="flex gap-1.5 sm:gap-2 mb-4">
        <button
          onClick={() => setActiveTab('automations')}
          className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 rounded-xl font-bold text-[13px] sm:text-sm transition-all ${
            activeTab === 'automations'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Flame className="w-4 h-4 shrink-0" />
          <span className="truncate"><span className="sm:hidden">Auto SMS</span><span className="hidden sm:inline">{t('tabAutomations')}</span></span>
        </button>
        <button
          onClick={() => setActiveTab('sms')}
          className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 rounded-xl font-bold text-[13px] sm:text-sm transition-all ${
            activeTab === 'sms'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <MessageSquareText className="w-4 h-4 shrink-0" />
          <span className="truncate">{t('tabSms')}</span>
        </button>
        <button
          onClick={() => setActiveTab('push')}
          className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 rounded-xl font-bold text-[13px] sm:text-sm transition-all ${
            activeTab === 'push'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Send className="w-4 h-4 shrink-0" />
          <span className="truncate">{t('tabPush')}</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'push' && (
        <PushTab
          merchantShopName={merchant?.shop_name}
          title={composer.title}
          body={composer.body}
          sending={composer.sending}
          sendResult={composer.sendResult}
          setSendResult={composer.setSendResult}
          onTitleChange={composer.handleTitleChange}
          onBodyChange={composer.handleBodyChange}
          onSend={composer.handleSend}
          onApplyTemplate={composer.applyTemplate}
          offerDescription={composer.offerDescription}
          setOfferDescription={composer.setOfferDescription}
          offerImageUrl={composer.offerImageUrl}
          setOfferImageUrl={composer.setOfferImageUrl}
          offerDurationType={composer.offerDurationType}
          setOfferDurationType={composer.setOfferDurationType}
          offerCustomDate={composer.offerCustomDate}
          setOfferCustomDate={composer.setOfferCustomDate}
          uploadingImage={composer.uploadingImage}
          showImageOption={composer.showImageOption}
          setShowImageOption={composer.setShowImageOption}
          showOfferDetails={composer.showOfferDetails}
          setShowOfferDetails={composer.setShowOfferDetails}
          onImageUpload={composer.handleImageUpload}
          offerActive={data.offerActive}
          offerExpiresAt={data.offerExpiresAt}
          currentOfferTitle={data.currentOfferTitle}
          onDeactivateOffer={data.handleDeactivateOffer}
          onShowOfferModal={() => setShowOfferModal(true)}
          showSchedule={composer.showSchedule}
          setShowSchedule={composer.setShowSchedule}
          scheduleDate={composer.scheduleDate}
          setScheduleDate={composer.setScheduleDate}
          scheduleTime={composer.scheduleTime}
          setScheduleTime={composer.setScheduleTime}
          scheduling={composer.scheduling}
          onSchedule={composer.handleSchedule}
          scheduledPushes={data.scheduledPushes}
          loadingScheduled={data.loadingScheduled}
          onCancelScheduled={data.handleCancelScheduled}
          pushHistory={data.pushHistory}
          loadingHistory={data.loadingHistory}
          subscriberCount={data.subscriberCount}
          subscribers={data.subscribers}
          loadingCount={data.loadingCount}
          merchantId={merchant?.id}
        />
      )}

      {activeTab === 'sms' && <SmsTab />}

      {activeTab === 'automations' && (
        <AutomationsTab
          merchantId={merchant?.id}
          shopName={merchant?.shop_name || 'Ton Salon'}
          planTier={getPlanTier(merchant)}
          subscriptionStatus={merchant?.subscription_status ?? null}
        />
      )}

      {/* Modals */}
      <BuyPackModal open={showBuyPack} onClose={() => setShowBuyPack(false)} />
      <HowItWorksModal show={showHowItWorks} onClose={() => setShowHowItWorks(false)} />
      <OfferModal
        show={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        title={data.currentOfferTitle}
        description={data.currentOfferDescription}
        imageUrl={data.currentOfferImageUrl}
        expiresAt={data.offerExpiresAt}
        onDeactivate={data.handleDeactivateOffer}
      />
    </div>
  );
}
