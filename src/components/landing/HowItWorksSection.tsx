'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';

export function HowItWorksSection() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-24 md:py-32 bg-white">
      <div ref={ref} className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-20 md:mb-28 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Lancez-vous en{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">
              2 minutes
            </span>
          </h2>
          <p className="text-lg text-gray-500">Aucune compétence technique requise.</p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 gap-16 md:gap-8 max-w-4xl mx-auto">
          {/* Step 1 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center md:text-left"
          >
            <span className="text-[120px] md:text-[160px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-rose-200 to-rose-100 select-none">
              1
            </span>
            <div className="-mt-6 md:-mt-8">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Créez votre programme
              </h3>
              <p className="text-gray-500 text-lg leading-relaxed max-w-sm mx-auto md:mx-0">
                Logo, couleurs, récompense. En quelques clics, votre carte de fidélité est prête.
              </p>
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center md:text-left"
          >
            <span className="text-[120px] md:text-[160px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-pink-200 to-pink-100 select-none">
              2
            </span>
            <div className="-mt-6 md:-mt-8">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Affichez le QR Code
              </h3>
              <p className="text-gray-500 text-lg leading-relaxed max-w-sm mx-auto md:mx-0">
                Votre cliente scanne après chaque prestation. Elle cumule ses points, vous la fidélisez.
              </p>
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-20"
        >
          <a
            href="/auth/merchant/signup"
            onClick={() => { trackCtaClick('how_it_works', 'how_it_works_section'); fbEvents.initiateCheckout(); }}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            Commencer maintenant
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <p className="text-sm text-gray-400 mt-3">15 jours gratuits pour essayer</p>
        </motion.div>
      </div>
    </section>
  );
}
