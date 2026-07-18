# Design system — Pametni Karlovac

Vrijedi za pametnikarlovac.hr i sve poddomene (bus. / proracun. / dogadaji.). Ovo je **izvor istine za sav UI**; agenti u aplikacijama ne smiju odstupati bez izmjene ovog dokumenta (izmjene samo iz roota).

## Kako koristiti u kodu

1. Importaj `shared/tokens/tokens.css` (CSS varijable + bazna pravila fokusa/motiona).
2. Na `<html>` postavi aplikaciju: `<html lang="hr" data-app="bus">` (`bus` | `proracun` | `dogadaji` | `hub`). Time se postavlja akcentna boja aplikacije.
3. Korisnička veličina teksta: `data-textsize="normalna" | "velika" | "najveca"` na `<html>` — skalira cijelu tipografsku skalu.
4. Tailwind: `presets: [require('../shared/tokens/tailwind-preset.cjs')]` — koristi klase (`bg-primary`, `text-accent-text`...), **nikad sirove hexove u komponentama**.
5. Machine-readable tokeni: `shared/tokens/tokens.json`.

## Načela

1. **Baka test.** Svaki ekran mora proći: osoba 75+, slabiji vid, sunce, prvi put u aplikaciji — razumije za 10 sekundi.
2. **Radikalna jednostavnost.** Jedan stupac, jedna primarna radnja po ekranu, max 3 taba navigacije.
3. **Podatak s porijeklom.** Uz svaki podatak izvor i datum; uz svaku boju identiteta — mjesto u gradu s kojeg dolazi.
4. **Neutralnost.** UI nikad ne sugerira ocjenu (posebno Proračun): neutralne boje za iznose, bez emotivnih ikona uz podatke.
5. **Pristupačnost nije opcija.** WCAG AA minimum svugdje, AAA za tekst gdje god je moguće.

## Boje

### Brand paleta (sve s pravih mjesta u Karlovcu)

| Token | HEX | Porijeklo | Smije se koristiti za |
|---|---|---|---|
| `primary` | `#15404A` | prosjek 4 rijeke (Korana, Kupa, Mrežnica, Dobra s Google Mapsa) | tekst, headeri, primarni gumbi, ikone |
| `bg` | `#FAF7F2` | topla bijela | pozadina stranica |
| `surface` | `#FFFFFF` | — | kartice, povišene plohe |
| `gold` | `#D89F1F` | križ tornja crkve sv. Trojstva | CTA plohe, akcenti, badge linija — **nikad mali tekst na svijetlom** |
| `gold-text` | `#8A6408` | (izvedena iz gold) | zlatni tekst na svijetloj podlozi kad baš treba |
| `patina` | `#4D9397` | zvonik crkve sv. Trojstva | dekoracija, veliki elementi, ilustracije |
| `patina-strong` | `#256066` | (izvedena iz patine) | patina tekst/linkovi i solid gumbi (bijeli tekst na njoj) |
| `roof` | `#9C6D5A` | krovovi u Zvijezdi | dekoracija, veliki elementi |
| `roof-strong` | `#7A5142` | (izvedena iz roof) | krovovi kao tekst / solid plohe |
| `danger` | `#E32213` | crvena s gradskog grba | veliki indikatori, ikone upozorenja |
| `danger-strong` | `#B81B0F` | (izvedena) | tekst upozorenja i solid danger gumbi |
| `success` | `#0D5736` | zelena s gradskog grba | tekst i plohe potvrde |
| `river-korana` `#09313A` · `river-kupa` `#19424A` · `river-mreznica` `#193D48` · `river-dobra` `#19515A` | | 4 rijeke | sekvencijalne skale u grafovima, pozadinski patterni |

### Semantičke uloge

| Uloga | Token | Vrijednost |
|---|---|---|
| Tekst | `text` | `primary` |
| Prigušeni tekst | `text-muted` | `#5C6B70` (5.2:1 na bg) |
| Tekst na tamnom | `text-inverse` | `#FFFFFF` |
| Suptilni rub (dekorativni) | `border-subtle` | `#E7E0D5` |
| Rub inputa/interaktivnog | `border-strong` | `#5C6B70` |
| Fokus prsten | `focus` | `gold`, 3 px, offset 2 px |
| Akcent aplikacije | `accent` / `accent-text` / `accent-contrast` | po `data-app`, vidi dolje |

### Akcent po aplikaciji (`data-app`)

| App | `accent` | `accent-text` | `accent-contrast` (tekst na akcentu) |
|---|---|---|---|
| `hub` (root landing) | `gold` | `gold-text` | `primary` |
| `bus` | `gold` | `gold-text` | `primary` |
| `proracun` | `patina` | `patina-strong` | `#FFFFFF` na `patina-strong` plohama |
| `dogadaji` | `roof` | `roof-strong` | `#FFFFFF` na `roof-strong` plohama |

### Provjerena kontrast matrica (izračunato, ne procijenjeno)

Dozvoljene kombinacije za tekst:

| Kombinacija | Omjer | Status |
|---|---|---|
| `primary` na `bg` | 10.5:1 | AAA ✓ |
| bijela na `primary` | 11.3:1 | AAA ✓ |
| `primary` na `gold` (CTA) | 4.8:1 | AA ✓ |
| `gold` na `primary` | 4.8:1 | AA ✓ |
| `patina-strong` na `bg` | 6.7:1 | AA ✓ |
| bijela na `patina-strong` | 7.2:1 | AAA ✓ |
| `roof-strong` na `bg` | 6.4:1 | AA ✓ |
| `danger-strong` na `bg` | 6.1:1 | AA ✓ |
| bijela na `danger-strong` | 6.6:1 | AA ✓ |
| `success` na `bg` | 8.1:1 | AAA ✓ |
| bijela na `success` | 8.6:1 | AAA ✓ |
| `text-muted` na `bg` | 5.2:1 | AA ✓ |

**Zabranjeno za mali tekst (< 24 px):** `gold` na `bg` (2.2:1), `patina` na `bg` (3.3:1), `roof` na `bg` (4.1:1), `danger` na `bg` (4.4:1), bijela na `patina` (3.6:1). Te kombinacije smiju samo za velike naslove (≥ 24 px bold) ili netekstualne elemente uz 3:1.

### Grafovi i vizualizacija podataka (primarno Proračun)

- **Kategorijske serije (do 4):** `primary`, `patina`, `gold`, `roof` — vizualno razlučive. Preko 4 kategorije: grupiraj u "Ostalo".
- **Sekvencijalne skale / heatmape:** 4 riječne nijanse (prirodan tamno-svijetli ramp) + `bg`.
- Nikad crveno/zeleno kao jedini nositelj značenja (daltonizam) — uvijek + oznaka/ikona/pattern.
- Iznosi u Proračunu su **neutralni** (`primary`/`text-muted`); `danger`/`success` samo za tehnička stanja (greška dohvata, potvrda), ne za "puno/malo novca".
- Svaki graf: naslov = pitanje ("Kome je Grad platio najviše u lipnju?"), legenda, izvor + datum ispod, os od nule.

## Tipografija

Font: **Manrope** (fallback Inter, system-ui). Težine: 400, 600 (naglasci), 800 (brojke/naslovi). Sva vremena i iznosi: `font-variant-numeric: tabular-nums`.

| Token | Veličina (× skala) | Upotreba |
|---|---|---|
| `fs-mega` | 40 px | Bus "za 7 min", najveća brojka ekrana |
| `fs-display` | 32 px | glavni naslov ekrana, veliki iznosi |
| `fs-h1` | 28 px | naslov sekcije / ime stanice |
| `fs-h2` | 24 px | podnaslovi, kartice naslovi |
| `fs-h3` | 22 px | manji podnaslovi |
| `fs-body-lg` | 20 px | **bazni tekst u Bus aplikaciji** |
| `fs-body` | 18 px | bazni tekst (Proračun, Događaji, hub) — apsolutni minimum za UI tekst |
| `fs-caption` | 16 px | samo sporedno: izvor podataka, footer (nikad ključne informacije) |

Korisnička skala (`data-textsize`): `normalna` ×1.0 · `velika` ×1.15 · `najveca` ×1.3. Layout mora podnijeti ×1.3 bez loma (testirati!). Visina retka: 1.5 za tekst, 1.2 za naslove i brojke.

## Razmaci, oblici, elevacija

- **Grid 4 px.** Skala: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 (`space-1..8`). Padding ekrana: 16 px mobilno, 24 px ≥ 768 px.
- **Radijusi:** `sm` 8 (inputi, badge), `md` 12 (gumbi, kartice), `lg` 16 (modali, hero), `full` (krug linije, pill).
- **Sjena:** jedna jedina — `0 1px 3px rgba(21,64,74,.12)` za kartice; bez slojevitih sjena.
- **Dodirne mete:** min 48×48 px, razmak min 8 px.
- **Max širina sadržaja:** 480 px (aplikacijski ekrani, centrirano); 960 px za tablice/grafove u Proračunu.
- **Z-index:** sadržaj 0 · sticky header 50 · donja navigacija 100 · banner 200 · toast 300.
- **Breakpointi:** mobile-first; 768 px (tablet), 1024 px (desktop). Sve mora biti savršeno na 360×640.

## Komponente (spec)

**Gumb** — visina min 48 px, radius `md`, font 600, tekst min `fs-body`.
- *Primarni:* pozadina `accent` (bus/hub: `gold` + `primary` tekst; proračun/događaji: `-strong` varijanta + bijeli tekst).
- *Sekundarni:* obrub 2 px `primary`, tekst `primary`, transparentna pozadina.
- *Tercijarni (link):* tekst `accent-text`, podcrtano.
- Stanja: hover (10 % tamnije), active (pritisnut, scale .98), disabled (40 % opacity + `cursor: not-allowed`), loading (spinner unutar gumba, tekst ostaje).

**Badge linije (Bus)** — krug min 44 px, pozadina `gold`, broj `primary` 800; uz njega uvijek smjer tekstom.

**Kartica** — `surface`, radius `md`, sjena, padding 16; cijela kartica klikabilna ako vodi dalje (ne samo mala strelica).

**Donja navigacija** — max 3 taba, ikona 24 px + labela `fs-caption` (nikad samo ikona); aktivni tab: `accent` indikator + 800 težina; visina min 64 px + safe-area inset.

**Header** — `primary` pozadina, bijeli tekst; logo zvijezda + naziv aplikacije; bez akcija osim eventualnog "natrag".

**Baneri** — puna širina, radius `md`, ikona + tekst + (opcijski) link "Detalji":
- *Info:* `patina-strong` pozadina, bijeli tekst.
- *Upozorenje (promjena linije, stari podaci):* `gold` pozadina, `primary` tekst.
- *Kritično (ne vozi / nema podataka):* `danger-strong` pozadina, bijeli tekst.

**Input / pretraga** — visina 56 px, `fs-body-lg`, rub `border-strong` 2 px, radius `sm`; placeholder nije jedina uputa (labela iznad); ikona lupe + gumb "očisti".

**Segmented control** (npr. smjer A↔B, radni dan/subota/nedjelja) — 2-3 segmenta max, aktivni = `primary` pozadina + bijeli tekst, min visina 48 px.

**Lista polazaka (Bus)** — redak: badge linije · smjer (`fs-body-lg`) · desno "za X min" (`fs-mega` ako je prvi, inače `fs-h2` 800) + točno vrijeme `text-muted`; separator `border-subtle`.

**Empty / error stanja** — ilustracija (linijska, brand), naslov `fs-h2`, prijateljski tekst, akcija. Nikad prazan bijeli ekran; nikad tehnički žargon ("Greška 404" → "Ova stranica ne postoji. Vrati se na početnu.").

**Toast/potvrda** — `success` pozadina, bijeli tekst, 3 s, dno iznad navigacije ("Stanica spremljena ✓").

**Tablica podataka (Proračun)** — zebra redovi (`bg`/`surface`), header sticky, iznosi desno poravnati tabular-nums, na mobilnom se pretvara u kartice.

**Footer (obavezan, identičan svugdje)** — `fs-caption`, `text-muted`: "🤖 Izrađeno uz pomoć AI-a · [otvoreni kod na GitHubu](link) · pametnikarlovac.hr" + izvor i datum podataka aplikacije.

## Interakcija i stanja

- **Fokus:** vidljiv uvijek — 3 px `gold` outline, offset 2 px (na tamnom: bijeli). Tab-redoslijed logičan.
- **Loading:** skeleton plohe (ne spinneri preko cijelog ekrana); ako > 3 s, tekst "Učitavam vozni red...".
- **Offline (PWA):** tihi banner "Prikazujem spremljene podatke" + datum; aplikacija nikad ne izgleda pokvareno bez mreže.
- **Animacije:** samo funkcionalne (prijelaz taba, toast), 150-200 ms; `prefers-reduced-motion: reduce` → sve isključeno (u tokens.css).
- **Geste:** ništa ne ovisi samo o gesti (swipe je uvijek i gumb).

## Pristupačnost — checklist po ekranu

1. Kontrast po matrici gore (nove kombinacije preračunati — vidi skriptu u tokens.json opisu).
2. `lang="hr"`, semantički HTML (nav/main/h1...), landmark po ekranu.
3. Sve interaktivno dostupno tipkovnicom; fokus vidljiv.
4. Slike/ikone: alt ili `aria-hidden` + tekstualna labela.
5. Layout preživi `data-textsize="najveca"` (×1.3) i 200 % browser zoom.
6. Touch mete 48 px; bez informacije prenesene samo bojom.

## UI tekstovi i formati (hr-HR)

- Ton: prijateljski, konkretan, bez birokratskog i bez anglizama. "Kad ti ide bus?", ne "Pregled polazaka JGP-a". Obraćanje na "ti" (toplo ali s poštovanjem), osim pravnih tekstova.
- Vrijeme: 24-satno, `14:32`; relativno: "za 7 min", "upravo kreće"; datum: `18.7.2026.`
- Valuta (Proračun): `1.234,56 €` (hr-HR separatori); velike brojke skraćene uz punu na hover/klik: "2,4 mil. €".
- Dijakritika obavezna svugdje (č ć đ š ž) — provjeriti da nema mojibake/ćirilice prije commita.
- Datum ažurnosti podataka na svakom ekranu s podacima.

## Specifičnosti po aplikaciji

- **Bus:** baza `fs-body-lg` (20 px); sve optimizirano za sunce (visoki kontrast, bez sivih tonova za bitno); navigacija: Stanica / Linije / Info.
- **Proračun:** baza `fs-body`; max širina 960 px za grafove; neutralnost iznosa (nikad crveno/zeleno za "puno/malo"); svaka brojka klikabilna do izvora.
- **Događaji:** baza `fs-body`; kartice s datumom istaknuto (dan velikim); kategorije boje ne uvodimo — kategorija je tekstualni badge (`primary` obrub).
- **Hub (root):** landing, 3 velike kartice aplikacija s akcentom svake.

## Governance

- Promjene tokena i ovog dokumenta: **samo iz root agenta**, uz zapis u `shared/CHANGELOG.md`.
- Novi token tek kad se isti stil ponovi 3×; prije toga koristi postojeće.
- Svaka nova kombinacija boja teksta: obavezno izračunati kontrast (WCAG relativna luminancija) i upisati u matricu.
