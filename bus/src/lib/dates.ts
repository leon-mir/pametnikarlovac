// Rad s vremenom i datumima. Vremena su minute od ponoći.
import { HOLIDAYS } from './data';
import type { SchedType } from './types';

export const DAYS_HR = [
  'nedjelja',
  'ponedjeljak',
  'utorak',
  'srijeda',
  'četvrtak',
  'petak',
  'subota',
];

export const SCHED_LABEL: Record<SchedType, string> = {
  radni: 'Radni dan',
  subota: 'Subota',
  nedjelja: 'Nedjelja i blagdan',
};

export function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Minute od ponoći → "H:MM". Normalizira preljev preko 24 h. */
export function fmt(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  return String(Math.floor(m / 60)) + ':' + String(m % 60).padStart(2, '0');
}

export function nowMin(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function toISO(d: Date): string {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

export function fmtDate(d: Date): string {
  return DAYS_HR[d.getDay()] + ' ' + d.getDate() + '.' + (d.getMonth() + 1) + '.';
}

function isHoliday(d: Date): boolean {
  const year = String(d.getFullYear());
  const key =
    String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  return (HOLIDAYS[year] ?? []).includes(key);
}

/** Tip voznog reda automatski iz datuma (blagdan i nedjelja → nedjeljni). */
export function autoSchedType(d: Date = new Date()): SchedType {
  if (isHoliday(d) || d.getDay() === 0) return 'nedjelja';
  if (d.getDay() === 6) return 'subota';
  return 'radni';
}
