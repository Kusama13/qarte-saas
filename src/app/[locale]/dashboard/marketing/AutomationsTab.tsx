'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  CheckCircle2,
  Clock,
  Sunrise,
  HandHeart,
  Star,
  CalendarDays,
  MessageSquareText,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';

interface AutomationsTabProps {
  merchantId?: string;
}

interface SmsSettings {
  reminder_j1_enabled: boolean;
  reminder_j0_enabled: boolean;
  welcome_sms_enabled: boolean;
  post_visit_review_enabled: boolean;
  events_sms_enabled: boolean;
  events_sms_offer_text: string | null;
}

type SmsToggleField = 'reminder_j1_enabled' | 'reminder_j0_enabled' | 'welcome_sms_enabled' | 'post_visit_review_enabled' | 'events_sms_enabled';

type SmsCardCategory = 'transactional' | 'marketing';

function SmsAutomationCard({
  title,
  desc,
  icon: Icon,
  category,
  field,
  enabled,
  loading,
  updating,
  onToggle,
  t,
}: {
  title: string;
  desc: string;
  icon: typeof Clock;
  category: SmsCardCategory;
  field: SmsToggleField;
  enabled: boolean;
  loading: boolean;
  updating: string | null;
  onToggle: (field: SmsToggleField, current: boolean) => void;
  t: (key: string) => string;
}) {
  const isTx = category === 'transactional';
  const iconBg = isTx ? 'bg-sky-50' : 'bg-[#4b0082]/[0.08]';
  const iconColor = isTx ? 'text-sky-500' : 'text-[#4b0082]';
  const badgeClass = isTx
    ? 'text-sky-600 bg-sky-50 border-sky-100'
    : 'text-[#4b0082] bg-[#4b0082]/[0.08] border-[#4b0082]/20';
  const toggleBg = isTx ? 'bg-sky-500' : 'bg-[#4b0082]';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-gray-900">{title}</h3>
              <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap ${badgeClass}`}>
                {isTx ? t('badgeTransactional') : t('badgeMarketing')}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{desc}</p>
          </div>
        </div>
        <button
          role="switch"
          aria-checked={enabled}
          aria-label={title}
          onClick={() => onToggle(field, enabled)}
          disabled={loading || updating === field}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
            enabled ? toggleBg : 'bg-gray-200'
          } ${loading || updating === field ? 'opacity-50' : ''}`}
        >
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform flex items-center justify-center ${
            enabled ? 'translate-x-5' : ''
          }`}>
            {updating === field && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
          </div>
        </button>
      </div>
    </div>
  );
}

export default function AutomationsTab({ merchantId }: AutomationsTabProps) {
  const t = useTranslations('marketing.automations');
  const [smsSettings, setSmsSettings] = useState<SmsSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const [eventsSmsOfferText, setEventsSmsOfferText] = useState('');
  const [savingEventsSms, setSavingEventsSms] = useState(false);
  const [eventsSmsSaveResult, setEventsSmsSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!merchantId) { setLoading(false); return; }
      try {
        const res = await fetch(`/api/sms/automations?merchantId=${merchantId}`);
        const data = await res.json();
        if (res.ok && data.settings) {
          setSmsSettings({
            reminder_j1_enabled: !!data.settings.reminder_j1_enabled,
            reminder_j0_enabled: !!data.settings.reminder_j0_enabled,
            welcome_sms_enabled: !!data.settings.welcome_sms_enabled,
            post_visit_review_enabled: !!data.settings.post_visit_review_enabled,
            events_sms_enabled: !!data.settings.events_sms_enabled,
            events_sms_offer_text: data.settings.events_sms_offer_text || null,
          });
          setEventsSmsOfferText(data.settings.events_sms_offer_text || '');
        }
      } catch {
        // silent
      }
      setLoading(false);
    };
    fetchSettings();
  }, [merchantId]);

  const toggleSmsAutomation = useCallback(async (field: SmsToggleField, currentValue: boolean) => {
    if (!merchantId) return;
    setUpdating(field);
    try {
      const res = await fetch('/api/sms/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, [field]: !currentValue }),
      });
      const data = await res.json();
      if (res.ok && data.settings) {
        setSmsSettings({
          reminder_j1_enabled: !!data.settings.reminder_j1_enabled,
          reminder_j0_enabled: !!data.settings.reminder_j0_enabled,
          welcome_sms_enabled: !!data.settings.welcome_sms_enabled,
          post_visit_review_enabled: !!data.settings.post_visit_review_enabled,
          events_sms_enabled: !!data.settings.events_sms_enabled,
          events_sms_offer_text: data.settings.events_sms_offer_text || null,
        });
      }
    } catch {
      // silent
    }
    setUpdating(null);
  }, [merchantId]);

  const saveEventsSmsConfig = useCallback(async () => {
    if (!merchantId) return;
    setSavingEventsSms(true);
    setEventsSmsSaveResult(null);
    try {
      const res = await fetch('/api/sms/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, events_sms_offer_text: eventsSmsOfferText.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.settings) {
        setSmsSettings((prev) => prev ? { ...prev, events_sms_offer_text: data.settings.events_sms_offer_text || null } : prev);
        setEventsSmsSaveResult({ success: true, message: t('saved') });
      } else {
        setEventsSmsSaveResult({ success: false, message: t('errorGeneric') });
      }
    } catch {
      setEventsSmsSaveResult({ success: false, message: t('errorConnection') });
    }
    setSavingEventsSms(false);
    setTimeout(() => setEventsSmsSaveResult(null), 3000);
  }, [merchantId, eventsSmsOfferText, t]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <MessageSquareText className="w-4 h-4 text-gray-400" />
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('smsAutomationsHeader')}</h2>
      </div>

      <SmsAutomationCard
        title={t('reminderJ1')}
        desc={t('reminderJ1Desc')}
        icon={Clock}
        category="transactional"
        field="reminder_j1_enabled"
        enabled={smsSettings?.reminder_j1_enabled ?? false}
        loading={loading}
        updating={updating}
        onToggle={toggleSmsAutomation}
        t={t}
      />

      <SmsAutomationCard
        title={t('reminderJ0')}
        desc={t('reminderJ0Desc')}
        icon={Sunrise}
        category="transactional"
        field="reminder_j0_enabled"
        enabled={smsSettings?.reminder_j0_enabled ?? false}
        loading={loading}
        updating={updating}
        onToggle={toggleSmsAutomation}
        t={t}
      />

      <SmsAutomationCard
        title={t('welcomeSms')}
        desc={t('welcomeSmsDesc')}
        icon={HandHeart}
        category="marketing"
        field="welcome_sms_enabled"
        enabled={smsSettings?.welcome_sms_enabled ?? false}
        loading={loading}
        updating={updating}
        onToggle={toggleSmsAutomation}
        t={t}
      />

      <SmsAutomationCard
        title={t('reviewSms')}
        desc={t('reviewSmsDesc')}
        icon={Star}
        category="marketing"
        field="post_visit_review_enabled"
        enabled={smsSettings?.post_visit_review_enabled ?? false}
        loading={loading}
        updating={updating}
        onToggle={toggleSmsAutomation}
        t={t}
      />

      {/* Événements SMS (Saint-Valentin, Noël, etc.) — avec config du texte d'offre */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#4b0082]/[0.08] flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5 text-[#4b0082]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-gray-900">{t('eventsSms')}</h3>
                <span className="text-[9px] font-bold text-[#4b0082] bg-[#4b0082]/[0.08] border border-[#4b0082]/20 px-1.5 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap">
                  {t('badgeMarketing')}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{t('eventsSmsDesc')}</p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={smsSettings?.events_sms_enabled ?? false}
            aria-label={t('eventsSms')}
            onClick={() => toggleSmsAutomation('events_sms_enabled', smsSettings?.events_sms_enabled ?? false)}
            disabled={loading || updating === 'events_sms_enabled'}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
              smsSettings?.events_sms_enabled ? 'bg-[#4b0082]' : 'bg-gray-200'
            } ${loading || updating === 'events_sms_enabled' ? 'opacity-50' : ''}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform flex items-center justify-center ${
              smsSettings?.events_sms_enabled ? 'translate-x-5' : ''
            }`}>
              {updating === 'events_sms_enabled' && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
            </div>
          </button>
        </div>

        <AnimatePresence>
          {smsSettings?.events_sms_enabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('eventsSmsOfferLabel')}</label>
                  <textarea
                    value={eventsSmsOfferText}
                    onChange={(e) => setEventsSmsOfferText(e.target.value)}
                    placeholder={t('eventsSmsOfferPlaceholder')}
                    maxLength={200}
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#4b0082]/20 focus:border-[#4b0082] resize-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">{t('eventsSmsList')}</p>
                </div>
                <button
                  onClick={saveEventsSmsConfig}
                  disabled={savingEventsSms || !eventsSmsOfferText.trim()}
                  className="w-full py-2.5 bg-[#4b0082] text-white font-bold text-sm rounded-xl hover:bg-[#3a0063] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingEventsSms ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" />{t('save')}</>}
                </button>
                {eventsSmsSaveResult && (
                  <p className={`text-xs text-center font-medium ${eventsSmsSaveResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {eventsSmsSaveResult.message}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
