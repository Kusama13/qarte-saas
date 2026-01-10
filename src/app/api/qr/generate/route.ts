import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { generateQRCode, getScanUrl } from '@/lib/utils';
import { z } from 'zod';

const generateSchema = z.object({
  merchant_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }

    const { merchant_id } = parsed.data;

    const { data: merchant } = await supabase
      .from('merchants')
      .select('slug')
      .eq('id', merchant_id)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json(
        { error: 'Commerçant introuvable' },
        { status: 404 }
      );
    }

    const scanUrl = getScanUrl(merchant.slug);
    const qrCodeUrl = await generateQRCode(scanUrl);

    return NextResponse.json({
      success: true,
      qr_code_url: qrCodeUrl,
      scan_url: scanUrl,
    });
  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
