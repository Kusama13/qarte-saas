'use client';

import { motion } from 'framer-motion';
import { Star, Search, CalendarDays, Scissors, Sparkles, UserPlus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useInView } from '@/hooks/useInView';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';
import { ttEvents } from '@/components/analytics/TikTokPixel';

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

/* ── Card: SEO Google Local ── */
function SeoCard() {
  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/30 p-6 flex flex-col h-full">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-200/50">
        <Search className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">Visible sur Google</h3>
      <p className="text-sm text-gray-500 leading-relaxed mb-5">
        Ta page pro est indexée et bien référencée dans ta ville. Les clientes te trouvent en un coup d&apos;oeil.
      </p>

      {/* Mini mockup: Google result */}
      <div className="bg-gray-50 rounded-xl p-4 mt-auto">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">G</span>
          </div>
          <span className="text-[10px] text-gray-400">getqarte.com/p/latelier</span>
        </div>
        <p className="text-sm font-semibold text-blue-700 mb-0.5">L&apos;Atelier — Onglerie Paris 11e</p>
        <p className="text-[11px] text-gray-500">Bio, horaires, prestations, programme fidélité. Prothésiste ongulaire à Paris 11e.</p>
        <div className="flex items-center gap-1 mt-1.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
          ))}
          <span className="text-[10px] text-gray-400 ml-1">4.9 (127 avis)</span>
        </div>
      </div>
    </div>
  );
}

/* ── Card: Planning / Disponibilites ── */
function PlanningCard() {
  return (
    <div className="relative bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-100/30 p-6 flex flex-col h-full">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-4 shadow-lg shadow-indigo-200/50">
        <CalendarDays className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">Planning en ligne</h3>
      <p className="text-sm text-gray-500 leading-relaxed mb-5">
        Publie tes dispos en un clic. Tes clientes voient quand tu es libre — plus besoin d&apos;échanger 10 messages.
      </p>

      {/* Mini mockup: Planning slots */}
      <div className="bg-white/80 rounded-xl p-4 mt-auto space-y-2">
        {[
          { day: 'Lun 17', slots: ['10h', '14h', '16h30'] },
          { day: 'Mar 18', slots: ['9h30', '11h'] },
          { day: 'Mer 19', slots: ['14h', '15h30', '17h'] },
        ].map((d) => (
          <div key={d.day} className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500 w-12 shrink-0">{d.day}</span>
            <div className="flex gap-1 flex-wrap">
              {d.slots.map((s) => (
                <span key={s} className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md px-1.5 py-0.5">{s}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Card: Prestations & Tarifs ── */
function PrestationsCard() {
  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/30 p-6 flex flex-col h-full">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg shadow-rose-200/50">
        <Scissors className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">Prestations et tarifs</h3>
      <p className="text-sm text-gray-500 leading-relaxed mb-5">
        Affiche tes services avec les prix. Tes clientes savent ce que tu proposes avant de venir.
      </p>

      {/* Mini mockup: Services list */}
      <div className="bg-gray-50 rounded-xl p-4 mt-auto space-y-2">
        {[
          { name: 'Pose complète gel', price: '45 €', dur: '1h15' },
          { name: 'Semi-permanent', price: '30 €', dur: '45min' },
          { name: 'Nail art (par ongle)', price: '5 €', dur: '10min' },
        ].map((s) => (
          <div key={s.name} className="flex items-center justify-between py-1.5 px-2.5 bg-white rounded-lg">
            <div>
              <p className="text-[11px] font-semibold text-gray-700">{s.name}</p>
              <p className="text-[9px] text-gray-400">{s.dur}</p>
            </div>
            <span className="text-[11px] font-bold text-gray-900">{s.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Card: Offre de bienvenue ── */
function WelcomeOfferCard() {
  return (
    <div className="relative bg-gradient-to-br from-violet-50 to-pink-50 rounded-2xl border border-violet-100 shadow-xl shadow-violet-100/30 p-6 flex flex-col h-full">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-200/50">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">Offre de bienvenue</h3>
      <p className="text-sm text-gray-500 leading-relaxed mb-5">
        Configure une offre en 30 secondes. Les nouvelles clientes la découvrent sur ta page et s&apos;inscrivent.
      </p>

      {/* Mini mockup: Offer card */}
      <div className="bg-white/80 rounded-xl p-4 mt-auto">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">Offre de bienvenue</span>
        </div>
        <p className="text-sm font-bold text-gray-800 mb-3">-20% sur votre première visite</p>
        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg px-3 py-2 text-center">
          <span className="text-xs font-bold text-white">En profiter</span>
        </div>
        <div className="flex items-center gap-2 mt-3 bg-emerald-50 rounded-lg px-3 py-2">
          <UserPlus className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[11px] font-bold text-emerald-700">Sophie M. — Nouvelle cliente</span>
        </div>
      </div>
    </div>
  );
}

export function PageProSection() {
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
          <p className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-4">
            Ta page pro
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            Tout ton salon{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
              sur une seule page.
            </span>
          </h2>
          <p className="mt-3 text-gray-500 text-lg">
            Bio, horaires, prestations, dispos, offre bienvenue — visible sur Google et partageable en un lien.
          </p>
        </motion.div>

        {/* Four cards grid */}
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          >
            <SeoCard />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
          >
            <PlanningCard />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
          >
            <PrestationsCard />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4, ease: EASE }}
          >
            <WelcomeOfferCard />
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5, ease: EASE }}
          className="text-center mt-10"
        >
          <Link
            href="/auth/merchant/signup"
            onClick={() => { trackCtaClick('page_pro_cta', 'page_pro_section'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50 transition-all duration-300 hover:-translate-y-0.5"
          >
            Booste ton salon en 5 min
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-3 text-sm text-gray-400">7 jours d&apos;essai gratuit</p>
        </motion.div>
      </div>
    </section>
  );
}
