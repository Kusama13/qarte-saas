import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Client pour les composants (avec gestion des cookies de session)
// Utilise un singleton pour éviter de créer plusieurs instances
let supabaseInstance: ReturnType<typeof createClientComponentClient> | null = null;

export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient();
  }
  return supabaseInstance;
};

// Export pour compatibilité (sera le même client)
export const supabase = typeof window !== 'undefined'
  ? createClientComponentClient()
  : createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

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
