/**
 * Helper : génère le PDF du bon cadeau et l'upload dans Supabase Storage.
 *
 * Appelé fire-and-forget après la confirmation de paiement par le merchant.
 * Le PDF est ensuite référencé dans `gift_cards.pdf_url` et joint aux emails
 * destinataire + offreur.
 *
 * Bucket : `gift-cards-pdf` (à créer manuellement dans Supabase Storage,
 * bucket public, MIME application/pdf autorisé).
 */

import { renderToBuffer } from '@react-pdf/renderer';
import { GiftCardPDF } from '@/pdf/GiftCardPDF';
import logger from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

export const GIFT_CARD_PDF_BUCKET = 'gift-cards-pdf';

interface RenderGiftCardPdfParams {
  shopName: string;
  shopAddress?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  amountFormatted: string;
  servicesLabel?: string | null;
  serviceNames?: string[];
  senderFullName: string;
  recipientFullName: string;
  senderMessage?: string | null;
  code: string;
  expiresAtFormatted: string;
  locale?: 'fr' | 'en';
}

/**
 * Génère le PDF en mémoire (Buffer) puis l'upload dans le bucket Supabase.
 * Retourne l'URL publique. Logué et silent si échec (ne bloque pas le flow).
 */
export async function renderAndUploadGiftCardPdf(
  supabase: SupabaseClient,
  giftCardId: string,
  params: RenderGiftCardPdfParams,
): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(GiftCardPDF(params) as any);
    const path = `${giftCardId}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from(GIFT_CARD_PDF_BUCKET)
      .upload(path, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      logger.error('Gift card PDF upload error:', uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(GIFT_CARD_PDF_BUCKET)
      .getPublicUrl(path);

    return publicUrlData.publicUrl;
  } catch (error) {
    logger.error('Gift card PDF render error:', error);
    return null;
  }
}
