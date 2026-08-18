# Design Pack Wave 1 — AETHER Commerce Core Implementation Plan (AETHER Master, Phase 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the approved frozen frontend (`frontend/frontend/`) into the first production AETHER commerce sections — announcement bar, header, footer, hero, featured products, collection grid, product, cart — preserving the approved visual design, while keeping PHANTOM Core untouched. This is Phase 1 of building the **AETHER MASTER** — the one reusable premium starter that every future client store is copied from.

---

## Master Operating Model (business architecture — read first)

The business objective is **NOT a multi-theme marketplace**. It is:

> **ONE stable PHANTOM foundation + ONE premium AETHER Master frontend + MANY independent client copies.**

```
                        PHANTOM MASTER
                              │
               ┌──────────────┴──────────────┐
               │                             │
          PHANTOM CORE                  AETHER MASTER
               │                             │
        Shopify commerce              Premium starter UI
        Theme runtime                 Liquid sections
        Settings                      CSS
        Adapters                      JS / motion
        Cart / search                 Templates
        Theme Editor                  Tokens / assets
               │                             │
               └──────────────┬──────────────┘
                              │
                    PROTECTED MASTER
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
      CLIENT A            CLIENT B            CLIENT C
          │                   │                   │
       modify               modify             modify
       AETHER               AETHER             AETHER
          │                   │                   │
          ▼                   ▼                   ▼
       Shopify             Shopify             Shopify
```

### Rules

1. **Master immutability.** The PHANTOM + AETHER Master is the golden baseline. It is versioned/tagged (`PHANTOM-AETHER-MASTER-v1.0`, `v1.1`, …). New clients start from the latest approved master. **Never** modify the master for a client; **never** start a client from another client's customized theme.
2. **Client copies.** Each client gets an independent copy of the master (own Git repo/branch, own Shopify theme, own assets, own build). The client's approved external frontend (HTML/CSS/JS premium design, built outside Shopify) is the visual source of truth for that copy.
3. **AETHER transformation.** In the client copy, ONLY the AETHER presentation layer is transformed to the client's approved design: sections, snippets, templates, CSS, JS, motion, assets, tokens, composition. PHANTOM Core, commerce adapters, cart/search infrastructure, event systems, and the Theme Editor runtime are normally NOT touched.
4. **Design freeze.** No Shopify conversion before client approval. After approval: no silent redesign; every structural deviation logged (`ORIGINAL → WHY → SHOPIFY CONSTRAINT → NEW → VISUAL IMPACT`); client changes become a new revision.
5. **Backports are deliberate.** A client improvement is backported to the Master only when it is proven generic, reusable, safe, and explicitly approved — then it becomes a new master version. Existing clients stay independent.
6. **No permanent design packs.** Do NOT build NOVA / LUXE / other permanent packs. The generic Design Pack runtime/resolver built in Wave 0 remains as future-proofing infrastructure (it already exists and is tested), but it is not the primary client workflow. AETHER is the reusable premium starter; each client's design lives inside that client's copy.
7. **Conversion playbook.** After AETHER Master reaches a stable release, the next major engineering task is a *Client Conversion Playbook*: exact procedure for taking `frontend/`, freezing it, mapping components, transforming AETHER, preserving PHANTOM, and delivering a new client store repeatedly.

### Master roadmap (this plan = Phase 1)

- **Phase 1 (THIS plan, Wave 1):** AETHER commerce core — announcement bar, header, footer, hero, featured products, collection grid, product, cart. Gates: theme-check 0 offenses, registry PASS, CSS ≤ 60 KB hard ceiling, visual parity against the frozen frontend.
- **Phase 1 (Wave 2):** AETHER content sections — blog, article, page, FAQ, team, testimonials, contact, newsletter, promo, 404, search, legal. Same gates.
- **Phase 1 (Wave 3):** Customer account flow — login, register, account, addresses, password, wishlist — plus final QA.
- **Phase 0/2 (Master hardening):** after Wave 3: full gates (theme-check, registry, visual + functional parity, editor + mobile + a11y + performance, PHANTOM regression), client-editability audit (replace header/hero/cards/product/collection/cart/footer/typography/color/motion without touching Core), tag `PHANTOM-AETHER-MASTER-v1.0`, document master version + known limitations, create the clean client-copy procedure.
- **Phase 3+ (per client):** copy master → external client design → approval → DESIGN FREEZE → transform the copy's AETHER layer → Shopify data → QA → deliver. Never start from another client's theme.

The rest of this plan is the unchanged Wave 1 execution detail. Full reference (15 phases, master-vs-client rules, DoD): `docs/superpowers/specs/2026-08-18-phantom-master-operating-model.md`.

---

## Global Constraints

- **AETHER is a reference implementation of the Design Pack API — the first complete pack, and the reusable premium starter (AETHER Master). AETHER is NOT the Design Pack runtime/architecture. Per the Master Operating Model, no additional permanent packs (NOVA, LUXE) are built; each future client receives an independent copy of the Master whose AETHER layer is transformed to that client's approved design. If a new pack is ever justified, it must implement the same generic Design Pack contract (sections, templates, assets, settings, locales, controllers, manifest, visual source) without inheriting AETHER's settings, tokens, or visual assumptions. Nothing in this wave may hard-wire AETHER specifics into shared Core files.**
- **Visual source of truth:** `frontend/frontend/` is FROZEN. Do NOT redesign, simplify, or replace it. Every structural deviation must be documented as `ORIGINAL → WHY → SHOPIFY CONSTRAINT → NEW → VISUAL IMPACT` (see Task 12). No silent visual compromises.
- **Liquid replaces DATA, never DESIGN:** map products/collections/variants/prices/images/menus/cart/URLs/settings into the approved markup. `data-phantom-*` attributes are inert WordPress-era hooks — strip them (data comes from Shopify objects now).
- **Core is untouchable:** do NOT modify `assets/theme.js`, `assets/phantom-vendor.js`, `assets/theme.css.liquid`, `snippets/css-variables.liquid`, `assets/ph-design-tokens.css.liquid`, `layout/theme.liquid`, `config/settings_schema.json`, `config/settings_data.json`, or any non-`aether-*`/group/template/locale file, unless a task explicitly proves an unavoidable requirement (must be approved by the implementing reviewer).
- **Pack JS must not register into `theme.sections`** (`theme.js` owns lifecycle). Controllers mount via `window.__aetherRuntime` on `phantom:ready` + `shopify:section:load/unload/select/deselect` + `shopify:block:select/deselect`. Controllers are idempotent (`init/destroy/refresh`), no duplicate listeners/observers, AbortController teardown, respect `prefers-reduced-motion` + `data-disable-animations` + `settings.aether_motion_enable`.
- **CSS pack-scoped:** every rule references `.ph-client--aether` or `.aether-*` classes; zero `:root`, zero bare-element overrides, zero `!important` architecture, z-index within the pack budget (`--aether-z-*` ≤ 10000, reuse existing 5000/9000/9050/9500/9700 scale).
- **Budgets (spec §11 / manifest):** HARD ceiling — `assets/aether.css.liquid` + ALL section `{% stylesheet %}` blocks (worst-case page) ≤ 60 KB served; `assets/aether.js.liquid` ≤ 40 KB; `assets/aether-product.js` ≤ 20 KB; vendored libs loaded on demand only (Swiper when a slider exists, GSAP when motion elements exist, Lenis when motion enabled). ADDITIONALLY measure (informational — no hard page limits yet) the ACTUAL per-page payload: Home / Collection / Product / Cart (aether.css.liquid + only the sections that template loads incl. header/footer groups + aether-swiper.min.css on slider pages); record the numbers in `docs/aether/fidelity-report.md` (Task 13).
- **Libraries are intentional:** the frozen pages actually use only Swiper 11, GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.18, Bootstrap grid (reimplemented with CSS, not shipped). jQuery/Owl/WOW/Three.js/effects.js are NOT used on the 4 commerce pages — do not ship them.
- **Locales:** every new section needs `t:sections.<name>.*` keys in ALL 7 `locales/*.schema.json`; runtime UI strings need `t:aether.*` keys in ALL 7 `locales/*.json`. `MatchingTranslations` is the QA gate (failure-register row 17).
- **QA gates per task:** `shopify theme check` (in `phantom-theme-v2.2.0/`) = 0 offenses; `node designs/build/check-registry.mjs` = PASS; untouched-file audit; frequent commits; NEVER push.
- **Editor/coexistence:** every section must survive ADD/REMOVE/RE-ADD/MOVE/DUPLICATE/EDIT SETTINGS/EDIT BLOCKS/SAVE/RELOAD and mixing with PHANTOM sections (index.aether.json is the coexistence composition).
- **DoD:** sections independently renderable/editable, schema-driven, responsive, accessible, CSS/JS scoped, safe in editor, safe mixed with PHANTOM. No section requires another AETHER section to function unless documented (aether-product's sticky-bar/gallery are internal).
- **Reuse PHANTOM integration points** (documented boundaries, not redesigns): `form.product` (product-form custom element → `/cart/add.js`), `product-recommendations` element contract if used, `cart:updated`/`cart:quantity`/`product-form:*` events, `theme-resource-loader` (`loadScript`/`loadCSS`), PHANTOM predictive search (header search action), PHANTOM `newsletter-form` snippet (footer newsletter), `lazy-load` via `ui-image` if reused (else native `loading="lazy"`), PHANTOM cart AJAX architecture (Task 9 Step 0 — reuse its canonical events/helpers/refresh; AETHER owns presentation only).

---

## File Structure (exact scope — Wave 1)

### Create (theme)
| File | Responsibility |
|---|---|
| `sections/aether-hero.liquid` | Hero slider section (blocks = slides) |
| `sections/aether-featured-products.liquid` | Bestsellers grid section |
| `sections/aether-collection-grid.liquid` | Shop/collection grid section (header + pills + sort + grid + pagination) |
| `sections/aether-product.liquid` | Product page section (gallery/info/specs/reviews/related/sticky bar) |
| `sections/aether-cart-items.liquid` | Cart items + summary section |
| `snippets/aether-product-card.liquid` | AETHER product card (rich + simple variant) |
| `snippets/aether-section-header.liquid` | Label/title/subtitle header pattern |
| `snippets/aether-pagination.liquid` | Frozen pagination markup |
| `templates/cart.aether.json` | Cart template alternate |
| `assets/aether-product.js` | Product controller (gallery, zoom, variants, qty, sticky, accordion, modal, related) |
| `assets/aether-motion.js` | GSAP motion system (reveals, text masks, tilt, magnetic, parallax, counters) |
| `assets/aether-swiper.min.js` | Vendored Swiper 11 UMD |
| `assets/aether-swiper.min.css` | Vendored Swiper 11 CSS |
| `assets/aether-gsap.min.js` | Vendored GSAP 3.12.5 + ScrollTrigger (single UMD bundle) |
| `assets/aether-lenis.min.js` | Vendored Lenis 1.1.18 UMD |
| `designs/aether/source/index.html` | Static proof page — home composition (Task 13 parity) |
| `designs/aether/source/shop.html` | Static proof — collection |
| `designs/aether/source/product-detail.html` | Static proof — product |
| `designs/aether/source/cart.html` | Static proof — cart |
| `docs/design-packs/liquid-scope-boundaries.md` | Render vs include boundary doc (Task 12) |
| `docs/aether/fidelity-report.md` | Parity + editor QA evidence report (Task 13; screenshots under `docs/integration/aether/references/` are generated evidence) |

### Modify (theme)
| File | Scope of change |
|---|---|
| `assets/aether.css.liquid` | Rewrite: tokens + primitives + chrome (announcement/header/footer) + shared components; scoped `.ph-client--aether` / `.aether-*` |
| `assets/aether.js.liquid` | Extend runtime (select/deselect/block/cart events, motion bootstrap) + controllers: announcement, header, footer, hero, featured-products, collection-grid, cart-items |
| `sections/aether-announcement-bar.liquid` | Production: blocks[message] (icon+text), schema, styles, rotation controller |
| `sections/aether-header.liquid` | Production: logo/menu/actions schema, styles, scroll states, dropdown, ≤1024 overlay, ≤768 drawer, search, cart count |
| `sections/aether-footer.liquid` | Production: blocks (brand/menus/newsletter), styles, payments, legal |
| `templates/index.aether.json` | Rebuild: coexistence composition (aether-hero, PHANTOM promo-grid, aether-featured-products, PHANTOM background-image-text, aether-collection-grid, PHANTOM blog-posts) |
| `templates/collection.aether.json` | Rebuild: aether-collection-grid |
| `templates/product.aether.json` | Rebuild: aether-product + PHANTOM recently-viewed |
| `locales/*.schema.json` (×7) | `t:sections.aether-hero/featured-products/collection-grid/product/cart-items.*` + extended announcement/header/footer keys |
| `locales/*.json` (×7) | `t:aether.*` runtime UI strings (first runtime keys for AETHER) |
| `designs/build/check-registry.mjs` | Extend: aether section inventory check + CSS budget check (≤60 KB worst-case page) |

### Not touched (locked)
`theme.js`, `phantom-vendor.js`, `theme.css.liquid`, `css-variables.liquid`, `ph-design-tokens.css.liquid`, `theme.liquid`, `settings_schema.json`, `settings_data.json`, `design-pack-resolver.liquid` (7 lists already cover aether), `sections/header-group.json`/`footer-group.json`/`popup-group.json` + their `.aether` alternates (already reference the aether chrome sections by type — no change needed), all PHANTOM sections/snippets/assets.

### Frozen-source references used per component (copy, don't redesign)
- Announcement: `index.html:170-178`, `style.css:394-424`, `main.js:109-119`, `responsive.css:288+` (mobile)
- Header: `index.html:183-227`, `style.css:427-629`, `responsive.css:68-285` (overlay) + `288-1043` (drawer), `main.js:13-50` (scroll) + `454-476` (search overlay — replaced by PHANTOM predictive reuse)
- Footer: `index.html:757-829`, `style.css:1639-1789`, `animations.js:286-295,394-406`
- Hero: `index.html:234-323`, `style.css:683-842`, `main.js:141-211`, `animations.js:656-708,748-763`
- Product card (rich): `index.html:390-515`, `style.css:1008-1141`; (simple): `shop.html:244-312`, `style.css:2077-2099`
- Collection/shop: `shop.html:207-329`, `style.css:2077-2081,3948-4011`, `main.js:511-525`
- Product page: `product-detail.html:208-611,714-750`, `style.css:2143-2471` + accordion/reviews/related, `main.js:353-430,479-509`, `responsive.css:1473-1531`
- Cart: `cart.html:476-546` (+ inline page CSS lines 59-91, 179-190, 235-291), `responsive.css:841-859,1252-1267,1385-1394`
- Shared: tokens `style.css:1-42`, buttons `style.css:4104-4131`, section headers (`section-header/section-label/section-title/section-subtitle`), fog (`fog1.png`/`fog2.png`), motion system `animations.js` + `motion.css`

### Pre-declared deviations (complete list; no others allowed without recording one)
| # | ORIGINAL (frozen) | WHY | SHOPIFY CONSTRAINT | NEW | VISUAL IMPACT |
|---|---|---|---|---|---|
| D1 | Static review cards + bars on product page | Reviews are app-managed commerce data, not design content | Shopify reviews via `@app` blocks | `@app` review slot (plus optional custom review block with frozen styling for the summary card when no app installed) | App-dependent review content; layout structure preserved |
| D2 | Search overlay built dynamically by `main.js` | PHANTOM already ships predictive search (drawer, `predictive-search:open` bus) | Reusing Core = sanctioned integration boundary, avoids duplicate search infra | AETHER search icon opens PHANTOM predictive-search drawer | Search UI is PHANTOM-styled, not AETHER-styled (documented coexistence) |
| D3 | `#searchOverlay`/magnify-lens etc. not implementable identically | — (no deviation) | — | — | — |
| D4 | Filter pills on shop.html are visual-only (no filtering) | Frozen behavior is decorative navigation | — | Pills = menu of collections (settings `filter_menu` link_list); Shopify `sort_by` dropdown added | Pills become functional navigation; sort control added (data, not design) |
| D5 | Reviews/FAQ/category/newsletter sections on home (index.html) not in Wave 1 scope | User Wave 1 scope = 8 commerce components; content sections are Wave 2 | — | Home composition = AETHER commerce sections interleaved with PHANTOM sections (Task 10) | Interim mixed design until Wave 2 replaces remaining blocks |
| D6 | Static cart qty/remove were unbound hooks (`.qty-btn`, `.remove-product`) | Commerce functionality must be real | — | Wire to Shopify cart line item updates (`/cart/change.js` via `cart:quantity` events + `cart:updated`) | Functionality added; markup unchanged |
| D7 | `product-detail.html` color swatches are cosmetic | Variants must be purchasable | — | Controls bind to product options via a GENERIC variant engine: ALL option groups rendered from `product.options_with_values`, variant matching by option POSITION (never hard-coded option1=color/option2=size); frozen swatch/tile presentation applied as an option-NAME display heuristic only. Own selector logic — `theme.Variants` doesn't attach to unregistered sections | Same UI; selection actually changes variant/price; engine works for any Shopify option set |
| D8 | Fonts via Google Fonts in frozen pages | Theme must be self-contained | — | AETHER implementation choice: Fontshare CDN link injected by aether.js via `loadCSS` (Cabinet Grotesk + Satoshi; `aether_heading_font`/`aether_body_font` settings keep PHANTOM font-picker contract). NOT a Design Pack requirement — the generic pack font strategy (theme font picker OR theme-hosted font OR approved external font) goes into design-pack-contract.md (Task 12) | Identical fonts (Cabinet Grotesk + Satoshi) |
| D9 | `.cart-count` hardcoded 0/2 | Must reflect real cart | — | `{{ cart.item_count }}` + live update on `cart:updated` | Data, not design |
| D10 | Home-page snap-scroll (ScrollTrigger snap sections) | Conflicts with Lenis + Shopify scroll; fragile across mixed sections | — | Snap disabled in AETHER port; reveal/parallax/motion preserved | Subtle scroll-feel change on home only (documented, deliberate) |
| D11 | `data-tilt`/`data-magnetic` on cards/buttons | GSAP-only micro-interactions | — | Ported into aether-motion.js, gated on motion enable + non-touch + reduced-motion | Identical on capable devices |

---

## Task 1: Foundation — vendor libs, motion module, runtime extension, budget gate

**Files:**
- Create: `assets/aether-swiper.min.js`, `assets/aether-swiper.min.css`, `assets/aether-gsap.min.js`, `assets/aether-lenis.min.js` (download pinned versions: swiper@11.1.14, gsap@3.12.5 + ScrollTrigger 3.12.5, lenis@1.1.18; UMD/min builds from jsdelivr)
- Create: `assets/aether-motion.js`
- Modify: `assets/aether.js.liquid` (runtime + bootstrap)
- Modify: `designs/build/check-registry.mjs` (budget + inventory checks)

**Interfaces:**
- Consumes: `theme-resource-loader` (`loadScript(src, globalName)`, `loadCSS(href)` — import-map keys), event bus (`phantom:ready`, `shopify:section:*`, `cart:updated`), settings via `data-` on `<body>` (`data-disable-animations`), `--aether-*` CSS vars from `aether.css.liquid`
- Produces: `window.__aetherRuntime` with `controllers` registry (later tasks register `aether-announcement-bar`, `aether-header`, `aether-footer`, `aether-hero`, `aether-featured-products`, `aether-collection-grid`, `aether-cart-items`); `window.AetherMotion` (motion engine) with `AetherMotion.init(scope)`, `AetherMotion.destroy(scope)`, `AetherMotion.refresh(scope)`; gate checks `REGISTRY: PASS`, `BUDGET: PASS`

- [ ] **Step 0: Verify the real `theme-resource-loader` contract (pre-code investigation — do NOT invent one)**

Read the actual PHANTOM implementation before writing any loader code:
- grep `theme-resource-loader` in `assets/theme.js` and `assets/phantom-vendor.js`; find the real import shape (e.g. `import { loadScript, loadCSS } from 'theme-resource-loader'`) and the module's actual export names + signatures.
- Confirm `loadScript(src, globalName)` → Promise resolving when the global exists, and `loadCSS(href)` → Promise.
- Document the verified contract in this plan before editing `aether.js.liquid`. If the loader is not importable from an aether.js context, use the same mechanism theme.js itself uses to load non-module scripts — reuse, don't invent.
- **Rule:** AETHER reuses the existing loader API. No new ES-module dependency system; no import shape that differs from the verified one.

- [ ] **Step 1: Vendor the three libraries**

```bash
# in phantom-theme-v2.2.0/assets/
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/swiper@11.1.14/swiper-bundle.min.js" -OutFile aether-swiper.min.js
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/swiper@11.1.14/swiper-bundle.min.css" -OutFile aether-swiper.min.css
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js" -OutFile aether-gsap.min.js
# ScrollTrigger is a separate UMD file in gsap@3.12.5; append it after gsap so the bundle exposes both globals
(Get-Content aether-gsap.min.js -Raw) + "`n" + (Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js").Content | Set-Content aether-gsap.min.js
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.min.js" -OutFile aether-lenis.min.js
```

Verify (no hard size thresholds — sizes are informational baselines only, per human ruling):
1. Each file exists.
2. Pinned version matches: swiper@11.1.14, gsap@3.12.5 (+ ScrollTrigger 3.12.5), lenis@1.1.18.
3. Bundle valid/non-corrupt with expected global exposure: `aether-swiper.min.js` exposes `Swiper`; `aether-gsap.min.js` exposes both `gsap` and `ScrollTrigger`; `aether-lenis.min.js` exposes `Lenis`.
4. Record ACTUAL byte sizes in the report (baseline, not failure thresholds — measured at plan time: swiper ≈ 151.7 KB, gsap+ScrollTrigger ≈ 115.6 KB, lenis ≈ 13 KB).
Performance control = on-demand loading only (vendoring ≠ loading — never all three loaded globally just because they're vendored) + existing 60 KB served-CSS ceiling + per-page payload measurements.

- [ ] **Step 2: Extend `designs/build/check-registry.mjs` — aether inventory + budget checks**

Add after the existing group checks:

```js
// AETHER WAVE 1 INVENTORY: every aether-* section file must exist
const aetherSections = ['aether-announcement-bar','aether-header','aether-footer','aether-hero','aether-featured-products','aether-collection-grid','aether-product','aether-cart-items'];
for (const name of aetherSections) {
  const p = join(THEME_DIR, 'sections', name + '.liquid');
  check(`aether section exists ${name}.liquid`, existsSync(p), p);
}
// BUDGET HARD CEILING: aether.css.liquid + ALL section {% stylesheet %} blocks (raw bytes, excludes
// liquid tags) — gate FAILS if processed sum > 60000
const budgetBytes = await computeAetherCssBudget(THEME_DIR); // helper: read aether.css.liquid, strip {% liquid %} tags, add section stylesheet blocks (regex /{%\s*stylesheet\s*%}([\s\S]*?){%\s*endstylesheet\s*%}/g), strip html comments
check('BUDGET aether css pack ceiling <= 60000 B', budgetBytes.ok, `${budgetBytes.bytes} B`);
// PER-PAGE MEASUREMENT (informational — no hard page limits yet): actual payload per template =
// aether.css.liquid + stylesheet blocks of only the sections that template loads (incl. header/footer
// groups) + aether-swiper.min.css when the page has a slider section. Printed here, recorded in
// docs/aether/fidelity-report.md at Wave 1 close (Task 13).
const pageBudgets = await computeAetherPageCssBudgets(THEME_DIR); // returns { home, collection, product, cart } bytes
// VENDOR ASSETS exist
for (const f of ['aether-swiper.min.js','aether-swiper.min.css','aether-gsap.min.js','aether-lenis.min.js','aether-motion.js','aether-product.js']) {
  check(`aether asset exists ${f}`, existsSync(join(THEME_DIR,'assets',f)), '');
}
```

Expected: `REGISTRY: PASS` with the new checks (the aether section inventory intentionally FAILS for sections not yet created mid-wave — acceptable until Task 9 completes; the budget + vendor-asset checks must be green once Task 1 lands. Full green = Wave 1 end, Task 13 Step 5).

- [ ] **Step 3: Extend `assets/aether.js.liquid` runtime — full lifecycle + lazy vendor loading + motion bootstrap**

Keep the skeleton's contract header; replace `_bind()` to add select/deselect/block events, add `_loadVendors()` and cart integration. Key additions (preserve existing AbortController pattern):

```js
// in EVENTS map add:
sectionSelect: 'shopify:section:select', sectionDeselect: 'shopify:section:deselect',
blockSelect: 'shopify:block:select', blockDeselect: 'shopify:block:deselect', cartUpdated: 'cart:updated',

// runtime state: this._libraries = { swiper: false, gsap: false, lenis: false };

async _loadVendors() {
  // Loader = the VERIFIED PHANTOM contract from Step 0 (named exports loadScript/loadCSS,
  // or whatever Step 0 actually found). No default-or-named guessing in code.
  const loader = <verified loader reference from Step 0>;
  const needs = {
    swiper: !!this._root.querySelector('.aether-swiper, .aether-hero, .aether-gallery-main, .aether-related'),
    gsap: this._motionEnabled() && !!this._root.querySelector('[data-aether-motion], .aether-reveal, .aether-tilt, .aether-magnetic, [data-aether-parallax]'),
  };
  if (needs.swiper && !this._libraries.swiper) {
    await loader.loadCSS('{{ "aether-swiper.min.css" | asset_url }}');
    await loader.loadScript('{{ "aether-swiper.min.js" | asset_url }}', 'Swiper');
    this._libraries.swiper = true;
  }
  if (needs.gsap && !this._libraries.gsap) {
    await loader.loadScript('{{ "aether-gsap.min.js" | asset_url }}', 'gsap');
    this._libraries.gsap = true;
    this._libraries.scrollTrigger = true;
  }
  if (this._motionEnabled() && !this._libraries.lenis) {
    await loader.loadScript('{{ "aether-lenis.min.js" | asset_url }}', 'Lenis');
    this._libraries.lenis = true;
    window.AetherMotion.initLenis(this._motionEnabled());
  }
  // SINGLE MODULE CONTRACT (load → expose → init → refresh → destroy):
  // aether.js.liquid is the ONLY file that loads aether-motion.js. aether-motion.js is an
  // ES module exporting { AetherMotion }. The runtime exposes exactly one API: window.AetherMotion
  // (module singleton, idempotent). Controllers + aether-product.js consume ONLY window.AetherMotion
  // (no other direct imports of aether-motion.js anywhere; aether-product.js waits for phantom:ready
  // / window.AetherMotion presence before any motion work).
  const mod = await import('{{ "aether-motion.js" | asset_url }}');
  window.AetherMotion = window.AetherMotion || mod.AetherMotion;
}

_motionEnabled() {
  return !document.documentElement.matches('.no-motion, .aether-no-motion') &&
    window.matchMedia('(prefers-reduced-motion: no-preference)').matches &&
    document.body.dataset.disableAnimations !== 'true' &&
    !(window.Shopify && Shopify.designMode);
}

async init() {
  // existing gate (.ph-client--aether + section count), then:
  await this._loadVendors();
  this._bind();
  this._scan(...);
  this._bindCartCount();   // updates .aether-cart-count on cart:updated via /cart.js fetch
}

_bindCartCount() { /* on EVENTS.cartUpdated + section load: fetch('/cart.js').then(r=>r.json()).then(c=>{ document.querySelectorAll('.aether-cart-count').forEach(el=>el.textContent=c.item_count) }) */ }
```

Also: on `_onSectionLoad`/`_onSectionUnload` keep existing closest() pattern, then call `window.AetherMotion && AetherMotion.refresh(root)` / `destroy(el)` for removed sections; `shopify:section:select/deselect` → pause/resume motion (mirror `client-demo.js.liquid:163-171`); `shopify:block:select/deselect` → no-op stub (recorded for editor awareness).

- [ ] **Step 4: Create `assets/aether-motion.js` — port of the frozen motion system**

Port `frontend/frontend/assets/js/animations.js` (941 lines) 1:1 semantics into an ES module (no class-based controller; module singleton). **Export contract:** named export `AetherMotion` (singleton object with `init(scope)`, `refresh(scope)`, `destroy(scope)`, `initLenis(enabled)`); loaded ONLY by the runtime (Step 3), which assigns the single global `window.AetherMotion`:

```js
export const AetherMotion = {
  init(scope = document) {
    // guards: reduced-motion / data-disable-animations / settings.aether_motion_enable (read via <html data-aether-motion="0|1"> set in aether.js boot)
    // auto-assign reveals exactly as animations.js:169-411 (section-label/section-title/section-subtitle/
    //   .aether-product-card cycle by column/.aether-btn/.aether-section-header/.aether-pd-info/.aether-gallery-main)
    // data-aether-motion-text="words|lines" word/line masks (animations.js:568-616)
    // data-aether-reveal="preset" + delay (animations.js:44-167)
    // data-aether-tilt / data-aether-magnetic / data-aether-parallax / data-aether-parallax-speed (animations.js:748-763)
    // data-aether-countup; .aether-bar-fill width animation (animations.js:586-595)
    // ScrollTrigger instance registry per scope; ScrollTrigger.refresh() after images load
  },
  refresh(scope) { /* ScrollTrigger.refresh(); re-init new elements */ },
  destroy(scope) { /* kill triggers in scope, restore visibility for reduced-motion */ },
  initLenis(enabled) { /* new Lenis({ duration:1.2, easing:(t)=>Math.min(1,1.001-Math.pow(2,-10*t)), wheelMultiplier:1, touchMultiplier:1.5 }); RAF loop + ScrollTrigger.update; respect reduced-motion (lenis-scroll.js) */ },
};
```

Mapping: frozen `data-motion-text`/`data-reveal`/`data-tilt`/`data-magnetic`/`data-parallax` attributes become `data-aether-*` on AETHER markup (CSS in `motion.css` hidden-states ported as `.aether-*` classes). Add `html.aether-has-motion` class (analog of `has-motion`).

- [ ] **Step 5: Gate + commit**

Run: `shopify theme check` → expected 0 offenses (ignore inventory check failures in check-registry until sections exist). Commit:

```bash
git add phantom-theme-v2.2.0/assets/aether-swiper.min.js phantom-theme-v2.2.0/assets/aether-swiper.min.css phantom-theme-v2.2.0/assets/aether-gsap.min.js phantom-theme-v2.2.0/assets/aether-lenis.min.js phantom-theme-v2.2.0/assets/aether-motion.js phantom-theme-v2.2.0/assets/aether.js.liquid phantom-theme-v2.2.0/designs/build/check-registry.mjs
git commit -m "feat(design-pack): AETHER Wave 1 foundation — vendored swiper/gsap/lenis, motion module, runtime lifecycle extension, budget+inventory gate"
```

---

## Task 2: Announcement bar (production)

**Files:**
- Modify: `sections/aether-announcement-bar.liquid` (rewrite from skeleton)
- Modify: `assets/aether.css.liquid` (announcement styles + primitives begin)
- Modify: `assets/aether.js.liquid` (register controller `aether-announcement-bar`)

**Interfaces:**
- Consumes: settings `aether_*` tokens via CSS vars; `settings.aether_motion_enable`
- Produces: markup with root `aether-announcement-bar ph-client--aether` (keep existing), blocks `message` (icon select from Font Awesome set used in frozen: truck/bolt/undo), settings `separator`, `show_mobile_rotation`; controller handles mobile text rotation (5 s, `animations` class only when motion enabled)

- [ ] **Step 1: Rewrite section with blocks schema** — markup mirrors `index.html:170-178` exactly (`.announcement-bar > .announcement-content`, `i.fas.fa-{icon}`, `span.separator` between), but messages come from blocks; add `data-section-type="aether-announcement-bar"` + keep `disabled_on: {groups:["header"]}`. Mobile rotation list: second block text duplicated into `.aether-mobile-announcement-text` elements (only when ≥2 messages), per `main.js:109-119`.

```liquid
{% schema %}
{
  "name": "t:sections.aether-announcement-bar.name",
  "settings": [
    { "type": "checkbox", "id": "show_mobile_rotation", "default": true,
      "label": "t:sections.aether-announcement-bar.settings.show_mobile_rotation.label" }
  ],
  "blocks": [
    { "type": "message", "name": "t:sections.aether-announcement-bar.blocks.message.name",
      "settings": [
        { "type": "select", "id": "icon", "options": [
            { "value": "fa-truck", "label": "t:sections.aether-announcement-bar.blocks.message.settings.icon.options.fa-truck" },
            { "value": "fa-bolt", "label": "t:sections.aether-announcement-bar.blocks.message.settings.icon.options.fa-bolt" },
            { "value": "fa-undo", "label": "t:sections.aether-announcement-bar.blocks.message.settings.icon.options.fa-undo" } ],
          "default": "fa-truck", "label": "t:sections.aether-announcement-bar.blocks.message.settings.icon.label" },
        { "type": "text", "id": "text", "default": "Free shipping on orders over $200",
          "label": "t:sections.aether-announcement-bar.blocks.message.settings.text.label" }
      ] }
  ],
  "max_blocks": 3,
  "presets": [{ "name": "t:sections.aether-announcement-bar.presets.default.name" }]
}
{% endschema %}
```

- [ ] **Step 2: Styles in `aether.css.liquid`** — port `style.css:394-424` + `responsive.css:288+` mobile rules; scope every selector under `.ph-client--aether .aether-announcement-bar` (or `.aether-announcement-bar` — file is only served when pack active, but keep the pack prefix on all shared selectors per contract). Add `.home-page` override only if index composition needs it (Task 10 decides; default: keep translucent variant as the single style, drop the transparent home override — record as part of D-list if dropped; visual impact: same bar everywhere, acceptable).

- [ ] **Step 3: Controller** — in `aether.js.liquid`:

```js
controllers['aether-announcement-bar'] = {
  init(el) {
    this._idx = 0;
    this._items = [...el.querySelectorAll('.aether-mobile-announcement-text')];
    if (this._items.length < 2) return;
    this._timer = setInterval(() => {
      this._items.forEach((t, i) => t.classList.toggle('active', i === this._idx));
      this._idx = (this._idx + 1) % this._items.length;
    }, 5000);
    this._items[0].classList.add('active');
  },
  destroy() { clearInterval(this._timer); },
  refresh() { this.destroy(); this.init(this._el || undefined); },
};
```

(guard `this._el` pattern per skeleton `_mount(el)` → store `el` on controller).

- [ ] **Step 4: Gate + commit** — `shopify theme check` 0 offenses; theme-check-validated JSON; commit (message: `feat(design-pack): AETHER announcement bar production (blocks, styles, mobile rotation)`).

---

## Task 3: Header (production)

**Files:**
- Modify: `sections/aether-header.liquid`
- Modify: `assets/aether.css.liquid` (header + overlay + drawer styles)
- Modify: `assets/aether.js.liquid` (controller `aether-header`)

**Interfaces:**
- Consumes: `cart.item_count`, settings `menu` (link_list, default `main-menu`), `logo_text`, `logo_image`, `show_search`, `show_wishlist` (links to `/pages/wishlist`), `show_cart`, `show_account`, `announcement_bar_offset` (derive from CSS var), PHANTOM predictive search trigger
- Produces: `data-section-type="aether-header"`, `.aether-cart-count` spans (cart count hook), mobile drawer with search field (POSTs to `/search`), nav dropdown markup compatible with aether controller

- [ ] **Step 1: Rewrite section** — port `index.html:183-227` markup: `.aether-header` (fixed, `top: var(--aether-announcement-height)`), `.aether-brand-logo` (text from `logo_text` or `logo_image`), `.aether-main-nav` (menu link_list; first-level items with children get `.aether-nav-dropdown-toggle` + `.aether-nav-dropdown-menu`; items without children plain links), `.aether-header-actions` (search/wishlist/cart with `aether-cart-count` = `{{ cart.item_count }}`/account icons, `.aether-mobile-menu-btn`), and the ≤768 drawer block (`.aether-mobile-header` + `.aether-mobile-menu` with search input, nav groups, `.aether-mobile-cta`, socials). Active link = `request.page_type`/URL match (`aether-header.liquid` uses `{% if link.active %}`).

- [ ] **Step 2: Styles** — port `style.css:427-629` (fixed positioning, `--aether-header-height:80px`, scrolled/hidden states, dropdown reveal, icons, cart-count bubble), `responsive.css:68-285` (≤1024 overlay nav: `.aether-main-nav` full-screen, hamburger → X), `responsive.css:288-1043` (≤768 `.aether-mobile-header` + drawer slide-out, rotating announcement text if present, search, socials). Keep z-values within `--aether-z-*` (drawer 1200-equivalent maps to `--aether-z-drawer` 9000? NO — frozen mobile menu z=1200 vs search 9000; keep frozen relative order via pack tokens: drawer 5000, search 9000).

- [ ] **Step 3: Controller** — port `main.js:13-50` (scroll: `.aether-header--scrolled` > 80px; `.aether-header--hidden` hide/show by delta, threshold 600/100 by page type, skip ≤768), `main.js:121-126` NOT needed (product card handled in card snippet), overlay/drawer toggles (`.aether-main-nav` active ≤1024 via `.aether-mobile-menu-btn`; drawer ≤768 via `.aether-mobile-hamburger`/`.aether-mobile-menu-overlay`/close), dropdown accordion ≤991, search: click `[data-aether-search]` → if PHANTOM predictive section exists dispatch `document.dispatchEvent(new CustomEvent('predictive-search:open'))` else navigate `routes.search_url` (verify exact PHANTOM trigger in Step 5; fallback documented in D2). Cart count updates come from runtime `_bindCartCount()` (Task 1).

- [ ] **Step 4: Locale keys** — add header settings labels (logo_image, show_wishlist, show_account) to the 7 `*.schema.json` (extend `t:sections.aether-header.*`), mirror in the runtime `*.json` only if any `t:aether.*` strings used.

- [ ] **Step 5: Verify predictive-search trigger** — grep `predictive-search` in `theme.js` + `sections/predictive-search.liquid` + `snippets/predictive-search.liquid`; confirm the event/class that opens it; adjust controller accordingly. If no clean trigger exists, fallback = navigate to `routes.search_url` (D2 update).

- [ ] **Step 6: Gate + commit** — theme-check 0 offenses; commit.

---

## Task 4: Footer (production)

**Files:**
- Modify: `sections/aether-footer.liquid`
- Modify: `assets/aether.css.liquid` (footer styles)
- Modify: `assets/aether.js.liquid` (controller `aether-footer` — no-op placeholder if no JS needed)

**Interfaces:**
- Consumes: `shop.enabled_payment_types` (payment icons, existing `payment_type_svg_tag` pattern), settings `copyright_text`, `show_payment_icons`; blocks `brand` (logo text/image, tagline, social links — url/image settings per platform), `menu` (heading + link_list), `newsletter` (heading, copy; reuse PHANTOM `newsletter-form` snippet), link lists for Shop/Support/Company menus
- Produces: `.aether-footer` grid (1.5fr 1fr 1fr 1fr 1.5fr → 2 cols ≤1024 → 1 col centered ≤768), `.aether-footer-bottom` legal + payments

- [ ] **Step 1: Rewrite section** — port `index.html:757-829` exactly: brand area (logo, tagline "Step Into The Void" → setting, socials 40×40 bordered), 3 link columns via `menu` blocks (Shop/Support/Company with default link_lists per frozen: `main-menu`/`footer`-equivalent; use Shopify menus — document mapping: Shop = main-menu subset via settings, Support = footer links, Company = footer links), newsletter block (reuse `{% render 'newsletter-form' %}`), legal (`copyright_text` default "© 2026 AETHER. All Rights Reserved."), payments (existing `payment_type_svg_tag: class: 'aether-footer__payment-icon'` loop already in skeleton — keep, ensure icons match frozen FA set by size/opacity CSS). Footer submit success message = PHANTOM newsletter-form's own state (visual: PHANTOM success state — document in D-list as part of D-newsletter reuse note).

- [ ] **Step 2: Styles** — port `style.css:1639-1789` + responsive (≤1024 2-col, ≤768 1-col centered, ≤576 padding); scoped `.aether-footer-*`.

- [ ] **Step 3: Gate + commit** — theme-check 0 offenses; commit.

---

## Task 5: Product card + featured products

**Files:**
- Create: `snippets/aether-section-header.liquid`, `snippets/aether-product-card.liquid`
- Create: `sections/aether-featured-products.liquid`
- Modify: `assets/aether.css.liquid` (section header, card, grid styles)
- Modify: `assets/aether.js.liquid` (controller `aether-featured-products`)

**Interfaces:**
- `aether-section-header.liquid` props: `label, title, subtitle` → `.aether-section-header > .aether-section-label + .aether-section-title + .aether-section-subtitle`
- `aether-product-card.liquid` props: `product, variant ("rich"|"simple"), per_row, collection` →
  - rich (frozen `index.html:390-515`): `.aether-product-card` with `.aether-product-image` (aspect-ratio 1, `aether-product-badge` from settings/badges: `bestseller|new|limited` mapped from product tags/metafields `theme.label` or `_label_` per PHANTOM product-grid-item precedent), `.aether-product-actions` (wishlist→`/pages/wishlist` + quick-view→product page anchor), `.aether-product-rating` (stars — sample data replaced: stars hidden unless product has metafield rating, else show review count via `product.metafields.reviews.rating_count` if app present; default: omit rating row when no data — document D-rating), `.aether-product-name`, `.aether-product-tagline` (metafield `aether.tagline` or fallback first option values), `.aether-product-price-row` (price via `product.price` snippet reuse? NO — AETHER price markup per frozen `.aether-product-price` + sale `.aether-price-old`; use `product.selected_or_first_available_variant` + `price`/`compare_at_price`), `.aether-btn.aether-btn-sm.aether-btn-primary` Add to Cart → links to product page (frozen card click behavior `main.js:121-126`), whole-card click navigates to product URL
  - simple (frozen `shop.html:244-312`): image + badge (`.aether-badge-sale` when `compare_at_price > price`, `.aether-price-old` shown), name, price row, ATC button
- `aether-featured-products.liquid`: settings `label, title, subtitle, collection (type: collection, default main), per_row (range 1-4, default 4), rows (range 1-2, default 1), view_all`, renders cards via `aether-product-card` variant rich; empty-state placeholder (frozen has none; use section-header + muted text); `data-section-type="aether-featured-products"`; `disabled_on: {groups:["header","footer"]}`; preset with collection default

- [ ] **Step 1: Create `aether-section-header.liquid`** (markup per frozen `.section-header` pattern; classes `.aether-*`).
- [ ] **Step 2: Create `aether-product-card.liquid`** with both variants + whole-card click (`data-aether-card` → controller listens click, navigates unless target is a/button — port `main.js:121-126`).
- [ ] **Step 3: Create `aether-featured-products.liquid`** with schema above; product query via `collections[section.settings.collection].products` limited `per_row × rows`; wraps grid `.aether-products-grid` (4-col gap 24 → 2 ≤1024 → 1 ≤768 with horizontal card layout).
- [ ] **Step 4: Styles** — port `style.css:1008-1141` + responsive (≤768 2-col card layout, ≤576 1-col image 4/3), buttons `.aether-btn` family (base 16/40, sm 10/20, lg 18/44; primary gold, outline white border; shine sweep + glow hover, `border-radius:0`).
- [ ] **Step 5: Controller** — register `aether-featured-products`: delegates to card click handler + motion hooks already handled by aether-motion auto-assign (cards get reveal stagger).
- [ ] **Step 6: Gate + commit** — theme-check 0 offenses; REGISTRY: PASS (inventory check now green for featured-products only if all others exist — expected FAIL acceptable mid-wave, note in commit).

---

## Task 6: Hero slider

**Files:**
- Create: `sections/aether-hero.liquid`
- Modify: `assets/aether.css.liquid` (hero styles)
- Modify: `assets/aether.js.liquid` (controller `aether-hero`)

**Interfaces:**
- Consumes: Swiper (loaded via runtime `_loadVendors` when `.aether-hero` present), blocks `slide` (image, `image_overlay` opacity, headline, accent_text, subline, cta_text, cta_link, cta2_text, cta2_link, alt_text), settings `height` (range 500-100vh? frozen 100vh/min-700 — settings `section_height` select 100vh/700/600/500), `autoplay` (bool), `autoplay_speed` (range 3-10 s, default 6), `show_nav` (arrows/counter/progress), `show_scroll_indicator`, `enable_fog`, `parallax_speed`
- Produces: `.aether-hero` with `.aether-hero-swiper` (Swiper 11: loop, fade crossFade, speed 1200, autoplay 6000, parallax via `data-swiper-parallax` on text elements), fog layers, `.aether-hero-nav` (prev/next, counter `01/03`, progress bar via `--progress`), `.aether-hero-scroll-indicator`

- [ ] **Step 1: Create section** — port `index.html:234-323`; slides = blocks (default preset 3 slides matching frozen: Void Runner / Cloud Stride / Midnight Edition headlines, `$449`/`$99`/`$479`, CTAs to `/collections/all`); hero-fog uses `fog1.png`/`fog2.png` via `asset_url`; overlay gradient per frozen (135deg rgba(9,9,11,.85)/.5/.3); counter/progress markup per frozen.
- [ ] **Step 2: Styles** — port `style.css:683-842` (100vh/min-700, gradient overlay, headline clamp(3rem,7vw,6rem), subline, ctas, nav buttons, counter, progress, scroll indicator) + responsive headline sizes per breakpoint table (1920 7rem / 1440 5.5 / 1200 4.5 via clamp adjustments, 576 2.8, 480 2.4).
- [ ] **Step 3: Controller** — register `aether-hero`:

```js
controllers['aether-hero'] = {
  init(el) {
    const swiperEl = el.querySelector('.aether-hero-swiper');
    if (!swiperEl || !window.Swiper) return;
    this._swiper = new Swiper(swiperEl, {
      loop: true, speed: 1200, parallax: true, effect: 'fade',
      fadeEffect: { crossFade: true },
      autoplay: { delay: 6000, disableOnInteraction: false },
      on: { slideChange: (s) => { el.querySelector('.aether-current-slide').textContent = String(s.realIndex + 1).padStart(2, '0'); } }
    });
    // progress bar: autoplayTimeLeft -> el.style.setProperty('--progress', ...)
    // prev/next buttons; scroll-indicator + content fade-out on scroll (GSAP, animations.js:446-465,656-708)
    // hero bg parallax: gsap.to(img, { y: 80, scrollTrigger: { scrub: 1.5 } })
  },
  destroy() { this._swiper && this._swiper.destroy(true, true); this._swiper = null; },
  refresh() { this.destroy(); this.init(el); },
};
```

- [ ] **Step 4: Gate + commit** — theme-check 0 offenses; commit.

---

## Task 7: Collection grid (shop)

**Files:**
- Create: `sections/aether-collection-grid.liquid`
- Create: `snippets/aether-pagination.liquid`
- Modify: `templates/collection.aether.json` (rebuild)
- Modify: `assets/aether.css.liquid` (page hero, filter bar, grid, pagination)
- Modify: `assets/aether.js.liquid` (controller `aether-collection-grid`)

**Interfaces:**
- Consumes: global `collection` object, `paginate` (12 per page per frozen 6-per-page? frozen shows 6; Shopify `paginate by 12` with `per_page` setting range 6-24 default 12), `sort_by` via `collection.sort_by` + `?sort_by=` links (frozen has no sort — D4), settings `show_page_hero` (title/subtitle from collection), `filter_menu` (link_list — D4 pills), `per_row` (range 2-4, default 3), `show_view_all` n/a, `pagination_style` (frozen pagination)
- Produces: `.aether-page-hero` (label "Collection", title, subtitle), `.aether-filter-bar` (pills from link_list — active = current collection), `.aether-shop-grid` (3-col gap 30), `aether-product-card` simple variant, `.aether-shop-pagination` (prev/pages/next per frozen markup), empty state (frozen none — add `.aether-shop-empty` styled to design language, D-doc)

- [ ] **Step 1: Create section** — port `shop.html:207-329`; `paginate`:

```liquid
{% paginate collection.products by section.settings.per_page %}
  {% for product in collection.products %}
    {% render 'aether-product-card', product: product, variant: 'simple', per_row: section.settings.per_row %}
  {% else %}
    <div class="aether-shop-empty">…muted empty state…</div>
  {% endfor %}
{% endpaginate %}
```

sort: `{% if section.settings.enable_sort %}{% render 'aether-sort' %}{% endif %}` (frozen has none — add minimal select with `collection.sort_by` + `collection.sort_options`, styled as `.aether-sort` pill; document D4).
- [ ] **Step 2: Create `aether-pagination.liquid`** — frozen `shop.html:315-329` markup; links `{{ paginate.next.url }}` etc.; prev/next chevron icons; `.active` on current; disabled on boundaries.
- [ ] **Step 3: Rebuild `templates/collection.aether.json`** — single section `aether-collection-grid` with default settings (replaces PHANTOM collection-header + main-collection; document swap in Task 12 deviations log; keep `promo-grid` PHANTOM block? NO — frozen shop has no promo; composition = aether-collection-grid only).
- [ ] **Step 4: Styles** — port `style.css:2077-2099` (grid, sale badge #C44, price-old), `3948-4011` (pagination), page-hero (frozen shop page-hero: padding 200/100, gradient, title clamp(2.5rem,6vw,4rem)), filter pills.
- [ ] **Step 5: Controller** — register `aether-collection-grid` (no-op beyond motion hooks; sort select submits `?sort_by=` — server-rendered links per PHANTOM convention `collection-grid-filters-form` precedent or native `<select onchange>`; verify PHANTOM sort pattern at implementation).
- [ ] **Step 6: Gate + commit** — theme-check 0 offenses; commit.

---

## Task 8: Product section (largest)

**Files:**
- Create: `sections/aether-product.liquid`
- Create: `assets/aether-product.js` (section-local module script, PHANTOM quiz.js pattern: `<script src="{{ 'aether-product.js' | asset_url }}" type="module" defer>` at end of section)
- Modify: `templates/product.aether.json` (rebuild)
- Modify: `assets/aether.css.liquid` (pd-* styles)
- Modify: `assets/aether.js.liquid` (cart count refresh on `product-form:*` handled by runtime; no direct controller needed — aether-product.js self-initializes on its own section scope; register a no-op passthrough controller that bootstraps `AetherProduct` module instead)

**Interfaces:**
- Consumes: `product` object, `product.selected_or_first_available_variant`, `product.options_with_values`, `product.variants | json` (hidden textareas `data-aether-variant-json` + `data-aether-current-variant-json`), `form.product` snippet (product-form custom element for `/cart/add`), `routes.cart_url`, `settings` (blocks: `price`, `variant_picker`, `buy_buttons`, `description`, `inventory_status`, `sales_point`, `size_chart`, `tab`, `share`, `trust_row`, `specs_accordion`, `reviews` (@app), `related_products`; settings: `gallery_layout` (thumbs), `gallery_zoom`, `enable_sticky_bar`, `related_count`, `show_reviews_summary`)
- Produces: frozen pd-* markup 1:1 (breadcrumb, pd-grid 1.1fr/1fr gap 60, gallery main+thumbs swipers + zoom lens, pd-info sticky top 100, badge/title/price/rating/description/color swatches (options bound to `option1`), size grid (options), qty 1-10 stepper, ATC via `form.product` slot `.aether-pd-add-to-cart`, wishlist button, trust row, sticky bar bottom (image/name/price/size select/ATC), specs accordion (4 items via blocks with icon+title+content), reviews summary bars + `@app` review slot, related swiper (4 cards), size guide modal (static table from frozen + setting toggle); `data-section-type="aether-product"`; `disabled_on: {groups:["header","footer"]}`

Implementation sub-stages 8A–8I (amendment 4). Same files throughout (`sections/aether-product.liquid`, `assets/aether-product.js`, `assets/aether.css.liquid`, `templates/product.aether.json`); sub-stages are implementation boundaries that isolate failure modes (Liquid vs markup vs variant engine vs gallery vs cart), NOT necessarily separate commits — one commit at 8I unless a sub-stage forces an early one.

- [ ] **8A — Section shell + schema/data:** `sections/aether-product.liquid` shell + full block schema (price, variant_picker, buy_buttons, description, inventory_status, sales_point, size_chart, tab, share + AETHER-only: `trust_row` (limit 1, icon/title pairs — frozen truck/undo/shield), `specs_accordion` (specs_heading; block `spec_item` icon+title+text, max 4), `reviews` (type `@app`, limit 1) + optional `reviews_summary` static fallback, `related_products` (limit 1, heading + count)); Liquid data bindings: product object, `product.selected_or_first_available_variant`, price/compare_at_price, hidden textareas `data-aether-variant-json` (`product.variants | json`) + `data-aether-current-variant-json`, `render 'form.product'` (`product: product, id: 'AetherProductForm'`, slot = aether ATC button). No interactive JS yet. Presets with a sensible default block order.
- [ ] **8B — Gallery:** markup port `product-detail.html:208-370` (breadcrumb, pd-grid, main+thumbs swipers, zoom button) + `aether-product.js` gallery init (main fade + thumbs `slidesPerView:4`, magnify lens 2.5× disabled ≤767.98) + gallery styles. Sticky-bar markup (`373-405`) belongs to 8E.
- [ ] **8C — Variant engine (GENERIC — amendment 5):** render ALL option groups dynamically: `{% for option in product.options_with_values %}` → `.aether-pd-option-group` with `data-aether-option-index="{{ forloop.index0 }}"`, per-value buttons `data-aether-value` from `option.values`. Engine matches variants by option POSITION (`variant.options[i]` vs selected `i`) — never hard-coded option1=color/option2=size; works for any Shopify option set. Frozen presentation (circle swatches vs size tiles) is a display heuristic on option NAME only (`Color` → swatches, else tiles; fallback tiles). JS: click → generic match in `data-aether-variant-json` → update current-variant textarea, price (with sale), main image swap + thumbs active, qty reset, local `variant:change` event. Own selector logic — `theme.Variants` doesn't attach to unregistered sections.
- [ ] **8D — Quantity/cart:** qty stepper (1-10, `data-aether-qty-btn`/`data-aether-qty-value`) + ATC through the `form.product` slot + sticky-bar buy-button sync + react to `cart:updated` (runtime count refresh already covers `.aether-cart-count`).
- [ ] **8E — Sticky bar:** markup (`product-detail.html:373-405`) + IntersectionObserver visibility on main ATC + size select synced with the 8C engine.
- [ ] **8F — Accordion/modal:** specs accordion (max-height animation, `product-detail.html:408-451`) + size guide modal (open/close, overlay click, Esc, `714-750`) + styles.
- [ ] **8G — Reviews:** `@app` block slot + optional static `reviews_summary` fallback (rating bars per frozen widths as block text fields) (`454-551`).
- [ ] **8H — Related:** related swiper (4 cards, breakpoints 1.2/2/3.2) + heading (`554-611`).
- [ ] **8I — Integration QA + template:** full cross-stage QA (variant → qty → sticky → cart → gallery interplay, editor lifecycle, reduced-motion guards, `if (root.dataset.aetherProductInit) return; root.dataset.aetherProductInit = '1'` idempotency); rebuild `templates/product.aether.json` — `aether-product` (blocks per default order incl. reviews @app slot if app block allowed in preset — verify @app in presets is legal; if not, presets omit @app and editor adds it) + PHANTOM `recently-viewed` ({}); document swap of main-product/product-recommendations → aether-product in deviations log; theme-check 0 offenses (watch `form.product` render — slot = aether ATC button); commit.

---

## Task 9: Cart section

**Files:**
- Create: `sections/aether-cart-items.liquid`
- Create: `templates/cart.aether.json`
- Modify: `assets/aether.css.liquid` (cart styles)
- Modify: `assets/aether.js.liquid` (controller `aether-cart-items`)

**Interfaces:**
- Consumes: `cart` object (`cart.items` each: `image`, `product.title`, `variant.title`, `final_line_price`, `quantity`, `key`, `url`, `line_level_discount_allocations`), `/cart/change.js` via `cart:quantity` bus, `/cart.js` for count refresh, `routes.checkout_url`, `routes.all_products_collection_url`
- Produces: `.aether-cart-section` with `.aether-cart-items` (frozen cart-item markup: img 100×100, name/variant, price, qty stepper `.aether-qty-btn`/`.aether-qty-value`, line total gold, remove `.aether-cart-item-remove`), `.aether-cart-table-header` (≤768 hidden), `.aether-cart-summary` (Order Summary: subtotal, shipping "Free", total, checkout button full-width gold, continue shopping), `.aether-cart-empty` (icon + heading + copy + CTA), `data-section-type="aether-cart-items"`

- [ ] **Step 0: Inspect PHANTOM cart architecture first (amendment 6 — pre-code)** — find how the existing PHANTOM cart does quantity updates + refresh: who emits `cart:quantity` / `cart:updated` (producers in theme.js), any existing `/cart/change.js` helper/fetch wrapper, PHANTOM cart section behavior, and the cart-count update path. AETHER reuses the canonical events/helpers/refresh wherever compatible; AETHER implements ONLY the presentation layer plus any documented minimal gap (e.g., a small POST wrapper only if PHANTOM has none — record as an integration note in the deviations log, NOT a new cart framework). Do not create a second competing cart system.

- [ ] **Step 1: Create section** — port `cart.html:476-546` (row grid `2fr 1fr 1fr 1fr 50px`, borders #1A1A1A, padding 30/0) + page hero (frozen cart page hero: padding 160/60, h1 2.5rem Cabinet 700, breadcrumb) + empty state (frozen CSS exists inline `cart.html:273-290` — implement markup). Line items rendered in a `<form action="{{ routes.cart_url }}" method="post">` (quantity updates via `name="updates[]"` fallback + AJAX via controller).
- [ ] **Step 2: Styles** — port frozen cart CSS + inline page CSS + responsive (≤768 header row hidden/1-col/80px img, ≤576 60px, ≤480 1-col centered); summary sticky `top:140px`, bg `--aether-surface`, padding 40.
- [ ] **Step 3: Controller** — register `aether-cart-items`:

```js
controllers['aether-cart-items'] = {
  init(el) {
    this._el = el;
    this._onChange = (e) => { /* cart:quantity detail [key, qty] -> POST via the canonical PHANTOM helper found in Step 0 (fallback /cart/change.js { id: key, quantity: qty }) -> cart:updated auto-fires; re-render line total via response data; disable buttons while pending */ };
    document.addEventListener('cart:quantity', this._onChange, { signal: this._signal });
    document.addEventListener('cart:updated', this._onUpdated, { signal: this._signal });
    // remove button: confirm-free POST /cart/change.js quantity 0
  },
  destroy() { this._signal.abort(); },
  refresh(el) { this.destroy(); this.init(el); },
};
```

(controller lifecycle via runtime; `_signal = new AbortController()` per controller instance.)
- [ ] **Step 4: Gate + commit** — theme-check 0 offenses; commit.

---

## Task 10: Home composition (coexistence) — rebuild `templates/index.aether.json`

**Files:**
- Modify: `templates/index.aether.json`

**Interfaces:**
- Consumes: `aether-hero`, PHANTOM `promo-grid`, `aether-featured-products`, PHANTOM `background-image-text`, `aether-collection-grid` (fixed collection setting), PHANTOM `blog-posts` — the user-mandated coexistence test (AETHER → PHANTOM → AETHER → PHANTOM → AETHER)

- [x] **Step 1: Rebuild the template** — order + settings:

```json
{
  "sections": {
    "hero":       { "type": "aether-hero" },
    "promo":      { "type": "promo-grid", "settings": { "full_width": true, "gutter_size": 20 } },
    "bestsellers":{ "type": "aether-featured-products", "settings": { "per_row": 4, "rows": 1, "view_all": true } },
    "image-text": { "type": "background-image-text", "settings": { "layout": "left", "height": 750, "parallax": true } },
    "shop-grid":  { "type": "aether-collection-grid", "settings": { "per_row": 3, "per_page": 6 } },
    "journal":    { "type": "blog-posts", "settings": { "blog": "news", "post_limit": 3 } }
  },
  "order": ["hero","promo","bestsellers","image-text","shop-grid","journal"]
}
```

(promo-grid/image-text/blog-posts need their blocks — executor copies block JSON from the existing Wave 0 T3 file; document that replacing the T3 verbatim-mirror is the intentional Wave 1 step; `aether-collection-grid` on home uses `collection` setting default = main collection — implemented in Task 10: the section gained the `collection` setting with `grid_collection = collection | default: collections[section.settings.collection]` fallback.)
- [x] **Step 2: Gate + commit** — theme-check 0 offenses (validate both `index.aether.json` parses; template references exist); commit. (theme-check 296 files 0 offenses; registry PASS; commit eead352.)

---

## Task 11: Locales — all 7 schema + 7 runtime files

**Files:**
- Modify: `locales/en.default.schema.json`, `de.schema.json`, `es.schema.json`, `fr.schema.json`, `it.schema.json`, `pt-BR.schema.json`, `pt-PT.schema.json` (extend `_scripts/add-locale-keys.ps1` — gitignored local tooling per repo policy (theme-local `_scripts/` is not tracked); rerun it)
- Modify: `locales/en.default.json`, `de.json`, `es.json`, `fr.json`, `it.json`, `pt-BR.json`, `pt-PT.json` (add `t:aether.*` runtime strings)

**Interfaces:**
- Produces: complete `t:sections.aether-hero|aether-featured-products|aether-collection-grid|aether-product|aether-cart-items.*` (name/settings/blocks/presets + options), extended `aether-announcement-bar` (blocks.message.*, settings.show_mobile_rotation), `aether-header` (logo_image, show_wishlist, show_account), `aether-footer` (blocks brand/menu/newsletter, tagline) in all 7 schema files; `t:aether.*` runtime strings (announcement defaults, cart labels — "Order Summary", "Subtotal", "Shipping", "Total", "Free", "Continue shopping", "Your cart is empty", size guide table headers, specs accordion titles, related heading, reviews summary strings, empty states, "Add to Cart", "Sold out", "View all", sticky bar strings) in all 7 runtime files, with translations (de/es/fr/it/pt-BR/pt-PT) following the existing PHANTOM translation style.

- [x] **Step 1: Extend `_scripts/add-locale-keys.ps1`** — generalize the anchor to insert aether Wave 1 key families (same 7-file loop, same regex-anchor-before-`"header-group"` approach, JSON-validate each file after write). (Shipped during Tasks 8-9: featured/hero/collection-grid/cart-items families, `categories.cart`, runtime block builder; Task 10 added the collection-grid `collection` key to table+expansion.)
- [x] **Step 2: Run it** — verify all 7 schema files parse (`Get-Content | ConvertFrom-Json`), no duplicates. (Verified 2026-08-18: 9 families, 331 key paths per file, IDENTICAL sets across all 7 files.)
- [x] **Step 3: Runtime strings** — hand-add `"aether": { ... }` block to all 7 `*.json` files with translations; verify parse + `MatchingTranslations` (compare key sets across files — en is source of truth). (Verified: 52 aether.* runtime keys per file, identical across 7; 170 `t:sections.aether-*` refs + 44 `aether.* | t` refs all resolve.)
- [x] **Step 4: Gate + commit** — theme-check 0 offenses (locale checks included); commit. (theme-check 296 files 0 offenses — locale checks included; no new changes required, all locales shipped in Tasks 3-10 commits.)

---

## Task 12: Documentation — scope boundaries + deviations log + registry/manifest sync

**Files:**
- Create: `docs/design-packs/liquid-scope-boundaries.md`
- Modify: `docs/design-packs/registry.md` (Wave 1 status), `docs/aether/manifest.md` (component registry: 8 components shipped production; budgets updated with measured sizes)

**Interfaces:**
- Produces: the user-required `{% render %}` vs `{% include %}` boundary document

- [x] **Step 1: Write `docs/design-packs/liquid-scope-boundaries.md`** — content contract:
  1. **The discovery (Wave 0 T1):** `{% render %}` creates an isolated scope — variables assigned inside the snippet are invisible to the caller. The resolver/loader path REQUIRES shared scope, so `snippets/design-pack-resolver.liquid` is invoked with `{% include %}` from `layout/theme.liquid:38` (and its assigns `dp_active/dp_asset/dp_enabled/dp_header_group/dp_footer_group/dp_popup_group` are consumed at `theme.liquid:42-44,377-379,404-413`).
  2. **The boundary (binding):** `design-pack-resolver.liquid` MUST be included (never rendered) and its `dp_*` assigns MUST NOT be re-created in a render scope. Anything else in the theme may use `render`. Documented via `theme-check-disable DeprecatedTag` comments (`theme.liquid:37-38`) — never remove those guards.
  3. **Why not "fix" it:** converting to `render` + re-assign is the trap — it forks the registry (7 positional lists) into multiple copies; the integrity gate (`check-registry.mjs`) parses the resolver file for the single source of truth; a render-side copy would silently desync (failure-register row 19).
  4. **Where render IS fine:** section-internal snippets (cards, headers, buttons) don't share state with the layout; `aether-product-card` etc. use `render` normally.
     5. Reference: `docs/superpowers/specs/2026-08-16-phantom-design-pack-architecture.md` §4, failure-register rows 1/19.

- [x] **Step 1b: Font strategy + terminology (amendments 7 + 9)** — update `docs/design-packs/design-pack-contract.md` with: (a) generic Design Pack font strategy — theme font picker OR theme-hosted font OR approved external font, with AETHER's Fontshare (Cabinet Grotesk + Satoshi) recorded as an AETHER implementation choice, not a pack requirement; (b) terminology per the Master Operating Model — "AETHER is the first complete/reference implementation of the Design Pack API and the reusable AETHER Master starter, NOT the Design Pack runtime; no permanent multi-pack ecosystem is built — clients receive independent copies of the Master whose AETHER layer is transformed per client design; if a new pack is ever justified it implements the same generic contract without inheriting AETHER's settings, tokens, or visual assumptions." (Shipped as contract §7.)

- [x] **Step 2: Deviations log** — materialize the pre-declared deviations table (D1-D11 above) into `docs/aether/manifest.md` (new "Wave 1 deviations" section); add any deviations discovered during implementation with the required 5-field format; any deviation NOT in the list requires the implementing reviewer to stop and flag it. (Shipped D1-D16 — D12 view_all schema mismatch, D13 collection setting, D14 minified CSS, D15 gitignored script policy, D16 `{% raw %}` money format.)
- [x] **Step 3: Update registry.md + manifest.md** — Wave 1 status table, component registry (8 shipped), measured budget sizes (from Task 13 QA). (Registry §6 added; manifest budgets measured.)
- [x] **Step 4: Commit.**

---

## Task 13: Final QA + parity evidence + close-out

**Files:**
- Create: `designs/aether/source/index.html`, `shop.html`, `product-detail.html`, `cart.html` (static proof pages)
- Modify: `designs/build/check-registry.mjs` if budget check needs calibration
- (no theme code changes unless QA fails)

**Interfaces:**
- Consumes: all Wave 1 sections; Playwright (playwright-mcp) + live-server; frozen reference pages
- Produces: final report (user's required field list)

- [x] **Step 1: Frozen reference captures** — serve `frontend/frontend/` via `live-server` (or `python -m http.server`), screenshot `index.html`, `shop.html`, `product-detail.html`, `cart.html` at 1440/768/390 (playwright-mcp resize + fullPage), save under `docs/integration/aether/references/{page}-{width}.png`. (Done: 12 PNGs.)
- [x] **Step 2: Proof pages** — build `designs/aether/source/*.html` by taking each section's rendered markup (Liquid tags replaced with sample data: e.g. `{{ product.title }}` → "Void Runner — Obsidian", prices → $449, images → frontend asset paths) — a faithful static render of what the sections emit; link the section CSS (unrendered `aether.css.liquid` + section stylesheet blocks inlined) so the proof matches production styling. This is the parity harness (blueprint §9 pattern: `designs/demo/source` precedent). (Done: 4 pages + rendered `aether-proof.css` + 3 images; product page rebuilt verbatim from `aether-product.liquid` pd-* markup after first pass used invented classes.)
- [x] **Step 3: Parity capture + diff** — screenshot proofs at same 3 widths; eyeball-diff (and optional pixel-diff via Playwright screenshot comparison) frozen vs proof per page/breakpoint; record PASS/FAIL per cell in `docs/aether/fidelity-report.md` (new file; manifest references it); FAIL → fix CSS/markup, re-capture, re-diff. Functional parity (add-to-cart, qty, variant switch) is verified statically in code review + documented manual checklist for live store (no Shopify auth here — noted in report). (Done: 12 proof PNGs + structural mapping + numeric pixel table; FOUND + FIXED D17 responsive grid bug; eyeball sign-off = human step recorded in report §9.)
- [x] **Step 3b: Functional parity matrix (amendment 8)** — for every component record PASS / PASS / NA per column; a component is complete only when all its applicable gates pass. Template (lives in `docs/aether/fidelity-report.md`): (Done — 8×7 matrix, all PASS, editor = manual checklist.)

| Component | Visual | Desktop | Tablet | Mobile | Editor | Liquid/data | Interaction |
|---|---|---|---|---|---|---|---|
| Announcement | PASS | PASS | PASS | PASS | manual | PASS | PASS |
| Header | PASS | PASS | PASS | PASS | manual | PASS | PASS |
| Footer | PASS | PASS | PASS | PASS | manual | PASS | PASS |
| Hero | PASS | PASS | PASS | PASS | manual | PASS | PASS |
| Featured products / card | PASS | PASS | PASS | PASS | manual | PASS | PASS |
| Collection grid | PASS | PASS | PASS | PASS | manual | PASS | PASS |
| Product | PASS | PASS | PASS | PASS | manual | PASS | PASS |
| Cart | PASS | PASS | PASS | PASS | manual | PASS | PASS |

(Visual/Desktop/Tablet/Mobile = parity harness captures; Liquid/data + Interaction = code review + static verification; Editor = documented manual store checklist until live-store access exists.)
- [x] **Step 4: Editor lifecycle checklist** — document in fidelity-report the manual store test (ADD/REMOVE/RE-ADD/MOVE/DUPLICATE/EDIT/SAVE/RELOAD per section + coexistence A-E tests from the user brief: A aether-only, B mixed, C remove aether, D remove phantom, E pack switch via `active_design_pack` setting — E is also covered by resolver unit tests in check-registry). (Done — fidelity-report §6.)
- [x] **Step 5: Full gates** — `shopify theme check` (0 offenses, ~300 files); `node designs/build/check-registry.mjs` (PASS incl. inventory + budget); untouched-file audit (`git diff --name-status` vs pre-Wave-1 commit: ONLY the files in the Modify/Create tables above, plus `docs/` additions); verify `theme.js/phantom-vendor.js/theme.css.liquid/css-variables.liquid/ph-design-tokens.css.liquid/theme.liquid/settings_*.json` UNTOUCHED; budget measurement recorded (aether.css.liquid + ALL section blocks ≤ 60 KB hard ceiling; ACTUAL per-page payloads Home/Collection/Product/Cart from the informational gate measurement; aether.js ≤ 40 KB; aether-product.js ≤ 20 KB; vendor sizes). (Done: theme-check 296 files 0 offenses; REGISTRY PASS, page budgets 58,418 B; audit clean — core files untouched; aether.js 29,956 B; aether-product.js 15,815 B; vendors on demand.)
- [x] **Step 6: Commit** — plan doc (`docs/superpowers/plans/2026-08-17-phantom-design-pack-wave1.md`), fidelity report, memory update (Serena project-state: Wave 1 complete; update + commit `.serena/memories/phantom-theme/project-state.md`).
- [ ] **Step 7: Final report** — deliver the user-required fields: WAVE 1 STATUS / FILES CREATED / FILES MODIFIED / FILES UNTOUCHED / SECTIONS COMPLETED / LIQUID DATA MAPPINGS / CSS ISOLATION / JS LIFECYCLE / THEME EDITOR QA / VISUAL PARITY / MOBILE QA / PHANTOM REGRESSION / THEME CHECK / REGISTRY CHECK / PERFORMANCE / ACCESSIBILITY / GIT COMMITS / UNEXPECTED CHANGES / KNOWN RISKS / NEXT TASK (= wait for Wave 2 authorization per the Master roadmap; DO NOT push).

---

## Wave 1 component → template/group wiring (reference)

| Component | Section | Placement |
|---|---|---|
| Announcement bar | `sections/aether-announcement-bar.liquid` | `sections/header-group.aether.json` (already wired, T5) |
| Header | `sections/aether-header.liquid` | `sections/header-group.aether.json` (already wired) |
| Footer | `sections/aether-footer.liquid` | `sections/footer-group.aether.json` (already wired) |
| Hero | `sections/aether-hero.liquid` | `templates/index.aether.json` (Task 10) |
| Featured products | `sections/aether-featured-products.liquid` | `templates/index.aether.json` (Task 10) |
| Collection grid | `sections/aether-collection-grid.liquid` | `templates/collection.aether.json` + index (Task 7/10) |
| Product | `sections/aether-product.liquid` | `templates/product.aether.json` (Task 8) |
| Cart items | `sections/aether-cart-items.liquid` | `templates/cart.aether.json` (Task 9) |
