// Učitavanje kanonskog dataseta (../data/bus). Importi se bundle-aju u build →
// aplikacija radi offline i u Capacitor webviewu, bez ijednog runtime poziva izvora.
import stationsJson from '@data/stations.json';
import linesJson from '@data/lines.json';
import pricesJson from '@data/prices.json';
import holidaysJson from '@data/holidays.json';
import metaJson from '@data/meta.json';
import type { Station, Line, Prices, Meta } from './types';

export const STATIONS: Station[] = stationsJson as Station[];
export const LINES: Line[] = linesJson as unknown as Line[];
export const PRICES: Prices = pricesJson as Prices;
export const META: Meta = metaJson as Meta;
export const HOLIDAYS: Record<string, string[]> = holidaysJson as Record<string, string[]>;

const stationIndex: Map<string, Station> = new Map(STATIONS.map((s) => [s.id, s]));
const lineIndex: Map<string, Line> = new Map(LINES.map((l) => [l.id, l]));

export function stationById(id: string | null | undefined): Station | undefined {
  return id ? stationIndex.get(id) : undefined;
}

export function lineById(id: string | null | undefined): Line | undefined {
  return id ? lineIndex.get(id) : undefined;
}

/** Sve linije koje uslužuju stanicu (bilo koji smjer bilo koje varijante). */
export function linesAt(stationId: string): Line[] {
  return LINES.filter((l) =>
    l.variants.some(
      (v) =>
        v.forward.stops.some((s) => s.station === stationId) ||
        (v.back?.stops.some((s) => s.station === stationId) ?? false),
    ),
  );
}
