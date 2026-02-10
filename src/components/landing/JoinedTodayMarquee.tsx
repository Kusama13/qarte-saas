'use client';

import Image from 'next/image';

/**
 * Logo wall — "Ils nous font confiance"
 *
 * Design: grayscale + reduced opacity for visual harmony.
 * All logos share a fixed height (36px) with auto width to normalize
 * different aspect ratios without distortion.
 *
 * To add/replace logos:
 * 1. Drop the file in /public/images/logos/ (PNG transparent bg, min 200px wide)
 * 2. Add/update the entry below
 */
const PARTNER_LOGOS = [
  { name: 'Atelier Onyx', src: '/images/logos/atelier-onyx.jpeg' },
  { name: 'Clara Nails', src: '/images/logos/clara-nails.png' },
  { name: "L'Institut by Leana", src: '/images/logos/institut-by-leana.png' },
  { name: 'La Canopée des Sens', src: '/images/logos/canopee-des-sens.png' },
  { name: 'Lash by Noumi', src: '/images/logos/lash-by-noumi.png' },
  { name: 'Les Ongles de Eva', src: '/images/logos/les-ongles-de-eva.png' },
  { name: 'Les Ongles de Nini', src: '/images/logos/les-ongles-de-nini.jpeg' },
  { name: 'Light on Nails', src: '/images/logos/light-on-nails.png' },
  { name: 'Lylabella', src: '/images/logos/lylabella.jpg' },
  { name: 'Nana by Touch', src: '/images/logos/nana-by-touch.png' },
];

export function JoinedTodayMarquee() {
  // Duplicate for seamless infinite scroll
  const logos = [...PARTNER_LOGOS, ...PARTNER_LOGOS];

  return (
    <section className="relative bg-white border-y border-gray-100 py-8 overflow-hidden">
      {/* Label */}
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">
        <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2 align-middle" />
        Ils nous ont rejoint aujourd&apos;hui — rejoignez-les
      </p>

      {/* Marquee container */}
      <div className="relative">
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        {/* Scrolling track */}
        <div className="flex animate-marquee items-center">
          {logos.map((logo, i) => (
            <div
              key={`${logo.name}-${i}`}
              className="flex-shrink-0 mx-8 sm:mx-12"
            >
              <Image
                src={logo.src}
                alt={logo.name}
                width={120}
                height={36}
                className="h-8 sm:h-9 w-auto object-contain grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
