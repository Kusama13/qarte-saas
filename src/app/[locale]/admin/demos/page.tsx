'use client';

import { Link } from '@/i18n/navigation';
import { ExternalLink, CreditCard, Globe, LayoutGrid, List } from 'lucide-react';
import { SHOP_TYPES, type ShopType } from '@/types';

const DEMO_SLUGS: Record<ShopType, string> = {
  coiffeur: 'demo-coiffure',
  barbier: 'demo-barbier',
  institut_beaute: 'demo-institut',
  onglerie: 'demo-onglerie',
  spa: 'demo-spa',
  estheticienne: 'demo-estheticienne',
  tatouage: 'demo-tatouage',
  autre: 'demo-autre',
};

const COLORS: Record<ShopType, string> = {
  coiffeur: '#8B5CF6',
  barbier: '#1E40AF',
  institut_beaute: '#DB2777',
  onglerie: '#EC4899',
  spa: '#0D9488',
  estheticienne: '#E11D48',
  tatouage: '#1E293B',
  autre: '#6366F1',
};

function DemoLink({ href, label, icon: Icon, color, variant = 'filled' }: { href: string; label: string; icon: typeof Globe; color: string; variant?: 'filled' | 'outline' }) {
  return (
    <Link
      href={href}
      target="_blank"
      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
      style={variant === 'filled'
        ? { background: color, color: '#fff' }
        : { color, borderWidth: 1, borderColor: `${color}40` }
      }
    >
      <Icon className="w-3 h-3" />
      {label}
      <ExternalLink className="w-2.5 h-2.5 opacity-50" />
    </Link>
  );
}

export default function AdminDemosPage() {
  const types = Object.keys(SHOP_TYPES) as ShopType[];

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Pages de demo</h1>
      <p className="text-sm text-gray-500 mb-6">Vitrine (creneaux + mode libre) et carte fidelite pour chaque type de commerce.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {types.map((type) => {
          const slug = DEMO_SLUGS[type];
          const libreSlug = `${slug}-libre`;
          const color = COLORS[type];
          return (
            <div
              key={type}
              className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-3"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${color}15` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{SHOP_TYPES[type]}</p>
                </div>
              </div>

              {/* Vitrine */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Vitrine</p>
                <div className="flex gap-2">
                  <DemoLink href={`/p/${slug}`} label="Creneaux" icon={LayoutGrid} color={color} />
                  <DemoLink href={`/p/${libreSlug}`} label="Mode libre" icon={List} color={color} />
                </div>
              </div>

              {/* Fidelite */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Fidelite</p>
                <div className="flex gap-2">
                  <DemoLink href={`/customer/card/${slug}?preview=true&demo=true`} label="Carte" icon={CreditCard} color={color} variant="outline" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
