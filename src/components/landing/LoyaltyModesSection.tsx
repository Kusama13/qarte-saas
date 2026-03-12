'use client';

import { motion } from 'framer-motion';
import { Heart, Wallet, Gift, Percent, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useInView } from '@/hooks/useInView';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';
import { ttEvents } from '@/components/analytics/TikTokPixel';

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

/* ── Carte Mode Passages ── */
function PassagesCard() {
  return (
    <div className="relative bg-white rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-100/30 p-6 md:p-8 flex flex-col items-center text-center h-full">
      {/* Icône */}
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-5 shadow-lg shadow-indigo-200/50">
        <Heart className="w-6 h-6 text-white fill-white" />
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mb-1">Mode Passages</h3>
      <p className="text-sm font-semibold text-indigo-500 mb-3">Idéal pour les prestations à prix fixe</p>
      <p className="text-base text-gray-500 leading-relaxed mb-6">
        Tes clientes voient leur carte se remplir à chaque visite. L&apos;effet visuel est addictif — elles reviennent plus vite pour atteindre la récompense. Parfait pour les prothésistes ongulaires, les cils et les barbiers.
      </p>

      {/* Mini mockup: stamp grid */}
      <div className="bg-gray-50 rounded-xl p-4 w-full mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ma fidélité</span>
          <span className="text-[11px] font-extrabold text-indigo-500">7/10</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                i < 7
                  ? 'bg-gradient-to-br from-indigo-500 to-violet-500'
                  : 'border-2 border-dashed border-gray-200'
              }`}
            >
              {i < 7 && <Heart className="w-3.5 h-3.5 text-white fill-white" />}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2">
          <Gift className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold text-indigo-700">Brushing offert</span>
        </div>
      </div>

    </div>
  );
}

/* ── Carte Mode Cagnotte ── */
function CagnotteCard() {
  return (
    <div className="relative bg-gradient-to-br from-violet-50 to-pink-50 rounded-2xl border border-violet-100 shadow-xl shadow-violet-100/30 p-6 md:p-8 flex flex-col items-center text-center h-full">
      {/* Icône */}
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center mb-5 shadow-lg shadow-violet-200/50 relative">
        <Wallet className="w-6 h-6 text-white" />
        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white text-violet-600 text-[10px] font-black flex items-center justify-center shadow-sm">&euro;</span>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mb-1">Mode Cagnotte</h3>
      <p className="text-sm font-semibold text-violet-500 mb-3">Idéal quand les montants varient</p>
      <p className="text-base text-gray-500 leading-relaxed mb-6">
        Plus ta cliente dépense, plus sa cagnotte grossit. Elle est récompensée à la hauteur de sa fidélité — et ton panier moyen augmente naturellement. Parfait pour les coiffeurs et les spas.
      </p>

      {/* Mini mockup: cagnotte progress */}
      <div className="bg-white/80 rounded-xl p-4 w-full mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ma cagnotte</span>
          <span className="text-[11px] font-extrabold text-violet-500">320 € cumulés</span>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div className="h-full w-[80%] bg-gradient-to-r from-violet-400 to-pink-500 rounded-full" />
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-lg font-bold text-gray-900">8</p>
            <p className="text-[10px] text-gray-400">visites</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center flex-1">
            <p className="text-lg font-bold text-gray-900">320 €</p>
            <p className="text-[10px] text-gray-400">cumulés</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center flex-1">
            <p className="text-lg font-bold text-violet-600">32 €</p>
            <p className="text-[10px] text-gray-400">de réduction</p>
          </div>
        </div>

        {/* Reward tag */}
        <div className="mt-3 flex items-center gap-2 bg-violet-50 rounded-lg px-3 py-2">
          <Percent className="w-4 h-4 text-violet-500" />
          <span className="text-xs font-bold text-violet-700">10% de cagnotte cumulée</span>
        </div>
      </div>

    </div>
  );
}

export function LoyaltyModesSection() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-20 bg-white overflow-hidden">
      <div ref={ref} className="px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
          className="text-center mb-12 max-w-5xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            Un programme qui s&apos;adapte à{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
              ton salon.
            </span>
          </h2>
          <p className="mt-3 text-gray-500 text-lg">
            Tampons ou cagnotte ? Choisis le mode qui colle à ta façon de travailler.
          </p>
        </motion.div>

        {/* Two cards */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
          >
            <PassagesCard />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.25, ease: EASE }}
          >
            <CagnotteCard />
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.35, ease: EASE }}
          className="text-center mt-10"
        >
          <Link
            href="/auth/merchant/signup"
            onClick={() => { trackCtaClick('loyalty_modes_cta', 'loyalty_modes_section'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50 transition-all duration-300 hover:-translate-y-0.5"
          >
            Essaie gratuitement pendant 7 jours
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-3 text-sm text-gray-400">Sans carte bancaire</p>
        </motion.div>
      </div>
    </section>
  );
}
