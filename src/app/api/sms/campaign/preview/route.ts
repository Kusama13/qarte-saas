import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { resolveAudienceUnion, resolveAudienceWithNames } from '@/lib/sms-audience';
import type { AudienceFilter } from '@/lib/sms-audience';
import { bodyHasPersonalization, computeCampaignSmsBreakdown } from '@/lib/sms-validator';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

const FilterSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('all') }),
  z.object({ type: z.literal('inactive'), days: z.union([z.literal(14), z.literal(30), z.literal(60), z.literal(90)]) }),
  z.object({ type: z.literal('new'), days: z.number().int().min(1).max(365) }),
  z.object({ type: z.literal('vip'), minStamps: z.number().int().min(0).optional(), minAmount: z.number().min(0).optional() }),
  z.object({ type: z.literal('birthday_month') }),
  z.object({ type: z.literal('unused_voucher'), olderThanDays: z.number().int().min(1).max(365) }),
]);

const BodySchema = z.object({
  merchantId: z.string().uuid(),
  filters: z.array(FilterSchema).min(1).max(10),
  /** Optional. Si fourni et contient {prenom}, retourne breakdown personnalise. */
  body: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }
    const { merchantId, filters, body } = parsed.data;

    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id, shop_name')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single<{ id: string; shop_name: string }>();
    if (!merchant) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

    // Si body fourni avec {prenom} -> breakdown personnalise (firstnames cote
    // serveur, jamais exposes au client).
    if (body && bodyHasPersonalization(body)) {
      const { count, recipients } = await resolveAudienceWithNames(supabaseAdmin, merchantId, filters as AudienceFilter[]);
      const breakdown = computeCampaignSmsBreakdown(body, recipients, merchant.shop_name);
      return NextResponse.json({ count, breakdown });
    }

    const { count } = await resolveAudienceUnion(supabaseAdmin, merchantId, filters as AudienceFilter[]);
    return NextResponse.json({ count });
  } catch (error) {
    logger.error('SMS campaign preview error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
