'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  BookOpen,
  Calendar,
  MapPin,
  Trophy,
  Sparkles,
  GraduationCap,
  Check,
} from 'lucide-react';
import { FacebookPixel } from '@/components/analytics/FacebookPixel';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const tocItems = [
  { id: 'cest-quoi', label: 'Beauty Profs 2026, c\'est quoi exactement' },
  { id: 'pour-toi', label: 'Pourquoi ce salon est fait pour toi (ongle et regard)' },
  { id: 'temps-forts', label: 'Les temps forts : NAILYMPION, Lash & Brow Masters' },
  { id: 'raisons', label: '5 raisons concrètes d\'y aller' },
  { id: 'rentabiliser', label: 'Transformer ta visite en nouvelles clientes' },
  { id: 'infos-pratiques', label: 'Infos pratiques (dates, lieu, billetterie)' },
  { id: 'faq', label: 'Questions fréquentes' },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://getqarte.com' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://getqarte.com/blog' },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Beauty Profs 2026 : pourquoi les pros de l\'ongle et du regard doivent y aller',
          item: 'https://getqarte.com/blog/beauty-profs-2026-salon-beaute-marseille',
        },
      ],
    },
    {
      '@type': 'Event',
      name: 'Beauty Profs 2026',
      startDate: '2026-11-14',
      endDate: '2026-11-15',
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: 'Parc Chanot',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Marseille',
          addressCountry: 'FR',
        },
      },
      description:
        'Salon professionnel dédié à l\'esthétique : ongles, beauté du regard (cils et sourcils), dermopigmentation, soins, cosmétiques et formation. Plus de 60 exposants, masterclasses et deux compétitions internationales (NAILYMPION France et Lash & Brow Masters).',
      organizer: { '@type': 'Organization', name: 'Beauty Profs', url: 'https://beauty-profs.com' },
      url: 'https://beauty-profs.com',
    },
    {
      '@type': 'Article',
      headline: 'Beauty Profs 2026 : pourquoi les pros de l\'ongle et du regard doivent y aller',
      description:
        'Beauty Profs 2026, le salon pro de l\'esthétique à Marseille (14-15 novembre, Parc Chanot) : pourquoi y aller quand tu travailles l\'ongle ou le regard, les temps forts, et comment rentabiliser ta visite.',
      image: {
        '@type': 'ImageObject',
        url: 'https://getqarte.com/blog/social/article-12-cover.png',
        width: 1080,
        height: 1080,
      },
      datePublished: '2026-06-03T08:00:00+02:00',
      dateModified: '2026-06-03T08:00:00+02:00',
      author: { '@type': 'Organization', name: 'Qarte', url: 'https://getqarte.com' },
      publisher: {
        '@type': 'Organization',
        name: 'Qarte',
        logo: { '@type': 'ImageObject', url: 'https://getqarte.com/logo.png' },
      },
      mainEntityOfPage: 'https://getqarte.com/blog/beauty-profs-2026-salon-beaute-marseille',
      articleSection: 'Événement',
      inLanguage: 'fr-FR',
      keywords: [
        'beauty profs 2026',
        'beauty profs marseille',
        'salon professionnel beauté marseille',
        'salon prothésiste ongulaire 2026',
        'nailympion france 2026',
        'salon esthétique cils sourcils',
      ],
      mentions: [
        { '@type': 'Thing', name: 'Beauty Profs' },
        { '@type': 'Thing', name: 'Prothésie ongulaire' },
        { '@type': 'Thing', name: 'Beauté du regard' },
      ],
    },
    {
      '@type': 'FAQPage',
      inLanguage: 'fr-FR',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Quand et où a lieu Beauty Profs 2026 ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Beauty Profs 2026 a lieu les 14 et 15 novembre 2026, au Parc Chanot à Marseille. La billetterie et les horaires à jour sont sur le site officiel beauty-profs.com.',
          },
        },
        {
          '@type': 'Question',
          name: 'Beauty Profs, c\'est pour quels métiers de la beauté ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Surtout l\'esthétique : prothésistes ongulaires, spécialistes des cils et sourcils, esthéticiennes, instituts, dermopigmentation, ainsi que les formatrices. Si tu travailles l\'ongle ou le regard, c\'est l\'un des salons les plus ciblés pour toi en France.',
          },
        },
        {
          '@type': 'Question',
          name: 'Combien coûte l\'entrée à Beauty Profs ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'L\'entrée se réserve via la billetterie sur le site officiel beauty-profs.com (badge professionnel). Les tarifs et horaires exacts évoluent selon l\'édition, vérifie-les directement sur leur billetterie avant de te déplacer.',
          },
        },
        {
          '@type': 'Question',
          name: 'Qu\'est-ce que NAILYMPION et les Lash & Brow Masters ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ce sont deux compétitions internationales organisées pendant le salon : NAILYMPION France 2026 pour l\'ongle, et les Lash & Brow Masters pour les cils et sourcils. Même sans concourir, ce sont des démonstrations de très haut niveau pour progresser et trouver de l\'inspiration.',
          },
        },
        {
          '@type': 'Question',
          name: 'Comment rentabiliser une journée passée à Beauty Profs ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Repars avec 2 ou 3 techniques applicables tout de suite, le contact des fournisseurs utiles, et surtout un plan pour remplir ton agenda derrière. Apprendre une nouvelle pose ne sert à rien si ton agenda reste vide : une vitrine en ligne, la réservation directe et une carte de fidélité transforment ces nouvelles compétences en rendez-vous réguliers.',
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
              Tester Qarte gratuitement
            </Link>
          </div>
        </header>

        <section className="py-12 sm:py-16 bg-gradient-to-b from-violet-50/50 to-white">
          <div className="max-w-3xl mx-auto px-6">
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <Link href="/blog" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  Blog
                </Link>
                <span>/</span>
                <span className="text-gray-600">Événement</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="inline-flex px-3 py-1 bg-violet-50 text-violet-700 text-xs font-semibold rounded-full">
                  Événement
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />7 min de lecture
                </span>
                <span className="text-sm text-gray-400">Publié le 3 juin 2026</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                Beauty Profs 2026 : pourquoi les pros de l&apos;ongle et du regard doivent y aller
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                Les 14 et 15 novembre 2026, le <strong>Parc Chanot à Marseille</strong> accueille
                Beauty Profs, un salon professionnel dédié à l&apos;esthétique. Si tu travailles
                l&apos;ongle, les cils, les sourcils ou la peau, c&apos;est l&apos;un des rendez-vous
                les plus ciblés de l&apos;année pour toi. Voici ce que tu vas y trouver, pourquoi ça
                vaut le déplacement, et comment transformer ces deux jours en nouvelles clientes.
              </p>
            </motion.div>

            <div className="mt-8 rounded-2xl overflow-hidden">
              <Image
                src="/blog/social/article-12-cover.png"
                alt="Prothésiste ongulaire admirant une décoration d'ongles sur un salon professionnel de la beauté"
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
              <BookOpen className="w-4 h-4 text-violet-600" />
              Sommaire
            </div>
            <ol className="space-y-2">
              {tocItems.map((item, index) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-start gap-3 text-sm text-gray-600 hover:text-violet-600 transition-colors py-1"
                  >
                    <span className="text-violet-400 font-semibold min-w-[20px]">{index + 1}.</span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <article className="max-w-3xl mx-auto px-6 pb-16">
          <div className="mb-12 bg-violet-50 border border-violet-200 p-6 rounded-2xl">
            <p className="text-sm font-bold text-violet-900 mb-2">L&apos;essentiel en 30 secondes</p>
            <p className="text-base text-gray-700 leading-relaxed">
              <strong>Beauty Profs</strong> se tient les 14 et 15 novembre 2026 au Parc Chanot, à
              Marseille. C&apos;est un salon professionnel de l&apos;esthétique (ongles, regard,
              dermopigmentation, soins, formation) avec plus de 60 exposants, des masterclasses et
              deux compétitions internationales : NAILYMPION France et les Lash &amp; Brow Masters.
              Pour une prothésiste ongulaire ou une spécialiste du regard, c&apos;est un concentré de
              tendances, de matériel et de formation. La billetterie est sur le site officiel.
            </p>
          </div>

          <section id="cest-quoi" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Calendar className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Beauty Profs 2026, c&apos;est quoi exactement
            </h2>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Beauty Profs est un salon professionnel réservé aux experts de la beauté. Pendant deux
              jours, des marques, des fournisseurs et des formatrices se réunissent au même endroit
              pour présenter leurs nouveautés, faire des démonstrations et animer des ateliers. On y
              vient pour voir, toucher, tester et apprendre, pas pour rester derrière un écran.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-5 bg-violet-50 border border-violet-200 rounded-xl">
                <Calendar className="w-6 h-6 mx-auto mb-2 text-violet-600" />
                <p className="text-sm font-bold text-gray-900">14-15 novembre 2026</p>
                <p className="text-xs text-gray-600 mt-1">deux jours</p>
              </div>
              <div className="text-center p-5 bg-violet-50 border border-violet-200 rounded-xl">
                <MapPin className="w-6 h-6 mx-auto mb-2 text-violet-600" />
                <p className="text-sm font-bold text-gray-900">Parc Chanot</p>
                <p className="text-xs text-gray-600 mt-1">Marseille</p>
              </div>
              <div className="text-center p-5 bg-violet-50 border border-violet-200 rounded-xl">
                <Sparkles className="w-6 h-6 mx-auto mb-2 text-violet-600" />
                <p className="text-sm font-bold text-gray-900">60+ exposants</p>
                <p className="text-xs text-gray-600 mt-1">marques et formatrices</p>
              </div>
            </div>

            <p className="text-base text-gray-700 leading-relaxed">
              Les univers représentés couvrent l&apos;ongle, la beauté du regard (cils et sourcils),
              la dermopigmentation, les soins et cosmétiques, le blanchiment dentaire, le capillaire,
              le bronzage, ainsi que la formation et le coaching. On y trouve aussi des services
              numériques pour les pros, des outils de gestion aux solutions de fidélisation.
            </p>
          </section>

          <section id="pour-toi" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Pourquoi ce salon est fait pour toi (ongle et regard)
            </h2>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              La plupart des grands salons beauté noient l&apos;ongle et le regard au milieu de la
              coiffure, du spa et de la parfumerie. Beauty Profs fait l&apos;inverse : il met ces
              spécialités au centre. Pour une prothésiste ongulaire ou une experte cils et sourcils,
              ça veut dire plus de stands qui te concernent vraiment, et moins de temps perdu.
            </p>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-base text-gray-700"><strong>Prothésistes ongulaires</strong> : gels, capsules, vernis semi-permanents, nail art, et les techniques primées au concours NAILYMPION.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-base text-gray-700"><strong>Spécialistes du regard</strong> : extensions de cils, rehaussement, laminage de sourcils, teinture, avec les Lash &amp; Brow Masters en démonstration.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-base text-gray-700"><strong>Esthéticiennes et instituts</strong> : soins, dermopigmentation, appareils, et de la formation pour ajouter des prestations à ta carte.</span>
              </li>
            </ul>

            <p className="text-base text-gray-700 leading-relaxed">
              Si tu travailles seule ou à domicile, c&apos;est aussi l&apos;occasion de sortir de
              ton salon, de croiser d&apos;autres pros, et de prendre du recul sur ton activité.
            </p>
          </section>

          <section id="temps-forts" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Trophy className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Les temps forts : NAILYMPION, Lash &amp; Brow Masters
            </h2>

            <p className="text-base text-gray-700 leading-relaxed mb-6">
              Au-delà des stands, deux compétitions internationales rythment le salon. Même si tu ne
              concours pas, ce sont des spectacles techniques qui valent à eux seuls le déplacement.
            </p>

            <div className="space-y-4 mb-6">
              <div className="border border-violet-100 rounded-xl p-5">
                <p className="font-bold text-gray-900 mb-2">NAILYMPION France 2026</p>
                <p className="text-sm text-gray-700 leading-relaxed">Une compétition internationale dédiée à l&apos;ongle. Des prothésistes du monde entier s&apos;affrontent sur la technique, le nail art et la créativité. Idéal pour repérer les tendances de la saison avant tout le monde.</p>
              </div>
              <div className="border border-violet-100 rounded-xl p-5">
                <p className="font-bold text-gray-900 mb-2">Lash &amp; Brow Masters</p>
                <p className="text-sm text-gray-700 leading-relaxed">Le pendant pour la beauté du regard : cils et sourcils. Des démonstrations de très haut niveau sur le volume, le mapping, le laminage, pour affiner ton geste et ton sens du détail.</p>
              </div>
              <div className="border border-violet-100 rounded-xl p-5">
                <p className="font-bold text-gray-900 mb-2">Masterclasses et ateliers</p>
                <p className="text-sm text-gray-700 leading-relaxed">Tout au long des deux jours, des formatrices animent des sessions pratiques. C&apos;est souvent là qu&apos;on apprend le plus : une astuce de pose, un produit mieux maîtrisé, une prestation de plus à proposer.</p>
              </div>
            </div>
          </section>

          <section id="raisons" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <GraduationCap className="w-7 h-7 text-violet-600 flex-shrink-0" />
              5 raisons concrètes d&apos;y aller
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-4 p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Voir les tendances avant tes clientes</p>
                  <p className="text-sm text-gray-700">Les couleurs, les formes et les techniques que tu verras en novembre seront demandées dans ton salon dans les mois qui suivent. Tu prends de l&apos;avance.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Tester le matériel en vrai</p>
                  <p className="text-sm text-gray-700">Une lampe, un gel, une pince : rien ne remplace le fait de toucher et d&apos;essayer avant d&apos;acheter. Souvent avec des tarifs salon sur place.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Te former en une journée</p>
                  <p className="text-sm text-gray-700">Une masterclass bien choisie peut t&apos;ouvrir une nouvelle prestation à proposer dès ton retour. Une prestation de plus, c&apos;est un panier moyen plus haut.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm">4</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Rencontrer d&apos;autres pros</p>
                  <p className="text-sm text-gray-700">Quand on travaille seule, on tourne vite en rond. Une journée entre pros qui vivent les mêmes galères, ça remotive et ça donne des idées.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm">5</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Repartir avec de l&apos;inspiration</p>
                  <p className="text-sm text-gray-700">Du contenu à filmer pour ton Instagram, des idées de prestations, une envie de te relancer. L&apos;élan d&apos;un salon, ça se transforme vite en rendez-vous.</p>
                </div>
              </div>
            </div>
          </section>

          <section id="rentabiliser" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Transformer ta visite en nouvelles clientes
            </h2>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              C&apos;est le point que beaucoup de pros oublient. Tu rentres de Beauty Profs gonflée à
              bloc, avec une nouvelle technique et plein d&apos;idées. Mais apprendre une nouvelle
              pose ne sert à rien si ton agenda reste vide derrière. Le vrai retour sur ta journée,
              c&apos;est le nombre de rendez-vous qu&apos;elle te rapporte ensuite.
            </p>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Pour ça, trois réflexes au retour :
            </p>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-base text-gray-700"><strong>Montre</strong> ce que tu as appris. Filme ta première nouvelle pose et poste-la. Pour convertir une abonnée en cliente, vois nos <Link href="/blog/instagram-salon-de-beaute" className="text-violet-700 underline hover:text-violet-900">conseils Instagram pour salon de beauté</Link>.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-base text-gray-700"><strong>Facilite</strong> la réservation. Mets un lien qui ouvre ton agenda en bio, pour que celles qui voient ta nouvelle prestation réservent en 2 minutes, sans te DM.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-base text-gray-700"><strong>Fais revenir</strong> tes clientes. Une <Link href="/blog/carte-fidelite-dematerialisee-salon-beaute" className="text-violet-700 underline hover:text-violet-900">carte de fidélité digitale</Link> récupère leur numéro et te permet de les relancer, sans dépendre de l&apos;algorithme.</span>
              </li>
            </ul>

            <p className="text-base text-gray-700 leading-relaxed">
              C&apos;est exactement le rôle de Qarte : une vitrine à ton nom, la réservation en ligne
              sans commission et la carte de fidélité qui se crée toute seule. Tu montes en
              compétence à Beauty Profs, tu remplis ton agenda avec Qarte.
            </p>
          </section>

          <section id="infos-pratiques" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <MapPin className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Infos pratiques (dates, lieu, billetterie)
            </h2>

            <div className="overflow-x-auto mb-6 -mx-6 sm:mx-0">
              <div className="min-w-[480px] px-6 sm:px-0">
                <table className="w-full border-collapse text-sm">
                  <tbody className="text-gray-700">
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-3 font-semibold w-1/3">Dates</td>
                      <td className="py-3 px-3">14 et 15 novembre 2026</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-3 font-semibold">Lieu</td>
                      <td className="py-3 px-3">Parc Chanot, Marseille</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-3 font-semibold">Public</td>
                      <td className="py-3 px-3">Professionnels de l&apos;esthétique (badge pro)</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-3 font-semibold">Temps forts</td>
                      <td className="py-3 px-3">NAILYMPION France, Lash &amp; Brow Masters, masterclasses</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-semibold">Billetterie</td>
                      <td className="py-3 px-3">Sur le site officiel beauty-profs.com</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="text-sm text-amber-900 leading-relaxed">
                <strong>Avant de te déplacer :</strong> les horaires précis et les tarifs d&apos;entrée
                évoluent selon l&apos;édition. Vérifie-les directement sur la billetterie du{' '}
                <a href="https://beauty-profs.com" target="_blank" rel="noopener noreferrer" className="text-amber-900 underline font-semibold">site officiel Beauty Profs</a>, et réserve ton badge à l&apos;avance.
              </p>
            </div>
          </section>

          <section id="faq" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Quand et où a lieu Beauty Profs 2026 ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">Beauty Profs 2026 a lieu les 14 et 15 novembre 2026, au Parc Chanot à Marseille. La billetterie et les horaires à jour sont sur le site officiel beauty-profs.com.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Beauty Profs, c&apos;est pour quels métiers de la beauté ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">Surtout l&apos;esthétique : prothésistes ongulaires, spécialistes des cils et sourcils, esthéticiennes, instituts, dermopigmentation, ainsi que les formatrices. Si tu travailles l&apos;ongle ou le regard, c&apos;est l&apos;un des salons les plus ciblés pour toi en France.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Combien coûte l&apos;entrée à Beauty Profs ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">L&apos;entrée se réserve via la billetterie sur le site officiel beauty-profs.com (badge professionnel). Les tarifs et horaires exacts évoluent selon l&apos;édition, vérifie-les directement sur leur billetterie avant de te déplacer.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Qu&apos;est-ce que NAILYMPION et les Lash &amp; Brow Masters ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">Ce sont deux compétitions internationales organisées pendant le salon : NAILYMPION France 2026 pour l&apos;ongle, et les Lash &amp; Brow Masters pour les cils et sourcils. Même sans concourir, ce sont des démonstrations de très haut niveau pour progresser et trouver de l&apos;inspiration.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Comment rentabiliser une journée passée à Beauty Profs ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">Repars avec 2 ou 3 techniques applicables tout de suite, le contact des fournisseurs utiles, et surtout un plan pour remplir ton agenda derrière. Apprendre une nouvelle pose ne sert à rien si ton agenda reste vide : une vitrine en ligne, la réservation directe et une carte de fidélité transforment ces nouvelles compétences en rendez-vous réguliers.</p>
              </div>
            </div>
          </section>

          <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
            <Sparkles className="w-10 h-10 mx-auto mb-4 opacity-90" />
            <h3 className="text-xl sm:text-2xl font-bold mb-3">
              Reviens de Marseille avec un agenda qui se remplit tout seul
            </h3>
            <p className="text-violet-100 mb-6 max-w-xl mx-auto">
              Vitrine à ton nom, réservation en ligne sans commission, carte de fidélité automatique.
              Tu montes en compétence au salon, Qarte remplit ton agenda le reste de l&apos;année.
            </p>
            <Link
              href="/auth/merchant/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-violet-700 font-bold rounded-2xl hover:bg-violet-50 transition-colors"
            >
              Créer ma page beauté gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-xs text-violet-100 mt-4 opacity-80">
              Sans carte bancaire · Prêt en 5 min · 3 jours d&apos;essai gratuit
            </p>
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
