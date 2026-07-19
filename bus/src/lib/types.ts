// Tipovi podatkovnog modela Bus aplikacije.
// Izvor istine za podatke: ../data/bus/*.json (generira data/scripts/fetch-bus.mjs s gis.karlovac.hr).

export interface Station {
  id: string;
  name: string;
  zona?: string | null;
  lat: number;
  lng: number;
}

/** Tip dana koji određuje vozni red. `nedjelja` pokriva i blagdane. */
export type SchedType = 'radni' | 'subota' | 'nedjelja';

export interface LineStop {
  station: string; // Station.id
  offset: number; // kumulativne minute od polazišta OVOG smjera
}

/** Jedan smjer vožnje: vlastiti popis stajališta, eksplicitni polasci i trasa (po cesti).
 *  U GIS-u je svaki smjer zasebna linija s vlastitim voznim redom — zato ga držimo cijelog. */
export interface Direction {
  internalId: number;
  stops: LineStop[];
  departures: Record<SchedType, string[]>; // "HH:MM" s početne stanice ovog smjera
}

/** Geometrija trasa po liniji (id → popis poligonalnih trasa [lat,lng]). Drži se odvojeno,
 *  učitava je samo karta (veliko, ne treba na početnom ekranu). */
export type GeometryMap = Record<string, [number, number][][]>;

/** Pod-trasa iste oznake linije (npr. linija 4 ima 3 varijante). */
export interface Variant {
  naziv: string; // "Autobusni kolodvor - Orlovac - …"
  forward: Direction; // smjer "tamo" (polazni)
  back: Direction | null; // smjer "natrag" (povratni) — null kod kružnih linija
}

export interface Notice {
  text: string;
  url?: string;
}

export interface Line {
  id: string; // oznaka linije, jedinstveni ključ ("1", "11", "100")
  label: string; // ono što se ispisuje na značci (= id)
  color: string; // hex, bijeli tekst čitljiv (AA)
  avgMinutes: number | null;
  notice: Notice | null;
  variants: Variant[];
}

export interface Meta {
  updated: string;
  source: string;
  sourceUrl: string;
  isDemo: boolean;
  fetchedAt?: string;
  lines?: number;
  variants?: number;
  stations?: number;
  note?: string;
}

/** Izračunati polazak sa stanice u konkretnom smjeru jedne varijante. */
export interface Departure {
  line: Line;
  variant: Variant;
  dir: 0 | 1; // 0 = forward, 1 = back
  time: number; // minute od ponoći
  to: string; // ime krajnje stanice tog smjera
}

/** Izravna veza A → B. */
export interface Connection extends Departure {
  from: string; // ime stanice A
  arrive: number; // minute od ponoći
}

/** Noga putovanja u planeru (izravna ili dio presjedanja). */
export interface Leg {
  line: Line;
  dir: 0 | 1;
  fromId: string;
  toId: string;
  depart: number; // min od ponoći, polazak s fromId
  arrive: number; // min od ponoći, dolazak na toId
}

/** Itinerar A → B: jedna ili više nogu (0+ presjedanja). */
export interface Itinerary {
  legs: Leg[];
  depart: number;
  arrive: number;
  transfers: number; // broj presjedanja = legs.length - 1
}

// --- Cjenik (zonski, gis.karlovac.hr/static/pdf) ---
export interface PriceZone {
  zona: string; // "I".."VII"
  km: string; // okvirna udaljenost
  jednokratna: string; // "1,00 €"
  dnevna: string;
  mjesecna: string; // radnička mjesečna
}
export interface Prices {
  vrijediOd: string;
  napomena: string;
  pdvUkljucen: boolean;
  zone: PriceZone[];
  besplatno: string; // 65+ pravilo
  pdfUrl: string;
}
