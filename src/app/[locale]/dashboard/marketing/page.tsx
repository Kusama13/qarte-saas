'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Send,
  MessageSquareText,
  Zap,
  HelpCircle,
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
    if (t === 'automations') return 'automations';
    if (t === 'sms') return 'sms';
    return 'push';
  })();
  const [activeTab, setActiveTab] = useState<'push' | 'sms' | 'automations'>(initialTab);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showBuyPack, setShowBuyPack] = useState(searchParams.get('pack') === 'success' ? false : false);

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
          onClick={() => setActiveTab('push')}
          className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 rounded-xl font-bold text-[13px] sm:text-sm transition-all ${
            activeTab === 'push'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Send className="w-4 h-4 shrink-0" />
          <span className="truncate">{t('tabPush')}</span>
        </button>
        <button
          onClick={() => setActiveTab('sms')}
          className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 rounded-xl font-bold text-[13px] sm:text-sm transition-all ${
            activeTab === 'sms'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <MessageSquareText className="w-4 h-4 shrink-0" />
          <span className="truncate">{t('tabSms')}</span>
        </button>
        <button
          onClick={() => setActiveTab('automations')}
          className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 rounded-xl font-bold text-[13px] sm:text-sm transition-all ${
            activeTab === 'automations'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Zap className="w-4 h-4 shrink-0" />
          <span className="truncate"><span className="sm:hidden">Auto SMS</span><span className="hidden sm:inline">{t('tabAutomations')}</span></span>
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
