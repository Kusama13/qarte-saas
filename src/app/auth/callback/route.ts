import { createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const VALID_OTP_TYPES = ['signup', 'email', 'recovery', 'invite', 'email_change'] as const;
type OtpType = (typeof VALID_OTP_TYPES)[number];

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  // Sécurité : n'accepter que les chemins relatifs (pas d'open redirect)
  const rawNext = requestUrl.searchParams.get('next') || '/dashboard';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard';

  const supabase = await createRouteHandlerSupabaseClient();
  let exchangeError: string | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) exchangeError = error.message;
  } else if (token_hash && type) {
    const otpType = (VALID_OTP_TYPES as readonly string[]).includes(type)
      ? (type as OtpType)
      : null;
    if (!otpType) {
      exchangeError = 'invalid_otp_type';
    } else {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type: otpType });
      if (error) exchangeError = error.message;
    }
  } else {
    exchangeError = 'missing_code';
  }

  // En cas d'erreur, propage un flag dans l'URL pour que la page next puisse afficher
  // un message clair (ex: lien expiré → propose un nouveau lien) au lieu d'un faux
  // "session valide" suivi d'un updateUser qui échoue.
  const redirectUrl = new URL(next, requestUrl.origin);
  if (exchangeError) {
    redirectUrl.searchParams.set('auth_error', exchangeError);
  }
  return NextResponse.redirect(redirectUrl);
}
