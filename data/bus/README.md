# Podaci — Bus (vozni red Karlovac)

GTFS-slični otvoreni skup podataka za Bus aplikaciju. **Jedini izvor istine u runtimeu** —
aplikacija čita isključivo ove datoteke, nikad ne poziva gis.karlovac.hr uživo i nikad ne
hardkodira vremena u kod.

> ✅ **Stvarni podaci** (`meta.json` → `isDemo: false`). Dohvaćeni s gis.karlovac.hr skriptom
> `data/scripts/fetch-bus.mjs` (dnevni GitHub Action). Uz svaki prikaz stoji izvor i datum.

## Datoteke

| Datoteka | Sadržaj |
|---|---|
| `stations.json` | Stanice: `id`, `name` (s dijakritikom), `zona`, `lat`, `lng`. |
| `lines.json` | Linije: `id`/`label` (oznaka), `color` (hex), `avgMinutes`, `notice`, `variants[]`. |
| `geometry.json` | Trase po cesti: `{ lineId: [ [[lat,lng],…], … ] }`. Odvojeno — učitava ga samo karta. |
| `prices.json` | Zonski cjenik (I–VII) — mijenja se rijetko, ručno. |
| `holidays.json` | HR blagdani po godini (`"MM-DD"`) — određuju nedjeljni vozni red. |
| `meta.json` | Datum ažurnosti, izvor, broj linija/varijanti/stanica. |

## Model voznog reda

Svaka linija ima `variants[]` (pod-trase iste oznake; npr. linija 4 ima 3). Svaka varijanta ima
`forward` i `back` (smjer "tamo"/"natrag") — u GIS-u je svaki smjer zasebna linija s **vlastitim**
voznim redom, pa ga držimo cijelog. Smjer ima:

- `stops`: niz `{ station, offset }` (`offset` = kumulativne minute od polazišta tog smjera),
- `departures.<tip>`: **eksplicitni popis** polazaka `"HH:MM"` s polazišta (nepravilan razmak!),
- (`geometry` je u `geometry.json`, ne ovdje).

Tipovi dana: `radni`, `subota`, `nedjelja` (i blagdani). Polazak s međustanice = polazak s
polazišta + `offset` stanice. Tip dana bira se automatski iz datuma.

## Ažuriranje

Podatke osvježava zasebna skripta / GitHub Action (ne aplikacija u runtimeu). Nakon osvježavanja
ide redeploy. Format ostaje stabilan; kod promjene strukture ažurirati loader u
`bus/src/lib/data.ts`.

Izvor: gis.karlovac.hr · Otvorena dozvola. Uz svaki prikaz podataka u aplikaciji stoji izvor i
datum ažurnosti.
