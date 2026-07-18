# Razrada aplikacija i arhitektura

## Zajednička arhitektura

**Načelo: minimalni troškovi, maksimalna jednostavnost.** Sve tri aplikacije su statične ili gotovo statične — podaci se osvježavaju periodički (cron/GitHub Actions), ne u realnom vremenu na serveru.

```
pametni-karlovac/            ← monorepo, javni GitHub
├── README.md
├── docs/                    ← tehnička dokumentacija
├── shared/                  ← zajednički design tokeni, komponente, logo
├── bus/                     ← bus.pametni-karlovac.[tld]
├── proracun/                ← proracun.pametni-karlovac.[tld]
├── dogadaji/                ← dogadaji.pametni-karlovac.[tld]
└── data/                    ← skripte za dohvat + mali/agregirani podaci

pametni-karlovac-podaci/     ← ZASEBNI data repo (vidi "Pohrana podataka")
```

- **Hosting:** Vercel ili Cloudflare Pages (besplatan tier pokriva sve tri aplikacije; svaka poddomena = svoj projekt iz istog repoa).
- **Podaci:** GitHub Actions na rasporedu dohvaća izvore → sprema u data repo → automatski redeploy aplikacija.
- **Baza:** izbjegavati dok god ide bez nje. Ako zatreba (događaji faza 2 — login za organizatore): Supabase free tier.
- **Stack:** Astro ili Next.js (static export) + Tailwind. Svaka aplikacija samostalno buildabilna.
- **AI workflow:** glavni agent (Claude Code) u rootu vidi sve; per-app agenti rade samo u svom folderu (CLAUDE.md u svakom folderu s opsegom i pravilima).
- **Domena:** jedna domena + poddomene po aplikaciji. Root domena = landing s popisom aplikacija, misijom i linkom na GitHub.

### Put do Google Play / App Store (Bus i Događaji)

Bus i Događaji će se u nekom trenutku objaviti i kao mobilne aplikacije. Tehnički smjer koji to omogućuje bez dupliciranja koda:

- **Web-first + Capacitor wrapper.** Aplikacije se grade kao PWA (offline, instalabilne), a za trgovine se isti kod pakira Capacitorom u native ljusku (iOS + Android). Nema drugog codebasea.
- Posljedice za razvoj od prvog dana: sve mora raditi bez servera (statični podaci u bundleu / fetch s CDN-a), bez browser-only API-ja bez fallbacka, responzivno na male ekrane, ikone/splash u svim veličinama (logo mora raditi na 512×512).
- Troškovi i administracija: Google Play 25 USD jednokratno, Apple Developer 99 USD/god; obje trgovine traže privacy policy (imamo je ionako: ne skupljamo ništa) i stranicu podrške (GitHub).
- Store objava dolazi NAKON što web verzija dokaže točnost podataka — u trgovini je skuplje popravljati greške (review proces).

### Zajednička pravila za sve aplikacije

1. Svaki podatak ima vidljiv izvor i datum dohvata ("Podaci: gis.karlovac.hr, ažurirano 15.7.2026.").
2. Gumb "Prijavi grešku" → GitHub issue (predispunjen template) ili jednostavna forma.
3. Footer: AI-made oznaka + link na GitHub.
4. Bez praćenja korisnika; analitika samo privacy-friendly (Plausible/vlastiti brojač) ako uopće.
5. Mobile-first — većina publike je na mobitelu.

---

## Pohrana podataka (posebno: proračunske isplate)

**Problem:** na iTransparentnosti se objavljuje praktički svaki račun/isplata — naivno spremanje u glavni repo (jedan veliki JSON + dnevni commitovi) napuhalo bi git povijest do neupotrebljivosti.

**Rješenje — tri sloja:**

1. **Zasebni data repo (`pametni-karlovac-podaci`).** Sirovi podaci žive odvojeno od koda; git povijest glavnog repoa ostaje mala. Ako data repo ikad postane prevelik, može se "squashati" bez diranja koda.
2. **Particioniranje + kompresija.** Isplate po mjesecima: `isplate/2026/2026-07.csv.gz` (ili Parquet). Jedan zapis ≈ 150-250 B; i uz desetke tisuća isplata godišnje to je nekoliko MB nekomprimirano, ispod 1 MB gzipano po godini — daleko od GitHub limita (soft 1 GB repo, 100 MB/file). Ključno pravilo: **nikad ne prepisivati stare datoteke** (append-only po mjesecu) — git tada ne akumulira diffove.
3. **Agregati za aplikaciju.** Proračun aplikacija NE učitava sirove podatke, nego male precomputane JSON-ove (top primatelji po mjesecu, ukupno po kategoriji, vremenske serije po primatelju). Generira ih GitHub Action nakon svakog dohvata. Sirovi podaci služe za drill-down (lazy load pojedinog mjeseca) i kao javni arhiv.

Dodatno: dnevni dohvat radi u data repo (commit noise tamo ne smeta); u glavni repo ide samo osvježeni agregat. Ako ijedna datoteka ikad priraste prema 50 MB — prijeći na Cloudflare R2 (besplatnih 10 GB) i servirati podatke s CDN-a umjesto iz gita.

Bonus: data repo = **javni povijesni arhiv** — povijest isplata ostaje dostupna i ako izvor promijeni strukturu ili nestane.

---

## 1. Bus (prioritet #1)

**Problem:** Vozni red postoji na GIS portalu i kao PDF — oboje neupotrebljivo za baku na stanici.

**Rješenje:** Aplikacija koja odgovara na jedno pitanje: **"Kad mi ide bus?"** — u dva dodira.

**Publika:** umirovljenici, školarci, ljudi bez auta. Dizajn standard: veliki fontovi (20 px+), veliki gumbi, visoki kontrast, bez žargona.

**Ključne funkcije (MVP):**

- Odabir stanice (po imenu, s karte, ili "najbliža meni" uz geolokaciju) → sljedeći polasci s te stanice, veliko i jasno: "Linija 2 → Centar, za 7 min (14:32)"
- Pregled linije: sve stanice + vremena
- Radni dan / subota / nedjelja automatski prema današnjem datumu
- **Obavijesti o promjenama linija** (GIS ih objavljuje) — banner u aplikaciji kad postoji aktivna obavijest za odabranu liniju
- Cjenik kao statična stranica (mijenja se rijetko — trenutni vrijedi od 2024.; ručna promjena po potrebi)
- Radi offline nakon prvog učitavanja (PWA) — podaci su mali
- "Spremi moju stanicu" (localStorage, bez računa)

**Nije u MVP-u:** live GPS praćenje busova (nema izvora), kupnja karata, planiranje ruta s presjedanjem.

**Podaci — GIS ima strukturirani vozni red (ne treba PDF!):**

Potvrđeni URL-ovi (sve SPA — podatke dohvaćati preko internih API-ja, otkriti network tabom):

- `gis.karlovac.hr/module-feature/AutobusnaLinija/593` — detalji linije (ID 593 = primjer)
- `gis.karlovac.hr/thematic-map/bus-prijevoz/vozni-red/time/593/18.07.2026./` — vozni red linije za datum
- `gis.karlovac.hr/thematic-map/bus-prijevoz/vozni-red/593/18.07.2026./10:00` — polasci za datum/vrijeme
- `gis.karlovac.hr/thematic-map/bus-prijevoz` — karta linija i stanica (geopodaci)

Plan dohvata: (1) network-tab reverse engineering internih API-ja (browser session), (2) skripta koja enumerira sve ID-eve linija i povlači vozne redove + obavijesti, (3) normalizacija u GTFS-like JSON objavljen javno u data repou — prvi "otvoreni dataset" projekta. PDF s data.gov.hr služi samo kao kontrolna provjera točnosti.

**Rizik:** promjena voznog reda ili GIS strukture. Mitigacija: dnevni fetch s usporedbom (diff alarm), datum ažurnosti vidljiv u aplikaciji, ručna verifikacija kod promjene.

---

## 2. Proračun (prioritet #2)

**Problem:** Isplate iz gradskog proračuna javne su na transparentno.otvoreni.karlovac.hr, ali sučelje je tablica bez konteksta — nemoguće vidjeti trendove, usporedbe, ukupne slike.

**Rješenje:** Vizualni odgovor na pitanje: **"Kamo ide naš novac?"**

**Publika:** angažirani građani, novinari, vijećnici svih opcija.

**Ključne funkcije (MVP):**

- Mjesečni/godišnji pregled: ukupno isplaćeno, top primatelji (pravne osobe), po kategorijama
- Pretraga po primatelju: "koliko je tvrtka X dobila od Grada kroz vrijeme" (graf)
- Trendovi: usporedba mjesec/mjesec, godina/godina
- Svaka brojka klikabilna do razine pojedinačne isplate + link na izvor

**Tvrda pravila (etika):**

- Fizičke osobe (socijalna pomoć, stipendije...) → **samo agregati**, nikad imena. Automatski filter + ručna provjera prije objave.
- Bez editorijalnih ocjena ("sumnjivo", "previše") — samo podaci i usporedbe. Neutralne formulacije: "isplaćeno", "primatelj", "razdoblje".

**Faza 2:** povezivanje s DZS/pokazatelji.hr (kontekst: plaće, demografija), sudski registar (djelatnost tvrtki primatelja), DIP (izlaznost/rezultati — strogo činjenično), usporedba s drugim gradovima na platformi Otvoreno.

**Podaci:** interni API platforme Otvoreno (reverse-engineerati network tab; Libusoft SPA). Pohrana po strategiji gore: mjesečne gzipane particije u data repou + precomputani agregati za aplikaciju.

---

## 3. Događaji (prioritet #3)

**Problem:** Događaji su raspršeni: Kino Edison, Zorin dom, Zvjezdano ljeto, Advent, udruge, kafići — svatko objavljuje na svom webu/Facebooku.

**Rješenje:** **"Što se događa u Karlovcu ovaj vikend?"** — jedan kalendar za sve.

**Ključne funkcije (MVP):**

- Agregirani događaji iz 4-6 izvora (scraping na rasporedu): Kino Edison, Zorin dom, gradski portal/TZ Karlovac, sezonski (Zvjezdano ljeto, Advent)
- Filtri: danas / vikend / kategorija (glazba, film, djeca, sport)
- Svaki događaj linka na izvor (ne kopiramo cijele opise — samo naslov, vrijeme, mjesto, kratki sažetak)
- Dodaj u kalendar (ICS download)

**Proširenje — "Mjesta":** uz događaje, imenik gradskih mjesta: restorani i kafići, sportski tereni i objekti (postoji CSV "Sportski objekti" na data.gov.hr!), igrališta, kupališta. Statični podaci + karta; prirodno se veže s događajima ("gdje je ovaj koncert?"). Može biti tab unutar Događaja umjesto zasebne aplikacije.

**Faza 2:** login za organizatore (kafići, udruge) da sami dodaju događaje + moderacija. Tek kad MVP dokaže posjećenost — jedina komponenta koja traži backend/bazu i stalnu moderaciju. (Ide i u store kao mobilna aplikacija — vidi Capacitor plan gore.)

**Rizici:** scraperi su krhki; autorska prava na opise/slike (link + sažetak, ne kopija); kvaliteta ovisi o ažurnosti izvora.

---

## Redoslijed izgradnje

1. **Bus MVP (web/PWA)** — najveći impact/trud omjer, gradi povjerenje i brand
2. **Landing na root domeni** — misija + linkovi (pola dana posla)
3. **Proračun MVP** — nosi "transparentnost" misiju; prije builda postaviti data repo i pipeline
4. **Događaji MVP** — najzabavniji, ali najskuplji za održavanje
5. **Bus + Događaji u trgovine** (Capacitor) — kad web verzije dokažu točnost
6. **Faza 2 svega** — integracije (DZS, DIP...), login za organizatore, Mjesta
