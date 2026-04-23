'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  BookOpen,
  Star,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { FacebookPixel } from '@/components/analytics/FacebookPixel';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const tocItems = [
  { id: 'realite', label: 'La réalité que personne ne dit' },
  { id: 'ou-vivent', label: 'Où vivent vraiment tes avis ?' },
  { id: 'avis-google', label: 'Les avis Google : ton seul actif durable' },
  { id: 'probleme', label: 'Le vrai problème : tes clientes n\'y pensent pas' },
  { id: 'solution', label: 'Qarte automatise les avis Google après chaque visite' },
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
          name: 'Tes avis sur Planity, Booksy et Treatwell ne t\'appartiennent pas',
          item: 'https://getqarte.com/blog/avis-planity-booksy-ne-tappartiennent-pas',
        },
      ],
    },
    {
      '@type': 'Article',
      headline: 'Tes avis sur Planity, Booksy et Treatwell ne t\'appartiennent pas — et c\'est dangereux',
      description: 'Tes avis sur Planity ou Booksy disparaissent si tu pars. Seuls les avis Google t\'appartiennent vraiment. Comment les collecter automatiquement.',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80',
      datePublished: '2026-04-29',
      dateModified: '2026-04-29',
      author: { '@type': 'Organization', name: 'Qarte', url: 'https://getqarte.com' },
      publisher: {
        '@type': 'Organization',
        name: 'Qarte',
        logo: { '@type': 'ImageObject', url: 'https://getqarte.com/logo.png' },
      },
      mainEntityOfPage: 'https://getqarte.com/blog/avis-planity-booksy-ne-tappartiennent-pas',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Que se passe-t-il avec mes avis Planity si je quitte la plateforme ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Tes avis Planity disparaissent ou deviennent inaccessibles dès que ta fiche est supprimée ou désactivée. Ils appartiennent à la plateforme Planity, pas à ton salon. C\'est pourquoi il est essentiel de collecter des avis Google en parallèle.',
          },
        },
        {
          '@type': 'Question',
          name: 'Comment obtenir plus d\'avis Google pour mon salon de beauté ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'La méthode la plus efficace est l\'envoi automatique d\'un SMS avec lien direct vers ta fiche Google, juste après chaque visite. C\'est ce que fait Qarte automatiquement après chaque scan de carte de fidélité — sans action de ta part.',
          },
        },
        {
          '@type': 'Question',
          name: 'Les avis Google ont-ils un impact sur mon référencement local ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui, massivement. Les avis Google (nombre, note, fraîcheur) sont l\'un des 3 facteurs principaux pour apparaître dans le "pack local" de Google Maps. Un salon avec 80 avis récents 4,8★ écrase ses concurrentes avec 20 avis dans les résultats "coiffeuse à [ville]".',
          },
        },
        {
          '@type': 'Question',
          name: 'Puis-je demander à mes clientes de déplacer leurs avis Planity sur Google ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui, tu peux demander à tes clientes fidèles de laisser un avis Google. Envoie-leur un SMS avec le lien direct vers ta fiche. Mais plutôt que de tout faire manuellement, Qarte automatise cette demande après chaque visite pour construire ta réputation Google progressivement.',
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

        <section className="py-12 sm:py-16 bg-gradient-to-b from-amber-50/50 to-white">
          <div className="max-w-3xl mx-auto px-6">
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <Link href="/blog" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  Blog
                </Link>
                <span>/</span>
                <span className="text-gray-600">Réputation en ligne</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="inline-flex px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full">
                  Réputation en ligne
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />5 min de lecture
                </span>
                <span className="text-sm text-gray-400">29 avril 2026</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                Tes avis sur Planity, Booksy et Treatwell ne t&apos;appartiennent pas — et c&apos;est dangereux
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                Tu as 47 avis 5 étoiles sur Planity. Bravo. Mais le jour où tu pars — ou le jour où
                tu ne leur rapportes plus assez — ils disparaissent. Et tu repars de zéro, avec zéro
                avis en ligne, comme si tu n&apos;avais jamais existé.
              </p>
            </motion.div>

            <div className="mt-8 rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80"
                alt="Avis Google pour salon de beauté"
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
              <BookOpen className="w-4 h-4 text-amber-600" />
              Sommaire
            </div>
            <ol className="space-y-2">
              {tocItems.map((item, index) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-start gap-3 text-sm text-gray-600 hover:text-amber-600 transition-colors py-1"
                  >
                    <span className="text-amber-500 font-semibold min-w-[20px]">{index + 1}.</span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <article className="max-w-3xl mx-auto px-6 pb-16">
          {/* TL;DR */}
          <div className="mb-12 bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-xl">
            <p className="text-sm font-bold text-amber-900 mb-2">L&apos;essentiel en 30 secondes</p>
            <p className="text-base text-gray-700 leading-relaxed">
              Tes avis Planity, Booksy ou Treatwell <strong>t&apos;appartiennent</strong> — tant que ta fiche
              existe sur leur plateforme. Le jour où tu pars, ils disparaissent. Les{' '}
              <strong>avis Google sont les seuls qui restent à toi pour toujours</strong>, qui comptent pour
              le référencement local, et qui sont visibles sans compte. Qarte automatise leur collecte
              après chaque visite.
            </p>
          </div>

          {/* Section 1 */}
          <section id="realite" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <ShieldAlert className="w-7 h-7 text-amber-600 flex-shrink-0" />
              La réalité que personne ne dit
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Quand une cliente laisse un avis sur ta fiche Planity, Booksy ou Treatwell, elle laisse un
              avis sur <strong>leur plateforme</strong> — rattaché à ta fiche du moment.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Cette fiche, c&apos;est eux qui la possèdent. Toi, tu l&apos;occupes — tant que tu leur
              es utile. Si tu migres, si ton abonnement expire, si la plateforme décide de déprioritiser
              ton profil parce que tu génères moins de volume que le salon d&apos;à côté...
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-900 leading-relaxed">
                  <strong>Ta fiche disparaît ou devient invisible.</strong> Des mois de travail. Des dizaines
                  d&apos;avis collectés. Évaporés. Et tu te retrouves avec <strong>zéro avis en ligne</strong>,
                  comme si tu démarrais de rien.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section id="ou-vivent" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Star className="w-7 h-7 text-amber-600 flex-shrink-0" />
              Où vivent vraiment tes avis ?
            </h2>

            <div className="overflow-x-auto rounded-xl border border-gray-200 my-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700"> </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Planity</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Booksy</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Treatwell</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Google</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-medium">T&apos;appartiennent ?</td>
                    <td className="px-4 py-3 text-red-600">✗</td>
                    <td className="px-4 py-3 text-red-600">✗</td>
                    <td className="px-4 py-3 text-red-600">✗</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">✓</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Disparaissent si tu pars ?</td>
                    <td className="px-4 py-3 text-red-600">Oui</td>
                    <td className="px-4 py-3 text-red-600">Oui</td>
                    <td className="px-4 py-3 text-red-600">Oui</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">Non</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Poids SEO local</td>
                    <td className="px-4 py-3 text-gray-500">Faible</td>
                    <td className="px-4 py-3 text-gray-500">Faible</td>
                    <td className="px-4 py-3 text-gray-500">Faible</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">Fort</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Visibles sans compte</td>
                    <td className="px-4 py-3 text-red-600">✗</td>
                    <td className="px-4 py-3 text-red-600">✗</td>
                    <td className="px-4 py-3 text-red-600">✗</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">✓</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Accessibles à vie</td>
                    <td className="px-4 py-3 text-red-600">✗</td>
                    <td className="px-4 py-3 text-red-600">✗</td>
                    <td className="px-4 py-3 text-red-600">✗</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3 */}
          <section id="avis-google" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <CheckCircle2 className="w-7 h-7 text-amber-600 flex-shrink-0" />
              Les avis Google : ton seul actif durable
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Les avis Google t&apos;appartiennent. Peu importe si tu changes d&apos;outil. Peu importe si
              Planity ferme dans cinq ans.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Et dans les recherches locales — <em>&quot;coiffeuse à Lyon&quot;</em>,{' '}
              <em>&quot;onglerie près de moi&quot;</em> — ce sont ces avis qui décident si tu apparais
              dans le pack local de Google Maps. Pas tes avis Booksy. Pas tes avis Treatwell.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
              <p className="text-sm text-amber-900 leading-relaxed">
                <strong>La règle d&apos;or :</strong> Les avis Google, c&apos;est ton capital. Le reste,
                c&apos;est de la location. Un salon avec <strong>80 avis récents 4,8★</strong> écrase
                ses concurrentes avec 20 avis dans les résultats &quot;coiffeuse à [ville]&quot;.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section id="probleme" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <XCircle className="w-7 h-7 text-amber-600 flex-shrink-0" />
              Le vrai problème : tes clientes n&apos;y pensent pas spontanément
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Après une bonne prestation, elles sont satisfaites. Mais chercher ta fiche Google, se
              connecter, écrire un commentaire... c&apos;est une friction de trop. Elles ne le font pas.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong>Résultat typique :</strong> 47 avis sur Planity, 3 avis Google. Et dans les
                recherches locales, c&apos;est le chiffre <strong>3</strong> qui s&apos;affiche sur ta
                fiche. C&apos;est ce chiffre qui détermine si une nouvelle cliente clique ou pas.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section id="solution" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <MessageSquare className="w-7 h-7 text-amber-600 flex-shrink-0" />
              Qarte automatise les avis Google après chaque visite
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-6">
              Avec <strong>Qarte</strong>, après chaque scan de ta carte de fidélité, ta cliente reçoit
              un SMS personnalisé avec le lien direct vers ta fiche Google. Elle note en 10 secondes.
              L&apos;avis est publié sur <strong>ta fiche</strong> — pas sur une plateforme tierce.
            </p>

            <div className="bg-gray-900 text-gray-100 rounded-xl p-5 my-6 font-mono text-sm leading-relaxed">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">SMS automatique envoyé après chaque visite</p>
              <p className="italic">
                &quot;Merci pour ta visite, Sophie ! Tu as apprécié ta prestation ? Laisse-nous un avis
                Google en 10 secondes → [lien] Merci, l&apos;équipe [Salon]&quot;
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                'Envoi automatique après chaque visite scannée',
                'Lien direct vers ta fiche Google — 0 friction',
                'Avis sur ta fiche, pas sur une marketplace',
                'Capital digital qui t\'appartient pour toujours',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-gray-800">{item}</p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Que se passe-t-il avec mes avis Planity si je quitte la plateforme ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Tes avis Planity disparaissent ou deviennent inaccessibles dès que ta fiche est supprimée
                  ou désactivée. Ils appartiennent à Planity, pas à ton salon. C&apos;est pourquoi il faut
                  collecter des avis Google en parallèle.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Comment obtenir plus d&apos;avis Google pour mon salon de beauté ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  La méthode la plus efficace : un SMS automatique avec lien direct vers ta fiche Google,
                  juste après chaque visite. C&apos;est ce que fait Qarte automatiquement après chaque
                  scan de carte de fidélité.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Les avis Google ont-ils un impact sur mon référencement local ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Oui, massivement. Nombre d&apos;avis, note et fraîcheur sont 3 des facteurs principaux
                  pour apparaître dans le pack local de Google Maps pour les recherches
                  &quot;coiffeuse à [ville]&quot;.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Puis-je demander à mes clientes de déplacer leurs avis Planity sur Google ?
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Oui, tu peux demander à tes clientes fidèles de laisser un avis Google avec le lien
                  direct vers ta fiche. Qarte automatise cette démarche après chaque visite pour
                  construire ta réputation progressivement sans effort.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-8 text-center text-white">
            <Star className="w-10 h-10 mx-auto mb-4 opacity-90" />
            <h3 className="text-xl sm:text-2xl font-bold mb-3">
              Construis ta réputation Google — automatiquement
            </h3>
            <p className="text-amber-100 mb-6 max-w-xl mx-auto">
              Après chaque visite, Qarte envoie un SMS à ta cliente pour un avis Google en 10 secondes.
              Ton capital réputation, construit sans effort.
            </p>
            <Link
              href="/auth/merchant/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-amber-700 font-bold rounded-2xl hover:bg-amber-50 transition-colors"
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
