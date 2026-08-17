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
| Hero | `aether-hero` | 1 | planned | dynamic | `ui-image`, PHANTOM adapters |
| Featured products | `aether-featured-products` | 1 | planned | dynamic | `product.price`, `form.product` |
| Collection grid | `aether-collection-grid` | 1 | planned | dynamic | `product-grid-item`, `pagination` |
| Product page | `aether-product` | 1 | planned | dynamic | `product.price`, `form.product`, `@app` |
| Cart items | `aether-cart-items` | 1 | planned | dynamic | `cart`, `cart:updated` |
| Announcement bar | `aether-announcement-bar` | 1 | planned | static | chrome (header-group) |
| Header | `aether-header` | 1 | planned | dynamic | chrome (header-group) |
| Footer | `aether-footer` | 1 | planned | dynamic | chrome (footer-group) |
| Editorial / promo | `aether-promo` | 2 | planned | static | `ui-image` |
| Testimonials | `aether-testimonials` | 2 | planned | static | — |
| FAQ | `aether-faq` | 2 | planned | static | accordion a11y |
| Contact | `aether-contact` | 2 | planned | static | form |
| Newsletter | `aether-newsletter` | 2 | planned | static | form |
| Rich text / hero content | `aether-rich-text` (hero/rich-text/faq/team/testimonials/contact/newsletter/promo — Wave 2 content family) | 2 | planned | static | — |
| 404 / search | Wave 2 | 2 | planned | static/dynamic | — |
| Accounts (customers/*) | classic Liquid — Wave 3 | 3 | planned | dynamic | — |
| Wishlist | localStorage — Wave 3 | 3 | planned | dynamic | — |

## Assets & budgets

| Asset | Budget (v1) | Current size | Status |
|---|---|---|---|
| `assets/aether.css.liquid` | ≤ 60 KB | 1289 B (skeleton) | active — skeleton only |
| `assets/aether.js.liquid` | ≤ 40 KB | 3404 B (skeleton) | active — no-op runtime |

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

- `docs/aether/mapping.md` — **placeholder, created in Wave 1**: design → data anchors (`data-phantom-*` → Liquid), freeze revisions.
- `docs/aether/fidelity-report.md` — **placeholder, created in Wave 1**: screenshot comparison vs frozen source at 1440/992/768/390, per section and per page.