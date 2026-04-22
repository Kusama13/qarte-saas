import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import LandingNav from '@/components/landing/LandingNav';
import { PricingSection } from '@/components/landing/PricingSection';
import { ScrollToTopButton } from '@/components/landing';
import { ArrowRight, ShieldCheck, CreditCard, Check } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricingPage' });
  return {
    title: t('metaTitle'),
    description: t('metaDesc'),
    alternates: {
      canonical: 'https://getqarte.com/pricing',
    },
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDesc'),
      url: 'https://getqarte.com/pricing',
    },
  };
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricingPage' });

  return (
    <>
      <LandingNav />
      <main className="overflow-hidden">
        {/* ── HERO ── */}
        <section className="relative bg-gradient-to-b from-white to-gray-50 pt-28 lg:pt-36 pb-8 md:pb-12 overflow-hidden">
          <div className="relative max-w-4xl mx-auto px-6 text-center">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold tracking-wide uppercase mb-6">
              {t('heroBadge')}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4">
              {t('heroTitle')}{' '}
              <span className="relative font-[family-name:var(--font-display)] italic text-indigo-600">
                {t('heroTitleHighlight')}
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-indigo-100/60 -skew-x-3 rounded-sm -z-10" />
              </span>
            </h1>
            <p className="text-[1.05rem] md:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
              {t('heroSubtitle')}
            </p>
          </div>
        </section>

        {/* ── PRICING (réutilise composant landing) ── */}
        <PricingSection />

        {/* ── TRUST SIGNALS ── */}
        <section className="relative pb-12 md:pb-16 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-600">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> {t('trustSecure')}</span>
              <span className="inline-flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> {t('trustGdpr')}</span>
              <span className="inline-flex items-center gap-2"><CreditCard className="w-4 h-4 text-emerald-500" /> {t('trustNoCommitment')}</span>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="relative py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-10 text-center">
              {t('faqTitle')}{' '}
              <span className="relative font-[family-name:var(--font-display)] italic text-indigo-600">
                {t('faqTitleHighlight')}
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-indigo-100/60 -skew-x-3 rounded-sm -z-10" />
              </span>
            </h2>

            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <details key={i} className="group rounded-2xl border bg-white shadow-md shadow-gray-200/60 border-gray-100 p-6 open:shadow-lg transition-shadow">
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900">{t(`faq.q${i}`)}</h3>
                    <span className="text-indigo-600 text-xl group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed mt-3">{t(`faq.a${i}`)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="relative py-16 md:py-24 bg-white">
          <div className="relative max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">{t('finalCtaTitle')}</h2>
            <p className="text-[1.05rem] md:text-lg text-gray-800 mb-8">{t('finalCtaSub')}</p>
            <Link
              href="/auth/merchant/signup"
              className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 bg-gradient-to-r from-indigo-600/90 to-violet-600/90 backdrop-blur-md text-white font-bold text-base sm:text-lg rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] border border-white/20"
            >
              <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              {t('finalCtaBtn')}
              <ArrowRight className="w-5 h-5" />
            </Link>
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
      </main>
      <ScrollToTopButton />
    </>
  );
}
