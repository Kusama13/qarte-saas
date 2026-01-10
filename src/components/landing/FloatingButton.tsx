'use client';

import Link from 'next/link';
import { Wallet } from 'lucide-react';

export function FloatingButton() {
  return (
    <Link
      href="/customer/cards"
      className="fixed z-50 flex items-center gap-2 px-5 py-4 text-sm font-semibold text-white transition-all duration-300 shadow-xl bottom-6 right-6 bg-primary rounded-full hover:bg-primary-600 hover:scale-105 hover:shadow-2xl min-w-[56px] min-h-[56px]"
    >
      <Wallet className="w-5 h-5" />
      <span className="hidden sm:inline">Mes cartes de fidélité</span>
      <span className="sm:hidden">Mes cartes</span>
    </Link>
  );
}
