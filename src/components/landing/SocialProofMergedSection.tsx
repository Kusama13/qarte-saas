'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useInView } from '@/hooks/useInView';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Heart, Star, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';
import { ttEvents } from '@/components/analytics/TikTokPixel';

/**
 * Merged social proof section — replaces TestimonialsSection + CaseStudySection.
 * Skills applied:
 *  - page-cro: page length reduction (1 header instead of 2, 3 testimonials instead of 5)
 *  - marketing-psychology: Social proof (Bandwagon Effect) + Availability heuristic
 *    (vivid case study makes success feel achievable)
 *  - copywriting: one section, one purpose (build credibility)
 */

interface Avatar {
  logo_url: string | null;
  initial: string;
  bgClass: string;
  textClass: string;
}

interface Review {
  rating: string;
  title: string;
  text: string;
  name: string;
  shopType: string;
  avatar: Avatar;
}

const AVATARS: Avatar[] = [
  { logo_url: null,                                initial: 'F', bgClass: 'bg-rose-100',    textClass: 'text-rose-700'    },
  { logo_url: '/images/testimonials/yam.png',     initial: 'Y', bgClass: 'bg-emerald-100', textClass: 'text-emerald-700' },
  { logo_url: '/images/testimonials/ericka.jpeg', initial: 'E', bgClass: 'bg-indigo-100',  textClass: 'text-indigo-700'  },
  { logo_url: '/images/testimonials/lindsay.png', initial: 'L', bgClass: 'bg-violet-100',  textClass: 'text-violet-700'  },
];

function buildReviews(t: (key: string) => string): Review[] {
  return [
    { rating: t('t1Rating'), title: t('t1Title'), text: t('t1Text'), name: t('t1Name'), shopType: t('t1ShopType'), avatar: AVATARS[0] },
    { rating: t('t2Rating'), title: t('t2Title'), text: t('t2Text'), name: t('t2Name'), shopType: t('t2ShopType'), avatar: AVATARS[1] },
    { rating: t('t3Rating'), title: t('t3Title'), text: t('t3Text'), name: t('t3Name'), shopType: t('t3ShopType'), avatar: AVATARS[2] },
    { rating: t('t4Rating'), title: t('t4Title'), text: t('t4Text'), name: t('t4Name'), shopType: t('t4ShopType'), avatar: AVATARS[3] },
  ];
}

function ReviewCard({ review, delay, visible }: { review: Review; delay: number; visible: boolean }) {
  return (
    <div
      className={`flex flex-col justify-between bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500 h-full ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-3xl md:text-4xl font-black text-gray-900">{review.rating}</span>
          <Heart className="w-5 h-5 md:w-6 md:h-6 text-violet-500 fill-violet-500" />
        </div>
        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 leading-snug">
          {review.title}
        </h3>
        <p className="text-sm md:text-[15px] text-gray-500 leading-relaxed">
          {review.text}
        </p>
      </div>
      <div className="flex items-center gap-3 mt-5 pt-3 border-t border-gray-50">
        {review.avatar.logo_url ? (
          <img src={review.avatar.logo_url} alt={review.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
        ) : (
          <div className={`w-9 h-9 rounded-full ${review.avatar.bgClass} ${review.avatar.textClass} font-bold text-sm flex items-center justify-center shrink-0`}>
            {review.avatar.initial}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{review.name}</p>
          <p className="text-[11px] text-gray-400 font-medium">{review.shopType}</p>
        </div>
      </div>
    </div>
  );
}

export function SocialProofMergedSection() {
  const { ref, isInView } = useInView();
  const t = useTranslations('testimonials');
  const tc = useTranslations('caseStudy');
  const reviews = buildReviews(t);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const itemWidth = el.children[0]?.clientWidth || 1;
    const gap = 16;
    setActiveIndex(Math.round(el.scrollLeft / (itemWidth + gap)));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateActiveIndex, { passive: true });
    return () => el.removeEventListener('scroll', updateActiveIndex);
  }, [updateActiveIndex]);

  const scrollTo = (index: number) => {
    const el = scrollRef.current;
    if (!el || !el.children[index]) return;
    const child = el.children[index] as HTMLElement;
    el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: 'smooth' });
  };

  return (
    <section className="relative py-16 md:py-20 overflow-hidden bg-white">
      <div ref={ref} className="relative max-w-6xl mx-auto px-6">
        {/* Single header */}
        <div className={`text-center mb-10 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
            {t('title')}{' '}
            <span className="relative font-[family-name:var(--font-display)] italic text-indigo-600">
              {t('titleBold')}
              <span className="absolute -bottom-1 left-0 right-0 h-3 bg-indigo-100/60 -skew-x-3 rounded-sm -z-10" />
            </span>
          </h2>
        </div>

        {/* Top: 3 testimonials */}
        {/* Desktop / tablet */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch mb-10">
          {reviews.map((review, i) => (
            <ReviewCard key={i} review={review} delay={i * 100} visible={isInView} />
          ))}
        </div>

        {/* Mobile carousel */}
        <div className="md:hidden mb-8">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-6 px-6"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {reviews.map((review, i) => (
              <div key={i} className="flex-none w-[80vw] max-w-[300px] snap-center">
                <ReviewCard review={review} delay={i * 80} visible={isInView} />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => scrollTo(Math.max(0, activeIndex - 1))}
              className="w-7 h-7 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400"
              aria-label="Previous"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div className="flex gap-1.5">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollTo(i)}
                  className={`h-1.5 rounded-full transition-all ${i === activeIndex ? 'w-5 bg-violet-500' : 'w-1.5 bg-gray-300'}`}
                  aria-label={`Testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => scrollTo(Math.min(reviews.length - 1, activeIndex + 1))}
              className="w-7 h-7 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400"
              aria-label="Next"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Case study */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-stone-900 rounded-3xl shadow-xl overflow-hidden text-white p-6 md:p-8"
        >
          <h3 className="text-lg md:text-2xl font-bold leading-snug mb-5 max-w-2xl">
            {tc('title')} <span className="text-rose-300">{tc('titleBold')}</span>
          </h3>

          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Avatar + name */}
            <div className="flex items-center gap-3 md:gap-4 shrink-0">
              <img
                src="/images/testimonial-nail-salon.png"
                alt="Nail Salon by Elodie"
                className="w-12 h-12 md:w-14 md:h-14 rounded-2xl object-cover shadow-lg"
              />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-300 mb-0.5">
                  {tc('badge')}
                </p>
                <h4 className="text-base md:text-lg font-bold leading-tight">Nail Salon by Elodie</h4>
                <p className="text-xs text-stone-400">{tc('role')}</p>
              </div>
            </div>

              <blockquote className="flex-1 text-sm md:text-base text-stone-200 leading-relaxed">
              <span className="italic">&quot;{tc('quote')}&quot;</span>
              <p className="mt-3 text-rose-300 font-semibold not-italic">
                {tc('metric')}
              </p>
            </blockquote>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-5 mt-6 pt-5 border-t border-stone-700">
            <div className="flex items-center gap-6 md:gap-8">
              <div className="text-center md:text-left">
                <div className="flex items-baseline gap-1 justify-center md:justify-start">
                  <span className="text-xl md:text-2xl font-bold">4.8</span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </div>
                <p className="text-[10px] text-stone-400 mt-0.5">{tc('googleRating')}</p>
              </div>
              <div className="h-8 w-px bg-stone-700" />
              <div className="text-center md:text-left">
                <span className="text-xl md:text-2xl font-bold">83</span>
                <p className="text-[10px] text-stone-400 mt-0.5">{tc('loyaltyCards')}</p>
              </div>
            </div>
            <Link
              href="/auth/merchant/signup"
              onClick={() => { trackCtaClick('social_proof_case_study', 'social_proof_merged'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white text-stone-900 text-sm font-bold rounded-full hover:bg-stone-100 transition-colors"
            >
              {tc('ctaButton')}
              <TrendingUp className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
