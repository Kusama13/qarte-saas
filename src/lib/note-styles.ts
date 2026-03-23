import { AlertTriangle, Beaker, Heart, Eye, StickyNote } from 'lucide-react';

export const TYPE_STYLE: Record<string, { color: string; bgColor: string; pillBg: string; pillText: string; icon: typeof AlertTriangle }> = {
  allergy: { color: 'text-red-700', bgColor: 'bg-red-50 border-red-200', pillBg: 'bg-red-100', pillText: 'text-red-700', icon: AlertTriangle },
  formula: { color: 'text-violet-700', bgColor: 'bg-violet-50 border-violet-200', pillBg: 'bg-violet-100', pillText: 'text-violet-700', icon: Beaker },
  preference: { color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200', pillBg: 'bg-blue-100', pillText: 'text-blue-700', icon: Heart },
  observation: { color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200', pillBg: 'bg-amber-100', pillText: 'text-amber-700', icon: Eye },
  general: { color: 'text-gray-700', bgColor: 'bg-gray-50 border-gray-200', pillBg: 'bg-gray-100', pillText: 'text-gray-700', icon: StickyNote },
};

const DEFAULT_STYLE = { color: 'text-teal-700', bgColor: 'bg-teal-50 border-teal-200', pillBg: 'bg-teal-100', pillText: 'text-teal-700', icon: StickyNote };

export function getTypeStyle(noteType: string) {
  return TYPE_STYLE[noteType] || DEFAULT_STYLE;
}
