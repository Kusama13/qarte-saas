'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Merchant } from '@/types';

interface MerchantContextType {
  merchant: Merchant | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const MerchantContext = createContext<MerchantContextType | undefined>(undefined);

const CACHE_KEY = 'qarte_merchant_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function MerchantProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [merchant, setMerchant] = useState<Merchant | null>(() => {
    // Try to load from cache on initial render for faster display
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
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

  const fetchMerchant = useCallback(async (skipCache = false) => {
    try {
      // Use getSession first (faster, from cache) then verify with getUser if needed
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        localStorage.removeItem(CACHE_KEY);
        router.push('/auth/merchant');
        setLoading(false);
        return;
      }

      const { data, error: merchantError } = await supabase
        .from('merchants')
        .select('*')
        .eq('user_id', session.user.id)
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
          timestamp: Date.now()
        }));
      } catch {
        // Ignore storage errors
      }

      setMerchant(data);
    } catch (err) {
      console.error('MerchantContext error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    // If we have cached data, still fetch fresh data in background
    if (merchant) {
      fetchMerchant(true);
    } else {
      fetchMerchant();
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(CACHE_KEY);
        setMerchant(null);
        router.push('/auth/merchant');
      } else if (event === 'SIGNED_IN') {
        fetchMerchant(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <MerchantContext.Provider value={{ merchant, loading, refetch: fetchMerchant }}>
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
