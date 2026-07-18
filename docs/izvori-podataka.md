# Izvori podataka

Status: provjereno 18.7.2026. Legenda: ✅ potvrđeno dostupno · 🔍 treba istražiti format/API · 📄 postoji, ali nestrukturirano

## Primarni izvori (za prve tri aplikacije)

| Izvor | URL | Format | Napomena |
|---|---|---|---|
| ✅ GIS Karlovac — bus linije, stanice | gis.karlovac.hr/thematic-map/bus-prijevoz | JS aplikacija, interni API 🔍 | Geopodaci linija i stanica |
| ✅ GIS Karlovac — vozni red (strukturiran!) | vidi URL-ove ispod | SPA, interni API 🔍 | Primarni izvor vremena — PDF ne treba |
| ✅ GIS Karlovac — obavijesti o promjenama linija | unutar bus modula na GIS-u | SPA 🔍 | Za banner upozorenja u Bus aplikaciji |
| ✅ Gradski vozni red (PDF) | data.gov.hr → dataset "Autobusne linije" | PDF (ažuriran 7.4.2026.) | Samo kontrolna provjera točnosti |
| ✅ Cjenik prijevoza | gis/službene stranice prijevoznika | statično | Rijetko se mijenja (isti od 2024.) — držati kao config |
| ✅ iTransparentnost — isplate | transparentno.otvoreni.karlovac.hr/hr/isplate/sc-isplate | Libusoft SPA, interni API 🔍 | Osnova Proračun aplikacije; pohrana u zasebni data repo |
| 📄 Kino Edison, Zorin dom, TZ Karlovac | webovi pojedinih ustanova | HTML scraping | Osnova Događaji aplikacije |
| 📄 Restorani, kafići, sportski tereni | razni izvori + CSV "Sportski objekti" (data.gov.hr) | mješovito | Za "Mjesta" proširenje Događaja |

### GIS vozni red — potvrđeni URL obrasci (primjer: linija ID 593)

```
gis.karlovac.hr/module-feature/AutobusnaLinija/593
gis.karlovac.hr/thematic-map/bus-prijevoz/vozni-red/time/593/18.07.2026./
gis.karlovac.hr/thematic-map/bus-prijevoz/vozni-red/593/18.07.2026./10:00
```

Stranice su klijentski renderirane (fetch vraća prazan shell) — podatke dohvaćati preko internih API-ja koje treba otkriti u browser network tabu, zatim skriptom enumerirati sve ID-eve linija.

## Grad Karlovac na data.gov.hr (✅ 22 dataseta, Otvorena dozvola)

Provjereno API-jem (`data.gov.hr/ckan/api/3/action/package_search?q=karlovac`). Najkorisniji:

- **Autobusne linije** — GIS link + PDF vozni red
- **Proračun Grada Karlovca** (2025, 2026)
- **Transparentan uvid u poslovanje** — link na iTransparentnost
- **Potpore poduzetnicima** 2020-2025 (DOCX — parsirati)
- **Ugovori, bespovratna sredstva, sponzorstva, donacije**
- **Trgovačka društva u vlasništvu Grada** (XLSX, s podacima o proračunu)
- **Strateški dokumenti** (10 PDF-ova: Plan razvoja, Provedbeni program 2025-2029, Plan upravljanja Zvijezdom, energetski planovi...)
- **Adresar obrazovnih ustanova** (XLSX), **Sportski objekti** (CSV)
- Komunalno: dimnjačar, kućni ljubimci, otpad i reciklažna dvorišta, ambrozija/deratizacija

CKAN API omogućuje automatsko praćenje novih datasetova — vrijedi postaviti tjedni check.

## Nacionalni izvori (faza 2)

| Izvor | Što nudi | Napomena |
|---|---|---|
| 🔍 DZS (dzs.gov.hr) | Demografija, plaće, gospodarstvo po JLS | Ima open data / STAT baze; provjeriti API |
| 🔍 pokazatelji.hr | Agregirani pokazatelji JLS-ova, usporedbe gradova | Provjeriti uvjete korištenja/preuzimanja |
| 🔍 DIP (izbori.hr) | Rezultati izbora i izlaznost po biračkim mjestima | Strogo činjenični prikaz, bez interpretacija |
| 🔍 Sudski registar / FINA | Podaci o tvrtkama (djelatnost, financije) | Za kontekst primatelja isplata; provjeriti uvjete |
| 🔍 Registar neprofitnih organizacija | Udruge primatelji sredstava | Ministarstvo financija |
| 🔍 EU fondovi (strukturnifondovi.hr) | Projekti financirani u Karlovcu | |

## Potencijalni budući izvori (ideje)

- Kvaliteta zraka (haw.hr / EEA senzori), vodostaji rijeka (DHMZ hidro — relevantno: poplave!), pelud/ambrozija (ZZJZ KŽ)
- Gradske sjednice i akti (glasnik, e-sjednice) — tko je što izglasao
- Javna nabava (EOJN) — natječaji Grada i gradskih tvrtki
- Red vožnje HŽ/Arriva za međugradske veze

## Pravila korištenja izvora

1. Prije scrapinga provjeriti uvjete korištenja i robots.txt; scrapati obzirno (rasporedom, ne agresivno).
2. Sve dohvaćeno keširati u `data/` u repou — javni povijesni arhiv.
3. Uvijek navoditi izvor i datum dohvata.
4. Kod prvog kontakta s Gradom: predstaviti projekt i zamoliti strukturirane formate (GTFS, CSV) — olakšava svima.
