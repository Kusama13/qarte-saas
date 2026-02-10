'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  Heart,
  Users,
  Bell,
  Star,
  Gift,
  Smartphone,
  MessageCircle,
  AlertTriangle,
  CheckCircle,
  BookOpen,
} from 'lucide-react';
import { FacebookPixel } from '@/components/analytics/FacebookPixel';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const tocItems = [
  { id: 'pourquoi-ne-reviennent-pas', label: 'Pourquoi les clientes ne reviennent pas' },
  { id: 'strategies-fidelisation', label: 'Les 7 stratégies qui fonctionnent' },
  { id: 'programme-fidelite', label: 'Programme de fidélité : le levier n\u00b01' },
  { id: 'erreurs-a-eviter', label: 'Les erreurs à éviter' },
  { id: 'lancer-programme', label: 'Lancez votre programme' },
];

export default function FideliserClientesSalonCoiffurePage() {
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

        {/* Breadcrumb + Article Header */}
        <section className="py-12 sm:py-16 bg-gradient-to-b from-indigo-50/50 to-white">
          <div className="max-w-3xl mx-auto px-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <Link href="/blog" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  Blog
                </Link>
                <span>/</span>
                <span className="text-gray-600">Coiffure</span>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 mb-6">
                <span className="inline-flex px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                  Coiffure
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  8 min de lecture
                </span>
                <span className="text-sm text-gray-400">10 fév. 2025</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                Comment fidéliser ses clientes en salon de coiffure : le guide complet
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                70 % des nouvelles clientes ne reviennent pas après leur première visite en salon.
                Pourtant, fidéliser une cliente existante coûte <strong className="text-gray-900">5 fois moins cher</strong> que
                d&apos;en acquérir une nouvelle. Voici les stratégies concrètes qui font la différence.
              </p>
            </motion.div>

            <div className="mt-8 rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80"
                alt="Intérieur d'un salon de coiffure moderne et chaleureux"
                width={1200}
                height={675}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        </section>

        {/* Table of Contents */}
        <div className="max-w-3xl mx-auto px-6 py-8">
          <motion.nav
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-50 rounded-2xl p-6 border border-gray-100"
            aria-label="Sommaire"
          >
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
          </motion.nav>
        </div>

        {/* Article Content */}
        <article className="max-w-3xl mx-auto px-6 pb-16">
          {/* --- Section 1: Intro contextuelle --- */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Vous avez investi du temps et de l&apos;argent pour attirer de nouvelles clientes dans votre salon :
              publicité Instagram, bouche-à-oreille, promotions de lancement... Mais combien d&apos;entre elles
              reviennent pour une deuxième visite ?
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Les chiffres du secteur de la coiffure sont sans appel : <strong className="text-gray-900">entre 60 et 70 %
              des nouvelles clientes ne prennent pas de second rendez-vous</strong>. Ce n&apos;est pas forcément
              parce que la prestation était mauvaise. C&apos;est souvent parce que rien ne les incite activement
              à revenir chez vous plutôt qu&apos;ailleurs.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Or, la fidélisation est le levier de rentabilité le plus puissant pour un salon de coiffure.
              Une cliente fidèle dépense en moyenne <strong className="text-gray-900">67 % de plus</strong> qu&apos;une
              nouvelle cliente. Elle recommande votre salon à son entourage. Et elle est bien moins sensible
              aux promotions de vos concurrents.
            </p>
            <p className="text-base text-gray-700 leading-relaxed">
              Dans ce guide, nous allons voir concrètement pourquoi vos clientes ne reviennent pas, quelles
              stratégies fonctionnent réellement, et comment mettre en place un programme de fidélité efficace
              sans y passer des heures.
            </p>
          </motion.div>

          {/* --- Section 2: Pourquoi les clientes ne reviennent pas --- */}
          <motion.section
            id="pourquoi-ne-reviennent-pas"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="mb-16 scroll-mt-24"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Users className="w-7 h-7 text-indigo-600 flex-shrink-0" />
              Pourquoi les clientes ne reviennent pas
            </h2>

            <p className="text-base text-gray-700 leading-relaxed mb-6">
              Avant de parler de solutions, il faut comprendre le problème. En interrogeant des dizaines
              de gérants de salons, trois raisons reviennent systématiquement.
            </p>

            <div className="space-y-6">
              {/* Raison 1 */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  1. Elles oublient tout simplement
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  C&apos;est la raison n&deg;1, et la plus frustrante. Votre cliente a aimé sa coupe, elle est
                  repartie satisfaite... mais six semaines plus tard, quand elle a besoin d&apos;un rafraîchissement,
                  elle ne pense pas à vous. Elle tape &quot;coiffeur près de moi&quot; sur Google et tombe sur un
                  concurrent. Sans rappel, sans signal, vous n&apos;existez plus dans son quotidien. Ce n&apos;est pas
                  un problème de qualité, c&apos;est un problème de visibilité.
                </p>
              </div>

              {/* Raison 2 */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  2. Pas de raison de revenir chez vous plutôt qu&apos;un autre
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Si votre salon n&apos;offre rien de plus que la coupe elle-même, votre cliente n&apos;a aucune raison
                  rationnelle de vous être fidèle. Un programme de fidélité, un avantage exclusif ou simplement
                  une relation personnalisée créent un &quot;coût de sortie&quot; psychologique : quitter votre salon,
                  c&apos;est perdre ses points, son historique, sa relation avec sa coiffeuse. Sans cela, chaque
                  visite repart de zéro.
                </p>
              </div>

              {/* Raison 3 */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  3. Une expérience qui n&apos;a pas marqué
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Attention impatiente à la réception, temps d&apos;attente long sans explication, ambiance bruyante,
                  impression de ne pas être écoutée sur ce qu&apos;elle voulait... Il ne faut pas grand-chose pour
                  qu&apos;une première visite laisse un goût mitigé. Et dans la coiffure, une expérience &quot;correcte&quot;
                  ne suffit pas. Vos clientes recherchent un moment agréable, un échange humain. Si elles
                  ne l&apos;ont pas trouvé, elles iront le chercher ailleurs.
                </p>
              </div>
            </div>
          </motion.section>

          <div className="mb-16 rounded-2xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80"
              alt="Cliente souriante dans un salon de coiffure"
              width={1200}
              height={675}
              className="w-full h-auto"
            />
          </div>

          {/* --- Section 3: Les 7 stratégies --- */}
          <motion.section
            id="strategies-fidelisation"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="mb-16 scroll-mt-24"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Heart className="w-7 h-7 text-indigo-600 flex-shrink-0" />
              Les 7 stratégies qui fonctionnent vraiment
            </h2>

            <p className="text-base text-gray-700 leading-relaxed mb-8">
              Voici les leviers de fidélisation qui ont fait leurs preuves en salon de coiffure, classés
              par ordre d&apos;impact. Vous n&apos;avez pas besoin de tout appliquer en même temps : commencez
              par les deux premiers, et ajoutez les autres progressivement.
            </p>

            {/* Stratégie 1 */}
            <div className="mb-10">
              <div className="flex items-start gap-4 mb-3">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-sm font-bold">
                  1
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Mettre en place un programme de fidélité
                  </h3>
                  <span className="inline-block mt-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    +25 % de rétention en moyenne
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed ml-12">
                C&apos;est le levier le plus puissant et le plus mesurable. Un programme de fidélité bien conçu
                donne à vos clientes une raison concrète de revenir : chaque visite les rapproche d&apos;une
                récompense. Les salons qui ont un programme actif constatent en moyenne 25 % de visites
                supplémentaires par cliente et par an. Nous détaillerons ce point dans la section suivante.
              </p>
            </div>

            {/* Stratégie 2 */}
            <div className="mb-10">
              <div className="flex items-start gap-4 mb-3">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-sm font-bold">
                  2
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-indigo-500" />
                    Envoyer des rappels de rendez-vous automatiques
                  </h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed ml-12">
                Un SMS ou une notification push 48 heures avant le rendez-vous réduit les no-shows de 30 à 40 %.
                Mais au-delà de la confirmation, pensez au <strong>rappel proactif</strong> : si une cliente
                n&apos;est pas revenue depuis 6 semaines, un message automatique du type &quot;Votre coiffeuse vous
                attend ! Prenez rendez-vous en un clic&quot; peut relancer la relation. Ce type de rappel peut
                être automatisé facilement avec un outil digital.
              </p>
            </div>

            {/* Stratégie 3 */}
            <div className="mb-10">
              <div className="flex items-start gap-4 mb-3">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-sm font-bold">
                  3
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Offrir une expérience mémorable au salon
                  </h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed ml-12">
                Les petites attentions coûtent presque rien mais marquent les esprits. Proposez un thé, un café
                ou une eau aromatisée à l&apos;arrivée. Soignez l&apos;ambiance : musique douce, éclairage chaleureux,
                propreté impeccable. Prenez 2 minutes pour discuter avec votre cliente de ses attentes avant
                de commencer. Ces détails transforment une &quot;coupe de cheveux&quot; en un <strong>moment de
                bien-être</strong> que votre cliente aura envie de revivre. Les salons qui investissent dans
                l&apos;expérience client voient leur taux de rebooking augmenter de 15 à 20 %.
              </p>
            </div>

            {/* Stratégie 4 */}
            <div className="mb-10">
              <div className="flex items-start gap-4 mb-3">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-sm font-bold">
                  4
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-indigo-500" />
                    Être présent sur les réseaux sociaux
                  </h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed ml-12">
                Instagram est le réseau n&deg;1 pour les salons de coiffure. Publiez des photos avant/après
                (avec l&apos;accord de la cliente), partagez les coulisses de votre salon, montrez votre équipe.
                L&apos;objectif n&apos;est pas d&apos;avoir des milliers de followers, mais de rester visible dans le fil
                d&apos;actualité de vos clientes existantes. Si une cliente voit vos réalisations chaque semaine
                sur son téléphone, elle pensera à vous au moment de prendre son prochain rendez-vous.
                Publiez 3 à 4 fois par semaine pour rester dans les esprits.
              </p>
            </div>

            {/* Stratégie 5 */}
            <div className="mb-10">
              <div className="flex items-start gap-4 mb-3">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-sm font-bold">
                  5
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Star className="w-5 h-5 text-indigo-500" />
                    Demander activement des avis Google
                  </h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed ml-12">
                Les avis Google ne servent pas seulement à attirer de nouvelles clientes. Ils renforcent aussi
                la fidélité. Quand une cliente prend le temps de vous laisser un avis 5 étoiles, elle crée un
                lien psychologique avec votre salon. Elle a publiquement recommandé votre établissement, elle
                est donc plus encline à y revenir (c&apos;est le principe de l&apos;engagement, bien connu en
                psychologie). Demandez systématiquement un avis à la fin de chaque prestation, par exemple
                via un QR code affiché en caisse. Un salon avec 50+ avis à 4,5 étoiles inspire confiance
                et se distingue immédiatement de la concurrence locale.
              </p>
            </div>

            {/* Stratégie 6 */}
            <div className="mb-10">
              <div className="flex items-start gap-4 mb-3">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-sm font-bold">
                  6
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-indigo-500" />
                    Proposer des offres personnalisées
                  </h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed ml-12">
                Un message d&apos;anniversaire avec une réduction de 10 %, une offre spéciale pour la rentrée, une
                promotion ciblée sur un soin que votre cliente n&apos;a jamais essayé... La personnalisation montre
                que vous connaissez votre cliente et que vous pensez à elle individuellement. Les offres
                personnalisées ont un taux de conversion 3 fois supérieur aux promotions génériques envoyées
                à toute votre base. L&apos;astuce : utilisez un outil qui collecte automatiquement les dates
                d&apos;anniversaire et l&apos;historique de visites pour déclencher ces offres sans effort de votre part.
              </p>
            </div>

            {/* Stratégie 7 */}
            <div className="mb-10">
              <div className="flex items-start gap-4 mb-3">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-sm font-bold">
                  7
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-indigo-500" />
                    Former son équipe à la relation client
                  </h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed ml-12">
                Votre équipe est le visage de votre salon. Même avec le meilleur programme de fidélité du monde,
                une coiffeuse qui ne sourit pas, ne pose pas de questions et ne crée pas de lien avec la cliente
                va générer du turnover. Formez vos employé(e)s à trois réflexes simples : <strong>accueillir
                chaque cliente par son prénom</strong>, <strong>écouter avant de proposer</strong>, et
                <strong> proposer le prochain rendez-vous avant le départ</strong>. Ce dernier point est crucial :
                les salons qui pratiquent le &quot;re-booking&quot; systématique (prise de rendez-vous suivant avant
                de quitter le salon) affichent un taux de rétention supérieur de 30 % à ceux qui ne le font pas.
              </p>
            </div>
          </motion.section>

          <div className="mb-16 rounded-2xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=80"
              alt="Coiffeuse travaillant sur la coiffure d'une cliente"
              width={1200}
              height={675}
              className="w-full h-auto"
            />
          </div>

          {/* --- Section 4: Programme de fidélité --- */}
          <motion.section
            id="programme-fidelite"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="mb-16 scroll-mt-24"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Gift className="w-7 h-7 text-indigo-600 flex-shrink-0" />
              Programme de fidélité : le levier n&deg;1
            </h2>

            <p className="text-base text-gray-700 leading-relaxed mb-6">
              Parmi toutes les stratégies listées ci-dessus, le programme de fidélité est celle qui a le
              meilleur rapport effort/résultat. Il est mesurable, automatisable et ses effets se voient dès
              les premières semaines. Voyons comment le structurer correctement.
            </p>

            {/* Carte papier vs digitale */}
            <div className="bg-indigo-50 rounded-2xl p-6 sm:p-8 border border-indigo-100 mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Carte papier ou carte digitale ?
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                La carte à tampons papier a longtemps été le standard. Elle a un avantage : elle est simple
                à comprendre. Mais elle a aussi de sérieux inconvénients : <strong>73 % des cartes papier
                sont perdues ou oubliées</strong>, elles sont faciles à falsifier (il suffit d&apos;un tampon
                similaire), et elles ne vous donnent aucune donnée sur le comportement de vos clientes.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                La carte de fidélité digitale résout ces trois problèmes. Elle est stockée sur le téléphone
                de votre cliente (impossible à perdre), chaque scan est sécurisé, et vous obtenez des
                statistiques en temps réel : qui vient, à quelle fréquence, qui décroche.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Pour un comparatif détaillé entre les deux approches, consultez notre article dédié :{' '}
                <Link
                  href="/qarte-vs-carte-papier"
                  className="text-indigo-600 font-semibold hover:text-indigo-700 underline underline-offset-2"
                >
                  Qarte vs carte papier : le comparatif complet
                </Link>
                .
              </p>
            </div>

            {/* Comment structurer les paliers */}
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Comment structurer vos paliers de récompenses
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Le piège classique, c&apos;est de fixer la récompense trop loin. Si votre cliente doit venir
              20 fois avant d&apos;obtenir quoi que ce soit, elle abandonnera mentalement au bout de la 3&egrave;me
              visite. Voici la structure qui fonctionne le mieux en salon de coiffure :
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl p-4">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Palier atteignable : 8 à 10 visites</p>
                  <p className="text-xs text-gray-500 mt-1">
                    C&apos;est le sweet spot pour la coiffure. Une cliente qui vient toutes les 5-6 semaines
                    atteindra la récompense en 10-12 mois. C&apos;est assez proche pour rester motivant, assez
                    loin pour être rentable pour vous.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl p-4">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Récompense perçue comme généreuse</p>
                  <p className="text-xs text-gray-500 mt-1">
                    La récompense doit avoir une valeur perçue élevée. Un soin offert d&apos;une valeur de 30 &euro;
                    après 10 visites à 45 &euro; (soit 450 &euro; de CA), c&apos;est un excellent retour sur
                    investissement pour vous, et votre cliente a l&apos;impression d&apos;un vrai cadeau.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl p-4">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Communication claire dès la première visite</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Votre cliente doit comprendre en 5 secondes comment ça marche.
                    &quot;1 visite = 1 point. 10 points = un soin offert.&quot; Point final. Pas de conditions
                    complexes, pas de petites lignes.
                  </p>
                </div>
              </div>
            </div>

            {/* Exemples concrets */}
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Exemples concrets de programmes qui marchent
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-sm font-bold text-gray-900 mb-2">Salon de coupe classique</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  &quot;Votre 10&egrave;me coupe offerte&quot; — simple, universel, facile à comprendre. Fonctionne
                  très bien pour les coupes hommes/femmes à prix moyen (25-50 &euro;).
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-sm font-bold text-gray-900 mb-2">Salon avec soins premium</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  &quot;Soin Kérastase offert après 8 visites&quot; — la récompense est un soin d&apos;une valeur
                  perçue élevée (30-50 &euro;), ce qui encourage aussi l&apos;upsell sur les visites suivantes.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-sm font-bold text-gray-900 mb-2">Salon coloriste</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  &quot;Balayage offert après 10 prestations couleur&quot; — cible les clientes régulières qui
                  reviennent pour des retouches racines toutes les 4-5 semaines.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-sm font-bold text-gray-900 mb-2">Salon mixte (coupe + barbe)</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  &quot;Taille de barbe offerte après 6 coupes&quot; — le palier est plus bas car la fréquence
                  de visite des hommes est plus élevée (toutes les 3-4 semaines).
                </p>
              </div>
            </div>
          </motion.section>

          {/* --- Section 5: Erreurs à éviter --- */}
          <motion.section
            id="erreurs-a-eviter"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="mb-16 scroll-mt-24"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <AlertTriangle className="w-7 h-7 text-amber-500 flex-shrink-0" />
              Les erreurs à éviter
            </h2>

            <p className="text-base text-gray-700 leading-relaxed mb-6">
              Un programme de fidélité mal conçu peut être pire que pas de programme du tout. Voici les
              trois pièges les plus courants que nous observons en salon.
            </p>

            <div className="space-y-6">
              <div className="border-l-4 border-amber-400 pl-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Erreur n&deg;1 : Une récompense inatteignable
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  &quot;Coupe gratuite après 20 visites&quot; ? Votre cliente fait le calcul : à raison d&apos;une visite
                  toutes les 6 semaines, il lui faudra presque <strong>2 ans et demi</strong> pour obtenir sa
                  récompense. Elle abandonnera l&apos;idée avant même de commencer. Restez entre 6 et 10 visites
                  maximum. Si le palier vous semble trop généreux, ajustez la récompense plutôt que le nombre
                  de visites. Mieux vaut offrir un brushing (valeur 20 &euro;) après 8 visites qu&apos;une coupe
                  complète (valeur 45 &euro;) après 20.
                </p>
              </div>

              <div className="border-l-4 border-amber-400 pl-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Erreur n&deg;2 : Ne pas communiquer sur le programme
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Vous avez mis en place un super programme, mais personne ne le sait. Votre QR code est caché
                  derrière la caisse, vos coiffeuses n&apos;en parlent pas, rien n&apos;est mentionné sur vos réseaux
                  sociaux. Résultat : 10 % de vos clientes seulement sont inscrites. La solution : mentionnez
                  le programme <strong>systématiquement</strong> en fin de prestation (&quot;Vous connaissez notre
                  programme fidélité ? Scannez ce QR code, c&apos;est gratuit et votre prochaine visite sera déjà
                  comptée !&quot;). Affichez-le en vitrine, en story Instagram, sur vos cartes de rendez-vous.
                </p>
              </div>

              <div className="border-l-4 border-amber-400 pl-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Erreur n&deg;3 : Oublier de former l&apos;équipe
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Si votre apprentie ou votre coiffeuse ne sait pas comment fonctionne le programme, elle ne
                  le proposera jamais. Pire, si une cliente pose une question et que l&apos;employée ne sait pas
                  répondre, ça donne une image amateure. Prenez 15 minutes en réunion d&apos;équipe pour expliquer
                  le programme, faire un essai, et définir le &quot;script&quot; : à quel moment le proposer, que dire,
                  comment scanner. 15 minutes de formation = des mois de résultats.
                </p>
              </div>
            </div>
          </motion.section>

          <div className="mb-16 rounded-2xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80"
              alt="Outils et accessoires de salon de coiffure professionnel"
              width={1200}
              height={675}
              className="w-full h-auto"
            />
          </div>

          {/* --- Section 6: CTA --- */}
          <section id="lancer-programme" className="scroll-mt-24">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 rounded-2xl p-8 sm:p-12 text-center"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Lancez votre programme de fidélité en 2 minutes
              </h2>
              <p className="text-indigo-100 leading-relaxed mb-6 max-w-xl mx-auto">
                Qarte est la carte de fidélité digitale pensée pour les salons de coiffure. Pas d&apos;application
                à télécharger pour vos clientes, pas de matériel à acheter. Un QR code, et c&apos;est parti.
                Vos clientes scannent, cumulent leurs points et reviennent.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                <Link
                  href="/essai-gratuit"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 font-bold rounded-2xl hover:bg-indigo-50 transition-colors text-lg"
                >
                  Essayer gratuitement
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-indigo-200">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  15 jours d&apos;essai gratuit
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  Sans carte bancaire
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  19 &euro;/mois ensuite
                </span>
              </div>
            </motion.div>
          </section>
        </article>

        {/* Related Articles */}
        <section className="py-16 bg-gray-50 border-t border-gray-100">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Articles associés</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link
                href="/blog/programme-fidelite-onglerie-guide"
                className="group block bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md hover:shadow-indigo-500/5 transition-all"
              >
                <span className="inline-flex px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full mb-2">
                  Onglerie
                </span>
                <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-snug">
                  Programme fidélité onglerie : le guide complet
                </p>
              </Link>
              <Link
                href="/blog/augmenter-recurrence-client-institut-beaute"
                className="group block bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md hover:shadow-indigo-500/5 transition-all"
              >
                <span className="inline-flex px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full mb-2">
                  Institut
                </span>
                <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-snug">
                  Comment augmenter la récurrence client en institut de beauté
                </p>
              </Link>
            </div>
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
