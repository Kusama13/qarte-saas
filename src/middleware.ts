import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

// next-intl middleware for locale detection and rewriting
const intlMiddleware = createIntlMiddleware({
  ...routing,
  // Don't auto-redirect based on Accept-Language — users must explicitly visit /en/
  localeDetection: false,
});

// Auth route definitions (bare paths, without locale prefix)
const protectedRoutes = ['/dashboard'];
const adminRoutes = ['/admin'];
const authRoutes = ['/auth/merchant', '/auth/merchant/signup'];
const completeProfileRoute = '/auth/merchant/signup/complete';

const BLOCKED_IPS = (process.env.BLOCKED_IPS || '').split(',').map(ip => ip.trim()).filter(Boolean);

// Strip locale prefix from pathname to get the "bare" path for route matching
function getBarePath(pathname: string): string {
  const match = pathname.match(/^\/(en)(\/.*|$)/);
  return match ? (match[2] || '/') : pathname;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // IP blocklist
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  if (ip && BLOCKED_IPS.includes(ip)) {
    return new NextResponse('Accès refusé.', { status: 403 });
  }

  // Redirect /en/* to FR equivalent — EN disabled for now (infrastructure kept)
  if (pathname.startsWith('/en/') || pathname === '/en') {
    const frPath = pathname.replace(/^\/en\/?/, '/') || '/';
    return NextResponse.redirect(new URL(frPath, request.url), 301);
  }

  // Serve the correct PWA manifest based on referer (dashboard → Qarte Pro, else → customer)
  if (pathname === '/manifest.webmanifest') {
    const referer = request.headers.get('referer') || '';
    if (referer.includes('/dashboard')) {
      return NextResponse.rewrite(new URL('/api/manifest/pro', request.url));
    }
    return NextResponse.next();
  }

  // Get bare path for auth route matching
  const barePath = getBarePath(pathname);

  // Check if this route needs auth
  const isProtectedRoute = protectedRoutes.some((route) => barePath.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => barePath.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => barePath === route);
  const isCompleteRoute = barePath === completeProfileRoute;

  const needsAuth = isProtectedRoute || isAdminRoute || isAuthRoute || isCompleteRoute;

  // No auth needed — just handle i18n routing
  if (!needsAuth) {
    return intlMiddleware(request);
  }

  // Auth needed — run intl middleware first, then overlay auth checks
  const intlResponse = intlMiddleware(request);

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
          cookiesToSet.forEach(({ name, value, options }) =>
            intlResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not use getSession() in middleware - use getUser() instead
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const session = user ? { user } : null;

  // Handle complete profile route (Phase 2 of signup)
  if (isCompleteRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/merchant/signup', request.url));
    }
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (merchant) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return intlResponse;
  }

  // Protection des routes dashboard
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/merchant', request.url);
    redirectUrl.searchParams.set('redirect', barePath);
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
      return NextResponse.redirect(new URL(completeProfileRoute, request.url));
    }
  }

  // Protection des routes admin
  if (isAdminRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/admin', request.url));
    }

    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (!superAdmin) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/auth/admin', request.url));
    }
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return intlResponse;
}

export const config = {
  matcher: [
    '/manifest.webmanifest',
    // Match all paths except: /api, /_next, /_vercel, and static files (with dots)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
