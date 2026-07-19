// Dohvat stvarnog voznog reda s gis.karlovac.hr → normalizirani JSON za Bus aplikaciju.
//
// Pokretanje:
//   node data/scripts/fetch-bus.mjs                 # dohvati linije iz bus-line-ids.json
//   node data/scripts/fetch-bus.mjs --discover=560-720   # otkrij interne ID-eve linija (uljudan sken)
//   node data/scripts/fetch-bus.mjs --out=samples   # zapiši u data/bus/samples/ umjesto data/bus/
//
// Rezultat (kad je potpun): data/bus/{stations,lines,meta}.json.
// Model: linija (oznaka) → varijante (pod-trase iste oznake, npr. linija 4 ima 3 trase).
//   Svaka varijanta: eksplicitni polasci po tipu dana, offseti stajališta, i GEOMETRIJA trase
//   (po cesti, iz `the_geom`) za oba smjera. Obavijesti (privremena regulacija) i boja s izvora.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { login, getLine, getStartTimes, getTrip, pointToWgs, mercToWgs } from './gis-client.mjs';

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

// Boja linije: GIS `boja_linije` je indeks (1..11), ne hex. Preslikavamo na pristupačnu
// paletu — sve boje nose bijeli tekst uz AA kontrast; broj linije se svejedno UVIJEK ispisuje
// (daltonizam OK). Indeksi prate grupiranje s izvora (ista GIS boja → ista naša boja).
const LINE_COLORS = {
  1: '#B81B0F',
  2: '#256066',
  3: '#0D5736',
  4: '#8A6408',
  5: '#6B3FA0',
  6: '#19515A',
  7: '#A23B72',
  8: '#3F5060',
  9: '#7A5142',
  10: '#15707A',
  11: '#532B4E',
};
const FALLBACK_COLOR = '#3F4C57';

function colorFor(boja) {
  return LINE_COLORS[boja] ?? FALLBACK_COLOR;
}

/** Iz jednog polaska izvedi offsete stajališta (min od polazišta) redom vožnje. */
function stopOffsetsFromTrip(records) {
  const entries = Object.entries(records).map(([sid, t]) => ({ sid, min: toMin(t) }));
  if (!entries.length) return [];
  entries.sort((a, b) => a.min - b.min);
  const base = entries[0].min;
  return entries.map((e) => ({ station: e.sid, offset: e.min - base }));
}

/** "LINESTRING (x y, x y, …)" (EPSG:3857) → [[lat,lng], …] (WGS84), zaokruženo, bez uzastopnih duplikata. */
function parseLineString(wkt) {
  const m = String(wkt).match(/LINESTRING\s*\(([^)]+)\)/i);
  if (!m) return null;
  const out = [];
  let prev = null;
  for (const pair of m[1].split(',')) {
    const [x, y] = pair.trim().split(/\s+/).map(Number);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const { lat, lng } = mercToWgs(x, y);
    const p = [+lat.toFixed(5), +lng.toFixed(5)];
    if (!prev || prev[0] !== p[0] || prev[1] !== p[1]) out.push(p);
    prev = p;
  }
  return out.length > 1 ? out : null;
}

/** Obavijest linije: privremena regulacija ili napomena; izdvoji URL ako postoji na kraju. */
function noticeFrom(feature) {
  const raw = (feature.privremena_regulacija || feature.napomena || '').trim();
  if (!raw) return null;
  const url = raw.match(/https?:\/\/\S+/)?.[0] ?? undefined;
  const text = (url ? raw.replace(url, '') : raw).replace(/\s+$/g, '').trim();
  return url ? { text, url } : { text };
}

/** Dohvati JEDAN smjer (interni ID) sa stvarnim polascima, offsetima stajališta i trasom.
 *  Svaki smjer u GIS-u je zasebna linija s VLASTITIM voznim redom — zato ga dohvaćamo cijelog. */
async function fetchDirection(internalId) {
  const detail = await getLine(internalId);
  if (!detail) return null;
  const f = detail.feature;
  const stajalista = detail.extra_data?.stajalista ?? [];

  const stations = {};
  for (const s of stajalista) {
    const wgs = pointToWgs(s.the_geom);
    if (wgs) stations[String(s.id)] = { id: String(s.id), name: s.naziv, zona: s.zona ?? null, ...wgs };
  }

  const departures = {};
  let offsets = null;
  for (const [type, date] of Object.entries(REP_DATES)) {
    const starts = await getStartTimes(internalId, date);
    departures[type] = starts.slice().sort((a, b) => toMin(a) - toMin(b));
    if (!offsets && starts.length) {
      offsets = stopOffsetsFromTrip(await getTrip(internalId, date, starts[0]));
    }
  }

  return {
    internalId,
    oznaka: String(f.oznaka),
    naziv: f.naziv_rute,
    boja: f.boja_linije,
    avgMinutes: f.prosjecno_vrijeme_putovanja ?? null,
    notice: noticeFrom(f),
    povratniId: detail.extra_data?.shared_oznaka_linije?.[0]?.id ?? null,
    stops: offsets ?? [],
    departures,
    geometry: parseLineString(f.the_geom),
    stations,
  };
}

/** Jedna varijanta (pod-trasa) = smjer "tamo" (polazni) + smjer "natrag" (povratni), svaki s vlastitim rasporedom. */
async function fetchVariant(polazniId) {
  const fwd = await fetchDirection(polazniId);
  if (!fwd) return null;
  const back = fwd.povratniId ? await fetchDirection(fwd.povratniId) : null;

  const stations = { ...fwd.stations, ...(back?.stations ?? {}) };
  const dir = (d) =>
    d ? { internalId: d.internalId, stops: d.stops, departures: d.departures, geometry: d.geometry } : null;

  return {
    oznaka: fwd.oznaka,
    naziv: fwd.naziv,
    boja: fwd.boja,
    avgMinutes: fwd.avgMinutes ?? back?.avgMinutes ?? null,
    notice: fwd.notice ?? back?.notice ?? null,
    forward: dir(fwd),
    back: dir(back),
    stations,
  };
}

async function discover(range) {
  const [a, b] = range.split('-').map(Number);
  console.log(`🔎 Otkrivanje linija u rasponu ${a}–${b}…`);
  const found = [];
  for (let id = a; id <= b; id++) {
    const starts = await getStartTimes(id, REP_DATES.radni);
    if (starts.length) {
      const line = await getLine(id);
      found.push({ id, oznaka: line?.feature?.oznaka, smjer: line?.feature?.smjer });
      console.log(`  ✓ ${id} = linija ${line?.feature?.oznaka} (${line?.feature?.smjer})`);
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

  const ids = JSON.parse(await readFile(join(HERE, 'bus-line-ids.json'), 'utf8'));
  const polazni = ids.filter((x) => x.smjer !== 'povratni');
  console.log(`🚌 Dohvaćam ${polazni.length} varijanti (polazni smjer)…`);

  const stationsById = {};
  const variantsByOznaka = new Map(); // oznaka → { color, avgMinutes, notice, variants[] }
  const geometryByOznaka = new Map(); // oznaka → [ [[lat,lng],…], … ] (sve trase, drži se odvojeno)

  // geometrija se drži IZVAN lines.json (učitava je samo karta) → manji početni bundle
  const stripGeom = (d) => (d ? { internalId: d.internalId, stops: d.stops, departures: d.departures } : null);
  const pushGeom = (oznaka, d) => {
    if (d?.geometry) {
      if (!geometryByOznaka.has(oznaka)) geometryByOznaka.set(oznaka, []);
      geometryByOznaka.get(oznaka).push(d.geometry);
    }
  };

  for (const { id, oznaka } of polazni) {
    const v = await fetchVariant(id);
    if (!v) {
      console.warn(`  ⚠ varijanta ${id} (linija ${oznaka}) nedostupna`);
      continue;
    }
    Object.assign(stationsById, v.stations);
    if (!variantsByOznaka.has(v.oznaka)) {
      variantsByOznaka.set(v.oznaka, {
        color: colorFor(v.boja),
        avgMinutes: v.avgMinutes,
        notice: v.notice,
        variants: [],
      });
    }
    const grp = variantsByOznaka.get(v.oznaka);
    if (!grp.notice && v.notice) grp.notice = v.notice;
    if (grp.avgMinutes == null && v.avgMinutes != null) grp.avgMinutes = v.avgMinutes;
    grp.variants.push({ naziv: v.naziv, forward: stripGeom(v.forward), back: stripGeom(v.back) });
    pushGeom(v.oznaka, v.forward);
    pushGeom(v.oznaka, v.back);
    const nd = v.forward.departures.radni?.length ?? 0;
    console.log(
      `  ✓ ${id} → linija ${v.oznaka} · ${v.forward.stops.length} stajališta · ${nd} polazaka (radni)` +
        (v.forward.geometry ? ` · trasa ${v.forward.geometry.length} tč.` : ' · BEZ trase') +
        (v.back ? ' · +natrag' : ''),
    );
  }

  // sortiraj linije po broju (1,2,…,20,100,101,102)
  const outLines = [...variantsByOznaka.entries()]
    .map(([oznaka, grp]) => ({
      id: oznaka,
      label: oznaka,
      color: grp.color,
      avgMinutes: grp.avgMinutes,
      notice: grp.notice,
      variants: grp.variants,
    }))
    .sort((a, b) => Number(a.id) - Number(b.id));
  const outStations = Object.values(stationsById).sort((a, b) => Number(a.id) - Number(b.id));

  const outDir = args.out ? join(DATA_DIR, String(args.out)) : DATA_DIR;
  const geometry = Object.fromEntries(geometryByOznaka);

  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'stations.json'), JSON.stringify(outStations, null, 2) + '\n');
  await writeFile(join(outDir, 'lines.json'), JSON.stringify(outLines) + '\n');
  await writeFile(join(outDir, 'geometry.json'), JSON.stringify(geometry) + '\n');
  const today = new Date();
  const meta = {
    updated: today.getDate() + '.' + (today.getMonth() + 1) + '.' + today.getFullYear() + '.',
    source: 'gis.karlovac.hr',
    sourceUrl: 'https://gis.karlovac.hr/thematic-map/bus-prijevoz',
    isDemo: false,
    fetchedAt: today.toISOString().slice(0, 19) + 'Z',
    lines: outLines.length,
    variants: outLines.reduce((n, l) => n + l.variants.length, 0),
    stations: outStations.length,
  };
  await writeFile(join(outDir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
  console.log(
    `\n✅ Zapisano u ${outDir}: ${outStations.length} stajališta, ${outLines.length} linija (${meta.variants} varijanti).`,
  );
}

main().catch((e) => {
  console.error('✗ Greška:', e.message);
  process.exit(1);
});
