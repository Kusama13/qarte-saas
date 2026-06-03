'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  BookOpen,
  Instagram,
  Heart,
  Camera,
  Link2,
  CalendarCheck,
  AlertTriangle,
  TrendingUp,
  Check,
} from 'lucide-react';
import { FacebookPixel } from '@/components/analytics/FacebookPixel';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const tocItems = [
  { id: 'pourquoi-abonnees-pas-clientes', label: 'Pourquoi tes abonnées ne deviennent pas clientes' },
  { id: 'tunnel-abonnee-cliente', label: 'Le tunnel abonnée vers cliente en 4 temps' },
  { id: 'quoi-poster', label: '7 idées de contenu qui amènent des rendez-vous' },
  { id: 'lien-en-bio', label: 'Le lien en bio qui transforme (et l\'erreur qui coûte cher)' },
  { id: 'convertir-en-rdv', label: 'Convertir une abonnée en rendez-vous, puis en habituée' },
  { id: 'erreurs', label: '5 erreurs qui te font perdre des clientes' },
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
          name: 'Instagram pour salon de beauté : transformer tes abonnées en clientes',
          item: 'https://getqarte.com/blog/instagram-salon-de-beaute',
        },
      ],
    },
    {
      '@type': 'Article',
      headline: 'Instagram pour salon de beauté : transformer tes abonnées en clientes',
      description:
        'Instagram pour salon de beauté : la méthode pour transformer tes abonnées en vraies clientes. 7 idées de contenu, le bon lien en bio, et comment convertir un like en rendez-vous.',
      image: {
        '@type': 'ImageObject',
        url: 'https://getqarte.com/blog/social/article-11-cover.png',
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
      mainEntityOfPage: 'https://getqarte.com/blog/instagram-salon-de-beaute',
      articleSection: 'Réseaux sociaux',
      inLanguage: 'fr-FR',
      keywords: [
        'instagram salon de beauté',
        'instagram salon de coiffure',
        'instagram esthéticienne',
        'réseaux sociaux salon de beauté',
        'idées posts instagram coiffure',
        'lien en bio instagram salon',
      ],
      mentions: [
        { '@type': 'Thing', name: 'Instagram' },
        { '@type': 'Thing', name: 'Marketing salon de beauté' },
      ],
    },
    {
      '@type': 'FAQPage',
      inLanguage: 'fr-FR',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Combien de fois par semaine faut-il poster sur Instagram pour un salon de beauté ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Vise 3 publications par semaine (feed ou Reels) plus des Stories quasi quotidiennes. La régularité compte plus que la quantité : mieux vaut 3 posts soignés chaque semaine pendant 6 mois qu\'une rafale de 10 puis plus rien. Les Stories servent à montrer tes créneaux libres de la semaine et à rappeler qu\'on peut réserver.',
          },
        },
        {
          '@type': 'Question',
          name: 'Faut-il payer de la publicité Instagram pour remplir son salon ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Non, pas au début. Pour un salon de quartier, le bouche-à-oreille local, les avant/après et un lien en bio qui mène droit à la réservation suffisent à remplir l\'agenda. La pub peut accélérer une fois que ton compte convertit déjà, mais elle ne répare pas un tunnel cassé (joli feed sans moyen de réserver).',
          },
        },
        {
          '@type': 'Question',
          name: 'Quel lien mettre en bio Instagram quand on a un salon de beauté ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Mets le lien de ta propre page (ta vitrine) qui regroupe tes prestations, tes horaires, tes réseaux et un bouton pour réserver directement. Évite d\'envoyer tes abonnées sur Planity ou Booksy : sur ces plateformes, ta cliente voit aussi les salons concurrents et ne t\'appartient plus. Ton lien doit ramener chez toi, pas vers un annuaire.',
          },
        },
        {
          '@type': 'Question',
          name: 'Les Reels sont-ils plus efficaces que les photos pour la beauté ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui, en général. Les Reels (avant/après en accéléré, transformations, gestes techniques) touchent beaucoup plus de personnes qui ne te suivent pas encore, donc ils amènent de nouvelles abonnées. Garde les photos pour montrer le détail d\'un résultat. L\'idéal : un mix Reels pour la portée, photos pour la précision, Stories pour l\'appel à réserver.',
          },
        },
        {
          '@type': 'Question',
          name: 'Comment transformer une abonnée qui "like" en vraie cliente ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Une abonnée devient cliente quand le chemin entre le like et le rendez-vous est court : un lien en bio qui ouvre ta page, un bouton Réserver visible, et une réservation possible en 2 minutes sans te DM. Ensuite, sa carte de fidélité se crée automatiquement à la réservation, tu récupères son numéro, et tu peux la faire revenir (anniversaire, relance) sans dépendre de l\'algorithme.',
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
                <span className="text-gray-600">Réseaux sociaux</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="inline-flex px-3 py-1 bg-violet-50 text-violet-700 text-xs font-semibold rounded-full">
                  Réseaux sociaux
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />9 min de lecture
                </span>
                <span className="text-sm text-gray-400">Publié le 3 juin 2026</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                Instagram pour salon de beauté : transformer tes abonnées en clientes
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                Tu postes, tu as des likes, des partages, des « trop beau&nbsp;! » en commentaire,
                et pourtant ton agenda n&apos;est pas plein. Le problème n&apos;est presque jamais ton
                contenu. C&apos;est le <strong>chemin entre le like et le rendez-vous</strong>. Tes
                abonnées t&apos;admirent, mais rien ne les pousse à réserver, et ton lien en bio les
                envoie souvent chez la concurrente. Voici la méthode pour transformer une abonnée en
                vraie cliente, puis en habituée.
              </p>
            </motion.div>

            <div className="mt-8 rounded-2xl overflow-hidden">
              <Image
                src="/blog/social/article-11-cover.png"
                alt="Coiffeuse photographiant un résultat de coloration avec son smartphone pour Instagram dans son salon de beauté"
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
              Instagram t&apos;apporte de l&apos;attention, pas des clientes. Pour transformer une
              abonnée en cliente, il faut un <strong>tunnel court</strong>&nbsp;: du contenu qui
              donne envie (avant/après, Reels, coulisses), un <strong>lien en bio qui mène à ta
              propre page</strong> et pas vers Planity ou Booksy, une réservation possible en 2
              minutes sans te DM, et une carte de fidélité qui se crée toute seule au rendez-vous
              pour la faire revenir. Le contenu attire&nbsp;; c&apos;est le reste qui convertit.
            </p>
          </div>

          <section id="pourquoi-abonnees-pas-clientes" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <AlertTriangle className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Pourquoi tes abonnées ne deviennent pas clientes
            </h2>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Avoir des abonnées et avoir un agenda plein, ce sont deux choses différentes. Instagram
              compte plus de 2 milliards d&apos;utilisateurs par mois, 90&nbsp;% suivent au moins une
              entreprise et 83&nbsp;% disent y découvrir de nouveaux produits ou services (chiffres
              Instagram). La beauté est l&apos;une des catégories les plus regardées. Donc
              l&apos;attention, tu peux l&apos;avoir. Le souci est ailleurs.
            </p>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Quand une abonnée admire ton travail mais ne réserve jamais, il y a presque toujours
              une de ces trois fuites&nbsp;:
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-4 p-5 bg-red-50 border border-red-100 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Tu ne demandes jamais de réserver</p>
                  <p className="text-sm text-gray-700">Tu postes du beau, mais aucun de tes posts ne dit clairement « il me reste 3 créneaux jeudi, réserve ici ». Sans appel à l&apos;action, l&apos;abonnée admire et passe au post suivant.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 bg-red-50 border border-red-100 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Ton lien en bio l&apos;envoie ailleurs</p>
                  <p className="text-sm text-gray-700">Si ta bio pointe vers Planity ou Booksy, ta cliente arrive sur un annuaire où elle voit aussi les salons d&apos;à côté. Tu as fait le travail d&apos;attirer, un autre encaisse.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 bg-red-50 border border-red-100 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Réserver te demande un effort à elle</p>
                  <p className="text-sm text-gray-700">Si la seule façon de prendre RDV est de t&apos;envoyer un DM et d&apos;attendre ta réponse, tu perds toutes celles qui te découvrent à 22h, le dimanche, ou qui n&apos;osent pas écrire. La friction tue la réservation.</p>
                </div>
              </div>
            </div>

            <p className="text-base text-gray-700 leading-relaxed">
              Autrement dit&nbsp;: ton contenu fait son travail, c&apos;est le tunnel derrière qui
              fuit. La bonne nouvelle, c&apos;est que ce tunnel se répare en quelques réglages.
            </p>
          </section>

          <section id="tunnel-abonnee-cliente" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Le tunnel abonnée vers cliente en 4 temps
            </h2>

            <p className="text-base text-gray-700 leading-relaxed mb-6">
              Une abonnée ne devient pas cliente par hasard. Elle passe par 4 étapes, et chacune a
              son rôle. Si une seule manque, tout le reste fuit.
            </p>

            <div className="space-y-5 mb-6">
              <div className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center font-bold text-lg">1</div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 mb-1">Attirer</p>
                  <p className="text-sm text-gray-700 leading-relaxed">Du contenu qui touche des gens qui ne te suivent pas encore (Reels avant/après, transformations). Objectif&nbsp;: de nouvelles abonnées dans ta zone.</p>
                </div>
              </div>
              <div className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center font-bold text-lg">2</div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 mb-1">Donner confiance</p>
                  <p className="text-sm text-gray-700 leading-relaxed">De la régularité, des résultats réels, des témoignages, ton visage. Une abonnée réserve chez quelqu&apos;un qu&apos;elle a l&apos;impression de connaître un peu.</p>
                </div>
              </div>
              <div className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center font-bold text-lg">3</div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 mb-1">Convertir</p>
                  <p className="text-sm text-gray-700 leading-relaxed">Le lien en bio ouvre ta page, le bouton « Réserver » est visible, elle choisit son créneau en 2 minutes. C&apos;est l&apos;étape que presque tout le monde rate.</p>
                </div>
              </div>
              <div className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center font-bold text-lg">4</div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 mb-1">Fidéliser</p>
                  <p className="text-sm text-gray-700 leading-relaxed">Sa carte de fidélité se crée au rendez-vous, tu récupères son numéro, tu peux la faire revenir sans dépendre de l&apos;algorithme (SMS anniversaire, relance après 30 jours).</p>
                </div>
              </div>
            </div>

            <p className="text-base text-gray-700 leading-relaxed">
              La plupart des pros travaillent uniquement l&apos;étape 1 (poster, poster, poster) et
              négligent les 3 autres. C&apos;est pour ça qu&apos;elles ont des abonnées mais pas de
              clientes. Les sections qui suivent traitent chaque étape.
            </p>
          </section>

          <section id="quoi-poster" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Camera className="w-7 h-7 text-violet-600 flex-shrink-0" />
              7 idées de contenu qui amènent des rendez-vous
            </h2>

            <p className="text-base text-gray-700 leading-relaxed mb-6">
              Toutes les publications ne se valent pas. Voici 7 formats qui marchent en beauté,
              chacun avec sa raison d&apos;amener des RDV. Mélange-les sur la semaine.
            </p>

            <div className="space-y-5 mb-6">
              <div className="border border-violet-100 rounded-xl p-5">
                <p className="font-bold text-gray-900 mb-2">1. L&apos;avant/après</p>
                <p className="text-sm text-gray-700 leading-relaxed">Le contenu le plus puissant en beauté. Une coloration ratée rattrapée, une pose d&apos;ongles, un teint sublimé. Le cerveau adore le contraste. C&apos;est ce qui se partage et se sauvegarde le plus.</p>
              </div>
              <div className="border border-violet-100 rounded-xl p-5">
                <p className="font-bold text-gray-900 mb-2">2. Le Reel transformation en accéléré</p>
                <p className="text-sm text-gray-700 leading-relaxed">Le geste filmé de A à Z, monté en 15 à 30 secondes. C&apos;est le format qui touche le plus de gens qui ne te suivent pas encore, donc celui qui amène de nouvelles abonnées locales.</p>
              </div>
              <div className="border border-violet-100 rounded-xl p-5">
                <p className="font-bold text-gray-900 mb-2">3. Les coulisses</p>
                <p className="text-sm text-gray-700 leading-relaxed">Ton salon le matin, ta préparation, ta playlist, ton chat qui dort sur le fauteuil. Ça humanise. Une cliente réserve chez une personne, pas chez un logo.</p>
              </div>
              <div className="border border-violet-100 rounded-xl p-5">
                <p className="font-bold text-gray-900 mb-2">4. Le témoignage cliente</p>
                <p className="text-sm text-gray-700 leading-relaxed">Une cliente ravie, une capture de son message, un résultat qu&apos;elle adore. La preuve par les autres lève les doutes mieux que tout ce que tu peux dire de toi-même.</p>
              </div>
              <div className="border border-violet-100 rounded-xl p-5">
                <p className="font-bold text-gray-900 mb-2">5. Le conseil d&apos;experte</p>
                <p className="text-sm text-gray-700 leading-relaxed">Comment entretenir sa couleur, espacer ses retouches, prendre soin de ses ongles. Tu montres ton expertise, tu deviens la référence dans sa tête pour le jour où elle réserve.</p>
              </div>
              <div className="border border-violet-100 rounded-xl p-5">
                <p className="font-bold text-gray-900 mb-2">6. Tes prestations et tes prix, assumés</p>
                <p className="text-sm text-gray-700 leading-relaxed">Un post clair « voici mes prestations, voici les tarifs, voici comment réserver ». On a peur de paraître commercial, mais une abonnée qui ne connaît pas tes prix n&apos;ose souvent pas franchir le pas.</p>
              </div>
              <div className="border border-violet-100 rounded-xl p-5">
                <p className="font-bold text-gray-900 mb-2">7. La Story « créneaux de la semaine »</p>
                <p className="text-sm text-gray-700 leading-relaxed">Le format le plus direct&nbsp;: « il me reste 2 créneaux vendredi, lien en bio pour réserver ». Affiché en Story, c&apos;est un rappel régulier qu&apos;on peut prendre RDV maintenant.</p>
              </div>
            </div>

            <div className="bg-violet-50 border border-violet-200 rounded-xl p-5">
              <p className="text-sm text-violet-900 leading-relaxed">
                <strong>La règle d&apos;or&nbsp;:</strong> chaque semaine, au moins un contenu doit
                contenir un appel clair à réserver. Le reste peut séduire ou informer, mais sans
                jamais demander de réserver, tu collectionnes des abonnées au lieu de remplir ton
                agenda. Pour aller plus loin sur l&apos;acquisition, vois aussi nos{' '}
                <Link href="/blog/comment-attirer-clientes-salon-beaute" className="text-violet-700 underline hover:text-violet-900">12 stratégies pour attirer plus de clientes</Link>.
              </p>
            </div>
          </section>

          <section id="lien-en-bio" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Link2 className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Le lien en bio qui transforme (et l&apos;erreur qui coûte cher)
            </h2>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              C&apos;est le maillon n°1 de la conversion, et celui que presque tout le monde rate.
              Sur Instagram, le seul lien cliquable, c&apos;est celui de ta bio. Tout le contenu que
              tu produis converge vers ce lien. La question est&nbsp;: où mène-t-il&nbsp;?
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-4 p-5 bg-red-50 border border-red-100 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">L&apos;erreur&nbsp;: un lien Planity ou Booksy</p>
                  <p className="text-sm text-gray-700">Tu envoies tes abonnées sur un annuaire où elles voient aussi les salons concurrents, mieux notés ou moins chers. Tu as payé l&apos;effort d&apos;attirer, la plateforme récupère la cliente. C&apos;est l&apos;erreur la plus fréquente, on lui consacre un article entier&nbsp;: <Link href="/blog/ne-pas-mettre-lien-planity-bio-instagram" className="text-violet-700 underline hover:text-violet-900">pourquoi ne pas mettre ton lien Planity en bio Instagram</Link>.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">La bonne version&nbsp;: ta propre page</p>
                  <p className="text-sm text-gray-700">Un lien vers ta vitrine à toi, qui regroupe tes prestations, tes horaires, tes réseaux, et un bouton « Réserver » qui ouvre ton agenda. Pas de concurrente affichée, pas d&apos;intermédiaire, pas de commission. Le lien ramène chez toi, point.</p>
                </div>
              </div>
            </div>

            <p className="text-base text-gray-700 leading-relaxed">
              C&apos;est tout l&apos;intérêt d&apos;une vitrine comme celle de Qarte&nbsp;: une seule
              page propre, à ton nom, que tu mets en bio. Tes abonnées y trouvent tout, réservent en
              direct, et restent <strong>tes</strong> clientes. C&apos;est aussi la raison pour
              laquelle <Link href="/blog/clients-planity-booksy-ne-reviennent-jamais" className="text-violet-700 underline hover:text-violet-900">les clientes venues de Planity ou Booksy ne reviennent jamais</Link>&nbsp;:
              elles n&apos;étaient pas à toi au départ.
            </p>
          </section>

          <section id="convertir-en-rdv" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <CalendarCheck className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Convertir une abonnée en rendez-vous, puis en habituée
            </h2>

            <p className="text-base text-gray-700 leading-relaxed mb-6">
              Une fois le bon lien en place, voilà ce qui se passe quand une abonnée décide de
              franchir le pas, et pourquoi elle ne te quitte plus ensuite&nbsp;:
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div className="text-center p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-3xl font-extrabold text-emerald-700 mb-1">24h/24</p>
                <p className="text-sm font-medium text-gray-800 leading-snug">elle réserve seule, même la nuit ou le dimanche</p>
              </div>
              <div className="text-center p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-3xl font-extrabold text-emerald-700 mb-1">0&nbsp;%</p>
                <p className="text-sm font-medium text-gray-800 leading-snug">de commission sur ses rendez-vous et acomptes</p>
              </div>
              <div className="text-center p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-3xl font-extrabold text-emerald-700 mb-1">auto</p>
                <p className="text-sm font-medium text-gray-800 leading-snug">sa carte de fidélité se crée à la réservation</p>
              </div>
            </div>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Le moment clé, c&apos;est la <strong>réservation directe</strong>. Au lieu de répondre
              aux « dispo&nbsp;? » dans tes DM (et de perdre celles que tu ne vois pas à temps), ton
              abonnée choisit son créneau elle-même. Plus de ping-pong de messages, plus de RDV
              ratés faute de réponse.
            </p>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Et au moment où elle réserve, sa <strong>carte de fidélité se crée automatiquement</strong>.
              Tu récupères enfin son numéro et sa fréquence de passage. C&apos;est ce qui te permet
              de la faire revenir sans dépendre de l&apos;algorithme Instagram&nbsp;: un SMS pour son
              anniversaire, une relance si elle n&apos;est pas revenue depuis 30 jours, un rappel la
              veille de son RDV pour éviter les oublis.
            </p>

            <p className="text-base text-gray-700 leading-relaxed">
              C&apos;est là que la boucle se ferme&nbsp;: Instagram amène l&apos;abonnée, ta page la
              convertit en cliente, et la <Link href="/blog/carte-fidelite-dematerialisee-salon-beaute" className="text-violet-700 underline hover:text-violet-900">carte de fidélité digitale</Link> la
              transforme en habituée. L&apos;algorithme ne contrôle plus ta relation avec elle, toi
              oui.
            </p>
          </section>

          <section id="erreurs" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Heart className="w-7 h-7 text-violet-600 flex-shrink-0" />
              5 erreurs qui te font perdre des clientes
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Mettre un lien Planity ou Booksy en bio</p>
                  <p className="text-sm text-gray-700">Tu offres tes abonnées à un annuaire qui affiche aussi tes concurrentes. Mets ta propre page.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Ne mettre aucun lien (ou juste un numéro)</p>
                  <p className="text-sm text-gray-700">Demander d&apos;appeler ou de DM, c&apos;est ajouter une friction. Beaucoup d&apos;abonnées renoncent plutôt que d&apos;écrire.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Poster du beau, mais jamais d&apos;appel à réserver</p>
                  <p className="text-sm text-gray-700">Un joli feed sans invitation à prendre RDV reste une galerie d&apos;art. Demande, au moins une fois par semaine.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-sm">4</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Gérer toutes les résas à la main dans les DM</p>
                  <p className="text-sm text-gray-700">Tu perds les demandes de la nuit et du week-end, et tu y passes des heures. Une réservation en ligne tourne pour toi 24h/24.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-sm">5</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Collecter des abonnées sans aucun moyen de les recontacter</p>
                  <p className="text-sm text-gray-700">Si Instagram ferme ton compte demain, tu perds tout. Une base de clientes (numéros, fréquence) t&apos;appartient pour toujours.</p>
                </div>
              </div>
            </div>
          </section>

          <section id="faq" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Combien de fois par semaine faut-il poster sur Instagram pour un salon de beauté ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">Vise 3 publications par semaine (feed ou Reels) plus des Stories quasi quotidiennes. La régularité compte plus que la quantité&nbsp;: mieux vaut 3 posts soignés chaque semaine pendant 6 mois qu&apos;une rafale de 10 puis plus rien. Les Stories servent à montrer tes créneaux libres de la semaine et à rappeler qu&apos;on peut réserver.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Faut-il payer de la publicité Instagram pour remplir son salon ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">Non, pas au début. Pour un salon de quartier, le bouche-à-oreille local, les avant/après et un lien en bio qui mène droit à la réservation suffisent à remplir l&apos;agenda. La pub peut accélérer une fois que ton compte convertit déjà, mais elle ne répare pas un tunnel cassé (joli feed sans moyen de réserver).</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Quel lien mettre en bio Instagram quand on a un salon de beauté ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">Mets le lien de ta propre page (ta vitrine) qui regroupe tes prestations, tes horaires, tes réseaux et un bouton pour réserver directement. Évite d&apos;envoyer tes abonnées sur Planity ou Booksy&nbsp;: sur ces plateformes, ta cliente voit aussi les salons concurrents et ne t&apos;appartient plus. Ton lien doit ramener chez toi, pas vers un annuaire.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Les Reels sont-ils plus efficaces que les photos pour la beauté ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">Oui, en général. Les Reels (avant/après en accéléré, transformations, gestes techniques) touchent beaucoup plus de personnes qui ne te suivent pas encore, donc ils amènent de nouvelles abonnées. Garde les photos pour montrer le détail d&apos;un résultat. L&apos;idéal&nbsp;: un mix Reels pour la portée, photos pour la précision, Stories pour l&apos;appel à réserver.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Comment transformer une abonnée qui « like » en vraie cliente ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">Une abonnée devient cliente quand le chemin entre le like et le rendez-vous est court&nbsp;: un lien en bio qui ouvre ta page, un bouton « Réserver » visible, et une réservation possible en 2 minutes sans te DM. Ensuite, sa carte de fidélité se crée automatiquement à la réservation, tu récupères son numéro, et tu peux la faire revenir (anniversaire, relance) sans dépendre de l&apos;algorithme.</p>
              </div>
            </div>
          </section>

          <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
            <Instagram className="w-10 h-10 mx-auto mb-4 opacity-90" />
            <h3 className="text-xl sm:text-2xl font-bold mb-3">
              Mets en bio le lien qui transforme tes abonnées en clientes
            </h3>
            <p className="text-violet-100 mb-6 max-w-xl mx-auto">
              Une page à ton nom avec tes prestations, ta réservation en ligne sans commission et la
              carte de fidélité qui se crée toute seule. Le lien parfait pour ta bio Instagram.
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
