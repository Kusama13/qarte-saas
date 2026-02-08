'use client';

import { Check, Headphones, CreditCard, Zap } from 'lucide-react';
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
    'Support prioritaire',
    'Zéro commission'
  ];

  return (
    <section id="pricing" className="py-24 bg-white">
      <div ref={ref} className="max-w-4xl mx-auto px-6">
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Un prix, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">tout inclus</span>
          </h2>
          <p className="text-xl text-gray-600">Pas de surprise, pas de frais cachés.</p>
        </div>

        {/* Pricing Card */}
        <div className={`relative max-w-md mx-auto group transition-all duration-500 hover:-translate-y-2 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
          {/* Trial Badge - Outside overflow container */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
            <div className="px-8 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold rounded-full shadow-xl shadow-emerald-500/20 tracking-[0.1em] uppercase whitespace-nowrap">
              15 jours gratuits
            </div>
          </div>

          {/* Premium Animated Shimmer Border */}
          <div className="absolute -inset-[2px] bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 rounded-[2.5rem] animate-landing-shimmer opacity-70 blur-[2px] group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative bg-white/80 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden">
            {/* Decorative Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -translate-y-1/2 pointer-events-none" />

            <div className="relative text-center pt-4 mb-10">
              <div className="inline-flex items-baseline justify-center gap-1.5">
                <span className="text-7xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600">
                  19€
                </span>
                <span className="text-xl font-semibold text-gray-400">/mois</span>
              </div>
              <p className="text-gray-500 text-sm mt-2">soit <span className="font-semibold text-indigo-600">~0,63€</span> par jour</p>
              <p className="text-indigo-600 font-semibold text-sm mt-3 tracking-wide uppercase">Tout inclus, sans engagement</p>
              <p className="text-emerald-600 font-medium text-sm mt-2">✨ Inscription sans carte bancaire</p>
              <p className="text-gray-400 text-xs mt-2">ou <span className="font-semibold text-gray-600">15,83€/mois</span> facturé annuellement — 2 mois offerts</p>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-10" />

            <ul className="grid grid-cols-2 gap-3 mb-10 relative">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 group/item">
                  <div className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 group-hover/item:bg-emerald-500/20 transition-all duration-300">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-gray-600 text-sm font-medium group-hover/item:text-gray-900 transition-colors">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="relative group/btn">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl blur-md opacity-20 group-hover/btn:opacity-40 transition-opacity duration-500" />
              <a
                href="/auth/merchant/signup"
                onClick={() => { trackCtaClick('pricing_cta_2', 'pricing_section_2'); fbEvents.initiateCheckout(); }}
                className="relative block w-full py-5 bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-600 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 text-center uppercase tracking-wider text-sm shadow-xl shadow-indigo-500/20"
              >
                Démarrer maintenant
              </a>
            </div>

            <p className="text-center text-gray-400 text-[10px] font-bold mt-6 uppercase tracking-[0.2em]">
              Annulation possible à tout moment
            </p>
          </div>
        </div>

        {/* Guarantee Badges */}
        <div className={`flex flex-wrap justify-center gap-6 mt-12 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
            <Headphones className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Support réactif 7j/7</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full border border-indigo-100">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">Sans CB pour essayer</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 rounded-full border border-violet-100">
            <Zap className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-medium text-violet-700">Activation instantanée</span>
          </div>
        </div>
      </div>
    </section>
  );
}
