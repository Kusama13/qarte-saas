import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import logger from '@/lib/logger';

/** Detect image type from magic bytes. Returns extension or null if invalid. */
function detectImageType(header: Buffer): string | null {
  // JPEG: FF D8 FF
  if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) return 'jpg';
  // PNG: 89 50 4E 47
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) return 'png';
  // GIF: 47 49 46 38
  if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38) return 'gif';
  // WebP: RIFF....WEBP
  if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
      header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50) return 'webp';
  return null;
}

export async function POST(request: NextRequest) {
  const supabase = await createRouteHandlerSupabaseClient();
  

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const merchantId = formData.get('merchantId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId required' }, { status: 400 });
    }

    // SECURITY: Verify user is authenticated and owns the merchant
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé - connexion requise' }, { status: 401 });
    }

    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé - vous ne pouvez pas uploader pour ce commerce' }, { status: 403 });
    }

    // Validate file type (client MIME check first)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF.' }, { status: 400 });
    }

    // Validate file size (max 10MB - images are compressed client-side)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Fichier trop volumineux. Maximum 10 Mo.' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate actual file content via magic bytes (not just client MIME)
    const magicBytes = buffer.subarray(0, 12);
    const detectedExt = detectImageType(magicBytes);
    if (!detectedExt) {
      return NextResponse.json({ error: 'Contenu du fichier invalide. Seuls les vrais fichiers image sont acceptés.' }, { status: 400 });
    }

    // Use detected extension (not user-provided filename)
    const filename = `offers/${merchantId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${detectedExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      logger.error('Upload error:', error);
      return NextResponse.json({ error: 'Erreur lors de l\'upload' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filename);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
    });
  } catch (error) {
    logger.error('Upload error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
