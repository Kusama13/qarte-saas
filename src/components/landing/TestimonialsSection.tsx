'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useInView } from '@/hooks/useInView';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';

/* ─── Types ──────────────────────────────────────────── */

interface Review {
  rating: string;
  title: string;
  text: string;
  name: string;
  initials: string;
  shopType: string;
  avatar: string;
}

const AVATARS = [
  '/images/testimonials/t1.jpg',
  '/images/testimonials/t2.jpg',
  '/images/testimonials/t3.jpg',
  '/images/testimonials/t4.jpg',
  '/images/testimonials/t5.jpg',
];

/* ─── Data builder ────────────────────────────────────── */

function buildReviews(t: (key: string) => string): Review[] {
  return [
    { rating: t('t1Rating'), title: t('t1Title'), text: t('t1Text'), name: t('t1Name'), initials: t('t1Initials'), shopType: t('t1ShopType'), avatar: AVATARS[0] },
    { rating: t('t2Rating'), title: t('t2Title'), text: t('t2Text'), name: t('t2Name'), initials: t('t2Initials'), shopType: t('t2ShopType'), avatar: AVATARS[1] },
    { rating: t('t3Rating'), title: t('t3Title'), text: t('t3Text'), name: t('t3Name'), initials: t('t3Initials'), shopType: t('t3ShopType'), avatar: AVATARS[2] },
    { rating: t('t4Rating'), title: t('t4Title'), text: t('t4Text'), name: t('t4Name'), initials: t('t4Initials'), shopType: t('t4ShopType'), avatar: AVATARS[3] },
    { rating: t('t5Rating'), title: t('t5Title'), text: t('t5Text'), name: t('t5Name'), initials: t('t5Initials'), shopType: t('t5ShopType'), avatar: AVATARS[4] },
  ];
}

/* ─── Review Card ────────────────────────────────────── */

function ReviewCard({ review, delay, visible }: { review: Review; delay: number; visible: boolean }) {
  return (
    <div
      className={`flex flex-col justify-between bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {/* Rating */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <span className="text-5xl font-black text-gray-900">{review.rating}</span>
          <Heart className="w-7 h-7 text-violet-500 fill-violet-500" />
        </div>

        {/* Title + text */}
        <h3 className="text-lg font-bold text-gray-900 mb-2.5 leading-snug">
          {review.title}
        </h3>
        <p className="text-[15px] text-gray-500 leading-relaxed">
          {review.text}
        </p>
      </div>

      {/* Author */}
      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-50">
        <img
          src={review.avatar}
          alt={review.name}
          className="w-10 h-10 rounded-full object-cover shrink-0"
        />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-gray-900 truncate">{review.name}</p>
          <p className="text-xs text-gray-400 font-medium">{review.shopType}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Section ────────────────────────────────────────── */

export function TestimonialsSection() {
  const { ref, isInView } = useInView();
  const t = useTranslations('testimonials');
  const reviews = buildReviews(t);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const itemWidth = el.children[0]?.clientWidth || 1;
    const gap = 16;
    setActiveIndex(Math.round(scrollLeft / (itemWidth + gap)));
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
    <section className="relative py-24 md:py-32 overflow-hidden bg-gray-50/80">
      <div ref={ref} className="relative max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-14 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            {t('title')}{' '}
            <span className="relative font-[family-name:var(--font-playfair)] italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
              {t('titleBold')}
              <span className="absolute -bottom-1 left-0 right-0 h-3 bg-indigo-100/60 -skew-x-3 rounded-sm -z-10" />
            </span>
          </h2>
        </div>

        {/* Desktop: 5 cards row */}
        <div className="hidden lg:grid grid-cols-5 gap-4 items-stretch">
          {reviews.map((review, i) => (
            <ReviewCard key={i} review={review} delay={i * 100} visible={isInView} />
          ))}
        </div>

        {/* Tablet: 3 cards */}
        <div className="hidden md:grid lg:hidden grid-cols-3 gap-4 items-stretch">
          {reviews.slice(0, 3).map((review, i) => (
            <ReviewCard key={i} review={review} delay={i * 100} visible={isInView} />
          ))}
        </div>

        {/* Mobile: carousel */}
        <div className="md:hidden">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-6 px-6"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {reviews.map((review, i) => (
              <div
                key={i}
                className="flex-none w-[80vw] max-w-[300px] snap-center"
              >
                <ReviewCard review={review} delay={i * 80} visible={isInView} />
              </div>
            ))}
          </div>

          {/* Dots + arrows */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => scrollTo(Math.max(0, activeIndex - 1))}
              className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1.5">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollTo(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeIndex ? 'w-5 bg-violet-500' : 'w-1.5 bg-gray-300'
                  }`}
                  aria-label={`Testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => scrollTo(Math.min(reviews.length - 1, activeIndex + 1))}
              className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
