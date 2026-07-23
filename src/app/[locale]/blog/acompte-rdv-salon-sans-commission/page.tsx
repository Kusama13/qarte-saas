'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  BookOpen,
  Wallet,
  Zap,
  ShieldCheck,
  Calculator,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { FacebookPixel } from '@/components/analytics/FacebookPixel';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const tocItems = [
  { id: 'cout-cache', label: 'Le coût caché de l\'acompte sur Planity, Booksy et Treatwell' },
  { id: 'methode-qarte', label: 'La méthode Qarte : ton lien Revolut, ton compte, ton argent' },
  { id: 'economies', label: 'Combien tu économises vraiment' },
  { id: 'delai', label: '24h sur ton compte, pas 7 jours' },
  { id: 'si-paie-pas', label: 'Et si la cliente ne paie pas l\'acompte ?' },
  { id: 'seule', label: 'La seule plateforme à te laisser faire ça' },
  { id: 'faq', label: 'Questions fréquentes' },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://getqarte.com/#organization',
      name: 'Qarte',
      url: 'https://getqarte.com',
      logo: {
        '@type': 'ImageObject',
        '@id': 'https://getqarte.com/#logo',
        url: 'https://getqarte.com/logo.png',
        contentUrl: 'https://getqarte.com/logo.png',
        width: 512,
        height: 512,
        caption: 'Qarte',
      },
      description: 'SaaS de réservation et fidélité pour salons de beauté en France, Belgique et Suisse. 100% de l\'acompte direct sur le compte du salon, sans commission plateforme.',
      areaServed: [
        { '@type': 'Country', name: 'France' },
        { '@type': 'Country', name: 'Belgique' },
        { '@type': 'Country', name: 'Suisse' },
      ],
      knowsAbout: [
        'Logiciel de réservation salon de beauté',
        'Carte de fidélité dématérialisée',
        'Acompte de rendez-vous sans commission',
        'Gestion no-show salon',
      ],
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://getqarte.com/#software',
      name: 'Qarte',
      url: 'https://getqarte.com',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Salon Booking & Loyalty Software',
      operatingSystem: 'Web, iOS, Android',
      description: 'Logiciel de réservation et fidélité pour salons de beauté. Encaisse 100% de tes acomptes directement sur ton compte pro (Revolut, PayPal, SumUp...) sans commission plateforme.',
      image: 'https://getqarte.com/logo.png',
      publisher: { '@id': 'https://getqarte.com/#organization' },
      featureList: [
        'Acompte de rendez-vous via lien de paiement externe (Revolut, PayPal, SumUp, Lydia, Stripe, Wise, Twint, Payconiq, Monzo...)',
        'Vitrine de réservation publique',
        'Programme de fidélité (cagnotte, visites, parrainage)',
        'Libération automatique des créneaux non payés (1h à 4h)',
        'Archive des réservations annulées avec relance SMS',
        '0€ de commission plateforme sur les acomptes',
      ],
      offers: [
        {
          '@type': 'Offer',
          name: 'Abonnement mensuel',
          price: '24.00',
          priceCurrency: 'EUR',
          url: 'https://getqarte.com/auth/merchant/signup',
          availability: 'https://schema.org/InStock',
          category: 'Subscription',
        },
        {
          '@type': 'Offer',
          name: 'Abonnement annuel',
          price: '240.00',
          priceCurrency: 'EUR',
          url: 'https://getqarte.com/auth/merchant/signup',
          availability: 'https://schema.org/InStock',
          category: 'Subscription',
        },
        {
          '@type': 'Offer',
          name: 'Essai gratuit 3 jours',
          price: '0',
          priceCurrency: 'EUR',
          url: 'https://getqarte.com/auth/merchant/signup',
          availability: 'https://schema.org/InStock',
          category: 'FreeTrial',
          eligibleDuration: { '@type': 'QuantitativeValue', value: 7, unitCode: 'DAY' },
        },
      ],
    },
    {
      '@type': 'WebPage',
      '@id': 'https://getqarte.com/blog/acompte-rdv-salon-sans-commission#webpage',
      url: 'https://getqarte.com/blog/acompte-rdv-salon-sans-commission',
      name: 'Acompte salon : 0€ de commission, direct sur ton compte',
      description: 'Les plateformes à paiement intégré prélèvent des frais sur tes acomptes. Découvre comment encaisser 100% en 24h via ton propre lien Revolut, PayPal ou SumUp.',
      inLanguage: 'fr-FR',
      isPartOf: {
        '@type': 'WebSite',
        '@id': 'https://getqarte.com/#website',
        url: 'https://getqarte.com',
        name: 'Qarte',
        publisher: { '@id': 'https://getqarte.com/#organization' },
        inLanguage: 'fr-FR',
      },
      primaryImageOfPage: { '@id': 'https://getqarte.com/blog/acompte-rdv-salon-sans-commission#primaryimage' },
      breadcrumb: { '@id': 'https://getqarte.com/blog/acompte-rdv-salon-sans-commission#breadcrumb' },
      datePublished: '2026-05-08T08:00:00+02:00',
      dateModified: '2026-05-08T08:00:00+02:00',
      mainEntity: { '@id': 'https://getqarte.com/blog/acompte-rdv-salon-sans-commission#article' },
    },
    {
      '@type': 'ImageObject',
      '@id': 'https://getqarte.com/blog/acompte-rdv-salon-sans-commission#primaryimage',
      url: 'https://getqarte.com/blog/social/article-10-cover.png',
      contentUrl: 'https://getqarte.com/blog/social/article-10-cover.png',
      width: 1080,
      height: 1080,
      caption: 'Acompte de RDV salon de beauté direct sur compte pro',
    },
    {
      '@type': 'BreadcrumbList',
      '@id': 'https://getqarte.com/blog/acompte-rdv-salon-sans-commission#breadcrumb',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://getqarte.com' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://getqarte.com/blog' },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Acompte salon : 0€ de commission, direct sur ton compte',
          item: 'https://getqarte.com/blog/acompte-rdv-salon-sans-commission',
        },
      ],
    },
    {
      '@type': 'Article',
      '@id': 'https://getqarte.com/blog/acompte-rdv-salon-sans-commission#article',
      isPartOf: { '@id': 'https://getqarte.com/blog/acompte-rdv-salon-sans-commission#webpage' },
      mainEntityOfPage: { '@id': 'https://getqarte.com/blog/acompte-rdv-salon-sans-commission#webpage' },
      headline: 'Acompte salon : pourquoi une partie t\'échappe sur chaque RDV (et comment encaisser 100% direct sur ton compte)',
      alternativeHeadline: 'Acompte salon : 0€ de commission, direct sur ton compte',
      description: 'Les plateformes à paiement intégré prélèvent des frais sur tes acomptes. Découvre comment encaisser 100% en 24h via ton propre lien Revolut, PayPal ou SumUp. 0€ commission Qarte.',
      image: { '@id': 'https://getqarte.com/blog/acompte-rdv-salon-sans-commission#primaryimage' },
      datePublished: '2026-05-08T08:00:00+02:00',
      dateModified: '2026-05-08T08:00:00+02:00',
      inLanguage: 'fr-FR',
      articleSection: 'Argent & commissions',
      keywords: [
        'acompte rendez-vous salon',
        'commission Planity',
        'commission Booksy',
        'commission Treatwell',
        'lien de paiement Revolut salon',
        'alternative Planity',
        'réservation salon sans commission',
      ],
      author: { '@id': 'https://getqarte.com/#organization' },
      publisher: { '@id': 'https://getqarte.com/#organization' },
      about: [
        { '@type': 'Thing', name: 'Acompte de réservation' },
        { '@type': 'Thing', name: 'Commission de plateforme' },
        { '@id': 'https://getqarte.com/#software' },
      ],
      mentions: [
        { '@type': 'Organization', name: 'Planity', url: 'https://www.planity.com' },
        { '@type': 'Organization', name: 'Booksy', url: 'https://booksy.com' },
        { '@type': 'Organization', name: 'Treatwell', url: 'https://www.treatwell.fr' },
        { '@type': 'Organization', name: 'Fresha', url: 'https://www.fresha.com' },
        { '@type': 'Organization', name: 'Kiute', url: 'https://www.kiute.com' },
        { '@type': 'Organization', name: 'Revolut', url: 'https://www.revolut.com' },
        { '@type': 'Organization', name: 'PayPal', url: 'https://www.paypal.com' },
        { '@type': 'Organization', name: 'SumUp', url: 'https://sumup.com' },
        { '@type': 'Organization', name: 'Stripe', url: 'https://stripe.com' },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://getqarte.com/blog/acompte-rdv-salon-sans-commission#faq',
      isPartOf: { '@id': 'https://getqarte.com/blog/acompte-rdv-salon-sans-commission#webpage' },
      inLanguage: 'fr-FR',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'C\'est quoi un acompte de RDV en salon ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Un acompte de RDV salon est un paiement partiel (souvent 20% à 30% du prix total, ex : 30€ sur une couleur à 100€) que la cliente règle au moment de la réservation pour bloquer le créneau. Il sert à filtrer les no-show et garantir l\'engagement. En France, il est non-remboursable si la cliente annule (sauf clause contraire dans tes conditions de réservation).',
          },
        },
        {
          '@type': 'Question',
          name: 'Combien Planity prélève sur un acompte de RDV ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Planity passe par un paiement en ligne intégré qui applique des frais sur chaque acompte. Une partie de chaque acompte ne tombe donc jamais dans ta caisse. Avec Qarte, tu utilises ton propre lien (Revolut, PayPal, SumUp) et tu encaisses 100%.',
          },
        },
        {
          '@type': 'Question',
          name: 'Combien Booksy prend de commission sur un paiement ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Booksy facture des frais sur les paiements via son système intégré, avec un supplément si tu veux être payé rapidement. Avec Qarte, l\'acompte arrive direct sur ton compte via ton propre lien, sans frais de plateforme.',
          },
        },
        {
          '@type': 'Question',
          name: 'Quel lien de paiement utiliser pour un acompte salon ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Les 3 meilleurs choix pour un salon : Revolut (gratuit, virement instantané sur ton compte), SumUp (très reconnu en France), PayPal (ultra-connu des clientes). Tu reçois 100% de l’acompte sur ton compte, sans commission. Qarte accepte 14 services différents et tu peux en mettre 2 en parallèle sur ta vitrine.',
          },
        },
        {
          '@type': 'Question',
          name: 'Au bout de combien de temps je reçois l\'argent de l\'acompte avec Qarte ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'L\'argent tombe directement sur ton compte pro (Revolut, PayPal, SumUp...) sans passer par Qarte. Avec Revolut Business, le virement est instantané. Avec PayPal ou SumUp, c\'est en général sous 24h, sans la rétention de plusieurs jours imposée par certaines plateformes.',
          },
        },
        {
          '@type': 'Question',
          name: 'Que se passe-t-il si la cliente ne paie pas l\'acompte ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Le créneau se libère automatiquement après le délai que tu choisis (1h, 2h, 3h ou 4h). Mais la résa est gardée dans une archive avec tous les détails. Tu peux la "Ramener" en 1 clic et lui renvoyer un SMS avec le lien si elle finit par payer.',
          },
        },
        {
          '@type': 'Question',
          name: 'Est-ce que Qarte est vraiment la seule plateforme à proposer ça ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'À notre connaissance, sur le marché FR/BE/CH en mai 2026, oui. Planity, Booksy, Treatwell, Fresha, Kiute, Wavy passent par leur paiement intégré, avec leurs propres frais. Aucune ne te laisse coller ton propre lien Revolut/PayPal/SumUp dans la vitrine de réservation à 0€ de frais plateforme.',
          },
        },
      ],
    },
  ],
};

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
            <Link href="/" className="text-xl font-bold text-indigo-700">Qarte</Link>
            <Link
              href="/auth/merchant/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Essai gratuit
            </Link>
          </div>
        </header>

        <section className="py-12 sm:py-16 bg-gradient-to-b from-emerald-50/60 to-white">
          <div className="max-w-3xl mx-auto px-6">
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <Link href="/blog" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  Blog
                </Link>
                <span>/</span>
                <span className="text-gray-600">Argent &amp; commissions</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="inline-flex px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
                  Argent &amp; commissions
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />6 min de lecture
                </span>
                <span className="text-sm text-gray-400">8 mai 2026</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                Acompte salon : pourquoi une partie t&apos;échappe sur chaque RDV (et comment encaisser 100% direct sur ton compte)
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                Tu encaisses 30€ d&apos;acompte sur une couleur. Sur les plateformes à paiement
                intégré, une partie part en frais et le reste met parfois plusieurs jours à tomber.
                On te montre comment garder tes 30€ entiers, sur ton compte, en 24h.
              </p>
            </motion.div>

            <div className="mt-8 rounded-2xl overflow-hidden">
              <Image
                src="/blog/social/article-10-cover.png"
                alt="Acompte de RDV salon de beauté direct sur compte pro"
                width={1080}
                height={1080}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-6 py-8">
          <nav className="bg-gray-50 rounded-2xl p-6 border border-gray-100" aria-label="Sommaire">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Sommaire
            </div>
            <ol className="space-y-2">
              {tocItems.map((item, index) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-start gap-3 text-sm text-gray-600 hover:text-emerald-600 transition-colors py-1"
                  >
                    <span className="text-emerald-500 font-semibold min-w-[20px]">{index + 1}.</span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <article className="max-w-3xl mx-auto px-6 pb-16">
          {/* TL;DR */}
          <div className="mb-12 bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-xl">
            <p className="text-sm font-bold text-emerald-900 mb-2">L&apos;essentiel en 30 secondes</p>
            <p className="text-base text-gray-700 leading-relaxed">
              Toutes les plateformes de résa te grignotent l&apos;acompte (1,29% à 2,69%, jusqu&apos;à
              25% sur Treatwell pour une nouvelle cliente). Et l&apos;argent met 7 jours à tomber.{' '}
              <strong>Qarte est la seule plateforme qui te laisse coller ton propre lien
              Revolut, PayPal ou SumUp dans ta vitrine</strong>. <strong>100% de l&apos;acompte
              tombe direct sur ton compte</strong>. Zéro commission. Instantané.
            </p>
          </div>

          {/* Section 1 · Coût caché */}
          <section id="cout-cache" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <AlertTriangle className="w-7 h-7 text-emerald-600 flex-shrink-0" />
              Le coût caché de l&apos;acompte sur Planity, Booksy et Treatwell
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Sur un acompte de 30€, Planity garde 0,72€ (1,80% + 0,18€ HT), Booksy 0,87€ (2,49%
              + 0,30$), Treatwell de 0,72€ à 8,10€ (2% HT, plus 25% sur les nouvelles clientes),
              Fresha 0,54€ (1,29% + 0,15€) et Kiute Pro 0,72€ (1,80% + 0,18€ HT). L&apos;argent
              passe d&apos;abord par leur caisse. Elles se servent au passage, et tu touches le
              reste, plus tard.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-6">
              Les chiffres viennent des pages tarifaires officielles :
            </p>

            <div className="overflow-x-auto rounded-xl border border-gray-200 my-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Plateforme</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Commission acompte</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Sur 30€</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Délai versement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-medium">Planity Pro</td>
                    <td className="px-4 py-3 text-red-600">1,80% + 0,18€ HT</td>
                    <td className="px-4 py-3 text-red-600 font-bold">−0,72€</td>
                    <td className="px-4 py-3 text-gray-600">1 à 7 jours</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Booksy Biz</td>
                    <td className="px-4 py-3 text-red-600">2,49% + 0,30$</td>
                    <td className="px-4 py-3 text-red-600 font-bold">−0,87€</td>
                    <td className="px-4 py-3 text-gray-600">J+1 (ou 30min payant)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Treatwell</td>
                    <td className="px-4 py-3 text-red-600">2% HT + 25% sur nouvelles</td>
                    <td className="px-4 py-3 text-red-600 font-bold">−0,72€ à −8,10€</td>
                    <td className="px-4 py-3 text-gray-600">7 à 30 jours</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Fresha</td>
                    <td className="px-4 py-3 text-red-600">1,29% + 0,15€</td>
                    <td className="px-4 py-3 text-red-600 font-bold">−0,54€</td>
                    <td className="px-4 py-3 text-gray-600">Variable</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Kiute Pro</td>
                    <td className="px-4 py-3 text-red-600">1,80% + 0,18€ HT</td>
                    <td className="px-4 py-3 text-red-600 font-bold">−0,72€</td>
                    <td className="px-4 py-3 text-gray-600">Variable</td>
                  </tr>
                  <tr className="bg-emerald-50">
                    <td className="px-4 py-3 font-bold text-emerald-900">Qarte + Revolut</td>
                    <td className="px-4 py-3 text-emerald-700 font-semibold">0€ · aucune commission</td>
                    <td className="px-4 py-3 text-emerald-700 font-bold">+30€ entiers</td>
                    <td className="px-4 py-3 text-emerald-700 font-bold">Instantané</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-xs text-gray-400 px-4 py-2 italic">
                Sources : tarifs officiels Planity, Booksy Help Center, Treatwell Partner Care, Fresha pricing, Outilios. Mai 2026.
              </p>
            </div>

            <p className="text-base text-gray-700 leading-relaxed">
              Sur Qarte, ta cliente paie 30€, tu reçois <strong>30€ entiers</strong> sur ton compte
              Revolut (ou PayPal, SumUp). Pas d&apos;intermédiaire qui se sucre entre deux.
            </p>
          </section>

          {/* Section 2 · Méthode Qarte */}
          <section id="methode-qarte" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Wallet className="w-7 h-7 text-emerald-600 flex-shrink-0" />
              La méthode Qarte : ton lien Revolut, ton compte, ton argent
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Qarte est la seule plateforme de réservation salon FR/BE/CH (mai 2026) qui te laisse
              coller ton lien Revolut (ou PayPal, SumUp) dans ta vitrine. Ta cliente clique, paie,
              ça tombe chez toi. Direct. Pas un centime pour Qarte (34€/mois fixes, tout compris).
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              <strong>14 services au choix</strong> : Revolut, PayPal, SumUp, Lydia, Stripe, Wise,
              Pumpkin, Twint, Payconiq, Monzo, Cash App, Venmo, Zelle, Buy Me a Coffee. Tu peux en
              afficher <strong>2 côte à côte</strong> sur ta vitrine (ex : Revolut pour les belges,
              PayPal pour les pressées qui n&apos;aiment pas créer un compte).
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6">
              <p className="text-sm text-emerald-900 leading-relaxed">
                <strong>Combo recommandé :</strong> Revolut (gratuit, virement instantané) + PayPal
                en secours pour les clientes qui ont déjà un compte. Couverture quasi totale, et
                tes acomptes te reviennent à 100%.
              </p>
            </div>
          </section>

          {/* Section 3 · Économies */}
          <section id="economies" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Calculator className="w-7 h-7 text-emerald-600 flex-shrink-0" />
              Combien tu économises vraiment
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-6">
              Prenons un salon : <strong>100 RDV par mois, 30€ d&apos;acompte</strong>. Tu perds
              54€/mois sur Fresha, 72€ sur Planity, 87€ sur Booksy, jusqu&apos;à 810€ sur Treatwell
              (avec les nouvelles clientes). Avec Qarte + Revolut : <strong>0€ partout, tu gardes
              tout</strong>. Sur 3 ans, l&apos;écart Booksy vs Qarte atteint 3 132€.
            </p>

            <div className="overflow-x-auto rounded-xl border border-gray-200 my-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Plateforme</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Perdu / mois</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Sur 1 an</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Sur 3 ans</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-medium">Planity Pro</td>
                    <td className="px-4 py-3 text-red-600 font-bold">72€</td>
                    <td className="px-4 py-3 text-red-600">864€</td>
                    <td className="px-4 py-3 text-red-600">2 592€</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Booksy Biz</td>
                    <td className="px-4 py-3 text-red-600 font-bold">87€</td>
                    <td className="px-4 py-3 text-red-600">1 044€</td>
                    <td className="px-4 py-3 text-red-600">3 132€</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Treatwell (clientes récurrentes)</td>
                    <td className="px-4 py-3 text-red-600 font-bold">72€</td>
                    <td className="px-4 py-3 text-red-600">864€</td>
                    <td className="px-4 py-3 text-red-600">2 592€</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Fresha</td>
                    <td className="px-4 py-3 text-red-600 font-bold">54€</td>
                    <td className="px-4 py-3 text-red-600">648€</td>
                    <td className="px-4 py-3 text-red-600">1 944€</td>
                  </tr>
                  <tr className="bg-emerald-50">
                    <td className="px-4 py-3 font-bold text-emerald-900">Qarte + Revolut</td>
                    <td className="px-4 py-3 text-emerald-700 font-bold">0€</td>
                    <td className="px-4 py-3 text-emerald-700 font-bold">0€</td>
                    <td className="px-4 py-3 text-emerald-700 font-bold">0€</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="text-sm text-amber-900 leading-relaxed">
                💡 <strong>Sur 1 an, ce que Booksy te prélève couvre 3 ans 7 mois
                d&apos;abonnement Qarte</strong> (34€/mois). Le calcul est vite fait.
              </p>
            </div>
          </section>

          {/* Section 4 · Délai */}
          <section id="delai" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Zap className="w-7 h-7 text-emerald-600 flex-shrink-0" />
              24h sur ton compte, pas 7 jours
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Avec Qarte + Revolut Business, l&apos;acompte arrive <strong>instantanément</strong>{' '}
              sur ton compte pro. Avec PayPal ou SumUp, sous 24h. À comparer aux 1 à 7 jours de
              Planity, J+1 chez Booksy (ou 30 minutes en payant +1,5%), et 7 à 30 jours chez
              Treatwell.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Concrètement : ta cliente réserve, paie son acompte. 30 secondes après, ping Revolut
              sur ton iPhone : <strong>+30€</strong>. Tu sais que la résa est sérieuse avant même
              d&apos;ouvrir ton agenda.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Pas de « virement Planity le 8 du mois prochain ». Pas de provision bloquée
              par Stripe. Pas d&apos;écart entre ton agenda et ton compte.
            </p>
            <p className="text-base text-gray-700 leading-relaxed">
              Et si la cliente veut un remboursement ? Tu le fais depuis ton appli Revolut, en 1 clic.
              Pas de ticket à ouvrir, pas de délai à attendre.
            </p>
          </section>

          {/* Section 5 · Si paie pas */}
          <section id="si-paie-pas" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <ShieldCheck className="w-7 h-7 text-emerald-600 flex-shrink-0" />
              Et si la cliente ne paie pas l&apos;acompte ?
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Tu choisis le délai à l&apos;avance : 1h, 2h, 3h ou 4h pour payer. Passé ce délai, le
              créneau se libère <strong>tout seul</strong>. Personne ne squatte ton agenda parce
              qu&apos;une cliente a oublié.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Mais rien n&apos;est perdu : la résa va dans une <strong>archive</strong> avec tous
              les détails (nom, prestation, montant, heure). Si la cliente finit par payer en
              boutique ou si tu veux lui redonner sa chance :
            </p>
            <div className="grid sm:grid-cols-2 gap-4 my-6">
              <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-gray-800">Bouton <strong>Ramener la résa</strong> pour réactiver le créneau en 1 clic</p>
              </div>
              <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-gray-800">SMS de relance avec le lien (paie en 1 minute)</p>
              </div>
              <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-gray-800">Marquer payé à la main si elle a réglé en boutique</p>
              </div>
              <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-gray-800">Grace nuit 22h–9h : pas de libération en pleine nuit</p>
              </div>
            </div>
          </section>

          {/* Section 6 · Seule plateforme */}
          <section id="seule" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 flex-shrink-0" />
              La seule plateforme à te laisser faire ça
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              On a vérifié, un par un : Planity, Booksy, Treatwell, Fresha, Kiute, Wavy, Salonkee,
              Yclient. <strong>Aucun</strong> ne te laisse coller ton propre lien Revolut, PayPal ou
              SumUp dans la vitrine. Tous obligent à passer par leur Stripe interne avec leurs frais.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Pourquoi ? Parce que la commission sur l&apos;acompte, c&apos;est leur gagne-pain.
              Nous, on vit de l&apos;abonnement 34€/mois (tout compris). Pas besoin de te grappiller
              1,80% en plus.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 italic">
                À notre connaissance, sur le marché FR/BE/CH en mai 2026. Si tu connais un autre
                acteur qui propose ce système, écris-nous, on met l&apos;article à jour.
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">C&apos;est quoi un acompte de RDV en salon ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Un paiement partiel (souvent 20% à 30% du prix total, ex : 30€ sur une couleur à
                  100€) que ta cliente règle au moment de la résa pour bloquer le créneau. Ça
                  filtre les no-show et garantit l&apos;engagement. En France, il est
                  non-remboursable si la cliente annule (sauf clause contraire dans tes conditions).
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Combien Planity prélève sur un acompte de RDV ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Planity passe par un paiement en ligne intégré qui applique des frais sur chaque
                  acompte : une partie ne tombe jamais dans ta caisse. Avec Qarte, tu encaisses 100%
                  via ton propre lien.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Combien Booksy prend sur un paiement ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Booksy applique des frais sur les paiements via son système intégré, avec un
                  supplément si tu veux être payé rapidement. Avec Qarte, l&apos;argent arrive direct
                  sur ton compte via ton propre lien, sans frais de plateforme.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Quel lien de paiement utiliser pour mon salon ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Les 3 meilleurs choix : <strong>Revolut</strong> (gratuit, virement instantané
                  sur ton compte), <strong>SumUp</strong> (très reconnu en France),{' '}
                  <strong>PayPal</strong> (ultra-connu des clientes). Tu reçois{' '}
                  <strong>100% de l&apos;acompte</strong> sur ton compte, sans commission. Tu peux
                  mettre 2 liens côte à côte sur ta vitrine Qarte.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Au bout de combien de temps je reçois l&apos;argent avec Qarte ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  L&apos;argent va directement sur ton compte pro, sans passer par Qarte. Avec
                  Revolut Business, c&apos;est instantané. PayPal et SumUp, en général sous 24h, sans
                  la rétention de plusieurs jours imposée par certaines plateformes.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Que se passe-t-il si la cliente ne paie pas ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Le créneau se libère automatiquement (1h à 4h, à toi de choisir). La résa est
                  gardée dans une archive et tu peux la « Ramener » en 1 clic si elle finit par payer.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Qarte est vraiment la seule à proposer ça ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  À notre connaissance, oui, sur le marché FR/BE/CH en mai 2026. Toutes les autres
                  plateformes obligent à passer par leur paiement interne avec commission.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-center text-white">
            <Wallet className="w-10 h-10 mx-auto mb-4 opacity-90" />
            <h3 className="text-xl sm:text-2xl font-bold mb-3">
              Arrête de payer pour toucher ton propre argent
            </h3>
            <p className="text-emerald-50 mb-6 max-w-xl mx-auto">
              3 jours gratuits pour tester. En 10 minutes ta vitrine est en ligne, avec ton lien
              Revolut (ou PayPal, SumUp). Et chaque acompte tombe direct chez toi, à 100%.
            </p>
            <Link
              href="/auth/merchant/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 font-bold rounded-2xl hover:bg-emerald-50 transition-colors"
            >
              Je teste 3 jours gratuit
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Liens internes */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <p className="text-sm font-bold text-gray-900 mb-4">À lire aussi sur le blog</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/blog/eviter-no-show-salon-rendez-vous" className="text-emerald-700 hover:text-emerald-800 transition-colors">
                  → No-show en salon : 6 étapes pour diviser par 4 les RDV manqués
                </Link>
              </li>
              <li>
                <Link href="/blog/clients-planity-booksy-ne-reviennent-jamais" className="text-emerald-700 hover:text-emerald-800 transition-colors">
                  → Planity, Booksy, Treatwell : ces clientes qui ne reviennent jamais
                </Link>
              </li>
              <li>
                <Link href="/alternatives/planity" className="text-emerald-700 hover:text-emerald-800 transition-colors">
                  → Comparatif complet Planity vs Qarte
                </Link>
              </li>
              <li>
                <Link href="/combien-coute-booksy" className="text-emerald-700 hover:text-emerald-800 transition-colors">
                  → Calculer ce que te coûte vraiment Booksy par an
                </Link>
              </li>
            </ul>
          </div>
        </article>

        <footer className="py-8 border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <span>&copy; {new Date().getFullYear()} Qarte. Tous droits réservés.</span>
            <div className="flex gap-6">
              <Link href="/mentions-legales" className="hover:text-gray-600 transition-colors">Mentions légales</Link>
              <Link href="/politique-confidentialite" className="hover:text-gray-600 transition-colors">Confidentialité</Link>
              <Link href="/contact" className="hover:text-gray-600 transition-colors">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
