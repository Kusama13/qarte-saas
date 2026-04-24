'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  CheckCircle2,
  Flower2,
  Clock,
  CalendarDays,
  Gift,
  Flame,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';

interface PushAutomationSettings {
  inactive_reminder_enabled: boolean;
  inactive_reminder_offer_text: string | null;
  reward_reminder_enabled: boolean;
  events_enabled: boolean;
  events_offer_text: string | null;
  inactive_reminder_sent: number;
  reward_reminder_sent: number;
  events_sent: number;
}

interface PushAutomationsProps {
  merchantId?: string;
}

const SIMPLE_AUTOMATIONS = [
  {
    id: 'reward_reminder_enabled' as const,
    sentKey: 'reward_reminder_sent' as const,
    titleKey: 'rewardReminder' as const,
    descKey: 'rewardReminderDesc' as const,
    icon: Gift,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-500',
    toggleColor: 'bg-amber-500',
  },
];

export default function PushAutomations({ merchantId }: PushAutomationsProps) {
  const t = useTranslations('marketing.automations');
  const [settings, setSettings] = useState<PushAutomationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [eventsOfferText, setEventsOfferText] = useState('');
  const [savingEvents, setSavingEvents] = useState(false);
  const [eventsSaveResult, setEventsSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [inactiveOfferText, setInactiveOfferText] = useState('');
  const [savingInactive, setSavingInactive] = useState(false);
  const [inactiveSaveResult, setInactiveSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!merchantId) { setLoading(false); return; }
      try {
        const res = await fetch(`/api/push/automations?merchantId=${merchantId}`);
        const data = await res.json();
        if (res.ok && data.settings) {
          setSettings(data.settings);
          setEventsOfferText(data.settings.events_offer_text || '');
          setInactiveOfferText(data.settings.inactive_reminder_offer_text || '');
        }
      } catch {
        // silent
      }
      setLoading(false);
    };
    fetchSettings();
  }, [merchantId]);

  const toggleAutomation = useCallback(async (field: string, currentValue: boolean) => {
    if (!merchantId) return;
    setUpdating(field);
    try {
      const res = await fetch('/api/push/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, [field]: !currentValue }),
      });
      const data = await res.json();
      if (res.ok && data.settings) setSettings(data.settings);
    } catch {
      // silent
    }
    setUpdating(null);
  }, [merchantId]);

  const saveEventsConfig = useCallback(async () => {
    if (!merchantId) return;
    setSavingEvents(true);
    setEventsSaveResult(null);
    try {
      const res = await fetch('/api/push/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, events_offer_text: eventsOfferText }),
      });
      const data = await res.json();
      if (res.ok && data.settings) {
        setSettings(data.settings);
        setEventsSaveResult({ success: true, message: t('saved') });
      } else {
        setEventsSaveResult({ success: false, message: t('errorGeneric') });
      }
    } catch {
      setEventsSaveResult({ success: false, message: t('errorConnection') });
    }
    setSavingEvents(false);
    setTimeout(() => setEventsSaveResult(null), 3000);
  }, [merchantId, eventsOfferText, t]);

  const saveInactiveConfig = useCallback(async () => {
    if (!merchantId) return;
    setSavingInactive(true);
    setInactiveSaveResult(null);
    try {
      const res = await fetch('/api/push/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, inactive_reminder_offer_text: inactiveOfferText }),
      });
      const data = await res.json();
      if (res.ok && data.settings) {
        setSettings(data.settings);
        setInactiveSaveResult({ success: true, message: t('saved') });
      } else {
        setInactiveSaveResult({ success: false, message: t('errorGeneric') });
      }
    } catch {
      setInactiveSaveResult({ success: false, message: t('errorConnection') });
    }
    setSavingInactive(false);
    setTimeout(() => setInactiveSaveResult(null), 3000);
  }, [merchantId, inactiveOfferText, t]);

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center gap-2 px-1">
        <Flame className="w-4 h-4 text-gray-400" />
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('pushAutomationsHeader')}</h2>
      </div>

      {/* Relance inactifs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-gray-900">{t('inactiveReminder')}</h3>
                {(settings?.inactive_reminder_sent ?? 0) > 0 && (
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    {t('sent', { count: settings?.inactive_reminder_sent ?? 0 })}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{t('inactiveReminderDesc')}</p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={settings?.inactive_reminder_enabled ?? false}
            aria-label={t('toggleInactive')}
            onClick={() => toggleAutomation('inactive_reminder_enabled', settings?.inactive_reminder_enabled ?? false)}
            disabled={loading || updating === 'inactive_reminder_enabled'}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
              settings?.inactive_reminder_enabled ? 'bg-blue-500' : 'bg-gray-200'
            } ${loading || updating === 'inactive_reminder_enabled' ? 'opacity-50' : ''}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform flex items-center justify-center ${
              settings?.inactive_reminder_enabled ? 'translate-x-5' : ''
            }`}>
              {updating === 'inactive_reminder_enabled' && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
            </div>
          </button>
        </div>

        <AnimatePresence>
          {settings?.inactive_reminder_enabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('inactiveOfferLabel')}</label>
                  <textarea
                    value={inactiveOfferText}
                    onChange={(e) => setInactiveOfferText(e.target.value)}
                    placeholder={t('inactiveOfferPlaceholder')}
                    maxLength={200}
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    {t('inactiveDefaultMessage', { shop: '{boutique}' })}
                  </p>
                </div>
                <button
                  onClick={saveInactiveConfig}
                  disabled={savingInactive}
                  className="w-full py-2.5 bg-[#4b0082] hover:bg-[#4b0082]/90 text-white font-bold text-sm rounded-xl active:scale-[0.98] touch-manipulation transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingInactive ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" />{t('save')}</>}
                </button>
                {inactiveSaveResult && (
                  <p className={`text-xs text-center font-medium ${inactiveSaveResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {inactiveSaveResult.message}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rappel récompense */}
      {SIMPLE_AUTOMATIONS.map((automation) => {
        const isEnabled = settings?.[automation.id] ?? false;
        const sentCount = settings?.[automation.sentKey] ?? 0;
        const isUpdating = updating === automation.id;
        return (
          <div key={automation.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-xl ${automation.bgColor} flex items-center justify-center shrink-0`}>
                  <automation.icon className={`w-5 h-5 ${automation.textColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-gray-900">{t(automation.titleKey)}</h3>
                    {sentCount > 0 && (
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        {t('sent', { count: sentCount })}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{t(automation.descKey)}</p>
                </div>
              </div>
              <button
                role="switch"
                aria-checked={isEnabled}
                aria-label={t(automation.titleKey)}
                onClick={() => toggleAutomation(automation.id, isEnabled)}
                disabled={loading || isUpdating}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                  isEnabled ? automation.toggleColor : 'bg-gray-200'
                } ${loading || isUpdating ? 'opacity-50' : ''}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform flex items-center justify-center ${
                  isEnabled ? 'translate-x-5' : ''
                }`}>
                  {isUpdating && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                </div>
              </button>
            </div>
          </div>
        );
      })}

      {/* Événements push */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5 text-violet-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-gray-900">{t('events')}</h3>
                {(settings?.events_sent ?? 0) > 0 && (
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    {t('sent', { count: settings?.events_sent ?? 0 })}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{t('eventsDesc')}</p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={settings?.events_enabled ?? false}
            aria-label={t('toggleEvents')}
            onClick={() => toggleAutomation('events_enabled', settings?.events_enabled ?? false)}
            disabled={loading || updating === 'events_enabled'}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
              settings?.events_enabled ? 'bg-violet-500' : 'bg-gray-200'
            } ${loading || updating === 'events_enabled' ? 'opacity-50' : ''}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform flex items-center justify-center ${
              settings?.events_enabled ? 'translate-x-5' : ''
            }`}>
              {updating === 'events_enabled' && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
            </div>
          </button>
        </div>

        <AnimatePresence>
          {settings?.events_enabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('eventsOfferLabel')}</label>
                  <textarea
                    value={eventsOfferText}
                    onChange={(e) => setEventsOfferText(e.target.value)}
                    placeholder={t('eventsOfferPlaceholder')}
                    maxLength={200}
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none"
                  />
                </div>
                <button
                  onClick={saveEventsConfig}
                  disabled={savingEvents || !eventsOfferText.trim()}
                  className="w-full py-2.5 bg-[#4b0082] hover:bg-[#4b0082]/90 text-white font-bold text-sm rounded-xl active:scale-[0.98] touch-manipulation transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingEvents ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" />{t('save')}</>}
                </button>
                {eventsSaveResult && (
                  <p className={`text-xs text-center font-medium ${eventsSaveResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {eventsSaveResult.message}
                  </p>
                )}
                <p className="text-[10px] text-gray-400">{t('eventsList')}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
        <p className="text-xs text-slate-600 flex items-center gap-2">
          <Flower2 className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={2.25} />
          {t('infoAutoRun')}
        </p>
      </div>
    </div>
  );
}
