'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle, Plus } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { useTranslations } from 'next-intl';
import { trackFaqOpened } from '@/lib/analytics';

const INITIAL_VISIBLE_FAQS = 4;

// Ordre affiché des questions dans messages/fr.json `faq` (clés q1..q15).
// Non séquentiel car trié par objections les + bloquantes en premier :
// q14 (économies vs concurrent) → q15 (objection marketplace) → q13 (utiliser fidélité seule) →
// q1 (app) → q2 (clientes) → q4-6 (résa/parrainage/anniv) → q9-12 (détails techniques).
const FAQ_ORDER = [14, 15, 13, 1, 2, 4, 5, 6, 9, 10, 11, 12] as const;

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
          className="group w-full flex items-center gap-4 p-5 sm:p-6 text-left cursor-pointer"
          aria-expanded={isOpen}
        >
          <h3
            className={`flex-1 text-lg md:text-xl font-semibold leading-snug transition-colors duration-300 ${
              isOpen ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
            }`}
          >
            {faq.question}
          </h3>

          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="flex-shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors duration-300"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="px-4 sm:px-5 pb-5">
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-base text-gray-500 leading-relaxed">
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
  const [showAll, setShowAll] = useState(false);
  const t = useTranslations('faq');

  const faqItems = FAQ_ORDER.map((i) => ({
    question: t(`q${i}`),
    answer: t(`a${i}`),
  }));
  const visibleItems = showAll ? faqItems : faqItems.slice(0, INITIAL_VISIBLE_FAQS);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <section id="faq" className="relative py-14 md:py-20 overflow-hidden bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div ref={ref} className="relative max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-10 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('title')}{' '}
            <span className="relative font-[family-name:var(--font-display)] italic text-indigo-600">
              {t('titleBold')}
              <span className="absolute -bottom-1 left-0 right-0 h-3 bg-indigo-100/60 -skew-x-3 rounded-sm -z-10" />
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {visibleItems.map((faq, index) => (
            <AccordionItem
              key={index}
              faq={faq}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => {
                const willOpen = openIndex !== index;
                setOpenIndex(willOpen ? index : null);
                if (willOpen) trackFaqOpened({ faq_question: faq.question, faq_index: index });
              }}
            />
          ))}
        </div>

        {/* Show-more toggle (Pareto: top objections by default, rest on demand) */}
        {!showAll && faqItems.length > INITIAL_VISIBLE_FAQS && (
          <div className="flex justify-center mt-5">
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-indigo-600 bg-white border border-indigo-100 rounded-full hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('showMore', { count: faqItems.length - INITIAL_VISIBLE_FAQS })}
            </button>
          </div>
        )}

        {/* WhatsApp compact */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/80 to-white p-4 md:p-5 flex flex-col sm:flex-row items-center gap-3 sm:gap-5"
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
              <p className="text-sm font-bold text-gray-900">{t('whatsappTitle')}</p>
              <p className="text-xs text-gray-400">{t('whatsappSub')}</p>
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
            {t('whatsappCta')}
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
