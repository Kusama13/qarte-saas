'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  BookOpen,
  Smartphone,
  AlertTriangle,
  TrendingUp,
  Check,
  ShieldCheck,
  ScanLine,
  Sparkles,
} from 'lucide-react';
import { FacebookPixel } from '@/components/analytics/FacebookPixel';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const tocItems = [
  { id: 'pourquoi-papier-ne-marche-plus', label: 'Pourquoi la carte papier ne marche plus en 2026' },
  { id: 'ce-que-change-le-digital', label: 'Ce que la carte digitale change vraiment (avec chiffres)' },
  { id: 'criteres-choix', label: 'Les 5 critères pour choisir la bonne solution' },
  { id: 'comparatif', label: 'Comparatif rapide des outils du marché' },
  { id: 'parcours-cliente', label: 'Le parcours de ta cliente en 3 étapes' },
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
          name: 'Carte de fidélité dématérialisée pour salon de beauté : pourquoi passer au digital en 2026',
          item: 'https://getqarte.com/blog/carte-fidelite-dematerialisee-salon-beaute',
        },
      ],
    },
    {
      '@type': 'Article',
      headline: 'Carte de fidélité dématérialisée pour salon de beauté : pourquoi passer au digital en 2026',
      description:
        'Carte de fidélité dématérialisée salon : pourquoi tes cartes papier perdent 47 % de retours. Comparatif, prix, parcours cliente en 3 étapes.',
      image: {
        '@type': 'ImageObject',
        url: 'https://getqarte.com/blog/social/article-8-cover.png',
        width: 1080,
        height: 1080,
      },
      datePublished: '2026-05-27T08:00:00+02:00',
      dateModified: '2026-05-27T08:00:00+02:00',
      author: { '@type': 'Organization', name: 'Qarte', url: 'https://getqarte.com' },
      publisher: {
        '@type': 'Organization',
        name: 'Qarte',
        logo: { '@type': 'ImageObject', url: 'https://getqarte.com/logo.png' },
      },
      mainEntityOfPage: 'https://getqarte.com/blog/carte-fidelite-dematerialisee-salon-beaute',
      articleSection: 'Fidélisation',
      inLanguage: 'fr-FR',
      keywords: [
        'carte fidélité dématérialisée salon',
        'carte fidélité digitale coiffeur',
        'carte fidélité salon sans application',
        'programme fidélité salon de beauté',
        'remplacer carte tampons papier',
        'logiciel fidélité institut beauté',
      ],
      mentions: [
        { '@type': 'Thing', name: 'Programme de fidélité' },
        { '@type': 'Thing', name: 'Marketing salon de beauté' },
      ],
    },
    {
      '@type': 'FAQPage',
      inLanguage: 'fr-FR',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Une carte de fidélité dématérialisée, comment ça marche concrètement pour ma cliente ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ta cliente scanne ton QR code avec son téléphone (Safari iPhone ou Chrome Android, pas d\'appli à télécharger), saisit son numéro, et sa carte est créée. Au passage suivant, elle rescanne, son tampon est ajouté automatiquement. Quand elle atteint le palier (ex : 10 passages), sa récompense est débloquée et tu la valides en 2 secondes au comptoir.',
          },
        },
        {
          '@type': 'Question',
          name: 'Mes clientes plus âgées vont-elles savoir l\'utiliser ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui. C\'est juste un QR code à scanner, comme un menu de restaurant. Pas de compte à créer, pas de mot de passe, pas d\'appli. La première fois prend 30 secondes, ensuite c\'est 1 tap. Les retours des pros sur Qarte montrent que les clientes 60+ scannent sans difficulté dès le 2e passage.',
          },
        },
        {
          '@type': 'Question',
          name: 'Quel est le prix d\'une carte de fidélité digitale pour un salon de beauté ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Les solutions au forfait coûtent entre 19 € et 50 € par mois (Qarte 19 €/mois en Fidélité, 34 €/mois en Tout-en-un avec vitrine + réservation). Les solutions à la commission prennent 1 à 3 % par passage. Sur un salon avec 200 visites/mois, le forfait revient toujours moins cher. Méfie-toi des outils gratuits qui se rattrapent sur ta data ou des pubs envoyées à tes clientes.',
          },
        },
        {
          '@type': 'Question',
          name: 'Que se passe-t-il si ma cliente perd son téléphone ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Rien, sa carte est liée à son numéro de portable, pas à son téléphone physique. Elle récupère son nouveau téléphone, scanne ton QR code, saisit son numéro, et sa carte est de retour avec tous ses tampons.',
          },
        },
        {
          '@type': 'Question',
          name: 'Et si je change de solution dans 6 mois, je récupère mes données clients ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ça dépend du fournisseur. Chez Qarte tu exportes ta base à tout moment (CSV avec numéros, nombres de passages, dates). Vérifie toujours ce point AVANT de signer : certains acteurs (Heyloy, Loyverse) verrouillent l\'export ou facturent un retrait. Tes clientes sont ton actif numéro un, elles ne doivent jamais être prises en otage.',
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
                <span className="text-gray-600">Fidélisation</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="inline-flex px-3 py-1 bg-violet-50 text-violet-700 text-xs font-semibold rounded-full">
                  Fidélisation
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />8 min de lecture
                </span>
                <span className="text-sm text-gray-400">Publié le 27 mai 2026</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                Carte de fidélité dématérialisée pour salon de beauté : pourquoi passer au digital en 2026
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                Si tu tiens encore les comptes sur des petites cartes en carton avec tes tampons à
                l&apos;encre, tu perds <strong>~47 % de clientes qui pourraient revenir</strong>.
                Elles oublient la carte, la perdent, ne pensent pas à la sortir, ou changent de
                portefeuille. Une carte de fidélité dématérialisée, c&apos;est juste un QR code à
                scanner avec leur téléphone. Pas d&apos;appli, pas de compte. Voici comment ça
                marche, combien ça coûte, et comment choisir la bonne solution pour ton salon.
              </p>
            </motion.div>

            <div className="mt-8 rounded-2xl overflow-hidden">
              <Image
                src="/blog/social/article-8-cover.png"
                alt="Cliente d'un salon de beauté scannant un QR code de carte de fidélité avec son smartphone"
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
              Une <strong>carte de fidélité dématérialisée</strong> remplace tes cartes en carton par
              un QR code unique que tes clientes scannent avec leur téléphone (sans télécharger
              d&apos;appli). Tu ne perds plus de passages, ta cliente ne perd plus sa carte, et tu
              récupères enfin une vraie base de données (numéros, fréquence, paniers). Au forfait
              19 €/mois chez Qarte, sans commission par passage. Hors de prix sur le marché : entre
              19 € et 50 € par mois selon les fonctionnalités.
            </p>
          </div>

          <section id="pourquoi-papier-ne-marche-plus" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <AlertTriangle className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Pourquoi la carte papier ne marche plus en 2026
            </h2>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Tu donnes une carte cartonnée à ta cliente après sa première visite. Tu lui tamponnes
              dessus à chaque passage. Au bout de 10 tampons, elle a droit à un brushing offert.
              C&apos;est simple, ça a marché 30 ans. Sauf qu&apos;aujourd&apos;hui, voici ce qui se
              passe vraiment :
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-4 p-5 bg-red-50 border border-red-100 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Elle perd la carte</p>
                  <p className="text-sm text-gray-700">Trois quarts des cartes papier sont perdues en moins de 6 mois. Ta cliente revient, n&apos;ose pas demander une nouvelle, repart sans tampon. Tu viens de perdre un passage qui aurait compté.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 bg-red-50 border border-red-100 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Elle l&apos;oublie chez elle</p>
                  <p className="text-sm text-gray-700">Plus fréquent encore : elle l&apos;a, mais pas sur elle. Elle pense « je dirai au prochain coup ». Sauf qu&apos;au prochain coup elle l&apos;oublie aussi, et l&apos;effet de souvenir s&apos;estompe.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 bg-red-50 border border-red-100 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Toi tu n&apos;as aucune donnée</p>
                  <p className="text-sm text-gray-700">Tu ne sais pas combien de clientes ont une carte active, combien sont proches de la récompense, combien n&apos;ont pas remis les pieds depuis 3 mois. Donc tu ne peux pas relancer, tu ne peux pas mesurer, tu ne peux pas améliorer.</p>
                </div>
              </div>
            </div>

            <p className="text-base text-gray-700 leading-relaxed">
              Le résultat, c&apos;est qu&apos;une carte papier <strong>ne fidélise plus</strong>. Elle
              donne juste bonne conscience à la pro (« j&apos;ai un programme »). Mais côté
              client, le geste est tellement contraignant qu&apos;une grande partie des passages
              n&apos;est jamais tamponnée. Et donc la récompense n&apos;est jamais atteinte.
            </p>
          </section>

          <section id="ce-que-change-le-digital" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Ce que la carte digitale change vraiment (avec chiffres)
            </h2>

            <p className="text-base text-gray-700 leading-relaxed mb-6">
              Une carte dématérialisée règle les 3 problèmes ci-dessus d&apos;un coup. Voici ce que
              ça donne dans la vraie vie d&apos;un salon, sur la base des données réelles des pros
              sur Qarte :
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div className="text-center p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-3xl font-extrabold text-emerald-700 mb-1">+47 %</p>
                <p className="text-sm font-medium text-gray-800 leading-snug">de clientes qui reviennent vs sans programme</p>
              </div>
              <div className="text-center p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-3xl font-extrabold text-emerald-700 mb-1">x3</p>
                <p className="text-sm font-medium text-gray-800 leading-snug">de passages enregistrés vs carte papier</p>
              </div>
              <div className="text-center p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-3xl font-extrabold text-emerald-700 mb-1">0</p>
                <p className="text-sm font-medium text-gray-800 leading-snug">carte perdue (elle est dans son téléphone)</p>
              </div>
            </div>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Mais le vrai changement n&apos;est pas dans les chiffres bruts. C&apos;est dans ce que
              tu peux faire <strong>avec</strong>. Une carte digitale te donne :
            </p>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-base text-gray-700"><strong>Le numéro de chaque cliente</strong>, donc la possibilité de lui envoyer un SMS d&apos;anniversaire ou de relance après 30 jours sans la voir.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-base text-gray-700"><strong>Sa fréquence de passage</strong>, donc le moment exact où elle commence à décrocher (et tu peux agir avant qu&apos;elle parte chez la concurrente).</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-base text-gray-700"><strong>Le montant moyen</strong> de ses prestations (si tu utilises la cagnotte), pour identifier tes vraies meilleures clientes et leur réserver des avantages.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-base text-gray-700"><strong>Un déclencheur naturel</strong> pour proposer des avis Google : juste après la récompense débloquée, le bon moment pour demander à la cliente de te recommander.</span>
              </li>
            </ul>

            <p className="text-base text-gray-700 leading-relaxed">
              Si tu te demandes pourquoi tes clientes Planity ou Booksy ne reviennent pas, c&apos;est
              en grande partie pour ça : <Link href="/blog/clients-planity-booksy-ne-reviennent-jamais" className="text-violet-700 underline hover:text-violet-900">elles ne sont pas vraiment <strong>tes</strong> clientes</Link>,
              et tu n&apos;as aucun moyen direct de les relancer. La carte digitale renverse ce
              rapport.
            </p>
          </section>

          <section id="criteres-choix" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <ShieldCheck className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Les 5 critères pour choisir la bonne solution
            </h2>

            <p className="text-base text-gray-700 leading-relaxed mb-6">
              Toutes les cartes digitales ne se valent pas. Voici les 5 questions à poser avant
              de t&apos;engager :
            </p>

            <div className="space-y-5 mb-6">
              <div className="border border-violet-100 rounded-xl p-5">
                <p className="font-bold text-gray-900 mb-2">1. Est-ce que ma cliente doit télécharger une appli ?</p>
                <p className="text-sm text-gray-700 leading-relaxed">Si oui, fuis. La majorité des clientes refusent ou abandonnent au moment du téléchargement. Une vraie carte dématérialisée fonctionne directement dans le navigateur web (Safari, Chrome), sans installation.</p>
              </div>
              <div className="border border-violet-100 rounded-xl p-5">
                <p className="font-bold text-gray-900 mb-2">2. Combien de temps prend le scan en caisse ?</p>
                <p className="text-sm text-gray-700 leading-relaxed">Si ça prend plus de 5 secondes (cliente cherche, scanne, mot de passe, validation), tu vas vite te lasser et arrêter de proposer. Compte 3 à 5 secondes max, sans saisie.</p>
              </div>
              <div className="border border-violet-100 rounded-xl p-5">
                <p className="font-bold text-gray-900 mb-2">3. Est-ce que je peux exporter mes données quand je veux ?</p>
                <p className="text-sm text-gray-700 leading-relaxed">Tes clientes sont ton actif numéro un. Si l&apos;outil ne te laisse pas exporter une base CSV (numéros, dates, passages), c&apos;est rédhibitoire. Tu pars en otage le jour où tu changes de fournisseur.</p>
              </div>
              <div className="border border-violet-100 rounded-xl p-5">
                <p className="font-bold text-gray-900 mb-2">4. Forfait ou commission ?</p>
                <p className="text-sm text-gray-700 leading-relaxed">Un outil à la commission (1 à 3 % par passage) coûte des fortunes à l&apos;échelle. Sur 200 visites/mois à 40 € de panier moyen, 2 % = 160 €/mois rien que pour avoir des cartes. Un forfait à 19 € reste fixe.</p>
              </div>
              <div className="border border-violet-100 rounded-xl p-5">
                <p className="font-bold text-gray-900 mb-2">5. Mes clientes vont-elles recevoir des pubs d&apos;autres salons ?</p>
                <p className="text-sm text-gray-700 leading-relaxed">Certains outils gratuits ou peu chers se rattrapent en envoyant ta base à des concurrents (sous prétexte de « recommandations beauté »). Lis bien les CGV. Une vraie solution te garantit que tes clientes restent les tiennes.</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="text-sm text-amber-900 leading-relaxed">
                <strong>Le piège classique :</strong> une solution gratuite ou très bon marché qui te
                vole ta base de clientes pour les revendre à des marketplaces (Treatwell, Planity).
                Tu paies en réalité avec tes clientes. Vérifie toujours qui possède la data avant
                de signer.
              </p>
            </div>
          </section>

          <section id="comparatif" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Comparatif rapide des outils du marché
            </h2>

            <p className="text-base text-gray-700 leading-relaxed mb-6">
              On a regardé les 4 solutions les plus utilisées en France par les salons de beauté.
              Voilà ce que ça donne en pratique :
            </p>

            <div className="overflow-x-auto mb-6 -mx-6 sm:mx-0">
              <div className="min-w-[640px] px-6 sm:px-0">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-3 font-bold text-gray-900">Outil</th>
                      <th className="text-left py-3 px-3 font-bold text-gray-900">Prix</th>
                      <th className="text-left py-3 px-3 font-bold text-gray-900">Sans appli</th>
                      <th className="text-left py-3 px-3 font-bold text-gray-900">Export data</th>
                      <th className="text-left py-3 px-3 font-bold text-gray-900">Idéal pour</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-3 font-semibold">Qarte</td>
                      <td className="py-3 px-3">19 €/mois forfait</td>
                      <td className="py-3 px-3"><Check className="w-4 h-4 text-emerald-600" /></td>
                      <td className="py-3 px-3"><Check className="w-4 h-4 text-emerald-600" /></td>
                      <td className="py-3 px-3">Salons indépendants beauté</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-3 font-semibold">Heyloy</td>
                      <td className="py-3 px-3">29 €/mois</td>
                      <td className="py-3 px-3"><Check className="w-4 h-4 text-emerald-600" /></td>
                      <td className="py-3 px-3 text-gray-400">Limité</td>
                      <td className="py-3 px-3">Restos, fast food</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-3 font-semibold">Loyverse</td>
                      <td className="py-3 px-3">Gratuit + options payantes</td>
                      <td className="py-3 px-3 text-gray-400">Appli requise</td>
                      <td className="py-3 px-3"><Check className="w-4 h-4 text-emerald-600" /></td>
                      <td className="py-3 px-3">Commerces avec caisse</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-semibold">FidMe</td>
                      <td className="py-3 px-3">Gratuit (publicitaire)</td>
                      <td className="py-3 px-3 text-gray-400">Appli requise</td>
                      <td className="py-3 px-3 text-gray-400">Non</td>
                      <td className="py-3 px-3">Grandes enseignes</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Pour la beauté, le critère qui change tout c&apos;est <strong>« sans appli »</strong>.
              Ta cliente ne va pas télécharger une appli pour ton seul salon. Si tu obliges, ton taux
              d&apos;activation s&apos;effondre. Heyloy et Qarte sont les seuls du tableau qui
              fonctionnent en pur web (un simple lien dans son navigateur).
            </p>

            <p className="text-base text-gray-700 leading-relaxed">
              Au-delà de la carte de fidélité, regarde aussi ce que l&apos;outil propose en plus.
              Qarte inclut dans son forfait Tout-en-un (34 €/mois) : ta vitrine SEO,
              ta <Link href="/blog/logiciel-reservation-en-ligne-salon-beaute" className="text-violet-700 underline hover:text-violet-900">réservation en ligne</Link>,
              les SMS de rappel, le parrainage, les bons cadeaux, et l&apos;anti
                <Link href="/blog/eviter-no-show-salon-rendez-vous" className="text-violet-700 underline hover:text-violet-900"> no-show</Link>.
              Une seule plateforme au lieu de cinq.
            </p>
          </section>

          <section id="parcours-cliente" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <ScanLine className="w-7 h-7 text-violet-600 flex-shrink-0" />
              Le parcours de ta cliente en 3 étapes
            </h2>

            <p className="text-base text-gray-700 leading-relaxed mb-6">
              Pour te projeter, voilà exactement ce qui se passe côté cliente, du premier au
              énième passage :
            </p>

            <div className="space-y-5 mb-6">
              <div className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center font-bold text-lg">1</div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 mb-1">Premier passage : 30 secondes</p>
                  <p className="text-sm text-gray-700 leading-relaxed">À la fin de la prestation, tu lui dis « on a une carte de fidélité digitale, tu scannes ce QR code ? ». Elle ouvre son appareil photo, scanne ton QR, sa carte s&apos;ouvre dans Safari/Chrome. Elle saisit son numéro de portable, et son premier tampon est validé. Aucune appli, aucun compte.</p>
                </div>
              </div>
              <div className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center font-bold text-lg">2</div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 mb-1">Passages suivants : 5 secondes</p>
                  <p className="text-sm text-gray-700 leading-relaxed">Elle rescanne ton QR code, saisit son numéro (qu&apos;elle commence à mémoriser), tampon validé. Tu vois en temps réel sur ton écran combien il lui reste avant la récompense. Tu peux même lui dire « plus que 2 passages avant ton brushing offert ! ».</p>
                </div>
              </div>
              <div className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center font-bold text-lg">3</div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 mb-1">Récompense débloquée : 10 secondes</p>
                  <p className="text-sm text-gray-700 leading-relaxed">Au passage qui déclenche la récompense, tu vois s&apos;afficher « Récompense disponible » sur sa carte. Tu valides en 1 tap, tu lui offres son brushing/soin/produit. Et la carte recommence à zéro pour le prochain cycle. Tu peux aussi déclencher à ce moment un encart « avis Google » qui convertit beaucoup mieux qu&apos;une demande hors contexte.</p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
              <p className="text-sm text-emerald-900 leading-relaxed">
                <strong>Bonus :</strong> tes clientes peuvent ajouter leur carte sur l&apos;écran
                d&apos;accueil de leur téléphone en 2 taps (comme une appli). Au passage suivant,
                elles l&apos;ont accessible en 1 clic, sans rescanner le QR.
              </p>
            </div>
          </section>

          <section id="faq" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Une carte de fidélité dématérialisée, comment ça marche concrètement pour ma cliente ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">Ta cliente scanne ton QR code avec son téléphone (Safari iPhone ou Chrome Android, pas d&apos;appli à télécharger), saisit son numéro, et sa carte est créée. Au passage suivant, elle rescanne, son tampon est ajouté automatiquement. Quand elle atteint le palier (ex&nbsp;: 10 passages), sa récompense est débloquée et tu la valides en 2 secondes au comptoir.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Mes clientes plus âgées vont-elles savoir l&apos;utiliser ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">Oui. C&apos;est juste un QR code à scanner, comme un menu de restaurant. Pas de compte à créer, pas de mot de passe, pas d&apos;appli. La première fois prend 30 secondes, ensuite c&apos;est 1 tap. Les retours des pros sur Qarte montrent que les clientes 60+ scannent sans difficulté dès le 2e passage.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Quel est le prix d&apos;une carte de fidélité digitale pour un salon de beauté ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">Les solutions au forfait coûtent entre 19 € et 50 € par mois (Qarte 19 €/mois en Fidélité, 34 €/mois en Tout-en-un avec vitrine + réservation). Les solutions à la commission prennent 1 à 3 % par passage. Sur un salon avec 200 visites/mois, le forfait revient toujours moins cher. Méfie-toi des outils gratuits qui se rattrapent sur ta data ou des pubs envoyées à tes clientes.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Que se passe-t-il si ma cliente perd son téléphone ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">Rien, sa carte est liée à son numéro de portable, pas à son téléphone physique. Elle récupère son nouveau téléphone, scanne ton QR code, saisit son numéro, et sa carte est de retour avec tous ses tampons.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Et si je change de solution dans 6 mois, je récupère mes données clients ?</h3>
                <p className="text-base text-gray-700 leading-relaxed">Ça dépend du fournisseur. Chez Qarte tu exportes ta base à tout moment (CSV avec numéros, nombres de passages, dates). Vérifie toujours ce point AVANT de signer&nbsp;: certains acteurs verrouillent l&apos;export ou facturent un retrait. Tes clientes sont ton actif numéro un, elles ne doivent jamais être prises en otage.</p>
              </div>
            </div>
          </section>

          <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
            <Smartphone className="w-10 h-10 mx-auto mb-4 opacity-90" />
            <h3 className="text-xl sm:text-2xl font-bold mb-3">
              Lance ta carte de fidélité digitale en 5 minutes
            </h3>
            <p className="text-violet-100 mb-6 max-w-xl mx-auto">
              19 €/mois forfait, sans commission par passage, sans appli pour tes clientes, données
              exportables à vie. 3 jours d&apos;essai gratuit.
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
