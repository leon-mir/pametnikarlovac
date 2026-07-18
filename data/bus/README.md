# Podaci — Bus (vozni red Karlovac)

GTFS-slični otvoreni skup podataka za Bus aplikaciju. **Jedini izvor istine u runtimeu** —
aplikacija čita isključivo ove datoteke, nikad ne poziva gis.karlovac.hr uživo i nikad ne
hardkodira vremena u kod.

> ⚠️ **Trenutno: demo podaci** (`meta.json` → `isDemo: true`). Vremena, trase i koordinate su
> približni i **nisu stvarni vozni red**. Zamjenjuju se stvarnim podacima kad skripta za dohvat
> s gis.karlovac.hr proradi (vidi `docs/izvori-podataka.md`).

## Datoteke

| Datoteka | Sadržaj |
|---|---|
| `stations.json` | Stanice: `id`, `name` (s dijakritikom), `lat`, `lng`. |
| `lines.json` | Linije: `id`, niz `stops` (`station` + `offset` = kumulativne minute od polazišta), `sched` po tipu dana, opcijski `notice`. |
| `prices.json` | Cjenik (`label`, `price`) — mijenja se rijetko, ručno. |
| `holidays.json` | HR blagdani po godini (`"MM-DD"`) — određuju nedjeljni vozni red. |
| `meta.json` | Datum ažurnosti, izvor, oznaka demo podataka. |

## Model voznog reda

`sched.<tip>` je `{ "first", "last", "headway" }` (prvi polazak, zadnji polazak, razmak u
minutama) ili `null` ako linija tim danom ne vozi. Tipovi: `radni`, `subota`, `nedjelja`
(nedjelja se koristi i za blagdane). Polasci s međustanice = polasci s polazišta + `offset`
stanice. Tip dana se bira automatski iz datuma (blagdani → nedjeljni red).

## Ažuriranje

Podatke osvježava zasebna skripta / GitHub Action (ne aplikacija u runtimeu). Nakon osvježavanja
ide redeploy. Format ostaje stabilan; kod promjene strukture ažurirati loader u
`bus/src/lib/data.ts`.

Izvor: gis.karlovac.hr · Otvorena dozvola. Uz svaki prikaz podataka u aplikaciji stoji izvor i
datum ažurnosti.
