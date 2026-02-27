import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard'];
const adminRoutes = ['/admin'];
const authRoutes = ['/auth/merchant', '/auth/merchant/signup'];
const completeProfileRoute = '/auth/merchant/signup/complete';

const BLOCKED_IPS = (process.env.BLOCKED_IPS || '').split(',').map(ip => ip.trim()).filter(Boolean);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // IP blocklist
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  if (ip && BLOCKED_IPS.includes(ip)) {
    return new NextResponse('Accès refusé.', { status: 403 });
  }

  // Serve the correct PWA manifest based on referer (dashboard → Qarte Pro, else → customer)
  if (pathname === '/manifest.webmanifest') {
    const referer = request.headers.get('referer') || '';
    if (referer.includes('/dashboard')) {
      return NextResponse.rewrite(new URL('/api/manifest/pro', request.url));
    }
    return NextResponse.next();
  }

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

  // Handle complete profile route (Phase 2 of signup)
  if (pathname === completeProfileRoute) {
    if (!session) {
      // Not logged in → redirect to signup
      return NextResponse.redirect(new URL('/auth/merchant/signup', request.url));
    }
    // Check if merchant already exists
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (merchant) {
      // Already has merchant → redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Logged in but no merchant → allow access to complete profile
    return supabaseResponse;
  }

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // Protection des routes dashboard
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/merchant', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is authenticated and accessing dashboard, check if merchant exists
  if (isProtectedRoute && session) {
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (!merchant) {
      // Logged in but no merchant → redirect to complete profile
      return NextResponse.redirect(new URL(completeProfileRoute, request.url));
    }
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
    '/manifest.webmanifest',
    '/dashboard/:path*',
    '/admin/:path*',
    '/auth/merchant',
    '/auth/merchant/signup',
    '/auth/merchant/signup/complete',
  ],
};
