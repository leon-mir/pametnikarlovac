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

// --- Planer rute: koliko god presjedanja treba (RAPTOR-lite, najraniji dolazak) ---

const MIN_TRANSFER = 3; // min. minuta za presjedanje
const MAX_ROUNDS = 6; // gornja granica broja vožnji (≈ 5 presjedanja)

interface Label {
  line: Line;
  dir: 0 | 1;
  boardStation: string;
  boardTime: number;
  arriveTime: number;
}

/** Najraniji dolazak A → B s polaskom u/nakon `now` (broj vožnji do MAX_ROUNDS). Null ako nema veze. */
function earliestRoute(aId: string, bId: string, sched: SchedType, now: number): Itinerary | null {
  const start = now < 0 ? 0 : now;
  const arrival = new Map<string, number>([[aId, start]]);
  const label = new Map<string, Label>();
  let marked = new Set<string>([aId]);

  for (let round = 0; round < MAX_ROUNDS && marked.size; round++) {
    const prev = new Map(arrival); // odluke o ukrcaju koriste stanje s početka runde (1 vožnja po rundi)
    const nextMarked = new Set<string>();
    for (const { line, dir, d } of eachDirection()) {
      const starts = d.departures[sched] ?? [];
      if (!starts.length) continue;
      let trip: number | null = null; // odabrano vrijeme polaska s početne stanice smjera
      let boardStation: string | null = null;
      let boardTime = 0;
      for (let i = 0; i < d.stops.length; i++) {
        const s = d.stops[i].station;
        const off = d.stops[i].offset;
        if (trip !== null) {
          const arr = trip + off;
          if (arr < (arrival.get(s) ?? Infinity)) {
            arrival.set(s, arr);
            label.set(s, { line, dir, boardStation: boardStation!, boardTime, arriveTime: arr });
            nextMarked.add(s);
          }
        }
        // možemo li ovdje uhvatiti raniji polazak? (stanica dosegnuta u prethodnoj rundi)
        const ready = prev.get(s);
        if (ready !== undefined) {
          const need = ready + (s === aId ? 0 : MIN_TRANSFER);
          let best: number | null = null;
          for (const st of starts) {
            const stm = toMin(st);
            if (stm + off >= need) {
              best = stm;
              break; // starts su sortirani → prvi koji zadovoljava je najraniji
            }
          }
          if (best !== null && (trip === null || best < trip)) {
            trip = best;
            boardStation = s;
            boardTime = best + off;
          }
        }
      }
    }
    marked = nextMarked;
  }

  if (!arrival.has(bId) || !label.has(bId)) return null;
  const legsRev: Leg[] = [];
  let cur = bId;
  for (let guard = 0; cur !== aId && guard < MAX_ROUNDS + 2; guard++) {
    const l = label.get(cur);
    if (!l) return null;
    legsRev.push({ line: l.line, dir: l.dir, fromId: l.boardStation, toId: cur, depart: l.boardTime, arrive: l.arriveTime });
    cur = l.boardStation;
  }
  if (cur !== aId) return null;
  // spoji uzastopne noge iste linije/smjera (nije stvarno presjedanje)
  const legs: Leg[] = [];
  for (const leg of legsRev.reverse()) {
    const last = legs[legs.length - 1];
    if (last && last.line.id === leg.line.id && last.dir === leg.dir) {
      last.toId = leg.toId;
      last.arrive = leg.arrive;
    } else {
      legs.push({ ...leg });
    }
  }
  return { legs, depart: legs[0].depart, arrive: legs[legs.length - 1].arrive, transfers: legs.length - 1 };
}

/** Nekoliko itinerara A → B (najraniji, pa idući polasci). */
export function planRoutes(
  aId: string,
  bId: string,
  sched: SchedType,
  now: number,
  count = 3,
): Itinerary[] {
  const out: Itinerary[] = [];
  const seen = new Set<string>();
  let from = now;
  for (let k = 0; k < count; k++) {
    const it = earliestRoute(aId, bId, sched, from);
    if (!it) break;
    const sig = it.legs.map((l) => `${l.line.id}:${l.depart}:${l.toId}`).join('|');
    if (!seen.has(sig)) {
      seen.add(sig);
      out.push(it);
    }
    from = it.depart + 1; // sljedeći polazak nakon ovog
  }
  return out;
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
