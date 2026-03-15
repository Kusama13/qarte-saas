'use client';

import { motion } from 'framer-motion';
import { Star, Search, CalendarDays, Scissors, Sparkles, UserPlus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';
import { ttEvents } from '@/components/analytics/TikTokPixel';

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

/* ── FeatureBlock (light variant) ── */

function FeatureBlock({
  title,
  titleBold,
  description,
  visual,
  reverse = false,
  delay = 0,
}: {
  title: string;
  titleBold: string;
  description: string;
  visual: React.ReactNode;
  reverse?: boolean;
  delay?: number;
}) {
  return (
    <div className={`flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-6 md:gap-10 lg:gap-24`}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, delay, ease: EASE }}
        className="flex-1 text-center lg:text-left"
      >
        <h3 className="text-2xl md:text-5xl font-bold text-gray-900 leading-tight mb-3 md:mb-5">
          {title}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500 font-extrabold">
            {titleBold}
          </span>
        </h3>
        <p className="text-base md:text-xl text-gray-500 leading-relaxed max-w-md mx-auto lg:mx-0">
          {description}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, delay: delay + 0.12, ease: EASE }}
        className="flex-1 flex justify-center"
      >
        {visual}
      </motion.div>
    </div>
  );
}

function Separator() {
  return <div className="w-24 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-auto" />;
}

/* ── Visuals ── */

function SeoVisual() {
  return (
    <div className="relative w-full max-w-[380px] mx-auto">
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white text-[9px] font-bold">G</span>
          </div>
          <span className="text-[10px] text-gray-400">getqarte.com/p/latelier</span>
        </div>
        <p className="text-base font-semibold text-blue-700 mb-1">L&apos;Atelier — Onglerie Paris 11e</p>
        <p className="text-xs text-gray-500 leading-relaxed">Bio, horaires, prestations, programme fidelite. Prothesiste ongulaire a Paris 11e.</p>
        <div className="flex items-center gap-1 mt-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          ))}
          <span className="text-[11px] text-gray-400 ml-1">4.9 (127 avis)</span>
        </div>
      </div>

      <div className="absolute -top-3 -right-3 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-lg shadow-gray-200/40 border border-blue-100 animate-float-subtle">
        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
          <Search className="w-3 h-3 text-white" />
        </div>
        <span className="text-xs font-bold text-gray-800">Page 1</span>
      </div>
    </div>
  );
}

function PlanningVisual() {
  return (
    <div className="relative w-full max-w-[340px] mx-auto">
      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-3xl shadow-xl shadow-indigo-100/30 border border-indigo-100 p-5">
        <div className="space-y-3">
          {[
            { day: 'Lun 17', slots: ['10h', '14h', '16h30'] },
            { day: 'Mar 18', slots: ['9h30', '11h'] },
            { day: 'Mer 19', slots: ['14h', '15h30', '17h'] },
          ].map((d) => (
            <motion.div
              key={d.day}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: EASE }}
              className="flex items-center gap-3"
            >
              <span className="text-xs font-bold text-gray-500 w-14 shrink-0">{d.day}</span>
              <div className="flex gap-1.5 flex-wrap">
                {d.slots.map((s) => (
                  <span key={s} className="text-[10px] font-bold text-indigo-600 bg-white border border-indigo-100 rounded-lg px-2.5 py-1 shadow-sm">{s}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute -top-3 -right-3 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-lg shadow-gray-200/40 border border-indigo-100 animate-float-subtle">
        <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
          <CalendarDays className="w-3 h-3 text-white" />
        </div>
        <span className="text-xs font-bold text-gray-800">8 creneaux</span>
      </div>
    </div>
  );
}

function PrestationsVisual() {
  return (
    <div className="relative w-full max-w-[340px] mx-auto">
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 p-5 space-y-2.5">
        {[
          { name: 'Pose complete gel', price: '45 EUR', dur: '1h15' },
          { name: 'Semi-permanent', price: '30 EUR', dur: '45min' },
          { name: 'Nail art (par ongle)', price: '5 EUR', dur: '10min' },
        ].map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.08, ease: EASE }}
            className="flex items-center justify-between py-2.5 px-3.5 bg-gray-50 rounded-xl hover:bg-gray-100/80 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-gray-700">{s.name}</p>
              <p className="text-[10px] text-gray-400">{s.dur}</p>
            </div>
            <span className="text-sm font-bold text-gray-900">{s.price}</span>
          </motion.div>
        ))}
      </div>

      <div className="absolute -top-3 -right-3 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-lg shadow-gray-200/40 border border-rose-100 animate-float-subtle">
        <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
          <Scissors className="w-3 h-3 text-white" />
        </div>
        <span className="text-xs font-bold text-gray-800">3 prestations</span>
      </div>
    </div>
  );
}

function WelcomeOfferVisual() {
  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      <div className="bg-gradient-to-br from-violet-50 to-pink-50 rounded-3xl shadow-xl shadow-violet-100/30 border border-violet-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">Offre de bienvenue</span>
        </div>
        <p className="text-lg font-bold text-gray-800 mb-4">-20% sur votre premiere visite</p>
        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl px-4 py-2.5 text-center shadow-lg shadow-indigo-200/40">
          <span className="text-sm font-bold text-white">En profiter</span>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3, ease: EASE }}
          className="flex items-center gap-2 mt-4 bg-emerald-50 rounded-xl px-3 py-2.5"
        >
          <UserPlus className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-bold text-emerald-700">Sophie M. — Nouvelle cliente</span>
        </motion.div>
      </div>

      <div className="absolute -top-3 -right-3 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-lg shadow-gray-200/40 border border-violet-100 animate-float-subtle">
        <div className="w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
        <span className="text-xs font-bold text-gray-800">+1 cliente</span>
      </div>
    </div>
  );
}

/* ── Section ── */

export function PageProSection() {
  return (
    <section className="relative py-20 md:py-28 bg-white overflow-hidden">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-100/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-violet-100/30 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-14 md:mb-16"
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

        <div className="flex flex-col gap-6 md:gap-10 lg:gap-12">
          <FeatureBlock
            title="Visible sur Google,"
            titleBold="trouvable en un clic."
            description="Ta page pro est indexee et bien referencee dans ta ville. Les clientes te trouvent sans chercher."
            visual={<SeoVisual />}
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title="Tes dispos,"
            titleBold="en temps reel."
            description="Publie tes creneaux en un clic. Tes clientes voient quand tu es libre — plus besoin d'echanger 10 messages."
            visual={<PlanningVisual />}
            reverse
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title="Prestations et tarifs,"
            titleBold="tout est clair."
            description="Affiche tes services avec les prix. Tes clientes savent ce que tu proposes avant de venir."
            visual={<PrestationsVisual />}
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title="Offre de bienvenue,"
            titleBold="nouvelles clientes."
            description="Configure une offre en 30 secondes. Les nouvelles clientes la decouvrent sur ta page et s'inscrivent."
            visual={<WelcomeOfferVisual />}
            reverse
            delay={0.05}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mt-20 text-center"
        >
          <Link
            href="/auth/merchant/signup"
            onClick={() => { trackCtaClick('page_pro_cta', 'page_pro_section'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            Attire de nouvelles clientes en 5 min
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-3 text-sm text-gray-400">7 jours gratuits, sans carte bancaire</p>
        </motion.div>
      </div>
    </section>
  );
}
