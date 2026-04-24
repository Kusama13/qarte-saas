'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, BookOpen } from 'lucide-react';
import { FacebookPixel } from '@/components/analytics/FacebookPixel';
import { BLOG_ARTICLES } from '@/data/blog-articles';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const articles = BLOG_ARTICLES;

export default function BlogPage() {
  const today = new Date().toISOString().split('T')[0];
  const visibleArticles = articles.filter((a) => a.date <= today);

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
                <span className="text-indigo-600">
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
              {visibleArticles.map((article, index) => (
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
                      <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                        <Image
                          src={article.image}
                          alt={article.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
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
