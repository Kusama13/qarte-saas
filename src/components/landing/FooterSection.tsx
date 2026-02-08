'use client';

import { Shield, Leaf, CreditCard, ArrowRight } from 'lucide-react';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';

export function FooterSection() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Final CTA */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Prêt à simplifier votre fidélisation ?
          </h2>
          <a
            href="/auth/merchant/signup"
            onClick={() => { trackCtaClick('footer_cta', 'footer_section'); fbEvents.initiateCheckout(); }}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            Créer ma carte gratuite
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <p className="text-sm text-gray-500 mt-3">Essai 15 jours gratuit • Sans carte bancaire</p>
        </div>

        {/* Integration Logos */}
        <div className="flex flex-wrap items-center justify-center gap-8 mb-10 py-6 border-y border-gray-200">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Intégrations</span>
          <div className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
            </svg>
            <span className="text-sm font-medium">Stripe</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <span className="text-sm font-medium">Apple Wallet</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium">Google Wallet</span>
          </div>
        </div>

        {/* Trust Badges - Enhanced */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-gray-700 text-center">RGPD Compliant</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
              <Leaf className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-gray-700 text-center">Hébergement Vert</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100">
            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-lg">
              🇫🇷
            </div>
            <span className="text-xs font-semibold text-gray-700 text-center">Serveurs en France</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100">
            <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs font-semibold text-gray-700 text-center">Paiement Sécurisé</span>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="text-gray-900 font-semibold">Qarte</span>
          </div>

          <p className="text-gray-500 text-sm">
            © 2026 Qarte - Fidélisez mieux, dépensez moins
          </p>

          {/* Pages légales */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <a href="/contact" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">Contact</a>
            <a href="/mentions-legales" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">Mentions légales</a>
            <a href="/cgv" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">CGV</a>
            <a href="/politique-confidentialite" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
