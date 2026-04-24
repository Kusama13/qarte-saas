'use client';

import { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import type { QuickActionSlot } from '@/app/api/dashboard/quick-actions/route';

type AttendanceStatus = 'attended' | 'no_show';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  merchantId: string;
  slots: QuickActionSlot[];
  onMarked?: (slotId: string, status: AttendanceStatus) => void;
}

function formatSlotLabel(slot: QuickActionSlot): string {
  const [y, m, d] = slot.slot_date.split('-');
  const hm = slot.start_time.slice(0, 5);
  return `${d}/${m}/${y.slice(2)} · ${hm}`;
}

export function MarkAttendanceModal({ isOpen, onClose, merchantId, slots, onMarked }: Props) {
  const [savingId, setSavingId] = useState<string | null>(null);

  const markSlot = async (slotId: string, status: AttendanceStatus) => {
    if (savingId) return;
    setSavingId(slotId);
    try {
      const res = await fetch('/api/planning/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id: slotId, merchant_id: merchantId, attendance_status: status }),
      });
      if (res.ok) onMarked?.(slotId, status);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Marque leur présence" size="md">
      {slots.length === 0 ? (
        <p className="text-sm text-slate-600 text-center py-6">Parfait, tu es à jour.</p>
      ) : (
        <ul className="divide-y divide-slate-100 -mx-2">
          {slots.map((slot) => {
            const saving = savingId === slot.id;
            return (
              <li key={slot.id} className="flex items-center gap-3 px-2 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {slot.client_name || 'Cliente'}
                  </p>
                  <p className="text-[11px] text-slate-500 tabular-nums">{formatSlotLabel(slot)}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => markSlot(slot.id, 'attended')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-semibold hover:bg-emerald-100 active:scale-95 transition-transform touch-manipulation disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" strokeWidth={3} />}
                    Venue
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => markSlot(slot.id, 'no_show')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-[11px] font-semibold hover:bg-rose-100 active:scale-95 transition-transform touch-manipulation disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" strokeWidth={3} />}
                    Absente
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
