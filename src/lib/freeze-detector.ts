// Lightweight client-side freeze/jank detector.
// Buffers events in memory, flushes to localStorage on lifecycle events
// or after a flush threshold — to avoid per-tap I/O jank.

const STORAGE_KEY = 'qarte_freeze_logs';
const MAX_LOGS = 150;
const LONG_TASK_MS = 200;
const RAPID_TAP_WINDOW_MS = 1500;
const RAPID_TAP_DISTANCE_PX = 30;
const RAPID_TAP_THRESHOLD = 3;
const FLUSH_EVERY_N_WRITES = 10;

export type LogType =
  | 'init'
  | 'error'
  | 'unhandled_rejection'
  | 'long_task'
  | 'pointerdown'
  | 'rapid_taps'
  | 'visibility'
  | 'pageshow'
  | 'pagehide'
  | 'freeze'
  | 'resume'
  | 'sw_controller_change';

export interface FreezeLog {
  ts: number;
  type: LogType;
  msg: string;
  ctx?: Record<string, unknown>;
}

const CRITICAL_TYPES: LogType[] = ['error', 'unhandled_rejection', 'rapid_taps', 'freeze'];

let initialized = false;
let recentTaps: { x: number; y: number; ts: number }[] = [];
let buffer: FreezeLog[] = [];
let pendingWrites = 0;

function readPersisted(): FreezeLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FreezeLog[]) : [];
  } catch {
    return [];
  }
}

function flush() {
  if (buffer.length === 0) return;
  try {
    const merged = readPersisted().concat(buffer);
    while (merged.length > MAX_LOGS) merged.shift();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    buffer = [];
    pendingWrites = 0;
  } catch {
    // Quota exceeded or storage disabled — drop buffer to avoid unbounded memory.
    buffer = [];
    pendingWrites = 0;
  }
}

function writeLog(type: LogType, msg: string, ctx?: Record<string, unknown>) {
  buffer.push({ ts: Date.now(), type, msg, ctx });
  pendingWrites++;
  if (pendingWrites >= FLUSH_EVERY_N_WRITES || CRITICAL_TYPES.includes(type)) {
    flush();
  }
}

export function getFreezeLogs(): FreezeLog[] {
  if (typeof window === 'undefined') return [];
  return readPersisted().concat(buffer);
}

export function clearFreezeLogs() {
  if (typeof window === 'undefined') return;
  buffer = [];
  pendingWrites = 0;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function describeElement(el: Element | null): string {
  if (!el) return '<null>';
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const cls =
    typeof el.className === 'string' && el.className.trim()
      ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
      : '';
  return `${tag}${id}${cls}`;
}

function elementChain(el: Element | null, depth = 4): string {
  const chain: string[] = [];
  let cur: Element | null = el;
  while (cur && chain.length < depth) {
    chain.push(describeElement(cur));
    cur = cur.parentElement;
  }
  return chain.join(' > ');
}

function isFullScreenOverlay(el: Element | null): boolean {
  if (!el || typeof window === 'undefined') return false;
  const style = window.getComputedStyle(el);
  if (style.position !== 'fixed' && style.position !== 'absolute') return false;
  if (style.pointerEvents === 'none') return false;
  const r = el.getBoundingClientRect();
  return r.width >= window.innerWidth * 0.9 && r.height >= window.innerHeight * 0.9;
}

export function initFreezeDetector() {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;

  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true;

  writeLog('init', 'detector initialized', {
    standalone: isStandalone,
    ua: navigator.userAgent.slice(0, 200),
    url: location.pathname,
  });

  window.addEventListener('error', (e) => {
    writeLog('error', e.message || 'unknown error', {
      filename: e.filename,
      line: e.lineno,
      col: e.colno,
      stack: e.error?.stack?.slice(0, 500),
      url: location.pathname,
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    const reason: unknown = e.reason;
    const msg =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason.slice(0, 200)
          : JSON.stringify(reason)?.slice(0, 200) || 'unknown';
    writeLog('unhandled_rejection', msg, {
      stack: reason instanceof Error ? reason.stack?.slice(0, 500) : undefined,
      url: location.pathname,
    });
  });

  if ('PerformanceObserver' in window) {
    try {
      const obs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration >= LONG_TASK_MS) {
            writeLog('long_task', `${Math.round(entry.duration)}ms`, {
              startTime: Math.round(entry.startTime),
              url: location.pathname,
            });
          }
        }
      });
      obs.observe({ entryTypes: ['longtask'] });
    } catch {
      // longtask not supported (Safari)
    }
  }

  window.addEventListener(
    'pointerdown',
    (e) => {
      const now = Date.now();
      recentTaps = recentTaps.filter((t) => now - t.ts < RAPID_TAP_WINDOW_MS);
      recentTaps.push({ x: e.clientX, y: e.clientY, ts: now });

      // Steady taps: log a cheap entry (no DOM hit-test, no computed style).
      const target = e.target as Element | null;
      const targetChain = elementChain(target);

      if (recentTaps.length < RAPID_TAP_THRESHOLD) {
        writeLog('pointerdown', targetChain, {
          x: Math.round(e.clientX),
          y: Math.round(e.clientY),
          url: location.pathname,
        });
        return;
      }

      // Rapid-tap suspicion — only now do the expensive checks.
      const allClose = recentTaps.every(
        (t) =>
          Math.abs(t.x - e.clientX) < RAPID_TAP_DISTANCE_PX &&
          Math.abs(t.y - e.clientY) < RAPID_TAP_DISTANCE_PX
      );
      if (!allClose) {
        writeLog('pointerdown', targetChain, {
          x: Math.round(e.clientX),
          y: Math.round(e.clientY),
          url: location.pathname,
        });
        return;
      }

      const topAtPoint = document.elementFromPoint(e.clientX, e.clientY);
      writeLog(
        'rapid_taps',
        `${recentTaps.length} taps in ${RAPID_TAP_WINDOW_MS}ms — likely freeze`,
        {
          target: targetChain,
          top: describeElement(topAtPoint),
          overlay: isFullScreenOverlay(topAtPoint),
          x: Math.round(e.clientX),
          y: Math.round(e.clientY),
          url: location.pathname,
        }
      );
      recentTaps = [];
    },
    { capture: true }
  );

  document.addEventListener('visibilitychange', () => {
    writeLog('visibility', document.visibilityState, { url: location.pathname });
    if (document.visibilityState === 'hidden') flush();
  });

  window.addEventListener('pageshow', (e) => {
    writeLog('pageshow', e.persisted ? 'restored from bfcache' : 'normal load', {
      url: location.pathname,
    });
  });

  window.addEventListener('pagehide', (e) => {
    writeLog('pagehide', e.persisted ? 'kept in bfcache' : 'discarded', {
      url: location.pathname,
    });
    flush();
  });

  document.addEventListener('freeze', () =>
    writeLog('freeze', 'page frozen (lifecycle API)', { url: location.pathname })
  );
  document.addEventListener('resume', () =>
    writeLog('resume', 'page resumed (lifecycle API)', { url: location.pathname })
  );

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      writeLog('sw_controller_change', 'controller changed', {
        controller: !!navigator.serviceWorker.controller,
        url: location.pathname,
      });
    });
  }
}
