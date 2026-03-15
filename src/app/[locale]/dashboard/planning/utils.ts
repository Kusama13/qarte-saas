import { formatTime } from '@/lib/utils';

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
  return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function fmtTime(t: string, locale: string = 'fr'): string {
  return formatTime(t, locale);
}

export const QUICK_TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
