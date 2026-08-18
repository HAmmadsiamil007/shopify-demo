# AETHER — Design Pack Manifest

> Per-pack manifest (contract §3.2: every pack ships `docs/{pack}/manifest.md`, `mapping.md`, `fidelity-report.md`). Skeleton materialized in Wave 0 T4; sections register here as they ship in Waves 1–3. Master registry: `docs/design-packs/registry.md`.

## Pack identity

| Field | Value |
|---|---|
| `pack_id` | `aether` |
| `display_name` | AETHER — Design Pack |
| `asset_base` | `aether` |
| `version` | 1.0.0 (bump per pack release) |
| `status` | `active` (registry) |
| `section_prefix` | `aether-` |
| `settings_namespace` | `aether_` |
| `locale_namespace` | `aether_*` (all 7 locales + `.schema.json` labels) |
| `default` | yes — `active_design_pack` default |
| Visual source of truth | `frontend/frontend/` (frozen reference, commit pending — registry §5) |
| Freeze revision | TBD — recorded here on first DESIGN FREEZE (§10 contract) |

## Component registry

Registered = shipped (Wave milestone). `data-section-type` must match `{pack}-{component}` and the section file `sections/aether-*.liquid`.

| Component | `data-section-type` | Wave | Status | Static/Dynamic | Dependencies |
|---|---|---|---|---|---|
| Hero | `aether-hero` | 1 | **production** | dynamic | `ui-image`, PHANTOM adapters |
| Featured products | `aether-featured-products` | 1 | **production** | dynamic | `product.price`, `form.product` |
| Collection grid | `aether-collection-grid` | 1 | **production** | dynamic | `product-grid-item`, `pagination` |
| Product page | `aether-product` | 1 | **production** | dynamic | `product.price`, `form.product`, `@app` |
| Cart items | `aether-cart-items` | 1 | **production** | dynamic | `cart`, `cart:updated` |
| Announcement bar | `aether-announcement-bar` | 1 | **production** | static | chrome (header-group) |
| Header | `aether-header` | 1 | **production** | dynamic | chrome (header-group) |
| Footer | `aether-footer` | 1 | **production** | dynamic | chrome (footer-group) |
| Editorial / promo | `aether-promo` | 2 | planned | static | `ui-image` |
| Testimonials | `aether-testimonials` | 2 | planned | static | — |
| FAQ | `aether-faq` | 2 | planned | static | accordion a11y |
| Contact | `aether-contact` | 2 | planned | static | form |
| Newsletter | `aether-newsletter` | 2 | planned | static | form |
| Rich text / hero content | `aether-rich-text` (hero/rich-text/faq/team/testimonials/contact/newsletter/promo — Wave 2 content family) | 2 | planned | static | — |
| 404 / search | Wave 2 | 2 | planned | static/dynamic | — |
| Accounts (customers/*) | classic Liquid — Wave 3 | 3 | planned | dynamic | — |
| Wishlist | localStorage — Wave 3 | 3 | planned | dynamic | — |

Wave 1 = all 8 Wave 1 components shipped production (2026-08-18, Tasks 1-11). Wave 1 status: **COMPLETE** (QA evidence in `fidelity-report.md`, Task 13).

## Assets & budgets

| Asset | Budget (v1) | Current size | Status |
|---|---|---|---|
| `assets/aether.css.liquid` | ≤ 60 KB | 58,220 B (registry measure, post-Liquid; 59,243 B raw incl. Liquid tags) | active — Wave 1 production, minified (see deviations D14) |
| `assets/aether.js.liquid` | ≤ 40 KB | 29,956 B | active — Wave 1 runtime |
| `assets/aether-motion.js` | n/a (on-demand) | 39,302 B | active — GSAP-powered motion, loaded on demand |
| `assets/aether-product.js` | n/a (on-demand) | 15,815 B | active — product/variant engine, loaded on product pages |
| `assets/aether-gsap.min.js` | n/a (vendor) | 115,595 B | active — loaded on demand, gated on motion |
| `assets/aether-lenis.min.js` | n/a (vendor) | 13,020 B | active — loaded on demand |
| `assets/aether-swiper.min.js` / `.min.css` | n/a (vendor) | 151,701 B / 18,459 B | active — loaded on demand |

Budget gate (`node designs/build/check-registry.mjs`): **PASS** (58,220 B ≤ 60 KB). Vendors load on demand per component (hero → swiper; motion → gsap+lenis); they are NOT included in the CSS/JS budget lines above.

JS contract: inert without `[data-section-type^="aether-"]`; subscribes to PHANTOM event bus only; controllers `{ init, destroy, refresh }`; idempotent (init flag); cleanup on unload. CSS contract: tokens on `.ph-client--aether` only; zero `:root`; z-index budget 5000/9000/9050/9500/9700; `@keyframes aether-*`.

## Tokens (brand-level, editor-controlled)

```
aether_primary / aether_accent / aether_bg / aether_surface / aether_text /
aether_muted / aether_border / aether_sale             (color)
aether_heading_font / aether_body_font                 (font_picker)
aether_radius                                         (range, 0–32)
aether_dark_light                                     (select: dark|light)
aether_motion_enable                                  (checkbox)
```

Defaults (frozen frontend): primary `#D4A574`, accent `#C8956C`, bg `#09090B`, surface `#1A1A1A`, text `#F2F2F2`, muted `#9C9C9C`, border `#2A2A2A`, sale `#E74C3C`, radius 12, scheme dark.

## Templates

| Page type | Base | Alternate |
|---|---|---|
| home | `index.json` (promote from `index.aether.json`) | `index.aether.json` (exists) |
| collection | `collection.json` (promote from `collection.aether.json`) | `collection.aether.json` (exists) |
| product | `product.json` (promote from `product.aether.json`) | `product.aether.json` (exists) |
| others | promotion per `docs/design-packs/template-promotion-contract.md` | `*.aether.json` (Wave 2) |

## Evidence files

- `docs/aether/mapping.md` — **created in Wave 1**: design → data anchors (`data-phantom-*` → Liquid), freeze revisions.
- `docs/aether/fidelity-report.md` — **created in Wave 1**: screenshot comparison vs frozen source at 1440/992/768/390, per section and per page.

## Wave 1 deviations (pre-declared D1-D11 + discovered D12-D16)

> Pre-declared in the Wave 1 plan; materialized here per Task 12 Step 2. Format: frozen-reference gap → why → action → resolution → note.

### Pre-declared (plan table, 2026-08-16)

| ID | Frozen design | Why not identical | Action | Resolution | Note |
|---|---|---|---|---|---|
| D1 | Static review cards + bars on product page | Reviews are app-managed commerce data, not design content | Shopify reviews via `@app` blocks | `@app` review slot (plus optional custom review block with frozen styling for the summary card when no app installed) | App-dependent review content; layout structure preserved |
| D2 | Search overlay built dynamically by `main.js` | PHANTOM already ships predictive search (drawer, `predictive-search:open` bus) | Reusing Core = sanctioned integration boundary, avoids duplicate search infra | AETHER search icon opens PHANTOM predictive-search drawer | Search UI is PHANTOM-styled, not AETHER-styled (documented coexistence) |
| D3 | `#searchOverlay`/magnify-lens etc. not implementable identically | — (no deviation) | — | — | — |
| D4 | Filter pills on shop.html are visual-only (no filtering) | Frozen behavior is decorative navigation | — | Pills = menu of collections (settings `filter_menu` link_list); Shopify `sort_by` dropdown added | Pills become functional navigation; sort control added (data, not design) |
| D5 | Reviews/FAQ/category/newsletter sections on home (index.html) not in Wave 1 scope | User Wave 1 scope = 8 commerce components; content sections are Wave 2 | — | Home composition = AETHER commerce sections interleaved with PHANTOM sections (Task 10) | Interim mixed design until Wave 2 replaces remaining blocks |
| D6 | Static cart qty/remove were unbound hooks (`.qty-btn`, `.remove-product`) | Commerce functionality must be real | — | Wire to Shopify cart line item updates (`/cart/change.js` via `cart:quantity` events + `cart:updated`) | Functionality added; markup unchanged |
| D7 | `product-detail.html` color swatches are cosmetic | Variants must be purchasable | — | Controls bind to product options via a GENERIC variant engine: ALL option groups rendered from `product.options_with_values`, variant matching by option POSITION (never hard-coded option1=color/option2=size); frozen swatch/tile presentation applied as an option-NAME display heuristic only. Own selector logic — `theme.Variants` doesn't attach to unregistered sections | Same UI; selection actually changes variant/price; engine works for any Shopify option set |
| D8 | Fonts via Google Fonts in frozen pages | Theme must be self-contained | — | AETHER implementation choice: Fontshare CDN link injected by aether.js via `loadCSS` (Cabinet Grotesk + Satoshi; `aether_heading_font`/`aether_body_font` settings keep PHANTOM font-picker contract). NOT a Design Pack requirement — generic pack font strategy in design-pack-contract.md §7b | Identical fonts (Cabinet Grotesk + Satoshi) |
| D9 | `.cart-count` hardcoded 0/2 | Must reflect real cart | — | `{{ cart.item_count }}` + live update on `cart:updated` | Data, not design |
| D10 | Home-page snap-scroll (ScrollTrigger snap sections) | Conflicts with Lenis + Shopify scroll; fragile across mixed sections | — | Snap disabled in AETHER port; reveal/parallax/motion preserved | Subtle scroll-feel change on home only (documented, deliberate) |
| D11 | `data-tilt`/`data-magnetic` on cards/buttons | GSAP-only micro-interactions | — | Ported into aether-motion.js, gated on motion enable + non-touch + reduced-motion | Identical on capable devices |

### Discovered during implementation (Wave 1)

| ID | Plan expectation | What was found | Resolution | Note |
|---|---|---|---|---|
| D12 | Plan Task 10 JSON used `view_all: true` on featured-products | Shipped `aether-featured-products` schema has no `view_all` setting | Shipped defaults `view_all_label` / `view_all_link` cover the intent (rendered when set) | Plan JSON vs shipped schema mismatch; defaults are the contract |
| D13 | Collection grid reads only template context | Home/other pages need a collection without a template `collection` | Added `collection` setting (default `main`) to `aether-collection-grid` + `assign grid_collection = collection | default: collections[section.settings.collection]` — template wins, setting used elsewhere | Extra setting, not a removal; locale keys added to all 7 schema files |
| D14 | CSS budget 60 KB with a hand-curated readable file | 58,220 B (post-Liquid) forces tight formatting | Shipped **minified** (registry measures post-Liquid size; 59,243 B raw incl. Liquid tags); inline source ledger comments retained; do NOT re-prettify — the gate would fail | Budget gate PASS at 58,220 B; re-prettifying = gate failure |
| D15 | Locale tooling tracked in repo | Theme-local `_scripts/` is gitignored by repo policy | `_scripts/add-locale-keys.ps1` stays local-only; regeneration/repair logic documented inside the script itself | Policy, not a design deviation — recorded for operators |
| D16 | — | `{{ amount }}` money-format fallback in JS would be mangled by Liquid rendering | Money fallback string wrapped in `{% raw %}` in `aether.js.liquid` (renders literal `{{amount}}` for JS-side `formatMoney`) | theme-check-safe and runtime-safe |

> Rule: any deviation NOT in this table requires the implementing reviewer to stop and flag it before continuing.