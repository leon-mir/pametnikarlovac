# Bus — TODO i prijedlozi

## Prijedlozi za `shared/` (mijenja samo root agent)

- [ ] **Boje linija (`--pk-line-1..8`)** — trenutno definirane lokalno u `bus/src/index.css` i
      `bus/tailwind.config.cjs`. Izvedene iz brand palete, sve podnose bijeli tekst; broj linije
      uvijek ide uz smjer tekstom (ne oslanja se samo na boju → daltonizam OK). Prijedlog: preseliti
      u `shared/tokens/tokens.css` + `tokens.json` kad ih zatreba i druga aplikacija, uz upis u
      `shared/CHANGELOG.md`. Vrijednosti:
      `#B81B0F #256066 #0D5736 #8A6408 #7A5142 #19515A #15404A #532B4E`.
- [ ] Provjeriti kontrast broja (bijeli) na svakoj boji linije (badge) — dokumentirati u matrici.

## Podaci

- [x] **Pipeline za dohvat radi** — `data/scripts/fetch-bus.mjs` dohvaća stvarni vozni red s
      gis.karlovac.hr. GitHub Action: `.github/workflows/bus-data.yml` (dnevno, piše u `data/bus/`).
- [x] **Aplikacija je na stvarnim podacima** (23 linije, 25 varijanti, 277 stajališta, `meta.isDemo:false`).
  - [x] **Model → eksplicitni polasci `departures`** po tipu dana, oba smjera zasebno (svaki smjer je
        u GIS-u zasebna linija s vlastitim voznim redom). `schedule.ts`/`types.ts` prepisani.
  - [x] **Varijante linija** (linija 4 = 3 trase) spojene pod jednu oznaku s `variants` + biračem trase.
  - [x] **Trasa po cesti** iz `the_geom` (zaseban `geometry.json`, učitava ga samo karta).
  - [x] **Obavijesti** iz `privremena_regulacija` (banner grupira linije s istim tekstom).
  - [x] **Boje** iz GIS `boja_linije` (indeks → pristupačan hex; broj se uvijek ispisuje).
- [ ] HR blagdani: dodati godine osim 2026. u `data/bus/holidays.json` (Uskrs/Tijelovo pomični).
- [ ] Cjenik: dohvatiti str. 3–4 službenog PDF-a (učeničke/studentske i umirovljeničke mjesečne karte)
      i dopuniti `data/bus/prices.json`.

## Logo

- [x] Službeni logo (`shared/pametni_karlovac_logo.png`) — ikone/favicon iz brand marke,
      lockup na Info ekranu.
- [x] Zaglavlje: prava brend marka (`shared/logo-mark.png` → `bus/public/logo-mark.png`) na bijeloj
      pločici (dark header). Zamijenila zlatnu SVG Zvijezdu.
- [ ] Marka je 300 KB PNG — predložiti optimiziranu/SVG verziju u `shared/` za manji header asset.

## Aplikacija

- [ ] Offline banner ("Prikazujem spremljene podatke" + datum) kad nema mreže (design-system §
      Interakcija i stanja).
- [ ] "Prijavi grešku" → predispunjeni GitHub issue umjesto mailto (arhitektura.md).
- [ ] Lighthouse accessibility ≥ 95 provjera u CI-ju; test layouta na `data-textsize="najveca"`.
- [ ] Capacitor omot (android/ios) — tek nakon što web verzija dokaže točnost podataka.
- [ ] Sitemap.xml + Open Graph slika za dijeljenje.
