'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

type ModalSize = 'sm' | 'md' | 'lg';
type IconTint = 'gray' | 'red' | 'amber' | 'indigo' | 'emerald' | 'violet';

const SIZE: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

const TINT: Record<IconTint, string> = {
  gray: 'bg-gray-100 text-gray-600',
  red: 'bg-red-50 text-red-500',
  amber: 'bg-amber-100 text-amber-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  violet: 'bg-violet-100 text-violet-600',
};

export default function PlanningModal({
  onClose,
  size = 'md',
  children,
}: {
  onClose: () => void;
  size?: ModalSize;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, pointerEvents: 'none' }}
      animate={{ opacity: 1, pointerEvents: 'auto' }}
      exit={{ opacity: 0, pointerEvents: 'none' }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className={`relative bg-white rounded-2xl w-full ${SIZE[size]} max-h-[85vh] overflow-y-auto shadow-xl`}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function ModalHeader({
  title,
  subtitle,
  icon,
  iconTint = 'gray',
  badge,
  actions,
  onClose,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  iconTint?: IconTint;
  badge?: ReactNode;
  actions?: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {icon && (
          <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${TINT[iconTint]}`}>
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 truncate">{title}</h3>
            {badge}
          </div>
          {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {actions}
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

// flex-col-reverse : mobile stacke les enfants avec le primary en haut (ordre source = Cancel puis Action).
// sticky : garde les boutons visibles pendant scroll du body (modals à tabs/long contenu).
export function ModalFooter({
  children,
  sticky = false,
}: {
  children: ReactNode;
  sticky?: boolean;
}) {
  return (
    <div
      className={`p-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-2 bg-white ${
        sticky ? 'sticky bottom-0 z-10' : ''
      }`}
    >
      {children}
    </div>
  );
}
