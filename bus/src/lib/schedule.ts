// Jezgra izračuna voznog reda — čiste funkcije (bez UI-ja, bez globalnog stanja).
// Vremena su minute od ponoći. `now` = efektivno "sada" (za današnji dan stvarno
// vrijeme; za drugi datum -1 → prikaži sve polaske od početka dana).
import { LINES, stationById } from './data';
import { toMin, autoSchedType } from './dates';
import type { Line, SchedType, Departure, Connection } from './types';

/** Stanice linije u zadanom smjeru (0 = A→B, 1 = B→A). */
function stopsInDir(line: Line, dir: 0 | 1) {
  return dir === 0 ? line.stops : [...line.stops].reverse();
}

/** Kumulativni offset stanice u zadanom smjeru. */
function offsetInDir(line: Line, offset: number, dir: 0 | 1): number {
  const total = line.stops[line.stops.length - 1].offset;
  return dir === 0 ? offset : total - offset;
}

export function lineTerminal(line: Line, dir: 0 | 1): string {
  const stops = stopsInDir(line, dir);
  return stationById(stops[stops.length - 1].station)?.name ?? '';
}

/** Sva vremena polaska linije s dane stanice, u jednom smjeru. */
export function lineTimesAt(
  line: Line,
  stationId: string,
  dir: 0 | 1,
  sched: SchedType,
): number[] {
  const sc = line.sched[sched];
  if (!sc) return [];
  const stops = stopsInDir(line, dir);
  const idx = stops.findIndex((s) => s.station === stationId);
  if (idx === -1) return [];
  const off = offsetInDir(line, stops[idx].offset, dir);
  const first = toMin(sc.first);
  const last = toMin(sc.last);
  const out: number[] = [];
  for (let t = first; t <= last; t += sc.headway) out.push(t + off);
  return out;
}

/** Svi polasci s linije (od polazišta) u jednom smjeru — za mrežu vremena. */
export function lineDepartTimes(line: Line, sched: SchedType): number[] {
  const sc = line.sched[sched];
  if (!sc) return [];
  const out: number[] = [];
  for (let t = toMin(sc.first); t <= toMin(sc.last); t += sc.headway) out.push(t);
  return out;
}

/** Sljedeći polasci sa stanice (sve linije, oba smjera), sortirano. */
export function departuresAt(
  stationId: string,
  sched: SchedType,
  now: number,
  limit?: number,
): Departure[] {
  const out: Departure[] = [];
  for (const line of LINES) {
    for (const dir of [0, 1] as const) {
      const stops = stopsInDir(line, dir);
      const idx = stops.findIndex((s) => s.station === stationId);
      // krajnja stanica u tom smjeru → nema polaska dalje
      if (idx === -1 || idx === stops.length - 1) continue;
      for (const t of lineTimesAt(line, stationId, dir, sched)) {
        if (t >= now) out.push({ line, dir, time: t, to: lineTerminal(line, dir) });
      }
    }
  }
  out.sort((a, b) => a.time - b.time);
  return limit ? out.slice(0, limit) : out;
}

/** Prvi sutrašnji polazak sa stanice (za prijateljsko prazno stanje). */
export function firstTomorrow(stationId: string): number | null {
  const tomorrow = new Date(Date.now() + 86400000);
  const tType = autoSchedType(tomorrow);
  let best: number | null = null;
  for (const line of LINES) {
    const sc = line.sched[tType];
    if (!sc) continue;
    for (const dir of [0, 1] as const) {
      const stops = stopsInDir(line, dir);
      const idx = stops.findIndex((s) => s.station === stationId);
      if (idx === -1 || idx === stops.length - 1) continue;
      const off = offsetInDir(line, stops[idx].offset, dir);
      const t = toMin(sc.first) + off;
      if (best === null || t < best) best = t;
    }
  }
  return best;
}

/** Izravne veze A → B (linije koje voze od A prema B, s vremenom vožnje). */
export function tripConnections(
  aId: string,
  bId: string,
  sched: SchedType,
  now: number,
  limit?: number,
): Connection[] {
  const out: Connection[] = [];
  for (const line of LINES) {
    for (const dir of [0, 1] as const) {
      const stops = stopsInDir(line, dir);
      const ia = stops.findIndex((s) => s.station === aId);
      const ib = stops.findIndex((s) => s.station === bId);
      if (ia === -1 || ib === -1 || ia >= ib) continue;
      const ride =
        offsetInDir(line, stops[ib].offset, dir) - offsetInDir(line, stops[ia].offset, dir);
      for (const t of lineTimesAt(line, aId, dir, sched)) {
        if (t >= now) {
          out.push({ line, dir, time: t, arrive: t + ride, to: lineTerminal(line, dir) });
        }
      }
    }
  }
  out.sort((x, y) => x.time - y.time);
  return limit ? out.slice(0, limit) : out;
}

/** Aktivne obavijesti (za stanicu, ili sve ako je stationId null). */
export function noticesFor(stationId: string | null): Line[] {
  return LINES.filter(
    (l) => l.notice && (stationId ? l.stops.some((s) => s.station === stationId) : true),
  );
}
