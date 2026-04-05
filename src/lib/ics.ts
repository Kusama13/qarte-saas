/**
 * Minimal iCalendar (RFC 5545) generator for downloading .ics files client-side.
 * Works on Apple Calendar (iOS/macOS), Google Calendar (Android/web), Outlook.
 */

export interface IcsEvent {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  /** Local wall-clock start: "YYYY-MM-DDTHH:mm" in the merchant's timezone */
  startLocal: string;
  durationMinutes: number;
  /** IANA timezone, e.g. "Europe/Paris" */
  timezone: string;
}

/** Escape TEXT fields per RFC 5545: backslash, comma, semicolon, newline. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

/** Fold lines longer than 75 octets per RFC 5545 (CRLF + single space). */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let remaining = line;
  chunks.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);
  while (remaining.length > 74) {
    chunks.push(' ' + remaining.slice(0, 74));
    remaining = remaining.slice(74);
  }
  if (remaining.length > 0) chunks.push(' ' + remaining);
  return chunks.join('\r\n');
}

/** Format a Date as UTC "YYYYMMDDTHHmmssZ". */
function toUtcStamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Convert a local wall-clock time in a given IANA timezone to a UTC Date.
 * Uses Intl.DateTimeFormat to compute the zone's offset at that instant.
 */
function zonedWallTimeToUtc(startLocal: string, timezone: string): Date {
  // startLocal: "YYYY-MM-DDTHH:mm" (optionally with :ss)
  const match = startLocal.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) throw new Error(`Invalid startLocal: ${startLocal}`);
  const [, y, mo, d, h, mi, s] = match;
  // Tentative UTC timestamp assuming the wall time is already UTC.
  const asUtc = Date.UTC(+y, +mo - 1, +d, +h, +mi, s ? +s : 0);

  // Ask what that instant looks like in the target timezone.
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date(asUtc));
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '0';
  const zonedAsUtc = Date.UTC(
    +get('year'),
    +get('month') - 1,
    +get('day'),
    +get('hour') === 24 ? 0 : +get('hour'),
    +get('minute'),
    +get('second'),
  );
  // Offset between the wall time we want and the wall time that `asUtc` actually produced in that zone.
  const offsetMs = zonedAsUtc - asUtc;
  return new Date(asUtc - offsetMs);
}

export function buildIcsContent(event: IcsEvent): string {
  const startUtc = zonedWallTimeToUtc(event.startLocal, event.timezone);
  const endUtc = new Date(startUtc.getTime() + event.durationMinutes * 60_000);
  const now = new Date();

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Qarte//Planning//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${toUtcStamp(now)}`,
    `DTSTART:${toUtcStamp(startUtc)}`,
    `DTEND:${toUtcStamp(endUtc)}`,
    `SUMMARY:${escapeText(event.title)}`,
  ];
  if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.map(foldLine).join('\r\n');
}

export function downloadIcs(event: IcsEvent, filename: string): void {
  if (typeof window === 'undefined') return;
  const content = buildIcsContent(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
