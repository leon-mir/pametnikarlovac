// Klijent za GIS Karlovac (gis.karlovac.hr) — otvoreni podaci o autobusnom prijevozu.
// Otkriveni interni API (reverse-engineering javnog "public" pristupa, srpanj 2026.):
//
//   GET  /login/public                      → HTML s csrf_token + postavlja session cookie
//   POST /login/public (csrf_token)         → gost-sesija (auto-login, bez lozinke)
//   GET  /module-feature/AutobusnaLinija/{id}
//        → { feature:{ oznaka, naziv_rute, smjer, boja_linije, duljina_km, the_geom },
//            extra_data:{ shared_oznaka_linije:[{id,smjer}], stajalista:[{id,naziv,the_geom}] } }
//   GET  /module-feature/AutobusnaStajalista/{id}   → detalj stajališta
//   GET  /thematic-map/bus-prijevoz/vozni-red/time/{id}/{DD.MM.YYYY.}/      → { pocetna_vremena:[...] }
//   GET  /thematic-map/bus-prijevoz/vozni-red/{id}/{DD.MM.YYYY.}/{HH:MM}    → { vozni_red_records:{stajId:time} }
//
// Geometrija je u EPSG:3857 (Web Mercator, metri) → reprojekcija u WGS84 (lat/lng) ovdje.

const BASE = 'https://gis.karlovac.hr';
const UA = 'PametniKarlovac-DataBot/0.1 (+https://pametnikarlovac.hr; otvoreni podaci)';

let cookie = '';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Uljudno kašnjenje između zahtjeva (ne opterećuj izvor). */
export const POLITE_MS = 350;

async function req(path, { json = true } = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'User-Agent': UA, ...(cookie ? { Cookie: cookie } : {}) },
    redirect: 'manual',
  });
  const setC = res.headers.get('set-cookie');
  if (setC) mergeCookie(setC);
  const text = await res.text();
  return { status: res.status, text, json: json ? safeJson(text) : null };
}

function safeJson(t) {
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

function mergeCookie(setCookieHeader) {
  // vrlo jednostavan cookie jar: uzmi name=value parove
  const parts = setCookieHeader.split(/,(?=\s*\w+=)/);
  const jar = new Map(
    cookie
      .split('; ')
      .filter(Boolean)
      .map((c) => {
        const i = c.indexOf('=');
        return [c.slice(0, i), c.slice(i + 1)];
      }),
  );
  for (const p of parts) {
    const first = p.split(';')[0].trim();
    const i = first.indexOf('=');
    if (i > 0) jar.set(first.slice(0, i), first.slice(i + 1));
  }
  cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

/** Uspostavi gost-sesiju (auto-login /login/public). */
export async function login() {
  const page = await req('/login/public', { json: false });
  const m = page.text.match(/name="csrf_token"[^>]*value="([^"]+)"/);
  if (!m) throw new Error('Ne mogu pronaći csrf_token na /login/public');
  const body = new URLSearchParams({
    csrf_token: m[1],
    device_width: '1280',
    device: 'desktop',
    next: '',
  });
  const res = await fetch(BASE + '/login/public', {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      Cookie: cookie,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    redirect: 'manual',
  });
  const setC = res.headers.get('set-cookie');
  if (setC) mergeCookie(setC);
  if (res.status !== 302 && res.status !== 200) {
    throw new Error('Gost-prijava nije uspjela, HTTP ' + res.status);
  }
}

/** Detalj linije + extra_data (stajališta s koordinatama, uparena povratna linija). */
export async function getLine(id) {
  await sleep(POLITE_MS);
  const { json } = await req(`/module-feature/AutobusnaLinija/${id}`);
  if (!json || !json.feature) return null;
  return json;
}

/** Početna vremena polazaka linije za datum (DD.MM.YYYY.). */
export async function getStartTimes(id, date) {
  await sleep(POLITE_MS);
  const { json } = await req(`/thematic-map/bus-prijevoz/vozni-red/time/${id}/${date}/`);
  if (!json || json.status !== 'success') return [];
  return json.pocetna_vremena || [];
}

/** Vremena po stajalištima za jedan polazak: { stajalisteId: "HH:MM" }. */
export async function getTrip(id, date, time) {
  await sleep(POLITE_MS);
  const { json } = await req(`/thematic-map/bus-prijevoz/vozni-red/${id}/${date}/${time}`);
  if (!json || json.status !== 'success') return {};
  return json.vozni_red_records || {};
}

/** EPSG:3857 "POINT (x y)" ili x,y → { lat, lng } (WGS84). */
export function mercToWgs(x, y) {
  const R = 6378137;
  const lng = (x / R) * (180 / Math.PI);
  const lat = (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI);
  return { lat: +lat.toFixed(6), lng: +lng.toFixed(6) };
}

export function pointToWgs(wkt) {
  const m = String(wkt).match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/);
  if (!m) return null;
  return mercToWgs(parseFloat(m[1]), parseFloat(m[2]));
}
