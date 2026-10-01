# Průvodce certifikací EU pro elektronická zařízení
#Pure Vibe Coding
Statická webová aplikace (žádný build, žádné závislosti mimo CDN) — interaktivní
wizard, který na základě odpovědí na sérii otázek určí, jaké CE certifikace,
směrnice/nařízení EU, harmonizované normy a povinná dokumentace se vztahují na
dané elektronické zařízení uváděné na trh EU.

## Spuštění

```bash
python -m http.server 8000
```

Pak otevřít <http://localhost:8000>.

## Struktura

```
index.html          shell aplikace (hlavička, kořen wizardu, patička)
css/styles.css       animace + tiskový stylesheet (@media print) pro export do PDF
js/wizard-data.js    datový model: otázky, větvení, pravidla → příspěvky do reportu
js/wizard.js         engine/UI: vykreslování, historie/zpět, sestavení a export reportu
```

Styly: Tailwind CSS (CDN, `cdn.tailwindcss.com`). Fonty: Inter + JetBrains Mono
z Google Fonts.

## Úprava/rozšíření rozhodovacího stromu

Všechna logika je v `js/wizard-data.js`:
- `QUESTIONS` — otázky, možnosti, funkce `next(answers)` určující větvení.
- `RULES` — mapa `"questionId.hodnota"` → příspěvky (`markings`, `directives`,
  `standards`, `docs`, `notes`, `flags`) do výsledného přehledu. `RULES.universal`
  platí vždy, `RULES.gpsr` se aplikuje podmíněně dle `flags.gpsrApplies`.

Přidání nové otázky: doplnit záznam do `QUESTIONS`, nastavit `next()` u otázky,
která na ni má navazovat, a přidat odpovídající klíče do `RULES`.

## Export

- **PDF** — tlačítko spustí `window.print()` s vlastním tiskovým stylem
  (`css/styles.css`, `@media print`) — v dialogu tisku zvolit „Uložit jako PDF“.
- **TXT** — tlačítko vygeneruje čistě textovou verzi reportu a stáhne ji jako
  `.txt` soubor (bez závislostí, přes `Blob`).

## Poznámka

Nástroj poskytuje zjednodušený orientační přehled, nenahrazuje odborné právní
posouzení shody.
