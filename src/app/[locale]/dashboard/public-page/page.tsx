'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  Globe,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  HelpCircle,
  X,
  Pencil,
  Palette,
  MapPin,
  Camera,
  Scissors,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { useMerchant } from '@/contexts/MerchantContext';
import { getSupabase } from '@/lib/supabase';
import InfoSection from './InfoSection';
import PhotosSection from './PhotosSection';
import WelcomeSection, { type WelcomeSectionHandle } from './WelcomeSection';
import ServicesSection from './ServicesSection';
import PromoSection from './PromoSection';

type SectionId = 'salon' | 'contenu' | 'prestations' | 'acquisition';

export default function PublicPageDashboard() {
  const router = useRouter();
  const t = useTranslations('publicPage');
  const { merchant, loading: merchantLoading, refetch } = useMerchant();
  const welcomeRef = useRef<WelcomeSectionHandle>(null);

  // Collapsible sections — all open by default
  const [openSections, setOpenSections] = useState<Set<SectionId>>(new Set(['salon', 'contenu', 'prestations', 'acquisition']));
  const toggleSection = (id: SectionId) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Help modals
  const [showHelp, setShowHelp] = useState(false);
  const [showWelcomeHelp, setShowWelcomeHelp] = useState(false);
  // Link copy
  const [copied, setCopied] = useState(false);

  const pageUrl = merchant?.slug ? `https://getqarte.com/p/${merchant.slug}` : '';

  const handleCopy = () => {
    if (!pageUrl) return;
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  // ── Completion bar ──
  const completion = useMemo(() => {
    if (!merchant) return { done: 0, total: 0, items: [] };
    const items = [
      { label: t('completionName'), ok: !!merchant.shop_name },
      { label: t('completionAddress'), ok: !!merchant.shop_address },
      { label: t('completionBio'), ok: !!merchant.bio },
      { label: t('completionLogo'), ok: !!merchant.logo_url },
      { label: t('completionHours'), ok: !!merchant.opening_hours && Object.values(merchant.opening_hours as Record<string, unknown>).some(Boolean) },
      { label: t('completionSocial'), ok: !!(merchant.instagram_url || merchant.facebook_url || merchant.tiktok_url || merchant.snapchat_url) },
      { label: t('completionWelcome'), ok: !!merchant.welcome_offer_enabled },
    ];
    return { done: items.filter(i => i.ok).length, total: items.length, items };
  }, [merchant]);

  if (merchantLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 p-5 md:p-6 rounded-2xl bg-violet-50/40 border border-violet-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-sm">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                {t('title')}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {t('subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowHelp(true)}
            className="shrink-0 w-9 h-9 rounded-xl bg-white border border-violet-200 flex items-center justify-center text-gray-400 hover:text-violet-600 hover:border-violet-300 transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Completion */}
        {merchant && completion.done < completion.total && (
          <div className="mt-4 pt-4 border-t border-violet-100/60">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative w-10 h-10 shrink-0">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="url(#completionGrad)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(completion.done / completion.total) * 94.2} 94.2`} />
                  <defs><linearGradient id="completionGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient></defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-gray-700">{completion.done}/{completion.total}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-700">{t('completionTitle')}</p>
                <p className="text-xs text-gray-400">{t('completionSubtitle')}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {completion.items.map(item => (
                <span
                  key={item.label}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    item.ok
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : 'bg-gray-50 text-gray-400 border border-gray-100'
                  }`}
                >
                  {item.ok ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <span className="w-3 h-3 rounded-full border-2 border-gray-300 inline-block" />
                  )}
                  {item.label}
                </span>
              ))}
            </div>
            {completion.done < 3 && (
              <p className="text-xs text-indigo-500 mt-3">{t('completionUnlock', { count: 3 - completion.done })}</p>
            )}
          </div>
        )}
      </div>

      {/* Help modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowHelp(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-violet-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{t('helpTitle')}</h3>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              {t('helpIntro')}
            </p>

            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-600 font-bold text-xs flex items-center justify-center">1</span>
                <p>{t('helpStep1')}</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-600 font-bold text-xs flex items-center justify-center">2</span>
                <p>{t('helpStep2')}</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-600 font-bold text-xs flex items-center justify-center">3</span>
                <p>{t('helpStep3')}</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 font-bold text-xs flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </span>
                <p>{t('helpStep4')}</p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full mt-6 py-2.5 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors"
            >
              {t('helpGotIt')}
            </button>
          </div>
        </div>
      )}

      {/* Welcome help modal */}
      {showWelcomeHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowWelcomeHelp(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{t('welcomeHelpTitle')}</h3>
              <button onClick={() => setShowWelcomeHelp(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { step: '1', title: t('welcomeHelpStep1Title'), desc: t('welcomeHelpStep1Desc') },
                { step: '2', title: t('welcomeHelpStep2Title'), desc: t('welcomeHelpStep2Desc') },
                { step: '3', title: t('welcomeHelpStep3Title'), desc: t('welcomeHelpStep3Desc') },
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 font-bold text-sm flex items-center justify-center shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowWelcomeHelp(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition-colors"
            >
              {t('welcomeHelpGotIt')}
            </button>
          </div>
        </div>
      )}

      {/* ── LIEN PAGE PUBLIQUE (visible quand page suffisamment remplie) ── */}
      {merchant?.slug && completion.done >= 3 && (
        <div className="bg-gradient-to-br from-indigo-50/80 to-violet-50/80 rounded-2xl border border-indigo-100 p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-white/70 border border-indigo-100 rounded-lg text-sm font-mono text-gray-600 truncate flex-1">
              getqarte.com/p/{merchant.slug}
            </div>
            <button
              onClick={handleCopy}
              className={`px-4 py-1.5 rounded-lg font-semibold text-sm flex items-center gap-1.5 transition-all shrink-0 ${
                copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? t('copied') : t('copy')}
            </button>
            <a
              href={`/p/${merchant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 rounded-lg font-semibold text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t('view')}
            </a>
          </div>
        </div>
      )}


      {/* ── 3 SECTIONS ── */}
      {merchant && (
        <div className="space-y-3">

          {/* ═══════ SECTION 1 : MON SALON ═══════ */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden border-l-4 border-l-emerald-400">
            <button
              onClick={() => toggleSection('salon')}
              className="w-full flex items-center justify-between p-4 md:p-5 bg-gradient-to-r from-emerald-50/60 to-transparent"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shadow-sm">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-base font-extrabold text-gray-900">{t('salonSection')}</h2>
                  <p className="text-xs text-gray-500">{t('salonDesc')}</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${openSections.has('salon') ? 'rotate-180' : ''}`} />
            </button>

            {openSections.has('salon') && (
              <div className="px-4 md:px-5 pb-5 space-y-0">
                {/* Logo & Ambiance */}
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/personalize?from=public-page')}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group mb-4"
                >
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                    {merchant.logo_url ? (
                      <img src={merchant.logo_url} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Palette className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-gray-700">
                      {merchant.logo_url ? t('logoAmbiance') : t('addYourLogo')}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: merchant.primary_color || '#654EDA' }} />
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: merchant.secondary_color || '#9D8FE8' }} />
                      <span className="text-[11px] text-gray-400">{t('ambiance')}</span>
                    </div>
                  </div>
                  <Pencil className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                </button>

                <InfoSection merchant={merchant} refetch={refetch} />
              </div>
            )}
          </div>

          {/* ═══════ SECTION 2 : CONTENU ═══════ */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden border-l-4 border-l-pink-400">
            <button
              onClick={() => toggleSection('contenu')}
              className="w-full flex items-center justify-between p-4 md:p-5 bg-gradient-to-r from-pink-50/60 to-transparent"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center shadow-sm">
                  <Camera className="w-5 h-5 text-pink-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-base font-extrabold text-gray-900">{t('photosSection')}</h2>
                  <p className="text-xs text-gray-500">{t('photosDesc')}</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${openSections.has('contenu') ? 'rotate-180' : ''}`} />
            </button>

            {openSections.has('contenu') && (
              <div className="px-4 md:px-5 pb-5 space-y-0">
                <PhotosSection merchant={merchant} />
              </div>
            )}
          </div>

          {/* ═══════ SECTION 3 : PRESTATIONS ═══════ */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden border-l-4 border-l-amber-400">
            <button
              onClick={() => toggleSection('prestations')}
              className="w-full flex items-center justify-between p-4 md:p-5 bg-gradient-to-r from-amber-50/60 to-transparent"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shadow-sm">
                  <Scissors className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-base font-extrabold text-gray-900">{t('servicesSection')}</h2>
                  <p className="text-xs text-gray-500">{t('servicesDesc')}</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${openSections.has('prestations') ? 'rotate-180' : ''}`} />
            </button>

            {openSections.has('prestations') && (
              <div className="px-4 md:px-5 pb-5 space-y-0">
                <ServicesSection merchant={merchant} />
              </div>
            )}
          </div>

          {/* ═══════ SECTION 4 : ACQUISITION ═══════ */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden border-l-4 border-l-violet-400">
            <button
              onClick={() => toggleSection('acquisition')}
              className="w-full flex items-center justify-between p-4 md:p-5 bg-gradient-to-r from-violet-50/60 to-transparent"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-base font-extrabold text-gray-900">{t('acquisitionSection')}</h2>
                  <p className="text-xs text-gray-500">{t('acquisitionDesc')}</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${openSections.has('acquisition') ? 'rotate-180' : ''}`} />
            </button>

            {openSections.has('acquisition') && (
              <div className="px-4 md:px-5 pb-5 space-y-0">
                <WelcomeSection ref={welcomeRef} merchant={merchant} refetch={refetch} onShowHelp={() => setShowWelcomeHelp(true)} />
                <PromoSection merchant={merchant} welcomeRef={welcomeRef} />
              </div>
            )}
          </div>


        </div>
      )}
    </div>
  );
}
