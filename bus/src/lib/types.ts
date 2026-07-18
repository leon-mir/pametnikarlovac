// Tipovi podatkovnog modela Bus aplikacije.
// Izvor istine za podatke: ../data/bus/*.json (vidi data/bus/README.md).

export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

/** Tip dana koji određuje vozni red. `nedjelja` pokriva i blagdane. */
export type SchedType = 'radni' | 'subota' | 'nedjelja';

/** Raspored za jedan tip dana: prvi polazak, zadnji polazak, razmak (min). */
export interface Sched {
  first: string; // "HH:MM"
  last: string; // "HH:MM"
  headway: number; // minute
}

export interface LineStop {
  station: string; // Station.id
  offset: number; // kumulativne minute od polazišta
}

export interface Line {
  id: number;
  stops: LineStop[];
  sched: Record<SchedType, Sched | null>;
  notice?: string;
}

export interface Price {
  label: string;
  price: string;
}

export interface Meta {
  updated: string;
  source: string;
  sourceUrl: string;
  isDemo: boolean;
  note?: string;
}

/** Izračunati polazak sa stanice. */
export interface Departure {
  line: Line;
  dir: 0 | 1;
  time: number; // minute od ponoći
  to: string; // ime krajnje stanice u tom smjeru
}

/** Izravna veza A → B. */
export interface Connection extends Departure {
  arrive: number; // minute od ponoći
}
