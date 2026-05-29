import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Store, Smartphone, MapPin, Stamp, PiggyBank } from 'lucide-react';
import { SHOP_TYPES } from '@/types';
import { extractCityFromAddress } from '@/lib/utils';
import { getDemoMerchantData } from '@/lib/demo-merchants';

export default async function ExempleCard({ slug, locale }: { slug: string; locale: string }) {
  const data = getDemoMerchantData(slug, locale);
  if (!data) return null;

  const t = await getTranslations({ locale, namespace: 'exemples' });
  const { merchant, services } = data;

  const metier = SHOP_TYPES[merchant.shop_type as keyof typeof SHOP_TYPES] || SHOP_TYPES.autre;
  const city = extractCityFromAddress(merchant.shop_address);
  const isCagnotte = merchant.loyalty_mode === 'cagnotte';
  const topServices = services.slice(0, 3);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* En-tête couleur de la marque */}
      <div
        className="relative flex h-28 items-end p-4"
        style={{ background: `linear-gradient(135deg, ${merchant.primary_color}, ${merchant.secondary_color})` }}
      >
        {/* Scrim : garantit la lisibilité du texte blanc sur les dégradés clairs (spa, onglerie) */}
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        <span className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
          {metier}
        </span>
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/90 text-xl font-bold" style={{ color: merchant.primary_color }}>
            {merchant.shop_name.charAt(0)}
          </div>
          <div className="pb-0.5">
            <p className="text-base font-bold leading-tight text-white drop-shadow-sm">{merchant.shop_name}</p>
            {city && (
              <p className="flex items-center gap-1 text-xs font-medium text-white/90">
                <MapPin className="h-3 w-3" />
                {city}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Corps */}
      <div className="flex flex-1 flex-col p-4">
        {/* Badge fidélité */}
        <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">
          {isCagnotte ? <PiggyBank className="h-3.5 w-3.5" /> : <Stamp className="h-3.5 w-3.5" />}
          {isCagnotte
            ? t('loyaltyCagnotte', { percent: merchant.cagnotte_percent ?? 0 })
            : t('loyaltyStamps', { count: merchant.stamps_required })}
        </div>

        {/* Aperçu prestations */}
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{t('servicesTitle')}</p>
        <ul className="mb-4 space-y-1.5">
          {topServices.map((s) => (
            <li key={s.id} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-gray-700">{s.name}</span>
              <span className="flex-shrink-0 font-semibold text-gray-900">
                {s.price_from ? `${t('priceFrom')} ` : ''}{s.price} €
              </span>
            </li>
          ))}
        </ul>

        {/* Les deux faces : vitrine + carte cliente */}
        <div className="mt-auto grid grid-cols-2 gap-2">
          <Link
            href={`/p/${slug}`}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
          >
            <Store className="h-4 w-4" />
            {t('viewVitrine')}
          </Link>
          <Link
            href={`/customer/card/${slug}?preview=true&demo=true`}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-500 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-600"
          >
            <Smartphone className="h-4 w-4" />
            {t('viewCard')}
          </Link>
        </div>
      </div>
    </div>
  );
}
