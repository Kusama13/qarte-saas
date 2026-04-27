import type { PlanningSlot } from '@/types';
import { getSlotServiceIds, timeToMinutes, getSlotColor } from './utils';
import { customServiceDisplayName } from '@/lib/utils';
import type { ServiceWithDuration } from './usePlanningState';

export type DayOpeningHours = { open: string; close: string; break_start?: string; break_end?: string } | null;

export const HOUR_HEIGHT = 64; // px per hour
export const START_HOUR = 8;
export const END_HOUR = 21;
export const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
export const TOTAL_HEIGHT = (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT;
export const QUARTERS = [15, 30, 45];

export const STRIPED_BG = 'repeating-linear-gradient(135deg, #f3f4f6, #f3f4f6 6px, #d1d5db 6px, #d1d5db 7px)';
export const STRIPED_PILL_CLASS = 'inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-full shadow-sm border border-gray-200';

// merchant.opening_hours uses ISO weekday keys ('1' = Monday … '7' = Sunday).
// JS Date.getDay() returns 0 (Sunday) … 6 (Saturday) → convert with this map.
export const ISO_WEEKDAY_KEYS = ['7', '1', '2', '3', '4', '5', '6'];

export interface TimelineOverlay {
  type: 'closed' | 'break';
  top: number;
  height: number;
  label: string;
}

/** Compute FERMÉ / PAUSE bands for a given day (mode libre only). */
export function computeOverlays(
  day: Date,
  openingHours: Record<string, DayOpeningHours> | null | undefined,
  isFreeMod: boolean,
  labels: { closed: string; break: string }
): TimelineOverlay[] {
  if (!isFreeMod || !openingHours) return [];
  const hasAnyValue = Object.values(openingHours).some(v => v != null);
  if (!hasAnyValue) return [];

  const dayKey = ISO_WEEKDAY_KEYS[day.getDay()];
  const hours = openingHours[dayKey];
  const minutesToTop = (m: number) => ((m / 60) - START_HOUR) * HOUR_HEIGHT;
  const result: TimelineOverlay[] = [];

  if (hours === undefined || hours === null) {
    result.push({ type: 'closed', top: 0, height: TOTAL_HEIGHT, label: labels.closed });
    return result;
  }
  if (!hours.open || !hours.close) return [];

  const openMin = timeToMinutes(hours.open);
  const closeMin = timeToMinutes(hours.close);
  const startMin = START_HOUR * 60;
  const endMin = (END_HOUR + 1) * 60;

  if (openMin > startMin) {
    result.push({ type: 'closed', top: 0, height: minutesToTop(openMin), label: labels.closed });
  }
  if (closeMin < endMin) {
    const top = minutesToTop(closeMin);
    const height = TOTAL_HEIGHT - top;
    if (height > 0) result.push({ type: 'closed', top, height, label: labels.closed });
  }
  if (hours.break_start && hours.break_end) {
    const breakStart = timeToMinutes(hours.break_start);
    const breakEnd = timeToMinutes(hours.break_end);
    if (breakEnd > breakStart && breakStart >= openMin && breakEnd <= closeMin) {
      result.push({
        type: 'break',
        top: minutesToTop(breakStart),
        height: ((breakEnd - breakStart) / 60) * HOUR_HEIGHT,
        label: labels.break,
      });
    }
  }
  return result;
}

export interface SlotCard {
  slot: PlanningSlot;
  top: number;
  height: number;
  color?: string;
  serviceNames: string;
  durationMins: number;
}

/** Compute slot card positions + metadata (filler slots already filtered upstream). */
export function computeSlotCards(
  daySlots: PlanningSlot[],
  serviceMap: Map<string, ServiceWithDuration>,
  serviceColorMap: Map<string, string>
): SlotCard[] {
  return daySlots.map(slot => {
    const mins = timeToMinutes(slot.start_time);
    const top = ((mins / 60) - START_HOUR) * HOUR_HEIGHT + 12;
    const svcIds = getSlotServiceIds(slot);
    let durationMins = 30;
    if (slot.total_duration_minutes && slot.total_duration_minutes > 0) {
      durationMins = slot.total_duration_minutes;
    } else if (svcIds.length > 0 || slot.custom_service_duration) {
      let total = 0;
      let hasAny = false;
      for (const sid of svcIds) {
        const svc = serviceMap.get(sid);
        if (svc?.duration) { total += svc.duration; hasAny = true; }
      }
      if (slot.custom_service_duration) { total += slot.custom_service_duration; hasAny = true; }
      if (hasAny) durationMins = total;
    }
    const height = Math.max((durationMins / 60) * HOUR_HEIGHT, 28);
    const color = getSlotColor(slot, serviceColorMap);
    const catalogNames = svcIds.map(id => serviceMap.get(id)?.name).filter(Boolean) as string[];
    if (slot.custom_service_duration) catalogNames.push(customServiceDisplayName(slot));
    const serviceNames = catalogNames.join(', ');
    return { slot, top, height, color, serviceNames, durationMins };
  });
}
