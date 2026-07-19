# Transparentnost — koncept aplikacije

Status: nacrt, 19.7.2026. · Poddomena: `transparentnost.pametnikarlovac.hr`

> Ovaj dokument objedinjuje raniju "Proračun" ideju u širu aplikaciju **Transparentnost**. Umjesto samo isplata Grada, aplikacija prikazuje isplate **Grada Karlovca I svih gradskih trgovačkih društava** na jednom mjestu — što nijedan postojeći portal ne nudi.

## 1. Cilj i pozicija

Uzeti isplate koje su već javne, ali razbacane po odvojenim portalima (Grad na svom, svaka tvrtka na svom) i nečitljive (gola stavka bez konteksta), pa ih:

1. **objediniti** — svi subjekti, jedno pretraživo mjesto;
2. **arhivirati** — vlastiti povijesni arhiv od 1.1.2025. nadalje (izvori pokazuju samo ograničen period / bez zbroja kroz vrijeme);
3. **učiniti čitljivima** — činjenična klasifikacija u građaninu razumljive kategorije + kratak činjenični opis primatelja.

Prava dodana vrijednost nije još jedan dashboard, nego **agregacija + arhiv + čitljivost**. Sve ostalo (grafovi, filtri) je posljedica dobrog modela podataka.

### Odnos prema ranijoj "Proračun" aplikaciji

Ranije planirani `proracun.` folder/app **postaje dio Transparentnosti** (Grad je samo jedan od subjekata). Prije razvoja: odlučiti hoće li se `proracun/` folder preimenovati u `transparentnost/` ili se Transparentnost gradi kao novi app koji apsorbira opseg Proračuna. Preporuka: jedan app `transparentnost/`, subjekt "Grad Karlovac" + subjekti "gradske tvrtke".

## 2. Izvori podataka

Svi izvori su na Libusoftovoj platformi **OtvoreniGrad / iTransparentnost** (ista obitelj kao Osijek, Pag, Pregrada). To je ključno: vrlo vjerojatno **jedna API struktura** (`/isplate/sc-isplate`) pokriva Grad i sve tvrtke, pa je dovoljan jedan scraper s listom instanci.

| Subjekt | Portal | Platforma | Status |
|---|---|---|---|
| Grad Karlovac | transparentno.otvoreni.karlovac.hr | iTransparentnost (Libusoft) | ✅ potvrđen, ruta `/hr/isplate/sc-isplate` |
| Vodovod i kanalizacija (VIK) | transparentnost.vik-ka.hr | OtvoreniGrad2 | ✅ potvrđen (sortirati po najnovijem) |
| Čistoća d.o.o. | 🔍 provjeriti (cistocaka.hr?) | vjer. OtvoreniGrad2 | 🔍 |
| Zelenilo d.o.o. | 🔍 provjeriti | vjer. OtvoreniGrad2 | 🔍 |
| Gradska toplana d.o.o. | 🔍 provjeriti | vjer. OtvoreniGrad2 | 🔍 |
| Inkasator d.o.o. | 🔍 provjeriti | vjer. OtvoreniGrad2 | 🔍 |
| Hostel Karlovac d.o.o. | 🔍 provjeriti | vjer. OtvoreniGrad2 | 🔍 |

Popis gradskih tvrtki potvrditi iz službenog izvora (karlovac.hr/kontakti/gradske-tvrtke-i-ustanove) i dataseta "Trgovačka društva u vlasništvu Grada" na data.gov.hr. Za svaku tvrtku utvrditi ima li transparentnost portal i koju platformu koristi.

### Sljedeći tehnički korak: otkrivanje API-ja

Portali su SPA (fetch vraća prazan shell). U browser network tabu otkriti interni JSON endpoint iza `/isplate/sc-isplate` (parametri: subjekt, raspon datuma, stranica, sort). Kad se potvrdi da je isti oblik na obje instance (otvorenigrad + OtvoreniGrad2), scraper je zajednički.

## 3. Arhitektura

Static-first, u skladu s root CLAUDE.md: bez backenda, podaci se osvježavaju GitHub Actionsima, ne u runtimeu.

**Backfill (jednokratno).** Za svaki subjekt enumerirati sve isplate 1.1.2025.→danas, normalizirati u kanonsku shemu, spremiti u zaseban repo `pametni-karlovac-podaci` (sirovi + agregirani JSON/CSV). Ovaj repo je javni povijesni arhiv.

**Dnevno praćenje (GitHub Action).** Za svaki subjekt sortirati silazno po datumu i povlačiti dok se ne naiđe na već pohranjeni ID (upravo ono što VIK portal zahtijeva). Novi zapisi se dodaju, pokreće se klasifikacija samo za nove, rebuilda se static site.

**Build.** Aplikacija čita statične JSON/CSV iz data repoa i generira stranice. Ostaje Capacitor-kompatibilno (bez SSR runtimea).

## 4. Kanonski model isplate

Jedan zapis isplate, ujednačen preko svih subjekata:

```
id                 stabilan ID (subjekt + izvorni ID)
subjekt            "Grad Karlovac" | "VIK d.o.o." | ...
datum              datum isplate
iznos              EUR
primatelj_naziv    naziv iz izvora
primatelj_oib      OIB ako postoji u izvoru
opis_izvor         opis stavke iz izvora (nepromijenjen)
eko_klasifikacija  proračunska/ekonomska šifra iz izvora (ako postoji)
izvor_url          link na izvornu stavku
dohvat_datum       kad smo dohvatili
--- obogaćeno (AI/registri), jasno odvojeno ---
kategorija         naša taksonomija (v. §5)
kategorija_conf    pouzdanost klasifikacije
primatelj_opis     činjenični opis primatelja (v. §6)
primatelj_djelatnost NKD iz registra
klasifikacija_ver  verzija prompta/pravila za reproducibilnost
```

Izvorna polja su autoritativna; obogaćena polja su jasno označena kao naša izvedenica (v. §7).

## 5. Klasifikacija — dvije razine

**Razina A — izvorna (autoritativna).** Ekonomska/proračunska klasifikacija koja već postoji u izvoru (npr. skupine 32 materijalni rashodi, 323 usluge, 42 nabava nefinancijske imovine). Samo je izložimo i po njoj filtriramo.

**Razina B — naša čitljiva taksonomija (AI-izvedena).** ~15–20 kategorija koje prosječan građanin razumije, mapiranih iz naziva primatelja + opisa + izvorne šifre. Prijedlog početnog skupa:

Ceste i održavanje · Komunalije i energija · Voda i odvodnja · Gradnja i infrastruktura · IT i softver · Uredsko i administracija · Pravne i konzultantske usluge · Promidžba i mediji · Sport i udruge · Kultura i događanja · Obrazovanje · Socijala i pomoći · Zdravstvo · Prijevoz · Financijski rashodi (kamate, naknade) · Ostalo/neklasificirano

Pravila taksonomije: mali i stabilan skup; svaka klasifikacija sprema `kategorija_conf` i `klasifikacija_ver`; niska pouzdanost → "neklasificirano" (radije prazno nego pogrešno); ispravke idu preko GitHub issuea/PR-a; kategorije se dokumentiraju javno.

## 6. Obogaćivanje primatelja

Za **pravne osobe** (tvrtke, udruge — legitiman javni interes) dodajemo kratak činjenični opis: puni naziv, djelatnost (NKD), sjedište — iz sudskog registra / registra neprofitnih po OIB-u. Primjer: „VIK d.o.o. — gradska tvrtka za javnu vodoopskrbu i odvodnju, Karlovac."

Za **fizičke osobe**: nikad ime ni opis pojedinca (rule #1). Samo agregat po kategoriji/mjesecu (npr. "socijalne pomoći, srpanj 2025., ukupno X EUR"). Ovo se rješava već na razini modela — imena fizičkih osoba se ne pohranjuju ni ne prikazuju, čak i ako su u izvoru.

## 7. Tvrda pravila neutralnosti (za AI tekst)

Ovo je najosjetljiviji dio i izravno ovisi o rule #2 (CLAUDE.md) i `interno/01` ("ne komentiramo, ne interpretiramo").

**Dozvoljeno (činjenično obogaćivanje):**
- klasifikacija u kategoriju;
- činjeničan opis primatelja i djelatnost iz registra;
- agregati i zbrojevi (bez ocjene).

**Zabranjeno (evaluacija):**
- pridjevi/sudovi: "visok", "velik", "sumnjiv", "sporan", "opet";
- implikacije nepravilnosti bilo koje vrste;
- usporedbe uokvirene kao dobro/loše;
- statistički "flagovi" tipa "anomalija" (implicira sud) — svjesno izostavljeno.

**Označavanje.** Svako AI/izvedeno polje vizualno je odvojeno od izvornog podatka, nosi oznaku „🤖 AI-klasifikacija", link na metodologiju i „prijavi grešku". Cilj: korisnik uvijek zna što je izvorni podatak, a što naša izvedenica.

## 8. Funkcije weba (sve neutralne)

- **Objedinjeno pretraživanje** po primatelju kroz sve subjekte (koliko je tko ukupno primio od Grada + svih tvrtki).
- **Filtri**: subjekt, kategorija, raspon datuma, iznos.
- **Profil primatelja**: sve isplate jednom primatelju + činjenice iz registra.
- **Trendovi po kategoriji kroz vrijeme** (samo brojke i grafovi, bez teksta-suda).
- **"Novo ovaj tjedan"** feed novih isplata.
- **Otvoreni podaci**: preuzimanje CSV/JSON — sami postajemo izvor otvorenih podataka koji drugi mogu koristiti.
- Svaki prikaz: link na službeni izvor + datum dohvata (rule #3).

## 9. Rizici specifični za ovu aplikaciju

- **Najosjetljivija aplikacija u projektu.** Proračun/isplate su politički najzapaljiviji sadržaj → neutralnost mora biti željezna (SWOT prijetnja "napad na vlast"). Zato Bus ide prvi, a Transparentnost tek kad postoji povjerenje.
- **Ovisnost o SPA izvorima bez službenog API-ja** → rani, uljudni kontakt s Gradom; keširanje svega od prvog dana.
- **GDPR kod fizičkih osoba** → riješeno agregacijom na razini modela (§6).
- **Kvaliteta AI-klasifikacije** → confidence + "neklasificirano" + javne ispravke; klasifikacija nikad ne mijenja izvorni iznos ni primatelja.

## 10. Sljedeći koraci

1. Otkriti interni API endpoint na obje platforme (browser network tab) i potvrditi da je oblik isti.
2. Potvrditi popis gradskih tvrtki i koje imaju transparentnost portal.
3. Prototip scrapera za jedan subjekt (npr. VIK) → potvrditi kanonsku shemu.
4. Backfill 2025→danas za taj subjekt u `pametni-karlovac-podaci`.
5. Prototip AI-klasifikacije na stvarnim podacima → validirati taksonomiju i pouzdanost.
6. Tek nakon toga: UI i dnevni Action za sve subjekte.

---

Izvori (provjera 19.7.2026.): [Gradske tvrtke i ustanove — Grad Karlovac](https://www.karlovac.hr/kontakti/gradske-tvrtke-i-ustanove/) · [iTransparentnost Grada Karlovca](https://transparentno.otvoreni.karlovac.hr/) · [VIK transparentnost](https://transparentnost.vik-ka.hr/) · [Transparentnost — Grad Karlovac](https://www.karlovac.hr/transparentnost/)
