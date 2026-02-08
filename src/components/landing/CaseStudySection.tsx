'use client';

import { motion } from 'framer-motion';
import { Star, Check, TrendingUp } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

export function CaseStudySection() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div ref={ref} className="max-w-5xl mx-auto px-6">
        <div className={`text-center mb-12 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full text-amber-700 text-sm font-semibold mb-4">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            Étude de cas
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Comment Nail Salon by Elodie a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">
              doublé ses clientes régulières
            </span>
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden"
        >
          <div className="grid md:grid-cols-2">
            {/* Left: Story */}
            <div className="p-8 md:p-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
                  <img
                    src="/images/testimonial-nail-salon.png"
                    alt="Nail Salon by Elodie"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Nail Salon by Elodie</h3>
                  <p className="text-gray-500 text-sm">Onglerie professionnelle</p>
                </div>
              </div>

              <blockquote className="text-lg text-gray-700 leading-relaxed mb-6 italic border-l-4 border-rose-200 pl-4">
                &quot;Mes clientes perdaient toujours leurs cartes tampons. Avec Qarte, tout est sur leur téléphone. Elles adorent recevoir une notif quand leur pose gratuite est disponible !&quot;
              </blockquote>

              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-full overflow-hidden">
                  <img
                    src="/images/testimonial-nail-salon.png"
                    alt="Elodie H."
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Elodie H.</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Ce qui a changé :</h4>
                {[
                  'Mise en place en 10 minutes',
                  'QR code à l\'accueil',
                  'Récompense : 10ème pose offerte',
                  'Notification push avant les fêtes'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-gray-600 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Results */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 md:p-10 text-white">
              <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-200 mb-8">
                Résultats après 6 mois
              </h4>

              <div className="space-y-8">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black">+127%</span>
                    <TrendingUp className="w-6 h-6 text-emerald-300" />
                  </div>
                  <p className="text-indigo-200 mt-1">de clientes régulières</p>
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black">847</span>
                  </div>
                  <p className="text-indigo-200 mt-1">cartes de fidélité actives</p>
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black">4.8</span>
                    <div className="flex">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-indigo-200 mt-1">note Google (vs 4.2 avant)</p>
                </div>

                <div className="pt-6 border-t border-white/20">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">+2 340€</span>
                    <span className="text-indigo-200">/mois</span>
                  </div>
                  <p className="text-indigo-200 text-sm mt-1">de chiffre d&apos;affaires additionnel estimé</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
