'use client';

import { useMemo } from 'react';
import { Plus, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { PlanningSlot } from '@/types';
import { formatTime } from '@/lib/utils';
import { formatDate, timeToMinutes, minutesToTime } from './utils';
import type { ServiceWithDuration } from './usePlanningState';
import {
  HOUR_HEIGHT, START_HOUR, END_HOUR, HOURS, TOTAL_HEIGHT, QUARTERS,
  STRIPED_BG, STRIPED_PILL_CLASS,
  computeOverlays, computeSlotCards,
  type DayOpeningHours,
} from './timelineShared';

interface DayViewProps {
  day: Date;
  daySlots: PlanningSlot[];
  services: ServiceWithDuration[];
  serviceColorMap: Map<string, string>;
  locale: string;
  isPast: boolean;
  isToday: boolean;
  isFreeMod?: boolean;
  openingHours?: Record<string, DayOpeningHours> | null;
  onSlotClick: (slot: PlanningSlot) => void;
  onBlockedSlotClick?: (slotId: string) => void;
  onAddSlots: (day: string) => void;
}

export default function DayView({
  day,
  daySlots,
  services,
  serviceColorMap,
  locale,
  isPast,
  isToday,
  isFreeMod = false,
  openingHours,
  onSlotClick,
  onBlockedSlotClick,
  onAddSlots,
}: DayViewProps) {
  const t = useTranslations('planning');

  const serviceMap = useMemo(() => {
    const map = new Map<string, ServiceWithDuration>();
    for (const s of services) map.set(s.id, s);
    return map;
  }, [services]);

  const overlays = useMemo(
    () => computeOverlays(day, openingHours, isFreeMod, { closed: t('closed'), break: t('break') }),
    // t is not referentially stable in next-intl; intentionally omitted from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openingHours, day, isFreeMod, locale]
  );

  const slotCards = useMemo(
    () => computeSlotCards(daySlots, serviceMap, serviceColorMap),
    [daySlots, serviceMap, serviceColorMap]
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Day header */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${isToday ? 'bg-indigo-50/50 border-indigo-100' : 'bg-gray-50 border-gray-100'}`}>
        <p className={`text-sm font-bold capitalize ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>
          {day.toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        {!isPast && !isFreeMod && (
          <button
            onClick={() => onAddSlots(formatDate(day))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('addSlotsTitle')}
          </button>
        )}
      </div>

      {/* Timeline — pt-3 leaves room for the first hour label (8:00) */}
      <div className="relative overflow-x-hidden pt-3 pb-2" style={{ height: TOTAL_HEIGHT + 20 }}>
        {/* Closed/break overlays — m\u00eame style que les slots bloqu\u00e9s (hachures + pill blanc au-dessus) */}
        {overlays.map((ov, idx) => (
          <div
            key={`overlay-${idx}`}
            className="absolute left-12 right-0 pointer-events-none"
            style={{ top: ov.top + 12, height: ov.height }}
          >
            <div className="absolute inset-0 rounded-sm" style={{ background: STRIPED_BG }} />
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <span className={STRIPED_PILL_CLASS}>
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">{ov.label}</span>
              </span>
            </div>
          </div>
        ))}

        {/* Hour grid lines + quarter-hour labels (Booksy-style) */}
        {HOURS.map(hour => (
          <div key={hour}>
            {/* Hour line + label */}
            <div
              className="absolute left-0 right-0 border-t border-gray-200"
              style={{ top: (hour - START_HOUR) * HOUR_HEIGHT + 12 }}
            >
              <span className="absolute left-2 -top-2 text-[10px] text-gray-500 font-bold bg-white px-1 z-10">
                {String(hour).padStart(2, '0')}:00
              </span>
            </div>
            {/* Quarter labels (15/30/45) — small text labels in the time gutter */}
            {hour < END_HOUR && QUARTERS.map(min => (
              <span
                key={min}
                className="absolute left-2 text-[9px] text-gray-300 font-medium bg-white px-1 -translate-y-1/2 z-10"
                style={{ top: (hour - START_HOUR) * HOUR_HEIGHT + (min / 60) * HOUR_HEIGHT + 12 }}
              >
                {min}
              </span>
            ))}
          </div>
        ))}

        {/* Slot cards — Booksy-style bands : couleurs vives, fond satur\u00e9, texte blanc lisible */}
        {slotCards.map(({ slot, top, height, color, serviceNames, durationMins }) => {
          const isBlocked = slot.client_name === '__blocked__';

          // Blocked slots → diagonal stripes overlay (coh\u00e9rent avec FERM\u00c9/PAUSE)
          if (isBlocked) {
            return (
              <button
                key={slot.id}
                onClick={() => onBlockedSlotClick?.(slot.id)}
                className={`absolute left-12 right-0 rounded-md text-left transition-all hover:brightness-95 active:scale-[0.99] overflow-hidden border border-dashed border-gray-400 ${isPast ? 'opacity-50' : ''}`}
                style={{ top, height: Math.max(height, 28), background: STRIPED_BG }}
              >
                <div className="absolute inset-0 flex items-center justify-center gap-1.5 px-2 z-10">
                  <span className={STRIPED_PILL_CLASS}>
                    <Lock className="w-2.5 h-2.5 text-gray-500" />
                    <span className="text-[10px] font-bold text-gray-600 tabular-nums">{formatTime(slot.start_time, locale)}</span>
                    {slot.notes && <span className="text-[10px] text-gray-500 truncate max-w-[120px]">· {slot.notes}</span>}
                  </span>
                </div>
              </button>
            );
          }

          // Booked / available slots — vivid colored band (Booksy-style)
          // Use the service color directly (saturated) for booked slots; emerald for available empty slots.
          const accent = color || (slot.client_name ? '#6366f1' : '#10b981');
          const bgVivid = slot.client_name
            ? `${accent}E6` // 90% opacity → punchy color
            : '#ecfdf5'; // light emerald for empty slots
          const textColor = slot.client_name ? '#ffffff' : '#065f46';
          const subTextColor = slot.client_name ? 'rgba(255,255,255,0.85)' : '#10b981';

          const endTime = minutesToTime(timeToMinutes(slot.start_time) + durationMins);
          return (
            <button
              key={slot.id}
              onClick={() => onSlotClick(slot)}
              className={`absolute left-12 right-0 rounded-md px-3 py-1.5 text-left transition-all hover:brightness-110 active:scale-[0.99] overflow-hidden ${isPast ? 'opacity-50' : ''}`}
              style={{
                top,
                height: Math.max(height, 28),
                backgroundColor: bgVivid,
                borderLeft: `4px solid ${accent}`,
                color: textColor,
              }}
            >
              <div className="text-xs font-bold tabular-nums leading-tight" style={{ color: textColor }}>
                {formatTime(slot.start_time, locale)} — {formatTime(endTime, locale)}
              </div>
              {serviceNames && height >= 40 && (
                <p className="text-sm font-bold leading-tight mt-0.5 line-clamp-2" style={{ color: textColor }}>
                  {serviceNames}
                </p>
              )}
              {slot.client_name && height >= 64 && (
                <p className="text-[11px] font-medium truncate leading-tight mt-0.5 opacity-90" style={{ color: textColor }}>
                  {slot.client_name}
                </p>
              )}
            </button>
          );
        })}

        {/* Empty state — only in slot mode (en mode libre la timeline est self-service) */}
        {daySlots.length === 0 && !isFreeMod && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <p className="text-xs text-gray-400">{t('noSlots')}</p>
            {!isPast && (
              <button
                onClick={() => onAddSlots(formatDate(day))}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('addSlotsTitle')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
