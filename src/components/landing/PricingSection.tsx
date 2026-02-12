'use client';

import { Check, Headphones, CreditCard, Zap, ShieldCheck } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';

export function PricingSection() {
  const { ref, isInView } = useInView();

  const features = [
    'Clientes illimitées',
    'QR Code perso',
    'Notifications push',
    'Programmation envois',
    'Dashboard analytics',
    'Avis Google',
    'Programme de parrainage',
    'Lien de réservation',
    'Support prioritaire',
    'Zéro commission'
  ];

  return (
    <section id="pricing" className="py-24 md:py-32 bg-gray-50">
      <div ref={ref} className="max-w-4xl mx-auto px-6">
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Un prix, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">tout inclus</span>
          </h2>
          <p className="text-xl text-gray-600">Pas de surprise, pas de frais cachés. Pensé pour les instituts et salons.</p>
        </div>

        {/* Pricing Card */}
        <div className={`relative max-w-md mx-auto group transition-all duration-500 hover:-translate-y-2 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
          {/* Trial Badge - Outside overflow container */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
            <div className="px-8 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold rounded-full shadow-xl shadow-indigo-500/20 tracking-[0.1em] uppercase whitespace-nowrap">
              15 jours gratuits
            </div>
          </div>

          <div className="relative bg-white border-2 border-indigo-100 rounded-[2.5rem] p-10 shadow-xl overflow-hidden">

            <div className="relative text-center pt-4 mb-10">
              <div className="inline-flex items-baseline justify-center gap-1.5">
                <span className="text-7xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600">
                  19€
                </span>
                <span className="text-xl font-semibold text-gray-400">/mois</span>
              </div>
              <p className="text-gray-500 text-sm mt-2">soit <span className="font-semibold text-indigo-600">~0,63€</span> par jour</p>
              <p className="text-indigo-600 font-semibold text-sm mt-3 tracking-wide uppercase">Tout inclus, sans engagement</p>
              <p className="text-indigo-600 font-medium text-sm mt-2">✨ Inscription sans carte bancaire</p>
              <p className="text-gray-400 text-xs mt-2">ou <span className="font-semibold text-gray-600">15,83€/mois</span> facturé annuellement — 2 mois offerts</p>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-10" />

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10 relative">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-indigo-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-indigo-600" />
                  </div>
                  <span className="text-gray-600 text-sm font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href="/auth/merchant/signup"
              onClick={() => { trackCtaClick('pricing_cta_2', 'pricing_section_2'); fbEvents.initiateCheckout(); }}
              className="block w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 text-center uppercase tracking-wider text-sm shadow-md shadow-indigo-500/15"
            >
              Démarrer maintenant
            </a>

            <p className="text-center text-gray-400 text-[10px] font-bold mt-6 uppercase tracking-[0.2em]">
              Annulation possible à tout moment
            </p>
          </div>
        </div>

        {/* Guarantee Badges */}
        <div className={`grid grid-cols-2 gap-3 md:flex md:flex-nowrap md:justify-center md:gap-4 mt-12 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 rounded-full border border-indigo-100 md:px-4">
            <Headphones className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span className="text-xs md:text-sm font-medium text-indigo-700 whitespace-nowrap">Support réactif 7j/7</span>
          </div>
          <div className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 rounded-full border border-indigo-100 md:px-4">
            <CreditCard className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span className="text-xs md:text-sm font-medium text-indigo-700 whitespace-nowrap">Sans CB pour essayer</span>
          </div>
          <div className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 rounded-full border border-indigo-100 md:px-4">
            <Zap className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span className="text-xs md:text-sm font-medium text-indigo-700 whitespace-nowrap">Activation instantanée</span>
          </div>
          <div className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 rounded-full border border-indigo-100 md:px-4">
            <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span className="text-xs md:text-sm font-medium text-indigo-700 whitespace-nowrap">Satisfait ou remboursé 30j</span>
          </div>
        </div>
      </div>
    </section>
  );
}
