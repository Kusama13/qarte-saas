/**
 * Génère et upload les assets visuels du bon cadeau dans Supabase Storage.
 *
 * Deux formats issus d'UN SEUL rendu Satori (cf. renderGiftCardPdfAndEmailPng) :
 *   - PDF A6 paysage imprimable, joint comme lien dans l'email offreur
 *   - PNG paysage embarqué dans les emails (offreur + destinataire)
 *
 * Bucket : `gift-cards-pdf` (créé par la mig 141, étendu en mig 143 pour
 * accepter image/png en plus de application/pdf).
 */

import {
  renderGiftCardPdfAndEmailPng,
  type GiftCardRenderParams,
} from './gift-card-render';
import logger from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

export const GIFT_CARD_BUCKET = 'gift-cards-pdf';

// Suffixe pour casser le cache CDN/Gmail à chaque re-rendu (le bucket
// est public et upsert remplace bien le fichier, mais Gmail proxy d'images
// et le CDN Supabase gardent l'ancienne URL en cache pendant 1h+).
function versionedPath(id: string, ext: 'pdf' | 'png'): string {
  const v = Math.floor(Date.now() / 1000).toString(36);
  return `${id}-${v}.${ext}`;
}

async function uploadToBucket(
  supabase: SupabaseClient,
  path: string,
  buffer: Buffer,
  contentType: 'application/pdf' | 'image/png',
): Promise<string | null> {
  const { error } = await supabase.storage
    .from(GIFT_CARD_BUCKET)
    .upload(path, buffer, { contentType, upsert: true });
  if (error) {
    logger.error(`Gift card ${contentType} upload error:`, error);
    return null;
  }
  return supabase.storage.from(GIFT_CARD_BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Génère PDF + PNG en UN seul satori (la fonction render mutualise le SVG
 * et fait juste 2 passes Resvg) puis upload les deux en parallèle.
 * Retourne `{ pdfUrl, imageUrl }` (chacune null si échec individuel).
 */
export async function renderAndUploadGiftCardAssets(
  supabase: SupabaseClient,
  giftCardId: string,
  params: GiftCardRenderParams,
): Promise<{ pdfUrl: string | null; imageUrl: string | null }> {
  try {
    const { pdf, emailPng } = await renderGiftCardPdfAndEmailPng(params);
    const [pdfUrl, imageUrl] = await Promise.all([
      uploadToBucket(supabase, versionedPath(giftCardId, 'pdf'), pdf, 'application/pdf'),
      uploadToBucket(supabase, versionedPath(giftCardId, 'png'), emailPng, 'image/png'),
    ]);
    return { pdfUrl, imageUrl };
  } catch (error) {
    logger.error('Gift card render error:', error);
    return { pdfUrl: null, imageUrl: null };
  }
}
