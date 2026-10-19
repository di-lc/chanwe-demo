# Chanwe portfolio demo (static)

Static package for GitHub Pages: **marketing site + client portal + admin CRM**.

- No `server/`, no database, no Chanwe production URLs.
- Fictional study-case data only (Fabrizio / demo team).
- Visitor actions stay in the browser session (`sessionStorage`; reset when the tab closes).

## Live URLs (GitHub Pages)

| Surface | URL |
|---------|-----|
| Marketing site | https://di-lc.github.io/chanwe-demo/ |
| Client portal | https://di-lc.github.io/chanwe-demo/portal/ |
| Admin CRM | https://di-lc.github.io/chanwe-demo/admin/ |

**Source of the live demo:** only this GitHub repo (`di-lc/chanwe-demo`) is published. The local prototype folders are build inputs, not the public site.

## Live verify (portfolio demo)

After each publish, open these URLs (hard refresh if needed: Ctrl+F5):

| Check | URL | Expect |
|-------|-----|--------|
| Marketing | https://di-lc.github.io/chanwe-demo/ | Address **Rosario / Calle España 1240**; footer **Redes** icons (no real links) |
| English | https://di-lc.github.io/chanwe-demo/en/ | Full **nav** in English (Home, Methodology, …) |
| Admin | https://di-lc.github.io/chanwe-demo/admin/ | Sidebar bottom: **Conectado** + green dot; dashboard KPIs > 0; seeded clients (Fernández, Tejidos, …) |
| Portal | https://di-lc.github.io/chanwe-demo/portal/ | Demo portal (session-local writes) |

Deploy stamp: see `PUBLISH.json` at the repo root after publish.

## Publish (from this folder)

```bash
MSYS_NO_PATHCONV=1 PORTFOLIO_ROOT=chanwe-demo node publish.mjs
```

## Layout after build

```
dist/
  index.html          ← marketing home
  …                   ← rest of the marketing site
  portal/             ← client workspace (Vite)
  admin/              ← admin CRM (Vite)
```

## Run locally

From the folder that contains `index.html` (repo root after publish, or `dist/` after build), start a local HTTP server and open the URL in the browser.

### Option A — Python 3

```bash
python -m http.server 8080
```

Open: http://localhost:8080

### Option B — Node (npx)

```bash
npx --yes serve -p 8080
```

Follow the terminal instructions (usual URL: http://localhost:8080).

### Option C — VS Code / Cursor

Live Server (or equivalent): “Open with Live Server” on `index.html`.

### Important: do not use `file://`

Do not open pages directly from disk (URLs starting with `file:///`), for example by double-clicking an `.html` file.

Main reasons:

- **`fetch()` of JSON** — `js/main.js` loads `data/casos.json` and `data/perspectivas.json`. With a `file://` origin, many browsers block or fail these requests; listings and detail pages stop working or show errors.
- **Other assets** — references such as `<use href="…sprite.svg#id">` are more reliable over `http://localhost/…` than over `file://`.

For local review, always use `http://localhost` (or the host your server prints).

## Useful structure (summary)

| Path | Role |
|------|------|
| `index.html` | Main marketing entry |
| `data/` | `casos.json`, `perspectivas.json` (loaded via `fetch`) |
| `js/main.js` | Navigation, data, interactions |
| `css/` | Global and page styles |
| `assets/01-icons/` | SVG icons |
| `assets/02-logo/` | Chanwe logos |
| `assets/03-images/` | Images (webp, og-image, …) |
| `assets/04-video/` | Hero video frames (webp) |
| `assets/05-cases/` | Case assets (logos, card photos) |
| `assets/06-perspectivas/` | Perspective / report images |
| `portal/` | Client workspace SPA |
| `admin/` | Admin CRM SPA |

These folders use names without spaces; file references use the literal path (e.g. `assets/05-cases/...`).

## Rebuild (on your machine)

Requires the three prototype folders next to `chanwe-portfolio-demo/`:

- `../chanwe-main-prototype`
- `../chanwe-client-workspace-prototype`
- `../admin-crm-tool-prototype`

```bash
# Project Pages site: user.github.io/chanwe-demo/
PORTFOLIO_ROOT=chanwe-demo node build.mjs
```

On Git Bash for Windows, use `MSYS_NO_PATHCONV=1` if a leading `/` gets rewritten to a filesystem path.

Portal/admin use **HashRouter** in this package (`#/access`, `#/portal`, `#/admin`) so refresh works on Pages. Static assets use Vite `BASE_URL`.

## Notes

- This repository does **not** render Chanwe Quarto output and does **not** use the `chanwer` R package.
- Do not publish the prototype repos that contain `server/` or secrets.
