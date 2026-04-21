'use client';

import { Palette, Pencil } from 'lucide-react';
import { COLOR_PALETTES, type ProgramFormData } from './types';

interface CardPreviewProps {
  formData: ProgramFormData;
  onNavigateToPersonalize: () => void;
}

export function CardPreview({ formData, onNavigateToPersonalize }: CardPreviewProps) {
  return (
    <button
      type="button"
      onClick={onNavigateToPersonalize}
      className="w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white/60 border border-white/20 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group"
    >
      {/* Logo preview */}
      <div className="shrink-0 w-11 h-11 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
        {formData.logoUrl ? (
          <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
        ) : (
          <Palette className="w-5 h-5 text-gray-300" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-semibold text-gray-800">
          {formData.logoUrl ? 'Logo & Ambiance' : 'Ajoute ton logo et choisis ton ambiance'}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex gap-0.5">
            <div className="w-4 h-4 rounded-l-sm" style={{ backgroundColor: formData.primaryColor }} />
            <div className="w-4 h-4 rounded-r-sm" style={{ backgroundColor: formData.secondaryColor }} />
          </div>
          <span className="text-xs text-gray-400">
            {COLOR_PALETTES.find(p => p.primary === formData.primaryColor && p.secondary === formData.secondaryColor)?.name || 'Personnalise'}
          </span>
        </div>
      </div>

      {/* Edit button */}
      <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold group-hover:bg-indigo-100 transition-colors">
        <Pencil className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Modifier</span>
      </div>
    </button>
  );
}
