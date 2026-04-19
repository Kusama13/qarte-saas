'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import { getSupabase } from '@/lib/supabase';
import type { Merchant } from '@/types';

interface MerchantContextType {
  merchant: Merchant | null;
  loading: boolean;
  refetch: () => Promise<void>;
  updateMerchant: (patch: Partial<Merchant>) => void;
}

const MerchantContext = createContext<MerchantContextType | undefined>(undefined);

const CACHE_KEY = 'qarte_merchant_cache';
const CACHE_VERSION = 2; // Increment to bust cache on schema changes
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function MerchantProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const supabase = getSupabase();
  const [merchant, setMerchant] = useState<Merchant | null>(() => {
    // Try to load from cache on initial render for faster display
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp, version } = JSON.parse(cached);
          if (version === CACHE_VERSION && Date.now() - timestamp < CACHE_DURATION) {
            return data;
          }
        }
      } catch {
        // Ignore cache errors
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(!merchant); // Skip loading if we have cached data
  // Track merchant presence via ref so fetchMerchant stays stable (removing `merchant`
  // from the dep array avoids recreating the callback on every merchant update, which
  // otherwise cascades re-renders through every consumer of the context).
  const hasMerchantRef = useRef(!!merchant);

  const fetchMerchant = useCallback(async () => {
    try {
      // Use getUser() to validate JWT and trigger token refresh if needed
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        localStorage.removeItem(CACHE_KEY);
        router.push('/auth/merchant');
        setLoading(false);
        return;
      }

      const { data, error: merchantError } = await supabase
        .from('merchants')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single();

      if (merchantError || !data) {
        localStorage.removeItem(CACHE_KEY);
        router.push('/auth/merchant');
        setLoading(false);
        return;
      }

      // Update cache
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data,
          timestamp: Date.now(),
          version: CACHE_VERSION,
        }));
      } catch {
        // Ignore storage errors
      }

      setMerchant(data);
      hasMerchantRef.current = true;

      // Track last_seen_at (fire-and-forget, non-blocking)
      supabase
        .from('merchants')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', data.id)
        .then(() => {});
    } catch (err) {
      console.error('MerchantContext error:', err);
      // Failsafe: si l'exception happen avant tout setMerchant et qu'on n'a pas
      // de cache, on bounce vers auth pour eviter un spinner infini
      if (!hasMerchantRef.current) {
        localStorage.removeItem(CACHE_KEY);
        router.push('/auth/merchant');
      }
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchMerchant();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(CACHE_KEY);
        setMerchant(null);
        hasMerchantRef.current = false;
        router.push('/auth/merchant');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchMerchant();
      }
    });

    return () => subscription.unsubscribe();
    // fetchMerchant is stable (only depends on supabase/router, both stable)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateMerchant = useCallback((patch: Partial<Merchant>) => {
    setMerchant(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: next,
          timestamp: Date.now(),
          version: CACHE_VERSION,
        }));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ merchant, loading, refetch: fetchMerchant, updateMerchant }),
    [merchant, loading, fetchMerchant, updateMerchant]
  );

  return (
    <MerchantContext.Provider value={value}>
      {children}
    </MerchantContext.Provider>
  );
}

export function useMerchant() {
  const context = useContext(MerchantContext);
  if (context === undefined) {
    throw new Error('useMerchant must be used within a MerchantProvider');
  }
  return context;
}
