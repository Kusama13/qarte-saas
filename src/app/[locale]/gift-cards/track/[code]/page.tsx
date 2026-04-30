/**
 * Page publique de suivi d'un bon cadeau.
 * URL : /gift-cards/track/GIFT-XXXXXX
 *
 * Pas d'auth, le code agit comme bearer. Inclus dans l'email confirmation
 * offreur. Permet de voir l'état (en attente paiement / activé / utilisé /
 * annulé) sans avoir à recontacter le salon.
 *
 * Lookup direct DB pour éviter un round-trip HTTP en SSR (et l'erreur
 * "fetch va sur prod en local").
 */

import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { formatGiftCardServicesLabel } from '@/lib/gift-cards';
import type { GiftCardServiceSnapshot } from '@/types';
import GiftCardTrackView from './GiftCardTrackView';

export const dynamic = 'force-dynamic';

export default async function GiftCardTrackPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = (rawCode || '').toUpperCase().trim();

  if (!/^GIFT-[A-Z2-9]{6}$/.test(code)) notFound();

  const supabase = getSupabaseAdmin();
  const { data: giftCard } = await supabase
    .from('gift_cards')
    .select(`
      id, code, amount, kind, status, service_ids, service_snapshot,
      sender_first_name, recipient_first_name,
      created_at, paid_at, used_at, cancelled_at, expires_at, pdf_url,
      scheduled_send_at, notified_at,
      merchant_id,
      merchants ( shop_name, country, locale, primary_color, secondary_color )
    `)
    .eq('code', code)
    .maybeSingle();

  if (!giftCard) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const merchant = giftCard.merchants as any;
  const locale = (merchant?.locale || 'fr') as 'fr' | 'en';
  const country = merchant?.country || 'FR';
  const amountFormatted = formatCurrency(Number(giftCard.amount), country, locale, 0);

  // Mode services : noms LIVE avec fallback snapshot
  let servicesLabel: string | null = null;
  let serviceNames: string[] = [];
  if (giftCard.kind === 'services' && Array.isArray(giftCard.service_ids) && giftCard.service_ids.length > 0) {
    const { data: liveSvc } = await supabase
      .from('merchant_services')
      .select('id, name')
      .eq('merchant_id', giftCard.merchant_id)
      .in('id', giftCard.service_ids);
    const liveById = new Map<string, string>(
      ((liveSvc as Array<{ id: string; name: string }>) || []).map((s) => [s.id, s.name]),
    );
    const snapById = new Map<string, GiftCardServiceSnapshot>(
      ((giftCard.service_snapshot as GiftCardServiceSnapshot[] | null) || []).map((s) => [s.id, s]),
    );
    serviceNames = (giftCard.service_ids as string[])
      .map((id) => liveById.get(id) || snapById.get(id)?.name || null)
      .filter((n): n is string => Boolean(n));
    servicesLabel = formatGiftCardServicesLabel(serviceNames);
  }

  return (
    <GiftCardTrackView
      data={{
        code: giftCard.code,
        status: giftCard.status,
        amount: Number(giftCard.amount),
        amountFormatted,
        kind: giftCard.kind,
        servicesLabel,
        serviceNames,
        senderFirstName: giftCard.sender_first_name,
        recipientFirstName: giftCard.recipient_first_name,
        createdAt: giftCard.created_at,
        paidAt: giftCard.paid_at,
        usedAt: giftCard.used_at,
        cancelledAt: giftCard.cancelled_at,
        expiresAt: giftCard.expires_at,
        pdfUrl: giftCard.pdf_url,
        scheduledSendAt: giftCard.scheduled_send_at,
        notifiedAt: giftCard.notified_at,
        shop: {
          name: merchant?.shop_name || '',
          primaryColor: merchant?.primary_color || '#4b0082',
          secondaryColor: merchant?.secondary_color || '#ec4899',
          locale,
        },
      }}
    />
  );
}
