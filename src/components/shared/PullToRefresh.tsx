'use client';

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { RefreshCw } from 'lucide-react';

type RefreshFn = () => Promise<void> | void;

interface RefreshContextValue {
  register: (fn: RefreshFn) => () => void;
}

const RefreshContext = createContext<RefreshContextValue | null>(null);

const THRESHOLD = 70;
const DAMPING = 0.5;
const MAX_PULL = 100;

function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0;
}

export function PullToRefreshProvider({ children }: { children: ReactNode }) {
  const callbackRef = useRef<RefreshFn | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRefreshingRef = useRef(false);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const iconRef = useRef<SVGSVGElement | null>(null);

  const startYRef = useRef<number | null>(null);
  const pullYRef = useRef(0);
  const activeRef = useRef(false);
  const thresholdCrossedRef = useRef(false);
  const resetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  const register = useCallback<RefreshContextValue['register']>((fn) => {
    callbackRef.current = fn;
    return () => {
      if (callbackRef.current === fn) callbackRef.current = null;
    };
  }, []);

  const setIndicatorStyle = useCallback((translate: number, opacity: number, rotate: number) => {
    const el = indicatorRef.current;
    if (!el) return;
    el.style.transform = `translate(-50%, ${translate}px)`;
    el.style.opacity = String(opacity);
    const icon = iconRef.current;
    if (icon) icon.style.transform = `rotate(${rotate}deg)`;
  }, []);

  const resetIndicator = useCallback((animated: boolean) => {
    const el = indicatorRef.current;
    if (!el) return;
    el.style.transition = animated ? 'transform 200ms ease, opacity 200ms ease' : 'none';
    setIndicatorStyle(0, 0, 0);
    if (resetTimeoutRef.current !== null) window.clearTimeout(resetTimeoutRef.current);
    if (animated) {
      resetTimeoutRef.current = window.setTimeout(() => {
        resetTimeoutRef.current = null;
        if (indicatorRef.current) indicatorRef.current.style.transition = 'none';
      }, 220);
    }
  }, [setIndicatorStyle]);

  useEffect(() => {
    if (!isTouch) return;

    const onTouchStart = (e: TouchEvent) => {
      if (isRefreshingRef.current) return;
      if (!callbackRef.current) return;
      if (window.scrollY > 0) return;
      if (e.touches.length !== 1) return;
      startYRef.current = e.touches[0].clientY;
      pullYRef.current = 0;
      activeRef.current = false;
      thresholdCrossedRef.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startYRef.current === null) return;
      if (isRefreshingRef.current) return;
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta <= 0) return;
      if (!activeRef.current) {
        if (window.scrollY > 0) {
          startYRef.current = null;
          return;
        }
        activeRef.current = true;
        if (indicatorRef.current) indicatorRef.current.style.transition = 'none';
      }
      if (e.cancelable) e.preventDefault();
      const pull = Math.min(delta * DAMPING, MAX_PULL);
      pullYRef.current = pull;
      const progress = Math.min(pull / THRESHOLD, 1);
      setIndicatorStyle(pull, progress, pull * 3);
      if (!thresholdCrossedRef.current && pull >= THRESHOLD) {
        thresholdCrossedRef.current = true;
        if (typeof navigator.vibrate === 'function') navigator.vibrate(10);
      } else if (thresholdCrossedRef.current && pull < THRESHOLD) {
        thresholdCrossedRef.current = false;
      }
    };

    const onTouchEnd = async () => {
      if (startYRef.current === null) return;
      const pull = pullYRef.current;
      const wasActive = activeRef.current;
      startYRef.current = null;
      pullYRef.current = 0;
      activeRef.current = false;
      if (!wasActive) return;
      if (pull >= THRESHOLD && callbackRef.current) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        const el = indicatorRef.current;
        if (el) {
          el.style.transition = 'transform 150ms ease';
          setIndicatorStyle(THRESHOLD, 1, 0);
        }
        try {
          await callbackRef.current();
        } catch (err) {
          console.error('PTR refresh failed:', err);
        } finally {
          isRefreshingRef.current = false;
          setIsRefreshing(false);
          resetIndicator(true);
        }
      } else {
        resetIndicator(true);
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
    };
  }, [isTouch, setIndicatorStyle, resetIndicator]);

  return (
    <RefreshContext.Provider value={{ register }}>
      {isTouch && (
        <div
          ref={indicatorRef}
          aria-hidden
          className="fixed left-1/2 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg pointer-events-none"
          style={{
            top: 'calc(env(safe-area-inset-top) + 8px)',
            transform: 'translate(-50%, 0px)',
            opacity: 0,
          }}
        >
          <RefreshCw
            ref={iconRef}
            className={`w-5 h-5 text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`}
            strokeWidth={2.25}
          />
        </div>
      )}
      {children}
    </RefreshContext.Provider>
  );
}

export function usePullToRefreshRegister(fn: RefreshFn, enabled = true) {
  const ctx = useContext(RefreshContext);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!ctx || !enabled) return;
    return ctx.register(() => fnRef.current());
  }, [ctx, enabled]);
}
