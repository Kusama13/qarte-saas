// SMS marketing compliance: legal sending hours for FR/BE/CH
// FR loi démarchage: 10h-20h lun-sam, interdit dim + jours fériés

import { getTimezoneForCountry } from '@/lib/utils';

export const JOURS_FERIES_FR: string[] = [
  // 2026
  '2026-01-01', '2026-04-06', '2026-05-01', '2026-05-08', '2026-05-14',
  '2026-05-25', '2026-07-14', '2026-08-15', '2026-11-01', '2026-11-11', '2026-12-25',
  // 2027
  '2027-01-01', '2027-03-29', '2027-05-01', '2027-05-06', '2027-05-08',
  '2027-05-17', '2027-07-14', '2027-08-15', '2027-11-01', '2027-11-11', '2027-12-25',
];

export const JOURS_FERIES_BE: string[] = [
  '2026-01-01', '2026-04-06', '2026-05-01', '2026-05-14', '2026-05-25',
  '2026-07-21', '2026-08-15', '2026-11-01', '2026-11-11', '2026-12-25',
  '2027-01-01', '2027-03-29', '2027-05-01', '2027-05-06', '2027-05-17',
  '2027-07-21', '2027-08-15', '2027-11-01', '2027-11-11', '2027-12-25',
];

export const JOURS_FERIES_CH: string[] = [
  '2026-01-01', '2026-04-03', '2026-04-06', '2026-05-01', '2026-05-14',
  '2026-05-25', '2026-08-01', '2026-12-25', '2026-12-26',
  '2027-01-01', '2027-03-26', '2027-03-29', '2027-05-01', '2027-05-06',
  '2027-05-17', '2027-08-01', '2027-12-25', '2027-12-26',
];

const HOLIDAYS_BY_COUNTRY: Record<string, string[]> = {
  FR: JOURS_FERIES_FR,
  BE: JOURS_FERIES_BE,
  CH: JOURS_FERIES_CH,
};

const LEGAL_HOUR_START = 10;
const LEGAL_HOUR_END = 20;

interface ComplianceResult {
  ok: boolean;
  reason?: 'before_legal_hour' | 'after_legal_hour' | 'sunday' | 'holiday';
  localISO?: string;
}

function toLocalParts(date: Date, country: string): { hour: number; weekday: number; ymd: string } {
  const tz = getTimezoneForCountry(country || 'FR');
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  const hour = parseInt(get('hour'), 10);
  const ymd = `${get('year')}-${get('month')}-${get('day')}`;
  const weekdayShort = get('weekday');
  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const weekday = weekdayMap[weekdayShort] ?? 1;
  return { hour, weekday, ymd };
}

export function isLegalSendTime(date: Date, country: string): ComplianceResult {
  const { hour, weekday, ymd } = toLocalParts(date, country);
  const holidays = HOLIDAYS_BY_COUNTRY[country] || JOURS_FERIES_FR;

  if (weekday === 0) return { ok: false, reason: 'sunday', localISO: ymd };
  if (holidays.includes(ymd)) return { ok: false, reason: 'holiday', localISO: ymd };
  if (hour < LEGAL_HOUR_START) return { ok: false, reason: 'before_legal_hour', localISO: ymd };
  if (hour >= LEGAL_HOUR_END) return { ok: false, reason: 'after_legal_hour', localISO: ymd };

  return { ok: true, localISO: ymd };
}

// Returns the next allowed send time (>= `from`), walking forward in the merchant's timezone.
export function nextLegalSlot(from: Date, country: string): Date {
  const holidays = HOLIDAYS_BY_COUNTRY[country] || JOURS_FERIES_FR;
  const tz = getTimezoneForCountry(country || 'FR');
  const cursor = new Date(from.getTime());

  for (let i = 0; i < 30; i++) {
    const { hour, weekday, ymd } = toLocalParts(cursor, country);
    const isHoliday = holidays.includes(ymd);
    const isSunday = weekday === 0;

    if (!isSunday && !isHoliday && hour >= LEGAL_HOUR_START && hour < LEGAL_HOUR_END) {
      return cursor;
    }

    // If before legal hour same day (weekday, no holiday) → jump to 10:00 local same day
    if (!isSunday && !isHoliday && hour < LEGAL_HOUR_START) {
      cursor.setTime(setLocalHour(cursor, tz, LEGAL_HOUR_START).getTime());
      continue;
    }

    // Else roll to next day 10:00 local
    const nextDay = new Date(cursor.getTime() + 24 * 3600 * 1000);
    cursor.setTime(setLocalHour(nextDay, tz, LEGAL_HOUR_START).getTime());
  }

  return cursor;
}

function setLocalHour(date: Date, tz: string, hour: number): Date {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit', hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
  const ymd = `${get('year')}-${get('month')}-${get('day')}`;
  // Build a UTC timestamp representing `hour:00:00` local time in tz
  const probe = new Date(`${ymd}T${String(hour).padStart(2, '0')}:00:00Z`);
  const tzOffsetMin = getTzOffsetMinutes(probe, tz);
  return new Date(probe.getTime() - tzOffsetMin * 60 * 1000);
}

function getTzOffsetMinutes(date: Date, tz: string): number {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
  const local = Date.UTC(
    parseInt(get('year'), 10),
    parseInt(get('month'), 10) - 1,
    parseInt(get('day'), 10),
    parseInt(get('hour'), 10),
    parseInt(get('minute'), 10),
    parseInt(get('second'), 10),
  );
  return (local - date.getTime()) / 60000;
}
