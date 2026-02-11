'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';

export function ComparisonSection() {
  const { ref, isInView } = useInView();

  const painPoints = [
    "Cartes papier perdues au fond du sac",
    "Clientes qui ne reviennent pas après un soin",
    "Difficulté à obtenir des avis Google",
    "Impossible de relancer les clientes inactives",
    "Aucune visibilité sur votre clientèle",
    "Gaspillage de papier et d'encre",
    "Configuration longue et coûteuse"
  ];

  const benefits = [
    "Carte digitale toujours sur le téléphone de vos clientes",
    "Vos clientes reviennent plus souvent",
    "Collectez des avis Google après chaque visite",
    "Notifications push pour rappeler vos clientes",
    "Programmes VIP pour vos meilleures clientes",
    "Dashboard pour suivre votre activité",
    "100% écologique, zéro papier"
  ];

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div ref={ref} className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Pourquoi choisir{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              Qarte
            </span>{' '}
            ?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comparez et faites le bon choix pour votre institut.
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-stretch">
          {/* LEFT CARD - Sans Carte */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="group p-8 rounded-3xl bg-gray-50 border border-gray-200 transition-all duration-300 hover:shadow-lg"
          >
            <div className="mb-8">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-red-600 bg-red-50 mb-4">
                Méthode Classique
              </span>
              <h3 className="text-2xl font-bold text-gray-900">Sans fidélité digitale</h3>
            </div>

            <ul className="space-y-4">
              {painPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5 bg-red-100 rounded-full p-1 flex-shrink-0">
                    <X className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-gray-600 font-medium leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* RIGHT CARD - Avec Qarte (EMPHASIZED) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative p-8 rounded-3xl bg-white border-2 border-indigo-200 shadow-xl shadow-indigo-500/10 md:scale-[1.02] z-10"
          >
            {/* Recommendation Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
              Recommandé
            </div>

            <div className="mb-8 pt-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 mb-4">
                Solution Moderne
              </span>
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                Avec Qarte
              </h3>
            </div>

            <ul className="space-y-4">
              {benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-3 group/item">
                  <div className="mt-0.5 bg-emerald-500 rounded-full p-1 flex-shrink-0 transition-transform group-hover/item:scale-110">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700 font-semibold leading-relaxed">{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-6 border-t border-indigo-100">
              <a
                href="/auth/merchant/signup"
                onClick={() => { trackCtaClick('pricing_cta', 'pricing_section'); fbEvents.initiateCheckout(); }}
                className="block w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] text-center"
              >
                Démarrer mon essai gratuit
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
