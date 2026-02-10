'use client';

import { ArrowRight } from 'lucide-react';
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

        {/* Paiement sécurisé */}
        <div className="flex items-center justify-center gap-3 mb-10 py-6 border-y border-gray-200">
          <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
          </svg>
          <span className="text-sm font-medium text-gray-500">Paiement sécurisé par Stripe</span>
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
            <a href="/blog" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">Blog</a>
            <a href="/qarte-vs-carte-papier" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">Qarte vs Carte papier</a>
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
