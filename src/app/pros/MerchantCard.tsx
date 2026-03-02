'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { SHOP_TYPES, type ShopType } from '@/types';

interface MerchantCardProps {
  slug: string;
  shop_name: string;
  shop_type: string;
  logo_url: string;
  primary_color: string;
  reward_description: string;
  index: number;
}

export default function MerchantCard({
  slug,
  shop_name,
  shop_type,
  logo_url,
  primary_color,
  reward_description,
  index,
}: MerchantCardProps) {
  const typeLabel = SHOP_TYPES[shop_type as ShopType] || shop_type;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.07, 1.4), ease: 'easeOut' }}
    >
      <Link href={`/p/${slug}`} className="block group">
        <div
          className="rounded-2xl overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          {/* Header coloré */}
          <div
            className="p-4 flex items-center gap-3"
            style={{
              background: `linear-gradient(135deg, ${primary_color}, ${primary_color}cc)`,
              minHeight: '88px',
            }}
          >
            <img
              src={logo_url}
              alt={shop_name}
              loading="lazy"
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/30 shadow-lg shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-white leading-tight truncate">
                {shop_name}
              </p>
              <p className="text-[11px] font-medium text-white/60 mt-0.5">
                {typeLabel}
              </p>
            </div>
          </div>

          {/* Section blanche */}
          <div className="bg-white px-4 py-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
              Récompense
            </p>
            <p className="text-[13px] font-semibold text-gray-700 truncate">
              {reward_description}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
