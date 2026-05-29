import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Store, Smartphone } from 'lucide-react';
import { SHOP_TYPES } from '@/types';
import { getDemoMerchantData, demoCardUrl } from '@/lib/demo-merchants';

export default async function ExempleCard({ slug, locale }: { slug: string; locale: string }) {
  const data = getDemoMerchantData(slug, locale);
  if (!data) return null;

  const t = await getTranslations({ locale, namespace: 'exemples' });
  const { merchant } = data;
  const metier = SHOP_TYPES[merchant.shop_type as keyof typeof SHOP_TYPES] || SHOP_TYPES.autre;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Header coloré aux couleurs du métier — la catégorie domine */}
      <div
        className="px-5 py-6"
        style={{ background: `linear-gradient(135deg, ${merchant.primary_color}, ${merchant.primary_color}cc)` }}
      >
        <p className="text-xl font-bold leading-tight text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.28)]">{metier}</p>
        <p className="mt-0.5 text-xs font-medium text-white/85 [text-shadow:0_1px_2px_rgba(0,0,0,0.25)]">{merchant.shop_name}</p>
      </div>

      {/* Deux liens : vitrine + carte cliente */}
      <div className="divide-y divide-gray-100">
        <Link
          href={`/p/${slug}`}
          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50">
            <Store className="h-4 w-4 text-violet-600" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-gray-900">{t('viewVitrine')}</span>
            <span className="block text-xs text-gray-500">{t('viewVitrineHint')}</span>
          </span>
        </Link>

        <Link
          href={demoCardUrl(slug)}
          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50">
            <Smartphone className="h-4 w-4 text-rose-500" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-gray-900">{t('viewCard')}</span>
            <span className="block text-xs text-gray-500">{t('viewCardHint')}</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
