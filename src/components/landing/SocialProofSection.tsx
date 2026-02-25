import { Instagram } from 'lucide-react';
import { getSupabaseAdmin } from '@/lib/supabase';
import { unstable_cache } from 'next/cache';

interface MerchantData {
  shop_name: string;
  shop_type: string;
  logo_url: string | null;
  instagram_url: string | null;
}

const SHOP_TYPE_LABELS: Record<string, string> = {
  coiffeur: 'Coiffeur',
  barbier: 'Barbier',
  institut_beaute: 'Institut de beaute',
  onglerie: 'Onglerie',
  spa: 'Spa',
  estheticienne: 'Estheticienne',
  massage: 'Massage',
  epilation: 'Epilation',
  autre: 'Commerce',
};

function extractHandle(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
  return match ? match[1] : null;
}

function InstaCard({ shop_name, shop_type, logo_url, instagram_url }: MerchantData) {
  const initials = shop_name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
  const handle = extractHandle(instagram_url);
  const typeLabel = SHOP_TYPE_LABELS[shop_type] || shop_type;

  return (
    <div className="flex items-center gap-3 pl-1.5 pr-5 py-1.5 rounded-full bg-white border border-gray-200/80 shadow-sm whitespace-nowrap shrink-0">
      {/* Instagram story ring */}
      <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
        {logo_url ? (
          <img src={logo_url} alt={shop_name} className="w-10 h-10 rounded-full object-cover border-2 border-white" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-500 text-xs font-bold">
            {initials}
          </div>
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[13px] font-bold text-gray-900 leading-tight">
          {handle ? handle : shop_name}
        </span>
        <span className="text-[11px] text-gray-400 leading-tight">{typeLabel}</span>
      </div>
      {handle && <Instagram className="w-3.5 h-3.5 text-gray-300 shrink-0 ml-1" />}
    </div>
  );
}

const getTopMerchants = unstable_cache(
  async (): Promise<MerchantData[]> => {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: admins } = await supabaseAdmin
      .from('super_admins')
      .select('user_id');
    const adminIds = (admins || []).map((a: { user_id: string }) => a.user_id);

    let query = supabaseAdmin
      .from('merchants')
      .select('id, shop_name, shop_type, logo_url, instagram_url, user_id')
      .not('shop_name', 'is', null);

    if (adminIds.length > 0) {
      query = query.not('user_id', 'in', `(${adminIds.join(',')})`);
    }

    const { data: merchants, error } = await query;

    if (error || !merchants?.length) return [];

    const merchantIds = merchants.map((m: { id: string }) => m.id);
    const { data: counts } = await supabaseAdmin
      .from('loyalty_cards')
      .select('merchant_id')
      .in('merchant_id', merchantIds);

    const countMap: Record<string, number> = {};
    if (counts) {
      for (const row of counts) {
        countMap[row.merchant_id] = (countMap[row.merchant_id] || 0) + 1;
      }
    }

    return merchants
      .map((m: { id: string; shop_name: string; shop_type: string; logo_url: string | null; instagram_url: string | null; user_id: string; customer_count?: number }) => ({
        ...m,
        customer_count: countMap[m.id] || 0,
      }))
      .sort((a: { customer_count: number }, b: { customer_count: number }) => b.customer_count - a.customer_count)
      .slice(0, 10)
      .map(({ shop_name, shop_type, logo_url, instagram_url }: { shop_name: string; shop_type: string; logo_url: string | null; instagram_url: string | null }) => ({
        shop_name,
        shop_type,
        logo_url,
        instagram_url,
      }));
  },
  ['top-merchants'],
  { revalidate: 604800 }
);

export async function SocialProofSection() {
  const merchants = await getTopMerchants();

  if (merchants.length === 0) return null;

  // Split merchants into 2 rows for crossing effect on mobile
  const half = Math.ceil(merchants.length / 2);
  const row1 = merchants.slice(0, half);
  const row2 = merchants.slice(half);

  // Duplicate each row for seamless loop
  const items1 = [...row1, ...row1];
  const items2 = [...row2, ...row2];
  // Single row for desktop
  const allItems = [...merchants, ...merchants];

  return (
    <section className="py-8 sm:py-10 bg-gray-50/50 overflow-hidden">
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="h-px w-8 bg-gray-200" />
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Elles fidélisent avec Qarte
        </p>
        <div className="h-px w-8 bg-gray-200" />
      </div>

      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-gray-50/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-gray-50/80 to-transparent z-10 pointer-events-none" />

        {/* Desktop: single row */}
        <div className="hidden sm:flex gap-3 animate-marquee hover:[animation-play-state:paused]">
          {allItems.map((merchant, i) => (
            <InstaCard key={`all-${merchant.shop_name}-${i}`} {...merchant} />
          ))}
        </div>

        {/* Mobile: 2 rows crossing */}
        <div className="flex flex-col gap-3 sm:hidden">
          <div className="flex gap-3 animate-marquee">
            {items1.map((merchant, i) => (
              <InstaCard key={`r1-${merchant.shop_name}-${i}`} {...merchant} />
            ))}
          </div>
          <div className="flex gap-3 animate-marquee-reverse">
            {items2.map((merchant, i) => (
              <InstaCard key={`r2-${merchant.shop_name}-${i}`} {...merchant} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
