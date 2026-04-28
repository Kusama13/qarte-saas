'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';
import { ttEvents } from '@/components/analytics/TikTokPixel';
import { Star } from 'lucide-react';

export function FooterCta() {
  const t = useTranslations('footer');

  return (
    <div className="bg-gray-50 border-t border-gray-200 py-16">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {t('ctaTitle')}
        </h2>
        <ul className="inline-flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-emerald-700 font-semibold mb-6">
          <li className="flex items-center gap-1.5"><span>✓</span> {t('ctaChecklist1')}</li>
          <li className="flex items-center gap-1.5"><span>✓</span> {t('ctaChecklist2')}</li>
          <li className="flex items-center gap-1.5"><span>✓</span> {t('ctaChecklist3')}</li>
        </ul>
        <Link
          href="/auth/merchant/signup"
          onClick={() => { trackCtaClick('footer_cta', 'footer_section'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
          className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          {t('ctaButton')}
        </Link>
        <p className="mt-3 text-xs text-gray-500">{t('ctaTrust')}</p>
      </div>
    </div>
  );
}

export function FooterDark() {
  const t = useTranslations('footer');

  return (
    <div className="bg-[#1e1b2e] text-white">
      <div className="max-w-6xl mx-auto px-6 py-14">
        {/* Colonnes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12">
          {/* Col 1 : Logo + tagline */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block text-3xl font-extrabold tracking-tight text-indigo-300 mb-4">
              Qarte
            </Link>
            <p className="text-gray-400 text-base leading-relaxed">
              {t('tagline')}
            </p>
            <p className="text-gray-300 text-xs mt-4">
              {t('madeIn')}
            </p>
            <a
              href="https://share.google/wD2tUZFy21CJ1IoBa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 mt-3 rounded-full bg-white/10 border border-white/10 hover:bg-white/15 transition-all"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-[11px] font-semibold text-gray-300">{t('googleRating')}</span>
            </a>
          </div>

          {/* Col 2 : Support */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t('support')}</h3>
            <div className="flex flex-col gap-3">
              <Link href="/contact" className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                {t('contact')}
              </Link>
              <a href="https://wa.me/33607447420" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          </div>

          {/* Col 3 : Liens rapides */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t('quickLinks')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/blog" className="text-gray-300 hover:text-white transition-colors text-sm underline underline-offset-4 decoration-gray-600 hover:decoration-white">
                  {t('blog')}
                </Link>
              </li>
              <li>
                <Link href="/mentions-legales" className="text-gray-300 hover:text-white transition-colors text-sm underline underline-offset-4 decoration-gray-600 hover:decoration-white">
                  {t('legalNotices')}
                </Link>
              </li>
              <li>
                <Link href="/cgv" className="text-gray-300 hover:text-white transition-colors text-sm underline underline-offset-4 decoration-gray-600 hover:decoration-white">
                  {t('terms')}
                </Link>
              </li>
              <li>
                <Link href="/politique-confidentialite" className="text-gray-300 hover:text-white transition-colors text-sm underline underline-offset-4 decoration-gray-600 hover:decoration-white">
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link href="/ambassadeur" className="text-gray-300 hover:text-white transition-colors text-sm underline underline-offset-4 decoration-gray-600 hover:decoration-white">
                  {t('ambassador')}
                </Link>
              </li>
            </ul>

            <h3 className="font-semibold text-lg mt-8 mb-4">{t('alternatives')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/compare/planity" className="text-gray-300 hover:text-white transition-colors text-sm underline underline-offset-4 decoration-gray-600 hover:decoration-white">
                  Qarte vs Planity
                </Link>
              </li>
              <li>
                <Link href="/compare/booksy" className="text-gray-300 hover:text-white transition-colors text-sm underline underline-offset-4 decoration-gray-600 hover:decoration-white">
                  Qarte vs Booksy
                </Link>
              </li>
              <li>
                <Link href="/compare/bookinbeautiful" className="text-gray-300 hover:text-white transition-colors text-sm underline underline-offset-4 decoration-gray-600 hover:decoration-white">
                  Qarte vs Book in Beautiful
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4 : Réseaux sociaux */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t('followUs')}</h3>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/qarte.app" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-pink-400 transition-colors" aria-label="Instagram">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://www.facebook.com/profile.php?id=61587048661028" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-blue-400 transition-colors" aria-label="Facebook">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://www.tiktok.com/@getqarte" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors" aria-label="TikTok">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13.2a8.16 8.16 0 005.58 2.17v-3.45a4.85 4.85 0 01-3.77-1.46V6.69h3.77z"/></svg>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright + Language Switcher */}
        <div className="mt-12 pt-8 border-t border-gray-700/50 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-gray-300 text-sm">
            {t('copyright')}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-gray-300 text-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
              </svg>
              <span>{t('securePayment')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FooterSection() {
  return (
    <footer>
      <FooterCta />
      <FooterDark />
    </footer>
  );
}
