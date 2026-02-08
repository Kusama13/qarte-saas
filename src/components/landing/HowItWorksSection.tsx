'use client';

import { motion } from 'framer-motion';
import { Sparkles, QrCode, ArrowRight } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';

export function HowItWorksSection() {
  const { ref, isInView } = useInView();

  const steps = [
    {
      number: '01',
      title: 'Créez votre programme',
      description: 'Inscription gratuite, personnalisez vos récompenses et votre design en quelques clics.',
      icon: Sparkles,
      color: 'from-rose-400 to-pink-500'
    },
    {
      number: '02',
      title: 'Affichez le QR Code',
      description: 'Imprimez-le ou gardez-le sur votre téléphone. Vos clientes scannent et cumulent leurs points.',
      icon: QrCode,
      color: 'from-pink-500 to-rose-600'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div ref={ref} className="max-w-5xl mx-auto px-6">
        <div className={`text-center mb-14 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Lancez-vous en{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">
              2 minutes
            </span>
          </h2>
          <p className="text-lg text-gray-600">Aucune compétence technique requise.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative group"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-gray-200 to-transparent z-0" />
              )}

              <div className="relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-rose-100 hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-300 z-10 hover:-translate-y-1">
                {/* Visual illustration */}
                <div className="mb-5 h-32 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center overflow-hidden">
                  {index === 0 ? (
                    /* Step 1: Phone with form */
                    <div className="relative w-16 h-28 bg-white rounded-xl shadow-lg border border-gray-200 p-2">
                      <div className="w-full h-2 bg-rose-200 rounded mb-1.5"></div>
                      <div className="w-3/4 h-2 bg-gray-100 rounded mb-1.5"></div>
                      <div className="w-full h-2 bg-rose-200 rounded mb-1.5"></div>
                      <div className="w-3/4 h-2 bg-gray-100 rounded mb-1.5"></div>
                      <div className="w-full h-3 bg-gradient-to-r from-rose-400 to-pink-400 rounded mt-2"></div>
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-gray-300 rounded-full"></div>
                    </div>
                  ) : (
                    /* Step 2: QR Code */
                    <div className="relative">
                      <div className="w-20 h-20 bg-white rounded-lg shadow-lg p-2 border border-gray-200">
                        <div className="w-full h-full grid grid-cols-4 gap-0.5">
                          {[...Array(16)].map((_, i) => (
                            <div key={i} className={`rounded-sm ${[0,1,3,4,5,7,8,10,12,13,15].includes(i) ? 'bg-gray-800' : 'bg-white'}`}></div>
                          ))}
                        </div>
                      </div>
                      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-14 bg-white rounded-lg shadow border border-gray-200 flex items-center justify-center">
                        <div className="w-1 h-1 bg-rose-400 rounded-full animate-ping"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step number badge */}
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} text-white font-bold text-sm mb-3 shadow-lg`}>
                  <step.icon className="w-5 h-5" />
                </div>

                <div className="text-xs font-bold text-rose-500 tracking-widest mb-2">
                  ÉTAPE {step.number}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>

                <p className="text-gray-600 leading-relaxed text-sm">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className={`text-center mt-12 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.5s' }}>
          <a
            href="/auth/merchant/signup"
            onClick={() => { trackCtaClick('how_it_works', 'how_it_works_section'); fbEvents.initiateCheckout(); }}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            Commencer maintenant
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <p className="text-sm text-gray-500 mt-3">15 jours gratuits pour essayer</p>
        </div>
      </div>
    </section>
  );
}
