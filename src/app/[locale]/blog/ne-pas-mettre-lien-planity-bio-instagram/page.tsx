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
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Link as LinkIcon,
  Eye,
} from 'lucide-react';
import { FacebookPixel } from '@/components/analytics/FacebookPixel';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const tocItems = [
  { id: 'ce-qui-se-passe', label: 'Ce qui se passe quand une cliente clique sur ton lien' },
  { id: 'qui-profite', label: 'Qui profite vraiment de ton audience Instagram ?' },
  { id: 'ce-que-tu-perds', label: 'Ce que tu perds à chaque clic' },
  { id: 'bonne-alternative', label: 'La bonne alternative : une page qui t\'appartient' },
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
          name: 'Lien Planity en bio Instagram : l\'erreur qui envoie tes clientes chez la concurrente',
          item: 'https://getqarte.com/blog/ne-pas-mettre-lien-planity-bio-instagram',
        },
      ],
    },
    {
      '@type': 'Article',
      headline: 'Pourquoi tu ne dois PAS mettre ton lien Planity, Booksy ou Treatwell dans ta bio Instagram',
      description: 'Mettre ton lien Planity en bio Instagram envoie tes abonnées chez la concurrente. Voici pourquoi et ce qu\'il faut faire à la place.',
      image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1200&q=80',
      datePublished: '2026-04-26',
      dateModified: '2026-04-26',
      author: { '@type': 'Organization', name: 'Qarte', url: 'https://getqarte.com' },
      publisher: {
        '@type': 'Organization',
        name: 'Qarte',
        logo: { '@type': 'ImageObject', url: 'https://getqarte.com/logo.png' },
      },
      mainEntityOfPage: 'https://getqarte.com/blog/ne-pas-mettre-lien-planity-bio-instagram',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Quel lien mettre dans sa bio Instagram quand on est coiffeuse ou esthéticienne ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Le lien de ta propre page de réservation — pas celui de Planity ou Booksy. Une page qui ne montre que ton salon, sans concurrentes à côté. Avec Qarte, tu as une page publique à ton nom qui sert de lien de bio parfait.',
          },
        },
        {
          '@type': 'Question',
          name: 'Pourquoi Planity affiche-t-il d\'autres salons sur ma fiche ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Planity est une marketplace : son modèle économique consiste à proposer plusieurs prestataires pour que la cliente choisisse. Quand une cliente arrive sur ta fiche via ton lien Instagram, elle voit d\'autres salons en dessous — c\'est volontaire de leur part pour maximiser les réservations sur leur plateforme.',
          },
        },
        {
          '@type': 'Question',
          name: 'Est-ce que Planity peut bannir mon compte si j\'utilise un autre outil de réservation ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Non, Planity ne peut pas te bannir pour utiliser un autre outil. En revanche, si ton profil génère peu de réservations via leur plateforme, ils peuvent te déprioritiser dans les résultats de recherche, réduisant ta visibilité.',
          },
        },
        {
          '@type': 'Question',
          name: 'Peut-on utiliser Planity et Qarte en même temps ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui. Le plan Fidélité de Qarte (19€/mois) est compatible avec Planity — tu gardes ton agenda Planity et tu ajoutes la fidélisation Qarte. Dans ce cas, mets quand même le lien Qarte en bio Instagram pour éviter que tes abonnées voient la concurrence.',
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

        <section className="py-12 sm:py-16 bg-gradient-to-b from-violet-50/50 to-white">
          <div className="max-w-3xl mx-auto px-6">
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <Link href="/blog" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  Blog
                </Link>
                <span>/</span>
                <span className="text-gray-600">Stratégie Instagram</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="inline-flex px-3 py-1 bg-violet-50 text-violet-700 text-xs font-semibold rounded-full">
                  Stratégie Instagram
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />5 min de lecture
                </span>
                <span className="text-sm text-gray-400">26 avril 2026</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                Pourquoi tu ne dois PAS mettre ton lien Planity, Booksy ou Treatwell dans ta bio Instagram
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                Tu passes des heures à créer du contenu Instagram pour attirer des clientes. Puis tu les
                envoies directement chez la concurrente. C&apos;est exactement ce qui se passe quand ton
                lien de bio pointe vers Planity, Booksy ou Treatwell.
              </p>
            </motion.div>

            <div className="mt-8 rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1200&q=80"
                alt="Téléphone avec profil Instagram pour salon de beauté"
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
              Quand ton lien de bio pointe vers Planity, Booksy ou Treatwell, ta cliente arrive sur <strong>ta
              fiche</strong> — mais avec des dizaines de <strong>concurrentes affichées en dessous</strong>.
              Elle peut partir chez l&apos;une d&apos;elles en un clic. La solution : un lien vers{' '}
              <strong>ta propre page</strong>, sans concurrent visible, avec carte de fidélité automatique.
            </p>
          </div>

          {/* Section 1 */}
          <section id="ce-qui-se-passe" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Eye className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Ce qui se passe quand une cliente clique sur ton lien
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Elle clique sur ton lien Instagram. Elle arrive sur ta fiche Planity ou Booksy. Jusque-là, tout va bien.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Mais juste en dessous de ton salon, la plateforme affiche d&apos;autres prestataires. D&apos;autres
              photos. D&apos;autres prix. D&apos;autres créneaux disponibles.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 leading-relaxed">
                  Il suffit qu&apos;une de tes abonnées voie : <em>&quot;Tiens, celle-là a l&apos;air pas mal
                  aussi — et elle est ouverte le dimanche...&quot;</em> Et c&apos;est une cliente de perdue. Une
                  cliente que <strong>tu avais convaincue avec ton contenu</strong>, que tu envoies toi-même
                  voir ailleurs.
                </p>
              </div>
            </div>
            <p className="text-base text-gray-700 leading-relaxed">
              Planity est une <strong>marketplace</strong> : leur modèle économique consiste à proposer plusieurs
              prestataires pour maximiser les réservations sur leur plateforme. Ce n&apos;est pas dans leur intérêt
              que ta fiche n&apos;affiche que toi.
            </p>
          </section>

          {/* Section 2 */}
          <section id="qui-profite" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Instagram className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Qui profite vraiment de ton audience Instagram ?
            </h2>

            <div className="overflow-x-auto rounded-xl border border-gray-200 my-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700"> </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Lien Planity / Booksy</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Lien Qarte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-medium">Clientes qui voient ta page</td>
                    <td className="px-4 py-3 text-emerald-600">✓ Oui</td>
                    <td className="px-4 py-3 text-emerald-600">✓ Oui</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Concurrentes affichées à côté</td>
                    <td className="px-4 py-3 text-red-600">✗ Oui (risque réel)</td>
                    <td className="px-4 py-3 text-emerald-600">✓ Non</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Carte de fidélité dès la 1ère resa</td>
                    <td className="px-4 py-3 text-red-600">✗ Non</td>
                    <td className="px-4 py-3 text-emerald-600">✓ Automatique</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">La page t&apos;appartient</td>
                    <td className="px-4 py-3 text-red-600">✗ Non</td>
                    <td className="px-4 py-3 text-emerald-600">✓ Oui</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Commission par réservation</td>
                    <td className="px-4 py-3 text-red-600">Jusqu&apos;à 20%</td>
                    <td className="px-4 py-3 text-emerald-600">✓ 0%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-base text-gray-700 leading-relaxed">
              Ces plateformes utilisent ton audience Instagram pour alimenter leur marketplace. Pas pour
              te fidéliser des clientes — pour fidéliser des utilisatrices à <strong>leur service</strong>.
            </p>
          </section>

          {/* Section 3 */}
          <section id="ce-que-tu-perds" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <XCircle className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Ce que tu perds à chaque clic
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-6">
              Chaque abonnée qui clique sur ton lien Planity est une cliente potentielle que tu offres au marché.
              Elle n&apos;a pas cherché &quot;salon de beauté&quot; sur Google — elle <em>te</em> suivait, toi.
              Et tu la redistribues à des dizaines de concurrentes en un clic.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-5 border border-red-100 bg-red-50 rounded-xl">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">La cliente choisit une concurrente</p>
                  <p className="text-sm text-gray-600">Elle voyait tes stories, adorait ton travail... et réserve finalement ailleurs parce que le salon d&apos;à côté avait une place samedi matin.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 border border-red-100 bg-red-50 rounded-xl">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Tu finances la croissance de Planity</p>
                  <p className="text-sm text-gray-600">Ton contenu Instagram attire du trafic. Planity le convertit en réservations — et en commission. Tu travailles, ils encaissent.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 border border-red-100 bg-red-50 rounded-xl">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Zéro fidélisation</p>
                  <p className="text-sm text-gray-600">Même si elle réserve chez toi, tu n&apos;as pas son contact direct. Pas de SMS possible, pas de carte de fidélité, pas de parrainage.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section id="bonne-alternative" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <LinkIcon className="w-7 h-7 text-violet-600 flex-shrink-0" />
              La bonne alternative : une page qui t&apos;appartient
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-6">
              Avec <strong>Qarte</strong>, ton lien de bio mène vers <strong>ta page uniquement</strong>.
              Aucune autre enseigne à côté. Aucune distraction. La cliente voit tes services, réserve,
              et reçoit automatiquement sa carte de fidélité.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                'Ta page uniquement — aucune concurrente visible',
                'Carte de fidélité automatique dès la 1ère réservation',
                'SMS de rappel inclus — moins de no-shows',
                '0% de commission sur tes réservations',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-gray-800">{item}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <p className="text-sm font-bold text-gray-700 mb-2">Et si je veux garder Planity pour les nouvelles clientes ?</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Le plan Fidélité Qarte (19€/mois) est compatible avec Planity — tu gardes ton agenda
                Planity et tu ajoutes la fidélisation Qarte. Dans ce cas, mets le lien Qarte en bio
                Instagram pour éviter que tes abonnées voient la concurrence.
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Quel lien mettre dans sa bio Instagram quand on est coiffeuse ou esthéticienne ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Le lien de ta propre page de réservation — pas celui de Planity ou Booksy. Une page qui
                  ne montre que ton salon, sans concurrentes à côté. Avec Qarte, ta page publique sert de
                  lien de bio parfait.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Pourquoi Planity affiche-t-il d&apos;autres salons sur ma fiche ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Planity est une marketplace : son modèle consiste à proposer plusieurs prestataires.
                  Quand ta cliente arrive via ton lien Instagram, elle voit d&apos;autres salons en dessous
                  — c&apos;est volontaire de leur part pour maximiser les réservations sur leur plateforme.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Peut-on utiliser Planity et Qarte en même temps ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Oui. Le plan Fidélité de Qarte (19€/mois) est compatible avec Planity — tu gardes ton
                  agenda Planity et tu ajoutes la fidélisation. Mets le lien Qarte en bio pour protéger
                  ton audience Instagram.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
            <Instagram className="w-10 h-10 mx-auto mb-4 opacity-90" />
            <h3 className="text-xl sm:text-2xl font-bold mb-3">
              Donne à ta bio Instagram un lien qui travaille pour toi
            </h3>
            <p className="text-violet-100 mb-6 max-w-xl mx-auto">
              Ta page, tes services, tes clientes. Aucune concurrente à côté. Carte de fidélité automatique dès la 1ère réservation.
            </p>
            <Link
              href="/auth/merchant/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-violet-700 font-bold rounded-2xl hover:bg-violet-50 transition-colors"
            >
              Créer ma page gratuitement
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
