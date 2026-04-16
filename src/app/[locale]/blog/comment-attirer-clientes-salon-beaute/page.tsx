'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  MapPin,
  CalendarCheck,
  Instagram,
  Star,
  Users,
  Gift,
  Megaphone,
  MessageSquare,
  Smartphone,
  TrendingUp,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { FacebookPixel } from '@/components/analytics/FacebookPixel';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const tocItems = [
  { id: 'pourquoi-vide', label: 'Pourquoi ton agenda est vide (le vrai diagnostic)' },
  { id: 'strategies', label: 'Les 12 stratégies qui remplissent un salon en 2026' },
  { id: 'priorites', label: 'Par où commencer : la matrice priorité / impact' },
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
          name: 'Comment attirer plus de clientes en salon de beauté',
          item: 'https://getqarte.com/blog/comment-attirer-clientes-salon-beaute',
        },
      ],
    },
    {
      '@type': 'Article',
      headline: 'Comment attirer plus de clientes dans son salon de beauté : 12 stratégies qui marchent en 2026',
      description:
        'Google Business, réservation en ligne, Instagram, parrainage, fidélité : 12 leviers concrets pour remplir ton agenda salon, institut, onglerie ou barbershop.',
      image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80',
      datePublished: '2026-04-16',
      dateModified: '2026-04-16',
      author: { '@type': 'Organization', name: 'Qarte', url: 'https://getqarte.com' },
      publisher: {
        '@type': 'Organization',
        name: 'Qarte',
        logo: { '@type': 'ImageObject', url: 'https://getqarte.com/logo.png' },
      },
      mainEntityOfPage: 'https://getqarte.com/blog/comment-attirer-clientes-salon-beaute',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Combien de temps pour voir les premières nouvelles clientes arriver ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Une fiche Google Business optimisée commence à générer des appels et réservations en 2 à 6 semaines. La réservation en ligne, elle, convertit dès le premier jour si tu as déjà du trafic (recherche Google, Instagram, bouche-à-oreille).",
          },
        },
        {
          '@type': 'Question',
          name: "Faut-il faire de la publicité Instagram ou Facebook pour remplir un salon ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Non, pas en priorité. Les 3 leviers gratuits (Google Business, réservation en ligne sur ta page, parrainage client) remplissent un agenda avant même de penser aux ads. La pub a du sens une fois que ces fondations convertissent.",
          },
        },
        {
          '@type': 'Question',
          name: 'Quel est le meilleur moyen d\'attirer de nouvelles clientes sans budget ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Le parrainage client. Une cliente fidèle qui ramène 2 amies équivaut à une campagne publicitaire gratuite. Avec un programme de fidélité qui récompense la parrain et la filleule, tu transformes ton fichier client en canal d\'acquisition.",
          },
        },
        {
          '@type': 'Question',
          name: "Comment faire quand on est débordée et qu'on n'a pas le temps de faire du marketing ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Automatise. Réservation en ligne 24h/24, relances clients automatiques, demande d\'avis Google après chaque passage : trois outils qui tournent seuls et rapportent des clientes sans travail quotidien.",
          },
        },
      ],
    },
  ],
};

interface Strategy {
  num: number;
  icon: typeof MapPin;
  title: string;
  kpi: string;
  content: string[];
}

const strategies: Strategy[] = [
  {
    num: 1,
    icon: MapPin,
    title: 'Optimise ta fiche Google Business — le levier n°1',
    kpi: '46 % des recherches Google sont locales',
    content: [
      '46 % des recherches Google ont une intention locale (Google, 2024). "Coiffeur près de moi", "institut beauté Paris 11e", "manucure pas cher" : ces requêtes mènent directement à une fiche Google Business, pas à un site web.',
      'Fais le tour de ta fiche : 10 photos minimum (intérieur, réalisations, équipe), 3 services phares avec tarifs, horaires à jour, description avec tes mots-clés (ex : "salon de coiffure bio à Lyon"). Réponds à chaque avis en moins de 48 h. Résultat : tu remontes dans le pack local (les 3 fiches affichées en premier).',
    ],
  },
  {
    num: 2,
    icon: CalendarCheck,
    title: 'Active la réservation en ligne 24h/24',
    kpi: '+35 % de rendez-vous la première semaine',
    content: [
      '70 % des clientes de salons réservent entre 19 h et minuit (Square, 2024). Si ta seule option est "appeler aux heures d\'ouverture", tu perds mécaniquement ces clientes — elles vont chez le concurrent qui affiche "Réserver en ligne".',
      'La réservation en ligne travaille pendant que tu dors. Une cliente scroll Instagram à 22 h, clique sur ton lien, voit un créneau libre demain à 14 h, réserve. Zéro friction, zéro appel manqué. Et avec un acompte (10-20 % du prix), tu divises tes no-show par 4.',
    ],
  },
  {
    num: 3,
    icon: Instagram,
    title: 'Instagram : 3 posts par semaine qui travaillent',
    kpi: '+21 % de trafic salon via Instagram',
    content: [
      'Instagram reste le premier canal d\'inspiration beauté (81 % des 18-34 ans, Meta 2024). Mais poster n\'importe quoi ne sert à rien : il faut 3 types de contenus qui convertissent.',
      '1) Avant/après (réalisations) : génère les demandes de RDV en DM. 2) Reels "coulisses" (technique, produits, équipe) : crée la confiance. 3) Story "créneaux dispos cette semaine" : remplit les trous de dernière minute. Mets ton lien de réservation en bio — chaque vue doit pouvoir se transformer en RDV en 2 clics.',
    ],
  },
  {
    num: 4,
    icon: Users,
    title: 'Active le parrainage client : ton meilleur canal gratuit',
    kpi: '5× moins cher que la pub',
    content: [
      'Acquérir une nouvelle cliente coûte 5 fois plus cher que fidéliser une existante (Harvard Business Review). Le parrainage inverse cette équation : une cliente satisfaite devient ton commercial gratuit.',
      'Offre concrète à proposer : "10 € offerts à toi et à ton amie lors de sa 1re visite". Le double avantage est crucial — on ne parraine pas par pitié, on parraine quand il y a un vrai bénéfice pour les deux. Avec un programme structuré, 20 à 30 % de tes clientes ramèneront au moins une amie dans l\'année.',
    ],
  },
  {
    num: 5,
    icon: Star,
    title: 'Demande systématiquement des avis Google',
    kpi: 'Note ≥ 4,5 = +32 % de clics',
    content: [
      'Une fiche Google Business avec 4,7 étoiles et 200 avis reçoit 32 % de clics en plus qu\'une fiche à 3,9 étoiles (BrightLocal, 2024). Les avis sont le nouveau bouche-à-oreille : ils convertissent l\'hésitation en réservation.',
      'Demande un avis à chaque cliente satisfaite, le jour même du rendez-vous. L\'idéal : un SMS ou un email automatique avec un lien direct vers ta fiche Google Review. Les clientes qui viennent de passer un bon moment écrivent 4× plus qu\'à J+7. Objectif : 1 à 2 nouveaux avis par semaine.',
    ],
  },
  {
    num: 6,
    icon: Gift,
    title: 'Lance un programme de fidélité digital',
    kpi: '67 % de CA en plus par cliente fidèle',
    content: [
      'Une cliente fidèle dépense en moyenne 67 % de plus qu\'une nouvelle cliente (Bain & Company). Mais "fidélité" ne veut plus dire carton à tampons perdu dans le sac à main.',
      'Programme digital = carte scannée en caisse, points cumulés automatiquement, notifications push quand une récompense est débloquée. Deux mécaniques qui fonctionnent : tampons ("10 visites = 1 offerte") pour les prestations récurrentes, cagnotte (3-5 % remboursés) pour les tickets élevés. Les clientes reviennent plus souvent sans que tu aies à le demander.',
    ],
  },
  {
    num: 7,
    icon: Megaphone,
    title: "Crée une offre de bienvenue pour les nouvelles clientes",
    kpi: '+42 % de conversion 1re visite',
    content: [
      "Une offre claire pour les nouvelles clientes (-20 %, un soin offert, un prix découverte) lève la friction de la première fois. C'est le levier qui fait passer une curieuse à une cliente.",
      "La règle d'or : l'offre doit se cumuler avec un avantage de fidélisation (carte offerte dès le 1er passage par exemple). Sinon tu attires des chasseuses de promo qui partent au concurrent d'après. Combine acquisition (offre découverte) + rétention (carte fidélité auto) dès la première visite.",
    ],
  },
  {
    num: 8,
    icon: MessageSquare,
    title: 'Relance tes clientes inactives avec un SMS ciblé',
    kpi: '18 % de réactivation moyenne',
    content: [
      "Un SMS bien calibré, envoyé aux clientes qui ne sont pas revenues depuis 8-12 semaines, réactive en moyenne 18 % d'entre elles (Square, 2024). C'est du CA qui dort dans ta base client.",
      'Le format gagnant : personnel, court, avec un geste. "Hello Laura, ça fait un moment ! Une petite attention pour te revoir : ton prochain soin à -15 %. Réserve ici : [lien]". Pas plus. Automatise-le pour qu\'il parte tout seul à J+60 après la dernière visite.',
    ],
  },
  {
    num: 9,
    icon: Smartphone,
    title: 'Une vraie page salon (pas juste Instagram)',
    kpi: 'Tu es propriétaire de ton audience',
    content: [
      "Instagram peut fermer ton compte demain sans prévenir. Google peut suspendre ta fiche. Ta page salon, elle, t'appartient. C'est ton asset long terme.",
      "Une bonne page affiche : photos de réalisations, liste des prestations avec tarifs, bouton de réservation en ligne, avis clients, plan d'accès. Référencée sur Google pour tes requêtes locales. Partageable en 1 clic sur WhatsApp ou en story Instagram. Elle travaille pour toi même quand tu ne postes rien.",
    ],
  },
  {
    num: 10,
    icon: TrendingUp,
    title: 'Partenariats locaux : école, salle de sport, commerce voisin',
    kpi: '0 € dépensé, trafic qualifié',
    content: [
      'Une salle de pilates à 300 m de ton salon a exactement ton client type. Même chose pour un cabinet de dentiste, une boutique de vêtements, un spa. Ces commerces cherchent, eux aussi, à donner plus de valeur à leurs clients.',
      'L\'échange gagnant : tu leur offres des cartes cadeaux "-15 € 1re visite" à distribuer à leurs clientes premium. Eux te donnent des flyers ou un post Instagram. Zéro budget, trafic ultra-qualifié. Vise 3 partenariats dans ton quartier et renouvelle tous les trimestres.',
    ],
  },
  {
    num: 11,
    icon: Gift,
    title: 'Cartes cadeaux : occasions spéciales toute l\'année',
    kpi: '+12 % de CA annuel',
    content: [
      "Fête des Mères, Noël, anniversaires, diplômes : les cartes cadeaux drainent 12 % du CA d'un salon bien organisé. Et 45 % des bénéficiaires deviennent clientes récurrentes (Square, 2024).",
      'Deux conditions : vendre les cartes en ligne (pas seulement en caisse), et les promouvoir sur Instagram 3 semaines avant chaque pic (fête des Mères, Noël). Astuce : la personne qui offre te rapporte plus qu\'une cliente standard, et la bénéficiaire devient souvent fidèle.',
    ],
  },
  {
    num: 12,
    icon: CalendarCheck,
    title: 'Offres "créneaux creux" pour lisser ton agenda',
    kpi: '+8 % d\'occupation hebdomadaire',
    content: [
      'Tu as des mardis et jeudis matin vides mais des samedis surchargés ? Propose -15 % sur les créneaux mardi/jeudi. Les clientes flexibles (étudiantes, mamans en congé, seniors) adorent.',
      "Affiche l'offre en story Instagram la veille, envoie-la par SMS à ton fichier, configure-la en option sur ta réservation en ligne. Tu remplis ton agenda aux heures creuses sans casser tes prix sur le reste de la semaine.",
    ],
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
        {/* Header */}
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

        {/* Article header */}
        <section className="py-12 sm:py-16 bg-gradient-to-b from-indigo-50/50 to-white">
          <div className="max-w-3xl mx-auto px-6">
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <Link href="/blog" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  Blog
                </Link>
                <span>/</span>
                <span className="text-gray-600">Acquisition</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="inline-flex px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                  Acquisition
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  10 min de lecture
                </span>
                <span className="text-sm text-gray-400">Mis à jour le 16 avril 2026</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                Comment attirer plus de clientes dans son salon de beauté : 12 stratégies qui marchent en 2026
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                <strong className="text-gray-900">70 % des nouvelles clientes ne reviennent pas</strong> après leur
                première visite. Et 6 salons sur 10 tournent en dessous de leur capacité réelle faute de stratégie
                d&apos;acquisition structurée. Voici les 12 leviers concrets qui remplissent un agenda salon, institut
                ou onglerie en 2026 — du gratuit au payant, du rapide au long terme.
              </p>
            </motion.div>

            <div className="mt-8 rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80"
                alt="Salon de beauté moderne avec clientes en rendez-vous"
                width={1200}
                height={675}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        </section>

        {/* TOC */}
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
            <p className="text-sm font-bold text-indigo-900 mb-2">Résumé en 30 secondes</p>
            <p className="text-base text-gray-700 leading-relaxed">
              3 leviers gratuits remplissent un agenda en 60 jours : <strong>fiche Google Business optimisée</strong>
              , <strong>réservation en ligne 24h/24</strong>, <strong>programme de parrainage</strong>. Les 9 autres
              stratégies (Instagram, fidélité, avis, relances, partenariats) amplifient et pérennisent la croissance.
              Ordre d&apos;attaque conseillé : Google → Réservation → Fidélité/Parrainage → le reste.
            </p>
          </div>

          {/* Section 1: Diagnostic */}
          <section id="pourquoi-vide" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              Pourquoi ton agenda est vide (le vrai diagnostic)
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Avant de parler stratégies, pose-toi une question honnête : est-ce un problème de{' '}
              <strong>visibilité</strong> (personne ne sait que tu existes) ou de <strong>conversion</strong> (les
              gens te voient mais ne réservent pas) ?
            </p>
            <div className="grid sm:grid-cols-2 gap-4 my-8">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Problème de visibilité</p>
                <ul className="text-sm text-gray-700 space-y-1.5">
                  <li>Fiche Google invisible ou inexistante</li>
                  <li>Moins de 10 avis clients</li>
                  <li>Pas d&apos;Instagram ou moins de 2 posts/mois</li>
                  <li>Pas de page web avec prestations + tarifs</li>
                </ul>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Problème de conversion</p>
                <ul className="text-sm text-gray-700 space-y-1.5">
                  <li>Vues Instagram mais peu de DM/appels</li>
                  <li>Appels manqués (hors heures d&apos;ouverture)</li>
                  <li>Pas de réservation en ligne</li>
                  <li>Pas d&apos;offre claire pour les nouvelles clientes</li>
                </ul>
              </div>
            </div>
            <p className="text-base text-gray-700 leading-relaxed">
              Les stratégies 1 à 5 ci-dessous règlent la visibilité. Les stratégies 2, 6, 7, 8 règlent la conversion.
              Si tu coches plus de cases à gauche, commence par Google Business + Instagram. Si tu coches plus à
              droite, commence par réservation en ligne + offre de bienvenue.
            </p>
          </section>

          {/* Section 2: 12 stratégies */}
          <section id="strategies" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Les 12 stratégies qui remplissent un salon en 2026
            </h2>
            <p className="text-base text-gray-500 mb-10">Classées de la plus universelle à la plus saisonnière.</p>

            <div className="space-y-10">
              {strategies.map((s) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.num}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    transition={{ duration: 0.4 }}
                    className="border-l-4 border-indigo-200 pl-6"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                        {s.num}
                      </div>
                      <Icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h3>
                    <p className="text-sm font-semibold text-indigo-700 mb-4">{s.kpi}</p>
                    {s.content.map((p, i) => (
                      <p key={i} className="text-base text-gray-700 leading-relaxed mb-3">
                        {p}
                      </p>
                    ))}
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Section 3: Matrice priorité */}
          <section id="priorites" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              Par où commencer : la matrice priorité / impact
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-6">
              Tu ne peux pas tout lancer la même semaine. Voici l&apos;ordre qui fonctionne pour 90 % des salons que
              nous accompagnons :
            </p>

            <div className="overflow-x-auto rounded-xl border border-gray-200 mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Semaine</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Action</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Impact attendu</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Effort</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-semibold">S1</td>
                    <td className="px-4 py-3">Fiche Google Business (photos, horaires, avis)</td>
                    <td className="px-4 py-3 text-emerald-700">Très élevé</td>
                    <td className="px-4 py-3">2 h</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">S1</td>
                    <td className="px-4 py-3">Réservation en ligne 24h/24 + page salon</td>
                    <td className="px-4 py-3 text-emerald-700">Très élevé</td>
                    <td className="px-4 py-3">1 h</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">S2</td>
                    <td className="px-4 py-3">Programme de fidélité + parrainage</td>
                    <td className="px-4 py-3 text-emerald-700">Élevé</td>
                    <td className="px-4 py-3">1 h</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">S3</td>
                    <td className="px-4 py-3">Automatisation demande d&apos;avis Google</td>
                    <td className="px-4 py-3 text-amber-700">Moyen</td>
                    <td className="px-4 py-3">30 min</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">S4</td>
                    <td className="px-4 py-3">Calendrier Instagram (3 posts/semaine)</td>
                    <td className="px-4 py-3 text-amber-700">Moyen</td>
                    <td className="px-4 py-3">1 h/semaine</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">M2</td>
                    <td className="px-4 py-3">Relances SMS clients inactifs (J+60)</td>
                    <td className="px-4 py-3 text-amber-700">Moyen</td>
                    <td className="px-4 py-3">30 min setup</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">M3</td>
                    <td className="px-4 py-3">Partenariats locaux + cartes cadeaux</td>
                    <td className="px-4 py-3 text-amber-700">Moyen</td>
                    <td className="px-4 py-3">2 h</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
              <p className="text-sm text-emerald-900 leading-relaxed">
                <strong>En résumé :</strong> en 4 semaines tu poses les fondations (Google, réservation en ligne,
                fidélité, avis). À partir du mois 2, ton agenda se remplit passivement pendant que tu ajoutes les
                leviers d&apos;amplification (Instagram, relances, partenariats).
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Combien de temps pour voir les premières nouvelles clientes arriver ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Une fiche Google Business optimisée commence à générer des appels et réservations en{' '}
                  <strong>2 à 6 semaines</strong>. La réservation en ligne, elle, convertit dès le premier jour si tu
                  as déjà du trafic (recherche Google, Instagram, bouche-à-oreille).
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Faut-il faire de la publicité Instagram ou Facebook pour remplir un salon ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Non, pas en priorité. Les 3 leviers gratuits (Google Business, réservation en ligne sur ta page,
                  parrainage client) remplissent un agenda avant même de penser aux ads. La pub a du sens une fois
                  que ces fondations convertissent.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Quel est le meilleur moyen d&apos;attirer de nouvelles clientes sans budget ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Le parrainage client. Une cliente fidèle qui ramène 2 amies équivaut à une campagne publicitaire
                  gratuite. Avec un programme de fidélité qui récompense la parrain et la filleule, tu transformes
                  ton fichier client en canal d&apos;acquisition.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Comment faire quand on est débordée et qu&apos;on n&apos;a pas le temps de faire du marketing ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Automatise. <strong>Réservation en ligne 24h/24</strong>, relances clients automatiques,{' '}
                  <strong>demande d&apos;avis Google</strong> après chaque passage : trois outils qui tournent seuls
                  et rapportent des clientes sans travail quotidien.
                </p>
              </div>
            </div>
          </section>

          {/* CTA encart */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-8 text-center text-white">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-4 opacity-90" />
            <h3 className="text-xl sm:text-2xl font-bold mb-3">
              Lance les 3 piliers en une seule fois avec Qarte
            </h3>
            <p className="text-indigo-100 mb-6 max-w-xl mx-auto">
              Page salon + réservation en ligne + programme de fidélité + demande d&apos;avis Google automatique.
              Tout est connecté, tu configures en 2 minutes.
            </p>
            <Link
              href="/auth/merchant/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 font-bold rounded-2xl hover:bg-indigo-50 transition-colors"
            >
              Essai gratuit 7 jours
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </article>

        {/* Footer */}
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
