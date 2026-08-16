# PHANTOM — Task 01: External Frontend Integration Architecture Audit & Blueprint

- **Date:** 2026-08-16
- **Scope:** PHANTOM Shopify theme — forensic architecture audit + production-grade integration blueprint for the "external frontend as design source" model.
- **Constraint honored:** AUDIT ONLY. No production code was modified. All claims verified against the actual repository on disk (`phantom-theme-v2.2.0/`).

---

## 1. Executive Verdict

**PHANTOM is a strong integration base, but not yet a safe one.** The theme already contains the infrastructure this workflow needs: 61 sections (33 with `@app` support), 138+ snippets, 24 templates, OS 2.0 JSON templates, a `--ph-color*` design-token system, an ES-module import map, an is-land lazy-loading pipeline, and a `phantom:ready` boot event. However, it has **five structural risks** that must be resolved before any client design lands: (1) a global CSS layer with 403 `.btn`, 63 `.modal`, 34 `.hero` selectors that will collide with Bootstrap's identical class names; (2) a fragmented breakpoint scale; (3) a scattered z-index range ending in `10001 !important`; (4) no `shopify:section:unload` handling anywhere (leak risk on re-render); (5) a set of un-fixed baseline defects (version drift, dead `phMotion.animate` reference, 18 theme-check translation errors).

**Verdict: READY FOR TASK 02: YES** — provided Task 02 executes the prerequisite hardening (Phase 0.5) before any client-specific work begins.

---

## 2. Current Architecture (Verified)

### 2.1 Verified repository facts

| Area | Verified state |
|---|---|
| Version | Drift: `config/settings_schema.json` theme_info → 2.3.0; `layout/theme.liquid` header comment → 2.2.0 |
| Sections | 61 total; **33 declare `@app` block support** |
| Snippets | 138+ (UI, layout, PDP, variant, motion, theme plumbing, token/style, commerce, legacy) |
| Blocks | 14 |
| Templates | 24 (JSON templates + customer/account) |
| Locales | `en.default` + de, es, fr, it, pt-BR, pt-PT (+ `.schema` variants); 18 MatchingTranslations errors pending |
| Theme settings | 13 groups: colors (34), typography (26), products (3), product_tiles (9), collection_tiles (7), cart (6), customer_accounts (2), search (5), social_media (15), favicon (1), extras (4), ph_motion (24, enabled by default), ph_presets (2) |
| Design tokens | `ph-design-tokens.css.liquid` — `--ph-color*` family (Body, TextBody, BtnPrimary, Nav, Drawer, Modal, HeroText, Price, SaleTag, Footer, Link, Border, CartDot, GridOverlay, ImageOverlay, etc.) |
| Global CSS | Single preloaded `theme.css.liquid` + `ph-motion/ph-skeleton/ph-loader/ph-transitions/ph-design-tokens` `.liquid` stylesheets |
| Global JS | `theme.js` (262 KB), `phantom-vendor.js` (126 KB: AOS, Flickity, PhotoSwipe), `ph-*.js` modules, `ui-*.js` ES modules via import map |
| Vendor libraries present | AOS, Flickity, PhotoSwipe, is-land lazy-load. **Not present:** GSAP, ScrollTrigger, Swiper, Lenis, Three.js → safe for per-client bundling |
| Script loading | All `defer`, is-land web component for section lazy-loading, import map for `ui-*` modules |
| Boot/lifecycle events | `phantom:ready` (theme.js boots on it); `shopify:section:load` handled by ph-loader/ph-skeleton; `cart:updated` handled by free-shipping-bar; **no `shopify:section:unload/select/deselect` handlers anywhere** |

### 2.2 Current runtime chain

```text
Shopify → layout/theme.liquid
  → theme-scripts (is-land lazy-load) + theme-import-map (ES modules)
  → theme.css.liquid (preload) + ph-*.css.liquid
  → theme.js (defer, boots on phantom:ready) + phantom-vendor.js (defer) + ph-*.js (defer)
  → sections (is-land lazy) → blocks → snippets → assets
  → PH MOTION (24 settings, enabled by default)
```

### 2.3 Component classification (verified)

| Class | Files |
|---|---|
| Global | `layout/theme.liquid`, `theme.js`, `phantom-vendor.js`, `theme.css.liquid`, `ph-design-tokens.css.liquid`, `ph-motion.*`, `ph-loader.*`, `ph-skeleton.*`, `ph-transitions.*`, `theme-scripts.liquid`, `theme-import-map.liquid` |
| Page-specific | `templates/*.json`, section groups in `sections/` |
| Reusable commerce | product-form, variant systems, cart system, predictive search, collection grid, price, badge, quick-add snippets |
| Presentation-only | hero, image-with-text, testimonials, slideshow, etc. (most sections) |
| Legacy (don't leak) | Impulse-era visual patterns: `--color-body` residual references, fragmented breakpoints, `.btn/.modal/.hero` global classes, ES5 vendor bundle |

---

## 3. Problems / Risk Areas (Verified, Ranked)

| # | Risk | Evidence | Severity |
|---|---|---|---|
| P1 | CSS class collision: PHANTOM `.btn` (403), `.modal` (63), `.hero` (34) vs Bootstrap's identical names | grep on `theme.css.liquid` | **Critical** |
| P2 | No `shopify:section:unload` handling → JS/observer leaks on Theme Editor re-render | assets audit: only `load` handlers exist | **Critical** |
| P3 | z-index fragmentation (1 → 10001 `!important`) with no layer budget | `theme.css.liquid` z-index audit | High |
| P4 | Breakpoint fragmentation (769/768, 959, 1050, 1140, 400, 700/550) vs Bootstrap (576/768/992/1200/1400) | media-query audit | High |
| P5 | Baseline defects: version drift, dead `window.phMotion.animate` in `ph-skeleton.js`, 18 MatchingTranslations, deprecated filters, orphaned assets | engineering report + spot checks | High (prerequisite) |
| P6 | `phantom-vendor.js` (126 KB) is ES5 global bundle; AOS/Flickity globals could clash with client GSAP-era design patterns | asset inventory | Medium |
| P7 | `theme.js` 262 KB monolithic global; client code must not hook into it casually | asset inventory | Medium |
| P8 | `:root` in `theme.css` exposes only 2 vars (`--drawer-gutter`, `--grid-gutter`) but legacy `--color-body*` residual references remain | CSS var audit | Low |

---

## 4. Recommended Architecture

### 4.1 Ownership contract (fixed)

```text
CLIENT DESIGN  →  VISUAL PRESENTATION  →  DESIGN ADAPTER  →  LIQUID  →  SHOPIFY DATA/APIS  →  PHANTOM ENGINE
```

- **External frontend owns:** visual structure, hierarchy, typography, spacing, layout, component appearance, CSS, Bootstrap (as design-time tool), GSAP, Three.js, Lenis, Swiper, transitions, responsive presentation, art direction.
- **Shopify/PHANTOM owns:** products, collections, variants, cart, search, customers, theme settings, sections/blocks/app blocks, JSON templates, localization, routes, commerce behavior, platform-required infrastructure.
- **Liquid owns:** data binding, object access, schema, template composition, URLs, images, conditional rendering, adapter logic.
- **Rule:** Liquid replaces data, never design.

### 4.2 Target integration model

```text
designs/
├── {client-slug}/
│   ├── source/            # frozen external design (HTML, full Bootstrap, dev assets)
│   ├── manifest.md        # component manifest (static/dynamic/JS-enhanced/app/editable)
│   ├── mapping.md         # design → Shopify implementation map
│   └── production/        # build output: client-{slug}.css / client-{slug}.js / vendor-{slug}.js
```

In the Shopify theme itself, per active client:

```text
assets/client-{slug}.css.liquid
assets/client-{slug}.js          (ES module, import-map friendly)
assets/vendor-{slug}.js          (GSAP/Swiper/Lenis/Three — only those used)
sections/client-{slug}-*.liquid  (client-specific sections, ph- prefixed conventions)
snippets/client-{slug}-*.liquid  (client-specific snippets)
templates/*.json                 (per client: index/product/collection/page/cart/search/404)
```

### 4.3 Multi-design model (decisive)

**Chosen: PHANTOM core + per-client Shopify theme instances, driven by a shared core, with `designs/` as the single source of truth.**

| Option | Verdict |
|---|---|
| Separate branches | **Rejected** — merge pain, no runtime coexistence |
| Separate directories only | **Rejected** — one live design per storefront anyway |
| Config-driven single theme | **Chosen for development** — settings toggle activates one design; cheap iteration |
| Separate Shopify theme instances | **Chosen for production** — one theme per client (Shopify supports multiple themes per store); core synced from the shared repo |

Rule: `designs/{slug}/` is the design source of truth; the theme holds exactly one active client build (config-driven) during dev, and each production client gets its own theme instance.

---

## 5. Folder Structure (Final)

```text
phantom-theme-v2.2.0/
├── assets/
│   ├── client-{slug}.css.liquid     # scoped, pruned, namespaced client CSS
│   ├── client-{slug}.js             # ClientDesign module (init/destroy/refresh)
│   ├── vendor-{slug}.js             # GSAP/Swiper/Lenis/Three (only used ones, per design)
│   └── ... (existing PHANTOM assets untouched)
├── sections/client-{slug}-*.liquid
├── snippets/client-{slug}-*.liquid
├── templates/*.json                 # active client composition
├── designs/                         # NEW — multi-client design source repo
│   └── {client-slug}/
│       ├── source/                  # frozen design (HTML/CSS/JS/dev assets)
│       ├── manifest.md
│       ├── mapping.md
│       └── production/              # build artifacts consumed by assets/
└── docs/integration/                # per-client integration records + screenshots
```

---

## 6. CSS Strategy (Decisive)

### 6.1 Bootstrap strategy — Chosen: Option D (design-time tool, stripped for production)

| Option | Verdict |
|---|---|
| A. Global Bootstrap | **Rejected** — guaranteed collision with `.btn/.modal` and global element rules |
| B. Bundle only required modules | Rejected as standalone — still unscoped |
| C. Scope Bootstrap via namespace | Partial — needed but insufficient alone |
| **D. Design tool → scoped/pruned compile** | **CHOSEN** |

Production rule: build the design with full Bootstrap (fast iteration), then compile a production CSS that (a) includes **only used Bootstrap modules/components** (Sass `@use` per module), (b) **prefixes every selector with the client scope** (Sass wrapper), (c) is purged of unused utilities (PurgeCSS-style pass), (d) ships as `client-{slug}.css.liquid`. Raw Bootstrap classes never appear unscoped in the theme.

### 6.2 Namespace (concrete, not "just BEM")

```html
<div class="ph-client ph-client--{slug}" data-ph-design="{slug}">
```

- All client CSS authored under `.ph-client--{slug}` (or generic `.ph-client` where shared).
- `[data-ph-design]` attribute for JS targeting and analytics hooks.
- Client CSS may NEVER write `:root`, `body`, or bare element selectors.
- Inside the scope, Bootstrap's own classes (`.btn`, `.modal`, `.container`) win — this is the containment boundary.
- PHANTOM's `.btn/.modal/.hero` remain untouched *outside* the scope — both systems coexist.

### 6.3 Token bridge

- Client design tokens are defined at `.ph-client { --slug-*: ...; }` (not `:root`).
- Where a client token semantically equals a PHANTOM token (`--ph-colorBody`, `--ph-colorBtnPrimary`, typography tokens), reference it: `--slug-bg: var(--ph-colorBody);` — single source of truth.
- Where the design diverges, override locally inside the scope. No global mutation.

### 6.4 z-index budget (mandatory)

PHANTOM ceiling is `10001`. Client layer budget (all inside `.ph-client`):

```text
sticky nav       5000
drawer           9000
modal            9050
toast            9500
3D overlay       9700   (never above PHANTOM's 10001)
```

No `!important`, no values > 10000 in client CSS.

### 6.5 Breakpoints

Client designs keep Bootstrap's design-time scale (576/768/992/1200/1400) **inside their scope only**. PHANTOM's own scale (769/959/1050/1140) is untouched. Because the client scope owns its responsive behavior, the two scales never interact. Document the mapping in each client's `mapping.md`.

### 6.6 Cascade priority (documented)

```text
1. PHANTOM global (theme.css.liquid, ph-*.css.liquid)
2. client-{slug}.css.liquid  (scoped, loaded last, higher specificity via .ph-client--{slug})
```

---

## 7. JavaScript Strategy (Decisive)

### 7.1 ClientDesign API (mandatory shape)

```js
class ClientDesign {
  init()    // boot once per design; idempotent
  destroy() // full teardown: GSAP contexts, Swiper, Lenis, observers, 3D renderer
  refresh() // re-scan sections after Shopify injects/replaces DOM
}
```

### 7.2 Lifecycle contract (verified gap being closed)

| Event | Required handling |
|---|---|
| `phantom:ready` (exists) | Initial boot when design is active |
| `DOMContentLoaded` | **Never** used as sole boot trigger |
| `shopify:section:load` | `refresh()` the new section (init its animations/components) |
| `shopify:section:unload` | **NEW** — `destroy()` per-section instances, remove observers/listeners |
| `shopify:section:select/deselect` | Pause/disable animations in editor while a section is selected |
| `shopify:theme:changed` / editor re-render | `destroy()` + `init()` full pass |
| `cart:updated` | Update cart-count/badges via PHANTOM's existing event |
| `ajax:cart:loaded` etc. | Adapter refresh hooks |

### 7.3 Library ownership

| Library | Policy |
|---|---|
| GSAP + ScrollTrigger | Per-client `vendor-{slug}.js`; one global timeline context via `gsap.context()`; all ScrollTriggers created inside context for auto-cleanup |
| Lenis | **Single instance per design**, owned by ClientDesign, paused during editor selection, destroyed on design teardown |
| Swiper | Instance registry keyed by section id; destroyed on `section:unload`; never created twice for same node |
| Three.js | Lazy-loaded (resource loader) only when a section requests it; WebGL detected first; renderer + RAF loop owned and disposed by the section's module |
| AOS/Flickity/PhotoSwipe | Already global in `phantom-vendor.js` — client designs must NOT re-bundle them; new client designs use GSAP/Swiper instead (different ecosystem, no clash) |

### 7.4 Module architecture

- `client-{slug}.js` ships as an ES module registered in `theme-import-map.liquid` (matches the existing `ui-*` precedent).
- No globals except the single `window.ClientDesign` registry entry.
- All listeners added with `{ signal }` AbortController or stored for explicit removal.

---

## 8. Shopify/Liquid Adapter Strategy

- Liquid supplies data via the client's frozen DOM — it injects `product.*`, `collection.*`, `cart.*`, `search.*` values into existing markup; it does not restructure it.
- Snippets classify as: **reusable** (price, badge, product-form, quick-add — reuse), **bypass** (presentation snippets client designs replace), **adapter** (thin Liquid wrappers that map data into client markup).
- Client sections keep PHANTOM conventions: `{% schema %}` with `presets`, `@app` where app blocks are needed, `settings` for Theme Editor — art direction preserved (not every CSS value becomes a setting).

---

## 9. Product / Collection / Cart Integration

| Surface | Adapter rule |
|---|---|
| Product | Liquid-only: title, vendor, description, price, compare-at, availability, SKU, policies, selling plans, inventory messaging, metafields where required. JS-enhanced: gallery, quick-add, variant images. Shopify-native: variant picker, buy buttons, forms |
| Media | Gallery, media switch, variant images → Shopify media objects; ratios frozen in the visual contract |
| Collection | Title, image, description, count, sorting, filters, pagination/load-more, empty state, badges, quick-add → Liquid + PHANTOM systems; grid markup comes from the client design |
| Cart | Drawer + page: add/remove/quantity/subtotal/count/discounts/empty state via PHANTOM cart events + `/cart.js`; **no fake cart behavior in production**; client design owns drawer visuals and animation |

---

## 10. Theme Editor Strategy

- Every client section: `{% schema %}` with presets; settings = text, image, video, product, collection, URL, toggles, display options only.
- Optional settings limited to spacing/alignment/animation choice/layout variation — **never** raw CSS values.
- `shopify:section:select` pauses heavy animation; `deselect` resumes; save/reload/re-render always passes through `destroy() → init()`.

## 11. App Block Strategy

- 33 PHANTOM sections already host `@app`; client sections that need app blocks (reviews, loyalty, etc.) declare `@app` in schema.
- Client CSS isolation must not restyle third-party app markup — app blocks render inside an unscoped `.ph-client__app` island, inheriting only typography/color tokens, never layout rules.

## 12. Performance Strategy

- Budgets: LCP ≤ 2.5s (3G mobile), INP ≤ 200ms, CLS ≤ 0.1; client CSS ≤ 60 KB gz; client JS + vendor ≤ 120 KB gz; no library over 150 KB gz loaded by default.
- Rules: `defer` all scripts; is-land lazy-load client sections; lazy-load below-fold media + Three.js; images via Shopify CDN responsive URLs; no duplicate libraries; load GSAP/Swiper/Lenis/Three only where used; purge unused Bootstrap and client CSS.

## 13. Accessibility Strategy

- Semantic headings in order, keyboard nav, visible focus, accessible forms/alt text, reduced-motion (`prefers-reduced-motion` kills GSAP/Three/Lenis and disables carousel autoplay), contrast AA, no hover-only functionality, accessible drawers/modals (focus trap, aria), screen-reader labels.

## 14. SEO Strategy

- Client designs never expose critical content via JS-only rendering; titles/meta/canonical/structured data/breadcrumbs/alt/heading hierarchy/internal links preserved by Liquid; no duplicate content; structured data from Shopify native systems.

---

## 15. Failure-Mode Register

| Failure | Cause | Prob. | Sev. | Prevention | Detection | Recovery |
|---|---|---|---|---|---|---|
| CSS collision (.btn/.modal/.hero) | unscoped client CSS | High | High | Namespace + scoped compile (Ch. 6) | Visual regression diff | Move offending rule under scope |
| Bootstrap leakage | raw Bootstrap in theme | Med | High | Option D compile | grep for `.row{`/`.btn{` unscoped | Recompile scoped |
| JS double-init | load + section:load re-boot | High | High | Idempotent init + registry | console dup warnings | destroy + init |
| Swiper dup | re-render without unload | Med | Med | unload handler + registry | instance count check | destroy stale |
| GSAP/ScrollTrigger leak | context not scoped | Med | Med | `gsap.context()` | ScrollTrigger.getAll() audit | context revert |
| Lenis multiple | init per section | Low | Med | single-instance policy | instance count | destroy + recreate |
| Three.js leak | RAF not stopped | Med | High | section-owned loop + dispose | GPU/CPU spike | destroy renderer |
| Section re-render failure | unload missing | High | High | lifecycle contract | editor smoke test | refresh() |
| Cart failure | fake cart behavior | Low | High | PHANTOM cart events only | cart QA suite | revert adapter |
| Variant failure | custom picker not synced | Med | High | variant adapter tests | variant QA | fallback native picker |
| App block breakage | scoped CSS hitting app | Med | Med | unscoped app island | app-block test | scope exemption |
| Mobile breakage | desktop-only QA | Med | High | mobile-first QA gate | device matrix | fix per-breakpoint |
| Performance regression | unpruned libs | Med | Med | budgets + bundles | Lighthouse CI | prune/replace |
| a11y regression | JS-only content | Med | Med | a11y checklist gate | axe scan | server-render critical |
| Broken locale | missing translation keys | Low | Med | locale lint | theme-check | add keys |
| Stale DOM refs | destroyed nodes still queried | Med | High | unload cleanup | console errors | destroy() pass |
| Global selector leakage | bare element rules | Med | High | lint rule: no bare selectors in client CSS | CSS audit | scope it |
| Editor breakage | assumptions about full reload | Med | High | editor QA matrix | manual editor pass | lifecycle fixes |
| Version drift / dead refs | baseline debt | High | Med | Phase 0.5 hardening | theme-check | fix before clients |

---

## 16. Implementation Phases (Final Sequence)

```text
Phase 0    Audit                          ← THIS DOCUMENT
Phase 0.5  Baseline hardening             ← TASK 02 (prerequisites: version sync, dead
                                             phMotion.animate ref, theme-check errors,
                                             deprecated filters, orphan cleanup)
Phase 1    Architecture contract          (this blueprint ratified + repo docs updated)
Phase 2    CSS isolation scaffold         (namespace, token bridge, z-budget, build script)
Phase 3    JS lifecycle scaffold          (ClientDesign API, section lifecycle hooks,
                                             registry, editor handling)
Phase 4    Design manifest tooling        (manifest.md template + component classifier)
Phase 5    Component adapters             (first client design's static components)
Phase 6    Commerce adapters              (product/collection/cart/search bindings)
Phase 7    Theme Editor pass              (schemas, settings, presets, editor QA)
Phase 8    App blocks                     (@app hosts in client sections, island styling)
Phase 9    Performance                    (budgets, purge, lazy strategy, Lighthouse)
Phase 10   Accessibility                  (full checklist + axe)
Phase 11   QA gate                        (functional/visual/responsive/editor matrix)
Phase 12   First client design            (full pipeline proof + visual regression sign-off)
```

---

## 17. Definition of Done

A client design is complete only when the full chain passes: External Design → Visual Contract → Shopify Mapping → Liquid Integration → Commerce Integration → Theme Editor → App Blocks → JS Lifecycle → Responsive QA → Performance → Accessibility → SEO → Theme Check → Production. No stage is skipped because "the storefront looks right."

---

## 18. READY FOR TASK 02

```
READY FOR TASK 02: YES
```

**Exact Task 02 objective:** *"PHANTOM baseline hardening + integration scaffold with zero visual change. Fix the verified baseline defects (sync version references to 2.3.0, remove the dead `window.phMotion.animate` reference in ph-skeleton.js, resolve the 18 theme-check MatchingTranslations errors, remove deprecated filters, delete orphaned/dead assets) so theme-check is clean; then create the integration scaffold defined in the Task 01 blueprint: `designs/` directory structure, the `.ph-client`/`[data-ph-design]` CSS namespace contract with the token bridge and z-index budget, the `ClientDesign` JS lifecycle shell (init/destroy/refresh + `shopify:section:unload/select/deselect` handlers + registry), and the client CSS/JS build pipeline (scoped Bootstrap compile + purge). Deliver: clean theme-check, the scaffold in place, and an executed QA pass proving zero visual regression on the default theme."*