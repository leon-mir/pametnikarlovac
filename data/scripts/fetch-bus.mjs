// Dohvat stvarnog voznog reda s gis.karlovac.hr → normalizirani JSON za Bus aplikaciju.
//
// Pokretanje:
//   node data/scripts/fetch-bus.mjs                 # dohvati linije iz bus-line-ids.json
//   node data/scripts/fetch-bus.mjs --discover=560-720   # otkrij interne ID-eve linija (uljudan sken)
//   node data/scripts/fetch-bus.mjs --out=samples   # zapiši u data/bus/samples/ umjesto data/bus/
//
// Rezultat (kad je potpun): data/bus/{stations,lines,prices,holidays,meta}.json.
// VAŽNO: stvarni vozni red je NEPRAVILAN (eksplicitna vremena, ne fiksni razmak) →
// model linije koristi `departures` (popis polazaka po tipu dana), ne `first/last/headway`.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  login,
  getLine,
  getStartTimes,
  getTrip,
  pointToWgs,
} from './gis-client.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(HERE, '..', 'bus');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

/** Sljedeći datum zadanog dana u tjednu (0=ned … 6=sub), format DD.MM.YYYY. */
function nextWeekday(dow) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  while (d.getDay() !== dow) d.setDate(d.getDate() + 1);
  return (
    String(d.getDate()).padStart(2, '0') +
    '.' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '.' +
    d.getFullYear() +
    '.'
  );
}

// reprezentativni datumi po tipu dana (izbjegava blagdane jer bira sljedeći tjedan)
const REP_DATES = {
  radni: nextWeekday(3), // srijeda
  subota: nextWeekday(6),
  nedjelja: nextWeekday(0),
};

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Iz jednog polaska izvedi offsete stajališta (min od polazišta) redom vožnje. */
function stopOffsetsFromTrip(records) {
  const entries = Object.entries(records).map(([sid, t]) => ({ sid, min: toMin(t) }));
  if (!entries.length) return [];
  entries.sort((a, b) => a.min - b.min);
  const base = entries[0].min;
  return entries.map((e) => ({ station: e.sid, offset: e.min - base }));
}

async function fetchLine(internalId) {
  const detail = await getLine(internalId);
  if (!detail) return null;
  const f = detail.feature;
  const stajalista = detail.extra_data?.stajalista ?? [];
  const shared = detail.extra_data?.shared_oznaka_linije ?? [];

  // stajališta s koordinatama
  const stations = {};
  for (const s of stajalista) {
    const wgs = pointToWgs(s.the_geom);
    if (wgs) stations[String(s.id)] = { id: String(s.id), name: s.naziv, ...wgs };
  }

  // vozni red po tipu dana: popis polazaka (od polazišta) + offseti stajališta
  const departures = {};
  let offsets = null;
  for (const [type, date] of Object.entries(REP_DATES)) {
    const starts = await getStartTimes(internalId, date);
    departures[type] = starts.slice().sort((a, b) => toMin(a) - toMin(b));
    if (!offsets && starts.length) {
      const trip = await getTrip(internalId, date, starts[0]);
      offsets = stopOffsetsFromTrip(trip);
    }
  }

  return {
    internalId,
    oznaka: String(f.oznaka),
    naziv_rute: f.naziv_rute,
    smjer: f.smjer, // polazni | povratni
    boja_linije: f.boja_linije,
    duljina_km: f.duljina_km,
    povratna: shared[0]?.id ?? null,
    stations,
    stops: offsets ?? [],
    departures,
  };
}

async function discover(range) {
  const [a, b] = range.split('-').map(Number);
  console.log(`🔎 Otkrivanje linija u rasponu ${a}–${b} (uljudno, ~${((b - a) * 0.35).toFixed(0)} s)…`);
  const found = [];
  for (let id = a; id <= b; id++) {
    const starts = await getStartTimes(id, REP_DATES.radni);
    if (starts.length) {
      const line = await getLine(id);
      const oz = line?.feature?.oznaka;
      const smjer = line?.feature?.smjer;
      found.push({ id, oznaka: oz, smjer });
      console.log(`  ✓ ${id} = linija ${oz} (${smjer})`);
    }
  }
  console.log(`Pronađeno ${found.length} internih linija.`);
  console.log(JSON.stringify(found, null, 2));
  return found;
}

async function main() {
  console.log('🔐 Gost-prijava na gis.karlovac.hr…');
  await login();
  console.log('✓ Sesija uspostavljena.');
  console.log('📅 Reprezentativni datumi:', REP_DATES);

  if (args.discover) {
    await discover(String(args.discover));
    return;
  }

  const idsPath = join(HERE, 'bus-line-ids.json');
  const ids = JSON.parse(await readFile(idsPath, 'utf8'));
  const polazni = ids.filter((x) => x.smjer !== 'povratni').map((x) => x.id);
  console.log(`🚌 Dohvaćam ${polazni.length} linija (polazni smjer)…`);

  const lines = [];
  const stationsById = {};
  for (const id of polazni) {
    const line = await fetchLine(id);
    if (!line) {
      console.warn(`  ⚠ linija ${id} nedostupna`);
      continue;
    }
    Object.assign(stationsById, line.stations);
    lines.push(line);
    const n = line.departures.radni?.length ?? 0;
    console.log(`  ✓ ${id} → linija ${line.oznaka} · ${line.stops.length} stajališta · ${n} polazaka (radni)`);
  }

  const outLines = lines.map((l) => ({
    id: l.oznaka,
    internalIds: { polazni: l.internalId, povratni: l.povratna },
    naziv: l.naziv_rute,
    duljina_km: l.duljina_km,
    stops: l.stops,
    departures: l.departures,
  }));
  const outStations = Object.values(stationsById);

  const outDir = args.out ? join(DATA_DIR, String(args.out)) : DATA_DIR;
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'stations.real.json'), JSON.stringify(outStations, null, 2) + '\n');
  await writeFile(join(outDir, 'lines.real.json'), JSON.stringify(outLines, null, 2) + '\n');
  const today = new Date();
  const meta = {
    updated:
      today.getDate() + '.' + (today.getMonth() + 1) + '.' + today.getFullYear() + '.',
    source: 'gis.karlovac.hr',
    sourceUrl: 'https://gis.karlovac.hr/thematic-map/bus-prijevoz',
    isDemo: false,
    fetchedAt: today.toISOString().slice(0, 19) + 'Z',
    lines: outLines.length,
    stations: outStations.length,
  };
  await writeFile(join(outDir, 'meta.real.json'), JSON.stringify(meta, null, 2) + '\n');
  console.log(
    `\n✅ Zapisano u ${outDir}: ${outStations.length} stajališta, ${outLines.length} linija.`,
  );
  console.log('   (datoteke *.real.json — pregledaj pa preimenuj/aktiviraj kad je potpuno)');
}

main().catch((e) => {
  console.error('✗ Greška:', e.message);
  process.exit(1);
});
