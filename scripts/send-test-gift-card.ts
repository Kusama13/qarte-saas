/**
 * Envoi d'un bon cadeau de test (offreur + destinataire) à une adresse fixée.
 *
 * Usage : source .env.local && npx tsx scripts/send-test-gift-card.ts <CODE> <to-email>
 *
 * Le script :
 *   1. Lit la gift_card par code (GIFT-XXXXXX) + merchant
 *   2. Diagnostique migrations (colonnes pdf_url, image_url, scheduled_send_at présentes ?)
 *   3. Génère le PDF + le PNG (rendu Satori partagé) et upload bucket gift-cards-pdf
 *   4. Envoie l'email offreur (avec lien PDF) + l'email destinataire (avec image)
 *      à <to-email> (override les vrais destinataires pour le test)
 */

import { createClient } from '@supabase/supabase-js';
import { formatCurrency } from '../src/lib/utils';
import {
  formatGiftCardServicesLabel,
  GIFT_CARD_EXPIRY_MONTHS,
} from '../src/lib/gift-cards';
import { renderAndUploadGiftCardAssets } from '../src/lib/gift-card-pdf';
import {
  sendGiftCardActivatedEmail,
  sendGiftCardReceivedEmail,
} from '../src/lib/email';
import type { GiftCardServiceSnapshot } from '../src/types';

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const flags = process.argv.slice(2).filter((a) => a.startsWith('--'));
  const code = args[0] || 'GIFT-E6TW8V';
  const to = args[1] || 'judicaeltraore01@gmail.com';
  const sendBoth = flags.includes('--both');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  console.log(`\n→ Lookup bon ${code}…`);
  const { data: giftCard, error: gErr } = await supabase
    .from('gift_cards')
    .select('*')
    .eq('code', code)
    .single();

  if (gErr || !giftCard) {
    console.error(`✗ Bon introuvable :`, gErr?.message || 'aucune ligne');
    process.exit(1);
  }
  console.log(`✓ Bon trouvé (id=${giftCard.id}, status=${giftCard.status}, kind=${giftCard.kind})`);

  // Diagnostic migrations
  const has141 = 'pdf_url' in giftCard && 'sender_last_name' in giftCard;
  const has142 = 'scheduled_send_at' in giftCard && 'notified_at' in giftCard;
  const has143 = 'image_url' in giftCard;
  console.log(`  • mig 141 (pdf_url + sender/recipient_last_name) : ${has141 ? '✓' : '✗ NON appliquée'}`);
  console.log(`  • mig 142 (scheduled_send_at + notified_at)       : ${has142 ? '✓' : '✗ NON appliquée'}`);
  console.log(`  • mig 143 (image_url + bucket image/png)          : ${has143 ? '✓' : '✗ NON appliquée'}`);

  const { data: merchant, error: mErr } = await supabase
    .from('merchants')
    .select('id, slug, shop_name, shop_address, display_phone, country, locale, primary_color, secondary_color, auto_booking_enabled, hide_address_on_public_page')
    .eq('id', giftCard.merchant_id)
    .single();

  if (mErr || !merchant) {
    console.error(`✗ Merchant introuvable :`, mErr?.message);
    process.exit(1);
  }
  console.log(`✓ Merchant : ${merchant.shop_name}`);

  const locale = (merchant.locale || 'fr') as 'fr' | 'en';
  const amountFormatted = formatCurrency(Number(giftCard.amount), merchant.country, locale, 0);

  // Services label (LIVE + fallback snapshot)
  let servicesLabel: string | null = null;
  let serviceNamesLive: string[] = [];
  if (giftCard.kind === 'services' && Array.isArray(giftCard.service_ids) && giftCard.service_ids.length > 0) {
    const { data: liveSvc } = await supabase
      .from('merchant_services')
      .select('id, name')
      .eq('merchant_id', merchant.id)
      .in('id', giftCard.service_ids);
    const liveById = new Map<string, string>(
      ((liveSvc as Array<{ id: string; name: string }>) || []).map((s) => [s.id, s.name]),
    );
    const snapById = new Map<string, GiftCardServiceSnapshot>(
      ((giftCard.service_snapshot as GiftCardServiceSnapshot[] | null) || []).map((s) => [s.id, s]),
    );
    serviceNamesLive = (giftCard.service_ids as string[])
      .map((id) => liveById.get(id) || snapById.get(id)?.name || null)
      .filter((n): n is string => Boolean(n));
    servicesLabel = formatGiftCardServicesLabel(serviceNamesLive);
  }

  const expiresAt = giftCard.expires_at
    ? new Date(giftCard.expires_at)
    : new Date(Date.now() + GIFT_CARD_EXPIRY_MONTHS * 30 * 24 * 3600 * 1000);
  const expiresAtFmt = expiresAt.toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const renderParams = {
    shopName: merchant.shop_name,
    shopPhone: merchant.display_phone,
    shopCountry: merchant.country,
    shopSlug: merchant.slug,
    autoBookingEnabled: merchant.auto_booking_enabled,
    amountFormatted,
    amountValue: Number(giftCard.amount),
    servicesLabel,
    serviceNames: serviceNamesLive,
    senderFirstName: giftCard.sender_first_name,
    senderLastName: giftCard.sender_last_name,
    recipientFirstName: giftCard.recipient_first_name,
    recipientLastName: giftCard.recipient_last_name,
    senderMessage: giftCard.sender_message,
    code: giftCard.code,
    expiresAtFormatted: expiresAtFmt,
    locale,
  };

  console.log(`\n→ Génération PDF + PNG (1 Satori + 2 Resvg)…`);
  const t0 = Date.now();
  const { pdfUrl, imageUrl } = await renderAndUploadGiftCardAssets(supabase, giftCard.id, renderParams);
  console.log(`  • PDF   : ${pdfUrl ? '✓ ' + pdfUrl : '✗ ÉCHEC'}`);
  console.log(`  • Image : ${imageUrl ? '✓ ' + imageUrl : '✗ ÉCHEC'}`);
  console.log(`  • durée : ${Date.now() - t0}ms`);

  if (has141 && pdfUrl) await supabase.from('gift_cards').update({ pdf_url: pdfUrl }).eq('id', giftCard.id);
  if (has143 && imageUrl) await supabase.from('gift_cards').update({ image_url: imageUrl }).eq('id', giftCard.id);

  const cardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com'}/customer/card/${merchant.id}`;

  console.log(`\n→ Envoi email DESTINATAIRE à ${to}…`);
  const r1 = await sendGiftCardReceivedEmail(to, {
    shopName: merchant.shop_name,
    senderFirstName: giftCard.sender_first_name,
    senderLastName: giftCard.sender_last_name,
    recipientFirstName: giftCard.recipient_first_name,
    recipientLastName: giftCard.recipient_last_name,
    amount: amountFormatted,
    senderMessage: giftCard.sender_message,
    expiresAtFormatted: expiresAtFmt,
    cardUrl,
    primaryColor: merchant.primary_color || '#4b0082',
    locale,
    servicesLabel,
    imageUrl,
    code: giftCard.code,
    bookingUrl: merchant.auto_booking_enabled && merchant.slug
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com'}/p/${merchant.slug}`
      : null,
  });
  console.log(r1.success ? `✓ Destinataire envoyé` : `✗ Destinataire ÉCHEC : ${r1.error}`);

  if (sendBoth) {
    console.log(`\n→ Envoi email OFFREUR à ${to}…`);
    const r2 = await sendGiftCardActivatedEmail(to, {
      shopName: merchant.shop_name,
      senderFirstName: giftCard.sender_first_name,
      recipientFirstName: giftCard.recipient_first_name,
      recipientLastName: giftCard.recipient_last_name,
      amount: amountFormatted,
      expiresAtFormatted: expiresAtFmt,
      locale,
      servicesLabel,
      pdfUrl,
      imageUrl,
      scheduledSendAtFormatted: null,
    });
    console.log(r2.success ? `✓ Offreur envoyé` : `✗ Offreur ÉCHEC : ${r2.error}`);
  } else {
    console.log(`\n  (pas d'email offreur — ajoute --both pour les 2)`);
  }

  console.log('\n✓ Done');
  process.exit(0);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
