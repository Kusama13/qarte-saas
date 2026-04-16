import type { CSSProperties } from 'react';
import { toBCP47 } from '@/lib/utils';

export function getWeekStart(offset: number): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateFr(d: Date, locale: string = 'fr'): string {
  return d.toLocaleDateString(toBCP47(locale), { weekday: 'short', day: 'numeric', month: 'short' });
}

export const QUICK_TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];

/** Extract service IDs from a slot (junction table first, fallback to deprecated service_id) */
export function getSlotServiceIds(slot: { planning_slot_services?: { service_id: string }[]; service_id?: string | null }): string[] {
  return slot.planning_slot_services?.map(s => s.service_id) || (slot.service_id ? [slot.service_id] : []);
}

/** Parse "HH:MM" → minutes since midnight */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Minutes since midnight → "HH:MM" */
export function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** Round up to next 5min */
export function roundUp5(m: number): number {
  return Math.ceil(m / 5) * 5;
}

/** "HH:MM" start + duration → "HH:MM" end */
export function endTimeFromStart(start: string, durationMinutes: number): string {
  return minutesToTime(timeToMinutes(start) + durationMinutes);
}

/** "lundi 6 janvier" — long weekday + day + long month */
export function formatDateLong(d: Date, locale: string = 'fr'): string {
  return d.toLocaleDateString(toBCP47(locale), { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Format minutes as "Xh Ymin" */
export function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}min`);
  return parts.join('') || '0min';
}

/** Fixed palette for service colors — vivid Booksy-style (saturated 500-600 range) */
export const SERVICE_COLORS = [
  '#4f46e5', // indigo-600 (deep)
  '#db2777', // pink-600
  '#d97706', // amber-600
  '#059669', // emerald-600
  '#7c3aed', // violet-600
  '#dc2626', // red-600
  '#0891b2', // cyan-600
  '#ea580c', // orange-600
  '#65a30d', // lime-600
  '#9333ea', // purple-600
];

/** Build a map of service ID → color based on service position */
export function getServiceColorMap(services: { id: string }[]): Map<string, string> {
  const map = new Map<string, string>();
  services.forEach((s, i) => map.set(s.id, SERVICE_COLORS[i % SERVICE_COLORS.length]));
  return map;
}

/** Inline style for a colored left border (3px) */
export function colorBorderStyle(color?: string): CSSProperties | undefined {
  return color ? { borderLeftWidth: '3px', borderLeftColor: color } : undefined;
}

/** Compute deposit amount from fixed or percentage (capped at total price) */
export function computeDepositAmount(totalPrice: number, depositFixed?: number | null, depositPercent?: number | null): number | null {
  if (depositFixed) return Math.min(depositFixed, totalPrice);
  if (depositPercent) return Math.min(Math.round(totalPrice * depositPercent / 100), totalPrice);
  return null;
}

/** Get the dominant color for a slot (first service's color) */
export function getSlotColor(
  slot: { planning_slot_services?: { service_id: string }[]; service_id?: string | null },
  colorMap: Map<string, string>,
): string | undefined {
  const ids = getSlotServiceIds(slot);
  return ids.length > 0 ? colorMap.get(ids[0]) : undefined;
}
