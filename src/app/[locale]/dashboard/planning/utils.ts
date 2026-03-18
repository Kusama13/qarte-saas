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

export const QUICK_TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

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

/** Format minutes as "Xh Ymin" */
export function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}min`);
  return parts.join('') || '0min';
}

/** Fixed palette for service colors (10 distinct colors) */
export const SERVICE_COLORS = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#a855f7', // purple
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

/** Get the dominant color for a slot (first service's color) */
export function getSlotColor(
  slot: { planning_slot_services?: { service_id: string }[]; service_id?: string | null },
  colorMap: Map<string, string>,
): string | undefined {
  const ids = getSlotServiceIds(slot);
  return ids.length > 0 ? colorMap.get(ids[0]) : undefined;
}
