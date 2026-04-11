'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from '@/i18n/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, ArrowRight, Copy, Tag, Sparkles } from 'lucide-react';
import { useMerchant } from '@/contexts/MerchantContext';
import { getTrialStatus } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type {
  ChurnBlocker as Blocker,
  ChurnFeature as Feature,
  ChurnConvince as Convince,
} from '@/lib/churn-survey-config';

export default function ChurnSurveyPage() {
  const router = useRouter();
  const { merchant, loading, refetch } = useMerchant();
  const t = useTranslations('churnSurvey');

  const [blocker, setBlocker] = useState<Blocker | null>(null);
  const [missingFeature, setMissingFeature] = useState('');
  const [featuresTested, setFeaturesTested] = useState<Feature[]>([]);
  const [wouldConvince, setWouldConvince] = useState<Convince | null>(null);
  const [freeComment, setFreeComment] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [success, setSuccess] = useState(false);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Defense in depth: if merchant not expired or already completed, go away
  useEffect(() => {
    if (loading || !merchant) return;
    if (merchant.churn_survey_seen_at) {
      router.replace('/dashboard/subscription');
      return;
    }
    const status = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
    if (!status.isFullyExpired) {
      router.replace('/dashboard/subscription');
    }
  }, [loading, merchant, router]);

  const blockers: { value: Blocker; label: string }[] = useMemo(
    () => [
      { value: 'price', label: t('blockerPrice') },
      { value: 'not_enough_clients', label: t('blockerNotEnoughClients') },
      { value: 'missing_feature', label: t('blockerMissingFeature') },
      { value: 'too_complex', label: t('blockerTooComplex') },
      { value: 'other', label: t('blockerOther') },
    ],
    [t]
  );

  const features: { value: Feature; label: string }[] = useMemo(
    () => [
      { value: 'loyalty', label: t('featureLoyalty') },
      { value: 'planning', label: t('featurePlanning') },
      { value: 'online_booking', label: t('featureOnlineBooking') },
      { value: 'sms', label: t('featureSms') },
      { value: 'push_offers', label: t('featurePushOffers') },
      { value: 'referral', label: t('featureReferral') },
    ],
    [t]
  );

  const convinces: { value: Convince; label: string }[] = useMemo(
    () => [
      { value: 'lower_price', label: t('convinceLowerPrice') },
      { value: 'longer_trial', label: t('convinceLongerTrial') },
      { value: 'team_demo', label: t('convinceTeamDemo') },
      { value: 'more_features', label: t('convinceMoreFeatures') },
      { value: 'nothing', label: t('convinceNothing') },
    ],
    [t]
  );

  const toggleFeature = (f: Feature) => {
    setFeaturesTested((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const canSubmit = blocker !== null && wouldConvince !== null && featuresTested.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || !blocker || !wouldConvince) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/churn-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocker,
          missing_feature: missingFeature.trim() || null,
          features_tested: featuresTested,
          would_convince: wouldConvince,
          free_comment: freeComment.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t('errorSubmit'));
      }

      const data = await res.json();
      setPromoCode(data.promo_code);
      setSuccess(true);
      // Refresh merchant context (new trial_ends_at + churn_survey_seen_at)
      await refetch();
    } catch (err) {
      console.error('Churn survey submit error:', err);
      setError(err instanceof Error ? err.message : t('errorSubmit'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    // No API call — skip is not persisted. Merchant will see survey again on next visit.
    router.push('/dashboard/subscription');
  };

  const handleCopyPromo = async () => {
    if (!promoCode) return;
    try {
      await navigator.clipboard.writeText(promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* ignore */
    }
  };

  const handleContinue = () => {
    router.push('/dashboard/subscription');
  };

  // Loading state
  if (loading || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-[#4b0082] animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 relative"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Skip button flottant */}
      {!success && (
        <button
          type="button"
          onClick={handleSkip}
          className="fixed z-40 top-4 right-4 md:top-6 md:right-6 px-3 py-1.5 bg-white/90 backdrop-blur-xl border border-gray-100 rounded-lg shadow-sm text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium"
        >
          {t('skip')}
        </button>
      )}

      <main className="px-4 pt-14 pb-20 lg:pt-8 lg:px-8 lg:pb-8 max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Title bandeau — aligned with other dashboard pages */}
              <div className="mb-5 md:mb-10 p-4 md:p-6 rounded-2xl bg-[#4b0082]/[0.04] border border-[#4b0082]/[0.08]">
                <h1 className="text-xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#4b0082] to-violet-600">
                  {t('title')}
                </h1>
                <p className="mt-1 text-sm md:text-base text-gray-500 font-medium">
                  {t('subtitle')}
                </p>
              </div>

              {/* Form card */}
              <div className="p-5 md:p-8 bg-white border border-gray-100 shadow-sm rounded-2xl space-y-6 md:space-y-8">
                {/* Q1 — Blocker */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    {t('q1Label')}
                  </label>
                  <div className="space-y-2">
                    {blockers.map((b) => (
                      <OptionButton
                        key={b.value}
                        type="radio"
                        label={b.label}
                        checked={blocker === b.value}
                        onClick={() => setBlocker(b.value)}
                      />
                    ))}
                  </div>
                </div>

                {/* Q2 — Missing feature textarea */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">
                    {t('q2Label')}{' '}
                    <span className="text-xs font-normal text-gray-400">({t('q2Optional')})</span>
                  </label>
                  <textarea
                    value={missingFeature}
                    onChange={(e) => setMissingFeature(e.target.value.slice(0, 200))}
                    placeholder={t('q2Placeholder')}
                    rows={3}
                    className="w-full px-4 py-3 text-base leading-normal border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4b0082]/30 focus:border-[#4b0082] transition-all resize-none"
                  />
                  <p className="mt-1 text-xs text-gray-400 text-right">{missingFeature.length}/200</p>
                </div>

                {/* Q3 — Features tested (multi) */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">{t('q3Label')}</label>
                  <p className="text-xs text-gray-400 mb-3">{t('q3Hint')}</p>
                  <div className="space-y-2">
                    {features.map((f) => (
                      <OptionButton
                        key={f.value}
                        type="checkbox"
                        label={f.label}
                        checked={featuresTested.includes(f.value)}
                        onClick={() => toggleFeature(f.value)}
                      />
                    ))}
                  </div>
                </div>

                {/* Q4 — Would convince */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">{t('q4Label')}</label>
                  <div className="space-y-2">
                    {convinces.map((c) => (
                      <OptionButton
                        key={c.value}
                        type="radio"
                        label={c.label}
                        checked={wouldConvince === c.value}
                        onClick={() => setWouldConvince(c.value)}
                      />
                    ))}
                  </div>
                </div>

                {/* Free comment */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">
                    {t('freeCommentLabel')}{' '}
                    <span className="text-xs font-normal text-gray-400">({t('q2Optional')})</span>
                  </label>
                  <textarea
                    value={freeComment}
                    onChange={(e) => setFreeComment(e.target.value.slice(0, 500))}
                    placeholder={t('freeCommentPlaceholder')}
                    rows={3}
                    className="w-full px-4 py-3 text-base leading-normal border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4b0082]/30 focus:border-[#4b0082] transition-all resize-none"
                  />
                  <p className="mt-1 text-xs text-gray-400 text-right">{freeComment.length}/500</p>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitting}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#4b0082] to-violet-600 text-white font-semibold shadow-lg shadow-[#4b0082]/20 hover:shadow-xl hover:shadow-[#4b0082]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {t('submit')}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="mt-6 md:mt-12"
            >
              {/* Success card */}
              <div className="p-5 md:p-8 bg-white border border-gray-100 shadow-sm rounded-2xl text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="w-16 h-16 mx-auto mb-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200/60"
                >
                  <Check className="w-8 h-8 text-white" strokeWidth={3} />
                </motion.div>

                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{t('successTitle')}</h2>
                <p className="text-gray-500 mb-6">{t('successMessage')}</p>

                {/* Conditional promo card */}
                {promoCode && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="relative p-4 md:p-5 mb-5 md:mb-6 rounded-2xl bg-gradient-to-br from-[#4b0082] to-violet-600 text-white overflow-hidden"
                  >
                    <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

                    <div className="relative">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm mb-3">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">
                          {t('promoBadge')}
                        </span>
                      </div>

                      <h3 className="text-lg md:text-xl font-extrabold mb-3 flex items-center justify-center gap-2">
                        <Tag className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                        <span>{t('promoTitle')}</span>
                      </h3>

                      <button
                        type="button"
                        onClick={handleCopyPromo}
                        className="w-full flex items-center justify-between gap-2 px-3 md:px-4 py-3 rounded-xl bg-white/15 hover:bg-white/20 backdrop-blur-sm border border-white/30 transition-all"
                      >
                        <span className="font-mono text-base md:text-lg font-bold tracking-wider truncate">
                          {promoCode}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-semibold shrink-0">
                          {copied ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span className="hidden sm:inline">{t('promoCopied')}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span className="hidden sm:inline">{t('promoCopy')}</span>
                            </>
                          )}
                        </span>
                      </button>

                      <p className="mt-3 text-xs text-white/80">{t('promoHint')}</p>
                    </div>
                  </motion.div>
                )}

                {/* Continue CTA */}
                <button
                  type="button"
                  onClick={handleContinue}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#4b0082] to-violet-600 text-white font-semibold shadow-lg shadow-[#4b0082]/20 hover:shadow-xl hover:shadow-[#4b0082]/30 transition-all flex items-center justify-center gap-2"
                >
                  {t('continueToSubscription')}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

interface OptionButtonProps {
  type: 'radio' | 'checkbox';
  label: string;
  checked: boolean;
  onClick: () => void;
}

function OptionButton({ type, label, checked, onClick }: OptionButtonProps) {
  const borderClass = checked
    ? 'border-[#4b0082] bg-[#4b0082]/[0.06] shadow-sm'
    : 'border-gray-100 bg-white hover:border-[#4b0082]/40';

  const indicatorBase =
    'flex items-center justify-center shrink-0 border-2 transition-colors';
  const indicatorShape =
    type === 'radio' ? 'w-4 h-4 rounded-full' : 'w-5 h-5 rounded-md';
  const indicatorColor = checked
    ? 'border-[#4b0082] bg-[#4b0082]'
    : 'border-gray-300';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border-2 transition-all ${borderClass}`}
    >
      <span className={`${indicatorBase} ${indicatorShape} ${indicatorColor}`}>
        {checked && type === 'radio' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
        {checked && type === 'checkbox' && (
          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
        )}
      </span>
      <span className="text-sm font-medium text-gray-800">{label}</span>
    </button>
  );
}
