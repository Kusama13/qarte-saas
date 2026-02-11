'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

const faqs = [
  {
    question: "Et si mes client(e)s n'ont pas de smartphone ?",
    answer: "99% de vos client(e)s ont un smartphone. Pour les rares exceptions, vous pouvez noter leurs points manuellement et les ajouter plus tard. Aucune client(e) n'est laissée de côté.",
  },
  {
    question: "Combien de temps pour être opérationnel ?",
    answer: "5 minutes chrono. Créez votre compte, ajoutez votre logo, définissez votre récompense, imprimez le QR code. C'est prêt. Aucune formation nécessaire.",
  },
  {
    question: "Ça marche pour les prestations à domicile ?",
    answer: "Absolument ! Montrez simplement le QR code sur votre téléphone à votre client(e). Il/elle scanne, et son point est validé. Parfait pour les coiffeuses, esthéticiennes et masseuses à domicile.",
  },
  {
    question: "Mes client(e)s vont trouver ça compliqué ?",
    answer: "Au contraire ! Elles scannent le QR code avec leur appareil photo, c'est tout. Pas d'application à télécharger, pas de compte à créer. Plus simple qu'une carte papier.",
  },
  {
    question: "Que se passe-t-il si j'arrête Qarte ?",
    answer: "Vous exportez vos données client(e)s en CSV quand vous voulez. Pas de piège, pas d'engagement. Vos données vous appartiennent.",
  },
  {
    question: "19€/mois, c'est trop cher pour mon salon ?",
    answer: "C'est 0,63€ par jour — moins qu'un café. Un(e) seul(e) client(e) fidélisé(e) qui revient une fois de plus par mois rembourse votre abonnement. Sans compter les cartes papier que vous n'imprimez plus et le temps gagné.",
  },
  {
    question: "Mes données clients sont-elles protégées (RGPD) ?",
    answer: "100% conforme RGPD. Vos données sont hébergées en Europe, chiffrées, et vous en restez propriétaire. Vos client(e)s peuvent demander la suppression à tout moment. Aucune revente de données, jamais.",
  },
];

function AccordionItem({
  faq,
  index,
  isOpen,
  onToggle,
}: {
  faq: { question: string; answer: string };
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
    >
      <div
        className={`relative rounded-2xl border bg-white transition-all duration-500 ${
          isOpen
            ? 'shadow-xl shadow-indigo-500/8 border-indigo-100'
            : 'shadow-md shadow-gray-200/60 border-gray-100 hover:shadow-lg hover:border-gray-200'
        }`}
      >
        <button
          onClick={onToggle}
          className="group w-full flex items-center gap-5 p-6 md:p-7 text-left cursor-pointer"
          aria-expanded={isOpen}
        >
          {/* Question */}
          <h3
            className={`flex-1 text-lg md:text-xl font-bold leading-snug transition-colors duration-300 ${
              isOpen ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
            }`}
          >
            {faq.question}
          </h3>

          {/* Bouton toggle coloré */}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 transition-shadow duration-300"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </button>

        {/* Réponse animée */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="px-6 md:px-7 pb-7">
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-base md:text-[17px] text-gray-500 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function FAQSection() {
  const { ref, isInView } = useInView();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-28 overflow-hidden">
      {/* Background with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #6366f1 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      <div ref={ref} className="relative max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Une question ?{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              On vous répond
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tout ce qu&apos;il faut savoir avant de lancer votre fidélité digitale.
          </p>
        </div>

        {/* Accordion */}
        <div className="flex flex-col gap-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              faq={faq}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>

        {/* WhatsApp compact */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/80 to-white p-5 md:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 bg-[#25D366] rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900">Une question ? Écrivez-nous directement.</p>
              <p className="text-xs text-gray-400">Réponse en moins d&apos;1h</p>
            </div>
          </div>
          <motion.a
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            href="https://wa.me/33607447420"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            <MessageCircle className="w-4 h-4" />
            Démarrer la discussion
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
