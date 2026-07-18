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
      gis.karlovac.hr (24 linije, 171 stajalište). Uzorak: `data/bus/samples/*.real.json`.
      GitHub Action: `.github/workflows/bus-data.yml`.
- [ ] **Prebaciti aplikaciju na stvarne podatke** (dok se ne dovrši, ostaje demo). Prije toga:
  - [ ] **Model voznog reda → eksplicitni polasci.** Stvarni polasci su nepravilni (npr. linija
        102: 10:00, 11:00, 16:00, 17:00), a app trenutno pretpostavlja fiksni razmak
        (`first/last/headway`). Prijeći na `departures` (popis), ažurirati `schedule.ts`,
        `types.ts`, i UI ("svakih X min" → bez toga / "X polazaka"). Regenerirati demo u istom
        formatu ili odmah ići na stvarne.
  - [ ] **Varijante linija** (npr. linija 4 ima 522/635/701) — spojiti/označiti, ne kao zasebne.
  - [ ] Potvrditi potpunost liste linija (usporedba s PDF-om s data.gov.hr) i uparivanje smjerova.
  - [ ] Kad je gotovo: `meta.isDemo: false`, maknuti "prototip s demo podacima".
- [ ] HR blagdani: dodati godine osim 2026. u `data/bus/holidays.json` (Uskrs/Tijelovo pomični).

## Logo

- [x] Službeni logo (`shared/pametni_karlovac_logo.png`) — ikone/favicon iz brand marke,
      lockup na Info ekranu.
- [ ] Bijela/monokromatska varijanta marke za tamno zaglavlje (sad je zlatna SVG Zvijezda —
      isti motiv, radi na tamnom). Predložiti dodavanje u `shared/`.

## Aplikacija

- [ ] Offline banner ("Prikazujem spremljene podatke" + datum) kad nema mreže (design-system §
      Interakcija i stanja).
- [ ] "Prijavi grešku" → predispunjeni GitHub issue umjesto mailto (arhitektura.md).
- [ ] Lighthouse accessibility ≥ 95 provjera u CI-ju; test layouta na `data-textsize="najveca"`.
- [ ] Capacitor omot (android/ios) — tek nakon što web verzija dokaže točnost podataka.
- [ ] Sitemap.xml + Open Graph slika za dijeljenje.
