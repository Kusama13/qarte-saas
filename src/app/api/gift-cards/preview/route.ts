/**
 * GET /api/gift-cards/preview
 *
 * Renvoie un PNG en bytes du bon cadeau du merchant connecté, avec des
 * données factices (« Camille / Romain / 50 € / message exemple »). Utilisé
 * par l'onglet Design du dashboard pour donner un aperçu live de ce que le
 * destinataire verra.
 *
 * Pas de cache CDN : Cache-Control no-store pour que l'aperçu reflète
 * immédiatement chaque modification (upload image, changement de couleurs).
 */

import { NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { renderGiftCardPng } from '@/lib/gift-card-render';
import { formatCurrency, formatLongDate } from '@/lib/utils';
import logger from '@/lib/logger';

export async function GET() {
  try {
    const supabaseAuth = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id, slug, shop_name, shop_address, display_phone, country, locale, primary_color, secondary_color, auto_booking_enabled, hide_address_on_public_page')
      .eq('user_id', user.id)
      .single();
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant introuvable' }, { status: 404 });
    }

    const locale = (merchant.locale || 'fr') as 'fr' | 'en';
    const isEn = locale === 'en';
    const sampleAmount = 50;
    const today = new Date();
    const expiresAt = new Date(today.getTime() + 90 * 24 * 3600 * 1000);

    const buffer = await renderGiftCardPng(
      {
        shopName: merchant.shop_name,
        shopPhone: merchant.display_phone,
        shopCountry: merchant.country,
        shopSlug: merchant.slug,
        autoBookingEnabled: merchant.auto_booking_enabled,
        amountFormatted: formatCurrency(sampleAmount, merchant.country, locale, 0),
        amountValue: sampleAmount,
        servicesLabel: null,
        senderFirstName: isEn ? 'Alex' : 'Romain',
        recipientFirstName: isEn ? 'Sam' : 'Camille',
        senderMessage: isEn ? 'Hope you enjoy your moment.' : 'Profite bien de ton moment.',
        code: 'GIFT-EXEMPLE',
        expiresAtFormatted: formatLongDate(expiresAt, locale),
        locale,
      },
      'email',
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    logger.error('Gift card preview error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
