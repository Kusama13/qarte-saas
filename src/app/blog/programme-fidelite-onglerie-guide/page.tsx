'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Clock,
  Star,
  Target,
  Gift,
  Layers,
  Smartphone,
  FileText,
  TrendingUp,
  MessageCircle,
  CalendarCheck,
  Sparkles,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { FacebookPixel } from '@/components/analytics/FacebookPixel';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const tocItems = [
  { id: 'pourquoi', label: 'Pourquoi un programme de fidélité en onglerie' },
  { id: 'quel-type', label: 'Quel type de programme choisir' },
  { id: 'exemples', label: 'Exemples concrets pour onglerie' },
  { id: 'mise-en-place', label: 'Comment le mettre en place' },
  { id: 'papier-vs-digital', label: 'Papier vs Digital : le comparatif' },
  { id: 'astuces', label: 'Astuces pour maximiser l\u2019impact' },
];

export default function ProgrammeFideliteOngleriePage() {
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

        {/* Hero */}
        <section className="py-12 sm:py-20 bg-gradient-to-b from-rose-50/50 to-white">
          <div className="max-w-3xl mx-auto px-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Link
                  href="/blog"
                  className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Blog
                </Link>
                <ChevronRight className="w-3 h-3 text-gray-300" />
                <span className="text-sm text-gray-400">Onglerie</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                Programme fidélité onglerie : le guide complet pour{' '}
                <span className="bg-gradient-to-r from-rose-500 to-indigo-600 bg-clip-text text-transparent">
                  fidéliser vos clientes
                </span>
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Remplissage toutes les 3 semaines, semi-permanent tous les mois, gel UV
                régulièrement... L&apos;onglerie est l&apos;un des métiers de la beauté où la récurrence
                est la plus naturelle. Pourtant, beaucoup d&apos;ongleries perdent des clientes au
                profit de la concurrence. Un programme de fidélité bien pensé transforme cette
                récurrence naturelle en véritable avantage compétitif.
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  7 min de lecture
                </span>
                <span>Mis à jour en 2025</span>
              </div>
            </motion.div>
            <div className="mt-8 rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80"
                alt="Vernis à ongles colorés — programme fidélité onglerie"
                width={1200}
                height={675}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        </section>

        {/* Table of Contents */}
        <section className="py-8 border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-6">
            <motion.nav
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-gray-50 rounded-2xl p-6"
            >
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                Sommaire
              </h2>
              <ol className="space-y-2">
                {tocItems.map((item, index) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="flex items-center gap-3 text-sm text-gray-600 hover:text-indigo-600 transition-colors py-1"
                    >
                      <span className="flex-shrink-0 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-xs font-semibold text-gray-400">
                        {index + 1}
                      </span>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </motion.nav>
          </div>
        </section>

        {/* Article Content */}
        <article className="py-12 sm:py-16">
          <div className="max-w-3xl mx-auto px-6">

            {/* Section 1: Pourquoi */}
            <motion.section
              id="pourquoi"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="mb-16"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-shrink-0 w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-rose-600" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Pourquoi un programme de fidélité en onglerie
                </h2>
              </div>

              <p className="text-gray-600 leading-relaxed mb-6">
                En onglerie, la fréquence de visite est un atout naturel que peu d&apos;autres commerces
                possèdent. Une cliente qui fait un remplissage revient toutes les 3 semaines. Un
                semi-permanent demande un rendez-vous tous les mois. Cette régularité est une mine
                d&apos;or pour construire une relation de fidélité. Mais encore faut-il la structurer.
              </p>

              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Un cycle naturel de 3 à 4 semaines
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Contrairement à un restaurant où le client peut revenir à n&apos;importe quel moment (ou
                jamais), l&apos;onglerie bénéficie d&apos;un cycle biologique imposé : les ongles poussent,
                le vernis s&apos;abîme, le gel a besoin d&apos;être entretenu. Votre cliente <strong className="text-gray-900">doit</strong> revenir.
                La question n&apos;est pas &laquo; est-ce qu&apos;elle va revenir &raquo;, mais &laquo; est-ce
                qu&apos;elle va revenir <em>chez vous</em> &raquo;. C&apos;est exactement là qu&apos;un programme de fidélité
                fait la différence.
              </p>

              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Une concurrence de plus en plus forte
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Le nombre d&apos;ongleries a explosé ces dernières années. Dans certains quartiers, on en
                compte trois ou quatre dans la même rue. Votre cliente a le choix. Si elle n&apos;a aucune
                raison particulière de rester fidèle, elle testera la nouvelle onglerie qui vient
                d&apos;ouvrir à 200 mètres. Un programme de fidélité crée cette raison : chaque visite la
                rapproche d&apos;une récompense qu&apos;elle ne veut pas perdre.
              </p>

              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Le prix seul ne fidélise pas
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Beaucoup d&apos;ongleries tombent dans le piège de la guerre des prix. Baisser ses tarifs
                pour attirer des clientes est une stratégie dangereuse : vous réduisez vos marges, vous
                attirez des clientes qui partiront dès qu&apos;elles trouveront moins cher ailleurs, et vous
                dévalorisez votre travail. Un programme de fidélité offre une alternative intelligente :
                la cliente perçoit un avantage sans que vous ne cassiez vos prix.
              </p>

              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Le saviez-vous ?</p>
                    <p className="text-sm text-gray-600">
                      Selon une étude de Bain & Company, une cliente fidèle dépense en moyenne{' '}
                      <strong className="text-indigo-700">67 % de plus</strong> qu&apos;une nouvelle cliente.
                      Et il coûte{' '}
                      <strong className="text-indigo-700">5 à 7 fois moins cher</strong> de fidéliser une
                      cliente existante que d&apos;en acquérir une nouvelle.
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>

            <div className="mb-16 rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=1200&q=80"
                alt="Manucure en cours dans un salon de nail art"
                width={1200}
                height={675}
                className="w-full h-auto"
              />
            </div>

            {/* Section 2: Quel type */}
            <motion.section
              id="quel-type"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="mb-16"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-shrink-0 w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Layers className="w-5 h-5 text-violet-600" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Quel type de programme de fidélité choisir
                </h2>
              </div>

              <p className="text-gray-600 leading-relaxed mb-8">
                Il existe trois grandes familles de programmes de fidélité. Chacune a ses avantages et
                ses limites. Voici comment choisir la plus adaptée à votre onglerie.
              </p>

              {/* Carte a tampon */}
              <div className="border border-gray-100 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  1. La carte à tampon classique
                </h3>
                <p className="text-gray-600 leading-relaxed mb-3">
                  Le principe est simple : un tampon par visite, et au bout de X tampons, une prestation
                  offerte. C&apos;est le format le plus connu et le plus facile à comprendre pour la
                  cliente.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Simple à comprendre
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
                    Peu engageant sur la durée
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
                    Risque de fraude (tampon copié)
                  </span>
                </div>
              </div>

              {/* Programme a points */}
              <div className="border border-gray-100 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  2. Le programme à points
                </h3>
                <p className="text-gray-600 leading-relaxed mb-3">
                  La cliente accumule des points en fonction du montant dépensé (par exemple, 1 point
                  par euro). Elle peut ensuite les échanger contre des avantages. Ce format est plus
                  flexible : une cliente qui fait une pose complète gagne plus de points qu&apos;une retouche
                  simple.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Flexible
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Récompense proportionnelle
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
                    Peut être complexe à gérer
                  </span>
                </div>
              </div>

              {/* Programme a paliers */}
              <div className="border-2 border-indigo-200 rounded-2xl p-6 mb-8 bg-indigo-50/30">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    3. Le programme à paliers
                  </h3>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                    Recommandé
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed mb-3">
                  C&apos;est le format le plus engageant. La cliente passe des paliers (niveaux) en fonction
                  de sa fréquence de visite. Chaque palier débloque une récompense différente. L&apos;effet
                  psychologique est puissant : la cliente voit sa progression et ne veut pas &laquo;
                  perdre &raquo; ses acquis. C&apos;est le même mécanisme qui rend les jeux vidéo addictifs.
                </p>
                <p className="text-gray-600 leading-relaxed mb-3">
                  Pour une onglerie, nous recommandons un programme à <strong className="text-gray-900">2
                  paliers</strong>. C&apos;est suffisamment simple pour être compris immédiatement, mais
                  suffisamment engageant pour maintenir la motivation. Le premier palier est accessible
                  rapidement (effet de gratification immédiate), le second récompense la vraie fidélité.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Très engageant
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Effet de progression
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Fidélisation long terme
                  </span>
                </div>
              </div>
            </motion.section>

            {/* Section 3: Exemples concrets */}
            <motion.section
              id="exemples"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="mb-16"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Gift className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Exemples concrets pour onglerie
                </h2>
              </div>

              <p className="text-gray-600 leading-relaxed mb-8">
                Voici des exemples de programmes de fidélité testés et approuvés par des ongleries.
                Adaptez-les à votre carte de prestations et à vos marges.
              </p>

              {/* Exemple 1: Programme a paliers */}
              <div className="bg-gradient-to-br from-rose-50 to-indigo-50 rounded-2xl p-6 sm:p-8 mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Programme à 2 paliers (recommandé)
                </h3>
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-5 border border-rose-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-rose-500" />
                      <span className="font-bold text-gray-900">Palier 1 : 8 passages</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Pose de vernis classique offerte (ou limage + soin des cuticules).
                      Coût réel pour vous : environ 5 à 8 euros de produit et 20 minutes de votre temps.
                      Valeur perçue par la cliente : 25 à 35 euros.
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-indigo-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <span className="font-bold text-gray-900">Palier 2 : 15 passages</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Nail art premium offert sur une main complète (ou un soin paraffine mains).
                      Coût réel : 10 à 15 euros. Valeur perçue : 40 à 60 euros.
                      Ce palier récompense les clientes vraiment régulières. En 15 visites à raison
                      d&apos;une toutes les 3 semaines, cela représente environ 11 mois de fidélité.
                    </p>
                  </div>
                </div>
              </div>

              {/* Exemple 2: Variante simple */}
              <div className="border border-gray-100 rounded-2xl p-6 sm:p-8 mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Variante simple : la réduction ciblée
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Si vous préférez un programme plus direct : <strong className="text-gray-900">-20 %
                  sur le prochain remplissage après 5 passages</strong>. C&apos;est moins engageant à
                  long terme, mais très efficace pour les clientes qui hésitent entre vous et la
                  concurrence. Cinq passages représentent environ 3 mois de fidélité, ce qui est
                  un objectif très atteignable.
                </p>
              </div>

              {/* Astuce */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Astuce de pro</p>
                    <p className="text-sm text-gray-600">
                      Offrez quelque chose qui vous coûte peu mais qui a beaucoup de valeur perçue.
                      Un nail art personnalisé, par exemple, nécessite 10 minutes de plus et quelques
                      centimes de vernis, mais la cliente le voit comme un service premium à 30 euros ou
                      plus. Le ratio coût/valeur perçue est la clé d&apos;un programme de fidélité rentable.
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>

            <div className="mb-16 rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=1200&q=80"
                alt="Résultat de nail art professionnel sur ongles"
                width={1200}
                height={675}
                className="w-full h-auto"
              />
            </div>

            {/* Section 4: Comment le mettre en place */}
            <motion.section
              id="mise-en-place"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="mb-16"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Comment mettre en place votre programme
                </h2>
              </div>

              <p className="text-gray-600 leading-relaxed mb-8">
                Pas besoin de passer des heures à configurer quoi que ce soit. Voici les 5 étapes
                pour lancer votre programme de fidélité en onglerie, du choix de la récompense
                jusqu&apos;au suivi des résultats.
              </p>

              {/* Etape 1 */}
              <div className="relative pl-8 pb-8 border-l-2 border-indigo-100">
                <div className="absolute -left-3.5 top-0 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Choisir la récompense
                </h3>
                <p className="text-gray-600 leading-relaxed mb-2">
                  La règle d&apos;or : votre récompense doit avoir un <strong className="text-gray-900">coût
                  réel faible pour vous</strong> mais une <strong className="text-gray-900">valeur perçue
                  élevée pour la cliente</strong>. En onglerie, les meilleures récompenses sont les
                  prestations que vous maîtrisez et qui ne consomment que du temps et un peu de produit :
                  vernis classique, nail art, soin des mains, etc.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Évitez les réductions en pourcentage sur des prestations chères (comme -30 % sur une
                  pose complète) : cela grignote vos marges sans créer de véritable attachement
                  émotionnel.
                </p>
              </div>

              {/* Etape 2 */}
              <div className="relative pl-8 pb-8 border-l-2 border-indigo-100">
                <div className="absolute -left-3.5 top-0 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Définir le nombre de passages requis
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Ne soyez pas trop gourmande. Un objectif de 20 passages avant une récompense
                  découragera la majorité de vos clientes. La règle : entre{' '}
                  <strong className="text-gray-900">6 et 10 passages</strong> pour le premier palier.
                  Avec un rythme de 1 visite toutes les 3 semaines, 8 passages représentent environ 6
                  mois. C&apos;est un horizon motivant et réaliste. La cliente doit sentir que la récompense
                  est atteignable, pas lointaine.
                </p>
              </div>

              {/* Etape 3 */}
              <div className="relative pl-8 pb-8 border-l-2 border-indigo-100">
                <div className="absolute -left-3.5 top-0 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Choisir le support : papier ou digital
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  C&apos;est un choix important qui impacte l&apos;expérience de vos clientes au quotidien.
                  La carte papier est traditionnelle mais présente de nombreuses limites (perte, fraude,
                  aucune donnée client). Le digital offre plus de possibilités et une meilleure
                  expérience. Nous détaillons ce comparatif dans la section suivante, et vous pouvez
                  aussi consulter notre{' '}
                  <Link
                    href="/qarte-vs-carte-papier"
                    className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                  >
                    comparatif complet carte papier vs digitale
                  </Link>.
                </p>
              </div>

              {/* Etape 4 */}
              <div className="relative pl-8 pb-8 border-l-2 border-indigo-100">
                <div className="absolute -left-3.5 top-0 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">4</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Communiquer sur votre programme
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Un programme de fidélité qui reste un secret est un programme inutile. Voici les
                  canaux à activer dès le lancement :{' '}
                  <strong className="text-gray-900">une affiche visible dans votre onglerie</strong> (à
                  l&apos;accueil et au poste de travail),{' '}
                  <strong className="text-gray-900">un post sur vos réseaux sociaux</strong> (Instagram
                  est incontournable en onglerie),{' '}
                  <strong className="text-gray-900">une mention systématique en caisse</strong> (&laquo;
                  Vous connaissez notre programme de fidélité ? &raquo;). Les premières semaines, proposez-le à
                  chaque cliente sans exception. Au bout d&apos;un mois, le bouche-à-oreille prendra le relais.
                </p>
              </div>

              {/* Etape 5 */}
              <div className="relative pl-8 pb-0">
                <div className="absolute -left-3.5 top-0 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">5</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Mesurer et ajuster
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Après 2 à 3 mois, analysez les résultats. Combien de clientes participent ? Quel
                  est le taux de complétion du premier palier ? Si moins de 30 % de vos clientes
                  atteignent le palier 1, c&apos;est peut-être que la récompense n&apos;est pas assez attractive
                  ou que le nombre de passages est trop élevé. Ajustez en conséquence. Un programme de
                  fidélité n&apos;est pas figé : les meilleurs sont ceux qui évoluent avec les retours du
                  terrain.
                </p>
              </div>
            </motion.section>

            {/* Section 5: Papier vs Digital */}
            <motion.section
              id="papier-vs-digital"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="mb-16"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Papier vs Digital : le comparatif pour onglerie
                </h2>
              </div>

              <p className="text-gray-600 leading-relaxed mb-8">
                Au-delà des avantages généraux du digital (pas de perte, statistiques, notifications),
                l&apos;onglerie a un problème spécifique qui rend la carte papier encore plus inadaptée.
              </p>

              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  Le problème des mains occupées
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Réfléchissez à ce moment : votre cliente vient de finir sa prestation. Son vernis est
                  frais, ses ongles sont impeccables. Et vous lui demandez de fouiller dans son sac pour
                  trouver sa carte de fidélité ? De manipuler un petit carton avec des ongles encore
                  fragiles ? C&apos;est un irritant que beaucoup d&apos;ongleries sous-estiment. Résultat : la
                  cliente dit &laquo; pas grave, la prochaine fois &raquo;, et la carte finit au fond du sac,
                  puis à la poubelle.
                </p>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-4">
                La solution : le QR code
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Avec un programme digital basé sur un QR code, la validation se fait en 2 secondes. La
                cliente n&apos;a même pas besoin de sortir quoi que ce soit : <strong className="text-gray-900">c&apos;est
                vous qui scannez</strong> (ou elle scanne un QR code affiché avec son téléphone, sans
                toucher à ses ongles). Pas de carte à trouver, pas de tampon à apposer, pas de risque
                de perte. Le point est validé instantanément et la cliente voit sa progression en temps
                réel sur son téléphone.
              </p>

              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900 mb-1">73 %</p>
                  <p className="text-xs text-gray-500">des cartes papier sont perdues ou oubliées</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-indigo-600 mb-1">2 sec</p>
                  <p className="text-xs text-gray-500">pour valider un passage avec un QR code</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600 mb-1">0</p>
                  <p className="text-xs text-gray-500">carte perdue avec le digital</p>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed">
                Un autre avantage non négligeable : avec le digital, vous récupérez les données de
                vos clientes (fréquence de visite, prestations préférées, date de dernier passage).
                Ces informations vous permettent d&apos;envoyer des rappels automatiques et de personnaliser
                votre communication. Avec une carte papier, vous ne savez rien de vos clientes.
              </p>
            </motion.section>

            <div className="mb-16 rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=1200&q=80"
                alt="Professionnelle de l'onglerie au travail"
                width={1200}
                height={675}
                className="w-full h-auto"
              />
            </div>

            {/* Section 6: Astuces */}
            <motion.section
              id="astuces"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="mb-16"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  7 astuces pour maximiser l&apos;impact de votre programme
                </h2>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                    <span className="text-rose-700 text-sm font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">
                      Proposez le scan dès l&apos;arrivée, pas à la fin
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      C&apos;est l&apos;erreur numéro 1 en onglerie. Si vous attendez la fin de la prestation pour
                      valider le point, le vernis est frais et la cliente ne veut pas manipuler son
                      téléphone. Prenez l&apos;habitude de scanner le QR code ou de valider la visite dès
                      l&apos;accueil. &laquo; Bonjour Marie, je vous valide votre point fidélité tout de suite ! &raquo;
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                    <span className="text-rose-700 text-sm font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">
                      Envoyez un rappel quand le remplissage approche
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Si vous utilisez une solution digitale, programmez un rappel automatique 2 à 3
                      semaines après la dernière visite. Un simple &laquo; Vos ongles ont besoin d&apos;un petit
                      rafraîchissement ? Prenez rendez-vous ! &raquo; suffit à déclencher la prise de
                      rendez-vous. Sans rappel, la cliente peut oublier, décaler, et finalement aller
                      ailleurs.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                    <span className="text-rose-700 text-sm font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">
                      Fêtez les anniversaires
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Un nail art gratuit ou un petit soin offert le jour de l&apos;anniversaire de votre
                      cliente crée un lien émotionnel fort. Cela ne vous coûte presque rien, mais la
                      cliente s&apos;en souviendra. C&apos;est le genre de geste qui génère du bouche-à-oreille
                      naturel et des stories Instagram spontanées.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                    <span className="text-rose-700 text-sm font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">
                      Demandez un avis Google après la 3ème visite
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Une cliente qui revient 3 fois est satisfaite. C&apos;est le moment idéal pour lui
                      demander un avis Google. Pas avant (elle ne vous connaît pas assez), pas trop
                      après (l&apos;enthousiasme retombe). Un bon timing, une demande polie, et votre
                      note Google grimpe. Les avis Google sont essentiels pour attirer de nouvelles
                      clientes qui cherchent &laquo; onglerie &raquo; sur Google Maps.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                    <span className="text-rose-700 text-sm font-bold">5</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">
                      Créez un bonus de parrainage
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Vos clientes fidèles sont vos meilleures ambassadrices. Offrez un point bonus
                      (ou un avantage direct) quand une cliente vous amène une amie. Le parrainage
                      combiné au programme de fidélité crée un cercle vertueux : la fidèle parraine,
                      la nouvelle cliente s&apos;inscrit au programme, et ainsi de suite.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                    <span className="text-rose-700 text-sm font-bold">6</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">
                      Mettez en avant la progression
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Quand une cliente est à 2 passages du palier suivant, dites-le-lui :
                      &laquo; Encore 2 visites et vous débloquez votre nail art offert ! &raquo; Cet
                      effet de proximité au but (&laquo; goal gradient effect &raquo; en psychologie
                      comportementale) est extrêmement puissant pour accélérer la prise de rendez-vous.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                    <span className="text-rose-700 text-sm font-bold">7</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">
                      Variez les récompenses selon les saisons
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      En été, offrez un nail art &laquo; summer edition &raquo;. En décembre, proposez un soin
                      mains hivernal ou un vernis pailleté offert. Les récompenses saisonnières
                      renouvellent l&apos;intérêt et donnent envie de continuer à accumuler des points.
                      Cela donne aussi du contenu pour vos réseaux sociaux.
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>
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
                Lancez votre programme de fidélité en 2 minutes
              </h2>
              <p className="text-indigo-100 text-lg mb-3">
                Qarte est la carte de fidélité digitale conçue pour les professionnelles de la beauté.
                Pas d&apos;application à télécharger, pas de matériel. Un QR code, et c&apos;est parti.
              </p>
              <p className="text-indigo-200 mb-8">
                19 &euro;/mois &middot; 15 jours d&apos;essai gratuit &middot; Sans engagement
              </p>
              <Link
                href="/essai-gratuit"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 font-bold rounded-2xl hover:bg-indigo-50 transition-colors text-lg"
              >
                Essayer Qarte gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Related Articles */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-xl font-bold text-gray-900 mb-8">
              Articles similaires
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <Link
                href="/blog/fideliser-clientes-salon-coiffure"
                className="group block bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:shadow-indigo-500/5 transition-all"
              >
                <span className="inline-flex px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full mb-3">
                  Coiffure
                </span>
                <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2 leading-tight">
                  Comment fidéliser ses clientes en salon de coiffure
                </h3>
                <p className="text-sm text-gray-500">
                  Les stratégies qui fonctionnent vraiment pour faire revenir vos clientes régulièrement.
                </p>
              </Link>
              <Link
                href="/blog/augmenter-recurrence-client-institut-beaute"
                className="group block bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:shadow-indigo-500/5 transition-all"
              >
                <span className="inline-flex px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full mb-3">
                  Institut
                </span>
                <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2 leading-tight">
                  Comment augmenter la récurrence client en institut de beauté
                </h3>
                <p className="text-sm text-gray-500">
                  Les techniques concrètes pour transformer un passage unique en rendez-vous régulier.
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
