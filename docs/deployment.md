# Deployment i osvježavanje podataka

Kako se monorepo objavljuje na više (pod)domena preko Vercela i kako podaci ostaju svježi.

## 1. Vercel — jedan repo, više poddomena

Svaka aplikacija = **zaseban Vercel projekt iz istog GitHub repoa**, razlikuju se po
**Root Directoryju**. Vercel klonira cijeli repo, ali install/build pokreće iz tog poddirektorija.

| Vercel projekt | Root Directory | Domena |
|---|---|---|
| `pk-bus` | `bus` | `bus.pametnikarlovac.hr` |
| `pk-proracun` | `proracun` | `proracun.pametnikarlovac.hr` |
| `pk-dogadaji` | `dogadaji` | `dogadaji.pametnikarlovac.hr` |
| `pk-hub` | `hub` *(kad postoji)* | `pametnikarlovac.hr` + `www` |

### Postavljanje projekta (po aplikaciji, jednom)

1. **New Project** → import `leon-mir/pametnikarlovac`.
2. **Root Directory** → npr. `bus`. Framework preset: **Vite** (auto). Build: `npm run build`,
   Output: `dist` (Vercel to prepozna; ne treba ručno).
3. **Include files outside of the Root Directory** → **uključeno** (default). Nužno jer `bus`
   importa `../data/bus` (vozni red) i `../../shared/tokens` (dizajn tokeni). Bez toga build pada.
4. **Domains** → dodaj `bus.pametnikarlovac.hr`.
5. Ponovi za svaku aplikaciju (drugi Root Directory, druga domena).

> **Zašto to radi:** cijeli repo je prisutan u build okruženju, pa relativni importi izvan
> `bus/` (npr. `@data → ../data/bus`) rade i lokalno i na Vercelu. `bus/vercel.json` postavlja
> keš i sigurnosne headere.

### DNS (kod registrara domene)

- Poddomene: `CNAME  bus → cname.vercel-dns.com.` (isto za `proracun`, `dogadaji`).
- Root domena: prema Vercel uputama (A `76.76.21.21` ili preporučeni ALIAS/ANAME), `www` kao CNAME.
- Vercel automatski izdaje i obnavlja Let's Encrypt TLS.

### Deploy tijek

- **Push na `main`** → svaki projekt gradi **samo ako su se promijenile njegove datoteke**
  (Vercel "skip build" po Root Directoryju; može se pojačati s `git.deploymentEnabled` /
  ignore-build skriptom). Push u `bus/` gradi samo `pk-bus`.
- **Pull request** → automatski *preview* URL po projektu (za provjeru prije produkcije).
- Rollback: Vercel → Deployments → *Promote* prijašnji.

## 2. Svježina podataka (kako korisnik uvijek vidi ažuran vozni red)

**Načelo: podaci se NIKAD ne dohvaćaju u aplikaciji (runtime).** Vozni red je uvezen u build
(`@data`), pa aplikacija radi offline i u Capacitoru. Osvježavanje je pipeline izvan aplikacije:

```
GitHub Action (cron, dnevno)                        Vercel                      Korisnik
─────────────────────────────                       ──────                      ────────
data/scripts/fetch-bus.mjs                                                       
  → gost-sesija na gis.karlovac.hr                                              
  → dohvat linija/stajališta/voznog reda                                        
  → normalizacija (EPSG:3857 → WGS84)                                           
  → zapis u data/bus/*.json          ── ako ima promjena: commit + push ─┐      
                                                                          ▼      
                                                    push na main → auto redeploy 
                                                    (novi build, novi hash)      
                                                                          │      
                                    service worker (autoUpdate) ──────────┘      
                                      povuče novu verziju u pozadini             
                                      → aplikacija se osvježi pri sljedećem       
                                        otvaranju, bez reinstalacije              
```

Konkretno:

- **[`.github/workflows/bus-data.yml`](../.github/workflows/bus-data.yml)** pokreće
  `fetch-bus.mjs` svaki dan (i ručno preko *Run workflow*). Ako se vozni red promijenio,
  bot commita u `data/bus/` i pusha.
- Push mijenja podatke koji su dio bundlea → Vercel radi novi build s novim hashevima datoteka.
- **PWA service worker** (`registerType: 'autoUpdate'`) otkrije novu verziju i preuzme je u
  pozadini; korisnik dobije svjež vozni red pri sljedećem otvaranju. Offline i dalje vidi zadnje
  spremljeno.
- Na svakom ekranu piše **izvor + datum ažurnosti** (`meta.updated`) da je svježina vidljiva.

### Rizik i mitigacija

- GIS promijeni strukturu/URL → fetch padne → Action ne commita (stari, ispravni podaci ostaju
  uživo). Dodati: usporedbu (diff alarm) i obavijest o padu (GitHub e-mail / issue).
- Prije prve produkcije sa stvarnim podacima: usporediti s PDF-om (data.gov.hr) i ručno
  potvrditi. Do tada aplikacija koristi jasno označene demo podatke (`meta.isDemo: true`).

## 3. Trgovine (kasnije)

Bus i Događaji idu i u Google Play / App Store preko **Capacitora** (isti kod). Build je već
Capacitor-kompatibilan (relativni `base`, bez SSR-a, offline). Store objava dolazi tek nakon što
web verzija dokaže točnost podataka.
