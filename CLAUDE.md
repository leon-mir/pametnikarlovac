# Pametni Karlovac — upute za Claude Code (root)

Javne, AI-made, nepolitičke aplikacije za građane Karlovca, temeljene na otvorenim podacima. Domena: pametnikarlovac.hr (poddomene bus. / proracun. / dogadaji.). Sve javno na GitHubu.

## Struktura i opseg agenata

```
docs/        tehnička dokumentacija (arhitektura, izvori podataka)
interno/     interna razrada — NIJE na GitHubu (.gitignore); ovdje su brand i strategija
shared/      design tokeni, zajedničke komponente, logo
bus/         Bus aplikacija        → ima svoj CLAUDE.md
proracun/    Proračun aplikacija   → ima svoj CLAUDE.md
dogadaji/    Događaji aplikacija   → ima svoj CLAUDE.md
data/        skripte za dohvat + mali agregirani podaci
```

- Root agent smije sve. **Agent pokrenut u pod-folderu radi ISKLJUČIVO u svom folderu**; `shared/` i `data/` smije čitati, ne mijenjati. Promjene u `shared/` rade se samo iz roota.
- Sirovi/veliki podaci idu u zasebni repo `pametni-karlovac-podaci`, nikad u ovaj.

## Tvrda pravila (vrijede za sve agente, bez iznimke)

1. **Nikad osobni podaci fizičkih osoba** (imena primatelja socijalne pomoći, stipendija...) — samo agregati. Pravne osobe smiju imenom.
2. **Politička neutralnost.** Nema ocjena, komentara, sugestija ("sumnjivo", "previše") — samo podaci, izvor i datum.
3. **Svaki prikazani podatak ima izvor i datum dohvata.**
4. **Bez trackinga, oglasa, korisničkih računa** (iznimka: događaji faza 2, samo uz eksplicitnu odluku).
5. **Jezik: hrvatski**, jednostavan, bez anglizama u UI-ju. Dijakritika obavezna i u kodu (stringovi) i u dokumentaciji.

## Brand i UI (izvor istine: shared/design-system.md)

Sav UI slijedi `shared/design-system.md` — boje (sve s pravih mjesta u gradu), provjerenu kontrast matricu, tipografsku skalu i specifikacije komponenti. U kodu: importaj `shared/tokens/tokens.css`, postavi `data-app` na `<html>`, koristi `shared/tokens/tailwind-preset.cjs`. **Nikad ne hardkodiraj hexove ni px veličine po komponentama.** Brand priča i pozadina: interno/03-vizualni-identitet.md.

## Tehnika

- Static-first: Astro ili Vite+React, static export, Tailwind. Bez backenda dok god ide.
- PWA obavezno za Bus i Događaje; kod mora ostati **Capacitor-kompatibilan** (bez SSR runtimea, bez server-only ovisnosti) jer idu u Google Play / App Store.
- Hosting: Vercel/Cloudflare Pages. Podaci se osvježavaju GitHub Actionsima, ne u runtimeu.
- Footer svake aplikacije: "🤖 Izrađeno uz pomoć AI-a · otvoreni kod na GitHubu · pametnikarlovac.hr".

## Konvencije

- Commitovi: konvencionalni, na engleskom (`feat(bus): ...`), opisi kratki.
- Prije PR-a/commita: provjeri dijakritiku (nikakva ćirilica/mojibake), kontrast (AA min), i da build prolazi.
- Ne izmišljaj podatke: ako izvor nije dostupan, prikaži stanje "podaci trenutno nedostupni", nikad placeholder brojke u produkciji.
