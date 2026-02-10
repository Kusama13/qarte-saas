'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  Users,
  Bell,
  Heart,
  Gift,
  BarChart3,
  ChevronRight,
  Sparkles,
  Target,
  Calendar,
} from 'lucide-react';
import { FacebookPixel } from '@/components/analytics/FacebookPixel';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const tocItems = [
  { id: 'comprendre', label: 'Comprendre la récurrence en institut' },
  { id: 'strategie-fidelite', label: 'Stratégie 1 : Le programme de fidélité multi-services' },
  { id: 'strategie-forfaits', label: 'Stratégie 2 : Les forfaits et abonnements' },
  { id: 'strategie-communication', label: 'Stratégie 3 : La communication entre les visites' },
  { id: 'strategie-experience', label: 'Stratégie 4 : L\'expérience client irréprochable' },
  { id: 'strategie-parrainage', label: 'Stratégie 5 : Le parrainage client' },
  { id: 'mesurer', label: 'Mesurer la récurrence' },
];

export default function AugmenterRecurrenceInstitutPage() {
  return (
    <>
      <FacebookPixel />
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-indigo-700">
              Qarte
            </Link>
            <Link
              href="/essai-gratuit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Essai gratuit
            </Link>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="max-w-3xl mx-auto px-6 pt-8">
          <nav className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/blog" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              Blog
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-600">Institut de beauté</span>
          </nav>
        </div>

        {/* Article */}
        <article className="max-w-3xl mx-auto px-6 py-12">
          {/* Title */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                Institut de beauté
              </span>
              <span className="text-xs text-gray-400">7 min de lecture</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
              Comment augmenter la récurrence client en{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                institut de beauté
              </span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed">
              Vos clientes viennent une fois puis disparaissent ? Vous n&apos;êtes pas seule.
              En institut de beauté, le vrai défi n&apos;est pas d&apos;attirer de nouvelles clientes,
              c&apos;est de les faire revenir. Voici les stratégies qui fonctionnent.
            </p>
          </motion.div>

          {/* Table of contents */}
          <motion.nav
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-10 mb-12 p-6 bg-gray-50 rounded-2xl border border-gray-100"
          >
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              Sommaire
            </h2>
            <ol className="space-y-2.5">
              {tocItems.map((item, index) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-indigo-600 transition-colors group"
                  >
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-400 group-hover:border-indigo-300 group-hover:text-indigo-600 transition-colors">
                      {index + 1}
                    </span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </motion.nav>

          {/* Introduction */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <p className="text-gray-700 leading-relaxed mb-4">
              En institut de beauté, le bouche-à-oreille et les réseaux sociaux font généralement
              bien leur travail pour attirer des clientes. Le vrai problème se situe après la
              première visite : comment transformer un passage unique en rendez-vous régulier ?
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Les chiffres parlent d&apos;eux-mêmes : une cliente qui vient <strong>1 fois par mois</strong> au
              lieu de <strong>1 fois tous les 3 mois</strong> représente <strong>3 fois plus de chiffre d&apos;affaires</strong>.
              Et acquérir une nouvelle cliente coûte en moyenne <strong>5 à 7 fois plus cher</strong> que de
              fidéliser une cliente existante.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Cet article vous présente 5 stratégies concrètes et éprouvées pour augmenter la
              fréquence de visite de vos clientes. Pas de théorie creuse : des actions
              que vous pouvez mettre en place dès cette semaine.
            </p>
          </motion.section>

          {/* Section 1: Comprendre la récurrence */}
          <motion.section
            id="comprendre"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="mb-14"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Comprendre la récurrence en institut
              </h2>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">
              Avant de vouloir augmenter la fréquence de visite, il faut comprendre les rythmes
              naturels de chaque service. En institut de beauté, tous les soins n&apos;ont pas le
              même cycle de renouvellement :
            </p>

            <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Fréquences naturelles par service</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700 font-medium">Epilation (cire, laser)</span>
                  <span className="text-indigo-600 font-semibold">Toutes les 4 à 6 semaines</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700 font-medium">Soin du visage</span>
                  <span className="text-indigo-600 font-semibold">1 fois par mois</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700 font-medium">Manucure / pédicure</span>
                  <span className="text-indigo-600 font-semibold">Toutes les 3 à 4 semaines</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700 font-medium">Massage / modelage</span>
                  <span className="text-indigo-600 font-semibold">Variable (2 à 8 semaines)</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-700 font-medium">Soin corps (gommage, enveloppement)</span>
                  <span className="text-indigo-600 font-semibold">1 fois par mois</span>
                </div>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>La moyenne nationale</strong> en France se situe autour de <strong>4 à 5 visites par an</strong> en
              institut de beauté. C&apos;est peu, surtout quand on sait que les services proposés
              justifient une visite mensuelle, voire bi-mensuelle.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>L&apos;objectif réaliste</strong> : passer à <strong>8 à 10 visites par an</strong>, soit
              pratiquement doubler la fréquence actuelle. Cela représente une visite toutes les
              5 à 6 semaines en moyenne.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Le levier principal pour y parvenir ? <strong>Le cross-selling de services.</strong> Une
              cliente qui vient uniquement pour l&apos;épilation peut aussi être intéressée par un soin
              visage. En multipliant les types de services consommés, vous multipliez mécaniquement
              les occasions de visite.
            </p>
          </motion.section>

          {/* Section 2: Programme de fidélité multi-services */}
          <motion.section
            id="strategie-fidelite"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="mb-14"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-violet-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Stratégie 1 : Le programme de fidélité multi-services
              </h2>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">
              L&apos;erreur classique en institut de beauté est de créer un programme de fidélité
              limité à un seul type de service : &laquo; 10 épilations, la 11ème offerte &raquo;.
              Ce type de programme ne pousse pas au cross-selling et n&apos;accélère pas la récurrence.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              L&apos;approche qui fonctionne : un programme <strong>multi-services</strong> où chaque visite
              compte, quel que soit le soin réalisé. Votre cliente vient pour une épilation ?
              Un tampon. Un soin visage ? Un tampon aussi. Un massage ? Encore un tampon.
            </p>

            <div className="bg-indigo-50 rounded-2xl p-6 mb-6 border border-indigo-100">
              <h3 className="text-lg font-bold text-indigo-900 mb-3">
                Exemple concret
              </h3>
              <p className="text-indigo-800 leading-relaxed mb-3">
                &laquo; Votre 8ème soin est offert ! Epilation, soin visage, ou massage : c&apos;est vous qui choisissez. &raquo;
              </p>
              <p className="text-indigo-700 text-sm leading-relaxed">
                Avec cette formule, une cliente qui vient pour une épilation toutes les 6 semaines
                est incitée à ajouter un soin visage entre deux rendez-vous pour remplir
                sa carte plus vite. Résultat : elle passe de 8 visites/an à 12-14 visites/an.
              </p>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-3">Pourquoi ça fonctionne</h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  <strong>Effet psychologique de progression</strong> : la cliente voit sa carte se remplir
                  et veut atteindre la récompense. C&apos;est le même mécanisme que les points
                  de fidélité des grandes enseignes, appliqué à votre institut.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  <strong>Découverte de nouveaux services</strong> : une cliente qui n&apos;aurait jamais pensé
                  à réserver un modelage le fait pour &laquo; avancer sa carte &raquo;. Et souvent,
                  elle adore et revient pour ce service.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  <strong>Simplicité pour le personnel</strong> : pas besoin de gérer des programmes
                  différents par service. Un seul système, clair et facile à expliquer.
                </span>
              </li>
            </ul>

            <p className="text-gray-700 leading-relaxed">
              Avec un outil comme <strong>Qarte</strong>, ce programme se met en place en 2 minutes :
              vous définissez le nombre de tampons (8, 10, 12), la récompense, et chaque passage
              est enregistré via un simple QR code. Plus besoin de cartes papier qui se perdent.
            </p>
          </motion.section>

          {/* Section 3: Forfaits et abonnements */}
          <motion.section
            id="strategie-forfaits"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="mb-14"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Stratégie 2 : Les forfaits et abonnements
              </h2>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">
              L&apos;abonnement est le Graal de la récurrence. Il transforme une relation ponctuelle
              en engagement régulier. De plus en plus d&apos;instituts de beauté proposent des
              formules mensuelles ou des cartes prépayées, et ça change tout.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-3">Option 1 : Le forfait mensuel</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Proposez un abonnement mensuel qui inclut 2 soins par mois à un tarif préférentiel.
              Par exemple : <strong>89 euros/mois pour 2 soins au choix</strong> (valeur réelle : 110 euros).
              La cliente économise, et vous garantissez 2 visites par mois minimum.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-3">Option 2 : La carte prépayée</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Vendez des packs de séances : <strong>10 soins au prix de 8</strong>. La cliente
              pré-paye et s&apos;engage psychologiquement à utiliser ses crédits. Elle a déjà payé,
              donc elle revient. Et souvent, elle achète un nouveau pack avant d&apos;avoir terminé le premier.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-3">Les avantages pour votre institut</h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  <strong>Trésorerie anticipée</strong> : vous encaissez aujourd&apos;hui pour des services
                  rendus demain. Fini les mois creux imprévisibles.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  <strong>Engagement de la cliente</strong> : une fois l&apos;abonnement souscrit, la cliente
                  ne va pas chez la concurrence. Elle a un &laquo; crédit &raquo; chez vous.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  <strong>Meilleure planification</strong> : vous pouvez anticiper votre planning
                  et optimiser vos créneaux.
                </span>
              </li>
            </ul>

            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
              <h3 className="text-lg font-bold text-amber-900 mb-2">
                Attention : ne bradez pas vos prix
              </h3>
              <p className="text-amber-800 text-sm leading-relaxed">
                La réduction proposée dans un forfait ne doit pas dépasser 15 à 20%.
                L&apos;objectif n&apos;est pas de casser vos prix, mais d&apos;offrir de la <strong>valeur ajoutée</strong> :
                un diagnostic peau offert, un mini-soin bonus, ou un accès prioritaire
                aux nouveaux soins. La perception de valeur compte plus que le montant
                de la remise.
              </p>
            </div>
          </motion.section>

          {/* Section 4: Communication entre les visites */}
          <motion.section
            id="strategie-communication"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="mb-14"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Stratégie 3 : La communication entre les visites
              </h2>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">
              Entre deux rendez-vous, votre cliente est sollicitée par des dizaines de marques,
              d&apos;instituts concurrents et de publicités. Si vous ne communiquez pas avec elle,
              elle vous oublie. C&apos;est aussi simple que ça.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              L&apos;objectif n&apos;est pas de harceler vos clientes de messages, mais de rester
              présente dans leur esprit au bon moment, avec le bon message.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-3">Les push notifications</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              C&apos;est le canal le plus efficace pour les instituts de beauté. Avec un outil comme Qarte,
              vous pouvez envoyer des notifications push directement sur le téléphone de vos clientes.
              Quelques exemples :
            </p>
            <ul className="space-y-2 mb-6 ml-4">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-indigo-500 mt-1 flex-shrink-0" />
                <span className="text-gray-700">
                  <strong>Rappel de soin</strong> : &laquo; Votre dernière épilation date de 5 semaines.
                  On vous réserve un créneau ? &raquo;
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-indigo-500 mt-1 flex-shrink-0" />
                <span className="text-gray-700">
                  <strong>Promotion flash</strong> : &laquo; -20% sur le soin du visage cette semaine,
                  il reste 3 créneaux &raquo;
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-indigo-500 mt-1 flex-shrink-0" />
                <span className="text-gray-700">
                  <strong>Nouveauté</strong> : &laquo; Nouveau soin anti-âge disponible, découvrez-le
                  avec 10% de réduction &raquo;
                </span>
              </li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mb-3">L&apos;email post-visite</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              24 à 48 heures après la visite, envoyez un email avec des conseils d&apos;entretien
              personnalisés. Après un soin visage, partagez une routine de soin adaptée au
              type de peau de la cliente. Après une épilation, rappelez les gestes à faire
              pour éviter les poils incarnés. Ce type de contenu montre votre expertise et
              crée un lien de confiance.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-3">Les réseaux sociaux</h3>
            <p className="text-gray-700 leading-relaxed">
              Publiez régulièrement des avant/après (avec l&apos;accord de la cliente), des
              témoignages, des coulisses de votre institut. Une cliente qui vous suit sur
              Instagram voit votre travail régulièrement et pense à réserver quand elle
              tombe sur un résultat qui lui plaît. C&apos;est du marketing passif extrêmement
              efficace.
            </p>
          </motion.section>

          {/* Section 5: Expérience client */}
          <motion.section
            id="strategie-experience"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="mb-14"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                <Heart className="w-5 h-5 text-pink-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Stratégie 4 : L&apos;expérience client irréprochable
              </h2>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">
              Selon une étude PwC, <strong>86% des clients sont prêts à payer plus pour une
              meilleure expérience</strong>. En institut de beauté, l&apos;expérience client est
              votre atout numéro un. C&apos;est elle qui fait la différence entre une cliente
              qui revient et une cliente qui essaie un autre institut.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-3">Le premier contact</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              L&apos;accueil doit être irréprochable : un sourire sincère, une boisson offerte
              (thé, eau aromatisée, café), et un espace d&apos;attente soigné. Les 30 premières
              secondes déterminent la perception globale de la visite. Pensez aussi à la
              musique d&apos;ambiance, à la température, et aux odeurs. Chaque détail sensoriel
              contribue à l&apos;expérience.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-3">Pendant le soin</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Pratiquez l&apos;écoute active. Chaque cliente a des préoccupations différentes.
              Posez des questions, notez les préférences (température de la cire, pression
              du massage, produits préférés) et personnalisez le soin. Une cliente qui se
              sent écoutée et comprise reviendra naturellement.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Le conseil personnalisé est un autre levier puissant. Ne vous contentez pas
              de réaliser le soin : expliquez pourquoi vous utilisez tel produit, recommandez
              une routine adaptée, suggérez un complément (sans être insistante). Vous passez
              du statut de &laquo; prestataire &raquo; à celui de &laquo; conseillère beauté de confiance &raquo;.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-3">Après la visite</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Demandez un feedback, soit à chaud (&laquo; Comment vous sentez-vous après ce soin ? &raquo;),
              soit par message dans les 24 heures. Ce geste montre que vous vous souciez
              de la satisfaction de la cliente au-delà du simple passage en caisse.
            </p>

            <div className="bg-pink-50 rounded-2xl p-6 border border-pink-100">
              <h3 className="text-lg font-bold text-pink-900 mb-3">
                Les petits détails qui font toute la différence
              </h3>
              <ul className="space-y-2 text-sm text-pink-800">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                  Se souvenir du prénom et des préférences de la cliente
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                  Un petit mot pour son anniversaire (avec une réduction surprise)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                  Un échantillon offert à la fin du soin
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                  Proposer le prochain rendez-vous avant que la cliente ne parte
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                  Un espace Instagram-friendly pour que les clientes partagent leur expérience
                </li>
              </ul>
            </div>
          </motion.section>

          {/* Section 6: Parrainage */}
          <motion.section
            id="strategie-parrainage"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="mb-14"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Gift className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Stratégie 5 : Le parrainage client
              </h2>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">
              Le parrainage est une stratégie à double tranchant positif : il récompense
              votre cliente existante tout en vous apportant une nouvelle cliente. Et les
              chiffres sont éloquents : <strong>les clientes acquises par parrainage sont
              4 fois plus fidèles</strong> que celles acquises par la publicité.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Pourquoi ? Parce qu&apos;une recommandation personnelle crée une confiance
              immédiate. La nouvelle cliente arrive avec un a priori positif et une
              attente alignée avec la réalité de votre institut.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-3">Comment structurer votre programme de parrainage</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Le principe est simple : &laquo; Parrainez une amie et gagnez des points
              de fidélité (ou un soin offert). &raquo; La marraine gagne un avantage, et la
              filleule bénéficie d&apos;une offre de bienvenue. Tout le monde y gagne.
            </p>

            <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Exemple de programme de parrainage</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-gray-900 text-sm">La marraine</span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Gagne 2 tampons bonus sur sa carte de fidélité pour chaque amie parrainée
                    (soit l&apos;équivalent de 2 visites offertes).
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-pink-600" />
                    <span className="font-bold text-gray-900 text-sm">La filleule</span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Bénéficie de -15% sur son premier soin et démarre sa carte de fidélité
                    avec 1 tampon bonus.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">
              L&apos;astuce pour que le parrainage fonctionne : facilitez le processus au maximum.
              Si la cliente doit remplir un formulaire papier ou appeler votre institut,
              elle ne le fera pas. Avec un outil digital comme Qarte, le parrainage se fait
              en un clic : la cliente partage un lien, et la filleule s&apos;inscrit automatiquement
              à votre programme de fidélité.
            </p>

            <p className="text-gray-700 leading-relaxed">
              Pensez aussi à <strong>rappeler régulièrement</strong> l&apos;existence du programme
              de parrainage. Au moment du passage en caisse, sur vos réseaux sociaux,
              dans vos emails. La plupart des clientes satisfaites sont prêtes à
              recommander votre institut, elles ont juste besoin qu&apos;on le leur rappelle.
            </p>
          </motion.section>

          {/* Section 7: Mesurer la récurrence */}
          <motion.section
            id="mesurer"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="mb-14"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Mesurer la récurrence
              </h2>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">
              Ce qui ne se mesure pas ne s&apos;améliore pas. Pour savoir si vos efforts portent
              leurs fruits, vous devez suivre quelques indicateurs clés (KPIs) régulièrement.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-3">Les 3 KPIs essentiels</h3>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-gray-900">Fréquence de visite moyenne</h4>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Nombre total de visites divisé par le nombre de clientes actives sur une
                  période donnée (mois, trimestre, année). Objectif : passer de 4-5 visites/an
                  à 8-10 visites/an.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-gray-900">Taux de rétention</h4>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Pourcentage de clientes qui reviennent dans les 3 mois suivant leur
                  dernière visite. Un bon taux de rétention en institut se situe au-dessus
                  de 60%. Si vous êtes en dessous de 40%, il y a un problème à identifier
                  (expérience client, prix, communication).
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-gray-900">Panier moyen</h4>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Montant moyen dépensé par visite. Si votre fréquence augmente mais que le
                  panier moyen diminue, vous avez un problème de pricing. L&apos;idéal est que
                  les deux augmentent en parallèle grâce au cross-selling.
                </p>
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-3">Les outils pour mesurer</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Vous n&apos;avez pas besoin d&apos;un logiciel complexe. Un simple tableur Google Sheets
              peut suffire au départ. Notez chaque mois le nombre de visites et le nombre
              de clientes actives. Calculez la fréquence moyenne et suivez son évolution.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Avec <strong>Qarte</strong>, ces données sont disponibles automatiquement dans votre
              tableau de bord. Vous voyez en temps réel le nombre de visites par cliente,
              les clientes inactives à relancer, et l&apos;évolution de votre récurrence.
            </p>

            <div className="bg-teal-50 rounded-2xl p-6 border border-teal-100">
              <h3 className="text-lg font-bold text-teal-900 mb-2">
                Objectif réaliste
              </h3>
              <p className="text-teal-800 text-sm leading-relaxed">
                Visez <strong>+20% de fréquence de visite en 6 mois</strong>. C&apos;est un objectif
                ambitieux mais atteignable si vous combinez au moins 2 ou 3 des stratégies
                présentées dans cet article. Au-delà de 6 mois, les effets se cumulent
                et la croissance s&apos;accélère grâce au bouche-à-oreille et au parrainage.
              </p>
            </div>
          </motion.section>

          {/* Conclusion */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="mb-14"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              En résumé
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Augmenter la récurrence client en institut de beauté repose sur 5 piliers
              complémentaires : un programme de fidélité multi-services, des forfaits
              qui engagent, une communication régulière entre les visites, une expérience
              client irréprochable, et un programme de parrainage qui s&apos;auto-alimente.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Vous n&apos;avez pas besoin de tout mettre en place en même temps. Commencez par
              le programme de fidélité (c&apos;est le plus rapide à déployer et le plus impactant),
              puis ajoutez progressivement les autres leviers.
            </p>
            <p className="text-gray-700 leading-relaxed">
              L&apos;essentiel est de <strong>commencer maintenant</strong>. Chaque semaine sans programme
              de fidélité est une semaine où des clientes satisfaites ne reviennent pas
              faute de petit coup de pouce.
            </p>
          </motion.section>
        </article>

        {/* CTA Section */}
        <section className="py-16 sm:py-20 bg-gradient-to-r from-indigo-600 to-violet-600">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Lancez votre programme de fidélité avec Qarte
              </h2>
              <p className="text-indigo-100 mb-3 text-lg">
                Carte de fidélité digitale, push notifications, parrainage, statistiques.
                Tout ce dont votre institut a besoin, dans un seul outil.
              </p>
              <p className="text-indigo-200 mb-8 text-sm">
                19 euros/mois &middot; Sans engagement &middot; Prêt en 2 minutes
              </p>
              <Link
                href="/essai-gratuit"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 font-bold rounded-2xl hover:bg-indigo-50 transition-colors text-lg"
              >
                Essayer gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </section>

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
