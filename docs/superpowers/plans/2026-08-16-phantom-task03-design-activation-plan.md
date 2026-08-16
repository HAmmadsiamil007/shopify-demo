# PHANTOM Task 03 — Design Activation Walkthrough Implementation Plan

> **EXECUTED 2026-08-16 (commits `a5da4ab..40c3952`, pushed to `shopify-demo`).**
> **Post-execution correction pass:** `docs/superpowers/corrections/2026-08-16-phantom-task03-correction-pass.md`
> (scope audit in `build.mjs`, import-map cleanup, section metadata, source placeholders, contract updates).
> Task 03 proves activation with a temporary toggle; Task 04 converts it into the modular AETHER section system.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the Task 01 blueprint's external-design activation pipeline end-to-end with a fictional `demo` design ("Aurora Studio"), with zero visual change on the default theme.

**Architecture:** A theme-settings toggle (`ph_active_design`: `none`|`demo`) gates a `.ph-client ph-client--demo` scope root on `<body>` plus client CSS/JS assets. The demo design ships as `designs/demo/` (frozen Bootstrap source → scoped/purged build), three client sections (`client-demo-hero/collection/footer`), a `ClientDesign` ES module with init/destroy/refresh, and a dedicated `templates/page.demo.json`. When the toggle is `none`, nothing client-related loads and the default theme is byte-identical.

**Tech Stack:** Liquid (OS 2.0), Bootstrap 5.3 (design-time only), Dart Sass + PurgeCSS (`designs/build/build.mjs`), vanilla ES module JS, Shopify Theme Check.

**Spec:** `docs/superpowers/specs/2026-08-16-phantom-task03-design-activation-design.md`

## Global Constraints

- Client CSS never escapes `.ph-client`: no `:root`, no `body`, no bare element selectors in client CSS.
- Client z-index cap 10000, budget: sticky 5000 / drawer 9000 / modal 9050 / toast 9500 / 3D 9700. No `!important`.
- Client breakpoints 576/768/992/1200/1400 apply inside `.ph-client` only; PHANTOM scale untouched.
- Bootstrap is design-time only: production CSS ships scoped + purged via the build pipeline.
- `index.json` untouched; default theme (toggle `none`) must render exactly as today.
- No vendor libs (GSAP/Swiper/Lenis/Three) in the demo — `vendor-{slug}` slot stays documented but unused.
- Client sections ship `{% schema %}` with presets; user-facing text via `{{ 'key' | t }}` + locales.
- QA gate: theme-check 0 offenses; `build.mjs --slug demo --check` passes; `client-demo.css` < 60 KB.
- Demo product card binds real data: `title`, `url`, `featured_image`, `price`, `compare_at_price`, `available`.
- Repo policy: origin is `shopify-demo` (branch `main`); `shopify-phantom-` repo is FROZEN — never touch.
- Theme root: `phantom-theme-v2.2.0/`. Node v24, Shopify CLI 4.6.1. Theme-check: `shopify theme check --path "phantom-theme-v2.2.0"`.
- `designs/build/node_modules` is gitignored (do not commit).

---

### Task 1: Housekeeping — commit Task 02 work, remove stray artifact

**Files:**
- All: pending Task 02 changes (hardening + `designs/` scaffold + Task 01 blueprint + this spec)
- Delete: `phantom-theme-v2.2.0/designs/true/` (test-artifact build leftover, slug-"true")

**Interfaces:**
- Produces: clean working tree on `main`; baseline commit containing Task 02 deliverables.

- [ ] **Step 1: Verify working tree state**

Run:
```powershell
git status --short
```
Expected: modified files listed under `phantom-theme-v2.2.0/` (hardening edits), untracked `phantom-theme-v2.2.0/designs/` and `docs/superpowers/specs/2026-08-16-phantom-external-integration-blueprint.md`. The two Task 03 spec commits (`d13c36b`, `f0caba2`) already landed.

- [ ] **Step 2: Delete the stray `designs/true/` artifact**

Run:
```powershell
Remove-Item -Recurse -Force "phantom-theme-v2.2.0\designs\true"
```
Verify: `Test-Path "phantom-theme-v2.2.0\designs\true"` → False.

- [ ] **Step 3: Stage Task 02 work (exclude gitignored + `_template` stays as scaffold)**

Run:
```powershell
git add -A phantom-theme-v2.2.0 docs/superpowers/specs/2026-08-16-phantom-external-integration-blueprint.md
git status --short
```
Expected: everything staged; `designs/build/node_modules` NOT staged (gitignore); `designs/true` gone.

- [ ] **Step 4: Commit**

```powershell
git commit -m "chore: Task 02 baseline hardening + client-design integration scaffold"
```

- [ ] **Step 5: Verify clean tree + theme-check still clean**

Run:
```powershell
git status --short
shopify theme check --path "phantom-theme-v2.2.0"
```
Expected: clean tree; `269 files inspected with no offenses found`.

---

### Task 2: Demo design — frozen external source + manifest + mapping

**Files:**
- Create: `phantom-theme-v2.2.0/designs/demo/source/index.html`
- Create: `phantom-theme-v2.2.0/designs/demo/manifest.md`
- Create: `phantom-theme-v2.2.0/designs/demo/mapping.md`

**Interfaces:**
- Consumes: `designs/_template/manifest.md`, `designs/_template/mapping.md` (format).
- Produces: `designs/demo/source/index.html` — the frozen visual source of truth and the PurgeCSS content source for Task 3; class inventory: `ph-client__*`, `.btn.btn-primary`, `.row`, `.col-*`, `.g-4`.

- [ ] **Step 1: Create `designs/demo/source/index.html`**

Write the full file:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Aurora Studio — Demo design (frozen source)</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
  <style>
    :root {
      --aurora-bg: #f7f4ee;
      --aurora-text: #2b2620;
      --aurora-muted: #6f675c;
      --aurora-accent: #3f6b4f;
      --aurora-accent-text: #ffffff;
      --aurora-card-bg: #ffffff;
      --aurora-border: #e5dfd4;
      --aurora-sale: #b33a45;
    }
    body { background: var(--aurora-bg); color: var(--aurora-text); font-family: Georgia, 'Times New Roman', serif; }
    .ph-client__hero { padding: 96px 0 72px; text-align: center; }
    .ph-client__hero-eyebrow { letter-spacing: .22em; text-transform: uppercase; font-size: .78rem; color: var(--aurora-muted); margin-bottom: 16px; }
    .ph-client__hero-title { font-size: 3.25rem; font-weight: 400; line-height: 1.1; margin-bottom: 16px; }
    .ph-client__hero-subtitle { font-size: 1.15rem; color: var(--aurora-muted); max-width: 560px; margin: 0 auto 28px; }
    .ph-client__hero-placeholder { height: 300px; border-radius: 12px; margin-bottom: 40px; background: linear-gradient(120deg, #d8cfc0 0%, #f0e9dd 45%, #c9d8cc 100%); }
    .ph-client__collection { padding: 0 0 80px; }
    .ph-client__collection-title { text-align: center; font-size: 2rem; font-weight: 400; margin-bottom: 40px; }
    .ph-client__card { background: var(--aurora-card-bg); border: 1px solid var(--aurora-border); border-radius: 12px; overflow: hidden; transition: transform .25s ease, box-shadow .25s ease; position: relative; height: 100%; }
    .ph-client__card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(43, 38, 32, .12); }
    .ph-client__card-media { aspect-ratio: 4 / 5; background: #efe9de; }
    .ph-client__card-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .ph-client__card-body { padding: 16px 18px 20px; }
    .ph-client__card-title { font-size: 1.05rem; font-weight: 400; margin-bottom: 6px; }
    .ph-client__card-title a { color: var(--aurora-text); text-decoration: none; }
    .ph-client__card-title a:hover { color: var(--aurora-accent); }
    .ph-client__card-price { color: var(--aurora-muted); }
    .ph-client__badge { position: absolute; top: 12px; left: 12px; background: var(--aurora-sale); color: #fff; font-size: .72rem; letter-spacing: .08em; text-transform: uppercase; padding: 5px 10px; border-radius: 999px; }
    .ph-client__card-soldout { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(247, 244, 238, .82); color: var(--aurora-text); letter-spacing: .18em; text-transform: uppercase; font-size: .8rem; }
    .btn-primary { background: var(--aurora-accent); border-color: var(--aurora-accent); border-radius: 999px; padding: 12px 32px; letter-spacing: .08em; text-transform: uppercase; font-size: .82rem; }
    .btn-primary:hover, .btn-primary:focus { background: #33563f; border-color: #33563f; }
    .ph-client__footer { border-top: 1px solid var(--aurora-border); padding: 48px 0 24px; }
    .ph-client__footer-brand { font-size: 1.15rem; margin-bottom: 8px; }
    .ph-client__footer-links { list-style: none; padding: 0; margin: 0; }
    .ph-client__footer-links a { color: var(--aurora-muted); text-decoration: none; }
    .ph-client__footer-links a:hover { color: var(--aurora-accent); }
    .ph-client__footer-copy { text-align: center; color: var(--aurora-muted); font-size: .85rem; margin: 32px 0 0; }
    .ph-client__reveal { opacity: 0; transform: translateY(16px); transition: opacity .6s ease, transform .6s ease; }
    .ph-client__reveal.is-visible { opacity: 1; transform: none; }
    @media (prefers-reduced-motion: reduce) {
      .ph-client__reveal { opacity: 1; transform: none; transition: none; }
    }
  </style>
</head>
<body>
  <header class="ph-client__hero">
    <div class="container">
      <p class="ph-client__hero-eyebrow">Aurora Studio</p>
      <div class="ph-client__hero-placeholder" aria-hidden="true"></div>
      <h1 class="ph-client__hero-title">Objects for the slow home</h1>
      <p class="ph-client__hero-subtitle">Considered ceramics, linen and light — made in small batches.</p>
      <a class="btn btn-primary" href="#collection">Shop the collection</a>
    </div>
  </header>

  <section class="ph-client__collection" id="collection">
    <div class="container">
      <h2 class="ph-client__collection-title">Featured pieces</h2>
      <div class="row g-4">
        <div class="col-12 col-sm-6 col-md-4">
          <article class="ph-client__card ph-client__reveal">
            <span class="ph-client__badge">Sale</span>
            <div class="ph-client__card-media"><img src="https://picsum.photos/seed/aurora1/600/750" alt="Stoneware bowl"></div>
            <div class="ph-client__card-body">
              <h3 class="ph-client__card-title"><a href="#">Stoneware bowl</a></h3>
              <p class="ph-client__card-price">$42.00</p>
            </div>
          </article>
        </div>
        <div class="col-12 col-sm-6 col-md-4">
          <article class="ph-client__card ph-client__reveal">
            <div class="ph-client__card-media"><img src="https://picsum.photos/seed/aurora2/600/750" alt="Linen throw"></div>
            <div class="ph-client__card-body">
              <h3 class="ph-client__card-title"><a href="#">Linen throw</a></h3>
              <p class="ph-client__card-price">$118.00</p>
            </div>
          </article>
        </div>
        <div class="col-12 col-sm-6 col-md-4">
          <article class="ph-client__card ph-client__reveal">
            <span class="ph-client__card-soldout">Sold out</span>
            <div class="ph-client__card-media"><img src="https://picsum.photos/seed/aurora3/600/750" alt="Brass candlestick"></div>
            <div class="ph-client__card-body">
              <h3 class="ph-client__card-title"><a href="#">Brass candlestick</a></h3>
              <p class="ph-client__card-price">$64.00</p>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>

  <footer class="ph-client__footer">
    <div class="container">
      <div class="row g-4">
        <div class="col-12 col-md-4">
          <p class="ph-client__footer-brand">Aurora Studio</p>
          <p>Small-batch goods, made slowly.</p>
        </div>
        <div class="col-12 col-md-4">
          <ul class="ph-client__footer-links">
            <li><a href="#">Shop</a></li>
            <li><a href="#">Journal</a></li>
            <li><a href="#">About</a></li>
          </ul>
        </div>
        <div class="col-12 col-md-4">
          <p>hello@aurora.example</p>
        </div>
      </div>
      <p class="ph-client__footer-copy">&copy; 2026 Aurora Studio</p>
    </div>
  </footer>

  <script>
    var revealTargets = document.querySelectorAll('.ph-client__reveal')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealTargets.forEach(function (el) { el.classList.add('is-visible') })
    } else if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        })
      }, { threshold: 0.15 })
      revealTargets.forEach(function (el) { io.observe(el) })
    }
  </script>
</body>
</html>
```

- [ ] **Step 2: Verify source renders (visual reference for QA-07)**

Run: open `phantom-theme-v2.2.0/designs/demo/source/index.html` in a browser (or screenshot via Playwright). Expected: hero, 3-card grid, footer; `.btn-primary` pill button; reveal on scroll; sold-out overlay on card 3.

- [ ] **Step 3: Create `designs/demo/manifest.md`**

Write the full file:

```markdown
# Component Manifest — designs/demo

```yaml
design: demo
version: 0.1.0
status: built
```

## Manifest

| Shopify section (`sections/*.liquid`) | Role | Client component | CSS scope hook | JS controller | z-index |
|---|---|---|---|---|---|
| `client-demo-hero.liquid` | Hero (eyebrow, image/placeholder, title, subtitle, CTA) | `.ph-client__hero` | `.ph-client--demo .ph-client__hero` | `Hero` (reveal via IO) | ≤ auto |
| `client-demo-collection.liquid` | Featured collection grid (3-up, badges, sold-out) | `.ph-client__collection` / `.ph-client__card` | `.ph-client--demo .ph-client__collection` | `Collection` (reveal via IO) | ≤ auto |
| `client-demo-footer.liquid` | Footer (brand, menu, text, copyright) | `.ph-client__footer` | `.ph-client--demo .ph-client__footer` | none | ≤ auto |

## Rules

- Every client component is scoped (hook always under `.ph-client--demo`).
- Every JS controller implements `destroy()` (contract §2).
- Every animated element respects `prefers-reduced-motion`.
- z-index values ≤ 10000; demo uses none above auto.
```

- [ ] **Step 4: Create `designs/demo/mapping.md`**

Write the full file:

```markdown
# Design → Shopify Mapping — designs/demo

## Data surface (design side)

| Design element (source) | Anchor | Breakpoint behavior | PHANTOM data source |
|---|---|---|---|
| Hero eyebrow "Aurora Studio" | `.ph-client__hero-eyebrow` | static | `section.settings.title` |
| Hero headline | `.ph-client__hero-title` | static | `section.settings.title` |
| Hero image/placeholder | `.ph-client__hero-placeholder` | static | `section.settings.image` (falls back to placeholder) |
| Hero subtitle | `.ph-client__hero-subtitle` | static | `section.settings.subtitle` |
| Hero CTA "Shop the collection" | `.btn.btn-primary` | static | `section.settings.cta_label` + `cta_url` |
| Collection title "Featured pieces" | `.ph-client__collection-title` | static | `section.settings.heading` |
| Product card grid (3-up) | `.row.g-4 > .col-12.col-sm-6.col-md-4` | 1 → 2 → 3 cols @ 576/768 | `collection.products` (limit) |
| Card media | `.ph-client__card-media img` | ratio 4/5 | `product.featured_image` |
| Card title | `.ph-client__card-title a` | — | `product.title` + `product.url` |
| Card price | `.ph-client__card-price` | — | `product.price` via `product.price` snippet |
| Sale badge | `.ph-client__badge` | — | `product.compare_at_price > product.price` |
| Sold-out overlay | `.ph-client__card-soldout` | — | `product.available == false` |
| Footer brand/text | `.ph-client__footer-brand` | stack → 3-col @ 768 | `section.settings.brand_text` / `footer_text` |
| Footer links | `.ph-client__footer-links` | — | `section.settings.menu` (link_list) |
| Copyright | `.ph-client__footer-copy` | — | `shop.name` + current year |

## Engine notes

- Liquid replaces data, never design: layout/styling come from the frozen source; Liquid fills products, collection, shop, menus.
- Client breakpoints (576/768/992/1200/1400) apply inside `.ph-client--demo` only (contract §1.5).
- Reused PHANTOM commerce snippets: `product.price`, `ui-badge` (contract: client owns grid markup, PHANTOM owns commerce data).
- Every element above resolves to an existing section/snippet or is declared NEW (the 3 `client-demo-*` sections — added to the theme in Task 4).
```

- [ ] **Step 5: Commit**

```powershell
git add phantom-theme-v2.2.0/designs/demo
git commit -m "feat: demo design frozen source + manifest + mapping (Aurora Studio)"
```

---

### Task 3: Demo build pipeline — scoped/purged client CSS

**Files:**
- Create: `phantom-theme-v2.2.0/designs/demo/production/scss/client.scss`
- Create (generated): `phantom-theme-v2.2.0/designs/demo/production/client-demo.css`
- Create (copy): `phantom-theme-v2.2.0/assets/client-demo.css.liquid`

**Interfaces:**
- Consumes: `designs/demo/source/index.html` (purge content), `designs/build/build.mjs` + `node_modules` (npm ci).
- Produces: `assets/client-demo.css.liquid` — referenced by `layout/theme.liquid` in Task 5 (name is fixed: `client-demo.css` asset → `client-demo.css.liquid` file).

- [ ] **Step 1: Create `designs/demo/production/scss/client.scss`**

Write the full file:

```scss
// PHANTOM client-design production CSS — designs/demo (Aurora Studio)
// --------------------------------------------------------------
// COMPILE RULE (contract §1.7): Bootstrap is design-time only. Only the
// modules used by the source are imported, and every selector is
// namespaced under .ph-client--demo by this wrapper. No :root, no body,
// no bare element selectors (contract §1.2). z-index ≤ 10000, no
// !important (contract §1.4).

.ph-client--demo {
  // z-index budget (contract §1.4)
  --demo-z-sticky: 5000;
  --demo-z-drawer: 9000;
  --demo-z-modal: 9050;
  --demo-z-toast: 9500;
  --demo-z-3d: 9700;

  // Bootstrap modules actually used by the design (in dependency order)
  @import "bootstrap/scss/functions";
  @import "bootstrap/scss/variables";
  @import "bootstrap/scss/maps";
  @import "bootstrap/scss/mixins";
  @import "bootstrap/scss/containers";
  @import "bootstrap/scss/grid";
  @import "bootstrap/scss/buttons";
  @import "bootstrap/scss/utilities";

  // Design tokens — token bridge to PHANTOM where semantically equal
  // (contract §1.3): PHANTOM --ph-color* is the single source of truth.
  --demo-bg: var(--ph-colorBody);
  --demo-text: var(--ph-colorTextBody);
  --demo-muted: color-mix(in srgb, var(--ph-colorTextBody) 62%, var(--ph-colorBody));
  --demo-accent: var(--ph-colorBtnPrimary);
  --demo-accent-text: var(--ph-colorBtnPrimaryText);
  --demo-card-bg: var(--ph-colorBody);
  --demo-border: var(--ph-colorBorders);
  --demo-sale: var(--ph-colorSaleTag);
  --demo-sale-text: var(--ph-colorSaleTagText);

  // Design CSS (all authoring stays inside this scope — hard rule)
  .ph-client__hero {
    padding: 96px 0 72px;
    text-align: center;
  }

  .ph-client__hero-eyebrow {
    letter-spacing: 0.22em;
    text-transform: uppercase;
    font-size: 0.78rem;
    color: var(--demo-muted);
    margin-bottom: 16px;
  }

  .ph-client__hero-title {
    font-size: 3.25rem;
    font-weight: 400;
    line-height: 1.1;
    margin-bottom: 16px;
  }

  .ph-client__hero-subtitle {
    font-size: 1.15rem;
    color: var(--demo-muted);
    max-width: 560px;
    margin: 0 auto 28px;
  }

  .ph-client__hero-placeholder {
    height: 300px;
    border-radius: 12px;
    margin-bottom: 40px;
    background: linear-gradient(120deg, #d8cfc0 0%, #f0e9dd 45%, #c9d8cc 100%);
  }

  .ph-client__collection {
    padding: 0 0 80px;
  }

  .ph-client__collection-title {
    text-align: center;
    font-size: 2rem;
    font-weight: 400;
    margin-bottom: 40px;
  }

  .ph-client__card {
    background: var(--demo-card-bg);
    border: 1px solid var(--demo-border);
    border-radius: 12px;
    overflow: hidden;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    position: relative;
    height: 100%;
  }

  .ph-client__card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(43, 38, 32, 0.12);
  }

  .ph-client__card-media {
    aspect-ratio: 4 / 5;
    background: #efe9de;
  }

  .ph-client__card-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .ph-client__card-body {
    padding: 16px 18px 20px;
  }

  .ph-client__card-title {
    font-size: 1.05rem;
    font-weight: 400;
    margin-bottom: 6px;
  }

  .ph-client__card-title a {
    color: var(--demo-text);
    text-decoration: none;
  }

  .ph-client__card-title a:hover {
    color: var(--demo-accent);
  }

  .ph-client__card-price {
    color: var(--demo-muted);
  }

  .ph-client__badge {
    position: absolute;
    top: 12px;
    left: 12px;
    background: var(--demo-sale);
    color: var(--demo-sale-text);
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 5px 10px;
    border-radius: 999px;
  }

  .ph-client__card-soldout {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(247, 244, 238, 0.82);
    color: var(--demo-text);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-size: 0.8rem;
  }

  // Bootstrap button restyled to the design's look (still .btn.btn-primary)
  .btn-primary {
    background: var(--demo-accent);
    border-color: var(--demo-accent);
    border-radius: 999px;
    padding: 12px 32px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-size: 0.82rem;
  }

  .btn-primary:hover,
  .btn-primary:focus {
    background: color-mix(in srgb, var(--demo-accent) 82%, #000);
    border-color: color-mix(in srgb, var(--demo-accent) 82%, #000);
  }

  .ph-client__footer {
    border-top: 1px solid var(--demo-border);
    padding: 48px 0 24px;
  }

  .ph-client__footer-brand {
    font-size: 1.15rem;
    margin-bottom: 8px;
  }

  .ph-client__footer-links {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .ph-client__footer-links a {
    color: var(--demo-muted);
    text-decoration: none;
  }

  .ph-client__footer-links a:hover {
    color: var(--demo-accent);
  }

  .ph-client__footer-copy {
    text-align: center;
    color: var(--demo-muted);
    font-size: 0.85rem;
    margin: 32px 0 0;
  }

  // Scroll reveal — hidden only when JS is present (a11y: content never
  // invisible without JS; reduced motion kills the transition).
  html.js & .ph-client__reveal {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }

  html.js & .ph-client__reveal.is-visible {
    opacity: 1;
    transform: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .ph-client__reveal {
      opacity: 1;
      transform: none;
      transition: none;
    }
  }
}
```

- [ ] **Step 2: Install build deps and run the pipeline**

Run:
```powershell
cd phantom-theme-v2.2.0\designs\build
npm ci
node build.mjs --slug demo
```
Expected: `[client-build] demo -> ..\demo\production\client-demo.css (N.N KB)`. If Sass complains about `@import` deprecation, ignore (warnings only). If it errors on `maps` or `utilities` import order, fix module order per Bootstrap 5.3 dependency chain.

- [ ] **Step 3: Run the size check**

Run:
```powershell
node build.mjs --slug demo --check
```
Expected: `[client-build] OK demo: ...` and size < 60 KB (60000 bytes). If over, trim unused Bootstrap modules (e.g. drop `maps`/`utilities` only if source classes still covered).

- [ ] **Step 4: Copy build output into the theme assets**

Run:
```powershell
Copy-Item "phantom-theme-v2.2.0\designs\demo\production\client-demo.css" "phantom-theme-v2.2.0\assets\client-demo.css.liquid"
```

- [ ] **Step 5: Audit the built CSS against the contract**

Run:
```powershell
$css = Get-Content "phantom-theme-v2.2.0\assets\client-demo.css.liquid" -Raw
# no :root / bare body / bare element selectors at top level
$css -match "(?m)^:root" 
$css -match "(?m)^body"
$css -match "!important"
$css -match "z-index:\s*[1-9][0-9]{4,}"
```
Expected: all four → False. Also verify `(Get-Item "...\client-demo.css.liquid").Length` < 61440.

- [ ] **Step 6: Commit**

```powershell
git add phantom-theme-v2.2.0/designs/demo/production phantom-theme-v2.2.0/assets/client-demo.css.liquid
git commit -m "feat: demo design scoped CSS build pipeline output"
```

---

### Task 4: Client sections + demo template

**Files:**
- Create: `phantom-theme-v2.2.0/sections/client-demo-hero.liquid`
- Create: `phantom-theme-v2.2.0/sections/client-demo-collection.liquid`
- Create: `phantom-theme-v2.2.0/sections/client-demo-footer.liquid`
- Create: `phantom-theme-v2.2.0/templates/page.demo.json`

**Interfaces:**
- Consumes: Task 2 mapping (anchors), PHANTOM snippets `product.price` (params `product`, `use_variant`) and `ui-badge` (params `label`, `type`).
- Produces: section types `client-demo-hero` / `client-demo-collection` / `client-demo-footer` (referenced by `templates/page.demo.json`, and schema locale keys `t:sections.client_demo_*` consumed by Task 5 locales). Each section root carries `data-section-type` + `data-section-id` (consumed by Task 5's ClientDesign registry).

- [ ] **Step 1: Create `sections/client-demo-hero.liquid`**

Write the full file:

```liquid
{% doc %}
Renders the demo design hero (Aurora Studio) — client-demo activation walkthrough.
@example
{% section 'client-demo-hero' %}
{% enddoc %}

<div class="ph-client__hero" data-section-type="client-demo-hero" data-section-id="{{ section.id }}">
  <div class="ph-client__container">
    <p class="ph-client__hero-eyebrow">{{ section.settings.title }}</p>
    {%- if section.settings.image != blank -%}
      <img
        src="{{ section.settings.image | image_url: width: 1600 }}"
        alt="{{ section.settings.image.alt | escape }}"
        width="1600"
        height="{{ 1600 | divided_by: section.settings.image.aspect_ratio | round }}"
        loading="eager">
    {%- else -%}
      <div class="ph-client__hero-placeholder" aria-hidden="true"></div>
    {%- endif -%}
    <h1 class="ph-client__hero-title ph-client__reveal">{{ section.settings.headline }}</h1>
    {%- if section.settings.subtitle != blank -%}
      <p class="ph-client__hero-subtitle ph-client__reveal">{{ section.settings.subtitle }}</p>
    {%- endif -%}
    {%- if section.settings.cta_label != blank and section.settings.cta_url != blank -%}
      <a class="btn btn-primary ph-client__reveal" href="{{ section.settings.cta_url }}">{{ section.settings.cta_label }}</a>
    {%- endif -%}
  </div>
</div>

{% schema %}
{
  "name": "t:sections.client_demo_hero.name",
  "tag": "section",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "t:sections.client_demo_hero.settings.title.label",
      "default": "Aurora Studio"
    },
    {
      "type": "image_picker",
      "id": "image",
      "label": "t:sections.client_demo_hero.settings.image.label"
    },
    {
      "type": "text",
      "id": "headline",
      "label": "t:sections.client_demo_hero.settings.headline.label",
      "default": "Objects for the slow home"
    },
    {
      "type": "textarea",
      "id": "subtitle",
      "label": "t:sections.client_demo_hero.settings.subtitle.label",
      "default": "Considered ceramics, linen and light — made in small batches."
    },
    {
      "type": "text",
      "id": "cta_label",
      "label": "t:sections.client_demo_hero.settings.cta_label.label",
      "default": "Shop the collection"
    },
    {
      "type": "url",
      "id": "cta_url",
      "label": "t:sections.client_demo_hero.settings.cta_url.label"
    }
  ],
  "presets": [
    {
      "name": "t:sections.client_demo_hero.presets.name"
    }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Create `sections/client-demo-collection.liquid`**

Write the full file:

```liquid
{% doc %}
Renders the demo design featured collection grid — client-owned grid markup with
PHANTOM commerce data (product.price + ui-badge snippets).
@example
{% section 'client-demo-collection' %}
{% enddoc %}

<div class="ph-client__collection" data-section-type="client-demo-collection" data-section-id="{{ section.id }}">
  <div class="ph-client__container">
    <h2 class="ph-client__collection-title ph-client__reveal">{{ section.settings.heading }}</h2>
    {%- assign demo_collection = section.settings.collection -%}
    {%- if demo_collection != blank and demo_collection.products_count > 0 -%}
      <div class="row g-4">
        {%- for product in demo_collection.products limit: section.settings.limit -%}
          <div class="col-12 col-sm-6 col-md-4">
            <article class="ph-client__card ph-client__reveal">
              {%- if section.settings.show_badges and product.compare_at_price > product.price -%}
                {%- render 'ui-badge', label: 'sections.client_demo_collection.sale_badge' | t, type: 'sale' -%}
              {%- endif -%}
              <a href="{{ product.url }}" class="ph-client__card-media">
                {%- if product.featured_image != blank -%}
                  <img
                    src="{{ product.featured_image | image_url: width: 600 }}"
                    alt="{{ product.featured_image.alt | escape }}"
                    width="600"
                    height="{{ 600 | divided_by: product.featured_image.aspect_ratio | round }}"
                    loading="lazy">
                {%- else -%}
                  <span class="ph-client__card-media" aria-hidden="true"></span>
                {%- endif -%}
              </a>
              {%- unless product.available -%}
                <span class="ph-client__card-soldout">{{ 'products.product.sold_out' | t }}</span>
              {%- endunless -%}
              <div class="ph-client__card-body">
                <h3 class="ph-client__card-title">
                  <a href="{{ product.url }}">{{ product.title }}</a>
                </h3>
                <div class="ph-client__card-price">
                  {%- render 'product.price', product: product, use_variant: false -%}
                </div>
              </div>
            </article>
          </div>
        {%- endfor -%}
      </div>
    {%- else -%}
      <p class="ph-client__collection-empty">{{ 'sections.client_demo_collection.empty' | t }}</p>
    {%- endif -%}
  </div>
</div>

{% schema %}
{
  "name": "t:sections.client_demo_collection.name",
  "tag": "section",
  "settings": [
    {
      "type": "collection",
      "id": "collection",
      "label": "t:sections.client_demo_collection.settings.collection.label"
    },
    {
      "type": "text",
      "id": "heading",
      "label": "t:sections.client_demo_collection.settings.heading.label",
      "default": "Featured pieces"
    },
    {
      "type": "range",
      "id": "limit",
      "min": 3,
      "max": 12,
      "step": 3,
      "unit": "products",
      "label": "t:sections.client_demo_collection.settings.limit.label",
      "default": 6
    },
    {
      "type": "checkbox",
      "id": "show_badges",
      "label": "t:sections.client_demo_collection.settings.show_badges.label",
      "default": true
    }
  ],
  "presets": [
    {
      "name": "t:sections.client_demo_collection.presets.name"
    }
  ]
}
{% endschema %}
```

- [ ] **Step 3: Create `sections/client-demo-footer.liquid`**

Write the full file:

```liquid
{% doc %}
Renders the demo design footer — brand text, menu links, footer text, copyright.
@example
{% section 'client-demo-footer' %}
{% enddoc %}

<footer class="ph-client__footer" data-section-type="client-demo-footer" data-section-id="{{ section.id }}">
  <div class="ph-client__container">
    <div class="row g-4">
      <div class="col-12 col-md-4">
        <p class="ph-client__footer-brand">{{ section.settings.brand_text }}</p>
        <p>{{ section.settings.footer_text }}</p>
      </div>
      <div class="col-12 col-md-4">
        {%- assign demo_menu = section.settings.menu -%}
        {%- if demo_menu != blank -%}
          <ul class="ph-client__footer-links">
            {%- for link in demo_menu.links -%}
              <li><a href="{{ link.url }}">{{ link.title }}</a></li>
            {%- endfor -%}
          </ul>
        {%- endif -%}
      </div>
      <div class="col-12 col-md-4">
        <p class="ph-client__footer-copy">© {{ 'now' | date: '%Y' }} {{ shop.name }}</p>
      </div>
    </div>
  </div>
</footer>

{% schema %}
{
  "name": "t:sections.client_demo_footer.name",
  "tag": "footer",
  "settings": [
    {
      "type": "textarea",
      "id": "brand_text",
      "label": "t:sections.client_demo_footer.settings.brand_text.label",
      "default": "Aurora Studio"
    },
    {
      "type": "textarea",
      "id": "footer_text",
      "label": "t:sections.client_demo_footer.settings.footer_text.label",
      "default": "Small-batch goods, made slowly."
    },
    {
      "type": "link_list",
      "id": "menu",
      "label": "t:sections.client_demo_footer.settings.menu.label"
    }
  ],
  "presets": [
    {
      "name": "t:sections.client_demo_footer.presets.name"
    }
  ]
}
{% endschema %}
```

- [ ] **Step 4: Create `templates/page.demo.json`**

Write the full file:

```json
{
  "sections": {
    "hero": {
      "type": "client-demo-hero",
      "settings": {}
    },
    "collection": {
      "type": "client-demo-collection",
      "settings": {}
    },
    "footer": {
      "type": "client-demo-footer",
      "settings": {}
    }
  },
  "order": ["hero", "collection", "footer"]
}
```

- [ ] **Step 5: Verify the three sections against theme-check**

Run:
```powershell
shopify theme check --path "phantom-theme-v2.2.0"
```
Expected: `no offenses found` (new sections parse; note the `t:sections.client_demo_*` and `t:settings_schema.ph_designs` keys are NOT yet in locales — theme-check reports them as warnings only if MatchingTranslations is enabled; if warnings appear, proceed — Task 5 adds the keys, Step 7 re-runs check to 0).

- [ ] **Step 6: Commit**

```powershell
git add phantom-theme-v2.2.0/sections/client-demo-hero.liquid phantom-theme-v2.2.0/sections/client-demo-collection.liquid phantom-theme-v2.2.0/sections/client-demo-footer.liquid phantom-theme-v2.2.0/templates/page.demo.json
git commit -m "feat: demo design client sections + page.demo template"
```

---

### Task 5: Activation wiring — ClientDesign JS, toggle, layout, import map, locales

**Files:**
- Create: `phantom-theme-v2.2.0/assets/client-demo.js` (from `designs/_template/js/client-design.js`)
- Modify: `phantom-theme-v2.2.0/config/settings_schema.json` (append `ph_designs` group)
- Modify: `phantom-theme-v2.2.0/config/settings_data.json` (add `"ph_active_design":"none"` to `current`)
- Modify: `phantom-theme-v2.2.0/layout/theme.liquid` (body class + conditional assets)
- Modify: `phantom-theme-v2.2.0/snippets/theme-import-map.liquid` (conditional `client-demo` entry)
- Modify: `phantom-theme-v2.2.0/locales/en.default.schema.json` (schema keys)
- Modify: `phantom-theme-v2.2.0/locales/en.default.json` (user-facing keys)

**Interfaces:**
- Consumes: Task 3 asset names (`client-demo.css`, `client-demo.js`), Task 4 section types + locale key names.
- Produces: `settings.ph_active_design` (`none`|`demo`) — consumed by `layout/theme.liquid` and `theme-import-map.liquid`; body classes `ph-client ph-client--demo` + `data-ph-design="demo"` consumed by `client-demo.js` scope detection.

- [ ] **Step 1: Create `assets/client-demo.js`**

Copy `designs/_template/js/client-design.js` and write the demo-specific version (full file):

```js
/**
 * ClientDesign — PHANTOM external-frontend integration (design: demo)
 * ====================================================================
 * Task 03 demo activation walkthrough (spec:
 * docs/superpowers/specs/2026-08-16-phantom-task03-design-activation-design.md).
 * Contract: designs/contracts/css-namespace-contract.md (§2).
 *
 * Public API (mandatory): init() / destroy() / refresh()
 * Registry: window.ClientDesign + window.__clientDesignRegistry
 *
 * Zero visual change: this file is only loaded when ph_active_design = demo.
 * No vendor libraries (demo); the vendor-{slug} slot stays documented.
 */
(function () {
  'use strict'

  const SLUG = 'demo'

  const LIBRARIES = {
    gsap: null,
    lenis: null,
    swiper: null,
    three: null
  }

  const EVENTS = {
    themeReady: 'phantom:ready',
    sectionLoad: 'shopify:section:load',
    sectionUnload: 'shopify:section:unload',
    sectionSelect: 'shopify:section:select',
    sectionDeselect: 'shopify:section:deselect',
    cartUpdated: 'cart:updated'
  }

  const SECTION_SELECTOR = '[data-section-type], [data-section-id]'

  class ClientDesign {
    constructor({ slug = SLUG, root = document, libraries = LIBRARIES } = {}) {
      this.slug = slug
      this.root = root
      this.libraries = libraries
      this.scope = null
      this.initialized = false
      this.paused = false
      this.sections = new Map()
      this.abort = new AbortController()
      this._bound = {
        onSectionLoad: this._onSectionLoad.bind(this),
        onSectionUnload: this._onSectionUnload.bind(this),
        onSectionSelect: this._onSectionSelect.bind(this),
        onSectionDeselect: this._onSectionDeselect.bind(this),
        onCartUpdated: this._onCartUpdated.bind(this)
      }
    }

    init() {
      if (this.initialized) return this
      this.scope = this.root.querySelector('.ph-client--' + this.slug) || this.root.body || this.root
      if (this.scope === this.root.body) return this

      this._bindLifecycle()
      this._registerSections(this.scope.querySelectorAll(SECTION_SELECTOR))
      this.initialized = true
      this.root.dispatchEvent(new CustomEvent('client-design:init', { detail: { slug: this.slug } }))
      return this
    }

    destroy() {
      if (!this.initialized) return this
      this._unbindLifecycle()
      this._unregisterSections(this.scope.querySelectorAll(SECTION_SELECTOR))
      this.abort.abort()
      this.abort = new AbortController()
      this.initialized = false
      this.root.dispatchEvent(new CustomEvent('client-design:destroy', { detail: { slug: this.slug } }))
      return this
    }

    refresh(container) {
      const ctx = container || this.scope
      if (!ctx) return this
      this._registerSections(ctx.querySelectorAll(SECTION_SELECTOR))
      return this
    }

    _registerSections(list) {
      list.forEach((el) => {
        const id = el.dataset.sectionId || el.dataset.sectionType || el.id
        if (!id || this.sections.has(id)) return
        const controller = this._initSection(el)
        if (controller) this.sections.set(id, controller)
      })
    }

    _unregisterSections(list) {
      list.forEach((el) => {
        const id = el.dataset.sectionId || el.dataset.sectionType || el.id
        if (!id) return
        const ctrl = this.sections.get(id)
        if (ctrl) {
          ctrl.destroy()
          this.sections.delete(id)
        }
      })
    }

    _initSection(el) {
      const targets = Array.from(el.querySelectorAll('.ph-client__reveal'))
      if (!targets.length) return null
      if (this._reducedMotion()) {
        targets.forEach((t) => t.classList.add('is-visible'))
        return null
      }
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        })
      }, { threshold: 0.15 })
      targets.forEach((t) => io.observe(t))
      return {
        destroy() {
          io.disconnect()
        }
      }
    }

    _bindLifecycle() {
      const { signal } = this.abort
      this.root.addEventListener(EVENTS.themeReady, () => this.initialized || this.init(), { signal })
      this.root.addEventListener(EVENTS.sectionLoad, this._bound.onSectionLoad, { signal })
      this.root.addEventListener(EVENTS.sectionUnload, this._bound.onSectionUnload, { signal })
      this.root.addEventListener(EVENTS.sectionSelect, this._bound.onSectionSelect, { signal })
      this.root.addEventListener(EVENTS.sectionDeselect, this._bound.onSectionDeselect, { signal })
      this.root.addEventListener(EVENTS.cartUpdated, this._bound.onCartUpdated, { signal })
    }

    _unbindLifecycle() {}

    _onSectionLoad(e) {
      const el = e.target && e.target.closest ? e.target.closest(SECTION_SELECTOR) || e.target : e.target
      this.refresh(el)
    }

    _onSectionUnload(e) {
      const el = e.target && e.target.closest ? e.target.closest(SECTION_SELECTOR) || e.target : e.target
      this._unregisterSections([el])
    }

    _onSectionSelect() {
      this.paused = true
      this.pauseAll()
    }

    _onSectionDeselect() {
      this.paused = false
      this.resumeAll()
    }

    _onCartUpdated() {
      // Demo has no cart UI; PHANTOM owns cart data and its own badges.
    }

    pauseAll() {}

    resumeAll() {}

    _reducedMotion() {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
  }

  if (!window.ClientDesign) {
    window.ClientDesign = ClientDesign
    window.__clientDesignRegistry = window.__clientDesignRegistry || new Map()
  }

  window.addEventListener(EVENTS.themeReady, () => {
    if (!window.__clientDesignRegistry.has(SLUG)) {
      const instance = new ClientDesign()
      window.__clientDesignRegistry.set(SLUG, instance)
      instance.init()
    }
  }, { once: true })
})()
```

- [ ] **Step 2: Append the `ph_designs` group to `config/settings_schema.json`**

Edit the file: after the closing `}` of the `ph_presets` group and before the final `]`, insert:

```json
,
  {
    "name": "t:settings_schema.ph_designs.name",
    "settings": [
      {
        "type": "select",
        "id": "ph_active_design",
        "label": "t:settings_schema.ph_designs.settings.ph_active_design.label",
        "default": "none",
        "options": [
          { "value": "none", "label": "t:settings_schema.ph_designs.settings.ph_active_design.options.none.label" },
          { "value": "demo", "label": "t:settings_schema.ph_designs.settings.ph_active_design.options.demo.label" }
        ]
      }
    ]
  }
```
Then validate JSON: `Get-Content config\settings_schema.json -Raw | ConvertFrom-Json | Out-Null` → no error.

- [ ] **Step 3: Add `ph_active_design` to `config/settings_data.json` current**

Edit the single-line JSON: insert `"ph_active_design":"none",` immediately after the `"current":"PHANTOM Default",` opening of the current object. Then validate: `Get-Content config\settings_data.json -Raw | ConvertFrom-Json | Out-Null` → no error.

- [ ] **Step 4: Modify `layout/theme.liquid` — body scope root**

Edit line 377 (`<body ...>`). Add, immediately after the existing `data-swatch_style="{{ settings.swatch_style }}"` attribute and before the trailing `{% if settings.disable_animations %}...` attribute block, the conditional scope attributes:

```liquid
{%- if settings.ph_active_design != 'none' -%} ph-client ph-client--{{ settings.ph_active_design }} data-ph-design="{{ settings.ph_active_design }}"{%- endif -%}
```
Resulting body tag starts:

```liquid
<body class="template-{{ template | replace: '.', ' ' | truncatewords: 1, '' | handle }}... ph-client ph-client--demo" ... data-ph-design="demo" ...>
```
(When `none`: the whole conditional renders empty — class and attributes unchanged, no empty `data-ph-design`.)

- [ ] **Step 5: Modify `layout/theme.liquid` — conditional client CSS + JS**

Edit the head stylesheet block: after the `{{ 'ph-design-tokens.css' | asset_url | stylesheet_tag }}` line (line 36), insert:

```liquid
  {%- if settings.ph_active_design != 'none' -%}
    {{ 'client-' | append: settings.ph_active_design | append: '.css' | asset_url | stylesheet_tag }}
  {%- endif -%}
```

Edit the script block: after the `{{ 'theme.js' | asset_url }}` defer line (line 365), insert:

```liquid
  {%- if settings.ph_active_design != 'none' -%}
    <script type="module" src="{{ 'client-' | append: settings.ph_active_design | append: '.js' | asset_url }}"></script>
  {%- endif -%}
```

- [ ] **Step 6: Modify `snippets/theme-import-map.liquid` — conditional client entry**

Edit the import map so the client entry is first (only when active — keeps JSON valid, no trailing comma):

```liquid
<script type="importmap">
{
  "imports": {
    {%- if settings.ph_active_design != 'none' -%}
    "client-{{ settings.ph_active_design }}": "{{ 'client-' | append: settings.ph_active_design | append: '.js' | asset_url }}",
    {%- endif -%}
    "ui-base-media": "{{ 'ui-base-media.js' | asset_url }}",
```
(Rest of the file unchanged.)

- [ ] **Step 7: Add locale keys**

`locales/en.default.schema.json` — add to `settings_schema` object:

```json
    "ph_designs": {
      "name": "Client designs",
      "settings": {
        "ph_active_design": {
          "label": "Active client design",
          "options": {
            "none": { "label": "None (default PHANTOM)" },
            "demo": { "label": "Demo — Aurora Studio" }
          }
        }
      }
    }
```

Add to `sections` object:

```json
    "client_demo_hero": {
      "name": "Demo — hero",
      "settings": {
        "title": { "label": "Eyebrow" },
        "image": { "label": "Image" },
        "headline": { "label": "Headline" },
        "subtitle": { "label": "Subtitle" },
        "cta_label": { "label": "CTA label" },
        "cta_url": { "label": "CTA link" }
      },
      "presets": { "name": "Demo hero" }
    },
    "client_demo_collection": {
      "name": "Demo — featured collection",
      "settings": {
        "collection": { "label": "Collection" },
        "heading": { "label": "Heading" },
        "limit": { "label": "Products to show" },
        "show_badges": { "label": "Show sale badges" }
      },
      "presets": { "name": "Demo featured collection" }
    },
    "client_demo_footer": {
      "name": "Demo — footer",
      "settings": {
        "brand_text": { "label": "Brand text" },
        "footer_text": { "label": "Footer text" },
        "menu": { "label": "Menu" }
      },
      "presets": { "name": "Demo footer" }
    }
```

`locales/en.default.json` — add to `sections` object:

```json
    "client_demo_collection": {
      "empty": "Choose a collection in the section settings.",
      "sale_badge": "Sale"
    }
```

Validate both: `Get-Content ... | ConvertFrom-Json | Out-Null` → no error.

- [ ] **Step 8: Full theme-check**

Run:
```powershell
shopify theme check --path "phantom-theme-v2.2.0"
```
Expected: `no offenses found` (≈272 files). If MatchingTranslations errors appear, verify keys landed in both locale files and re-run.

- [ ] **Step 9: Commit**

```powershell
git add phantom-theme-v2.2.0/assets/client-demo.js phantom-theme-v2.2.0/config/settings_schema.json phantom-theme-v2.2.0/config/settings_data.json phantom-theme-v2.2.0/layout/theme.liquid phantom-theme-v2.2.0/snippets/theme-import-map.liquid phantom-theme-v2.2.0/locales/en.default.schema.json phantom-theme-v2.2.0/locales/en.default.json
git commit -m "feat: demo design activation wiring — toggle, scope root, assets, locales"
```

---

### Task 6: QA gate + fidelity report + final commit + push

**Files:**
- Create: `docs/integration/demo/fidelity-report.md` (QA-07 record)
- No production code changes.

**Interfaces:**
- Consumes: everything from Tasks 1–5.
- Produces: proof of the full Task 03 DoD + pushed `main` on `shopify-demo`.

- [ ] **Step 1: theme-check**

Run:
```powershell
shopify theme check --path "phantom-theme-v2.2.0"
```
Expected: `no offenses found`.

- [ ] **Step 2: build check**

Run:
```powershell
cd phantom-theme-v2.2.0\designs\build
node build.mjs --slug demo --check
```
Expected: `OK demo` and size < 60 KB.

- [ ] **Step 3: client CSS contract audit**

Run (all must print False):
```powershell
$css = Get-Content "phantom-theme-v2.2.0\assets\client-demo.css.liquid" -Raw
$css -match "(?m)^:root"
$css -match "(?m)^body"
$css -match "!important"
$css -match "z-index:\s*[1-9][0-9]{4,}"
```

- [ ] **Step 4: default-path regression audit (git diff)**

Run:
```powershell
git diff main --stat
git show --stat HEAD~1
```
Expected: working tree clean; the ONLY files that touch the default render path are `layout/theme.liquid` (conditional blocks), `snippets/theme-import-map.liquid` (conditional entry), `config/settings_schema.json`, `config/settings_data.json`, locales. `templates/index.json` and all global CSS/JS assets unmodified. Confirm the body-tag diff is additive-only and inert when `ph_active_design = none`.

- [ ] **Step 5: Static render verification of `page.demo` composition**

Run:
```powershell
Get-Content "phantom-theme-v2.2.0\templates\page.demo.json" -Raw | ConvertFrom-Json | Out-Null
Get-Content "phantom-theme-v2.2.0\sections\client-demo-collection.liquid" | Select-String -Pattern "product.title|product.url|product.featured_image|product.price|product.compare_at_price|product.available" -AllMatches
```
Expected: JSON valid; all six dynamic fields present in the collection section (dynamic commerce proof — QA gate #8).

- [ ] **Step 6: Visual fidelity record (QA-07)**

Run Playwright (or browser screenshots) on `phantom-theme-v2.2.0/designs/demo/source/index.html` at widths **1440, 1200, 992, 768, 576, 390** and save screenshots to `docs/integration/demo/screenshots/`. Then create `docs/integration/demo/fidelity-report.md`:

```markdown
# Demo design — Visual Fidelity Report (QA-07)

- Design: `designs/demo` (Aurora Studio) — frozen source `designs/demo/source/index.html`
- Date: 2026-08-16
- Method: source reference captured at 1440/1200/992/768/576/390 px
  (`docs/integration/demo/screenshots/`). Live storefront render requires a
  connected Shopify store (no auth in this environment) — recorded as manual
  editor QA for the demo page: assign `page.demo` template, set
  `ph_active_design = demo`, compare against the reference screenshots.

| Dimension | Source (reference) | Shopify render (manual QA) | Status |
|---|---|---|---|
| HTML structure | hero → collection (3-col) → footer | page.demo = hero/collection/footer | pending live store |
| Typography | serif headings, muted body | `--ph-color*` tokens + design CSS | pending live store |
| Spacing | 96/72/80 px section rhythm, 16px gutters | design CSS `.ph-client__*` | pending live store |
| Container widths | Bootstrap `.container` | scoped containers module | pending live store |
| Grid | 1/2/3 cols @ 576/768 | `.row.g-4` + `.col-12.col-sm-6.col-md-4` | pending live store |
| Colors | warm palette | token bridge (`--ph-color*` → `--demo-*`) | pending live store |
| Borders/Shadows | 12px radius, hover lift | design CSS | pending live store |
| Responsive | reflow at all widths | scoped Bootstrap grid | pending live store |
| Hover | card lift + link accent | design CSS | pending live store |
| Animation | scroll reveal, reduced-motion off | `client-demo.js` IO reveal + CSS guard | pending live store |

Automated checks performed in this environment (no store): theme-check 0 offenses,
build check OK (< 60 KB), CSS contract audit clean, dynamic-data fields present in
collection section, default-path git diff audit clean. Live-store render QA is the
remaining manual gate (documented above).
```

- [ ] **Step 7: Final full QA sweep**

Run in order; all must pass:
```powershell
shopify theme check --path "phantom-theme-v2.2.0"
git status --short
node designs/build/build.mjs --slug demo --check   # from designs/build
```
Expected: 0 offenses; clean tree; build OK.

- [ ] **Step 8: Commit the fidelity report**

```powershell
git add docs/integration/demo
git commit -m "docs: Task 03 QA-07 visual fidelity record + screenshots"
```

- [ ] **Step 9: Push to the current origin (shopify-demo, main)**

Run:
```powershell
git push origin main
```
Expected: push succeeds to `https://github.com/HAmmadsiamil007/shopify-demo.git`. If rejected (remote ahead), pull `--rebase` first, then push. NEVER touch the frozen `shopify-phantom-` repo.