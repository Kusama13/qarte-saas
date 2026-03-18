import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import logger from '@/lib/logger';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { detectImageType } from '@/lib/image-utils';

interface PhotoConfig {
  tableName: string;
  storagePrefix: string;
  rateLimitKey: string;
}

export function createPhotoHandlers(config: PhotoConfig) {
  const { tableName, storagePrefix, rateLimitKey } = config;

  async function POST(request: NextRequest) {
    const ip = getClientIP(request);
    const rl = checkRateLimit(`${rateLimitKey}:${ip}`, { maxRequests: 10, windowMs: 60 * 1000 });
    if (!rl.success) return rateLimitResponse(rl.resetTime);

    const supabase = await createRouteHandlerSupabaseClient();

    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const merchantId = formData.get('merchantId') as string;
      const slotId = formData.get('slotId') as string;
      const position = parseInt(formData.get('position') as string, 10);

      if (!file || !merchantId || !slotId || isNaN(position) || position < 1 || position > 3) {
        return NextResponse.json({ error: 'file, merchantId, slotId et position (1-3) requis' }, { status: 400 });
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
      }

      const supabaseAdmin = getSupabaseAdmin();

      // Verify merchant ownership + slot ownership in parallel
      const [{ data: merchant }, { data: slot }] = await Promise.all([
        supabase.from('merchants').select('id').eq('id', merchantId).eq('user_id', user.id).single(),
        supabaseAdmin.from('merchant_planning_slots').select('id').eq('id', slotId).eq('merchant_id', merchantId).single(),
      ]);

      if (!merchant) {
        return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
      }
      if (!slot) {
        return NextResponse.json({ error: 'Creneau introuvable' }, { status: 404 });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: 'Type de fichier non supporte. Utilisez JPG, PNG, WebP ou GIF.' }, { status: 400 });
      }

      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Fichier trop volumineux. Maximum 10 Mo.' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const magicBytes = buffer.subarray(0, 12);
      const detectedExt = detectImageType(magicBytes);
      if (!detectedExt) {
        return NextResponse.json({ error: 'Contenu du fichier invalide.' }, { status: 400 });
      }

      // Delete existing photo at this position if any
      const { data: existing } = await supabaseAdmin
        .from(tableName)
        .select('id, url')
        .eq('slot_id', slotId)
        .eq('position', position)
        .single();

      if (existing) {
        const oldPath = existing.url.split('/images/')[1];
        if (oldPath) {
          await supabase.storage.from('images').remove([oldPath]);
        }
        await supabaseAdmin.from(tableName).delete().eq('id', existing.id);
      }

      // Upload to storage
      const filename = `${storagePrefix}/${merchantId}/${slotId}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${detectedExt}`;
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filename, buffer, { contentType: file.type, upsert: true });

      if (uploadError) {
        logger.error(`${tableName} upload error:`, uploadError);
        return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
      }

      const { data: urlData } = supabase.storage.from('images').getPublicUrl(filename);

      const { data: photo, error: insertError } = await supabaseAdmin
        .from(tableName)
        .insert({ slot_id: slotId, merchant_id: merchantId, url: urlData.publicUrl, position })
        .select()
        .single();

      if (insertError) {
        logger.error(`${tableName} insert error:`, insertError);
        await supabase.storage.from('images').remove([filename]);
        return NextResponse.json({ error: "Erreur lors de l'enregistrement" }, { status: 500 });
      }

      return NextResponse.json({ success: true, photo });
    } catch (error) {
      logger.error(`${tableName} upload error:`, error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
  }

  async function DELETE(request: NextRequest) {
    const supabase = await createRouteHandlerSupabaseClient();

    try {
      const { photoId, merchantId } = await request.json();

      if (!photoId || !merchantId) {
        return NextResponse.json({ error: 'photoId et merchantId requis' }, { status: 400 });
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
      }

      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('id', merchantId)
        .eq('user_id', user.id)
        .single();

      if (!merchant) {
        return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
      }

      const supabaseAdmin = getSupabaseAdmin();
      const { data: photo } = await supabaseAdmin
        .from(tableName)
        .select('id, url')
        .eq('id', photoId)
        .eq('merchant_id', merchantId)
        .single();

      if (!photo) {
        return NextResponse.json({ error: 'Photo introuvable' }, { status: 404 });
      }

      const storagePath = photo.url.split('/images/')[1];
      if (storagePath) {
        await supabase.storage.from('images').remove([storagePath]);
      }

      await supabaseAdmin.from(tableName).delete().eq('id', photo.id);

      return NextResponse.json({ success: true });
    } catch (error) {
      logger.error(`${tableName} delete error:`, error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
  }

  return { POST, DELETE };
}
