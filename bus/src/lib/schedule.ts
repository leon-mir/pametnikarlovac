// Jezgra izračuna voznog reda — čiste funkcije (bez UI-ja, bez globalnog stanja).
// Vremena su minute od ponoći. `now` = efektivno "sada" (za današnji dan stvarno
// vrijeme; za drugi datum -1 → prikaži sve polaske od početka dana).
//
// Model: svaka linija ima varijante; svaka varijanta ima smjer `forward` (0) i `back` (1),
// a svaki smjer VLASTITI eksplicitni popis polazaka (nepravilan) i vlastita stajališta.
import { LINES, stationById } from './data';
import { toMin, autoSchedType } from './dates';
import type { Line, Variant, Direction, SchedType, Departure, Connection, Leg, Itinerary } from './types';

/** Podatci smjera (0 = forward, 1 = back). Null ako smjer ne postoji (kružna linija). */
export function dirData(v: Variant, dir: 0 | 1): Direction | null {
  return dir === 0 ? v.forward : v.back;
}

/** Ime krajnje stanice smjera. */
export function dirTerminal(d: Direction): string {
  return stationById(d.stops[d.stops.length - 1]?.station)?.name ?? '';
}

/** Sva vremena kad ovaj smjer kreće sa zadane stanice (polazak + offset stanice), sortirano. */
export function timesAtStation(d: Direction, stationId: string, sched: SchedType): number[] {
  const idx = d.stops.findIndex((s) => s.station === stationId);
  if (idx === -1) return [];
  const off = d.stops[idx].offset;
  return (d.departures[sched] ?? []).map((t) => toMin(t) + off).sort((a, b) => a - b);
}

/** Iteriraj sve smjerove svih varijanti svih linija (ili jedne linije). */
function* eachDirection(lines: Line[] = LINES): Generator<{ line: Line; variant: Variant; dir: 0 | 1; d: Direction }> {
  for (const line of lines) {
    for (const variant of line.variants) {
      for (const dir of [0, 1] as const) {
        const d = dirData(variant, dir);
        if (d) yield { line, variant, dir, d };
      }
    }
  }
}

/** Sljedeći polasci sa stanice (sve linije/varijante/smjerovi), sortirano. */
export function departuresAt(
  stationId: string,
  sched: SchedType,
  now: number,
  limit?: number,
): Departure[] {
  const out: Departure[] = [];
  for (const { line, variant, dir, d } of eachDirection()) {
    const idx = d.stops.findIndex((s) => s.station === stationId);
    // nema stanice, ili je krajnja u tom smjeru → nema polaska dalje
    if (idx === -1 || idx === d.stops.length - 1) continue;
    const to = dirTerminal(d);
    for (const t of timesAtStation(d, stationId, sched)) {
      if (t >= now) out.push({ line, variant, dir, time: t, to });
    }
  }
  out.sort((a, b) => a.time - b.time || Number(a.line.id) - Number(b.line.id));
  return limit ? out.slice(0, limit) : out;
}

/** Prvi sutrašnji polazak sa stanice (za prijateljsko prazno stanje). */
export function firstTomorrow(stationId: string): number | null {
  const tomorrow = new Date(Date.now() + 86400000);
  const tType = autoSchedType(tomorrow);
  let best: number | null = null;
  for (const { d } of eachDirection()) {
    const idx = d.stops.findIndex((s) => s.station === stationId);
    if (idx === -1 || idx === d.stops.length - 1) continue;
    for (const t of timesAtStation(d, stationId, tType)) {
      if (best === null || t < best) best = t;
    }
  }
  return best;
}

/** Izravne veze A → B (linije/smjerovi koji voze od A prema B, s vremenom vožnje). */
export function tripConnections(
  aId: string,
  bId: string,
  sched: SchedType,
  now: number,
  limit?: number,
): Connection[] {
  const A = stationById(aId)?.name ?? '';
  const out: Connection[] = [];
  for (const { line, variant, dir, d } of eachDirection()) {
    const ia = d.stops.findIndex((s) => s.station === aId);
    const ib = d.stops.findIndex((s) => s.station === bId);
    if (ia === -1 || ib === -1 || ia >= ib) continue;
    const ride = d.stops[ib].offset - d.stops[ia].offset;
    const to = dirTerminal(d);
    for (const start of d.departures[sched] ?? []) {
      const t = toMin(start) + d.stops[ia].offset;
      if (t >= now) out.push({ line, variant, dir, from: A, time: t, arrive: t + ride, to });
    }
  }
  out.sort((x, y) => x.time - y.time);
  return limit ? out.slice(0, limit) : out;
}

// --- Planer rute: izravno ili jedno presjedanje ---

const MIN_TRANSFER = 3; // min. minuta za presjedanje
const MAX_TRANSFER_WAIT = 45; // najduže čekanje na presjedanju

/** Sve pojedinačne vožnje smjera od stanice `fromId` do bilo koje kasnije stanice, nakon `now`. */
function ridesFrom(fromId: string, sched: SchedType, now: number): Leg[] {
  const out: Leg[] = [];
  for (const { line, dir, d } of eachDirection()) {
    const ia = d.stops.findIndex((s) => s.station === fromId);
    if (ia === -1 || ia === d.stops.length - 1) continue;
    for (const start of d.departures[sched] ?? []) {
      const depart = toMin(start) + d.stops[ia].offset;
      if (depart < now) continue;
      for (let ib = ia + 1; ib < d.stops.length; ib++) {
        const arrive = toMin(start) + d.stops[ib].offset;
        out.push({ line, dir, fromId, toId: d.stops[ib].station, depart, arrive });
      }
    }
  }
  return out;
}

/**
 * Itinerari A → B: prvo izravni; ako ih nema, s jednim presjedanjem.
 * Vraća do `limit` najranijih po dolasku (uz razumno čekanje na presjedanju).
 */
export function planTrip(
  aId: string,
  bId: string,
  sched: SchedType,
  now: number,
  limit = 4,
): { direct: boolean; itineraries: Itinerary[] } {
  // 1) izravno
  const direct = tripConnections(aId, bId, sched, now).map<Itinerary>((c) => ({
    legs: [{ line: c.line, dir: c.dir, fromId: aId, toId: bId, depart: c.time, arrive: c.arrive }],
    depart: c.time,
    arrive: c.arrive,
  }));
  direct.sort((x, y) => x.depart - y.depart);
  if (direct.length) return { direct: true, itineraries: direct.slice(0, limit) };

  // 2) jedno presjedanje — spoji vožnje iz A s vožnjama koje s neke međustanice stižu do B
  const fromA = ridesFrom(aId, sched, now);
  const best = new Map<string, Itinerary>(); // ključ: linija1-linija2-transfer → najraniji dolazak
  for (const leg1 of fromA) {
    if (leg1.toId === bId || leg1.toId === aId) continue;
    const onward = ridesFrom(leg1.toId, sched, leg1.arrive + MIN_TRANSFER).filter((l) => l.toId === bId);
    for (const leg2 of onward) {
      const wait = leg2.depart - leg1.arrive;
      if (wait > MAX_TRANSFER_WAIT) continue;
      if (leg2.line.id === leg1.line.id) continue; // isto = zapravo izravno, preskoči
      const key = `${leg1.line.id}>${leg2.line.id}@${leg1.toId}`;
      const it: Itinerary = {
        legs: [leg1, leg2],
        transferId: leg1.toId,
        depart: leg1.depart,
        arrive: leg2.arrive,
      };
      const prev = best.get(key);
      if (!prev || it.arrive < prev.arrive) best.set(key, it);
    }
  }
  const itineraries = [...best.values()].sort((x, y) => x.arrive - y.arrive || x.depart - y.depart);
  return { direct: false, itineraries: itineraries.slice(0, limit) };
}

/** Aktivne obavijesti (za stanicu, ili sve ako je stationId null). */
export function noticesFor(stationId: string | null): Line[] {
  return LINES.filter((l) => {
    if (!l.notice) return false;
    if (!stationId) return true;
    return l.variants.some(
      (v) =>
        v.forward.stops.some((s) => s.station === stationId) ||
        (v.back?.stops.some((s) => s.station === stationId) ?? false),
    );
  });
}
