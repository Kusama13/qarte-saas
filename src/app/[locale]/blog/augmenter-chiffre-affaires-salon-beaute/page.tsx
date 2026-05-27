'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  BookOpen,
  TrendingUp,
  Users,
  Calendar,
  Gift,
  ShoppingBag,
  MapPin,
  Share2,
  Sun,
  Target,
} from 'lucide-react';
import { FacebookPixel } from '@/components/analytics/FacebookPixel';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const tocItems = [
  { id: 'constat', label: 'Le constat chiffré du secteur en France' },
  { id: 'levier-1-fideliser', label: 'Levier 1 : Faire revenir tes clientes existantes' },
  { id: 'levier-2-no-show', label: 'Levier 2 : Réduire tes no-show de 80 %' },
  { id: 'levier-3-bons-cadeaux', label: 'Levier 3 : Vendre des bons cadeaux toute l\'année' },
  { id: 'levier-4-panier', label: 'Levier 4 : Augmenter ton panier moyen' },
  { id: 'levier-5-google', label: 'Levier 5 : Te rendre visible sur Google sans payer' },
  { id: 'levier-6-parrainage', label: 'Levier 6 : Activer le bouche-à-oreille structuré' },
  { id: 'levier-7-creneaux-creux', label: 'Levier 7 : Remplir tes créneaux creux' },
  { id: 'par-ou-commencer', label: 'Par où commencer si tu n\'as qu\'1h par semaine' },
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
          name: 'Augmenter le chiffre d\'affaires de son salon de beauté : 7 idées qui marchent vraiment',
          item: 'https://getqarte.com/blog/augmenter-chiffre-affaires-salon-beaute',
        },
      ],
    },
    {
      '@type': 'Article',
      headline: 'Augmenter le chiffre d\'affaires de son salon de beauté : 7 idées qui marchent vraiment',
      description:
        'Augmenter le CA de ton salon de beauté en 2026 : 7 leviers testés (fidélisation, no-show, bons cadeaux, panier moyen). Chiffres et plan d\'action.',
      image: {
        '@type': 'ImageObject',
        url: 'https://getqarte.com/blog/social/article-9-cover.png',
        width: 1080,
        height: 1080,
      },
      datePublished: '2026-05-27T09:00:00+02:00',
      dateModified: '2026-05-27T09:00:00+02:00',
      author: { '@type': 'Organization', name: 'Qarte', url: 'https://getqarte.com' },
      publisher: {
        '@type': 'Organization',
        name: 'Qarte',
        logo: { '@type': 'ImageObject', url: 'https://getqarte.com/logo.png' },
      },
      mainEntityOfPage: 'https://getqarte.com/blog/augmenter-chiffre-affaires-salon-beaute',
      articleSection: 'Croissance',
      inLanguage: 'fr-FR',
      keywords: [
        'augmenter chiffre d\'affaires salon coiffure',
        'augmenter CA salon de beauté',
        'développer son salon de beauté',
        'rentabilité salon de coiffure',
        'marketing salon esthétique',
        'fidélisation clientèle salon',
      ],
      mentions: [
        { '@type': 'Thing', name: 'Gestion salon de beauté' },
        { '@type': 'Thing', name: 'Marketing local' },
        { '@type': 'Thing', name: 'Fidélisation' },
      ],
    },
    {
      '@type': 'FAQPage',
      inLanguage: 'fr-FR',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Quel est le chiffre d\'affaires moyen d\'un salon de beauté en France ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Selon les données INSEE et UNEC, un salon de coiffure indépendant fait en moyenne 115 000 à 130 000 € de CA annuel, un institut de beauté 70 000 à 90 000 €, une onglerie 50 000 à 70 000 €. Mais l\'écart entre les meilleurs et les moyens va du simple au triple, principalement à cause de la fidélisation et de la visibilité en ligne.',
          },
        },
        {
          '@type': 'Question',
          name: 'Combien coûte un client perdu pour un salon de beauté ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Une cliente régulière qui passe 8 fois par an à 45 € de panier moyen = 360 € de CA annuel. Si elle reste 3 ans (durée moyenne d\'une cliente fidèle), ça représente 1 080 €. Acquérir une nouvelle cliente coûte 3 à 5 fois plus cher que de faire revenir une existante. Donc chaque cliente perdue = 360 € minimum à compenser, plus le coût d\'acquisition de sa remplaçante.',
          },
        },
        {
          '@type': 'Question',
          name: 'Combien faut-il avoir de clientes fidèles pour vivre de son salon ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Pour un salon avec un objectif de 80 000 € de CA et un panier moyen de 50 €, il faut environ 1 600 visites/an, soit ~130/mois. Avec une cliente fidèle qui passe 6-8 fois par an, ça représente une base de 200 à 270 clientes actives. La plupart des salons indépendants ont moins de 100 clientes actives faute de programme de fidélité, et donc passent leur temps à courir après les nouvelles.',
          },
        },
        {
          '@type': 'Question',
          name: 'Faut-il être sur Planity ou Booksy pour développer son salon ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Non, ce n\'est pas obligatoire et c\'est même contre-productif sur le long terme. Ces marketplaces te ramènent des clientes qui ne te cherchent pas (elles cherchent un créneau), et tu perds le contact direct car les avis et les contacts leur appartiennent. Mieux vaut une vitrine SEO directe sur ton propre lien, qui te permet de capturer ces clientes en base avec une carte de fidélité.',
          },
        },
        {
          '@type': 'Question',
          name: 'En combien de temps voit-on l\'effet sur le chiffre d\'affaires ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Les leviers internes (fidélisation, no-show, panier moyen) se voient en 2-3 mois. Les leviers d\'acquisition (Google, parrainage) prennent 4-6 mois pour produire un flux régulier. Les bons cadeaux génèrent un pic immédiat lors des fêtes mais nourrissent le CA sur 3-6 mois (durée de validité). Compte 6 mois pour mesurer un vrai effet cumulé.',
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
                <span className="text-gray-600">Croissance</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="inline-flex px-3 py-1 bg-violet-50 text-violet-700 text-xs font-semibold rounded-full">
                  Croissance
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />12 min de lecture
                </span>
                <span className="text-sm text-gray-400">Publié le 27 mai 2026</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                Augmenter le chiffre d&apos;affaires de son salon de beauté : 7 idées qui marchent vraiment
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                La plupart des conseils que tu lis sur le sujet sont des évidences (« sois sympa
                avec tes clientes », « poste sur Instagram »). Cet article est différent : 7 leviers
                concrets, chiffrés, testés par plus de 800 pros de la beauté. Aucun ne demande de
                bouleverser ton activité. Chacun rapporte entre 500 € et 5 000 € de CA annuel
                supplémentaires. Tu n&apos;as pas besoin de tous les mettre en place, juste les 2 ou 3 qui
                font le plus de sens pour ton salon.
              </p>
            </motion.div>

            <div className="mt-8 rounded-2xl overflow-hidden">
              <Image
                src="/blog/social/article-9-cover.png"
                alt="Coiffeuse souriante avec sa cliente dans un salon de beauté moderne, ambiance chaleureuse"
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
              Ton CA dépend de 3 leviers de base : <strong>combien de clientes</strong> tu vois,{' '}
              <strong>à quelle fréquence</strong> elles reviennent, et <strong>combien elles dépensent</strong>
              {' '}à chaque visite. Les 7 leviers ci-dessous adressent les 3. Le plus rentable et le
              plus rapide reste de faire revenir tes clientes existantes, c&apos;est 3 à 5 fois moins
              cher qu&apos;en acquérir des nouvelles. Tout est faisable en moins d&apos;1h/semaine
              avec les bons outils.
            </p>
          </div>

          <section id="constat" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Le constat chiffré du secteur en France
            </h2>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Avant de parler leviers, regardons où tu te situes. Les chiffres ci-dessous viennent
              des données <a href="https://www.insee.fr/fr/statistiques" target="_blank" rel="noopener noreferrer" className="text-violet-700 underline hover:text-violet-900">INSEE</a>,
              de l&apos;<a href="https://www.unec.fr" target="_blank" rel="noopener noreferrer" className="text-violet-700 underline hover:text-violet-900">UNEC</a> (Union Nationale des Entreprises de Coiffure) et des
              études BPI sur les TPE beauté :
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-5 bg-violet-50 border border-violet-200 rounded-xl">
                <p className="text-2xl font-extrabold text-violet-700 mb-1">~120 k€</p>
                <p className="text-xs text-gray-700 leading-snug">CA annuel moyen d&apos;un salon de coiffure indépendant</p>
              </div>
              <div className="text-center p-5 bg-violet-50 border border-violet-200 rounded-xl">
                <p className="text-2xl font-extrabold text-violet-700 mb-1">~75 k€</p>
                <p className="text-xs text-gray-700 leading-snug">CA annuel moyen d&apos;un institut de beauté</p>
              </div>
              <div className="text-center p-5 bg-violet-50 border border-violet-200 rounded-xl">
                <p className="text-2xl font-extrabold text-violet-700 mb-1">~55 k€</p>
                <p className="text-xs text-gray-700 leading-snug">CA annuel moyen d&apos;une onglerie indépendante</p>
              </div>
            </div>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              L&apos;écart entre les moyennes et les meilleurs salons va <strong>du simple au triple</strong>.
              Ce qui sépare les deux groupes ce n&apos;est presque jamais le talent technique
              (la majorité des pros de la beauté maîtrise son métier). C&apos;est :
            </p>

            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-3">
                <span className="text-violet-600 font-bold">→</span>
                <span className="text-base text-gray-700"><strong>Le taux de fidélité</strong> (les meilleurs salons ont 70 % de clientes qui reviennent vs 35 % en moyenne).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-violet-600 font-bold">→</span>
                <span className="text-base text-gray-700"><strong>La gestion du no-show</strong> (les meilleurs perdent 1 % de leur CA en RDV manqués vs 8 % en moyenne).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-violet-600 font-bold">→</span>
                <span className="text-base text-gray-700"><strong>La visibilité locale</strong> (50 % du trafic des meilleurs vient de Google et du bouche-à-oreille structuré).</span>
              </li>
            </ul>

            <p className="text-base text-gray-700 leading-relaxed">
              Aucun de ces écarts ne nécessite plus de talent, plus de temps de travail, ou plus
              d&apos;argent investi. Juste les bons réflexes et les bons outils.
            </p>
          </section>

          <section id="levier-1-fideliser" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Users className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Levier 1 : Faire revenir tes clientes existantes
            </h2>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6">
              <p className="text-sm font-bold text-emerald-900 mb-1">Gain potentiel</p>
              <p className="text-base text-emerald-800">+15 à +30 % de CA sur 6-12 mois, sans toucher à l&apos;acquisition.</p>
            </div>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              C&apos;est <strong>de loin</strong> le levier le plus rentable. Acquérir une nouvelle
              cliente coûte 3 à 5 fois plus cher que d&apos;en faire revenir une existante. Mais 65 %
              des salons indépendants n&apos;ont aucun système de fidélisation digital. Ils
              s&apos;épuisent à acquérir tout en perdant leur base existante par le bas.
            </p>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              La solution la plus simple est une carte de fidélité dématérialisée. Tu choisis une
              récompense (1 brushing offert tous les 10 passages, par exemple), ta cliente scanne
              un QR code à chaque visite, et tu vois en temps réel qui s&apos;approche de la
              récompense. Les salons sur Qarte voient <strong>+47 % de clientes qui reviennent</strong>
              {' '}vs sans programme.
            </p>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Au-delà de la carte, tu peux aussi :
            </p>

            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-bold">✓</span>
                <span className="text-base text-gray-700">Envoyer un <strong>SMS d&apos;anniversaire</strong> avec un petit cadeau (-15 % ou 1 produit offert). Taux de retour observé&nbsp;: 35 à 50 %.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-bold">✓</span>
                <span className="text-base text-gray-700">Relancer les clientes <strong>inactives depuis 30-45 jours</strong> avec un message personnalisé. C&apos;est exactement le moment où elles commencent à décrocher.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-bold">✓</span>
                <span className="text-base text-gray-700">Envoyer un SMS « <strong>plus qu&apos;un passage avant ta récompense</strong> » pour les clientes proches du palier. Taux de retour très élevé (75-90 %).</span>
              </li>
            </ul>

            <p className="text-base text-gray-700 leading-relaxed">
              Pour creuser ce levier, on a écrit un article dédié sur <Link href="/blog/carte-fidelite-dematerialisee-salon-beaute" className="text-violet-700 underline hover:text-violet-900">la carte de fidélité dématérialisée pour salon de beauté</Link>.
            </p>
          </section>

          <section id="levier-2-no-show" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Calendar className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Levier 2 : Réduire tes no-show de 80 %
            </h2>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6">
              <p className="text-sm font-bold text-emerald-900 mb-1">Gain potentiel</p>
              <p className="text-base text-emerald-800">+5 à +10 % de CA, soit 4 000 à 12 000 € par an pour un salon moyen.</p>
            </div>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Un no-show, c&apos;est un créneau qui aurait pu être vendu à 35-80 € qui part en
              fumée. Le salon français moyen perd <strong>8 % de son CA annuel</strong> à cause des
              RDV manqués. Sur 120 k€ de CA, ça fait <strong>9 600 €</strong> qui disparaissent
              chaque année.
            </p>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              La méthode en 3 étapes pour les diviser par 4-5 :
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-4 p-5 border border-violet-100 bg-violet-50/50 rounded-xl">
                <span className="flex-shrink-0 w-8 h-8 bg-violet-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Demande un acompte à la réservation en ligne</p>
                  <p className="text-sm text-gray-600">Même 5 ou 10 €, ça change tout. Une cliente qui a payé 10 € d&apos;avance ne « zappe » pas son RDV. Tu peux exiger l&apos;acompte uniquement pour les nouvelles clientes pour ne pas froisser tes habituées.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 border border-violet-100 bg-violet-50/50 rounded-xl">
                <span className="flex-shrink-0 w-8 h-8 bg-violet-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">SMS de rappel la veille à 19h</p>
                  <p className="text-sm text-gray-600">Pas le matin du RDV (trop tard pour annuler poliment), pas 3 jours avant (trop tôt, oublié). 19h la veille reste le moment optimal&nbsp;: la cliente confirme dans sa tête, ou réorganise si nécessaire.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 border border-violet-100 bg-violet-50/50 rounded-xl">
                <span className="flex-shrink-0 w-8 h-8 bg-violet-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Politique d&apos;annulation claire (48h)</p>
                  <p className="text-sm text-gray-600">Mentionnée sur ta page de réservation et dans le SMS de confirmation&nbsp;: « annulation gratuite jusqu&apos;à 48h avant, l&apos;acompte est conservé après ». Les clientes respectent ce qui est annoncé en amont.</p>
                </div>
              </div>
            </div>

            <p className="text-base text-gray-700 leading-relaxed">
              Méthode détaillée avec les outils et la copy à utiliser : <Link href="/blog/eviter-no-show-salon-rendez-vous" className="text-violet-700 underline hover:text-violet-900">no-show en salon de beauté, comment éviter les RDV manqués</Link>.
              Et pour comprendre pourquoi tu perds 0,72 € sur chaque acompte avec Planity/Booksy
              vs 0 € via ton lien direct&nbsp;: <Link href="/blog/acompte-rdv-salon-sans-commission" className="text-violet-700 underline hover:text-violet-900">acompte salon sans commission</Link>.
            </p>
          </section>

          <section id="levier-3-bons-cadeaux" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Gift className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Levier 3 : Vendre des bons cadeaux toute l&apos;année
            </h2>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6">
              <p className="text-sm font-bold text-emerald-900 mb-1">Gain potentiel</p>
              <p className="text-base text-emerald-800">+3 à +8 % de CA, avec un pic à Noël/Fête des Mères/Saint-Valentin.</p>
            </div>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Les bons cadeaux sont sous-exploités dans la beauté. 60 % des salons français
              n&apos;en vendent qu&apos;en bons papier au comptoir, sur la base d&apos;un client
              qui demande. C&apos;est passer à côté d&apos;une mécanique <strong>très</strong>{' '}
              rentable :
            </p>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-bold">✓</span>
                <span className="text-base text-gray-700">Le bon cadeau est <strong>encaissé immédiatement</strong> mais consommé plus tard (souvent jamais entièrement) → trésorerie immédiate, marge meilleure.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-bold">✓</span>
                <span className="text-base text-gray-700">Le destinataire devient souvent une <strong>nouvelle cliente régulière</strong> si la prestation lui plaît → acquisition gratuite.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-bold">✓</span>
                <span className="text-base text-gray-700">Le panier moyen lors de la consommation est plus élevé que le bon (la cliente complète avec un soin en plus) → marge supplémentaire.</span>
              </li>
            </ul>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Pour vendre toute l&apos;année (pas que à Noël), tu peux mettre les bons cadeaux en
              vente directe sur ta vitrine en ligne : ta cliente choisit un montant (30, 50, 80 €),
              entre les coordonnées du destinataire, paie via Stripe directement sur ton compte
              bancaire, et le destinataire reçoit un email avec son bon valide 3 mois. Aucune
              gestion manuelle, aucune commission à part les frais Stripe standards.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="text-sm text-amber-900 leading-relaxed">
                <strong>Astuce saisonnière :</strong> mets en avant tes bons cadeaux 3 semaines
                avant chaque grand pic (Noël, Saint-Valentin, Fête des Mères). Un seul post Instagram
                ciblé peut générer 10 à 30 bons vendus, soit 500 à 2 000 € de CA immédiat.
              </p>
            </div>
          </section>

          <section id="levier-4-panier" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <ShoppingBag className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Levier 4 : Augmenter ton panier moyen
            </h2>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6">
              <p className="text-sm font-bold text-emerald-900 mb-1">Gain potentiel</p>
              <p className="text-base text-emerald-800">+5 à +15 € par visite, soit +10 à +20 % de CA sans aucune nouvelle cliente.</p>
            </div>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Tu n&apos;as pas besoin de plus de clientes pour faire plus de CA. Tu peux juste
              vendre <strong>plus à celles que tu as déjà</strong>. Les 4 leviers concrets :
            </p>

            <div className="space-y-4 mb-6">
              <div className="border border-violet-100 rounded-xl p-5">
                <p className="font-bold text-gray-900 mb-1">1. Proposer un soin complémentaire pendant la prestation</p>
                <p className="text-sm text-gray-700 leading-relaxed">Soin profond pendant le brushing, masque réparateur pendant la couleur, soin des cuticules pendant la manucure. Ce sont des petits soins en plus de 8 à 15 € que la cliente accepte 30-40 % du temps si la proposition est faite de manière fluide (pas pushy, juste « tu veux qu&apos;on ajoute un soin ? tu as les cheveux secs en pointe »).</p>
              </div>
              <div className="border border-violet-100 rounded-xl p-5">
                <p className="font-bold text-gray-900 mb-1">2. Vendre du retail (produits) au comptoir</p>
                <p className="text-sm text-gray-700 leading-relaxed">Le shampoing pro que tu as utilisé. Le sérum cheveux. La crème hydratante. Pose-le en évidence à la caisse avec un petit mot. 2 produits vendus par jour à 15 € de marge = 900 €/mois de marge en plus.</p>
              </div>
              <div className="border border-violet-100 rounded-xl p-5">
                <p className="font-bold text-gray-900 mb-1">3. Créer des formules à valeur élevée</p>
                <p className="text-sm text-gray-700 leading-relaxed">« Forfait beauté complet » couleur + coupe + brushing à 95 € au lieu de 105 € au détail. Tu vends plus en volume, la cliente paie moins en moyenne, ton panier moyen explose.</p>
              </div>
              <div className="border border-violet-100 rounded-xl p-5">
                <p className="font-bold text-gray-900 mb-1">4. Proposer un service en plus aux meilleures clientes</p>
                <p className="text-sm text-gray-700 leading-relaxed">Si tu utilises une carte de fidélité avec cagnotte, tu vois directement qui sont tes meilleures clientes (panier moyen, fréquence). Pour celles-ci, propose 2-3 fois par an un service premium (extensions, soin profond) ou un programme membre payant à l&apos;année.</p>
              </div>
            </div>

            <p className="text-base text-gray-700 leading-relaxed">
              Le panier moyen est <strong>le</strong> levier oublié des salons. Une cliente qui sort à 45 €
              au lieu de 35 €, c&apos;est 22 % de CA en plus, et tu n&apos;as fait aucun effort
              supplémentaire d&apos;acquisition.
            </p>
          </section>

          <section id="levier-5-google" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <MapPin className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Levier 5 : Te rendre visible sur Google sans payer
            </h2>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6">
              <p className="text-sm font-bold text-emerald-900 mb-1">Gain potentiel</p>
              <p className="text-base text-emerald-800">5 à 20 nouvelles clientes par mois en trafic organique, soit 2 000 à 10 000 € de CA annuel.</p>
            </div>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Quand quelqu&apos;un cherche « coiffeur Bordeaux » ou « manucure Lyon », il regarde
              <strong> les 3 premiers résultats Google Maps</strong> et clique. Si tu y es pas, tu
              n&apos;existes pas pour cette personne. Pas besoin d&apos;être numéro 1 mondial,
              juste numéro 1 dans ton quartier.
            </p>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Les 3 actions à faire (gratuites) :
            </p>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-bold">1</span>
                <span className="text-base text-gray-700"><strong>Renseigner ta fiche Google Business à fond</strong>&nbsp;: horaires précis, 10+ photos récentes, descriptif détaillé, services + tarifs. Google favorise les fiches complètes.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-bold">2</span>
                <span className="text-base text-gray-700"><strong>Collecter activement les avis Google</strong> (objectif&nbsp;: 50+ avis avec 4,7+ note moyenne dans les 6 prochains mois). C&apos;est le critère qui pèse le plus dans le classement local.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-bold">3</span>
                <span className="text-base text-gray-700"><strong>Avoir une vraie vitrine en ligne</strong> (ton propre lien, pas Planity/Booksy) avec ton adresse, tes prestations, tes tarifs, ta bio. Google indexe et envoie du trafic direct.</span>
              </li>
            </ul>

            <p className="text-base text-gray-700 leading-relaxed">
              Pour comprendre pourquoi un lien Planity/Booksy en bio Instagram envoie tes futures
              clientes à la concurrente plutôt qu&apos;à toi&nbsp;: <Link href="/blog/ne-pas-mettre-lien-planity-bio-instagram" className="text-violet-700 underline hover:text-violet-900">lien Planity en bio Instagram, l&apos;erreur classique</Link>.
              Et pourquoi <Link href="/blog/avis-planity-booksy-ne-tappartiennent-pas" className="text-violet-700 underline hover:text-violet-900">tes avis Planity/Booksy ne t&apos;appartiennent pas</Link>.
            </p>
          </section>

          <section id="levier-6-parrainage" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Share2 className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Levier 6 : Activer le bouche-à-oreille structuré
            </h2>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6">
              <p className="text-sm font-bold text-emerald-900 mb-1">Gain potentiel</p>
              <p className="text-base text-emerald-800">3 à 10 nouvelles clientes par mois par parrainage, soit ~1 000 à 4 000 € de CA annuel.</p>
            </div>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Le bouche-à-oreille existe naturellement dans la beauté (« mon amie va chez elle, elle
              est super »). Mais sans structure, tu en captures peut-être 10 %. Avec un programme de
              parrainage simple, tu en captures 50-70 %.
            </p>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              La mécanique qui marche le mieux dans la beauté&nbsp;:
            </p>

            <div className="bg-violet-50 border border-violet-200 rounded-xl p-5 mb-6">
              <p className="font-bold text-violet-900 mb-2">La double récompense gagnant-gagnant</p>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                <strong>Pour la marraine</strong>&nbsp;: -15 € sur sa prochaine prestation dès que la
                filleule vient en RDV.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong>Pour la filleule</strong>&nbsp;: -15 € sur sa première prestation chez toi.
              </p>
            </div>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Coût total pour toi&nbsp;: 30 € de réduction pour une nouvelle cliente qui vaut 1 080 €
              sur 3 ans. ROI démentiel. Et tu offres aux 2 personnes un sentiment positif (la
              marraine se sent valorisée, la filleule pense avoir trouvé une bonne adresse).
            </p>

            <p className="text-base text-gray-700 leading-relaxed">
              Pour que ça marche, il faut que la marraine puisse partager son code en 1 clic (lien
              ou code court à dire). Et que les 2 récompenses soient automatiques (sinon tu oublies
              de les donner, et le programme meurt en 3 mois). Une carte de fidélité digitale avec
              parrainage intégré rend tout ça automatique.
            </p>
          </section>

          <section id="levier-7-creneaux-creux" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Sun className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Levier 7 : Remplir tes créneaux creux
            </h2>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6">
              <p className="text-sm font-bold text-emerald-900 mb-1">Gain potentiel</p>
              <p className="text-base text-emerald-800">+5 à +12 % de CA en remplissant 2-3 créneaux creux supplémentaires par semaine.</p>
            </div>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Chaque salon a ses creux : le mardi matin, le mercredi 14-17h, le début de mois après
              la paie. Ces créneaux sont 100 % de marge perdue parce qu&apos;ils n&apos;arriveront
              plus jamais. Le levier&nbsp;: créer des offres ciblées <strong>sur ces créneaux uniquement</strong>.
            </p>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Les 3 formats qui marchent&nbsp;:
            </p>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-bold">✓</span>
                <span className="text-base text-gray-700"><strong>L&apos;offre mardi matin</strong>&nbsp;: « -20 % sur tous les soins le mardi de 9h à 12h, sans réservation ». Idéal pour les retraitées, mères au foyer, télétravailleurs.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-bold">✓</span>
                <span className="text-base text-gray-700"><strong>Le SMS « créneau libéré »</strong>&nbsp;: si tu as une annulation tardive, envoyer un SMS aux 30-50 clientes les plus proches avec « créneau dispo ce jeudi 15h chez Sophie, premier qui répond ». Très efficace, mais à utiliser avec parcimonie pour éviter le harcèlement.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-bold">✓</span>
                <span className="text-base text-gray-700"><strong>L&apos;offre « jours doubles »</strong>&nbsp;: les passages comptent x2 dans la carte de fidélité le mardi et mercredi. Tes clientes calent leur RDV sur ces jours, tes créneaux pleins s&apos;équilibrent.</span>
              </li>
            </ul>

            <p className="text-base text-gray-700 leading-relaxed">
              L&apos;astuce mentale&nbsp;: une heure creuse qui se remplit, même avec une remise de
              20 %, est toujours plus rentable qu&apos;une heure vide. Surtout en cabine ou en
              prestation où ton coût fixe (loyer, électricité) tourne déjà.
            </p>
          </section>

          <section id="par-ou-commencer" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Target className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Par où commencer si tu n&apos;as qu&apos;1h par semaine
            </h2>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              7 leviers, c&apos;est beaucoup. Tu n&apos;as pas besoin de tout mettre en place en même
              temps. Voici l&apos;ordre testé qui marche le mieux pour 90 % des salons&nbsp;:
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-4 p-5 bg-violet-50 border border-violet-200 rounded-xl">
                <span className="flex-shrink-0 w-10 h-10 bg-violet-600 text-white rounded-full flex items-center justify-center font-bold">1</span>
                <div>
                  <p className="font-bold text-gray-900 mb-1">Mois 1 : Carte de fidélité digitale</p>
                  <p className="text-sm text-gray-700">Effet rapide (3 mois), gain élevé. Tu installes en 5 min, tu proposes le scan à chaque cliente. C&apos;est la fondation pour tous les autres leviers.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 bg-violet-50 border border-violet-200 rounded-xl">
                <span className="flex-shrink-0 w-10 h-10 bg-violet-600 text-white rounded-full flex items-center justify-center font-bold">2</span>
                <div>
                  <p className="font-bold text-gray-900 mb-1">Mois 2 : Anti no-show (acompte + SMS rappel)</p>
                  <p className="text-sm text-gray-700">Effet immédiat sur le CA. Tu actives la réservation en ligne avec acompte demandé aux nouvelles clientes, et tu actives les SMS de rappel J-1.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 bg-violet-50 border border-violet-200 rounded-xl">
                <span className="flex-shrink-0 w-10 h-10 bg-violet-600 text-white rounded-full flex items-center justify-center font-bold">3</span>
                <div>
                  <p className="font-bold text-gray-900 mb-1">Mois 3 : Avis Google + vitrine SEO</p>
                  <p className="text-sm text-gray-700">Tu commences à demander un avis Google à chaque cliente qui débloque sa récompense de fidélité. Tu mets en place ta vitrine en ligne avec photos + tarifs. Effet visible en 4-6 mois.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 bg-violet-50 border border-violet-200 rounded-xl">
                <span className="flex-shrink-0 w-10 h-10 bg-violet-600 text-white rounded-full flex items-center justify-center font-bold">4</span>
                <div>
                  <p className="font-bold text-gray-900 mb-1">Mois 4-6 : Parrainage + bons cadeaux + panier moyen</p>
                  <p className="text-sm text-gray-700">Tu actives ces 3 leviers en parallèle. Le parrainage marche dès que tu as 30+ clientes fidèles. Les bons cadeaux marchent toute l&apos;année, surtout aux pics fêtes. Le panier moyen se travaille au quotidien dans tes propositions.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 bg-violet-50 border border-violet-200 rounded-xl">
                <span className="flex-shrink-0 w-10 h-10 bg-violet-600 text-white rounded-full flex items-center justify-center font-bold">5</span>
                <div>
                  <p className="font-bold text-gray-900 mb-1">Mois 6+ : Créneaux creux</p>
                  <p className="text-sm text-gray-700">Tu as maintenant assez de data et de clientes fidèles pour identifier précisément tes créneaux faibles et y attirer du monde avec des offres ciblées.</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="text-sm text-amber-900 leading-relaxed">
                <strong>Le piège à éviter</strong>&nbsp;: vouloir tout lancer le même mois.
                Tu vas t&apos;épuiser, ne rien faire à fond, et tout abandonner. Un seul levier
                bien fait par mois = transformation visible. Tous les leviers à moitié faits =
                aucun effet et fatigue.
              </p>
            </div>
          </section>

          <section id="faq" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Quel est le chiffre d&apos;affaires moyen d&apos;un salon de beauté en France ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">Selon les données INSEE et UNEC, un salon de coiffure indépendant fait en moyenne 115 000 à 130 000 € de CA annuel, un institut de beauté 70 000 à 90 000 €, une onglerie 50 000 à 70 000 €. Mais l&apos;écart entre les meilleurs et les moyens va du simple au triple, principalement à cause de la fidélisation et de la visibilité en ligne.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Combien coûte un client perdu pour un salon de beauté ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">Une cliente régulière qui passe 8 fois par an à 45 € de panier moyen = 360 € de CA annuel. Si elle reste 3 ans (durée moyenne d&apos;une cliente fidèle), ça représente 1 080 €. Acquérir une nouvelle cliente coûte 3 à 5 fois plus cher que de faire revenir une existante. Donc chaque cliente perdue = 360 € minimum à compenser, plus le coût d&apos;acquisition de sa remplaçante.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Combien faut-il avoir de clientes fidèles pour vivre de son salon ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">Pour un salon avec un objectif de 80 000 € de CA et un panier moyen de 50 €, il faut environ 1 600 visites/an, soit ~130/mois. Avec une cliente fidèle qui passe 6-8 fois par an, ça représente une base de 200 à 270 clientes actives. La plupart des salons indépendants ont moins de 100 clientes actives faute de programme de fidélité, et donc passent leur temps à courir après les nouvelles.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Faut-il être sur Planity ou Booksy pour développer son salon ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">Non, ce n&apos;est pas obligatoire et c&apos;est même contre-productif sur le long terme. Ces marketplaces te ramènent des clientes qui ne te cherchent pas (elles cherchent un créneau), et tu perds le contact direct car les avis et les contacts leur appartiennent. Mieux vaut une vitrine SEO directe sur ton propre lien, qui te permet de capturer ces clientes en base avec une carte de fidélité.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">En combien de temps voit-on l&apos;effet sur le chiffre d&apos;affaires ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">Les leviers internes (fidélisation, no-show, panier moyen) se voient en 2-3 mois. Les leviers d&apos;acquisition (Google, parrainage) prennent 4-6 mois pour produire un flux régulier. Les bons cadeaux génèrent un pic immédiat lors des fêtes mais nourrissent le CA sur 3-6 mois (durée de validité). Compte 6 mois pour mesurer un vrai effet cumulé.</p>
              </div>
            </div>
          </section>

          <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
            <TrendingUp className="w-10 h-10 mx-auto mb-4 opacity-90" />
            <h3 className="text-xl sm:text-2xl font-bold mb-3">
              Active les 5 premiers leviers en 5 minutes
            </h3>
            <p className="text-violet-100 mb-6 max-w-xl mx-auto">
              Carte de fidélité digitale, réservation avec acompte, SMS rappel, vitrine SEO,
              parrainage&nbsp;: tout est inclus dans Qarte. Forfait 24 €/mois, 0 commission, 3 jours d&apos;essai gratuit.
            </p>
            <Link
              href="/auth/merchant/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-violet-700 font-bold rounded-2xl hover:bg-violet-50 transition-colors"
            >
              Tester Qarte gratuitement
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
