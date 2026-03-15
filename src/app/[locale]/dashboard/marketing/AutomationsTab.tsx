'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  CheckCircle2,
  Sparkles,
  Lock,
  Clock,
  Cake,
  CalendarDays,
  Gift,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AUTOMATION_UNLOCK_THRESHOLD } from './types';
import type { BirthdaySaveResult } from './types';

interface AutomationSettings {
  inactive_reminder_enabled: boolean;
  inactive_reminder_offer_text: string | null;
  reward_reminder_enabled: boolean;
  events_enabled: boolean;
  events_offer_text: string | null;
  inactive_reminder_sent: number;
  reward_reminder_sent: number;
  events_sent: number;
}

interface AutomationsTabProps {
  subscriberCount: number | null;
  merchantId?: string;
  birthdayGiftEnabled: boolean;
  birthdayGiftDescription: string;
  setBirthdayGiftDescription: (v: string) => void;
  savingBirthday: boolean;
  birthdaySaveResult: BirthdaySaveResult | null;
  onSaveBirthdayConfig: () => void;
  onToggleBirthday: () => void;
}

const SIMPLE_AUTOMATIONS = [
  {
    id: 'reward_reminder_enabled' as const,
    sentKey: 'reward_reminder_sent' as const,
    title: 'Rappel récompense',
    desc: 'Push aux clients avec une récompense non récupérée depuis 7 jours',
    icon: Gift,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-500',
    toggleColor: 'bg-amber-500',
  },
];

export default function AutomationsTab({
  subscriberCount,
  merchantId,
  birthdayGiftEnabled,
  birthdayGiftDescription,
  setBirthdayGiftDescription,
  savingBirthday,
  birthdaySaveResult,
  onSaveBirthdayConfig,
  onToggleBirthday,
}: AutomationsTabProps) {
  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [eventsOfferText, setEventsOfferText] = useState('');
  const [savingEvents, setSavingEvents] = useState(false);
  const [eventsSaveResult, setEventsSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [inactiveOfferText, setInactiveOfferText] = useState('');
  const [savingInactive, setSavingInactive] = useState(false);
  const [inactiveSaveResult, setInactiveSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  const automationsUnlocked = isAdmin || (subscriberCount ?? 0) >= AUTOMATION_UNLOCK_THRESHOLD;
  const subscriberProgress = Math.min((subscriberCount ?? 0) / AUTOMATION_UNLOCK_THRESHOLD, 1);

  // Fetch automation settings
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
          if (data.isAdmin) setIsAdmin(true);
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
      if (res.ok && data.settings) {
        setSettings(data.settings);
      }
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
        setEventsSaveResult({ success: true, message: 'Sauvegardé !' });
      } else {
        setEventsSaveResult({ success: false, message: 'Erreur' });
      }
    } catch {
      setEventsSaveResult({ success: false, message: 'Erreur de connexion' });
    }
    setSavingEvents(false);
    setTimeout(() => setEventsSaveResult(null), 3000);
  }, [merchantId, eventsOfferText]);

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
        setInactiveSaveResult({ success: true, message: 'Sauvegardé !' });
      } else {
        setInactiveSaveResult({ success: false, message: 'Erreur' });
      }
    } catch {
      setInactiveSaveResult({ success: false, message: 'Erreur de connexion' });
    }
    setSavingInactive(false);
    setTimeout(() => setInactiveSaveResult(null), 3000);
  }, [merchantId, inactiveOfferText]);

  return (
    <div className="space-y-4">
      {/* Birthday Gift Card */}
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
            role="switch"
            aria-checked={birthdayGiftEnabled}
            aria-label="Activer ou désactiver le cadeau anniversaire"
            onClick={onToggleBirthday}
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
                    placeholder="Ex: Un brushing offert pour ton anniversaire !"
                    maxLength={200}
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 resize-none"
                  />
                </div>
                <button
                  onClick={onSaveBirthdayConfig}
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

      {/* Lock card */}
      {!automationsUnlocked && (
        <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-2xl border border-indigo-100/50 p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-7 h-7 text-indigo-400" />
          </div>
          <h3 className="font-bold text-gray-900 text-sm">Automatisations push</h3>
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

      {/* Push Automations */}
      <div className={`space-y-3 ${!automationsUnlocked ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Section header */}
        <div className="flex items-center gap-2 px-1">
          <Zap className="w-4 h-4 text-gray-400" />
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Automations push</h2>
        </div>

        {/* Relance inactifs (with offer text) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900">Relance inactifs</h3>
                  {(settings?.inactive_reminder_sent ?? 0) > 0 && (
                    <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {settings?.inactive_reminder_sent} envoyée{(settings?.inactive_reminder_sent ?? 0) > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">Push aux clients qui ne sont pas venus depuis 30 jours</p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={settings?.inactive_reminder_enabled ?? false}
              aria-label="Activer ou désactiver la relance des clients inactifs"
              onClick={() => toggleAutomation('inactive_reminder_enabled', settings?.inactive_reminder_enabled ?? false)}
              disabled={loading || updating === 'inactive_reminder_enabled'}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Ton offre de relance (optionnel)
                    </label>
                    <textarea
                      value={inactiveOfferText}
                      onChange={(e) => setInactiveOfferText(e.target.value)}
                      placeholder="Ex: -15% pour ton retour !"
                      maxLength={200}
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Sans offre : &quot;{'{'}boutique{'}'} te manque ! Revenez vite.&quot;
                    </p>
                  </div>
                  <button
                    onClick={saveInactiveConfig}
                    disabled={savingInactive}
                    className="w-full py-2.5 bg-blue-500 text-white font-bold text-sm rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingInactive ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Sauvegarder
                      </>
                    )}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${automation.bgColor} flex items-center justify-center`}>
                    <automation.icon className={`w-5 h-5 ${automation.textColor}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900">{automation.title}</h3>
                      {sentCount > 0 && (
                        <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                          {sentCount} envoyée{sentCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">{automation.desc}</p>
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={isEnabled}
                  aria-label={`Activer ou désactiver ${automation.title}`}
                  onClick={() => toggleAutomation(automation.id, isEnabled)}
                  disabled={loading || isUpdating}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
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

        {/* Événements card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900">Événements</h3>
                  {(settings?.events_sent ?? 0) > 0 && (
                    <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {settings?.events_sent} envoyée{(settings?.events_sent ?? 0) > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">Push auto 7j avant Noël, Pâques, Saint-Valentin...</p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={settings?.events_enabled ?? false}
              aria-label="Activer ou désactiver les notifications push pour les événements"
              onClick={() => toggleAutomation('events_enabled', settings?.events_enabled ?? false)}
              disabled={loading || updating === 'events_enabled'}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Ton offre pour les événements
                    </label>
                    <textarea
                      value={eventsOfferText}
                      onChange={(e) => setEventsOfferText(e.target.value)}
                      placeholder="Ex: -10% pour fêter ça !"
                      maxLength={200}
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none"
                    />
                  </div>
                  <button
                    onClick={saveEventsConfig}
                    disabled={savingEvents || !eventsOfferText.trim()}
                    className="w-full py-2.5 bg-violet-500 text-white font-bold text-sm rounded-xl hover:bg-violet-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingEvents ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Sauvegarder
                      </>
                    )}
                  </button>
                  {eventsSaveResult && (
                    <p className={`text-xs text-center font-medium ${eventsSaveResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
                      {eventsSaveResult.message}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400">
                    Noël, Pâques, Saint-Valentin, Fête des mères, Fête des pères, Halloween, Black Friday
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info box */}
        <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
          <p className="text-xs text-indigo-700 font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            Les automations push s&apos;exécutent chaque matin à 9h automatiquement.
          </p>
        </div>
      </div>
    </div>
  );
}
