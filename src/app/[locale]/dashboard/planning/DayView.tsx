'use client';

import { useMemo } from 'react';
import { Plus, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { PlanningSlot } from '@/types';
import { formatTime } from '@/lib/utils';
import { formatDate, formatDateFr, getSlotServiceIds, timeToMinutes, getSlotColor } from './utils';
import type { ServiceWithDuration } from './usePlanningState';

interface DayViewProps {
  day: Date;
  daySlots: PlanningSlot[];
  services: ServiceWithDuration[];
  serviceColorMap: Map<string, string>;
  locale: string;
  isPast: boolean;
  isToday: boolean;
  onSlotClick: (slot: PlanningSlot) => void;
  onAddSlots: (day: string) => void;
}

const HOUR_HEIGHT = 64; // px per hour
const START_HOUR = 8;
const END_HOUR = 21;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
const TOTAL_HEIGHT = (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT;

export default function DayView({
  day,
  daySlots,
  services,
  serviceColorMap,
  locale,
  isPast,
  isToday,
  onSlotClick,
  onAddSlots,
}: DayViewProps) {
  const t = useTranslations('planning');

  const serviceMap = useMemo(() => {
    const map = new Map<string, ServiceWithDuration>();
    for (const s of services) map.set(s.id, s);
    return map;
  }, [services]);

  // Compute slot positions and heights
  const slotCards = useMemo(() => {
    return daySlots.map(slot => {
      const mins = timeToMinutes(slot.start_time);
      const top = ((mins / 60) - START_HOUR) * HOUR_HEIGHT;

      // Compute duration from services
      const svcIds = getSlotServiceIds(slot);
      let durationMins = 30; // default
      if (svcIds.length > 0) {
        let total = 0;
        let hasAny = false;
        for (const sid of svcIds) {
          const svc = serviceMap.get(sid);
          if (svc?.duration) { total += svc.duration; hasAny = true; }
        }
        if (hasAny) durationMins = total;
      }

      const height = Math.max((durationMins / 60) * HOUR_HEIGHT, 28);
      const color = getSlotColor(slot, serviceColorMap);
      const serviceNames = svcIds.map(id => serviceMap.get(id)?.name).filter(Boolean).join(', ');

      return { slot, top, height, color, serviceNames, durationMins };
    });
  }, [daySlots, serviceMap, serviceColorMap]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Day header */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${isToday ? 'bg-indigo-50/50 border-indigo-100' : 'bg-gray-50 border-gray-100'}`}>
        <p className={`text-sm font-bold capitalize ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>
          {day.toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        {!isPast && (
          <button
            onClick={() => onAddSlots(formatDate(day))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('addSlotsTitle')}
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="relative overflow-x-hidden" style={{ height: TOTAL_HEIGHT }}>
        {/* Hour grid lines */}
        {HOURS.map(hour => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-t border-gray-100"
            style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
          >
            <span className="absolute left-2 -top-2.5 text-[10px] text-gray-300 font-medium bg-white px-1">
              {String(hour).padStart(2, '0')}:00
            </span>
          </div>
        ))}

        {/* Slot cards */}
        {slotCards.map(({ slot, top, height, color, serviceNames, durationMins }) => (
          <button
            key={slot.id}
            onClick={() => onSlotClick(slot)}
            className={`absolute left-14 right-3 rounded-xl border px-3 py-1.5 text-left transition-all hover:shadow-md active:scale-[0.99] overflow-hidden ${
              isPast ? 'opacity-50' : ''
            }`}
            style={{
              top,
              height: Math.max(height, 28),
              backgroundColor: color ? `${color}10` : slot.client_name ? '#eef2ff' : '#ecfdf5',
              borderColor: color || (slot.client_name ? '#c7d2fe' : '#a7f3d0'),
              borderLeftWidth: color ? '3px' : '1px',
              borderLeftColor: color || undefined,
            }}
          >
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${slot.client_name ? 'text-gray-800' : 'text-emerald-700'}`}>
                {formatTime(slot.start_time, locale)}
              </span>
              {slot.client_name && (
                <span className="text-xs font-medium text-gray-600 truncate">{slot.client_name}</span>
              )}
            </div>
            {serviceNames && height >= 40 && (
              <p className="text-[10px] text-gray-400 truncate mt-0.5">{serviceNames}</p>
            )}
            {durationMins > 0 && height >= 52 && (
              <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-300">
                <Clock className="w-2.5 h-2.5" />
                <span>{durationMins}min</span>
              </div>
            )}
          </button>
        ))}

        {/* Empty state */}
        {daySlots.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-gray-300">{t('noSlots')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
