import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createServerClient as createSupabaseServerClient, createBrowserClient } from '@supabase/ssr';

// ============================================
// BROWSER CLIENT (for client components)
// Uses @supabase/ssr for consistency with middleware
// ============================================
let browserClientInstance: ReturnType<typeof createBrowserClient> | null = null;

export const getSupabase = () => {
  if (typeof window === 'undefined') {
    // Server-side: return a basic client (won't have session)
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
  }

  if (!browserClientInstance) {
    browserClientInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClientInstance;
};

// Export pour compatibilité avec l'ancien code
export const supabase = typeof window !== 'undefined'
  ? createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  : createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

// Alias for createClientComponentClient compatibility
export const createClientComponentClient = () => getSupabase();

// ============================================
// SINGLETON ADMIN CLIENT (Server-side only)
// Réutilise la même connexion pour toutes les API routes
// ============================================
let supabaseAdminInstance: SupabaseClient | null = null;

export const getSupabaseAdmin = (): SupabaseClient => {
  if (!supabaseAdminInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdminInstance;
};

// Alias pour compatibilité avec l'ancien code
export const supabaseAdmin = getSupabaseAdmin;

// Client serveur pour les API routes (deprecated - utiliser getSupabaseAdmin)
export const createServerClient = () => {
  console.warn('createServerClient is deprecated, use getSupabaseAdmin() instead');
  return getSupabaseAdmin();
};

// ============================================
// ROUTE HANDLER CLIENT (for authentication in API routes)
// Uses @supabase/ssr for Next.js 15 compatibility
// Dynamic import to avoid "next/headers" error in client components
// ============================================
export const createRouteHandlerSupabaseClient = async () => {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
};
