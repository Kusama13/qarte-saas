'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, BookOpen } from 'lucide-react';
import { FacebookPixel } from '@/components/analytics/FacebookPixel';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface Article {
  slug: string;
  title: string;
  description: string;
  readTime: string;
  category: string;
  date: string;
  image: string;
}

const articles: Article[] = [
  {
    slug: 'comment-attirer-clientes-salon-beaute',
    title: 'Comment attirer plus de clientes dans son salon de beauté : 12 stratégies qui marchent en 2026',
    description:
      '70 % des nouvelles clientes ne reviennent pas. Google Business, réservation en ligne, Instagram, parrainage, fidélité : les 12 leviers concrets pour remplir ton agenda salon, institut ou onglerie.',
    readTime: '10 min',
    category: 'Acquisition',
    date: '2026-04-16',
    image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'eviter-no-show-salon-rendez-vous',
    title: 'No-show en salon de beauté : comment éviter les rendez-vous manqués en 2026',
    description:
      'Un no-show coûte entre 35 et 80 € à un salon. La méthode complète en 6 étapes pour diviser par 4 les rendez-vous manqués : acompte, SMS de rappel, politique d\'annulation, liste d\'attente.',
    readTime: '8 min',
    category: 'Gestion',
    date: '2026-04-16',
    image: 'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&w=800&q=80',
  },
  {
    slug: 'logiciel-reservation-en-ligne-salon-beaute',
    title: 'Logiciel de réservation en ligne pour salon de beauté : le comparatif 2026',
    description:
      'Planity, Treatwell, Booksy, Qarte : comparatif honnête des 4 logiciels qui dominent le marché. Tarifs, commissions cachées, fonctionnalités, pour quel type de salon.',
    readTime: '9 min',
    category: 'Outils',
    date: '2026-04-16',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
  },
];

export default function BlogPage() {
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
              href="/auth/merchant/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Essai gratuit
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="py-16 sm:py-24 bg-gradient-to-b from-indigo-50/50 to-white">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full mb-6">
                <BookOpen className="w-4 h-4" />
                Blog Qarte
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                Conseils fidélisation pour{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  salons de beauté
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Guides pratiques, astuces et retours d&apos;expérience pour fidéliser vos clientes
                et développer votre activité.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article, index) => (
                <motion.article
                  key={article.slug}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link
                    href={`/blog/${article.slug}`}
                    className="group block h-full"
                  >
                    <div className="h-full border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300">
                      <div className="relative h-48 overflow-hidden bg-gray-100">
                        <Image
                          src={article.image}
                          alt={article.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="inline-flex px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                            {article.category}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            {article.readTime}
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors leading-tight">
                          {article.title}
                        </h2>
                        <p className="text-sm text-gray-500 leading-relaxed mb-4">
                          {article.description}
                        </p>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 group-hover:gap-2 transition-all">
                          Lire l&apos;article
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-r from-indigo-600 to-violet-600">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Lancez votre programme de fidélité en 2 minutes
            </h2>
            <p className="text-indigo-100 mb-8">
              Pas d&apos;application à télécharger, pas de matériel. Un QR code et c&apos;est parti.
            </p>
            <Link
              href="/auth/merchant/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 font-bold rounded-2xl hover:bg-indigo-50 transition-colors"
            >
              Essayer gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
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
