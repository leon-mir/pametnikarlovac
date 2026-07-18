# Pametni Karlovac

**Javne, AI-made aplikacije za građane Karlovca.** Otvoreni kod, otvoreni podaci, otvoren proces.

## Što je ovo?

Skup malih, fokusiranih aplikacija koje građanima Karlovca olakšavaju pristup podacima koji su već javno dostupni — ali raštrkani, teško čitljivi ili zakopani u PDF-ovima. Besplatno, bez oglasa, bez prikupljanja osobnih podataka.

Projekt otvoreno komunicira da je izgrađen uz pomoć AI alata (Claude). Iza projekta stoji [Leon Mirčić](https://github.com/leonmircic).

## Principi

1. **Nepolitično.** Podaci služe svima jednako — građanima, novinarima i političarima svih opcija.
2. **Samo javni podaci.** Osobni podaci fizičkih osoba nikada se ne prikazuju, čak i kad su u izvoru javni — samo agregati.
3. **Radikalna jednostavnost.** Aplikacije rade za bakice, dedeke i školarce — ne za developere.
4. **Otvoreni kod.** Svatko može predložiti dorade, prijaviti greške ili forkati koncept za svoj grad.

## Aplikacije (klasteri)

| Aplikacija | Folder | Poddomena (plan) | Status |
|---|---|---|---|
| 🚌 Bus — gradski prijevoz | `bus/` | `bus.` | u razradi |
| 💶 Proračun — kamo ide gradski novac | `proracun/` | `proracun.` | u razradi |
| 📅 Događaji — što se događa u gradu | `dogadaji/` | `dogadaji.` | u razradi |

## Tehnička dokumentacija

- [Arhitektura i razrada aplikacija](docs/arhitektura.md)
- [Izvori podataka](docs/izvori-podataka.md)

## Struktura repozitorija

```
pametni-karlovac/
├── docs/        ← tehnička dokumentacija
├── shared/      ← zajednički design tokeni i komponente
├── bus/         ← Bus aplikacija
├── proracun/    ← Proračun aplikacija
├── dogadaji/    ← Događaji aplikacija
└── data/        ← skripte za dohvat podataka + mali keširani podaci
```

## Kako pridonijeti?

Otvori issue s prijedlogom ili greškom, ili pošalji pull request. Ne moraš biti programer — prijedlog "ovaj podatak bi mi bio koristan" jednako je vrijedan kao i kod.

## Licenca

Kod: MIT. Podaci: pripadaju izvornim vlasnicima (Grad Karlovac, DZS itd.), koristimo ih pod uvjetima [Otvorene dozvole](http://data.gov.hr/otvorena-dozvola).
