# personal_portfolio

Personal site for **Marcelo Báez** — PhD researcher in Applied Mathematics and Data Science
(Paccanaro Lab, FGV EMAp, Rio de Janeiro) and full-stack software engineer.

Live at <https://mbaez97.github.io/personal_portfolio/>

## Stack

Plain HTML, CSS and JavaScript. No build step, no framework, no runtime dependencies —
the repository is deployed exactly as it is committed.

```
index.html      All content and markup
styles.css      Design tokens + components (light and dark themes)
main.js         Theme toggle, mobile nav, scrollspy, reveal, BibTeX copy, hero canvas
static/         Photo (two sizes) and locally-hosted technology icons
```

## Local preview

Any static server works:

```bash
python3 -m http.server 4317
```

Then open <http://localhost:4317>.

## Editing

Everything a visitor reads lives in `index.html`, in labelled sections
(`#about`, `#research`, `#publications`, `#projects`, `#toolkit`, `#contact`).

- **Add a job or degree** — copy a `<li class="tl-item">` block in the Background
  timeline. There is a commented-out template in place showing the fields.
- **Add a publication** — copy the `<li class="pub">` block. The `data-bibtex`
  attribute on the copy button must match the `id` of its `<pre class="bibtex">`.
- **Add a project** — copy an `<article class="proj">` block. `proj-feature`
  makes a card span the full grid width.
- **Add a technology** — drop the SVG into `static/icons/` and add a `<li>` to the
  matching `.chips` list. The icons are vendored locally (from
  [devicon](https://devicon.dev), MIT) rather than hot-linked from a CDN, so they
  cannot break when someone else moves a file. Google Fonts is the only external
  request the page makes; delete the `<link>` in `<head>` and the stack falls back
  to system fonts.
- **Change the palette** — the `:root` and `:root[data-theme='dark']` blocks at the
  top of `styles.css` hold every colour.

## Notes

- Theme follows the visitor's OS preference until they pick one explicitly, which is
  then remembered in `localStorage`.
- Structured data (`schema.org/Person`), Open Graph and Twitter cards are in the
  `<head>`; update the `canonical` and `og:image` URLs if the site moves.
- There is a print stylesheet: `Cmd/Ctrl+P` produces a usable one-page CV.
- Respects `prefers-reduced-motion` — the hero animation and reveals switch off.

## Deployment

Pushing to `master` triggers `.github/workflows/static.yml`, which publishes the
repository to GitHub Pages.
