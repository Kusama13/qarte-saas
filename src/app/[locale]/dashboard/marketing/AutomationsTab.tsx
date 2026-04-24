'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  CheckCircle2,
  Clock,
  Sunrise,
  Star,
  CalendarDays,
  MessageSquareText,
  Gift,
  Hourglass,
  UserPlus,
  HeartHandshake,
  Award,
  Flower2,
  Gem,
  type LucideIcon,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';

interface AutomationsTabProps {
  merchantId?: string;
  shopName?: string;
  planTier?: 'fidelity' | 'all_in';
  subscriptionStatus?: string | null;
}

// Fidélité : seules anniversaire (cron auto, sans toggle merchant) + récompense parrainage
// sont incluses. Tout le reste demande Tout-en-un. Source : plan-tiers.ts +
// FIDELITY_FREE_SMS_TYPES dans sms.ts.
const FIDELITY_AVAILABLE_FIELDS = new Set<SmsToggleField>(['referral_reward_sms_enabled']);

interface SmsSettings {
  reminder_j1_enabled: boolean;
  reminder_j0_enabled: boolean;
  post_visit_review_enabled: boolean;
  events_sms_enabled: boolean;
  events_sms_offer_text: string | null;
  referral_reward_sms_enabled: boolean;
  voucher_expiry_sms_enabled: boolean;
  referral_invite_sms_enabled: boolean;
  inactive_sms_enabled: boolean;
  near_reward_sms_enabled: boolean;
  reward_description: string | null;
  referral_program_enabled: boolean;
  referral_reward_referrer: string | null;
  referral_reward_referred: string | null;
  planning_enabled: boolean;
  review_link: string | null;
}

type SmsToggleField =
  | 'reminder_j1_enabled'
  | 'reminder_j0_enabled'
  | 'post_visit_review_enabled'
  | 'events_sms_enabled'
  | 'referral_reward_sms_enabled'
  | 'voucher_expiry_sms_enabled'
  | 'referral_invite_sms_enabled'
  | 'inactive_sms_enabled'
  | 'near_reward_sms_enabled';

type SmsCardCategory = 'transactional' | 'marketing';

function mapSettings(data: Record<string, unknown>): SmsSettings {
  return {
    reminder_j1_enabled: data.reminder_j1_enabled !== false,
    reminder_j0_enabled: !!data.reminder_j0_enabled,
    post_visit_review_enabled: !!data.post_visit_review_enabled,
    events_sms_enabled: !!data.events_sms_enabled,
    events_sms_offer_text: (data.events_sms_offer_text as string | null) || null,
    referral_reward_sms_enabled: data.referral_reward_sms_enabled !== false,
    voucher_expiry_sms_enabled: !!data.voucher_expiry_sms_enabled,
    referral_invite_sms_enabled: !!data.referral_invite_sms_enabled,
    inactive_sms_enabled: !!data.inactive_sms_enabled,
    near_reward_sms_enabled: !!data.near_reward_sms_enabled,
    reward_description: (data.reward_description as string | null) || null,
    referral_program_enabled: !!data.referral_program_enabled,
    referral_reward_referrer: (data.referral_reward_referrer as string | null) || null,
    referral_reward_referred: (data.referral_reward_referred as string | null) || null,
    planning_enabled: !!data.planning_enabled,
    review_link: (data.review_link as string | null) || null,
  };
}

function SmsAutomationCard({
  title,
  desc,
  template,
  icon: Icon,
  category,
  field,
  enabled,
  loading,
  updating,
  disabled,
  disabledHint,
  onToggle,
  t,
}: {
  title: string;
  desc: string;
  template: string;
  icon: LucideIcon;
  category: SmsCardCategory;
  field: SmsToggleField;
  enabled: boolean;
  loading: boolean;
  updating: string | null;
  disabled?: boolean;
  disabledHint?: string;
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
          disabled={loading || updating === field || disabled}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
            enabled ? toggleBg : 'bg-gray-200'
          } ${loading || updating === field || disabled ? 'opacity-50' : ''}`}
        >
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform flex items-center justify-center ${
            enabled ? 'translate-x-5' : ''
          }`}>
            {updating === field && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
          </div>
        </button>
      </div>
      <div className="mt-2.5 pl-[52px] pr-1">
        <p className="text-[11px] italic text-gray-400 leading-snug line-clamp-2">&ldquo;{template}&rdquo;</p>
        {disabled && disabledHint && (
          <p className="text-[10px] text-amber-600 mt-1">{disabledHint}</p>
        )}
      </div>
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-1 pt-2">
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{children}</h3>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

export default function AutomationsTab({ merchantId, shopName, planTier = 'all_in', subscriptionStatus = null }: AutomationsTabProps) {
  const t = useTranslations('marketing.automations');
  const isFidelity = planTier === 'fidelity';
  const upgradeHint = isFidelity ? t('tierUpgradeHint') : undefined;
  const gateByTier = (field: SmsToggleField): { disabled: boolean; hint: string | undefined } =>
    isFidelity && !FIDELITY_AVAILABLE_FIELDS.has(field)
      ? { disabled: true, hint: upgradeHint }
      : { disabled: false, hint: undefined };
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
          setSmsSettings(mapSettings(data.settings));
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
        setSmsSettings(mapSettings(data.settings));
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

  const shop = shopName || 'Ton Salon';
  const rewardReferred = smsSettings?.referral_reward_referred || t('rewardNotSet');
  const rewardReferrer = smsSettings?.referral_reward_referrer || t('rewardNotSet');
  const rewardMain = smsSettings?.reward_description || t('rewardNotSet');
  const referralDisabled = !smsSettings?.referral_program_enabled;
  const planningDisabled = smsSettings ? !smsSettings.planning_enabled : false;
  const googleReviewMissing = smsSettings ? !smsSettings.review_link?.trim() : false;
  const rewardMissing = smsSettings ? !smsSettings.reward_description?.trim() : false;

  // Combine tier gate + autres raisons de désactivation (tier a priorité sur le hint).
  const gateCard = (field: SmsToggleField, otherDisabled: boolean, otherHint: string | undefined) => {
    const tier = gateByTier(field);
    if (tier.disabled) return { disabled: true, disabledHint: tier.hint };
    return { disabled: otherDisabled, disabledHint: otherDisabled ? otherHint : undefined };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <MessageSquareText className="w-4 h-4 text-gray-400" />
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('smsAutomationsHeader')}</h2>
      </div>

      {isFidelity && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <Gift className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-900">{t('fidelityBannerTitle')}</p>
            <p className="text-xs text-amber-800 mt-0.5 leading-snug">{t('fidelityBannerDesc')}</p>
          </div>
        </div>
      )}

      {subscriptionStatus === 'trial' && (
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
            <Gem className="w-4 h-4 text-indigo-500" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900">Tu es en période d'essai</p>
            <p className="text-xs text-slate-600 mt-0.5 leading-snug">
              Active les SMS auto que tu veux — ils seront envoyés à tes clientes dès que tu passes sur un plan payant.
            </p>
            <Link
              href="/dashboard/subscription"
              className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Passer à l'abonnement
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      )}

      <GroupLabel>{t('groupBookings')}</GroupLabel>

      <SmsAutomationCard
        title={t('reminderJ1')}
        desc={t('reminderJ1Desc')}
        template={t('reminderJ1Template', { shop })}
        icon={Clock}
        category="transactional"
        field="reminder_j1_enabled"
        enabled={(smsSettings?.reminder_j1_enabled ?? true) && !planningDisabled}
        loading={loading}
        updating={updating}
        {...gateCard('reminder_j1_enabled', planningDisabled, t('planningDisabledHint'))}
        onToggle={toggleSmsAutomation}
        t={t}
      />

      <SmsAutomationCard
        title={t('reminderJ0')}
        desc={t('reminderJ0Desc')}
        template={t('reminderJ0Template', { shop })}
        icon={Sunrise}
        category="transactional"
        field="reminder_j0_enabled"
        enabled={(smsSettings?.reminder_j0_enabled ?? false) && !planningDisabled}
        loading={loading}
        updating={updating}
        {...gateCard('reminder_j0_enabled', planningDisabled, t('planningDisabledHint'))}
        onToggle={toggleSmsAutomation}
        t={t}
      />

      <GroupLabel>{t('groupReferral')}</GroupLabel>

      <SmsAutomationCard
        title={t('referralReward')}
        desc={t('referralRewardDesc')}
        template={t('referralRewardTemplate', { shop, reward: rewardReferrer })}
        icon={Gift}
        category="transactional"
        field="referral_reward_sms_enabled"
        enabled={smsSettings?.referral_reward_sms_enabled ?? true}
        loading={loading}
        updating={updating}
        {...gateCard('referral_reward_sms_enabled', referralDisabled, t('referralDisabledHint'))}
        onToggle={toggleSmsAutomation}
        t={t}
      />

      <SmsAutomationCard
        title={t('referralInvite')}
        desc={t('referralInviteDesc')}
        template={t('referralInviteTemplate', { shop, rewardReferred, rewardReferrer })}
        icon={UserPlus}
        category="marketing"
        field="referral_invite_sms_enabled"
        enabled={smsSettings?.referral_invite_sms_enabled ?? false}
        loading={loading}
        updating={updating}
        {...gateCard('referral_invite_sms_enabled', referralDisabled, t('referralDisabledHint'))}
        onToggle={toggleSmsAutomation}
        t={t}
      />

      <GroupLabel>{t('groupLoyalty')}</GroupLabel>

      <SmsAutomationCard
        title={t('reviewSms')}
        desc={t('reviewSmsDesc')}
        template={t('reviewSmsTemplate', { shop, link: smsSettings?.review_link || 'lien-google' })}
        icon={Star}
        category="marketing"
        field="post_visit_review_enabled"
        enabled={(smsSettings?.post_visit_review_enabled ?? false) && !googleReviewMissing}
        loading={loading}
        updating={updating}
        {...gateCard('post_visit_review_enabled', googleReviewMissing, t('googleReviewMissingHint'))}
        onToggle={toggleSmsAutomation}
        t={t}
      />

      <SmsAutomationCard
        title={t('voucherExpiry')}
        desc={t('voucherExpiryDesc')}
        template={t('voucherExpiryTemplate', { shop })}
        icon={Hourglass}
        category="marketing"
        field="voucher_expiry_sms_enabled"
        enabled={smsSettings?.voucher_expiry_sms_enabled ?? false}
        loading={loading}
        updating={updating}
        {...gateCard('voucher_expiry_sms_enabled', false, undefined)}
        onToggle={toggleSmsAutomation}
        t={t}
      />

      <SmsAutomationCard
        title={t('nearReward')}
        desc={t('nearRewardDesc')}
        template={t('nearRewardTemplate', { shop, reward: rewardMain })}
        icon={Award}
        category="marketing"
        field="near_reward_sms_enabled"
        enabled={(smsSettings?.near_reward_sms_enabled ?? false) && !rewardMissing}
        loading={loading}
        updating={updating}
        {...gateCard('near_reward_sms_enabled', rewardMissing, t('rewardMissingHint'))}
        onToggle={toggleSmsAutomation}
        t={t}
      />

      <GroupLabel>{t('groupReactivation')}</GroupLabel>

      <SmsAutomationCard
        title={t('inactiveSms')}
        desc={t('inactiveSmsDesc')}
        template={t('inactiveSmsTemplate', { shop })}
        icon={HeartHandshake}
        category="marketing"
        field="inactive_sms_enabled"
        enabled={smsSettings?.inactive_sms_enabled ?? false}
        loading={loading}
        updating={updating}
        {...gateCard('inactive_sms_enabled', false, undefined)}
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
            disabled={loading || updating === 'events_sms_enabled' || isFidelity}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
              smsSettings?.events_sms_enabled ? 'bg-[#4b0082]' : 'bg-gray-200'
            } ${loading || updating === 'events_sms_enabled' || isFidelity ? 'opacity-50' : ''}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform flex items-center justify-center ${
              smsSettings?.events_sms_enabled ? 'translate-x-5' : ''
            }`}>
              {updating === 'events_sms_enabled' && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
            </div>
          </button>
        </div>
        <div className="pl-[52px] pr-1">
          <p className="text-[11px] italic text-gray-400 leading-snug line-clamp-2">&ldquo;{t('eventsSmsTemplate', { shop })}&rdquo;</p>
          {isFidelity && (
            <p className="text-[10px] text-amber-600 mt-1">{upgradeHint}</p>
          )}
        </div>

        <AnimatePresence>
          {smsSettings?.events_sms_enabled && !isFidelity && (
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
