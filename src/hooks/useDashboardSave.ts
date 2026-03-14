'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook to manage the save/loading/saved-flash pattern used across dashboard pages.
 *
 * Usage:
 *   const { saving, saved, save } = useDashboardSave();
 *   const handleSave = () => save(async () => {
 *     await supabase.from('merchants').update({...}).eq('id', merchant.id);
 *     await refetch();
 *   });
 */
export function useDashboardSave(flashDuration = 3000) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const save = useCallback(async (fn: () => Promise<void>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSaving(true);
    try {
      await fn();
      setSaved(true);
      timerRef.current = setTimeout(() => setSaved(false), flashDuration);
    } catch {
      // Callback should handle its own error state (setError, etc.)
      // Throwing from the callback prevents the "saved" flash.
    } finally {
      setSaving(false);
    }
  }, [flashDuration]);

  return { saving, saved, save } as const;
}
