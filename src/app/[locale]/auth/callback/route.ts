import { createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  // Sécurité : n'accepter que les chemins relatifs (pas d'open redirect)
  const rawNext = requestUrl.searchParams.get('next') || '/dashboard';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard';

  const supabase = await createRouteHandlerSupabaseClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  } else if (token_hash && type) {
    await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'email',
    });
  }

  // Rediriger vers la page demandée (ou dashboard par défaut)
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
