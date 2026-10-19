DATA FEED — Markdown content + JSON indexes

This project loads small JSON indexes and Markdown content files via fetch in the front-end and renders:
- listings (casos.html / perspectivas.html)
- detail pages (caso-<slug>.html / caso.html fallback / perspectiva.html)
- filters (dropdowns) and search at the top of listings

IMPORTANT
- JSON index files do NOT allow comments. Do not put // or /* */ inside .json files.
- Content should be edited in `.md` files, not in legacy JSON data files.
- Filters rely on CONSISTENT values (exact string match). Example: "Retail" ≠ "retail".

============================================================
1) CASES — data/casos/*.md
============================================================

HOW TO ADD A NEW CASE (step by step)
1) Create `data/casos/<slug>.md` and, for English, `data/en/casos/<slug>.md`.
2) Add the same `<slug>` to `data/casos/index.json` and `data/en/casos/index.json`.
3) Use a unique `slug` (no spaces; use hyphens). Example: "new-case".
4) Fill `sector` in the front matter with the canonical value that must appear in the dropdown.
   - If you use a new `sector`, it will show up automatically in the filter.
5) Fill `tag` with the editorial label (can be longer / formatted).
6) Point `foto` to a file under `assets/` and fill `fotoAlt`.
7) Fill the Markdown sections: Contexto / Problema / Solución / Resultado.
8) Test by opening:
   - `casos.html` (the card should appear)
   - `caso-<slug>.html` (the detail should load)
   - `caso.html?slug=<slug>` (legacy fallback should also load)

Files:
- data/casos/index.json
- data/casos/<slug>.md
- data/en/casos/index.json
- data/en/casos/<slug>.md

Pages:
- casos.html (listing)
- caso-<slug>.html (detail)
- caso.html (legacy fallback detail)

JS:
- js/casos.js

How clicks work:
- On the listing, each card links to:
  caso-<item-slug>.html
- On the detail page, JS reads data-caso-slug, ?slug=, #slug, sessionStorage, or the caso-<slug>.html filename and finds the matching Markdown file.

"Sector" filter (dropdown)
- The dropdown is built from the unique values of:
  sector
- When a sector is selected, the listing only shows items where:
  item.sector === selectedSector

Search (input)
- Search filters by substring match on:
  subtitulo, highlight, excerpt, tag, ubicacion

URL parameters (persistence)
- ?sector=Retail
- ?q=text

Recommended keys per item (minimum for a good experience)
- slug (string, unique)
- sector (string, canonical: "Industria" | "Retail" | "Agroindustria" | etc.)
- tag (string, editorial label for the card)
- ubicacion (string)
- foto, fotoAlt, (fotoStyle optional)
- subtitulo
- highlight
- excerpt (optional)

Keys for the detail page (caso-<slug>.html / caso.html fallback)
- detailTag (optional)
- contexto
- problema
- solucion
- resultado

TEMPLATE (copy and fill in)
---
sector: "Retail"
tag: "RETAIL IN EXPANSION"
detailTag: ""
ubicacion: "Santiago, CL"
foto: "assets/05-cases/client/photo.webp"
fotoAlt: "Photo description"
fotoStyle: ""
subtitulo: "Case title"
highlight: "+20% on something"
excerpt: "Short summary for the card."
---

## Contexto

Context text...

## Problema

Problem text...

## Solución

Solution text...

## Resultado

Results text...

============================================================
2) PERSPECTIVES — data/perspectivas/*.md
============================================================

HOW TO ADD A NEW PERSPECTIVE (step by step)
1) Create `data/perspectivas/<slug>.md` and, for English, `data/en/perspectivas/<slug>.md`.
2) Add the same `<slug>` to `data/perspectivas/index.json` and `data/en/perspectivas/index.json`.
3) Use a unique `slug` (no spaces; use hyphens or an existing filename-safe convention).
4) Fill `tags`, `industria`, `fecha`, `tiempoLectura`, `foto`, `fotoAlt`, `titulo`, and `descripcion` in front matter.
5) Write the article body in Markdown.
6) Test by opening:
   - `perspectivas.html` (the card should appear)
   - `perspectiva.html?slug=<slug>` (the detail should load)

Files:
- data/perspectivas/index.json
- data/perspectivas/<slug>.md
- data/en/perspectivas/index.json
- data/en/perspectivas/<slug>.md

Pages:
- perspectivas.html (listing)
- perspectiva.html (detail)

JS:
- js/perspectivas.js

How clicks work:
- On the listing, each card links to:
  perspectiva.html#<item-slug>
- On the detail page, JS reads ?slug=, #slug, sessionStorage, or the perspective slug and finds the matching Markdown file.

Filters (dropdowns)
- Year:
  uses anio (recommended) and, if missing, tries to parse fecha
- Theme:
  uses tema

When filtering:
- item.anio === selectedYear
- item.tema === selectedTheme

Search (input)
- Filters by substring match on:
  titulo, descripcion, introduccion, fecha, tiempoLectura, tema

URL parameters (persistence)
- ?ano=2026
- ?tema=Datos
- ?q=text

Recommended keys per item
- titulo
- descripcion
- foto, fotoAlt
- fecha (human-readable string, e.g. "Octubre 2026")
- tiempoLectura (e.g. "6 min de lectura")
- pdf (optional: file link)
- acceso ("publico" | "privado")

TEMPLATE (copy and fill in)
---
titulo: "Perspective title"
descripcion: "Short description (listing + hero)."
tipo: "analysis"
tags: [strategy, technology]
industria: "general"
fecha: "Marzo 2025"
tiempoLectura: "6 min de lectura"
foto: "assets/06-perspectivas/new.webp"
fotoAlt: "Image alt text"
acceso: "publico"
pdf: ""
---

Intro text...

## Desarrollo

Main article text...

## Conclusión

Closing text...
