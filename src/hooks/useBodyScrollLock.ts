'use client';

import { useEffect, useId } from 'react';

/**
 * Counter-based body scroll lock. Multiple components can request a lock
 * simultaneously (sidebar + modal + lightbox). The body stays locked as long
 * as at least one component has an active lock. When the last locker unmounts
 * or deactivates, overflow is restored to its original value.
 *
 * Avoids races where one component's cleanup resets `body.style.overflow = ''`
 * while another component still needs it locked — a common source of iOS PWA
 * freeze where touch dispatch stops working after modal unmount.
 */
const lockers = new Set<string>();
let savedOverflow = '';

function addLocker(id: string) {
  if (lockers.size === 0 && typeof document !== 'undefined') {
    savedOverflow = document.body.style.overflow;
  }
  lockers.add(id);
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'hidden';
  }
}

function removeLocker(id: string) {
  lockers.delete(id);
  if (lockers.size === 0 && typeof document !== 'undefined') {
    document.body.style.overflow = savedOverflow;
    savedOverflow = '';
  }
}

export function useBodyScrollLock(active: boolean) {
  const id = useId();
  useEffect(() => {
    if (!active) return;
    addLocker(id);
    return () => removeLocker(id);
  }, [active, id]);
}
