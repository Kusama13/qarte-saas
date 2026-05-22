'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  BookOpen,
  Home,
  MapPin,
  Route,
  Lock,
  CheckCircle2,
  Ban,
} from 'lucide-react';
import { FacebookPixel } from '@/components/analytics/FacebookPixel';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const tocItems = [
  { id: 'pourquoi-cest-dur', label: 'Pourquoi gérer du domicile, c\'est plus dur qu\'en salon' },
  { id: 'rayon', label: 'Ton rayon d\'intervention en 1 clic' },
  { id: 'trajets', label: 'Tes trajets calculés tout seuls' },
  { id: 'hors-zone', label: 'Tes clientes savent tout de suite si tu te déplaces chez elles' },
  { id: 'vitrine-privee', label: 'Ton adresse perso reste privée' },
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
          name: 'Service à domicile : comment caler tes RDV sans courir d\'une cliente à l\'autre',
          item: 'https://getqarte.com/blog/service-domicile-salon-beaute-rayon-trajets',
        },
      ],
    },
    {
      '@type': 'Article',
      headline: 'Service à domicile : comment caler tes RDV sans courir d\'une cliente à l\'autre',
      description:
        'Rayon d\'intervention configurable, calcul auto des trajets entre RDV, message hors-zone, adresse perso masquée : tout ce que Qarte fait pour les pros mobiles (esthéticiennes, prothésistes ongulaires, coiffeuses à domicile).',
      image: {
        '@type': 'ImageObject',
        url: 'https://getqarte.com/blog/social/article-7-cover.png',
        width: 1080,
        height: 1080,
      },
      datePublished: '2026-05-22T08:00:00+02:00',
      dateModified: '2026-05-22T08:00:00+02:00',
      author: { '@type': 'Organization', name: 'Qarte', url: 'https://getqarte.com' },
      publisher: {
        '@type': 'Organization',
        name: 'Qarte',
        logo: { '@type': 'ImageObject', url: 'https://getqarte.com/logo.png' },
      },
      mainEntityOfPage: 'https://getqarte.com/blog/service-domicile-salon-beaute-rayon-trajets',
      articleSection: 'Service à domicile',
      inLanguage: 'fr-FR',
      keywords: [
        'service à domicile beauté',
        'esthéticienne à domicile logiciel',
        'prothésiste ongulaire mobile',
        'coiffeuse à domicile',
        'rayon intervention beauté',
        'calcul trajet RDV',
      ],
      mentions: [
        { '@type': 'Thing', name: 'Esthétique à domicile' },
        { '@type': 'Thing', name: 'Prothésiste ongulaire mobile' },
        { '@type': 'Thing', name: 'Coiffure à domicile' },
      ],
    },
    {
      '@type': 'FAQPage',
      inLanguage: 'fr-FR',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Est-ce que je peux limiter mes déplacements à un certain rayon avec Qarte ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui. Tu règles ton rayon d\'intervention en kilomètres (10, 15, 20, 30, 50 km ou une valeur personnalisée jusqu\'à 200 km). Toute cliente qui saisit une adresse hors zone voit un message clair et ne peut pas réserver. Tu peux aussi choisir « Pas de limite » si tu te déplaces partout (on garde quand même un plafond automatique sur la durée du trajet).',
          },
        },
        {
          '@type': 'Question',
          name: 'Comment Qarte calcule mes trajets entre deux RDV à domicile ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Quand une cliente saisit son adresse à la réservation, Qarte calcule l\'itinéraire depuis ta cliente précédente et n\'affiche que les créneaux réellement atteignables. Tu peux ajouter une marge de quelques minutes (5, 10 ou 15) pour le parking, le déchargement ou un petit retard.',
          },
        },
        {
          '@type': 'Question',
          name: 'Mes clientes voient-elles mon adresse personnelle sur ma page Qarte ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Non. Dès que tu actives le mode service à domicile, l\'option « masquer mon adresse » est proposée par défaut. Seule la ville reste visible (utile pour le référencement local), pas l\'adresse complète.',
          },
        },
        {
          '@type': 'Question',
          name: 'Est-ce que Planity ou Booksy gèrent le service à domicile comme Qarte ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Pas de la même façon. Planity et Booksy n\'ont pas de mode service à domicile dédié : ni rayon d\'intervention, ni calcul de trajet entre RDV, ni option pour masquer ton adresse perso. Treatwell propose une recherche par zone côté cliente mais ne calcule rien pour toi. Chez Qarte, tout est inclus dans le forfait (24 € par mois).',
          },
        },
        {
          '@type': 'Question',
          name: 'Ça marche pour les esthéticiennes, prothésistes ongulaires, coiffeuses, masseuses à domicile ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui, le mode service à domicile fonctionne pour tous les métiers de la beauté qui se déplacent. Tu peux aussi faire les deux : recevoir certaines clientes en salon et te déplacer chez d\'autres.',
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
                <span className="text-gray-600">Service à domicile</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="inline-flex px-3 py-1 bg-violet-50 text-violet-700 text-xs font-semibold rounded-full">
                  Service à domicile
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />5 min de lecture
                </span>
                <span className="text-sm text-gray-400">Publié le 22 mai 2026</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                Service à domicile : comment caler tes RDV sans courir d&apos;une cliente à l&apos;autre
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                Si tu te déplaces chez tes clientes, ton vrai casse-tête n&apos;est ni la fidélisation
                ni la vitrine. C&apos;est <strong>la gestion de tes trajets</strong>. Une cliente qui
                réserve à 14h alors que ta précédente finit à 13h45 à l&apos;autre bout de la ville,
                et tu manges en voiture, tu arrives en retard, et la suivante t&apos;attend en bas
                de l&apos;immeuble. Un trajet mal calé, c&apos;est facilement 2 RDV perdus dans la
                journée, soit ~120 € qui s&apos;envolent. Qarte gère tout ça pour toi.
              </p>
            </motion.div>

            <div className="mt-8 rounded-2xl overflow-hidden">
              <Image
                src="/blog/social/article-7-cover.png"
                alt="Esthéticienne à domicile préparant son kit beauté avant un rendez-vous client"
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
          {/* TL;DR */}
          <div className="mb-12 bg-violet-50 border-l-4 border-violet-600 p-6 rounded-r-xl">
            <p className="text-sm font-bold text-violet-900 mb-2">L&apos;essentiel en 30 secondes</p>
            <p className="text-base text-gray-700 leading-relaxed">
              Qarte gère le mode <strong>service à domicile</strong> de bout en bout : tu choisis ton{' '}
              <strong>rayon d&apos;intervention</strong>, on calcule <strong>les trajets entre tes RDV</strong>{' '}
              pour ne te proposer que des créneaux atteignables, on prévient les clientes{' '}
              <strong>hors zone</strong> avant même qu&apos;elles essaient de réserver, et ton{' '}
              <strong>adresse perso reste masquée</strong> sur ta vitrine publique. Tout est inclus
              dans le forfait, rien à payer en plus.
            </p>
          </div>

          {/* Section 1 */}
          <section id="pourquoi-cest-dur" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Home className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Pourquoi gérer du domicile, c&apos;est plus dur qu&apos;en salon
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              En salon, ton agenda est simple : une cliente sort, une autre entre. Tu n&apos;as
              qu&apos;une chose qui change, la durée du soin.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Quand tu te déplaces, tu ajoutes 3 trucs à gérer en plus : <strong>le trajet aller</strong>,{' '}
              <strong>le trajet retour</strong> (ou vers la cliente suivante), et <strong>les aléas</strong>{' '}
              (parking, déchargement, retard d&apos;une cliente). Multiplie ça par 5 RDV dans la
              journée et tu obtiens un planning impossible à tenir.
            </p>
            <p className="text-base text-gray-700 leading-relaxed">
              La plupart des logiciels de résa traitent ce cas comme un cas spécial. <strong>Planity et
              Booksy</strong> ignorent les trajets et te laissent les caler à la main. <strong>Treatwell</strong>{' '}
              propose une recherche par zone à la cliente mais ne calcule rien pour toi. Chez Qarte,
              tout est inclus dans le forfait à 24 € par mois, et c&apos;est automatique.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mt-4">
              Si tu veux aussi sécuriser tes RDV avec un acompte (et arrêter les no-show), on a
              écrit un article dédié à <Link href="/blog/acompte-rdv-salon-sans-commission" className="text-violet-700 underline hover:text-violet-900">l&apos;acompte de RDV en salon sans commission</Link> qui s&apos;applique pareil au mode mobile.
            </p>
          </section>

          {/* Section 2 */}
          <section id="rayon" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <MapPin className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Ton rayon d&apos;intervention en 1 clic
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-6">
              Dans tes paramètres planning, tu mets en marche le mode service à domicile et tu
              choisis jusqu&apos;où tu te déplaces. De 10 km pour le quartier à 50 km pour la grande
              couronne, tu trouves forcément ton réglage :
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {['10 km', '15 km', '20 km', '30 km', '50 km', 'Pas de limite'].map((label) => (
                <div
                  key={label}
                  className="text-center px-4 py-3 bg-violet-50 border border-violet-100 rounded-xl text-sm font-semibold text-violet-700"
                >
                  {label}
                </div>
              ))}
            </div>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Tu peux aussi saisir une valeur personnalisée (jusqu&apos;à 200 km si tu fais beaucoup
              de route). Si tu ne veux pas mettre de limite stricte, on garde quand même un plafond
              automatique sur la durée du trajet pour t&apos;éviter de te retrouver coincée à 1h30
              de chez toi sans même t&apos;en rendre compte au moment de réserver.
            </p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
              <p className="text-sm text-emerald-900 leading-relaxed">
                <strong>Réglable à tout moment.</strong> Si tu testes 30 km le mois prochain et que
                ça t&apos;épuise, tu repasses à 15 km en 2 secondes. Tu n&apos;as rien à refaire.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section id="trajets" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Route className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Tes trajets calculés tout seuls
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Quand une cliente saisit son adresse pour réserver, Qarte fait 3 choses en
              moins d&apos;une seconde :
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-4 p-5 border border-violet-100 bg-violet-50/50 rounded-xl">
                <span className="flex-shrink-0 w-8 h-8 bg-violet-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Calcul du trajet depuis ton dernier RDV</p>
                  <p className="text-sm text-gray-600">Si tu as une cliente à 11h à Bagnolet, on calcule le trajet jusqu&apos;à la nouvelle adresse à partir de 11h45 (fin du RDV + ta marge).</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 border border-violet-100 bg-violet-50/50 rounded-xl">
                <span className="flex-shrink-0 w-8 h-8 bg-violet-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Filtre des créneaux atteignables</p>
                  <p className="text-sm text-gray-600">On ne propose à la cliente que les horaires où tu peux réellement arriver à temps. Si ton trajet fait 35 minutes, le créneau de 12h disparaît automatiquement.</p>
                </div>
              </div>
            </div>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Et après ? Tu déplaces un RDV à 16h, tous les trajets de la journée sont recalculés.
              Tu reçois une annulation, pareil. Tu ne touches à rien.
            </p>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Sur la fiche de chaque RDV à domicile, tu retrouves : <strong>l&apos;adresse complète
              de la cliente</strong>, <strong>la durée estimée du trajet</strong> depuis ta cliente
              précédente, <strong>l&apos;heure de départ recommandée</strong> et un{' '}
              <strong>lien Maps direct</strong>. Plus besoin de jongler entre 3 applis le matin.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="text-sm text-amber-900 leading-relaxed">
                <strong>Tu peux ajouter une marge</strong> (5, 10 ou 15 min) en plus du trajet calculé,
                pour absorber le parking, le déchargement du matériel, ou un petit retard. C&apos;est
                ce qui fait la différence entre une journée fluide et une journée à courir.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section id="hors-zone" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Ban className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Tes clientes savent tout de suite si tu te déplaces chez elles
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Sur ta vitrine publique, un badge <strong>« À domicile · jusqu&apos;à X km »</strong>{' '}
              s&apos;affiche sous ton nom, aux couleurs de ton salon. La cliente sait au premier
              coup d&apos;œil qu&apos;elle peut te faire venir chez elle.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-6">
              Et si elle saisit une adresse trop éloignée pour réserver, elle voit un message clair :
            </p>

            <blockquote cite="https://getqarte.com" className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6 italic">
              <p className="text-sm text-red-900 leading-relaxed">
                « Ce salon se déplace dans un rayon de 15 km. Votre adresse est à environ 22 km.
                Contactez-le directement sur ses réseaux pour voir s&apos;il peut faire une
                exception. »
              </p>
            </blockquote>

            <p className="text-base text-gray-700 leading-relaxed">
              Pas de réservation à l&apos;aveugle qui te tombe dessus à l&apos;autre bout du
              département, pas de mauvaise surprise. La cliente sait qu&apos;elle est trop loin,
              elle peut t&apos;écrire directement si elle veut négocier. Et si c&apos;est pas
              jouable, c&apos;est pas jouable.
            </p>
          </section>

          {/* Section 5 */}
          <section id="vitrine-privee" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Lock className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Ton adresse perso reste privée
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Quand tu actives le mode service à domicile, on propose par défaut de{' '}
              <strong>masquer ton adresse</strong> sur ta page publique. Seule <strong>ta ville</strong>{' '}
              reste affichée (utile pour que Google sache où tu travailles et que les clientes du
              coin te trouvent), mais pas le numéro de rue.
            </p>

            <p className="text-base text-gray-700 leading-relaxed mb-6">
              Planity, Booksy et Treatwell affichent l&apos;adresse exacte du salon par défaut.
              Utile si tu as une boutique, problématique si tu reçois ou travailles depuis chez toi.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-gray-800">
                  Tes clientes savent que tu te déplaces dans leur zone
                </p>
              </div>
              <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-gray-800">
                  Personne ne connaît ton adresse personnelle
                </p>
              </div>
            </div>

            <p className="text-base text-gray-700 leading-relaxed">
              Si tu as un local commercial même quand tu te déplaces, tu peux évidemment laisser
              l&apos;adresse visible. Mais pour les pros qui travaillent depuis chez elles, c&apos;est
              une protection qu&apos;on a tendance à oublier. Jusqu&apos;à ce qu&apos;un voisin
              chiant, un ex-conjoint ou un client trop insistant sonne à ta porte.
            </p>
          </section>

          {/* FAQ */}
          <section id="faq" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Est-ce que je peux limiter mes déplacements à un certain rayon avec Qarte ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Oui. Tu règles ton rayon d&apos;intervention en kilomètres (10, 15, 20, 30, 50 km
                  ou une valeur personnalisée jusqu&apos;à 200 km). Toute cliente qui saisit une
                  adresse hors zone voit un message clair et ne peut pas réserver. Tu peux aussi
                  choisir « Pas de limite » si tu te déplaces partout (on garde quand même un
                  plafond automatique sur la durée du trajet).
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Comment Qarte calcule mes trajets entre deux RDV à domicile ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Quand une cliente saisit son adresse à la réservation, on calcule l&apos;itinéraire
                  depuis ta cliente précédente et on n&apos;affiche que les créneaux réellement
                  atteignables. Tu peux ajouter une marge de quelques minutes (5, 10 ou 15) pour
                  le parking, le déchargement ou un petit retard.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Mes clientes voient-elles mon adresse personnelle sur ma page Qarte ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Non. Dès que tu actives le mode service à domicile, l&apos;option « masquer mon
                  adresse » est proposée par défaut. Seule la ville reste visible (utile pour le
                  référencement local), pas l&apos;adresse complète.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Est-ce que Planity ou Booksy gèrent le service à domicile comme Qarte ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Pas de la même façon. Planity et Booksy n&apos;ont pas de mode service à domicile
                  dédié : ni rayon d&apos;intervention, ni calcul de trajet entre RDV, ni option
                  pour masquer ton adresse perso. Treatwell propose une recherche par zone côté
                  cliente mais ne calcule rien pour toi. Chez Qarte, tout est inclus dans le
                  forfait à 24 € par mois.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Ça marche pour les esthéticiennes, prothésistes ongulaires, coiffeuses, masseuses à
                  domicile ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Oui, le mode service à domicile fonctionne pour tous les métiers de la beauté qui
                  se déplacent. Tu peux aussi faire les deux : recevoir certaines clientes en salon
                  et te déplacer chez d&apos;autres.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
            <Home className="w-10 h-10 mx-auto mb-4 opacity-90" />
            <h3 className="text-xl sm:text-2xl font-bold mb-3">
              Lance ton activité à domicile sans courir
            </h3>
            <p className="text-violet-100 mb-6 max-w-xl mx-auto">
              Rayon réglable, trajets calculés tout seuls, vitrine publique privée. Tout est inclus
              dans le forfait, rien à payer en plus.
            </p>
            <Link
              href="/auth/merchant/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-violet-700 font-bold rounded-2xl hover:bg-violet-50 transition-colors"
            >
              Tester Qarte gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-xs text-violet-100 mt-4 opacity-80">
              Sans carte bancaire · Prêt en 5 min · 7 jours d&apos;essai gratuit
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
