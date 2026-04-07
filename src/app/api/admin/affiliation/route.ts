import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  commission_percent: z.number().int().min(0).max(100),
  notes: z.string().max(500).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-affiliation');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  try {
    const [linksRes, merchantsRes, superAdminsRes] = await Promise.all([
      supabaseAdmin.from('affiliate_links').select('*').order('created_at', { ascending: false }),
      supabaseAdmin
        .from('merchants')
        .select('id, signup_source, subscription_status, shop_name, created_at, trial_ends_at, user_id')
        .like('signup_source', 'affiliate_%'),
      supabaseAdmin.from('super_admins').select('user_id'),
    ]);

    if (linksRes.error) {
      return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 });
    }

    const adminIds = new Set((superAdminsRes.data || []).map((a) => a.user_id));
    const merchants = (merchantsRes.data || []).filter((m) => !adminIds.has(m.user_id));

    // Group merchants by affiliate slug
    const merchantsBySlug = new Map<string, typeof merchants>();
    for (const m of merchants) {
      const slug = m.signup_source?.replace('affiliate_', '') || '';
      if (!merchantsBySlug.has(slug)) merchantsBySlug.set(slug, []);
      merchantsBySlug.get(slug)!.push(m);
    }

    const links = (linksRes.data || []).map((link) => {
      const linkedMerchants = merchantsBySlug.get(link.slug) || [];
      const now = new Date();
      return {
        ...link,
        stats: {
          total: linkedMerchants.length,
          trialing: linkedMerchants.filter((m) => {
            if (m.subscription_status !== 'trial') return false;
            const end = m.trial_ends_at ? new Date(m.trial_ends_at) : null;
            return end && end >= now;
          }).length,
          active: linkedMerchants.filter((m) => m.subscription_status === 'active').length,
          canceled: linkedMerchants.filter((m) => m.subscription_status === 'canceled').length,
          expired: linkedMerchants.filter((m) => {
            if (m.subscription_status !== 'trial') return false;
            const end = m.trial_ends_at ? new Date(m.trial_ends_at) : null;
            return end && end < now;
          }).length,
        },
        merchants: linkedMerchants.map((m) => ({
          id: m.id,
          shopName: m.shop_name,
          status: m.subscription_status,
          createdAt: m.created_at,
          trialEndsAt: m.trial_ends_at,
        })),
      };
    });

    return NextResponse.json({ links });
  } catch (err) {
    console.error('[admin/affiliation] GET error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-affiliation');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, slug, commission_percent, notes } = parsed.data;

    // Check slug uniqueness
    const { data: existing } = await supabaseAdmin
      .from('affiliate_links')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Ce slug est deja utilise' }, { status: 409 });
    }

    const { data, error } = await supabaseAdmin
      .from('affiliate_links')
      .insert({ name, slug, commission_percent, notes: notes || null })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create link' }, { status: 500 });
    }

    return NextResponse.json({ link: data }, { status: 201 });
  } catch (err) {
    console.error('[admin/affiliation] POST error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
