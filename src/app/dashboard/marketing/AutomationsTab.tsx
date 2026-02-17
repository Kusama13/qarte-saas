'use client';

import {
  Loader2,
  CheckCircle2,
  Sparkles,
  Lock,
  UserPlus,
  Clock,
  Cake,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AUTOMATION_UNLOCK_THRESHOLD } from './types';
import type { BirthdaySaveResult } from './types';

const FUTURE_AUTOMATIONS = [
  { icon: UserPlus, color: 'violet', title: 'Message de bienvenue', desc: 'Envoyez un message automatique aux nouveaux clients' },
  { icon: Clock, color: 'blue', title: 'Relance inactifs', desc: 'Relancez les clients qui ne sont pas venus depuis longtemps' },
  { icon: Sparkles, color: 'amber', title: 'Offre de fidélité', desc: 'Récompensez automatiquement vos clients les plus fidèles' },
] as const;

const AUTOMATION_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  violet: { bg: 'bg-violet-50', text: 'text-violet-500' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-500' },
};

interface AutomationsTabProps {
  subscriberCount: number | null;
  birthdayGiftEnabled: boolean;
  birthdayGiftDescription: string;
  setBirthdayGiftDescription: (v: string) => void;
  savingBirthday: boolean;
  birthdaySaveResult: BirthdaySaveResult | null;
  onSaveBirthdayConfig: () => void;
  onToggleBirthday: () => void;
}

export default function AutomationsTab({
  subscriberCount,
  birthdayGiftEnabled,
  birthdayGiftDescription,
  setBirthdayGiftDescription,
  savingBirthday,
  birthdaySaveResult,
  onSaveBirthdayConfig,
  onToggleBirthday,
}: AutomationsTabProps) {
  const automationsUnlocked = (subscriberCount ?? 0) >= AUTOMATION_UNLOCK_THRESHOLD;
  const subscriberProgress = Math.min((subscriberCount ?? 0) / AUTOMATION_UNLOCK_THRESHOLD, 1);

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
                    placeholder="Ex: Un brushing offert pour votre anniversaire !"
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
        {FUTURE_AUTOMATIONS.map((item) => {
          const colors = AUTOMATION_COLOR_MAP[item.color];
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
  );
}
