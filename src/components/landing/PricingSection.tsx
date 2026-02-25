'use client';

import Image from 'next/image';
import { Check, Headphones, CreditCard, Zap, Quote } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';
import { ttEvents } from '@/components/analytics/TikTokPixel';

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
      <div ref={ref} className="max-w-6xl mx-auto px-6">
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Un prix, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">tout inclus</span>
          </h2>
          <p className="text-xl text-gray-600">Pas de surprise, pas de frais cachés. Pensé pour toi.</p>
        </div>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">

          {/* Left: Pricing Card */}
          <div className={`relative group transition-all duration-500 hover:-translate-y-2 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
            {/* Trial Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
              <div className="px-8 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold rounded-full shadow-xl shadow-indigo-500/20 tracking-[0.1em] uppercase whitespace-nowrap">
                7 jours gratuits
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
                <p className="text-indigo-600 font-medium text-sm mt-2">Inscription sans carte bancaire</p>
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
                onClick={() => { trackCtaClick('pricing_cta_2', 'pricing_section_2'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
                className="block w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 text-center uppercase tracking-wider text-sm shadow-md shadow-indigo-500/15"
              >
                Lancer mon essai gratuit
              </a>

              <p className="text-center text-gray-400 text-[10px] font-bold mt-6 uppercase tracking-[0.2em]">
                Annulation possible à tout moment
              </p>
            </div>
          </div>

          {/* Right: Photo + Citation */}
          <div className={`relative ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
            <div className="relative h-[300px] lg:h-[580px] rounded-3xl lg:rounded-[2.5rem] overflow-hidden shadow-2xl">
              <Image
                src="/images/mockup-beaute.jpg"
                alt="Professionnelle de beauté utilisant Qarte"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-8">
                <Quote className="w-8 h-8 text-white/40 mb-3 rotate-180" />
                <p className="text-white text-lg font-medium leading-relaxed mb-4">
                  Mes clientes adorent scanner leur carte. En 2 mois, j&apos;ai doublé mes visites régulières.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm">
                    S
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Sarah M.</p>
                    <p className="text-white/70 text-xs">Gérante — Lunzia Studio, Paris</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Guarantee Badges */}
        <div className={`grid grid-cols-2 gap-3 md:flex md:flex-nowrap md:justify-center md:gap-4 mt-12 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.6s' }}>
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
        </div>
      </div>
    </section>
  );
}
