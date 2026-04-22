'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useInView } from '@/hooks/useInView';
import {
  ArrowRight,
  Share2,
  Wallet,
  UserPlus,
  Repeat,
  Globe,
  Clock,
  Gift,
  BarChart3,
  ChevronDown,
  Megaphone,
  GraduationCap,
  Users,
  Briefcase,
  Loader2,
  CheckCircle,
} from 'lucide-react';

const PRICE_PER_MONTH = 24;
const COMMISSION_RATE = 0.20;

const CTA_CLASS = 'group relative inline-flex items-center justify-center gap-2 px-10 py-5 bg-gradient-to-r from-indigo-600/90 to-violet-600/90 backdrop-blur-md text-white font-bold text-base sm:text-lg rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] border border-white/20';
const INPUT_CLASS = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 bg-white';

const PROFILE_OPTIONS = [
  { value: 'influencer', labelKey: 'profileInfluencer' },
  { value: 'trainer', labelKey: 'profileTrainer' },
  { value: 'family_friend', labelKey: 'profileFamilyFriend' },
  { value: 'sales_rep', labelKey: 'profileSalesRep' },
  { value: 'other', labelKey: 'profileOther' },
] as const;

const STEPS = [
  { icon: UserPlus, key: 'step1' },
  { icon: Share2, key: 'step2' },
  { icon: Wallet, key: 'step3' },
] as const;

const PERKS = [
  { icon: Repeat, key: 'perk1' },
  { icon: Globe, key: 'perk2' },
  { icon: Clock, key: 'perk3' },
  { icon: Gift, key: 'perk4' },
  { icon: BarChart3, key: 'perk5' },
  { icon: UserPlus, key: 'perk6' },
] as const;

const PROFILES = [
  { icon: Megaphone, key: 'profile1' },
  { icon: GraduationCap, key: 'profile2' },
  { icon: Users, key: 'profile3' },
  { icon: Briefcase, key: 'profile4' },
] as const;

const CURRENT_YEAR = new Date().getFullYear();

function AmbassadeurForm() {
  const t = useTranslations('ambassador');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    phone: '', profile_type: '', message: '', requested_slug: '',
  });

  const handleSubmit = async () => {
    setFormError('');
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim() || !form.profile_type || form.message.trim().length < 20) {
      setFormError(t('errorValidation'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/ambassador/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          phone: form.phone.trim() || null,
          requested_slug: form.requested_slug.trim() || undefined,
        }),
      });
      if (res.status === 409) {
        setFormError(t('errorDuplicate'));
        return;
      }
      if (!res.ok) {
        setFormError(t('errorGeneric'));
        return;
      }
      setSubmitted(true);
    } catch {
      setFormError(t('errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl shadow-xl shadow-indigo-100/30 p-8 md:p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('successTitle')}</h3>
        <p className="text-gray-600">{t('successMessage')}</p>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="absolute -inset-4 bg-gradient-to-br from-indigo-200/40 via-violet-200/30 to-emerald-200/40 rounded-[3rem] blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
      <div className="relative bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl shadow-xl shadow-indigo-100/30 p-6 md:p-10">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="amb-fn" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('fieldFirstName')}</label>
              <input
                id="amb-fn"
                type="text"
                required
                value={form.first_name}
                onChange={(e) => setForm(f => ({ ...f, first_name: e.target.value }))}
                className={INPUT_CLASS}
                maxLength={50}
              />
            </div>
            <div>
              <label htmlFor="amb-ln" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('fieldLastName')}</label>
              <input
                id="amb-ln"
                type="text"
                required
                value={form.last_name}
                onChange={(e) => setForm(f => ({ ...f, last_name: e.target.value }))}
                className={INPUT_CLASS}
                maxLength={50}
              />
            </div>
          </div>

          <div>
            <label htmlFor="amb-email" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('fieldEmail')}</label>
            <input
              id="amb-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              className={INPUT_CLASS}
              maxLength={200}
            />
          </div>

          <div>
            <label htmlFor="amb-phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
              {t('fieldPhone')} <span className="text-gray-400 font-normal">({t('optional')})</span>
            </label>
            <input
              id="amb-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
              className={INPUT_CLASS}
              maxLength={30}
            />
          </div>

          <div>
            <label htmlFor="amb-slug" className="block text-sm font-semibold text-gray-700 mb-1.5">
              {t('fieldSlug')} <span className="text-gray-400 font-normal">({t('optional')})</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 shrink-0">?ref=</span>
              <input
                id="amb-slug"
                type="text"
                value={form.requested_slug}
                onChange={(e) => setForm(f => ({ ...f, requested_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                className={`${INPUT_CLASS} font-mono`}
                maxLength={30}
                placeholder={t('slugPlaceholder')}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{t('slugHint')}</p>
          </div>

          <div>
            <label htmlFor="amb-profile" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('fieldProfileType')}</label>
            <select
              id="amb-profile"
              required
              value={form.profile_type}
              onChange={(e) => setForm(f => ({ ...f, profile_type: e.target.value }))}
              className={INPUT_CLASS}
            >
              <option value="">{t('selectProfile')}</option>
              {PROFILE_OPTIONS.map(({ value, labelKey }) => (
                <option key={value} value={value}>{t(labelKey)}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amb-msg" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('fieldMessage')}</label>
            <textarea
              id="amb-msg"
              required
              value={form.message}
              onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
              className={`${INPUT_CLASS} resize-none`}
              rows={3}
              maxLength={1000}
              placeholder={t('messagePlaceholder')}
            />
            <p className="text-xs text-gray-400 mt-1">{t('messageHint')}</p>
          </div>

          {formError && (
            <p className="text-sm text-red-600 font-medium" role="alert">{formError}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`${CTA_CLASS} w-full justify-center disabled:opacity-50`}
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin relative z-10" />
            ) : (
              <>
                <span className="relative z-10">{t('submitButton')}</span>
                <ArrowRight className="w-5 h-5 relative z-10" />
              </>
            )}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>
    </div>
  );
}

function EarningsSimulator() {
  const t = useTranslations('ambassador');
  const [referrals, setReferrals] = useState(5);
  const monthly = Math.round(referrals * PRICE_PER_MONTH * COMMISSION_RATE);
  const yearly = monthly * 12;

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl shadow-xl shadow-indigo-100/30 p-6 md:p-10">
      <div className="text-center mb-8">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{t('simulatorTitle')}</h3>
        <p className="text-sm text-gray-500">{t('simulatorDesc')}</p>
      </div>

      <div className="max-w-md mx-auto mb-8">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          {t('simulatorLabel')}
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={50}
            value={referrals}
            onChange={(e) => setReferrals(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-600 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-indigo-500/30"
          />
          <span className="text-2xl font-black text-indigo-600 w-12 text-right tabular-nums">{referrals}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-5 text-center">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">{t('simulatorMonthly')}</p>
          <p className="text-3xl md:text-4xl font-black text-gray-900">{monthly}&euro;</p>
          <p className="text-xs text-gray-400 mt-1">{t('simulatorPerMonth')}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5 text-center">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">{t('simulatorYearly')}</p>
          <p className="text-3xl md:text-4xl font-black text-gray-900">{yearly}&euro;</p>
          <p className="text-xs text-gray-400 mt-1">{t('simulatorPerYear')}</p>
        </div>
      </div>
    </div>
  );
}

export default function AmbassadeurContent() {
  const t = useTranslations('ambassador');
  const { ref: heroRef, isInView: heroInView } = useInView();
  const { ref: stepsRef, isInView: stepsInView } = useInView();
  const { ref: perksRef, isInView: perksInView } = useInView();
  const { ref: profilesRef, isInView: profilesInView } = useInView();
  const { ref: simulatorRef, isInView: simulatorInView } = useInView();
  const { ref: faqRef, isInView: faqInView } = useInView();
  const { ref: finalRef, isInView: finalInView } = useInView();

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-gray-50">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="animate-blob absolute top-20 left-20 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl" />
          <div className="animate-blob absolute bottom-20 right-20 w-96 h-96 bg-violet-200/40 rounded-full blur-3xl" style={{ animationDelay: '2s' }} />
          <div className="animate-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-100/20 rounded-full blur-3xl" style={{ animationDelay: '4s' }} />
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse delay-700 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
          <div className="absolute bottom-1/3 left-1/2 w-1 h-1 bg-emerald-400 rounded-full animate-pulse delay-1000 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
        </div>

        <div ref={heroRef} className="relative z-10 max-w-5xl mx-auto px-6 pt-28 lg:pt-36 pb-16 text-center">
          <div className={`${heroInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-700 text-xs font-bold uppercase tracking-wider mb-8">
              <Wallet className="w-3.5 h-3.5" />
              {t('badge')}
            </span>

            <h1 className="text-[2.5rem] md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              {t('heroTitle1')}{' '}
              <span className="relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
                  {t('heroTitle2')}
                </span>
                <span className="absolute -bottom-2 left-0 right-0 h-3 bg-indigo-100/60 -skew-x-3 rounded-sm -z-10" />
              </span>
              {' '}{t('heroTitle3')}
            </h1>

            <p className="text-[1.05rem] md:text-lg lg:text-xl text-gray-800 max-w-2xl mx-auto mb-10 leading-relaxed">
              {t('heroSubtitle')}
            </p>

            <div className="inline-flex items-center gap-4 px-8 py-5 bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl shadow-xl shadow-indigo-100/30 mb-10">
              <div className="text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-b from-indigo-600 to-violet-600">
                20%
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-900">{t('commissionLabel')}</p>
                <p className="text-xs text-gray-400">{t('commissionSub')}</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button onClick={scrollToForm} className={CTA_CLASS}>
                <span className="relative z-10">{t('ctaPrimary')}</span>
                <ArrowRight className="w-5 h-5 relative z-10" />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <p className="text-xs text-gray-400">{t('ctaSub')}</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" aria-hidden="true">
          <ChevronDown className="w-8 h-8 text-gray-400" />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 md:py-32 bg-white">
        <div ref={stepsRef} className="max-w-5xl mx-auto px-6">
          <div className={`text-center mb-12 md:mb-16 ${stepsInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('stepsTitle')}{' '}
              <span className="relative font-[family-name:var(--font-display)] italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
                {t('stepsTitleBold')}
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-indigo-100/60 -skew-x-3 rounded-sm -z-10" />
              </span>
            </h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">{t('stepsDesc')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map(({ icon: Icon, key }, i) => (
              <div
                key={key}
                style={{ animationDelay: `${i * 0.15}s` }}
                className={`relative bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-100/50 p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ${stepsInView ? 'animate-fade-in-up' : 'opacity-0'}`}
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full flex items-center justify-center shadow-md shadow-indigo-500/30">
                  <span className="text-xs font-black text-white">{i + 1}</span>
                </div>

                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-indigo-600" />
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">{t(`${key}Title`)}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{t(`${key}Desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PERKS ── */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-gray-50 to-white">
        <div ref={perksRef} className="max-w-5xl mx-auto px-6">
          <div className={`text-center mb-12 md:mb-16 ${perksInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('perksTitle')}{' '}
              <span className="relative font-[family-name:var(--font-display)] italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
                {t('perksTitleBold')}
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-indigo-100/60 -skew-x-3 rounded-sm -z-10" />
              </span>
            </h2>
          </div>

          <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-4 ${perksInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
            {PERKS.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">{t(`${key}Title`)}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{t(`${key}Desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IS IT FOR ── */}
      <section className="py-24 md:py-32 bg-white">
        <div ref={profilesRef} className="max-w-5xl mx-auto px-6">
          <div className={`text-center mb-12 md:mb-16 ${profilesInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('profilesTitle')}{' '}
              <span className="relative font-[family-name:var(--font-display)] italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
                {t('profilesTitleBold')}
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-indigo-100/60 -skew-x-3 rounded-sm -z-10" />
              </span>
            </h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">{t('profilesDesc')}</p>
          </div>

          <div className={`grid md:grid-cols-2 gap-4 ${profilesInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
            {PROFILES.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">{t(`${key}Title`)}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{t(`${key}Desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EARNINGS SIMULATOR ── */}
      <section className="py-24 md:py-32 bg-white">
        <div ref={simulatorRef} className="max-w-3xl mx-auto px-6">
          <div className={`text-center mb-12 md:mb-16 ${simulatorInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('simulatorSectionTitle')}{' '}
              <span className="relative font-[family-name:var(--font-display)] italic text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                {t('simulatorSectionBold')}
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-emerald-100/60 -skew-x-3 rounded-sm -z-10" />
              </span>
            </h2>
          </div>

          <div className={`relative group ${simulatorInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
            <div className="absolute -inset-4 bg-gradient-to-br from-indigo-200/40 via-violet-200/30 to-emerald-200/40 rounded-[3rem] blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
            <div className="relative">
              <EarningsSimulator />
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF / STATS ── */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 md:p-12 shadow-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent)] pointer-events-none" />

            <div className="relative grid md:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-5xl md:text-6xl font-black text-white mb-1">400+</p>
                <p className="text-indigo-200 text-sm font-medium">{t('stat1')}</p>
              </div>
              <div>
                <p className="text-5xl md:text-6xl font-black text-white mb-1">{PRICE_PER_MONTH}&euro;</p>
                <p className="text-indigo-200 text-sm font-medium">{t('stat2')}</p>
              </div>
              <div>
                <p className="text-5xl md:text-6xl font-black text-white mb-1">{(PRICE_PER_MONTH * COMMISSION_RATE).toFixed(2).replace('.', ',')}&euro;</p>
                <p className="text-indigo-200 text-sm font-medium">{t('stat3')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 md:py-32 bg-white">
        <div ref={faqRef} className="max-w-3xl mx-auto px-6">
          <div className={`text-center mb-12 md:mb-16 ${faqInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('faqTitle')}{' '}
              <span className="relative font-[family-name:var(--font-display)] italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
                {t('faqTitleBold')}
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-indigo-100/60 -skew-x-3 rounded-sm -z-10" />
              </span>
            </h2>
          </div>

          <div className={`space-y-3 ${faqInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="rounded-2xl border bg-white shadow-md shadow-gray-200/60 border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                  aria-expanded={openFaq === i}
                >
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 pr-4">{t(`faqQ${i}`)}</h3>
                  <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 -mt-2">
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">{t(`faqA${i}`)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APPLICATION FORM ── */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-gray-50 to-white">
        <div ref={formRef} className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('formTitle')}{' '}
              <span className="relative font-[family-name:var(--font-display)] italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
                {t('formTitleBold')}
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-indigo-100/60 -skew-x-3 rounded-sm -z-10" />
              </span>
            </h2>
            <p className="text-gray-500 mt-2">{t('formSubtitle')}</p>
          </div>
          <AmbassadeurForm />
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-gray-50 to-white">
        <div ref={finalRef} className="max-w-3xl mx-auto px-6 text-center">
          <div className={`${finalInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{t('finalTitle')}</h2>
            <p className="text-[1.05rem] md:text-lg text-gray-800 mb-10 max-w-xl mx-auto">{t('finalDesc')}</p>
            <button onClick={scrollToForm} className={CTA_CLASS}>
              <span className="relative z-10">{t('ctaPrimary')}</span>
              <ArrowRight className="w-5 h-5 relative z-10" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <p className="text-sm text-gray-400 mt-4">{t('ctaSub')}</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <span className="text-xs font-black text-white">Q</span>
            </div>
            <span className="text-sm font-bold text-gray-700">Qarte</span>
          </div>
          <p className="text-xs text-gray-400">&copy; {CURRENT_YEAR} Qarte. Tous droits r&eacute;serv&eacute;s.</p>
        </div>
      </footer>
    </>
  );
}
