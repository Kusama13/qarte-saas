'use client';

import { useMemo } from 'react';
import { CalendarDays, Clock, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { PlanningSlot } from '@/types';
import { formatTime, toBCP47 } from '@/lib/utils';
import { getSlotServiceIds, colorBorderStyle } from './utils';
import type { ServiceWithDuration } from './usePlanningState';

interface UpcomingSectionProps {
  slots: PlanningSlot[];
  services: ServiceWithDuration[];
  serviceColorMap: Map<string, string>;
  locale: string;
  onSlotClick: (slot: PlanningSlot) => void;
}

interface DayGroup {
  date: string;
  label: string;
  slots: PlanningSlot[];
}

export default function UpcomingSection({ slots, services, serviceColorMap, locale, onSlotClick }: UpcomingSectionProps) {
  const t = useTranslations('planning');

  // Group booked slots by day (exclude filler slots from multi-slot bookings)
  const dayGroups = useMemo(() => {
    const primarySlots = slots.filter(s => s.client_name && !s.primary_slot_id);
    const groups = new Map<string, PlanningSlot[]>();

    for (const slot of primarySlots) {
      if (!groups.has(slot.slot_date)) groups.set(slot.slot_date, []);
      groups.get(slot.slot_date)!.push(slot);
    }

    // Sort each group by time
    for (const arr of groups.values()) {
      arr.sort((a, b) => a.start_time.localeCompare(b.start_time));
    }

    // Convert to array sorted by date
    const result: DayGroup[] = [];
    const sortedDates = [...groups.keys()].sort();
    const bcp47 = toBCP47(locale);

    for (const date of sortedDates) {
      const d = new Date(date + 'T12:00:00');
      const label = d.toLocaleDateString(bcp47, { weekday: 'long', day: 'numeric', month: 'long' });
      result.push({ date, label, slots: groups.get(date)! });
    }

    return result;
  }, [slots, locale]);

  // Get service names for a slot
  const getServiceNames = (slot: PlanningSlot): string => {
    const svcIds = getSlotServiceIds(slot);
    if (svcIds.length === 0) return '';
    return svcIds
      .map(id => services.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  // Get total duration for a slot
  const getTotalDuration = (slot: PlanningSlot): number | null => {
    const svcIds = getSlotServiceIds(slot);
    if (svcIds.length === 0) return null;
    let total = 0;
    let allKnown = true;
    for (const id of svcIds) {
      const svc = services.find(s => s.id === id);
      if (svc?.duration) total += svc.duration;
      else allKnown = false;
    }
    if (!allKnown && total === 0) return null;
    return total;
  };

  if (dayGroups.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center max-w-md mx-auto">
        <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-700 mb-1">{t('noUpcoming')}</p>
        <p className="text-xs text-gray-400">{t('noUpcomingHint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400 font-medium">{t('upcomingDays')}</p>

      {dayGroups.map(group => (
        <div key={group.date} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Day header */}
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-700 capitalize">{group.label}</p>
          </div>

          {/* Slots */}
          <div className="divide-y divide-gray-50">
            {group.slots.map(slot => {
              const serviceNames = getServiceNames(slot);
              const duration = getTotalDuration(slot);
              const svcIds = getSlotServiceIds(slot);
              const slotColor = serviceColorMap.get(svcIds[0]);

              return (
                <button
                  key={slot.id}
                  onClick={() => onSlotClick(slot)}
                  className="w-full text-left px-4 py-3 hover:bg-indigo-50/50 transition-colors flex items-center justify-between group"
                  style={colorBorderStyle(slotColor)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-indigo-600">{formatTime(slot.start_time, locale)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{slot.client_name}</p>
                      {serviceNames && (
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">{serviceNames}</p>
                      )}
                      {duration !== null && duration > 0 && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-300">
                          <Clock className="w-3 h-3" />
                          <span>{duration}min</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
