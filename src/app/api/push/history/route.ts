import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Helper to get Supabase client with service role (bypasses RLS)
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET - Get push history for a merchant
export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const cookieStore = await cookies();
  const supabaseAuth = createRouteHandlerClient({ cookies: () => Promise.resolve(cookieStore) });

  try {
    // SECURITY: Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId requis' },
        { status: 400 }
      );
    }

    // SECURITY: Verify user owns this merchant
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { data: history, error } = await supabase
      .from('push_history')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching push history:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération de l\'historique' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      history: history || []
    });
  } catch (error) {
    console.error('Push history error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
