import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

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

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF.' }, { status: 400 });
    }

    // Validate file size (max 10MB - images are compressed client-side)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Fichier trop volumineux. Maximum 10 Mo.' }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop();
    const filename = `offers/${merchantId}/${Date.now()}.${ext}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
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
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
