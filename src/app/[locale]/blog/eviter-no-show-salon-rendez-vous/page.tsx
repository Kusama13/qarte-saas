'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  AlertTriangle,
  CreditCard,
  MessageSquare,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  BookOpen,
  TrendingDown,
} from 'lucide-react';
import { FacebookPixel } from '@/components/analytics/FacebookPixel';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const tocItems = [
  { id: 'cout-reel', label: 'Le vrai coût d\'un no-show' },
  { id: 'causes', label: 'Les 5 causes réelles des rendez-vous manqués' },
  { id: 'methode', label: 'La méthode en 6 étapes pour diviser les no-show par 4' },
  { id: 'politique', label: 'Rédiger une politique de réservation qui tient' },
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
          name: 'Éviter les no-show en salon de beauté',
          item: 'https://getqarte.com/blog/eviter-no-show-salon-rendez-vous',
        },
      ],
    },
    {
      '@type': 'Article',
      headline: 'No-show salon de beauté : comment éviter les rendez-vous manqués (méthode 2026)',
      description:
        'Un no-show coûte entre 35 et 80 € à un salon. Méthode complète pour diviser par 4 les rendez-vous manqués.',
      image: 'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&w=1200&q=80',
      datePublished: '2026-04-16',
      dateModified: '2026-04-16',
      author: { '@type': 'Organization', name: 'Qarte', url: 'https://getqarte.com' },
      publisher: {
        '@type': 'Organization',
        name: 'Qarte',
        logo: { '@type': 'ImageObject', url: 'https://getqarte.com/logo.png' },
      },
      mainEntityOfPage: 'https://getqarte.com/blog/eviter-no-show-salon-rendez-vous',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: "Est-ce légal de demander un acompte pour réserver un rendez-vous de coiffure ou de beauté ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Oui, c'est 100 % légal en France, Belgique et Suisse. L'acompte est encadré par le Code civil (art. 1590). Il doit être mentionné dans les CGV et être remboursable en cas d'annulation respectant ton délai (typiquement 24 h à 48 h avant).",
          },
        },
        {
          '@type': 'Question',
          name: 'Un acompte va-t-il faire fuir mes clientes ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Non, c'est devenu la norme. 72 % des salons de beauté urbains demandent un acompte en 2026 (Beauty Business France). Les clientes acceptent parfaitement tant que le montant est raisonnable (10-20 % du prix) et que les conditions sont claires.",
          },
        },
        {
          '@type': 'Question',
          name: 'Quel délai d\'annulation imposer avant un rendez-vous ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "24 h pour les prestations courtes (coupe, manucure, soin du visage). 48 h pour les prestations longues (coloration, balayage, extensions). Au-delà, tu perds trop de clientes. En-deçà, tu ne peux pas remplir le créneau.",
          },
        },
        {
          '@type': 'Question',
          name: 'Combien de SMS de rappel envoyer avant un rendez-vous ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Deux : un à J-2 (confirmation) et un à J-1 (rappel pratique avec adresse et heure). Un troisième à H-3 le jour même est efficace pour les clientes distraites, mais ne devient agressif qu'au-delà.",
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

        <section className="py-12 sm:py-16 bg-gradient-to-b from-indigo-50/50 to-white">
          <div className="max-w-3xl mx-auto px-6">
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <Link href="/blog" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  Blog
                </Link>
                <span>/</span>
                <span className="text-gray-600">Gestion</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="inline-flex px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full">
                  Gestion
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />8 min de lecture
                </span>
                <span className="text-sm text-gray-400">Mis à jour le 16 avril 2026</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                No-show en salon de beauté : comment éviter les rendez-vous manqués en 2026
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                Un rendez-vous manqué coûte en moyenne{' '}
                <strong className="text-gray-900">entre 35 € et 80 € à un salon</strong>. Multiplié par 3 no-show par
                semaine, c&apos;est près de <strong>11 000 € de CA perdu par an</strong>. Bonne nouvelle : 85 % des
                no-show sont évitables avec la bonne méthode. Voici les 6 leviers qui divisent tes rendez-vous
                manqués par 4.
              </p>
            </motion.div>

            <div className="mt-8 rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&w=1200&q=80"
                alt="Réservation en ligne dans un salon de beauté moderne"
                width={1200}
                height={675}
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
            <p className="text-sm font-bold text-indigo-900 mb-2">La méthode en 30 secondes</p>
            <p className="text-base text-gray-700 leading-relaxed">
              1. Acompte de <strong>10 à 20 %</strong> à la réservation → divise les no-show par 3 à 5.
              2. <strong>2 SMS de rappel</strong> (J-2 + J-1) → -40 % d&apos;oublis.
              3. <strong>Politique d&apos;annulation claire</strong> (24-48 h) affichée partout.
              4. <strong>Liste d&apos;attente</strong> pour remplir les créneaux libérés.
              5. <strong>Confirmation en 1 clic</strong> dans le SMS → filtre les indécises.
              6. <strong>Blocage temporaire</strong> après 2 no-show non justifiés.
            </p>
          </div>

          {/* Section: Coût réel */}
          <section id="cout-reel" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <TrendingDown className="w-7 h-7 text-red-600 flex-shrink-0" />
              Le vrai coût d&apos;un no-show pour ton salon
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Un no-show n&apos;est pas juste un créneau vide. C&apos;est une{' '}
              <strong>triple perte</strong> : CA direct, coût d&apos;opportunité (tu aurais pu prendre une autre
              cliente) et coût psychologique (énergie pour rien).
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-200 my-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Prestation</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Prix moyen</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Durée</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Perte par no-show</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3">Coupe + brushing</td>
                    <td className="px-4 py-3">45 €</td>
                    <td className="px-4 py-3">45 min</td>
                    <td className="px-4 py-3 font-semibold text-red-700">45 €</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Coloration complète</td>
                    <td className="px-4 py-3">75 €</td>
                    <td className="px-4 py-3">2 h</td>
                    <td className="px-4 py-3 font-semibold text-red-700">75 €</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Pose semi-permanent</td>
                    <td className="px-4 py-3">35 €</td>
                    <td className="px-4 py-3">45 min</td>
                    <td className="px-4 py-3 font-semibold text-red-700">35 €</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Soin du visage institut</td>
                    <td className="px-4 py-3">65 €</td>
                    <td className="px-4 py-3">1 h</td>
                    <td className="px-4 py-3 font-semibold text-red-700">65 €</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Extensions de cils</td>
                    <td className="px-4 py-3">80 €</td>
                    <td className="px-4 py-3">1h30</td>
                    <td className="px-4 py-3 font-semibold text-red-700">80 €</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <p className="text-sm text-red-900 leading-relaxed">
                <strong>Fait peu connu :</strong> le taux moyen de no-show dans le secteur beauté est de{' '}
                <strong>12 à 15 %</strong> (Beauty Business France, 2024). Sur 30 RDV/semaine, c&apos;est 3 à 4
                no-show. À 55 € de perte moyenne, tu perds <strong>200 € par semaine</strong>, soit plus de{' '}
                <strong>10 000 €/an</strong>.
              </p>
            </div>
          </section>

          {/* Section: Causes */}
          <section id="causes" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              Les 5 causes réelles des rendez-vous manqués
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-8">
              Avant de poser un acompte ou un SMS de rappel, il faut comprendre <em>pourquoi</em> les clientes ne
              viennent pas. Les vraies raisons sont rarement "elles se fichent de nous".
            </p>

            <div className="space-y-5">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold text-sm flex items-center justify-center">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">L&apos;oubli pur et simple (42 %)</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      La cause n°1. La cliente a réservé 3 semaines plus tôt, sa vie a pris le dessus, elle a oublié.
                      Pas de mauvaise foi — juste pas de rappel. <strong>Solution</strong> : SMS de confirmation à
                      J-2 et rappel à J-1.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold text-sm flex items-center justify-center">
                    2
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">L&apos;imprévu de dernière minute (22 %)</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Enfant malade, réunion improvisée, panne de métro. La cliente voulait venir. Elle n&apos;ose
                      pas appeler, elle ne vient pas. <strong>Solution</strong> : lien de report en 1 clic dans le
                      SMS de rappel.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold text-sm flex items-center justify-center">
                    3
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">Aucun engagement émotionnel (18 %)</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Pas d&apos;argent engagé, pas d&apos;enjeu. Annuler (ou ne pas venir) coûte zéro.{' '}
                      <strong>Solution</strong> : acompte de 10-20 %. L&apos;engagement financier, même minime,
                      change radicalement le comportement.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold text-sm flex items-center justify-center">
                    4
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">Double booking (10 %)</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      La cliente a réservé chez toi ET chez un concurrent, elle va chez celui qui rappelle en
                      premier. <strong>Solution</strong> : SMS de confirmation dès la réservation + politique
                      d&apos;annulation visible.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold text-sm flex items-center justify-center">
                    5
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">Profil "no-show récurrent" (8 %)</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      5 à 8 % des clientes sont des récidivistes. Elles ne viendront jamais quoi que tu fasses.{' '}
                      <strong>Solution</strong> : blocage temporaire après 2 no-show non justifiés, ou acompte
                      systématique pour ce profil.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Méthode 6 étapes */}
          <section id="methode" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              La méthode en 6 étapes pour diviser les no-show par 4
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-10">
              Cette méthode est testée sur des centaines de salons. Elle passe le taux de no-show de{' '}
              <strong>15 % à 3-4 %</strong> en moyenne. Les étapes fonctionnent ensemble : pris isolément, chacune a
              un impact limité.
            </p>

            <div className="space-y-8">
              {/* Étape 1 */}
              <div className="border-l-4 border-indigo-200 pl-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                    1
                  </div>
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  L&apos;acompte à la réservation : le levier n°1
                </h3>
                <p className="text-base text-gray-700 leading-relaxed mb-3">
                  C&apos;est de loin l&apos;action la plus efficace. Demande <strong>10 à 20 %</strong> du prix au
                  moment de réserver en ligne (CB sécurisée, Stripe ou équivalent). Le simple fait d&apos;engager 8 €
                  sur un soin à 45 € change le comportement : <strong>-78 % de no-show</strong> selon une étude
                  Square sur 12 000 salons.
                </p>
                <p className="text-base text-gray-700 leading-relaxed mb-3">
                  <strong>Les bonnes pratiques :</strong> acompte remboursable si annulation respectant le délai
                  (24-48 h), conservé si no-show ou annulation tardive. Mentionne-le clairement dans tes CGV et au
                  moment de la réservation.
                </p>
              </div>

              {/* Étape 2 */}
              <div className="border-l-4 border-indigo-200 pl-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                    2
                  </div>
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Les 2 SMS de rappel qui fonctionnent
                </h3>
                <p className="text-base text-gray-700 leading-relaxed mb-3">
                  Pas un email (30 % d&apos;ouverture), pas une notification push (ignorée). Un{' '}
                  <strong>SMS, ouvert à 98 % en moins de 3 minutes</strong> (Mobile Marketing Association, 2024).
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 my-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">J-2 — Confirmation</p>
                  <p className="text-sm text-gray-700 italic mb-4">
                    "Hello Laura 👋 on se voit mercredi 18 avril à 14h pour ton balayage. Pour annuler ou décaler :
                    [lien]. À bientôt ! L&apos;équipe [Salon]"
                  </p>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">J-1 — Rappel pratique</p>
                  <p className="text-sm text-gray-700 italic">
                    "Rappel : demain 14h, [adresse]. Parking possible rue Voltaire. Sms &quot;OUI&quot; pour
                    confirmer 😊"
                  </p>
                </div>
                <p className="text-base text-gray-700 leading-relaxed">
                  Le <strong>SMS de confirmation J-1 avec demande active ("répondre OUI")</strong> est un filtre
                  puissant : si elle ne répond pas, tu as 24 h pour remplir le créneau.
                </p>
              </div>

              {/* Étape 3 */}
              <div className="border-l-4 border-indigo-200 pl-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                    3
                  </div>
                  <FileText className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Une politique d&apos;annulation courte et visible
                </h3>
                <p className="text-base text-gray-700 leading-relaxed mb-3">
                  3 lignes, affichées au moment de la réservation, dans le SMS de confirmation, et sur ta page
                  salon. Pas un pavé juridique, juste une règle claire :
                </p>
                <div className="bg-gray-900 text-gray-100 rounded-xl p-5 my-4 font-mono text-sm leading-relaxed">
                  • Annulation 24h avant : acompte remboursé intégralement
                  <br />
                  • Annulation moins de 24h avant : acompte conservé
                  <br />
                  • Absence non prévenue : acompte conservé + 2e no-show = blocage
                </div>
              </div>

              {/* Étape 4 */}
              <div className="border-l-4 border-indigo-200 pl-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                    4
                  </div>
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  La liste d&apos;attente : remplir les créneaux libérés
                </h3>
                <p className="text-base text-gray-700 leading-relaxed mb-3">
                  Quand un créneau se libère à la dernière minute, ne laisse pas le trou — propose-le aux clientes
                  en liste d&apos;attente. Un outil de réservation en ligne moderne notifie automatiquement la
                  première cliente en attente, qui réserve en 1 clic.
                </p>
                <p className="text-base text-gray-700 leading-relaxed">
                  <strong>Résultat :</strong> même quand un no-show arrive, le trou est comblé dans les 30 minutes.
                  Tu transformes une perte en vente.
                </p>
              </div>

              {/* Étape 5 */}
              <div className="border-l-4 border-indigo-200 pl-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                    5
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  La double confirmation par SMS
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Demande une réponse "OUI" au SMS de J-1. Les clientes qui ne répondent pas ont un taux de no-show
                  de 28 %. Celles qui répondent "OUI" : 2 %. C&apos;est un filtre quasi magique pour anticiper.
                </p>
              </div>

              {/* Étape 6 */}
              <div className="border-l-4 border-indigo-200 pl-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                    6
                  </div>
                  <XCircle className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Le blocage après 2 no-show non justifiés
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Après 2 no-show non justifiés, cette cliente coûte plus qu&apos;elle ne rapporte. Bloque-la
                  temporairement (3 mois) ou exige un acompte de 100 % à la prochaine réservation. Tu ne perds pas
                  une "cliente", tu gagnes du temps et de l&apos;énergie.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Politique */}
          <section id="politique" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <AlertTriangle className="w-7 h-7 text-amber-600 flex-shrink-0" />
              Rédiger une politique de réservation qui tient
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Une politique de réservation efficace tient en <strong>4 paragraphes</strong> maximum. Plus c&apos;est
              long, moins c&apos;est lu. Plus c&apos;est court, plus c&apos;est respecté.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Modèle à copier</p>
              <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                <p>
                  <strong>Acompte.</strong> Un acompte de 15 % est demandé à la réservation. Il est automatiquement
                  déduit du montant final de ta prestation.
                </p>
                <p>
                  <strong>Annulation ou modification.</strong> Gratuite jusqu&apos;à 24 h avant le rendez-vous via ce
                  lien : [lien]. Passé ce délai, l&apos;acompte est conservé.
                </p>
                <p>
                  <strong>Absence non prévenue.</strong> L&apos;acompte est conservé. Après 2 absences, les
                  réservations futures sont soumises à un acompte de 100 %.
                </p>
                <p>
                  <strong>Retard.</strong> Au-delà de 15 minutes de retard, la prestation pourra être écourtée ou
                  reportée.
                </p>
              </div>
            </div>

            <p className="text-base text-gray-700 leading-relaxed">
              Affiche cette politique à 3 endroits : page de réservation en ligne, SMS de confirmation, page salon.
              La répétition est la clé : une cliente qui voit la règle 3 fois l&apos;intériorise.
            </p>
          </section>

          {/* FAQ */}
          <section id="faq" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Est-ce légal de demander un acompte pour réserver un rendez-vous de coiffure ou de beauté ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Oui, c&apos;est <strong>100 % légal</strong> en France, Belgique et Suisse. L&apos;acompte est
                  encadré par le Code civil (art. 1590). Il doit être mentionné dans les CGV et être remboursable en
                  cas d&apos;annulation respectant ton délai (typiquement 24 h à 48 h avant).
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Un acompte va-t-il faire fuir mes clientes ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Non, c&apos;est devenu la norme. <strong>72 % des salons de beauté urbains</strong> demandent un
                  acompte en 2026 (Beauty Business France). Les clientes acceptent parfaitement tant que le montant
                  est raisonnable (10-20 %) et que les conditions sont claires.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Quel délai d&apos;annulation imposer avant un rendez-vous ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  <strong>24 h</strong> pour les prestations courtes (coupe, manucure, soin du visage). <strong>48 h</strong>
                  pour les prestations longues (coloration, balayage, extensions). Au-delà, tu perds trop de
                  clientes. En-deçà, tu ne peux pas remplir le créneau.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Combien de SMS de rappel envoyer avant un rendez-vous ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  <strong>Deux :</strong> un à J-2 (confirmation) et un à J-1 (rappel pratique avec adresse et
                  heure). Un troisième à H-3 le jour même est efficace pour les clientes distraites, mais ne devient
                  agressif qu&apos;au-delà.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Comment gérer une cliente fidèle qui fait un no-show exceptionnel ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Avec humanité. Un seul no-show d&apos;une cliente qui vient depuis 2 ans = imprévu. Appelle-la
                  poliment, écoute, propose un report sans pénalité. Tu gardes une cliente à vie. La règle
                  stricte s&apos;applique surtout aux nouvelles et aux récidivistes.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-8 text-center text-white">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-4 opacity-90" />
            <h3 className="text-xl sm:text-2xl font-bold mb-3">
              Lance la réservation en ligne avec acompte en 2 minutes
            </h3>
            <p className="text-indigo-100 mb-6 max-w-xl mx-auto">
              Acompte sécurisé, SMS de rappel automatiques, liste d&apos;attente, politique affichée : Qarte intègre
              tout pour diviser tes no-show par 4.
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
