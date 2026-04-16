'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  BookOpen,
  Scale,
  Zap,
  Target,
  Scissors,
  Sparkles,
} from 'lucide-react';
import { FacebookPixel } from '@/components/analytics/FacebookPixel';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const tocItems = [
  { id: 'criteres', label: 'Les 7 critères qui comptent vraiment' },
  { id: 'comparatif', label: 'Comparatif Planity, Treatwell, Booksy, Qarte' },
  { id: 'detail', label: 'Analyse détaillée de chaque logiciel' },
  { id: 'quel-choisir', label: 'Quel logiciel pour quel type de salon ?' },
  { id: 'faq', label: 'Questions fréquentes' },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Blog', item: 'https://getqarte.com/blog' },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Logiciel de réservation en ligne pour salon de beauté',
          item: 'https://getqarte.com/blog/logiciel-reservation-en-ligne-salon-beaute',
        },
      ],
    },
    {
      '@type': 'Article',
      headline: 'Logiciel de réservation en ligne pour salon de beauté : comparatif 2026',
      description:
        'Comparatif détaillé des logiciels de réservation pour salon de coiffure, institut et onglerie. Planity, Treatwell, Booksy, Qarte.',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
      datePublished: '2026-04-16',
      dateModified: '2026-04-16',
      author: { '@type': 'Organization', name: 'Qarte', url: 'https://getqarte.com' },
      publisher: {
        '@type': 'Organization',
        name: 'Qarte',
        logo: { '@type': 'ImageObject', url: 'https://getqarte.com/logo.png' },
      },
      mainEntityOfPage: 'https://getqarte.com/blog/logiciel-reservation-en-ligne-salon-beaute',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Quel est le meilleur logiciel de réservation en ligne pour un salon de coiffure ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Il n'y a pas de meilleur logiciel universel. Planity domine en France sur l'annuaire (2,5M visiteurs/mois) mais prend 30 €/mois + commission sur nouveaux clients. Qarte (24 €/mois sans commission) convient aux salons qui veulent fidéliser leur fichier et être propriétaires de leur audience. Treatwell est adapté aux grandes villes et gros salons. Booksy est la référence pour les barbershops.",
          },
        },
        {
          '@type': 'Question',
          name: 'Combien coûte un logiciel de réservation pour salon de beauté en 2026 ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Les tarifs vont de 19 € à 79 €/mois selon les fonctionnalités et le nombre de collaborateurs. Planity : ~30 €/mois + commissions. Treatwell : à partir de 35 €/mois + 2,5 % de commission. Booksy : 29-79 €/mois selon le plan. Qarte : 24 €/mois sans commission ni frais par réservation.",
          },
        },
        {
          '@type': 'Question',
          name: "Faut-il préférer un logiciel avec annuaire (type marketplace) ou sans ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "L'annuaire (Planity, Treatwell) apporte du trafic mais prélève une commission de 20-30 % sur les nouveaux clients et affiche tes concurrents à côté de toi. Sans annuaire (Qarte), tu gardes 100 % de tes revenus mais dois générer ton propre trafic (Google Business, Instagram). Idéal : commencer avec annuaire pour l'acquisition, migrer vers sans annuaire quand le bouche-à-oreille prend le relais.",
          },
        },
        {
          '@type': 'Question',
          name: 'Quelles fonctionnalités essentielles pour un salon en 2026 ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Réservation en ligne 24h/24, acompte sécurisé, SMS de rappel automatiques, calendrier multi-collaborateurs, programme de fidélité intégré, page salon avec photos, gestion des avis Google. La fidélité intégrée (et pas en option payante) est ce qui différencie les logiciels modernes des solutions legacy.",
          },
        },
      ],
    },
  ],
};

interface Tool {
  name: string;
  tag: string;
  price: string;
  commission: string;
  marketplace: boolean;
  loyalty: string;
  deposit: boolean;
  bestFor: string;
  weakness: string;
}

const tools: Tool[] = [
  {
    name: 'Planity',
    tag: 'Leader annuaire FR',
    price: '29,90 €/mois',
    commission: '~30 % sur nouveaux clients marketplace',
    marketplace: true,
    loyalty: 'Basique',
    deposit: true,
    bestFor: "Salons urbains qui veulent l'exposition marketplace",
    weakness: 'Commission élevée, concurrence visible, dépendance',
  },
  {
    name: 'Treatwell',
    tag: 'Marketplace EU',
    price: 'À partir de 35 €/mois',
    commission: '2,5 % sur tous les RDV en ligne',
    marketplace: true,
    loyalty: 'Limitée',
    deposit: true,
    bestFor: 'Grandes villes, instituts premium, trafic touristique',
    weakness: 'Commission sur tous les RDV (même fidèles), UX datée',
  },
  {
    name: 'Booksy',
    tag: 'Référence barbershop',
    price: '29 € à 79 €/mois',
    commission: '0 % sur RDV existants, 3 % sur nouveaux',
    marketplace: true,
    loyalty: 'Oui (marketing tools)',
    deposit: true,
    bestFor: 'Barbershops, indépendants à domicile',
    weakness: 'Interface US, moins de notoriété en France',
  },
  {
    name: 'Qarte',
    tag: 'Réservation + fidélité + vitrine',
    price: '24 €/mois',
    commission: '0 % sur toutes les réservations',
    marketplace: false,
    loyalty: 'Intégrée (tampons + cagnotte)',
    deposit: true,
    bestFor: 'Salons qui veulent fidéliser et être propriétaires de leur audience',
    weakness: "Pas d'annuaire : trafic à générer via Google Business + Instagram",
  },
];

export default function Page() {
  return (
    <>
      <FacebookPixel />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-indigo-700">
              Qarte
            </Link>
            <Link
              href="/auth/merchant/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Essai gratuit
            </Link>
          </div>
        </header>

        <section className="py-12 sm:py-16 bg-gradient-to-b from-indigo-50/50 to-white">
          <div className="max-w-3xl mx-auto px-6">
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <Link href="/blog" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  Blog
                </Link>
                <span>/</span>
                <span className="text-gray-600">Outils</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="inline-flex px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
                  Outils
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />9 min de lecture
                </span>
                <span className="text-sm text-gray-400">Mis à jour le 16 avril 2026</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                Logiciel de réservation en ligne pour salon de beauté : le comparatif 2026
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                <strong className="text-gray-900">4 logiciels dominent le marché français</strong> — Planity,
                Treatwell, Booksy, Qarte. Mais les tarifs affichés cachent des commissions parfois invisibles, et
                toutes les solutions ne conviennent pas à tous les salons. Voici le comparatif honnête, basé sur les
                tarifs publics 2026, pour choisir sans se tromper.
              </p>
            </motion.div>

            <div className="mt-8 rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80"
                alt="Tablette avec logiciel de réservation dans un salon"
                width={1200}
                height={675}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-6 py-8">
          <nav className="bg-gray-50 rounded-2xl p-6 border border-gray-100" aria-label="Sommaire">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Sommaire
            </div>
            <ol className="space-y-2">
              {tocItems.map((item, index) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-start gap-3 text-sm text-gray-600 hover:text-indigo-600 transition-colors py-1"
                  >
                    <span className="text-indigo-400 font-semibold min-w-[20px]">{index + 1}.</span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <article className="max-w-3xl mx-auto px-6 pb-16">
          {/* TL;DR */}
          <div className="mb-12 bg-indigo-50 border-l-4 border-indigo-600 p-6 rounded-r-xl">
            <p className="text-sm font-bold text-indigo-900 mb-2">Le verdict en 30 secondes</p>
            <ul className="text-base text-gray-700 leading-relaxed space-y-2">
              <li>
                <strong>Salon urbain qui débute sans trafic :</strong> Planity (annuaire + notoriété), mais prépare
                la sortie une fois ton fichier client construit.
              </li>
              <li>
                <strong>Institut premium ou grande ville :</strong> Treatwell, bon positionnement mais commission
                sur tous les RDV.
              </li>
              <li>
                <strong>Barbershop ou indépendant :</strong> Booksy, le plus spécialisé sur ce segment.
              </li>
              <li>
                <strong>Salon qui a déjà du trafic et veut fidéliser :</strong> Qarte, réservation + fidélité +
                vitrine sans commission.
              </li>
            </ul>
          </div>

          {/* Section critères */}
          <section id="criteres" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Scale className="w-7 h-7 text-indigo-600 flex-shrink-0" />
              Les 7 critères qui comptent vraiment
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-6">
              Avant de regarder le tarif affiché, vérifie ces 7 points. L&apos;écart réel entre deux solutions se
              joue souvent sur les critères 3, 5 et 7 — ceux que les comparateurs classiques oublient.
            </p>

            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                  1
                </span>
                <div>
                  <p className="font-semibold text-gray-900">Coût total réel (mensuel + commissions)</p>
                  <p className="text-sm text-gray-600">
                    Un logiciel à 29 €/mois qui prélève 30 % sur les nouveaux clients coûte plus cher qu&apos;un
                    abonnement à 49 €/mois sans commission.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                  2
                </span>
                <div>
                  <p className="font-semibold text-gray-900">Acompte à la réservation</p>
                  <p className="text-sm text-gray-600">
                    Divise les no-show par 3 à 5. Non négociable pour tout salon au-dessus de 20 RDV/semaine.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                  3
                </span>
                <div>
                  <p className="font-semibold text-gray-900">Programme de fidélité intégré</p>
                  <p className="text-sm text-gray-600">
                    Une cliente fidèle dépense 67 % de plus qu&apos;une nouvelle. La fidélité doit être dans le
                    logiciel, pas en module payant.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                  4
                </span>
                <div>
                  <p className="font-semibold text-gray-900">Marketplace vs standalone</p>
                  <p className="text-sm text-gray-600">
                    Marketplace = trafic garanti mais concurrence affichée + commission. Standalone = indépendance
                    mais trafic à générer.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                  5
                </span>
                <div>
                  <p className="font-semibold text-gray-900">Propriété du fichier client</p>
                  <p className="text-sm text-gray-600">
                    Critique. Certaines marketplaces ne te donnent accès aux coordonnées complètes qu&apos;après X
                    visites. Tu perds ton fichier si tu pars.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                  6
                </span>
                <div>
                  <p className="font-semibold text-gray-900">Page salon personnalisable</p>
                  <p className="text-sm text-gray-600">
                    Photos, prestations, avis. Avec ton propre nom de domaine idéalement. C&apos;est ton asset long
                    terme.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                  7
                </span>
                <div>
                  <p className="font-semibold text-gray-900">SMS de rappel automatiques</p>
                  <p className="text-sm text-gray-600">
                    Inclus ou facturés ? Certains logiciels facturent 0,08 à 0,12 € par SMS. Sur 200 RDV/mois,
                    c&apos;est 16 à 24 € de plus.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section comparatif table */}
          <section id="comparatif" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              Comparatif Planity, Treatwell, Booksy, Qarte
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-6">
              Tarifs et conditions publics au 16 avril 2026. Les commissions marketplace varient selon la ville et
              le type de prestation — nous indiquons l&apos;ordre de grandeur typique.
            </p>

            <div className="overflow-x-auto rounded-xl border border-gray-200 mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Critère</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Planity</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Treatwell</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Booksy</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 bg-indigo-50">Qarte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-semibold">Abonnement</td>
                    <td className="px-4 py-3">29,90 €/mois</td>
                    <td className="px-4 py-3">dès 35 €/mois</td>
                    <td className="px-4 py-3">29-79 €/mois</td>
                    <td className="px-4 py-3 bg-indigo-50/30 font-semibold">24 €/mois</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">Commission</td>
                    <td className="px-4 py-3 text-red-700">~30 % nouveaux</td>
                    <td className="px-4 py-3 text-red-700">2,5 % tous RDV</td>
                    <td className="px-4 py-3 text-amber-700">3 % nouveaux</td>
                    <td className="px-4 py-3 bg-indigo-50/30 text-emerald-700 font-semibold">0 %</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">Acompte</td>
                    <td className="px-4 py-3">Oui</td>
                    <td className="px-4 py-3">Oui</td>
                    <td className="px-4 py-3">Oui</td>
                    <td className="px-4 py-3 bg-indigo-50/30">Oui</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">Programme fidélité</td>
                    <td className="px-4 py-3 text-amber-700">Basique</td>
                    <td className="px-4 py-3 text-amber-700">Limité</td>
                    <td className="px-4 py-3 text-emerald-700">Oui</td>
                    <td className="px-4 py-3 bg-indigo-50/30 text-emerald-700 font-semibold">Intégré</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">Page salon SEO</td>
                    <td className="px-4 py-3 text-amber-700">Via marketplace</td>
                    <td className="px-4 py-3 text-amber-700">Via marketplace</td>
                    <td className="px-4 py-3 text-amber-700">Via marketplace</td>
                    <td className="px-4 py-3 bg-indigo-50/30 text-emerald-700 font-semibold">Page dédiée</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">Annuaire / trafic</td>
                    <td className="px-4 py-3 text-emerald-700">2,5 M visites/mois</td>
                    <td className="px-4 py-3 text-emerald-700">Fort en capitales</td>
                    <td className="px-4 py-3 text-amber-700">Fort barbers</td>
                    <td className="px-4 py-3 bg-indigo-50/30 text-amber-700">À générer</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">SMS rappels</td>
                    <td className="px-4 py-3">Inclus</td>
                    <td className="px-4 py-3">Inclus</td>
                    <td className="px-4 py-3">Inclus</td>
                    <td className="px-4 py-3 bg-indigo-50/30">Inclus</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">Fichier client exportable</td>
                    <td className="px-4 py-3 text-amber-700">Partiel</td>
                    <td className="px-4 py-3 text-amber-700">Partiel</td>
                    <td className="px-4 py-3 text-emerald-700">Oui</td>
                    <td className="px-4 py-3 bg-indigo-50/30 text-emerald-700 font-semibold">Complet</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">Engagement</td>
                    <td className="px-4 py-3">12 mois</td>
                    <td className="px-4 py-3">12 mois</td>
                    <td className="px-4 py-3">Mensuel</td>
                    <td className="px-4 py-3 bg-indigo-50/30 font-semibold">Mensuel</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-900 leading-relaxed">
              <strong>Comment lire ce tableau :</strong> les montants d&apos;abonnement sont trompeurs sans les
              commissions. Un salon qui fait 50 nouveaux clients/mois via Planity à 45 € moyen paie{' '}
              <strong>~675 € de commissions</strong> en plus des 29,90 €. Soit ~705 €/mois réels. Chiffres à
              actualiser selon la ville et le mix marketplace / trafic direct.
            </div>
          </section>

          {/* Section détail chaque logiciel */}
          <section id="detail" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              Analyse détaillée de chaque logiciel
            </h2>

            <div className="space-y-8">
              {tools.map((t) => (
                <div key={t.name} className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
                  <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{t.name}</h3>
                      <p className="text-sm text-indigo-600 font-semibold">{t.tag}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Abonnement</p>
                      <p className="text-base font-bold text-gray-900">{t.price}</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Commission</p>
                      <p className="text-sm text-gray-900">{t.commission}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Fidélité</p>
                      <p className="text-sm text-gray-900">{t.loyalty}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      <strong className="text-gray-900">Idéal pour :</strong> {t.bestFor}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      <strong className="text-gray-900">Point faible :</strong> {t.weakness}
                    </p>
                  </div>

                  {t.name === 'Qarte' && (
                    <div className="mt-5 pt-5 border-t border-gray-100 text-sm text-gray-700 leading-relaxed">
                      Qarte est le seul logiciel de ce comparatif à intégrer <strong>les trois piliers</strong>{' '}
                      d&apos;un salon moderne dans un même outil : <strong>réservation en ligne</strong> (avec
                      acompte sécurisé), <strong>programme de fidélité digital</strong> (tampons + cagnotte),{' '}
                      <strong>vitrine SEO</strong> (page salon dédiée). Aucune commission sur les RDV, pas
                      d&apos;engagement, fichier client 100 % exportable.
                      <div className="mt-4">
                        <Link
                          href="/auth/merchant/signup"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                        >
                          Essayer Qarte gratuitement <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Section: quel choisir */}
          <section id="quel-choisir" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Target className="w-7 h-7 text-indigo-600 flex-shrink-0" />
              Quel logiciel pour quel type de salon ?
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-8">
              Ton choix dépend de 3 variables : ton <strong>trafic actuel</strong>, ton{' '}
              <strong>type de prestations</strong>, et ta <strong>tolérance aux commissions</strong>.
            </p>

            <div className="space-y-6">
              <div className="border-l-4 border-indigo-400 bg-indigo-50/50 p-6 rounded-r-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Scissors className="w-6 h-6 text-indigo-600" />
                  <h3 className="text-lg font-bold text-gray-900">Salon de coiffure urbain qui démarre</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-2">
                  <strong>Choix recommandé :</strong> Planity pour les 12 premiers mois (acquisition via
                  marketplace), puis migration vers Qarte quand ton fichier client est établi (conservation du CA).
                </p>
                <p className="text-xs text-gray-500">
                  Économie potentielle année 2 : ~6 000 à 10 000 € de commissions évitées.
                </p>
              </div>

              <div className="border-l-4 border-indigo-400 bg-indigo-50/50 p-6 rounded-r-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                  <h3 className="text-lg font-bold text-gray-900">Institut de beauté / onglerie établi</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  <strong>Choix recommandé :</strong> Qarte. La fidélité digitale intégrée (tampons + cagnotte) est
                  critique pour les prestations récurrentes (semi-permanent, soins visage), et tu gardes 100 % de ton
                  CA. Le trafic se fait par Google Business + Instagram + bouche-à-oreille, qui représentent déjà
                  70-80 % des nouveaux clients dans ce secteur.
                </p>
              </div>

              <div className="border-l-4 border-indigo-400 bg-indigo-50/50 p-6 rounded-r-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-6 h-6 text-indigo-600" />
                  <h3 className="text-lg font-bold text-gray-900">Barbershop ou indépendant(e)</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  <strong>Choix recommandé :</strong> Booksy pour la communauté barbers, sinon Qarte pour la
                  fidélité + vitrine simples. Évite Treatwell (trop premium) et Planity pour les solos (trop cher
                  rapporté au volume).
                </p>
              </div>

              <div className="border-l-4 border-indigo-400 bg-indigo-50/50 p-6 rounded-r-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                  <h3 className="text-lg font-bold text-gray-900">Spa premium ou institut luxe</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  <strong>Choix recommandé :</strong> Treatwell pour le positionnement premium et le trafic
                  international (touristes), mais vérifie le ratio commission / panier moyen. Au-dessus de 80 € de
                  ticket moyen, la commission Treatwell pèse.
                </p>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Quel est le meilleur logiciel de réservation en ligne pour un salon de coiffure ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Il n&apos;y a pas de meilleur logiciel universel. <strong>Planity</strong> domine en France sur
                  l&apos;annuaire (2,5 M visiteurs/mois) mais prend 30 €/mois + commission sur nouveaux clients.{' '}
                  <strong>Qarte</strong> (24 €/mois sans commission) convient aux salons qui veulent fidéliser leur
                  fichier et être propriétaires de leur audience. <strong>Treatwell</strong> est adapté aux grandes
                  villes et gros salons. <strong>Booksy</strong> est la référence pour les barbershops.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Combien coûte un logiciel de réservation pour salon de beauté en 2026 ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Les tarifs vont de <strong>19 € à 79 €/mois</strong> selon les fonctionnalités et le nombre de
                  collaborateurs. Planity : ~30 €/mois + commissions. Treatwell : à partir de 35 €/mois + 2,5 % de
                  commission. Booksy : 29-79 €/mois selon le plan. Qarte : 24 €/mois sans commission ni frais par
                  réservation.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Faut-il préférer un logiciel avec annuaire (marketplace) ou sans ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  L&apos;annuaire (Planity, Treatwell) apporte du trafic mais prélève une commission de{' '}
                  <strong>20-30 % sur les nouveaux clients</strong> et affiche tes concurrents à côté de toi. Sans
                  annuaire (Qarte), tu gardes 100 % de tes revenus mais dois générer ton propre trafic (Google
                  Business, Instagram). Idéal : commencer avec annuaire pour l&apos;acquisition, migrer vers sans
                  annuaire quand le bouche-à-oreille prend le relais.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Quelles fonctionnalités essentielles pour un salon en 2026 ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Réservation en ligne 24h/24, acompte sécurisé, SMS de rappel automatiques, calendrier
                  multi-collaborateurs, programme de fidélité intégré, page salon avec photos, gestion des avis
                  Google. <strong>La fidélité intégrée</strong> (et pas en option payante) est ce qui différencie
                  les logiciels modernes des solutions legacy.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Comment migrer d&apos;un logiciel à un autre sans perdre ses clientes ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Exporte ton fichier client (nom, téléphone, email, historique) <strong>avant</strong> de résilier.
                  Importe-le dans le nouveau logiciel. Préviens tes clientes régulières par SMS du changement avec
                  le nouveau lien de réservation. Garde les deux systèmes actifs pendant 2 à 4 semaines pour éviter
                  toute perte de RDV déjà pris.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-8 text-center text-white">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-4 opacity-90" />
            <h3 className="text-xl sm:text-2xl font-bold mb-3">
              Teste Qarte gratuitement pendant 7 jours
            </h3>
            <p className="text-indigo-100 mb-6 max-w-xl mx-auto">
              Réservation en ligne avec acompte, programme de fidélité digital, page salon SEO, SMS de rappel
              automatiques. 24 €/mois sans commission, sans engagement.
            </p>
            <Link
              href="/auth/merchant/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 font-bold rounded-2xl hover:bg-indigo-50 transition-colors"
            >
              Commencer maintenant
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </article>

        <footer className="py-8 border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <span>&copy; {new Date().getFullYear()} Qarte. Tous droits réservés.</span>
            <div className="flex gap-6">
              <Link href="/mentions-legales" className="hover:text-gray-600 transition-colors">
                Mentions légales
              </Link>
              <Link href="/politique-confidentialite" className="hover:text-gray-600 transition-colors">
                Confidentialité
              </Link>
              <Link href="/contact" className="hover:text-gray-600 transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
