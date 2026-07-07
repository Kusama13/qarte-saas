'use client';

import { ZoomIn } from 'lucide-react';

interface ServiceThumbnailProps {
  src: string;
  alt: string;
  /** aria-label du bouton (ex: « Agrandir la photo de X »). */
  label: string;
  onEnlarge: () => void;
}

/**
 * Vignette photo d'une prestation (vitrine + sélection de résa) : 44px, glyphe loupe,
 * clic → agrandissement. Partagée pour éviter la duplication entre ProgrammeView et BookingModal.
 */
export default function ServiceThumbnail({ src, alt, label, onEnlarge }: ServiceThumbnailProps) {
  return (
    <button
      type="button"
      onClick={onEnlarge}
      aria-label={label}
      className="relative shrink-0 w-11 h-11 rounded-lg overflow-hidden border border-gray-200/70 active:scale-95 transition-transform"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover" />
      <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/55 flex items-center justify-center">
        <ZoomIn className="w-2.5 h-2.5 text-white" />
      </span>
    </button>
  );
}
