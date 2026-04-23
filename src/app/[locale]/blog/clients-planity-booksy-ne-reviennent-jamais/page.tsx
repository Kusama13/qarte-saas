'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  BookOpen,
  TrendingDown,
  Users,
  Heart,
  CheckCircle2,
  Instagram,
  Star,
} from 'lucide-react';
import { FacebookPixel } from '@/components/analytics/FacebookPixel';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const tocItems = [
  { id: 'realite', label: 'Ce que Planity, Booksy et Treatwell ne te disent pas' },
  { id: 'vraies-clientes', label: 'D\'où viennent vraiment tes clientes fidèles ?' },
  { id: 'cout-reel', label: 'Ce que tu perds vraiment sur les marketplaces' },
  { id: 'solution', label: 'La solution : transformer tes abonnées en clientes régulières' },
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
          name: 'Planity, Booksy : ces clientes qui réservent et ne reviennent jamais',
          item: 'https://getqarte.com/blog/clients-planity-booksy-ne-reviennent-jamais',
        },
      ],
    },
    {
      '@type': 'Article',
      headline: 'Planity, Booksy, Treatwell : ces clientes qui réservent et ne reviennent jamais',
      description: 'Les clientes venues de Planity ou Booksy sont transactionnelles. Voici la vraie source de clientes fidèles.',
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
      datePublished: '2026-04-23',
      dateModified: '2026-04-23',
      author: { '@type': 'Organization', name: 'Qarte', url: 'https://getqarte.com' },
      publisher: {
        '@type': 'Organization',
        name: 'Qarte',
        logo: { '@type': 'ImageObject', url: 'https://getqarte.com/logo.png' },
      },
      mainEntityOfPage: 'https://getqarte.com/blog/clients-planity-booksy-ne-reviennent-jamais',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Pourquoi les clientes de Planity ou Booksy ne reviennent-elles pas ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ces clientes n\'ont pas choisi ton salon pour toi — elles cherchaient un créneau disponible. Sans relation personnelle établie, elles retournent sur la plateforme pour leur prochain rendez-vous et réservent là où il y a de la place, peu importe le salon.',
          },
        },
        {
          '@type': 'Question',
          name: 'Quelle est la meilleure source de clientes fidèles pour un salon de beauté ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Les clientes qui te suivent sur les réseaux sociaux (Instagram, TikTok) sont les plus fidélisables. Elles te connaissent avant même de réserver, font confiance à ton travail et ta personnalité, et reviennent régulièrement.',
          },
        },
        {
          '@type': 'Question',
          name: 'Combien coûte vraiment Planity pour un salon de beauté ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Planity est gratuit à l\'inscription mais prend jusqu\'à 20% de commission sur les réservations générées via leur marketplace. Sur un CA de 3 000€/mois, c\'est jusqu\'à 600€ de commission, sans compter les options payantes (SMS, marketing) à 150€/mois en plus.',
          },
        },
        {
          '@type': 'Question',
          name: 'Comment fidéliser les clientes d\'un salon de beauté sans passer par une marketplace ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'La méthode la plus efficace combine : une page de réservation qui t\'appartient (sans concurrentes à côté), une carte de fidélité automatique dès la 1ère visite, des SMS de rappel et d\'anniversaire, et un programme de parrainage. Qarte intègre tout ça en un seul outil à 24€/mois.',
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

        <section className="py-12 sm:py-16 bg-gradient-to-b from-rose-50/50 to-white">
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
                <span className="inline-flex px-3 py-1 bg-rose-50 text-rose-700 text-xs font-semibold rounded-full">
                  Fidélisation
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />5 min de lecture
                </span>
                <span className="text-sm text-gray-400">23 avril 2026</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                Planity, Booksy, Treatwell : ces clientes qui réservent et ne reviennent jamais
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                Tu remplis ton agenda grâce à Planity ou Booksy. Mais combien de ces clientes ont repris
                rendez-vous d&apos;elles-mêmes ? Si la réponse t&apos;embarrasse, tu n&apos;es pas seule —
                et ce n&apos;est pas de ta faute. C&apos;est le modèle de ces plateformes qui est conçu comme ça.
              </p>
            </motion.div>

            <div className="mt-8 rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80"
                alt="Salon de beauté avec programme de fidélité"
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
              <BookOpen className="w-4 h-4 text-rose-600" />
              Sommaire
            </div>
            <ol className="space-y-2">
              {tocItems.map((item, index) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-start gap-3 text-sm text-gray-600 hover:text-rose-600 transition-colors py-1"
                  >
                    <span className="text-rose-400 font-semibold min-w-[20px]">{index + 1}.</span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <article className="max-w-3xl mx-auto px-6 pb-16">
          {/* TL;DR */}
          <div className="mb-12 bg-rose-50 border-l-4 border-rose-500 p-6 rounded-r-xl">
            <p className="text-sm font-bold text-rose-900 mb-2">L&apos;essentiel en 30 secondes</p>
            <p className="text-base text-gray-700 leading-relaxed">
              Les clientes de Planity, Booksy et Treatwell cherchaient <strong>un créneau</strong>, pas toi.
              Elles reviendront là où il y a de la place. Tes vraies clientes fidèles viennent de{' '}
              <strong>tes réseaux sociaux</strong> — elles te suivent pour ton travail et ta personnalité.
              C&apos;est sur celles-là qu&apos;il faut investir, avec{' '}
              <strong>une page de réservation qui t&apos;appartient + une carte de fidélité automatique</strong>.
            </p>
          </div>

          {/* Section 1 */}
          <section id="realite" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <TrendingDown className="w-7 h-7 text-rose-600 flex-shrink-0" />
              Ce que Planity, Booksy et Treatwell ne te disent pas
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Une cliente qui te trouve sur ces plateformes ne te cherchait pas, <em>toi</em>. Elle cherchait{' '}
              <strong>un créneau disponible, une prestation, un prix</strong>. Le tien était libre. Elle a réservé.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Après la prestation ? Elle retourne sur la même plateforme, relance sa recherche, et réserve là où
              il y a de la place — pas forcément chez toi. C&apos;est une cliente <strong>transactionnelle</strong>.
              Ce n&apos;est pas de la fidélité, c&apos;est de la disponibilité.
            </p>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 mb-6">
              <p className="text-sm text-rose-900 leading-relaxed">
                <strong>Et pendant ce temps :</strong> Planity prend jusqu&apos;à{' '}
                <strong>20% de commission</strong> sur chaque réservation générée. Sur un CA de 3 000 €/mois,
                c&apos;est jusqu&apos;à <strong>600 € qui partent chaque mois</strong> sans aucun retour
                en termes de fidélisation.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section id="vraies-clientes" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Instagram className="w-7 h-7 text-rose-600 flex-shrink-0" />
              D&apos;où viennent vraiment tes clientes fidèles ?
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-6">
              La cliente qui te suit sur Instagram depuis 3 mois pour tes réalisations — elle vient pour{' '}
              <strong>toi</strong>. Elle ne compare pas tes prix. Elle ne regarde pas si le salon
              d&apos;à côté a une place libre samedi. Elle veut toi.
            </p>

            <div className="overflow-x-auto rounded-xl border border-gray-200 my-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Source</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Revient souvent ?</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Te suit ?</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Fidélisable ?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-medium">Planity / Booksy / Treatwell</td>
                    <td className="px-4 py-3 text-red-600">Rarement</td>
                    <td className="px-4 py-3 text-red-600">Non</td>
                    <td className="px-4 py-3 text-red-600">Difficile</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Instagram / TikTok</td>
                    <td className="px-4 py-3 text-emerald-600">Souvent</td>
                    <td className="px-4 py-3 text-emerald-600">Oui</td>
                    <td className="px-4 py-3 text-emerald-600">Facilement</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Bouche-à-oreille</td>
                    <td className="px-4 py-3 text-emerald-600">Presque toujours</td>
                    <td className="px-4 py-3 text-emerald-600">Souvent</td>
                    <td className="px-4 py-3 text-emerald-600">Très facilement</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-base text-gray-700 leading-relaxed">
              La vraie stratégie de développement, c&apos;est de <strong>mettre le paquet sur tes réseaux</strong>{' '}
              et d&apos;avoir les bons outils pour transformer ces abonnées en clientes régulières.
            </p>
          </section>

          {/* Section 3 */}
          <section id="cout-reel" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Users className="w-7 h-7 text-rose-600 flex-shrink-0" />
              Ce que tu perds vraiment sur les marketplaces
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-4 p-5 border border-gray-200 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold text-sm flex items-center justify-center">1</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Jusqu&apos;à 20% de commission par réservation</h3>
                  <p className="text-sm text-gray-600">Planity prend une commission sur chaque cliente générée par leur marketplace. Tu travailles, elles encaissent.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 border border-gray-200 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold text-sm flex items-center justify-center">2</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Zéro relation directe avec la cliente</h3>
                  <p className="text-sm text-gray-600">Tu n&apos;as pas son contact. Tu ne peux pas lui envoyer un SMS, lui souhaiter son anniversaire, lui proposer une offre.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 border border-gray-200 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold text-sm flex items-center justify-center">3</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Aucun outil de fidélisation inclus</h3>
                  <p className="text-sm text-gray-600">Les options marketing (SMS, relances, fidélité) coûtent jusqu&apos;à 150€/mois supplémentaires chez Planity.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 border border-gray-200 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold text-sm flex items-center justify-center">4</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Ta clientèle appartient à la plateforme</h3>
                  <p className="text-sm text-gray-600">Le jour où tu pars, tes clientes restent sur Planity — et voient d&apos;autres salons.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section id="solution" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Heart className="w-7 h-7 text-rose-600 flex-shrink-0" />
              La solution : transformer tes abonnées en clientes régulières
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-6">
              <strong>Qarte</strong> est la solution de fidélisation numéro 1 en France pour les pros de la
              beauté. Dès qu&apos;une cliente réserve via ta page, elle reçoit automatiquement sa carte de
              fidélité — sans friction, sans application à télécharger.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                { icon: CheckCircle2, label: 'Carte de fidélité automatique dès la 1ère réservation' },
                { icon: CheckCircle2, label: 'SMS de rappel → moins de no-shows' },
                { icon: CheckCircle2, label: 'SMS d\'anniversaire → elle revient' },
                { icon: CheckCircle2, label: 'Programme de parrainage → elle amène ses amies' },
              ].filter((_, i) => i < 3).map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-rose-50 rounded-xl">
                  <item.icon className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-gray-800">{item.label}</p>
                </div>
              ))}
              <div className="flex items-start gap-3 p-4 bg-rose-50 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-gray-800">Programme de parrainage → elle amène ses amies</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 mb-8">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Critère</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Planity</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Qarte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3">Prix mensuel</td>
                    <td className="px-4 py-3 text-gray-500">Gratuit + 20% commission</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">24€/mois tout inclus</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Carte de fidélité</td>
                    <td className="px-4 py-3 text-red-500">Non</td>
                    <td className="px-4 py-3 text-emerald-600">✓ Automatique</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">SMS de rappel</td>
                    <td className="px-4 py-3 text-gray-500">Payant en plus</td>
                    <td className="px-4 py-3 text-emerald-600">✓ Inclus</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Concurrentes sur ta page</td>
                    <td className="px-4 py-3 text-red-500">Oui</td>
                    <td className="px-4 py-3 text-emerald-600">✓ Non</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Avis Google automatiques</td>
                    <td className="px-4 py-3 text-red-500">Non</td>
                    <td className="px-4 py-3 text-emerald-600">✓ Inclus</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Pourquoi les clientes de Planity ou Booksy ne reviennent-elles pas ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Ces clientes n&apos;ont pas choisi ton salon pour toi — elles cherchaient un créneau disponible.
                  Sans relation personnelle, elles retournent sur la plateforme et réservent là où il y a de la
                  place, peu importe le salon.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Quelle est la meilleure source de clientes fidèles pour un salon de beauté ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Les clientes qui te suivent sur les réseaux sociaux (Instagram, TikTok). Elles te connaissent
                  avant même de réserver, font confiance à ton travail, et reviennent régulièrement.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Combien coûte vraiment Planity pour un salon de beauté ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Planity est gratuit à l&apos;inscription mais prend jusqu&apos;à <strong>20% de commission</strong>{' '}
                  sur les réservations. Sur 3 000€/mois de CA, c&apos;est 600€ de commission — sans compter les
                  options marketing à 150€/mois en plus.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Comment fidéliser les clientes d&apos;un salon sans marketplace ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Une page de réservation qui t&apos;appartient + une carte de fidélité automatique dès la 1ère
                  visite + des SMS de rappel et d&apos;anniversaire + un programme de parrainage. Qarte intègre
                  tout ça à <strong>24€/mois</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-8 text-center text-white">
            <Star className="w-10 h-10 mx-auto mb-4 opacity-90" />
            <h3 className="text-xl sm:text-2xl font-bold mb-3">
              Construis ta base de clientes fidèles — sans commission
            </h3>
            <p className="text-rose-100 mb-6 max-w-xl mx-auto">
              Carte de fidélité automatique, SMS de rappel, parrainage, avis Google : tout en un,
              à 24€/mois sans engagement.
            </p>
            <Link
              href="/auth/merchant/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-rose-600 font-bold rounded-2xl hover:bg-rose-50 transition-colors"
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
