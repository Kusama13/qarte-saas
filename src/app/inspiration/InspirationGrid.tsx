'use client';

import MerchantCard from './MerchantCard';

export interface InspirationMerchant {
  slug: string;
  shop_name: string;
  shop_type: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  reward_description: string;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
}

export default function InspirationGrid({ merchants }: { merchants: InspirationMerchant[] }) {
  return (
    <section className="px-4 pb-16 max-w-6xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {merchants.map((merchant, index) => (
          <MerchantCard
            key={merchant.slug}
            index={index}
            slug={merchant.slug}
            shop_name={merchant.shop_name}
            shop_type={merchant.shop_type}
            logo_url={merchant.logo_url}
            primary_color={merchant.primary_color}
            reward_description={merchant.reward_description}
          />
        ))}
      </div>

      {merchants.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">
            Aucun professionnel pour le moment.
          </p>
        </div>
      )}
    </section>
  );
}
