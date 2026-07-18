// Učitavanje kanonskog dataseta (../data/bus). Importi se bundle-aju u build →
// aplikacija radi offline i u Capacitor webviewu, bez ijednog runtime poziva izvora.
import stationsJson from '@data/stations.json';
import linesJson from '@data/lines.json';
import pricesJson from '@data/prices.json';
import holidaysJson from '@data/holidays.json';
import metaJson from '@data/meta.json';
import type { Station, Line, Price, Meta } from './types';

export const STATIONS: Station[] = stationsJson as Station[];
export const LINES: Line[] = linesJson as Line[];
export const PRICES: Price[] = pricesJson as Price[];
export const META: Meta = metaJson as Meta;
export const HOLIDAYS: Record<string, string[]> = holidaysJson as Record<string, string[]>;

const stationIndex: Map<string, Station> = new Map(STATIONS.map((s) => [s.id, s]));

export function stationById(id: string | null | undefined): Station | undefined {
  return id ? stationIndex.get(id) : undefined;
}

export function lineById(id: number): Line | undefined {
  return LINES.find((l) => l.id === id);
}
