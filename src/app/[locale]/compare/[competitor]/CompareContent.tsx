'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useInView } from '@/hooks/useInView';
import { Check, X, ArrowRight } from 'lucide-react';
import { trackCtaClick } from '@/lib/analytics';

type Competitor = 'planity' | 'booksy' | 'bookinbeautiful';

interface CompareContentProps {
  competitor: Competitor;
  variant?: 'compare' | 'alternative';
}

type FeatureKey = 'booking' | 'loyalty' | 'storefront' | 'sms' | 'google_reviews' | 'referral' | 'welcome_offer' | 'birthday' | 'push' | 'commission' | 'app_download' | 'inactive_reminders' | 'qr_nfc' | 'interconnection';

const FEATURES: Array<{ key: FeatureKey; qarteValue: 'yes' | 'custom'; competitorValue: Record<Competitor, 'yes' | 'no' | 'custom'> }> = [
  { key: 'booking', qarteValue: 'yes', competitorValue: { planity: 'yes', booksy: 'yes', bookinbeautiful: 'yes' } },
  { key: 'loyalty', qarteValue: 'yes', competitorValue: { planity: 'no', booksy: 'no', bookinbeautiful: 'no' } },
  { key: 'storefront', qarteValue: 'yes', competitorValue: { planity: 'no', booksy: 'no', bookinbeautiful: 'no' } },
  { key: 'sms', qarteValue: 'custom', competitorValue: { planity: 'custom', booksy: 'custom', bookinbeautiful: 'custom' } },
  { key: 'google_reviews', qarteValue: 'yes', competitorValue: { planity: 'no', booksy: 'no', bookinbeautiful: 'no' } },
  { key: 'referral', qarteValue: 'yes', competitorValue: { planity: 'no', booksy: 'no', bookinbeautiful: 'no' } },
  { key: 'welcome_offer', qarteValue: 'yes', competitorValue: { planity: 'no', booksy: 'no', bookinbeautiful: 'no' } },
  { key: 'birthday', qarteValue: 'yes', competitorValue: { planity: 'no', booksy: 'no', bookinbeautiful: 'no' } },
  { key: 'push', qarteValue: 'yes', competitorValue: { planity: 'no', booksy: 'no', bookinbeautiful: 'no' } },
  { key: 'commission', qarteValue: 'custom', competitorValue: { planity: 'custom', booksy: 'custom', bookinbeautiful: 'custom' } },
  { key: 'app_download', qarteValue: 'custom', competitorValue: { planity: 'custom', booksy: 'custom', bookinbeautiful: 'custom' } },
  { key: 'inactive_reminders', qarteValue: 'yes', competitorValue: { planity: 'no', booksy: 'no', bookinbeautiful: 'no' } },
  { key: 'qr_nfc', qarteValue: 'yes', competitorValue: { planity: 'no', booksy: 'no', bookinbeautiful: 'no' } },
  { key: 'interconnection', qarteValue: 'yes', competitorValue: { planity: 'no', booksy: 'no', bookinbeautiful: 'no' } },
];

const FEATURES_BY_KEY = Object.fromEntries(FEATURES.map(f => [f.key, f])) as Record<FeatureKey, (typeof FEATURES)[number]>;

const REASONS = [
  { emoji: '\u2728', key: 'reason1' },
  { emoji: '\uD83D\uDCB0', key: 'reason2' },
  { emoji: '\uD83C\uDF0D', key: 'reason3' },
  { emoji: '\uD83D\uDCF1', key: 'reason4' },
] as const;

export default function CompareContent({ competitor, variant = 'compare' }: CompareContentProps) {
  const t = useTranslations('compare');
  const isAlt = variant === 'alternative';
  const { ref: heroRef, isInView: heroInView } = useInView();
  const { ref: tableRef, isInView: tableInView } = useInView();
  const { ref: whyRef, isInView: whyInView } = useInView();
  const { ref: testimonialRef, isInView: testimonialInView } = useInView();
  const { ref: pricingRef, isInView: pricingInView } = useInView();
  const { ref: faqRef, isInView: faqInView } = useInView();
  const { ref: finalRef, isInView: finalInView } = useInView();

  const competitorName = t(`${competitor}_name`);

  function getQarteDisplay(key: FeatureKey): { text: string; type: 'yes' | 'custom' } {
    if (key === 'sms') return { text: t('smsQarte'), type: 'custom' };
    if (key === 'commission') return { text: t('commissionQarte'), type: 'custom' };
    if (key === 'app_download') return { text: t('appQarte'), type: 'custom' };
    return { text: t('included'), type: 'yes' };
  }

  function getCompetitorDisplay(key: FeatureKey): { text: string; type: 'yes' | 'no' | 'custom' } {
    const val = FEATURES_BY_KEY[key].competitorValue[competitor];
    if (val === 'yes') return { text: t('included'), type: 'yes' };
    if (val === 'no') return { text: t('notIncluded'), type: 'no' };
    if (key === 'sms') return { text: t(`${competitor}_sms`), type: 'custom' };
    if (key === 'commission') return { text: t(`${competitor}_commission`), type: 'custom' };
    if (key === 'app_download') return { text: t(`${competitor}_app`), type: 'custom' };
    return { text: t('notIncluded'), type: 'no' };
  }

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-b from-white to-gray-50 pt-28 lg:pt-36 pb-16 md:pb-24 overflow-hidden">
        <div ref={heroRef} className="relative max-w-5xl mx-auto px-6 text-center">
          <div className={`${heroInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold tracking-wide uppercase mb-6">
              {isAlt ? t('altBadge', { competitor: competitorName }) : t('badge')}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4">
              {isAlt ? t('altHeroTitle', { competitor: competitorName }) : t('heroTitle', { competitor: competitorName })}
            </h1>
            <p className="text-[1.05rem] md:text-lg lg:text-xl text-gray-800 max-w-2xl mx-auto mb-8 leading-relaxed">
              {isAlt ? t('altHeroSubtitle', { competitor: competitorName }) : t('heroSubtitle', { competitor: competitorName, price: '24\u20AC' })}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth/merchant/signup"
                onClick={() => trackCtaClick(`compare_${competitor}_hero`, 'compare_hero')}
                className="group relative flex items-center justify-center px-10 py-5 bg-gradient-to-r from-indigo-600/90 to-violet-600/90 backdrop-blur-md text-white font-bold text-base sm:text-lg rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] border border-white/20"
              >
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                {t('ctaPrimary')}
              </Link>
              <p className="text-sm text-gray-400">{t('ctaSecondary')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TL;DR ── */}
      <section className="relative py-12 md:py-16 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-6 md:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">{t('tldrTitle')}</h2>
            <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">{t(`${competitor}_tldr`, { competitor: competitorName })}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{t('chooseCompetitor', { competitor: competitorName })}</p>
                <p className="text-sm text-gray-600">{t(`${competitor}_chooseThem`)}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-indigo-100">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">{t('chooseQarte')}</p>
                <p className="text-sm text-gray-600">{t('chooseQarteDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section className="relative py-16 md:py-24 bg-white">
        <div ref={tableRef} className="relative max-w-4xl mx-auto px-6">
          <div className={`text-center mb-12 md:mb-16 ${tableInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              {t('tableTitle')}{' '}
              <span className="relative font-[family-name:var(--font-display)] italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
                {t('tableSubtitle')}
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-indigo-100/60 -skew-x-3 rounded-sm -z-10" />
              </span>
            </h2>
          </div>

          <div className={`bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl shadow-xl shadow-indigo-100/30 overflow-hidden ${tableInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
            {/* Table header */}
            <div className="grid grid-cols-3 gap-0 border-b border-gray-100 bg-gray-50/80">
              <div className="px-4 py-4 md:px-8 text-sm md:text-base font-semibold text-gray-500">{t('featureCol')}</div>
              <div className="px-4 py-4 md:px-8 text-center">
                <span className="text-sm md:text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">{t('qarteCol')}</span>
              </div>
              <div className="px-4 py-4 md:px-8 text-center text-sm md:text-base font-semibold text-gray-500">{competitorName}</div>
            </div>

            {/* Table rows */}
            {FEATURES.map((feature) => {
              const qarte = getQarteDisplay(feature.key);
              const comp = getCompetitorDisplay(feature.key);
              return (
                <div key={feature.key} className="grid grid-cols-3 gap-0 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                  <div className="px-4 py-4 md:px-8 md:py-5 text-sm md:text-base text-gray-700 font-medium">
                    {t(`feature_${feature.key}`)}
                  </div>
                  <div className="px-4 py-4 md:px-8 md:py-5 flex items-center justify-center">
                    {qarte.type === 'yes' ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 text-sm md:text-base font-medium">
                        <Check className="w-4 h-4 md:w-5 md:h-5" />
                        {qarte.text}
                      </span>
                    ) : (
                      <span className="text-sm md:text-base font-semibold text-indigo-600">{qarte.text}</span>
                    )}
                  </div>
                  <div className="px-4 py-4 md:px-8 md:py-5 flex items-center justify-center">
                    {comp.type === 'yes' ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 text-sm md:text-base font-medium">
                        <Check className="w-4 h-4 md:w-5 md:h-5" />
                        {comp.text}
                      </span>
                    ) : comp.type === 'no' ? (
                      <span className="inline-flex items-center gap-1.5 text-gray-300">
                        <X className="w-4 h-4 md:w-5 md:h-5" />
                      </span>
                    ) : (
                      <span className="text-sm md:text-base text-gray-500">{comp.text}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WHO EACH IS BEST FOR ── */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
                <span className="text-base font-bold text-gray-500">{competitorName.charAt(0)}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">{t('bestForCompetitor', { competitor: competitorName })}</h3>
              <ul className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    {t(`${competitor}_bestFor${i}`)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-7 shadow-sm border border-indigo-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-4">
                <span className="text-xs font-black text-white">Q</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">{t('bestForQarte')}</h3>
              <ul className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                    {t(`qarte_bestFor${i}`)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY QARTE ── */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div ref={whyRef} className="relative max-w-5xl mx-auto px-6">
          <div className={`text-center mb-12 md:mb-16 ${whyInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              {t('whyTitle')}{' '}
              <span className="relative font-[family-name:var(--font-display)] italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
                {t('whyTitleBold')}
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-indigo-100/60 -skew-x-3 rounded-sm -z-10" />
              </span>
            </h2>
          </div>

          <div className={`grid md:grid-cols-2 gap-4 ${whyInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
            {REASONS.map(({ emoji, key }) => (
              <div key={key} className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500">
                <span className="text-3xl mb-4 block">{emoji}</span>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">{t(`${key}Title`, { competitor: competitorName })}</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">{t(`${key}Desc`, { competitor: competitorName })}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="relative py-16 md:py-24 bg-white">
        <div ref={testimonialRef} className="relative max-w-5xl mx-auto px-6">
          <div className={`text-center mb-12 md:mb-16 ${testimonialInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              {t('testimonialTitle')}
            </h2>
          </div>

          <div className={`grid md:grid-cols-3 gap-4 ${testimonialInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
            {[1, 2, 3].map((i) => {
              const initials = t(`t${i}Author`).split(' ').map(w => w[0]).join('').slice(0, 2);
              return (
                <div key={i} className="flex flex-col justify-between bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500">
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed italic mb-4">
                    &quot;{t(`t${i}Quote`)}&quot;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t(`t${i}Author`)}</p>
                      <p className="text-xs text-gray-400">{t(`t${i}Role`)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div ref={pricingRef} className="relative max-w-3xl mx-auto px-6">
          <div className={`text-center ${pricingInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              {t('pricingTitle')}{' '}
              <span className="relative font-[family-name:var(--font-display)] italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
                {t('pricingTitleBold')}
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-indigo-100/60 -skew-x-3 rounded-sm -z-10" />
              </span>
            </h2>
            <p className="text-gray-500 mt-2 mb-8">{t('pricingDesc')}</p>

            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-br from-indigo-200/40 via-violet-200/30 to-pink-200/40 rounded-[3rem] blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
              <div className="relative bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl shadow-xl shadow-indigo-100/30 p-8 md:p-12 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{t('pricingFromLabel')}</p>
                <div className="inline-flex items-baseline justify-center gap-1.5 mb-2">
                  <span className="text-6xl md:text-7xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600">19</span>
                  <span className="text-xl font-semibold text-gray-400">&euro;/mois</span>
                </div>
                <p className="text-xs font-medium text-indigo-600 mb-6">{t('pricingTwoPlans')}</p>

                <Link
                  href="/auth/merchant/signup"
                  onClick={() => trackCtaClick(`compare_${competitor}_pricing`, 'compare_pricing')}
                  className="inline-block w-full max-w-xs py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 text-center uppercase tracking-wider text-sm shadow-md shadow-indigo-500/15"
                >
                  {t('ctaPrimary')}
                </Link>

                <p className="text-gray-400 text-sm mt-4">{t('ctaSecondary')}</p>

                <Link href="/pricing" className="inline-block mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2">
                  {t('pricingSeePlans')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MIGRATION (alternative variant only) ── */}
      {isAlt && (
        <section className="relative py-16 md:py-24 bg-white">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                {t('altMigrationTitle', { competitor: competitorName })}{' '}
                <span className="relative font-[family-name:var(--font-display)] italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
                  {t('altMigrationTitleBold')}
                  <span className="absolute -bottom-1 left-0 right-0 h-3 bg-indigo-100/60 -skew-x-3 rounded-sm -z-10" />
                </span>
              </h2>
              <p className="text-gray-500 mt-2">{t('altMigrationDesc', { competitor: competitorName })}</p>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4 p-5 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 border border-indigo-100 rounded-2xl">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-sm font-bold flex items-center justify-center">
                    {i}
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1">{t(`altMigrationStep${i}Title`)}</h3>
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">{t(`altMigrationStep${i}Desc`, { competitor: competitorName })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      <section className="relative py-16 md:py-24 bg-white">
        <div ref={faqRef} className="relative max-w-3xl mx-auto px-6">
          <div className={`text-center mb-12 md:mb-16 ${faqInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              {t('faqTitle')}{' '}
              <span className="relative font-[family-name:var(--font-display)] italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
                {t('faqTitleBold')}
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-indigo-100/60 -skew-x-3 rounded-sm -z-10" />
              </span>
            </h2>
          </div>

          <div className={`space-y-3 ${faqInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border bg-white shadow-md shadow-gray-200/60 border-gray-100 p-6">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">{t(`faqQ${i}`, { competitor: competitorName })}</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">{t(`faqA${i}`, { competitor: competitorName })}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div ref={finalRef} className="relative max-w-3xl mx-auto px-6 text-center">
          <div className={`${finalInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">{t('finalCtaTitle')}</h2>
            <p className="text-[1.05rem] md:text-lg text-gray-800 mb-8">{t('finalCtaDesc')}</p>
            <Link
              href="/auth/merchant/signup"
              onClick={() => trackCtaClick(`compare_${competitor}_final`, 'compare_final')}
              className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 bg-gradient-to-r from-indigo-600/90 to-violet-600/90 backdrop-blur-md text-white font-bold text-base sm:text-lg rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] border border-white/20"
            >
              <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              {t('ctaPrimary')}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-gray-400 mt-3">{t('ctaSecondary')}</p>
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
          <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Qarte. Tous droits r&eacute;serv&eacute;s.</p>
        </div>
      </footer>
    </>
  );
}
