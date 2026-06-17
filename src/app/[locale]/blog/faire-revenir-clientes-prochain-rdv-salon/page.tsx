'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  BookOpen,
  CalendarHeart,
  Repeat,
  Bell,
  CalendarRange,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { FacebookPixel } from '@/components/analytics/FacebookPixel';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const tocItems = [
  { id: 'trou', label: 'Le trou dans ton agenda que personne ne voit' },
  { id: 'caisse', label: '« On se revoit dans 3 semaines ? » : la phrase qui saute en ligne' },
  { id: 'qarte', label: 'Comment Qarte propose les prochains RDV tout seul' },
  { id: 'acompte', label: 'Sans rien payer maintenant : le rappel part 7 jours avant' },
  { id: 'agenda', label: 'Ce que ça change pour ton agenda' },
  { id: 'activer', label: 'L\'activer en 30 secondes' },
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
      description: 'SaaS de réservation et fidélité pour salons de beauté en France, Belgique et Suisse.',
      areaServed: [
        { '@type': 'Country', name: 'France' },
        { '@type': 'Country', name: 'Belgique' },
        { '@type': 'Country', name: 'Suisse' },
      ],
      knowsAbout: [
        'Réservation en ligne salon de beauté',
        'Fidélisation des clientes',
        'Prise de rendez-vous récurrente',
        'Carte de fidélité dématérialisée',
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
      description: 'Logiciel de réservation et fidélité pour salons de beauté. Propose automatiquement les prochains rendez-vous à la fin de la réservation en ligne.',
      image: 'https://getqarte.com/logo.png',
      publisher: { '@id': 'https://getqarte.com/#organization' },
      featureList: [
        'Vitrine de réservation en ligne',
        'Proposition automatique des 2 prochains rendez-vous (+3 et +6 semaines)',
        'Acompte différé : rappel pour régler 7 jours avant le RDV',
        'Rappels SMS et email avant chaque rendez-vous',
        'Report et annulation par la cliente depuis sa carte',
        'Programme de fidélité (cagnotte, visites, parrainage)',
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
          name: 'Essai gratuit 3 jours',
          price: '0',
          priceCurrency: 'EUR',
          url: 'https://getqarte.com/auth/merchant/signup',
          availability: 'https://schema.org/InStock',
          category: 'FreeTrial',
          eligibleDuration: { '@type': 'QuantitativeValue', value: 3, unitCode: 'DAY' },
        },
      ],
    },
    {
      '@type': 'WebPage',
      '@id': 'https://getqarte.com/blog/faire-revenir-clientes-prochain-rdv-salon#webpage',
      url: 'https://getqarte.com/blog/faire-revenir-clientes-prochain-rdv-salon',
      name: 'Faire revenir ses clientes : reprendre le prochain RDV automatiquement',
      description: 'Propose les 2 prochains RDV (+3 et +6 semaines) à la fin de la réservation en ligne, sans acompte tout de suite. Remplis ton agenda sans relancer personne.',
      inLanguage: 'fr-FR',
      isPartOf: {
        '@type': 'WebSite',
        '@id': 'https://getqarte.com/#website',
        url: 'https://getqarte.com',
        name: 'Qarte',
        publisher: { '@id': 'https://getqarte.com/#organization' },
        inLanguage: 'fr-FR',
      },
      primaryImageOfPage: { '@id': 'https://getqarte.com/blog/faire-revenir-clientes-prochain-rdv-salon#primaryimage' },
      breadcrumb: { '@id': 'https://getqarte.com/blog/faire-revenir-clientes-prochain-rdv-salon#breadcrumb' },
      datePublished: '2026-06-17T08:00:00+02:00',
      dateModified: '2026-06-17T08:00:00+02:00',
      mainEntity: { '@id': 'https://getqarte.com/blog/faire-revenir-clientes-prochain-rdv-salon#article' },
    },
    {
      '@type': 'ImageObject',
      '@id': 'https://getqarte.com/blog/faire-revenir-clientes-prochain-rdv-salon#primaryimage',
      url: 'https://getqarte.com/blog/social/article-13-cover.png',
      contentUrl: 'https://getqarte.com/blog/social/article-13-cover.png',
      width: 1080,
      height: 1080,
      caption: 'Proposer les prochains rendez-vous automatiquement à la fin de la réservation en ligne',
    },
    {
      '@type': 'BreadcrumbList',
      '@id': 'https://getqarte.com/blog/faire-revenir-clientes-prochain-rdv-salon#breadcrumb',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://getqarte.com' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://getqarte.com/blog' },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Faire revenir ses clientes : reprendre le prochain RDV automatiquement',
          item: 'https://getqarte.com/blog/faire-revenir-clientes-prochain-rdv-salon',
        },
      ],
    },
    {
      '@type': 'Article',
      '@id': 'https://getqarte.com/blog/faire-revenir-clientes-prochain-rdv-salon#article',
      isPartOf: { '@id': 'https://getqarte.com/blog/faire-revenir-clientes-prochain-rdv-salon#webpage' },
      mainEntityOfPage: { '@id': 'https://getqarte.com/blog/faire-revenir-clientes-prochain-rdv-salon#webpage' },
      headline: 'Faire revenir ses clientes : leur faire reprendre le prochain RDV tout de suite',
      alternativeHeadline: 'Proposer les prochains rendez-vous automatiquement en fin de réservation',
      description: 'La cliente repart sans prochain RDV = un trou dans ton agenda. Comment proposer ses 2 prochains rendez-vous à la fin de la réservation en ligne, sans acompte tout de suite.',
      image: { '@id': 'https://getqarte.com/blog/faire-revenir-clientes-prochain-rdv-salon#primaryimage' },
      datePublished: '2026-06-17T08:00:00+02:00',
      dateModified: '2026-06-17T08:00:00+02:00',
      inLanguage: 'fr-FR',
      articleSection: 'Fidélisation',
      keywords: [
        'faire revenir ses clientes salon',
        'fidéliser clientes coiffure',
        'reprendre rendez-vous salon',
        'remplir son agenda salon',
        'prochain rendez-vous automatique',
        'rebooking salon de beauté',
      ],
      author: { '@id': 'https://getqarte.com/#organization' },
      publisher: { '@id': 'https://getqarte.com/#organization' },
      about: [
        { '@type': 'Thing', name: 'Fidélisation des clientes' },
        { '@type': 'Thing', name: 'Prise de rendez-vous récurrente' },
        { '@id': 'https://getqarte.com/#software' },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://getqarte.com/blog/faire-revenir-clientes-prochain-rdv-salon#faq',
      isPartOf: { '@id': 'https://getqarte.com/blog/faire-revenir-clientes-prochain-rdv-salon#webpage' },
      inLanguage: 'fr-FR',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Comment faire revenir ses clientes dans un salon de beauté ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Le levier le plus efficace est de faire reprendre le prochain rendez-vous tant que la cliente est encore là, ou juste après sa réservation. Avec Qarte, à la fin d\'une réservation en ligne, la vitrine propose à la cliente ses 2 prochains RDV (par exemple +3 et +6 semaines, ajustables) en un geste. Le créneau est gardé sans rien payer tout de suite.',
          },
        },
        {
          '@type': 'Question',
          name: 'La cliente doit-elle payer un acompte pour réserver son prochain RDV ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Non, pas au moment où elle réserve son prochain rendez-vous. Le créneau est bloqué sans acompte immédiat. Si tu demandes un acompte, un rappel par email et SMS part automatiquement 7 jours avant le rendez-vous pour qu\'elle le règle, le reporte ou l\'annule.',
          },
        },
        {
          '@type': 'Question',
          name: 'Combien de rendez-vous de suivi peut-on proposer ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Jusqu\'à 2 rendez-vous de suivi par réservation. Le calendrier s\'ouvre directement sur le créneau conseillé (par exemple +3 semaines), et la cliente ajuste le jour et l\'heure qui l\'arrangent.',
          },
        },
        {
          '@type': 'Question',
          name: 'Et si la cliente ne règle pas l\'acompte de son prochain RDV ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Si l\'acompte n\'est pas réglé, le créneau se libère automatiquement en respectant ton délai d\'annulation habituel. Tu récupères la place pour une autre cliente, sans rien gérer à la main.',
          },
        },
        {
          '@type': 'Question',
          name: 'La cliente peut-elle déplacer ou annuler son prochain rendez-vous ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui. Depuis sa carte de fidélité, la cliente peut reporter ou annuler son rendez-vous selon les délais que tu as fixés. Le rappel envoyé 7 jours avant le lui rappelle.',
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

        <section className="py-12 sm:py-16 bg-gradient-to-b from-indigo-50/60 to-white">
          <div className="max-w-3xl mx-auto px-6">
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <Link href="/blog" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  Blog
                </Link>
                <span>/</span>
                <span className="text-gray-600">Fidélisation</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="inline-flex px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                  Fidélisation
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />6 min de lecture
                </span>
                <span className="text-sm text-gray-400">17 juin 2026</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                Faire revenir ses clientes : leur faire reprendre le prochain RDV tout de suite
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                Une cliente contente qui repart sans avoir repris de rendez-vous, c&apos;est un trou
                dans ton agenda dans 3 semaines. Voici comment proposer ses 2 prochaines visites
                pile à la fin de sa réservation, sans rien lui faire payer tout de suite, et sans
                que tu aies à relancer qui que ce soit.
              </p>
            </motion.div>

            <div className="mt-8 rounded-2xl overflow-hidden">
              <Image
                src="/blog/social/article-13-cover.png"
                alt="Proposer les prochains rendez-vous automatiquement à la fin de la réservation en ligne avec Qarte"
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
                    <span className="text-indigo-500 font-semibold min-w-[20px]">{index + 1}.</span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <article className="max-w-3xl mx-auto px-6 pb-16">
          {/* TL;DR */}
          <div className="mb-12 bg-indigo-50 border-l-4 border-indigo-500 p-6 rounded-r-xl">
            <p className="text-sm font-bold text-indigo-900 mb-2">L&apos;essentiel en 30 secondes</p>
            <p className="text-base text-gray-700 leading-relaxed">
              La meilleure cliente, c&apos;est celle qui a déjà son prochain RDV. À la fin d&apos;une
              réservation en ligne, Qarte lui propose ses{' '}
              <strong>2 prochains rendez-vous</strong> (par exemple +3 et +6 semaines, qu&apos;elle
              ajuste). Elle garde sa place <strong>sans rien payer tout de suite</strong> ; un
              rappel pour régler l&apos;acompte part <strong>7 jours avant</strong>. Ton agenda se
              remplit tout seul, et tu ne relances personne.
            </p>
          </div>

          {/* Section 1 */}
          <section id="trou" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <CalendarRange className="w-7 h-7 text-indigo-600 flex-shrink-0" />
              Le trou dans ton agenda que personne ne voit
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Tu connais ta moyenne : une cliente ongles revient toutes les 3 semaines, une couleur
              toutes les 5 à 6, un barbier voit ses habitués tous les mois. Le rythme est là. Le
              problème, c&apos;est le moment où la cliente repart : ravie, mais sans date pour la
              prochaine fois.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Elle se dit « je rebooke plus tard ». Puis la vie passe. Quand elle y repense, ton
              créneau idéal est déjà pris, ou elle tombe sur ta concurrente d&apos;à côté qui, elle,
              avait de la place. Tu n&apos;as rien fait de mal. Tu as juste laissé le prochain RDV
              au hasard.
            </p>
            <p className="text-base text-gray-700 leading-relaxed">
              Ce rendez-vous suivant, c&apos;est le revenu le plus facile de ton salon : la cliente
              te connaît déjà, elle est contente, elle reviendra de toute façon. Le seul enjeu,
              c&apos;est de poser la date <strong>pendant qu&apos;elle est encore avec toi</strong>,
              pas trois semaines plus tard.
            </p>
          </section>

          {/* Section 2 */}
          <section id="caisse" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Repeat className="w-7 h-7 text-indigo-600 flex-shrink-0" />
              « On se revoit dans 3 semaines ? » : la phrase qui saute en ligne
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              En salon, les pros qui remplissent le mieux leur agenda font toutes la même chose : au
              moment de l&apos;encaissement, elles proposent la date suivante. « On te recale dans 3
              semaines, même créneau ? » Neuf fois sur dix, la cliente dit oui. C&apos;est simple, et
              ça marche.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Sauf que cette phrase disparaît dès que la cliente réserve <strong>en ligne</strong>,
              le soir depuis son canapé. Personne n&apos;est là pour lui proposer la suite. Pareil
              quand tu es <strong>à domicile</strong> et que tu enchaînes, ou simplement quand
              c&apos;est le coup de feu et que tu oublies de demander.
            </p>
            <p className="text-base text-gray-700 leading-relaxed">
              Résultat : le réflexe qui te remplit l&apos;agenda en salon n&apos;existe plus dès que
              la réservation se fait sans toi. Il faut donc que ta page de réservation le fasse à ta
              place.
            </p>
          </section>

          {/* Section 3 */}
          <section id="qarte" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <CalendarHeart className="w-7 h-7 text-indigo-600 flex-shrink-0" />
              Comment Qarte propose les prochains RDV tout seul
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Quand une cliente vient de réserver sur ta vitrine Qarte, juste après la confirmation,
              une petite carte apparaît : <em>« Réservez déjà vos prochains rendez-vous »</em>. Le
              calendrier s&apos;ouvre directement sur le bon rythme (par exemple +3 semaines), elle
              choisit le jour et l&apos;heure qui l&apos;arrangent, et c&apos;est gardé. Elle peut en
              poser un deuxième dans la foulée (+6 semaines). Deux visites de suivi, en deux gestes.
            </p>
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-6">
              <p className="text-sm text-indigo-900 leading-relaxed">
                <strong>Concrètement :</strong> la cliente garde ses créneaux préférés avant qu&apos;ils
                ne partent, et toi tu vois deux rendez-vous tomber dans ton agenda des semaines à
                l&apos;avance, sans avoir rien demandé.
              </p>
            </div>
            <ul className="space-y-3 mb-2">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span className="text-base text-gray-700 leading-relaxed">
                  <strong>Le calendrier est pré-réglé</strong> sur le bon écart : la cliente n&apos;a
                  qu&apos;à confirmer ou décaler de quelques jours.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span className="text-base text-gray-700 leading-relaxed">
                  <strong>Mêmes prestations</strong> que sa réservation du jour, reprises
                  automatiquement.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span className="text-base text-gray-700 leading-relaxed">
                  <strong>2 rendez-vous maximum</strong> : on garde ça simple, sans bloquer ton
                  agenda sur trois mois.
                </span>
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="acompte" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Bell className="w-7 h-7 text-indigo-600 flex-shrink-0" />
              Sans rien payer maintenant : le rappel part 7 jours avant
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              C&apos;est le détail qui fait toute la différence. Demander un acompte tout de suite
              pour un RDV dans 3 semaines, ça refroidit. Alors on ne le demande pas maintenant : la
              cliente garde sa place <strong>sans rien régler</strong>.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Puis, <strong>7 jours avant le rendez-vous</strong>, un email et un SMS partent tout
              seuls pour lui rappeler de régler l&apos;acompte, ou de reporter / annuler si besoin.
              Si tu ne demandes pas d&apos;acompte, le rappel sert simplement à confirmer la venue.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong>Et si elle ne règle pas l&apos;acompte ?</strong> Le créneau se libère tout
                seul, en respectant ton délai d&apos;annulation habituel. Tu récupères la place pour
                une autre cliente, sans rien gérer à la main.
              </p>
            </div>
            <p className="text-base text-gray-700 leading-relaxed">
              La cliente est rassurée (rien à payer tout de suite), toi tu sécurises le créneau, et
              l&apos;acompte arrive au bon moment, quand le rendez-vous approche vraiment.
            </p>
          </section>

          {/* Section 5 */}
          <section id="agenda" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-indigo-600 flex-shrink-0" />
              Ce que ça change pour ton agenda
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Prenons un exemple simple. Imagine <strong>80 réservations en ligne par mois</strong>.
              Si seulement <strong>1 cliente sur 4</strong> repose son prochain RDV en partant, ça
              fait <strong>20 créneaux déjà remplis</strong> le mois suivant. Sans relance, sans
              campagne, sans rien faire de plus.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              (C&apos;est un exemple pour fixer les idées, pas une promesse : à toi de voir ton vrai
              taux. Mais même 1 sur 5, c&apos;est un paquet de rendez-vous que tu laissais filer.)
            </p>
            <p className="text-base text-gray-700 leading-relaxed">
              Et ces rendez-vous-là sont les meilleurs : ce sont tes habituées, celles qui
              cumulent leur fidélité, parlent de toi, et ne te coûtent rien à faire revenir. Pendant
              que les autres salons dépensent pour <em>attirer</em> de nouvelles clientes, toi tu
              <strong> gardes</strong> les tiennes.
            </p>
          </section>

          {/* Section 6 */}
          <section id="activer" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <CheckCircle2 className="w-7 h-7 text-indigo-600 flex-shrink-0" />
              L&apos;activer en 30 secondes
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Dans ton tableau de bord, va dans <strong>Agenda → Paramètres → Réservation</strong>,
              et active <strong>« Prochains rendez-vous »</strong>. C&apos;est tout. À partir de là,
              chaque cliente qui réserve en ligne se voit proposer ses prochaines visites.
            </p>
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
              <p className="text-sm text-indigo-900 leading-relaxed">
                <strong>Astuce :</strong> si tu travailles en créneaux fixes, pense à ouvrir ton
                agenda assez loin (au moins 6 semaines à l&apos;avance) pour que les rendez-vous de
                suivi aient des créneaux où se poser. Qarte te le rappelle au moment d&apos;activer.
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Comment faire revenir ses clientes dans un salon de beauté ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Le plus efficace : faire reprendre le prochain rendez-vous tant que la cliente est
                  encore là, ou juste après sa réservation. Avec Qarte, à la fin d&apos;une
                  réservation en ligne, ta vitrine propose ses 2 prochains RDV (par exemple +3 et +6
                  semaines, ajustables), gardés sans rien payer tout de suite.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">La cliente doit-elle payer un acompte pour réserver son prochain RDV ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Non, pas au moment où elle réserve. Le créneau est gardé sans acompte immédiat. Si
                  tu demandes un acompte, un rappel par email et SMS part automatiquement 7 jours
                  avant le rendez-vous pour qu&apos;elle le règle, le reporte ou l&apos;annule.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Combien de rendez-vous de suivi peut-on proposer ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Jusqu&apos;à 2 par réservation. Le calendrier s&apos;ouvre directement sur le
                  créneau conseillé (ex. +3 semaines), et la cliente ajuste le jour et l&apos;heure
                  qui l&apos;arrangent.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Et si la cliente ne règle pas l&apos;acompte de son prochain RDV ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Le créneau se libère automatiquement en respectant ton délai d&apos;annulation
                  habituel. Tu récupères la place pour une autre cliente, sans rien gérer à la main.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">La cliente peut-elle déplacer ou annuler son prochain rendez-vous ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Oui, depuis sa carte de fidélité, selon les délais que tu as fixés. Le rappel
                  envoyé 7 jours avant le lui rappelle.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-8 text-center text-white">
            <CalendarHeart className="w-10 h-10 mx-auto mb-4 opacity-90" />
            <h3 className="text-xl sm:text-2xl font-bold mb-3">
              Remplis ton agenda sans relancer personne
            </h3>
            <p className="text-indigo-50 mb-6 max-w-xl mx-auto">
              3 jours gratuits pour tester. En 10 minutes ta vitrine est en ligne, et chaque cliente
              repart avec ses prochains rendez-vous déjà posés.
            </p>
            <Link
              href="/auth/merchant/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 font-bold rounded-2xl hover:bg-indigo-50 transition-colors"
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
                <Link href="/blog/clients-planity-booksy-ne-reviennent-jamais" className="text-indigo-700 hover:text-indigo-800 transition-colors">
                  → Planity, Booksy, Treatwell : ces clientes qui ne reviennent jamais
                </Link>
              </li>
              <li>
                <Link href="/blog/eviter-no-show-salon-rendez-vous" className="text-indigo-700 hover:text-indigo-800 transition-colors">
                  → No-show en salon : 6 étapes pour diviser par 4 les RDV manqués
                </Link>
              </li>
              <li>
                <Link href="/blog/carte-fidelite-dematerialisee-salon-beaute" className="text-indigo-700 hover:text-indigo-800 transition-colors">
                  → Carte de fidélité dématérialisée : pourquoi passer au digital
                </Link>
              </li>
              <li>
                <Link href="/blog/augmenter-chiffre-affaires-salon-beaute" className="text-indigo-700 hover:text-indigo-800 transition-colors">
                  → Augmenter le chiffre d&apos;affaires de son salon : 7 idées qui marchent
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
