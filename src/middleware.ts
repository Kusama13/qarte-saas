import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard'];
const adminRoutes = ['/admin'];
const authRoutes = ['/auth/merchant', '/auth/merchant/signup'];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not use getSession() in middleware - use getUser() instead
  // getSession() doesn't validate the JWT, getUser() does
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const session = user ? { user } : null;

  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Protection des routes dashboard
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/merchant', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Protection des routes admin
  if (isAdminRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/admin', request.url));
    }

    // Vérifier si l'utilisateur est super admin
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (!superAdmin) {
      // Connecté mais pas super admin → rediriger vers la page login admin
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/auth/admin', request.url));
    }
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/auth/merchant',
    '/auth/merchant/signup',
  ],
};
