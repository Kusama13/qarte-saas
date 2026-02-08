'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

export function TestimonialsSection() {
  const { ref, isInView } = useInView();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const testimonials = [
    {
      name: 'Marie L.',
      role: 'Gérante de salon de coiffure',
      content: 'Depuis Qarte, +35% de mes clientes reviennent plus régulièrement. Et surtout : fini les cartes tampons perdues !',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
      stat: '+35%',
      statLabel: 'fidélisation'
    },
    {
      name: 'Jessica P.',
      role: 'Nail Artist - Onglerie',
      content: 'Mes clientes adorent recevoir une notification quand leur pose offerte est disponible. Ça les motive à revenir !',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
      stat: '5 min',
      statLabel: 'installation'
    },
    {
      name: 'Laura D.',
      role: 'Masseuse - Centre bien-être',
      content: 'J\'ai enfin des données sur mes clientes. Et le côté écologique, ça correspond parfaitement à l\'image de mon centre.',
      image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop&crop=face',
      stat: '0',
      statLabel: 'papier utilisé'
    }
  ];

  const nextSlide = useCallback(() => setCurrentIndex((prev) => (prev + 1) % testimonials.length), [testimonials.length]);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(nextSlide, 5000);
      return () => clearInterval(interval);
    }
  }, [isPaused, nextSlide]);

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-100 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-violet-100 rounded-full blur-3xl" />
      </div>

      <div ref={ref} className="max-w-7xl mx-auto px-6 relative">
        <div className={`text-center mb-12 transition-all duration-1000 transform ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Ils nous font confiance
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">Découvrez ce que nos professionnels de la beauté disent de Qarte</p>
        </div>

        <div
          className="relative max-w-4xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Floating Previews (Desktop) */}
          <div className="hidden lg:block absolute -left-48 top-1/2 -translate-y-1/2 opacity-20 scale-90 blur-[1px]">
            <div className="bg-gray-50 p-6 rounded-3xl w-64 border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-gray-200 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
          <div className="hidden lg:block absolute -right-48 top-1/2 -translate-y-1/2 opacity-20 scale-90 blur-[1px]">
            <div className="bg-gray-50 p-6 rounded-3xl w-64 border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-gray-200 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>

          {/* Main Carousel Card */}
          <div className="relative min-h-[580px] sm:min-h-[520px] md:min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="absolute inset-0"
              >
                <div className="h-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white relative overflow-hidden flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-stretch">

                  {/* Visual Background Quote */}
                  <Quote className="absolute -top-6 -left-6 w-32 h-32 text-indigo-500/5 rotate-12" />

                  {/* Left Side: Identity & Stat */}
                  <div className="flex flex-col items-center md:items-start md:w-1/3 justify-between gap-6">
                    <div className="relative">
                      <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-full opacity-20 blur-lg animate-pulse" />
                      <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-violet-500">
                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white">
                          <Image
                            src={testimonials[currentIndex].image}
                            alt={testimonials[currentIndex].name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-center md:text-left">
                      <h4 className="text-2xl font-bold text-gray-900 leading-tight">{testimonials[currentIndex].name}</h4>
                      <p className="text-indigo-600 font-medium text-sm mt-1">{testimonials[currentIndex].role}</p>
                    </div>

                    <div className="mt-auto w-full">
                      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-4 md:p-6 rounded-2xl md:rounded-3xl text-white shadow-lg shadow-indigo-200/50">
                        <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-80 mb-1">{testimonials[currentIndex].statLabel}</p>
                        <p className="text-2xl md:text-3xl font-black">{testimonials[currentIndex].stat}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Quote & Content */}
                  <div className="flex-1 flex flex-col justify-center text-center md:text-left">
                    {/* Trustpilot-style Rating */}
                    <div className="flex flex-col sm:flex-row items-center md:items-start gap-3 mb-6">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <div key={s} className="w-7 h-7 bg-[#00b67a] flex items-center justify-center">
                            <Star className="w-4 h-4 fill-white text-white" />
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">Excellent</span>
                        <span className="text-sm text-gray-500">4.9 sur 5</span>
                      </div>
                    </div>

                    <blockquote className="text-lg sm:text-xl md:text-2xl text-gray-800 font-medium leading-relaxed">
                      &quot;{testimonials[currentIndex].content}&quot;
                    </blockquote>

                    <div className="mt-6 flex items-center justify-center md:justify-start gap-2">
                      <svg className="w-4 h-4 text-[#00b67a]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      <span className="text-gray-500 text-sm font-medium">Avis vérifié</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Premium Navigation Controls */}
          <div className="flex items-center justify-between mt-12 px-4">
            <button
              onClick={prevSlide}
              className="group w-12 h-12 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-90"
              aria-label="Précédent"
            >
              <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            {/* Enhanced Dot Indicators with Progress */}
            <div className="flex gap-4">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className="relative h-1.5 overflow-hidden rounded-full bg-gray-200 transition-all duration-500"
                  style={{ width: index === currentIndex ? '48px' : '12px' }}
                >
                  {index === currentIndex && (
                    <motion.div
                      className="absolute inset-0 bg-indigo-600"
                      initial={{ x: '-100%' }}
                      animate={{ x: isPaused ? '0%' : '0%' }}
                      transition={{ duration: 5, ease: "linear" }}
                      key={`${currentIndex}-${isPaused}`}
                    />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="group w-12 h-12 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-90"
              aria-label="Suivant"
            >
              <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
