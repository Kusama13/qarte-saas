'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  BookOpen,
  Sun,
  CalendarClock,
  CalendarCheck,
  Send,
  Gift,
  ListChecks,
  CheckCircle2,
} from 'lucide-react';
import { FacebookPixel } from '@/components/analytics/FacebookPixel';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const tocItems = [
  { id: 'aout', label: 'Le creux d\'août, la ruée de septembre' },
  { id: 'avant-conges', label: 'La meilleure date de rentrée se pose avant les congés' },
  { id: 'reservation', label: 'Ta vitrine réserve pendant que tu es à la plage' },
  { id: 'relance', label: 'Réveiller les clientes qu\'on n\'a pas vues depuis le printemps' },
  { id: 'raison', label: 'Leur donner une raison de revenir dès septembre' },
  { id: 'plan', label: 'Ton plan d\'action pour une rentrée pleine' },
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
        'Relance des clientes inactives',
        'Remplir son agenda de salon',
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
      description: 'Logiciel de réservation et fidélité pour salons de beauté. Réservation en ligne ouverte 24h/24, relance des clientes inactives et proposition automatique des prochains rendez-vous pour remplir l\'agenda.',
      image: 'https://getqarte.com/logo.png',
      publisher: { '@id': 'https://getqarte.com/#organization' },
      featureList: [
        'Vitrine de réservation en ligne ouverte pendant les congés',
        'Proposition automatique des 2 prochains rendez-vous',
        'Relance SMS des clientes inactives',
        'Rappels SMS et email avant chaque rendez-vous',
        'Programme de fidélité (cagnotte, visites, parrainage)',
      ],
      offers: [
        {
          '@type': 'Offer',
          name: 'Abonnement mensuel',
          price: '34.00',
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
      '@id': 'https://getqarte.com/blog/remplir-agenda-septembre-salon-beaute#webpage',
      url: 'https://getqarte.com/blog/remplir-agenda-septembre-salon-beaute',
      name: 'Rentrée de septembre : remplir l\'agenda de ton salon dès l\'été',
      description: 'Fais reprendre les prochains RDV avant les congés, garde ta réservation en ligne ouverte pendant l\'été, et réveille les clientes disparues depuis le printemps.',
      inLanguage: 'fr-FR',
      isPartOf: {
        '@type': 'WebSite',
        '@id': 'https://getqarte.com/#website',
        url: 'https://getqarte.com',
        name: 'Qarte',
        publisher: { '@id': 'https://getqarte.com/#organization' },
        inLanguage: 'fr-FR',
      },
      primaryImageOfPage: { '@id': 'https://getqarte.com/blog/remplir-agenda-septembre-salon-beaute#primaryimage' },
      breadcrumb: { '@id': 'https://getqarte.com/blog/remplir-agenda-septembre-salon-beaute#breadcrumb' },
      datePublished: '2026-07-24T08:00:00+02:00',
      dateModified: '2026-07-24T08:00:00+02:00',
      mainEntity: { '@id': 'https://getqarte.com/blog/remplir-agenda-septembre-salon-beaute#article' },
    },
    {
      '@type': 'ImageObject',
      '@id': 'https://getqarte.com/blog/remplir-agenda-septembre-salon-beaute#primaryimage',
      url: 'https://getqarte.com/blog/social/article-14-cover.png',
      contentUrl: 'https://getqarte.com/blog/social/article-14-cover.png',
      width: 1080,
      height: 1080,
      caption: 'Remplir l\'agenda de son salon pour la rentrée de septembre',
    },
    {
      '@type': 'BreadcrumbList',
      '@id': 'https://getqarte.com/blog/remplir-agenda-septembre-salon-beaute#breadcrumb',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://getqarte.com' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://getqarte.com/blog' },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Rentrée de septembre : remplir l\'agenda de ton salon',
          item: 'https://getqarte.com/blog/remplir-agenda-septembre-salon-beaute',
        },
      ],
    },
    {
      '@type': 'Article',
      '@id': 'https://getqarte.com/blog/remplir-agenda-septembre-salon-beaute#article',
      isPartOf: { '@id': 'https://getqarte.com/blog/remplir-agenda-septembre-salon-beaute#webpage' },
      mainEntityOfPage: { '@id': 'https://getqarte.com/blog/remplir-agenda-septembre-salon-beaute#webpage' },
      headline: 'Rentrée de septembre : remplir l\'agenda de ton salon dès l\'été',
      alternativeHeadline: 'Préparer sa rentrée de salon dès le mois d\'août',
      description: 'En août c\'est calme, mais septembre est le mois où tes clientes reprennent. Comment remplir ton agenda de rentrée dès maintenant, sans stress et sans relancer une par une.',
      image: { '@id': 'https://getqarte.com/blog/remplir-agenda-septembre-salon-beaute#primaryimage' },
      datePublished: '2026-07-24T08:00:00+02:00',
      dateModified: '2026-07-24T08:00:00+02:00',
      inLanguage: 'fr-FR',
      articleSection: 'Croissance',
      keywords: [
        'remplir agenda salon septembre',
        'rentrée salon de beauté',
        'reprise activité salon',
        'agenda vide été salon',
        'relancer clientes salon',
        'réservation en ligne salon congés',
      ],
      author: { '@id': 'https://getqarte.com/#organization' },
      publisher: { '@id': 'https://getqarte.com/#organization' },
      about: [
        { '@type': 'Thing', name: 'Remplir son agenda de salon' },
        { '@type': 'Thing', name: 'Fidélisation des clientes' },
        { '@id': 'https://getqarte.com/#software' },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://getqarte.com/blog/remplir-agenda-septembre-salon-beaute#faq',
      isPartOf: { '@id': 'https://getqarte.com/blog/remplir-agenda-septembre-salon-beaute#webpage' },
      inLanguage: 'fr-FR',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Comment remplir son agenda de salon pour la rentrée de septembre ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Trois leviers, tous à activer avant les vacances. D\'abord, faire reprendre le prochain rendez-vous à chaque cliente avant qu\'elle parte en congés. Ensuite, garder ta réservation en ligne ouverte pendant ta fermeture pour que les clientes calent leur RDV de rentrée quand elles y pensent. Enfin, envoyer une relance douce aux clientes que tu n\'as pas vues depuis le printemps. Avec Qarte, ces trois choses se font sans que tu relances personne à la main.',
          },
        },
        {
          '@type': 'Question',
          name: 'Quand commencer à préparer la rentrée de son salon ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Dès juillet, avant le départ en congés de tes clientes. Une cliente qui repart sans date pour septembre décide au hasard de son retour, et souvent trop tard pour tes bons créneaux. En posant la date suivante maintenant, tu remplis ta rentrée pendant que les autres salons attendent le 1er septembre pour s\'en occuper.',
          },
        },
        {
          '@type': 'Question',
          name: 'Comment relancer les clientes qu\'on n\'a pas vues depuis longtemps ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Un simple SMS suffit, à condition qu\'il soit personnel et pas insistant. Qarte repère automatiquement les clientes inactives depuis un certain temps et leur envoie un message pour les inviter à reprendre RDV, avec ton lien de réservation. Tu choisis le délai (par exemple 2 mois sans visite) et le message part tout seul, sans que tu tiennes une liste.',
          },
        },
        {
          '@type': 'Question',
          name: 'Peut-on prendre des réservations pendant ses congés d\'été ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui, et c\'est même le meilleur moment pour remplir ta rentrée. Ta vitrine Qarte reste ouverte 24h/24 même quand ton salon est fermé. Tu bloques tes dates de congés pour ne pas être réservée pendant ton absence, et les clientes réservent leurs créneaux de septembre à toute heure, depuis leur transat.',
          },
        },
        {
          '@type': 'Question',
          name: 'Faut-il faire une promo de rentrée pour faire revenir les clientes ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Pas forcément une remise. Une carte de fidélité qui avance à chaque visite, un petit soin offert au bout de X passages ou une cagnotte qui grimpe donnent une raison de revenir sans casser tes prix. La rentrée est le bon moment pour rappeler à tes clientes où elles en sont dans leur fidélité, ça les fait reprendre RDV plus vite qu\'une promo.',
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
                <span className="text-gray-600">Croissance</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="inline-flex px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                  Croissance
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />8 min de lecture
                </span>
                <span className="text-sm text-gray-400">24 juillet 2026</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                Rentrée de septembre : remplir l&apos;agenda de ton salon dès l&apos;été
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                En août ton salon tourne au ralenti, puis tout le monde revient d&apos;un coup en
                septembre. Le piège, c&apos;est d&apos;attendre la rentrée pour s&apos;en occuper.
                Voici comment remplir ton agenda de septembre dès maintenant, sans stress et sans
                relancer tes clientes une par une.
              </p>
            </motion.div>

            <div className="mt-8 rounded-2xl overflow-hidden">
              <Image
                src="/blog/social/article-14-cover.png"
                alt="Remplir l'agenda de son salon de beauté pour la rentrée de septembre avec Qarte"
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
              Une rentrée pleine se prépare <strong>avant les congés</strong>, pas le 1er septembre.
              Fais reprendre le <strong>prochain RDV</strong> à chaque cliente avant qu&apos;elle
              parte, garde ta <strong>réservation en ligne ouverte</strong> pendant ta fermeture, et
              envoie une <strong>relance douce</strong> aux clientes disparues depuis le printemps.
              Avec Qarte, ces trois choses tournent toutes seules pendant que tu es en vacances.
            </p>
          </div>

          {/* Section 1 */}
          <section id="aout" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Sun className="w-7 h-7 text-indigo-600 flex-shrink-0" />
              Le creux d&apos;août, la ruée de septembre
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Tu connais le rythme. En août, la moitié de tes clientes est partie, l&apos;autre
              repousse. Ton agenda respire, tu souffles un peu, c&apos;est normal et c&apos;est
              mérité. Puis arrive septembre : tout le monde veut son créneau en même temps, la
              couleur de la rentrée, les ongles pour reprendre le travail, la coupe avant de repointer
              au bureau.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Le problème n&apos;est pas le manque de demande, c&apos;est le <strong>timing</strong>.
              Si tu attends la rentrée pour organiser la rentrée, tu passes ta première semaine de
              septembre le téléphone à la main, à recaler tout le monde, avec des trous les jours
              creux et du refus les jours pleins.
            </p>
            <p className="text-base text-gray-700 leading-relaxed">
              Les salons qui vivent une rentrée sereine font l&apos;inverse : ils remplissent
              septembre <strong>pendant l&apos;été</strong>, quand personne n&apos;y pense encore.
              Voici comment, en trois gestes.
            </p>
          </section>

          {/* Section 2 */}
          <section id="avant-conges" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <CalendarClock className="w-7 h-7 text-indigo-600 flex-shrink-0" />
              La meilleure date de rentrée se pose avant les congés
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              La cliente que tu vois en juillet reviendra en septembre, tu le sais. Mais si elle
              repart <strong>sans date</strong>, elle décide de son retour au hasard, souvent trop
              tard pour ton bon créneau, parfois chez la voisine qui, elle, avait de la place.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Le réflexe qui remplit ta rentrée est simple : au moment de l&apos;encaissement, tu
              proposes déjà la date d&apos;après. <em>« On se recale à la rentrée, première semaine de
              septembre ? »</em> Neuf fois sur dix, elle dit oui, parce que c&apos;est plus facile de
              dire oui maintenant que de rappeler dans un mois.
            </p>
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-6">
              <p className="text-sm text-indigo-900 leading-relaxed">
                <strong>Avec Qarte :</strong> à la fin d&apos;une réservation en ligne, ta vitrine
                propose à la cliente ses <strong>2 prochains rendez-vous</strong>. Le calendrier
                s&apos;ouvre directement sur le bon écart (par exemple sa reprise de septembre), elle
                garde sa place <strong>sans rien payer tout de suite</strong>, et tu vois deux
                créneaux de rentrée tomber dans ton agenda avant même de partir en vacances.
              </p>
            </div>
            <p className="text-base text-gray-700 leading-relaxed">
              Poser la date suivante pendant que la cliente est encore avec toi, c&apos;est le revenu
              le plus facile de ton salon. En juillet, ce geste te construit une rentrée déjà à moitié
              pleine.
            </p>
          </section>

          {/* Section 3 */}
          <section id="reservation" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <CalendarCheck className="w-7 h-7 text-indigo-600 flex-shrink-0" />
              Ta vitrine réserve pendant que tu es à la plage
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Ton salon ferme deux ou trois semaines, mais tes clientes, elles, pensent à leur rentrée
              justement pendant leurs congés. Le dimanche soir, sur le transat, elles se disent
              « il faut que je prenne RDV pour la reprise ». Si ta seule prise de RDV, c&apos;est le
              téléphone du salon, ce moment-là est perdu.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Avec une réservation en ligne, ta vitrine reste ouverte <strong>24h/24</strong>, même
              salon fermé. Tu <strong>bloques tes dates de congés</strong> pour ne pas être réservée
              pendant ton absence, et les clientes calent leurs créneaux de septembre à toute heure,
              sans te déranger et sans attendre ta réouverture.
            </p>
            <ul className="space-y-3 mb-2">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span className="text-base text-gray-700 leading-relaxed">
                  <strong>Partage ton lien</strong> en story Instagram avant de fermer :
                  « Je pars du 5 au 20 août, réservez déjà votre rentrée ici. »
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span className="text-base text-gray-700 leading-relaxed">
                  <strong>Chaque réservation te prévient</strong> par notification, et la cliente
                  reçoit sa confirmation puis un rappel la veille du RDV.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span className="text-base text-gray-700 leading-relaxed">
                  <strong>Tu reviens de vacances</strong> avec une première semaine déjà remplie, au
                  lieu d&apos;un agenda vide à rattraper dans l&apos;urgence.
                </span>
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="relance" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Send className="w-7 h-7 text-indigo-600 flex-shrink-0" />
              Réveiller les clientes qu&apos;on n&apos;a pas vues depuis le printemps
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Dans ton fichier, il y a des clientes qui venaient régulièrement et que tu n&apos;as
              plus vues depuis mars ou avril. Elles ne sont pas fâchées, elles t&apos;ont juste oubliée
              le temps d&apos;un printemps chargé. La rentrée est le prétexte parfait pour leur faire
              signe.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Un <strong>SMS</strong> bien tourné suffit, à condition qu&apos;il soit personnel et pas
              insistant : <em>« Coucou Julie, ça fait un moment ! On se voit pour la rentrée ? Voici
              mon lien pour réserver. »</em> Simple, chaleureux, avec le lien qui va bien.
            </p>
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-6">
              <p className="text-sm text-indigo-900 leading-relaxed">
                <strong>Avec Qarte :</strong> tu n&apos;as pas à tenir la liste. Qarte repère les
                clientes <strong>inactives</strong> depuis le délai que tu choisis (par exemple 2 mois
                sans visite) et leur envoie la relance toute seule, avec ton lien de réservation. Tu
                allumes, tu choisis le message, et ça part au bon moment.
              </p>
            </div>
            <p className="text-base text-gray-700 leading-relaxed">
              Une cliente ramenée par un simple SMS, c&apos;est un rendez-vous que tu croyais perdu et
              qui remplit ta rentrée sans avoir dépensé un centime en pub.
            </p>
          </section>

          {/* Section 5 */}
          <section id="raison" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Gift className="w-7 h-7 text-indigo-600 flex-shrink-0" />
              Leur donner une raison de revenir dès septembre
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Faire revenir, ce n&apos;est pas forcément casser tes prix. Une <strong>carte de
              fidélité</strong> qui avance à chaque visite fait plus revenir qu&apos;une remise : la
              cliente qui en est à 8 passages sur 10 a envie de finir sa carte, et la rentrée lui
              donne l&apos;occasion.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Le bon geste de septembre, c&apos;est de <strong>rappeler à chaque cliente où elle en
              est</strong> : « plus que 2 visites avant ton soin offert », « ta cagnotte est à 24 € ».
              C&apos;est concret, c&apos;est à elle, et ça déclenche le prochain RDV bien mieux
              qu&apos;un « -10 % » qui rogne ta marge.
            </p>
            <p className="text-base text-gray-700 leading-relaxed">
              Si tu veux vraiment marquer la rentrée, garde les remises pour ce qui te rapporte :
              un petit bonus quand une cliente <strong>parraine une copine</strong>, par exemple. Tu
              gagnes une nouvelle cliente et tu récompenses celle qui est déjà fidèle, sans brader ton
              travail.
            </p>
          </section>

          {/* Section 6 */}
          <section id="plan" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <ListChecks className="w-7 h-7 text-indigo-600 flex-shrink-0" />
              Ton plan d&apos;action pour une rentrée pleine
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-6">
              Rien de compliqué. Cinq gestes à caler avant de partir en vacances, et ta rentrée se
              remplit toute seule pendant ton absence.
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span className="text-base text-gray-700 leading-relaxed">
                  <strong>Propose la date de septembre</strong> à chaque cliente que tu vois en
                  juillet, avant qu&apos;elle parte.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span className="text-base text-gray-700 leading-relaxed">
                  <strong>Bloque tes dates de congés</strong> dans ton agenda en ligne, et laisse la
                  réservation ouverte pour la rentrée.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span className="text-base text-gray-700 leading-relaxed">
                  <strong>Partage ton lien</strong> en story Insta avant de fermer : « Réservez déjà
                  votre rentrée. »
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span className="text-base text-gray-700 leading-relaxed">
                  <strong>Active la relance des clientes inactives</strong> pour réveiller celles
                  disparues depuis le printemps.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span className="text-base text-gray-700 leading-relaxed">
                  <strong>Rappelle à tes fidèles</strong> où elles en sont dans leur carte, pour leur
                  donner envie de finir dès septembre.
                </span>
              </li>
            </ul>
            <p className="text-base text-gray-700 leading-relaxed">
              Fais ces cinq choses avant le 1er août, et tu reviendras de vacances avec un agenda de
              rentrée déjà bien avancé, pendant que les autres salons commenceront tout juste à
              rappeler leurs clientes.
            </p>
          </section>

          {/* FAQ */}
          <section id="faq" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Comment remplir son agenda de salon pour la rentrée de septembre ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Trois leviers, tous à activer avant les congés : faire reprendre le prochain RDV à
                  chaque cliente avant qu&apos;elle parte, garder ta réservation en ligne ouverte
                  pendant ta fermeture, et envoyer une relance douce aux clientes que tu n&apos;as pas
                  vues depuis le printemps. Avec Qarte, ces trois choses se font sans que tu relances
                  personne à la main.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Quand commencer à préparer la rentrée de son salon ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Dès juillet, avant le départ en congés de tes clientes. Une cliente qui repart sans
                  date pour septembre décide de son retour au hasard, souvent trop tard pour tes bons
                  créneaux. En posant la date maintenant, tu remplis ta rentrée pendant que les autres
                  salons attendent le 1er septembre.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Comment relancer les clientes qu&apos;on n&apos;a pas vues depuis longtemps ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Un simple SMS suffit, s&apos;il est personnel et pas insistant. Qarte repère les
                  clientes inactives depuis le délai que tu choisis (par exemple 2 mois sans visite) et
                  leur envoie un message avec ton lien de réservation, sans que tu tiennes de liste.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Peut-on prendre des réservations pendant ses congés d&apos;été ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Oui, et c&apos;est le meilleur moment pour remplir ta rentrée. Ta vitrine reste
                  ouverte 24h/24 même salon fermé. Tu bloques tes dates de congés pour ne pas être
                  réservée pendant ton absence, et les clientes réservent leurs créneaux de septembre à
                  toute heure.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Faut-il faire une promo de rentrée pour faire revenir les clientes ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Pas forcément une remise. Une carte de fidélité qui avance à chaque visite, un soin
                  offert au bout de X passages ou une cagnotte qui grimpe donnent une raison de revenir
                  sans casser tes prix. Rappeler à tes clientes où elles en sont dans leur fidélité les
                  fait reprendre RDV plus vite qu&apos;une promo.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-8 text-center text-white">
            <CalendarCheck className="w-10 h-10 mx-auto mb-4 opacity-90" />
            <h3 className="text-xl sm:text-2xl font-bold mb-3">
              Pars en vacances l&apos;esprit tranquille
            </h3>
            <p className="text-indigo-50 mb-6 max-w-xl mx-auto">
              3 jours gratuits pour tester. En 10 minutes ta vitrine est en ligne, tes congés sont
              bloqués, et tes clientes réservent leur rentrée pendant que tu te reposes.
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
                <Link href="/blog/faire-revenir-clientes-prochain-rdv-salon" className="text-indigo-700 hover:text-indigo-800 transition-colors">
                  → Faire revenir ses clientes : reprendre le prochain RDV tout de suite
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
