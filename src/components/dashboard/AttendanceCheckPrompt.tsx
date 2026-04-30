'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, UserX, ChevronDown, X, Loader2 } from 'lucide-react';
import { safeFetchJson } from '@/lib/fetch';
import { cn } from '@/lib/utils';

interface YesterdayBooking {
  id: string;
  client_name: string | null;
  start_time: string;
  attendance_status: string | null;
}

interface Props {
  merchantId: string;
}

/**
 * Soft-prompt matin : "Hier tu as eu N résas. Tout le monde est venu ?"
 *
 * Le cron morning-jobs auto-marque tous les RDV passés en pending → attended.
 * Ce prompt laisse au merchant un coup d'œil rapide pour flipper en no_show
 * les rares cas d'absence. 1 click "Tout bon" si rien à corriger.
 */
export default function AttendanceCheckPrompt({ merchantId }: Props) {
  const [show, setShow] = useState(false);
  const [bookings, setBookings] = useState<YesterdayBooking[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [flipping, setFlipping] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    safeFetchJson<{ showPrompt: boolean; bookings: YesterdayBooking[] }>(
      `/api/dashboard/attendance-check?merchantId=${merchantId}`,
    ).then((data) => {
      if (cancelled || !data) return;
      setShow(data.showPrompt);
      setBookings(data.bookings || []);
    });
    return () => { cancelled = true; };
  }, [merchantId]);

  const dismiss = useCallback(async () => {
    setDismissing(true);
    await fetch(`/api/dashboard/attendance-check?merchantId=${merchantId}`, { method: 'POST' });
    setShow(false);
  }, [merchantId]);

  const flipAttendance = useCallback(async (slotId: string, status: 'no_show' | 'attended') => {
    setFlipping(slotId);
    const res = await fetch('/api/planning/attendance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot_id: slotId, attendance_status: status }),
    });
    if (res.ok) {
      setBookings((prev) => prev.map((b) => (b.id === slotId ? { ...b, attendance_status: status } : b)));
    }
    setFlipping(null);
  }, []);

  if (!show) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 bg-emerald-50">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 leading-tight">
            Hier tu as eu {bookings.length} {bookings.length > 1 ? 'résas' : 'résa'}
          </p>
          <p className="text-[12px] text-slate-500 leading-snug mt-0.5">Tout le monde est venu ?</p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex items-center justify-center w-11 h-11 -mr-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation shrink-0"
          aria-label={expanded ? 'Replier' : 'Voir la liste'}
        >
          <ChevronDown className={cn('w-5 h-5 transition-transform', expanded && 'rotate-180')} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Liste expanded ── */}
      {expanded && (
        <ul className="border-t border-gray-100 divide-y divide-gray-100">
          {bookings.map((b) => {
            const isNoShow = b.attendance_status === 'no_show';
            const busy = flipping === b.id;
            return (
              <li key={b.id} className="flex items-center gap-2.5 px-4 py-2.5 min-h-[52px]">
                <span className="text-[12px] font-bold text-slate-700 tabular-nums shrink-0 w-11">
                  {b.start_time?.slice(0, 5) || '—'}
                </span>
                <span className={cn(
                  'text-[13px] flex-1 truncate min-w-0',
                  isNoShow ? 'text-slate-400 line-through' : 'text-slate-700',
                )}>
                  {b.client_name || 'Sans nom'}
                </span>
                {isNoShow ? (
                  <button
                    type="button"
                    onClick={() => flipAttendance(b.id, 'attended')}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-lg text-[12px] font-semibold text-slate-600 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation disabled:opacity-50 shrink-0"
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" strokeWidth={2.5} />}
                    Annuler
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => flipAttendance(b.id, 'no_show')}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-lg text-[12px] font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50 active:bg-rose-100 transition-colors touch-manipulation disabled:opacity-50 shrink-0"
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" strokeWidth={2.25} />}
                    Absente
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* ── Footer CTA principal ── */}
      <div className="border-t border-gray-100 p-3 bg-gray-50/40">
        <button
          type="button"
          onClick={dismiss}
          disabled={dismissing}
          className="w-full inline-flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-sm shadow-emerald-600/20 transition-colors touch-manipulation disabled:opacity-60"
        >
          {dismissing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />}
          Tout bon, journée validée
        </button>
      </div>
    </div>
  );
}
