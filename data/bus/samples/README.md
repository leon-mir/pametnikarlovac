# Stvarni dohvaćeni podaci (uzorak)

Ove `*.real.json` datoteke generira `data/scripts/fetch-bus.mjs` iz **stvarnog** GIS-a
Karlovac (gis.karlovac.hr). Dokaz da pipeline radi: 24 linije, 171 stajalište, prave rute,
imena s dijakritikom i pravi (nepravilni!) polasci.

## Zašto još nisu uživo u aplikaciji

Aplikacija za sada koristi jasno označene **demo** podatke (`data/bus/*.json`,
`meta.isDemo: true`). Prije prebacivanja na stvarne treba (vidi `bus/TODO.md`):

1. **Model voznog reda** — stvarni polasci su nepravilni (npr. linija 102: 10:00, 11:00,
   16:00, 17:00), a aplikacija trenutno pretpostavlja fiksni razmak (`first/last/headway`).
   Treba prijeći na eksplicitni popis polazaka (`departures` — već je u ovom formatu ovdje) i
   maknuti "svakih X min" iz UI-ja.
2. **Varijante linija** — neke linije imaju više internih ID-eva (npr. linija 4: 522, 635,
   701) — treba ih spojiti/označiti kao varijante, ne kao zasebne linije.
3. **Uparivanje smjerova** — `internalIds.polazni/povratni` iz `shared_oznaka_linije`.
4. **Provjera potpunosti** liste linija i točnosti (usporedba s PDF-om s data.gov.hr).

## Format (`lines.real.json`)

```jsonc
{
  "id": "102",                                  // javna oznaka linije
  "internalIds": { "polazni": 593, "povratni": 592 },
  "naziv": "Jamadol - … - Aquatika",
  "stops": [ { "station": "85", "offset": 0 }, … ],   // offset = min od polazišta
  "departures": { "radni": ["10:00", …], "subota": […], "nedjelja": […] }
}
```

`stations.real.json`: `{ id, name, lat, lng }` (koordinate reprojicirane iz EPSG:3857 u WGS84).
