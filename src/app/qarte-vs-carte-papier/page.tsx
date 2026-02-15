'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Check,
  X,
  ArrowRight,
  Lock,
  CreditCard,
  Printer,
  Smartphone,
  TrendingUp,
  ShieldCheck,
  Clock,
  Leaf,
  BarChart3,
} from 'lucide-react';
import { FacebookPixel, fbEvents } from '@/components/analytics/FacebookPixel';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const comparisons = [
  { feature: 'Impossible a perdre', papier: false, qarte: true },
  { feature: 'Fonctionne sans appli', papier: true, qarte: true },
  { feature: 'Notifications push automatiques', papier: false, qarte: true },
  { feature: 'Statistiques clients en temps reel', papier: false, qarte: true },
  { feature: 'Anti-fraude (tampons falsifies)', papier: false, qarte: true },
  { feature: 'Rappel clients inactifs', papier: false, qarte: true },
  { feature: 'Ecologique (zero papier)', papier: false, qarte: true },
  { feature: 'Cout d\'impression recurrent', papier: true, qarte: false },
  { feature: 'Personnalisable en 5 min', papier: false, qarte: true },
  { feature: 'Avis Google automatises', papier: false, qarte: true },
];

const stats = [
  { value: '73%', label: 'des cartes papier sont perdues ou oubliees', icon: Printer },
  { value: '5x', label: 'plus de retours clients avec une carte digitale', icon: TrendingUp },
  { value: '0€', label: 'd\'impression — fini les recharges chez l\'imprimeur', icon: Leaf },
  { value: '2 min', label: 'pour creer votre programme de fidelite', icon: Clock },
];

export default function QarteVsCartePapierPage() {
  return (
    <div className="min-h-screen bg-white">
      <FacebookPixel />

      {/* Header */}
      <header className="py-6 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Qarte</span>
          </Link>
          <Link
            href="/auth/merchant/signup"
            onClick={() => fbEvents.initiateCheckout()}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Essai gratuit
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-sm font-semibold mb-6">
              <BarChart3 className="w-4 h-4" />
              Comparatif 2026
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Carte de fidelite{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">digitale</span>
              {' '}vs{' '}
              <span className="text-gray-400">papier</span>
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              73% des cartes papier sont perdues ou oubliees. Decouvrez pourquoi les salons de beaute passent au digital — et comment Qarte le rend simple et abordable.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <stat.icon className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                <div className="text-3xl font-extrabold text-gray-900 mb-1">{stat.value}</div>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-4">
              Le comparatif complet
            </h2>
            <p className="text-gray-500 text-center mb-12">Pourquoi les commercants qui passent au digital ne reviennent jamais au papier.</p>

            <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_120px_120px] bg-gray-50 border-b border-gray-200">
                <div className="px-6 py-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Fonctionnalite</div>
                <div className="px-4 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider text-center">Papier</div>
                <div className="px-4 py-4 text-sm font-semibold text-indigo-600 uppercase tracking-wider text-center">Qarte</div>
              </div>

              {/* Table Rows */}
              {comparisons.map((row, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_120px_120px] items-center ${
                    i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  } ${i < comparisons.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="px-6 py-4 text-sm text-gray-700 font-medium">{row.feature}</div>
                  <div className="px-4 py-4 flex justify-center">
                    {row.papier ? (
                      row.feature.includes('Cout') ? (
                        <X className="w-5 h-5 text-red-400" />
                      ) : (
                        <Check className="w-5 h-5 text-emerald-500" />
                      )
                    ) : (
                      <X className="w-5 h-5 text-red-300" />
                    )}
                  </div>
                  <div className="px-4 py-4 flex justify-center">
                    {row.qarte ? (
                      <Check className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <div className="flex items-center gap-1">
                        <Check className="w-5 h-5 text-emerald-500" />
                        <span className="text-xs text-emerald-600 font-medium">0€</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Cost Comparison */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Le vrai cout sur 12 mois
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Paper Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-8 relative">
                <div className="absolute -top-3 left-6">
                  <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full uppercase">Papier</span>
                </div>
                <Printer className="w-10 h-10 text-gray-300 mb-6" />
                <ul className="space-y-4 text-sm text-gray-600 mb-8">
                  <li className="flex justify-between">
                    <span>Impression 500 cartes x 4/an</span>
                    <span className="font-semibold text-gray-900">~240€</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Tampons encreurs (usure)</span>
                    <span className="font-semibold text-gray-900">~30€</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Temps perdu (gestion manuelle)</span>
                    <span className="font-semibold text-gray-900">~50h</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Clients perdus (cartes oubliees)</span>
                    <span className="font-semibold text-red-500">incalculable</span>
                  </li>
                </ul>
                <div className="border-t border-gray-100 pt-4 flex justify-between items-baseline">
                  <span className="text-gray-500 text-sm">Total minimum</span>
                  <span className="text-2xl font-bold text-gray-900">~270€+</span>
                </div>
              </div>

              {/* Qarte Card */}
              <div className="bg-white rounded-2xl border-2 border-indigo-200 p-8 relative shadow-lg shadow-indigo-500/5">
                <div className="absolute -top-3 left-6">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-xs font-bold rounded-full uppercase">Qarte</span>
                </div>
                <Smartphone className="w-10 h-10 text-indigo-500 mb-6" />
                <ul className="space-y-4 text-sm text-gray-600 mb-8">
                  <li className="flex justify-between">
                    <span>Abonnement 19€/mois x 12</span>
                    <span className="font-semibold text-gray-900">228€</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Ou annuel (2 mois offerts)</span>
                    <span className="font-semibold text-indigo-600">190€</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Impression</span>
                    <span className="font-semibold text-emerald-500">0€</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Clients perdus</span>
                    <span className="font-semibold text-emerald-500">0 (notifications auto)</span>
                  </li>
                </ul>
                <div className="border-t border-indigo-100 pt-4 flex justify-between items-baseline">
                  <span className="text-gray-500 text-sm">Total annuel</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-indigo-600">190€</span>
                    <span className="text-sm text-emerald-500 font-medium ml-2">-30%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Qarte advantages */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Ce que le papier ne fera jamais
            </h2>
            <p className="text-gray-500 text-center mb-12">Avec Qarte, chaque visite devient une opportunite de fideliser.</p>

            <div className="grid sm:grid-cols-2 gap-6">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Anti-fraude Qarte Shield',
                  desc: 'Impossible de tricher avec des faux tampons. Chaque scan est verifie, geolocalise et securise.',
                },
                {
                  icon: TrendingUp,
                  title: 'Statistiques en temps reel',
                  desc: 'Voyez qui revient, qui decroche, et quel jour est le plus actif. Decidez avec des donnees, pas au feeling.',
                },
                {
                  icon: Smartphone,
                  title: 'Notifications push automatiques',
                  desc: 'Rappelez les clientes inactives, felicitez les fideles, annoncez vos promos — automatiquement.',
                },
                {
                  icon: Leaf,
                  title: 'Zero papier, zero dechet',
                  desc: 'Plus de cartes imprimees qui finissent a la poubelle. Bon pour la planete, bon pour votre image.',
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-6 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300">
                  <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-indigo-600 via-violet-600 to-rose-500">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Prete a passer au digital ?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              7 jours gratuits, sans carte bancaire. Votre programme de fidelite est pret en 5 minutes.
            </p>
            <Link
              href="/auth/merchant/signup"
              onClick={() => fbEvents.initiateCheckout()}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 font-bold rounded-2xl hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 text-lg"
            >
              Demarrer mon essai gratuit
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="flex items-center justify-center gap-2 mt-4 text-white/60 text-sm">
              <Lock className="w-4 h-4" />
              Sans engagement, sans CB
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="py-8 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">Q</span>
            </div>
            <span className="text-gray-900 font-semibold text-sm">Qarte</span>
          </Link>
          <p className="text-gray-400 text-sm">&copy; 2026 Qarte. Tous droits reserves.</p>
          <div className="flex gap-4">
            <Link href="/mentions-legales" className="text-gray-400 hover:text-indigo-600 text-sm transition-colors">Mentions legales</Link>
            <Link href="/politique-confidentialite" className="text-gray-400 hover:text-indigo-600 text-sm transition-colors">Confidentialite</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
