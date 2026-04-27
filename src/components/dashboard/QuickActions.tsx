'use client';

import { useCallback, useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import {
  CalendarCheck,
  Crown,
  Flower2,
  UserPlus,
  Share2,
  Cake,
  Target,
  UserX,
  ShieldAlert,
  Gift,
  Star,
  Hourglass,
  Sunrise,
} from 'lucide-react';
import { safeFetchJson } from '@/lib/fetch';
import { MarkAttendanceModal } from './MarkAttendanceModal';
import type { QuickAction, QuickActionSlot } from '@/app/api/dashboard/quick-actions/route';

interface Props {
  merchantId: string;
}

const ICONS = {
  calendar: CalendarCheck,
  crown: Crown,
  flower: Flower2,
  userPlus: UserPlus,
  share: Share2,
  cake: Cake,
  target: Target,
  userX: UserX,
  shield: ShieldAlert,
  gift: Gift,
  star: Star,
  hourglass: Hourglass,
  sunrise: Sunrise,
} as const;

const ACCENT_STYLES: Record<QuickAction['accent'], { icon: string; bg: string }> = {
  indigo: { icon: 'text-indigo-500', bg: 'bg-indigo-50' },
  amber: { icon: 'text-amber-500', bg: 'bg-amber-50' },
  rose: { icon: 'text-rose-500', bg: 'bg-rose-50' },
  emerald: { icon: 'text-emerald-500', bg: 'bg-emerald-50' },
  violet: { icon: 'text-violet-500', bg: 'bg-violet-50' },
};

export default function QuickActions({ merchantId }: Props) {
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [attendanceSlots, setAttendanceSlots] = useState<QuickActionSlot[]>([]);
  const [attendanceOpen, setAttendanceOpen] = useState(false);

  const load = useCallback(async () => {
    const data = await safeFetchJson<{ actions: QuickAction[] }>(
      `/api/dashboard/quick-actions?merchantId=${merchantId}`,
    );
    setActions(data?.actions ?? []);
    setLoaded(true);
  }, [merchantId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkedAttendance = (slotId: string) => {
    // Remove the slot from local state; if list drops below threshold, drop the action
    setAttendanceSlots((prev) => prev.filter((s) => s.id !== slotId));
    setActions((prev) =>
      prev
        .map((a) => {
          if (a.id !== 'mark_attendance') return a;
          const slots = (a.meta?.slots ?? []).filter((s) => s.id !== slotId);
          return { ...a, meta: { slots }, title: `Marque la présence de tes ${slots.length} RDV récents` };
        })
        .filter((a) => a.id !== 'mark_attendance' || (a.meta?.slots?.length ?? 0) >= 2),
    );
  };

  if (!loaded || actions.length === 0) return null;

  return (
    <>
      <div>
        <p className="px-1 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Booste ton chiffre d&apos;affaires
        </p>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {actions.map((action) => {
              const Icon = ICONS[action.icon];
              const styles = ACCENT_STYLES[action.accent];

              // No line-clamp: actions are calls to action — the merchant must read them in full.
              const content = (
                <div className="flex items-start gap-2.5 px-3.5 py-2.5">
                  <div className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${styles.bg} mt-px`}>
                    <Icon className={`w-3.5 h-3.5 ${styles.icon}`} strokeWidth={2.4} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 leading-snug">{action.title}</p>
                    {action.subtitle && (
                      <p className="mt-0.5 text-[10.5px] text-slate-500 leading-snug">{action.subtitle}</p>
                    )}
                  </div>
                </div>
              );

              if (action.id === 'mark_attendance') {
                return (
                  <li key={action.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setAttendanceSlots(action.meta?.slots ?? []);
                        setAttendanceOpen(true);
                      }}
                      className="w-full text-left hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation"
                    >
                      {content}
                    </button>
                  </li>
                );
              }

              if (action.href) {
                return (
                  <li key={action.id}>
                    <Link
                      href={action.href}
                      className="block hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation"
                    >
                      {content}
                    </Link>
                  </li>
                );
              }

              return <li key={action.id}>{content}</li>;
            })}
          </ul>
        </div>
      </div>

      <MarkAttendanceModal
        isOpen={attendanceOpen}
        onClose={() => setAttendanceOpen(false)}
        merchantId={merchantId}
        slots={attendanceSlots}
        onMarked={handleMarkedAttendance}
      />
    </>
  );
}
