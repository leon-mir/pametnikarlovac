# Bus · Pametni Karlovac

**Kad mi ide bus?** — vozni red gradskih autobusa u Karlovcu, veliko i jasno, radi offline.
Odgovor u najviše 2 dodira (0 ako je stanica spremljena). Buduća domena: bus.pametnikarlovac.hr.

Dizajniran za umirovljenike 65+ i školarce na jeftinim Android telefonima: bazni tekst 20 px,
dodirne mete ≥ 48 px, visoki kontrast, hrvatski bez anglizama, bez trackinga, bez računa.

## Stack

- **Vite + React + TypeScript + Tailwind** — statični SPA (bez backenda, bez SSR-a).
- **PWA** (`vite-plugin-pwa`) — instalabilno, radi offline nakon prvog učitavanja.
- **Capacitor-kompatibilno** — relativni `base`, bez server-only ovisnosti, ide u Google Play /
  App Store bez dupliciranja koda.
- Karta: **Leaflet + OpenStreetMap**, učitava se lijeno (manji početni bundle).
- Font **Manrope** self-hosted (offline, latin + latin-ext za hrvatsku dijakritiku).
- Dizajn tokeni iz `../shared` (boje s pravih mjesta u Karlovcu, provjerena kontrast matrica).

## Podaci

Aplikacija čita **isključivo** kanonski dataset u [`../data/bus/`](../data/bus/) (GTFS-slično),
uvezen u bundle preko aliasa `@data`. Nikad ne poziva gis.karlovac.hr u runtimeu; osvježavanje
radi zasebna skripta/Action → redeploy. **Trenutno: demo podaci** (`meta.json → isDemo`).

## Razvoj

```bash
npm install
npm run dev        # razvojni server
npm run build      # tsc --noEmit && vite build → dist/
npm run preview    # posluži build lokalno
```

## Struktura

```
src/
  lib/        types, data (loader), schedule (čista logika), dates, store, icons
  state/      AppState (globalno stanje + router)
  components/ Header (+ chip voznog reda), TabBar, zajedničke komponente
  screens/    Home, Station, Lines, Line, Trip, Info, Map (lazy)
public/       ikone (PWA), font, favicon, robots.txt
```

Ekrani (3 taba, bez hamburgera): **Stanica** / **Linije** / **Info**. Vozni red (radni /
subota / nedjelja+blagdan) bira se automatski iz datuma; može se ručno promijeniti chipom u
zaglavlju. "Moja stanica" i spremljeno putovanje čuvaju se u `localStorage`.

Vidi [`CLAUDE.md`](./CLAUDE.md) za pravila i [`TODO.md`](./TODO.md) za sljedeće korake.

🤖 Izrađeno uz pomoć AI-a · otvoreni kod na GitHubu · pametnikarlovac.hr
