'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, ShieldCheck, MessageCircle } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

export function FAQSection() {
  const { ref, isInView } = useInView();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const faqs = [
    {
      question: "Et si mes clientes n'ont pas de smartphone ?",
      answer: "99% de vos clientes ont un smartphone. Pour les rares exceptions, vous pouvez noter leurs points manuellement et les ajouter plus tard. Aucune cliente n'est laissée de côté."
    },
    {
      question: "Combien de temps pour être opérationnel ?",
      answer: "5 minutes chrono. Créez votre compte, ajoutez votre logo, définissez votre récompense, imprimez le QR code. C'est prêt. Aucune formation nécessaire."
    },
    {
      question: "Ça marche pour les prestations à domicile ?",
      answer: "Absolument ! Montrez simplement le QR code sur votre téléphone à votre cliente. Elle scanne, et son point est validé. Parfait pour les coiffeuses, esthéticiennes et masseuses à domicile."
    },
    {
      question: "Mes clientes vont trouver ça compliqué ?",
      answer: "Au contraire ! Elles scannent le QR code avec leur appareil photo, c'est tout. Pas d'application à télécharger, pas de compte à créer. Plus simple qu'une carte papier."
    },
    {
      question: "Que se passe-t-il si j'arrête Qarte ?",
      answer: "Vous exportez vos données clientes en CSV quand vous voulez. Pas de piège, pas d'engagement. Vos données vous appartiennent."
    },
    {
      question: "19€/mois, c'est trop cher pour mon salon ?",
      answer: "C'est 0,63€ par jour — moins qu'un café. Une seule cliente fidélisée qui revient une fois de plus par mois rembourse votre abonnement. Sans compter les cartes papier que vous n'imprimez plus et le temps gagné."
    },
    {
      question: "Mes données clients sont-elles protégées (RGPD) ?",
      answer: "100% conforme RGPD. Vos données sont hébergées en Europe, chiffrées, et vous en restez propriétaire. Vos clientes peuvent demander la suppression à tout moment. Aucune revente de données, jamais."
    }
  ];

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % faqs.length);
  }, [faqs.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + faqs.length) % faqs.length);
  }, [faqs.length]);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(handleNext, 6000);
    return () => clearInterval(interval);
  }, [handleNext, isHovered]);

  return (
    <section id="faq" className="py-24 bg-gray-50/50 overflow-hidden">
      <div ref={ref} className="max-w-5xl mx-auto px-6">
        <div className={`text-center mb-20 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Questions fréquentes
          </h2>
          <p className="text-xl text-gray-600">Tout ce que vous devez savoir pour booster votre fidélité.</p>
        </div>

        <div
          className="relative max-w-2xl mx-auto h-[400px] md:h-[350px] mb-20"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{ perspective: "1000px" }}
        >
          <AnimatePresence mode="popLayout">
            {faqs.map((faq, index) => {
              const isFront = index === currentIndex;
              const isNext = index === (currentIndex + 1) % faqs.length;
              const isAfter = index === (currentIndex + 2) % faqs.length;

              if (!isFront && !isNext && !isAfter) return null;

              const position = isFront ? 0 : isNext ? 1 : 2;

              return (
                <motion.div
                  key={index}
                  initial={false}
                  animate={{
                    y: position * 20,
                    scale: 1 - position * 0.05,
                    opacity: isFront ? 1 : isNext ? 0.6 : 0.2,
                    zIndex: 10 - position,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  exit={{ x: -300, rotate: -10, opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 w-full"
                >
                  <div className={`h-full w-full bg-white rounded-3xl border border-gray-100 shadow-xl shadow-indigo-500/5 p-8 md:p-10 flex flex-col justify-center relative overflow-hidden transition-colors ${isFront ? 'border-indigo-100' : ''}`}>
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none">
                      <span className="text-9xl font-black italic text-indigo-600">
                        0{index + 1}
                      </span>
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-6">
                        <span className="flex-shrink-0 w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-200">
                          {index + 1}
                        </span>
                        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                          {faq.question}
                        </h3>
                      </div>
                      <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-medium">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="absolute -bottom-16 left-0 right-0 flex items-center justify-between px-4 z-20">
            <div className="flex gap-2">
              {faqs.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentIndex ? 'w-8 bg-indigo-600' : 'w-2 bg-gray-300 hover:bg-indigo-300'
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePrev}
                className="w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* WhatsApp Contact Block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 max-w-4xl mx-auto overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-50/80 via-white/40 to-emerald-50/50 backdrop-blur-md border border-emerald-100/50 shadow-2xl shadow-emerald-900/5"
        >
          <div className="grid md:grid-cols-2 items-center">
            {/* Visual Chat Side */}
            <div className="relative p-8 md:p-12 bg-gradient-to-br from-emerald-500/10 to-transparent border-r border-emerald-100/30 overflow-hidden min-h-[300px] flex flex-col justify-center gap-4">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={isInView ? { x: 0, opacity: 1 } : {}}
                transition={{ delay: 0.8 }}
                className="self-start max-w-[85%] bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-emerald-50"
              >
                <p className="text-sm text-slate-700 leading-relaxed">
                  Bonjour ! J&apos;aimerais en savoir plus sur l&apos;accompagnement personnalisé...
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">14:02</span>
              </motion.div>

              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={isInView ? { x: 0, opacity: 1 } : {}}
                transition={{ delay: 1.2 }}
                className="self-end max-w-[85%] bg-emerald-500 text-white rounded-2xl rounded-tr-none p-4 shadow-lg shadow-emerald-500/20"
              >
                <p className="text-sm leading-relaxed">
                  Hello ! Je suis là pour vous répondre. Quel est votre projet ?
                </p>
                <div className="flex justify-end items-center gap-1 mt-1">
                  <span className="text-[10px] text-emerald-100">14:05</span>
                  <Check className="w-3 h-3 text-emerald-200" />
                </div>
              </motion.div>

              {/* Animated Icon Floating Backdrop */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-10">
                <MessageCircle className="w-64 h-64 text-emerald-600 rotate-12" />
              </div>
            </div>

            {/* Content Side */}
            <div className="p-8 md:p-12 text-left">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <MessageCircle className="w-7 h-7 text-white" />
                    </motion.div>
                  </div>
                  <motion.span
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full shadow-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                      En ligne
                    </span>
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      &lt; 1h
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">Direct avec le fondateur</p>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mb-4 leading-tight">
                Besoin d&apos;un échange <br/><span className="text-emerald-600">rapide et humain ?</span>
              </h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Pas de bot, pas de ticket support. Posez vos questions directement sur WhatsApp et recevez une réponse personnalisée.
              </p>

              <div className="flex flex-col gap-4">
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href="https://wa.me/33607447420"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-emerald-500/20"
                >
                  <svg className="w-6 h-6 transition-transform group-hover:rotate-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Démarrer la discussion
                </motion.a>

                <div className="flex items-center justify-center gap-4 text-slate-400 text-xs font-medium">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Données sécurisées
                  </div>
                  <div className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span>Sans engagement</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
