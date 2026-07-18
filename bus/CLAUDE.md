# Bus · Pametni Karlovac — upute za Claude Code

Aplikacija za vozni red gradskih autobusa u Karlovcu. Jedino ključno pitanje: **"Kad mi ide bus?"** — odgovor u najviše 2 dodira (0 dodira ako korisnik ima spremljenu stanicu). Buduća domena: bus.pametnikarlovac.hr.

Vrijede sva pravila iz root `CLAUDE.md`. Ovdje su pravila specifična za Bus.

## Opseg

- Radi **isključivo u `bus/`**. Smiješ čitati `shared/` (tokeni, komponente) i `data/` (vozni redovi) — ne mijenjati ih. Treba li promjena tamo: zabilježi prijedlog u `bus/TODO.md`, ne diraj sam.
- Ne diraj `proracun/`, `dogadaji/`, `docs/`, `interno/`.

## Publika = dizajnerski zakon

Primarni korisnici: umirovljenici 65+ i školarci, jeftini Android telefoni, često na suncu. Svaka odluka prolazi **"baka test"**: može li baka od 75 g. sa slabijim vidom u 10 sekundi saznati kad joj ide bus? Ako ne — pojednostavi.

Tvrda UX pravila:

- Bazna veličina teksta **20 px**; "za X min" 32-36 px bold; ime stanice 24-28 px; tabular-nums za sva vremena.
- Dodirne mete min. **48×48 px**, razmaknute.
- **Bez hamburger menija.** Donja navigacija, točno 3 taba: Stanica / Linije / Info.
- Jedan stupac; ključni sadržaj stane na 360×640 bez scrollanja; bez modala i animacija gdje nisu nužni.
- Kontrast: AA minimum, AAA za tekst. Zlato `#D89F1F` nikad kao boja malog teksta na svijetloj podlozi.
- Hrvatski bez anglizama: "polazak", "stanica", "linija", "smjer". Rubna stanja prijateljski: "Nema više polazaka danas. Prvi sutra: 5:15."
- Postavka veličine teksta (Normalna/Velika/Najveća) mijenja cijelu aplikaciju odmah.

## Boje (iz shared/ tokena — ne hardkodiraj)

Primarna `#15404A`, pozadina `#FAF7F2`, CTA/akcent `#D89F1F`, sekundarna `#4D9397`, upozorenje `#E32213` (samo kritično: linija ne vozi), potvrda `#0D5736`.

## Tehnika

- Static build + **PWA**: radi offline nakon prvog učitavanja (service worker, podaci u cacheu). Bez backenda.
- **Capacitor-kompatibilno** od prvog dana (ide u Google Play/App Store): bez SSR runtimea, bez browser-only API-ja bez fallbacka, ikone do 512×512.
- Geolokacija ("Nađi najbližu stanicu"): opt-in na klik, s fallbackom na ručni odabir; nikad automatski zahtjev pri učitavanju.
- "Moja stanica": `localStorage`, bez računa.

## Podaci

- **Jedini izvor istine u runtimeu: statični JSON u `data/` (GTFS-like)** — vozni redovi, stanice, linije, obavijesti. Aplikacija NIKAD ne poziva gis.karlovac.hr u runtimeu; dohvat radi zasebna skripta/Action.
- Nikad ne hardkodiraj vremena/stanice u komponente — sve iz data filea. Demo podaci samo u fixture datotekama za dev/test, jasno označeni.
- Tip voznog reda (radni dan / subota / nedjelja i blagdan) određuje se automatski iz datuma — uključi HR blagdane.
- Na svakom ekranu s podacima: "Podaci: gis.karlovac.hr, ažurirano [datum iz data filea]".
- Obavijesti o promjenama linija: banner (zlatna pozadina) na ekranu stanice/linije kad postoji aktivna obavijest za tu liniju.
- Cjenik: statična stranica u Info tabu, podaci u zasebnom configu (mijenja se rijetko, ručno).

## Definition of done (prije svakog commita)

1. Baka test prolazi na svim promijenjenim ekranima (mentalno + screenshot pregled).
2. Build prolazi; PWA radi offline; Lighthouse accessibility ≥ 95.
3. Kontrast provjeren za nove kombinacije boja.
4. Svi stringovi na hrvatskom s ispravnom dijakritikom (bez mojibake/ćirilice).
5. Nema poziva vanjskih servisa u runtimeu (osim vlastitog CDN-a); nema trackinga.
6. Vremena se prikazuju iz data filea, ne iz koda.
