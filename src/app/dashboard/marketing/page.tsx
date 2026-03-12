'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Send,
  Megaphone,
  Zap,
  Lock,
  HelpCircle,
} from 'lucide-react';
import { useMerchant } from '@/contexts/MerchantContext';
import { AUTOMATION_UNLOCK_THRESHOLD } from './types';
import { useMarketingData, useNotificationComposer } from './hooks';
import SubscriberRing from './SubscriberRing';
import SendTab from './SendTab';
import AutomationsTab from './AutomationsTab';
import { HowItWorksModal, OfferModal } from './Modals';

export default function MarketingPushPage() {
  const { merchant } = useMerchant();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'send' | 'automations'>(
    searchParams.get('tab') === 'automations' ? 'automations' : 'send'
  );
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);

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

  const automationsUnlocked = (data.subscriberCount ?? 0) >= AUTOMATION_UNLOCK_THRESHOLD;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between p-4 md:p-6 rounded-2xl bg-[#4b0082]/[0.04] border border-[#4b0082]/[0.08]">
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#4b0082] to-violet-600">
            Notifications
          </h1>
          <p className="mt-1 text-sm md:text-base text-gray-500 font-medium">
            Notifications push & automatisations
          </p>
        </div>
        <button
          onClick={() => setShowHowItWorks(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-600 bg-white/80 border border-indigo-100 rounded-xl hover:bg-white transition-colors shadow-sm"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Aide</span>
        </button>
      </div>

      {/* Subscriber Ring */}
      <SubscriberRing
        subscriberCount={data.subscriberCount}
        subscribers={data.subscribers}
        loadingCount={data.loadingCount}
      />

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

      {/* Tab Content */}
      {activeTab === 'send' && (
        <SendTab
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
        />
      )}

      {activeTab === 'automations' && (
        <AutomationsTab
          merchantId={merchant?.id}
          subscriberCount={data.subscriberCount}
          birthdayGiftEnabled={data.birthdayGiftEnabled}
          birthdayGiftDescription={data.birthdayGiftDescription}
          setBirthdayGiftDescription={data.setBirthdayGiftDescription}
          savingBirthday={data.savingBirthday}
          birthdaySaveResult={data.birthdaySaveResult}
          onSaveBirthdayConfig={data.handleSaveBirthdayConfig}
          onToggleBirthday={data.handleToggleBirthday}
        />
      )}

      {/* Modals */}
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
