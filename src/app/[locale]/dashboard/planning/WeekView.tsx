'use client';

import { useMemo } from 'react';
import { Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { PlanningSlot } from '@/types';
import { formatTime, toBCP47 } from '@/lib/utils';
import { formatDate, timeToMinutes, minutesToTime } from './utils';
import type { ServiceWithDuration } from './usePlanningState';
import {
  HOUR_HEIGHT, START_HOUR, END_HOUR, HOURS, TOTAL_HEIGHT, QUARTERS,
  STRIPED_BG, STRIPED_PILL_CLASS,
  computeOverlays, computeSlotCards,
  type DayOpeningHours,
} from './timelineShared';

interface WeekViewProps {
  weekDays: Date[];
  slotsByDate: Map<string, PlanningSlot[]>;
  services: ServiceWithDuration[];
  serviceColorMap: Map<string, string>;
  locale: string;
  selectedDay: Date;
  isFreeMod?: boolean;
  openingHours?: Record<string, DayOpeningHours> | null;
  onSlotClick: (slot: PlanningSlot) => void;
  onBlockedSlotClick?: (slotId: string) => void;
  onDayClick: (day: Date) => void;
  isToday: (d: Date) => boolean;
  isPast: (d: Date) => boolean;
}

export default function WeekView({
  weekDays, slotsByDate, services, serviceColorMap, locale,
  selectedDay, isFreeMod = false, openingHours,
  onSlotClick, onBlockedSlotClick, onDayClick, isToday, isPast,
}: WeekViewProps) {
  const t = useTranslations('planning');
  const selectedStr = formatDate(selectedDay);

  const serviceMap = useMemo(() => {
    const map = new Map<string, ServiceWithDuration>();
    for (const s of services) map.set(s.id, s);
    return map;
  }, [services]);

  // Pre-compute per-day data once (14 compute calls per render → 1 memo)
  const columnData = useMemo(() => {
    const labels = { closed: t('closed'), break: t('break') };
    return weekDays.map(day => {
      const dayStr = formatDate(day);
      const daySlots = (slotsByDate.get(dayStr) || []).filter(s => !s.primary_slot_id);
      return {
        day,
        dayStr,
        past: isPast(day),
        overlays: computeOverlays(day, openingHours, isFreeMod, labels),
        slotCards: computeSlotCards(daySlots, serviceMap, serviceColorMap),
      };
    });
  // t not stable in next-intl; intentionally omitted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDays, slotsByDate, serviceMap, serviceColorMap, openingHours, isFreeMod, isPast, locale]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header row : mini day headers (spans aligned with the grid) */}
      <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: '48px repeat(7, minmax(0, 1fr))' }}>
        <div className="bg-gray-50" />
        {weekDays.map(day => {
          const dayStr = formatDate(day);
          const past = isPast(day);
          const today = isToday(day);
          const selected = dayStr === selectedStr;
          return (
            <button
              key={dayStr}
              onClick={() => onDayClick(day)}
              className={`px-2 py-2 text-center transition-colors border-l border-gray-100 first:border-l-0 ${
                selected
                  ? 'bg-indigo-600 text-white'
                  : today
                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    : past
                      ? 'bg-gray-50 text-gray-400'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <p className={`text-[9px] font-semibold uppercase tracking-wide leading-none ${selected ? 'text-white/80' : ''}`}>
                {day.toLocaleDateString(toBCP47(locale), { weekday: 'short' }).replace('.', '')}
              </p>
              <p className={`text-sm font-bold tabular-nums leading-none mt-1 ${past && !selected ? 'text-gray-300' : ''}`}>
                {day.getDate()}
              </p>
            </button>
          );
        })}
      </div>

      {/* Timeline grid : 1 hour gutter + 7 day columns */}
      <div
        className="relative pt-3 pb-2 overflow-x-hidden"
        style={{ height: TOTAL_HEIGHT + 20, display: 'grid', gridTemplateColumns: '48px repeat(7, minmax(0, 1fr))' }}
      >
        {/* Hour gutter (shared) */}
        <div className="relative">
          {HOURS.map(hour => (
            <div key={hour}>
              <span
                className="absolute left-2 text-[10px] text-gray-500 font-bold bg-white px-1 z-10"
                style={{ top: (hour - START_HOUR) * HOUR_HEIGHT - 6 }}
              >
                {String(hour).padStart(2, '0')}:00
              </span>
              {hour < END_HOUR && QUARTERS.map(min => (
                <span
                  key={min}
                  className="absolute left-2 text-[9px] text-gray-300 font-medium bg-white px-1 -translate-y-1/2 z-10"
                  style={{ top: (hour - START_HOUR) * HOUR_HEIGHT + (min / 60) * HOUR_HEIGHT }}
                >
                  {min}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* 7 day columns */}
        {columnData.map(({ dayStr, past, overlays, slotCards }) => {
          return (
            <div
              key={dayStr}
              className={`relative border-l border-gray-100 ${past ? 'opacity-50' : ''}`}
              style={{ minHeight: TOTAL_HEIGHT + 20 }}
            >
              {/* Hour grid lines (per column, no labels) */}
              {HOURS.map(hour => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-t border-gray-100"
                  style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                />
              ))}

              {/* Overlays (FERMÉ / PAUSE) */}
              {overlays.map((ov, idx) => (
                <div
                  key={`overlay-${idx}`}
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{ top: ov.top, height: ov.height }}
                >
                  <div className="absolute inset-0" style={{ background: STRIPED_BG }} />
                  <div className="absolute inset-0 flex items-center justify-center z-10 px-1">
                    <span className={STRIPED_PILL_CLASS}>
                      <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">{ov.label}</span>
                    </span>
                  </div>
                </div>
              ))}

              {/* Slot cards */}
              {slotCards.map(({ slot, top, height, color, serviceNames, durationMins }) => {
                const isBlocked = slot.client_name === '__blocked__';
                const topInCol = top - 12; // undo the +12 offset (column has no pt-3)
                if (isBlocked) {
                  return (
                    <button
                      key={slot.id}
                      onClick={() => onBlockedSlotClick?.(slot.id)}
                      className="absolute left-0.5 right-0.5 rounded-md text-left transition-all hover:brightness-95 active:scale-[0.99] overflow-hidden border border-dashed border-gray-400"
                      style={{ top: topInCol, height: Math.max(height, 20), background: STRIPED_BG }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <Lock className="w-3 h-3 text-gray-500" />
                      </div>
                    </button>
                  );
                }
                const accent = color || (slot.client_name ? '#6366f1' : '#10b981');
                const bgVivid = slot.client_name ? `${accent}E6` : '#ecfdf5';
                const textColor = slot.client_name ? '#ffffff' : '#065f46';
                const endTime = minutesToTime(timeToMinutes(slot.start_time) + durationMins);
                return (
                  <button
                    key={slot.id}
                    onClick={() => onSlotClick(slot)}
                    className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 text-left transition-all hover:brightness-110 active:scale-[0.99] overflow-hidden"
                    style={{
                      top: topInCol,
                      height: Math.max(height, 20),
                      backgroundColor: bgVivid,
                      borderLeft: `3px solid ${accent}`,
                      color: textColor,
                    }}
                  >
                    <div className="text-[9px] font-bold tabular-nums leading-tight truncate" style={{ color: textColor }}>
                      {formatTime(slot.start_time, locale)}–{formatTime(endTime, locale)}
                    </div>
                    {serviceNames && height >= 32 && (
                      <p className="text-[10px] font-bold leading-tight mt-0.5 line-clamp-2" style={{ color: textColor }}>
                        {serviceNames}
                      </p>
                    )}
                    {slot.client_name && height >= 56 && (
                      <p className="text-[9px] font-medium truncate leading-tight mt-0.5 opacity-90" style={{ color: textColor }}>
                        {slot.client_name}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
