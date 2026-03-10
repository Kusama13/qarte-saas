import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase';
import logger from '@/lib/logger';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';

/** Detect image type from magic bytes. Returns extension or null if invalid. */
function detectImageType(header: Buffer): string | null {
  if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) return 'jpg';
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) return 'png';
  if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38) return 'gif';
  if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
      header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50) return 'webp';
  return null;
}

// POST — upload photo + insert into merchant_photos
export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const rl = checkRateLimit(`photos:${ip}`, { maxRequests: 10, windowMs: 60 * 1000 });
  if (!rl.success) return rateLimitResponse(rl.resetTime);

  const supabase = await createRouteHandlerSupabaseClient();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const merchantId = formData.get('merchantId') as string;
    const position = parseInt(formData.get('position') as string, 10);

    if (!file || !merchantId || isNaN(position) || position < 1 || position > 6) {
      return NextResponse.json({ error: 'file, merchantId et position (1-6) requis' }, { status: 400 });
    }

    // Auth: verify user owns merchant
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF.' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux. Maximum 10 Mo.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Magic bytes validation
    const magicBytes = buffer.subarray(0, 12);
    const detectedExt = detectImageType(magicBytes);
    if (!detectedExt) {
      return NextResponse.json({ error: 'Contenu du fichier invalide.' }, { status: 400 });
    }

    // Delete existing photo at this position if any
    const { data: existing } = await supabase
      .from('merchant_photos')
      .select('id, url')
      .eq('merchant_id', merchantId)
      .eq('position', position)
      .single();

    if (existing) {
      // Remove old file from storage
      const oldPath = existing.url.split('/images/')[1];
      if (oldPath) {
        await supabase.storage.from('images').remove([oldPath]);
      }
      await supabase.from('merchant_photos').delete().eq('id', existing.id);
    }

    // Upload to storage
    const filename = `photos/${merchantId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${detectedExt}`;
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      logger.error('Photo upload error:', uploadError);
      return NextResponse.json({ error: 'Erreur lors de l\'upload' }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from('images').getPublicUrl(filename);

    // Insert into merchant_photos
    const { data: photo, error: insertError } = await supabase
      .from('merchant_photos')
      .insert({
        merchant_id: merchantId,
        url: urlData.publicUrl,
        position,
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Photo insert error:', insertError);
      // Clean up uploaded file
      await supabase.storage.from('images').remove([filename]);
      return NextResponse.json({ error: 'Erreur lors de l\'enregistrement' }, { status: 500 });
    }

    return NextResponse.json({ success: true, photo });
  } catch (error) {
    logger.error('Photo upload error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE — remove photo by id
export async function DELETE(request: NextRequest) {
  const supabase = await createRouteHandlerSupabaseClient();

  try {
    const { photoId, merchantId } = await request.json();

    if (!photoId || !merchantId) {
      return NextResponse.json({ error: 'photoId et merchantId requis' }, { status: 400 });
    }

    // Auth: verify user owns merchant
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Get photo to delete
    const { data: photo } = await supabase
      .from('merchant_photos')
      .select('id, url')
      .eq('id', photoId)
      .eq('merchant_id', merchantId)
      .single();

    if (!photo) {
      return NextResponse.json({ error: 'Photo introuvable' }, { status: 404 });
    }

    // Remove from storage
    const storagePath = photo.url.split('/images/')[1];
    if (storagePath) {
      await supabase.storage.from('images').remove([storagePath]);
    }

    // Delete DB record
    await supabase.from('merchant_photos').delete().eq('id', photo.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Photo delete error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
