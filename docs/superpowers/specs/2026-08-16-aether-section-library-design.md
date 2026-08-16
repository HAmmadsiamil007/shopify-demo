# AETHER Section Library — Design

> **SUPERSEDED (2026-08-16):** replaced by `docs/superpowers/specs/2026-08-16-phantom-design-pack-architecture.md` (approved). AETHER is now the first **Design Pack** inside PHANTOM's generic pack architecture; this v1 6-section scope is absorbed as AETHER Wave 1. Kept for reference only.

- **Date:** 2026-08-16
- **Status:** Draft (pending user verification)
- **Theme:** PHANTOM v2.3.0 (OS 2.0) — `phantom-theme-v2.2.0/`
- **Repo policy:** origin = `shopify-demo` (branch `main`); `shopify-phantom-` is FROZEN.
- **Source of visual identity:** `frontend/frontend/` (static AETHER prototype — WordPress-origin, ~30 pages, no build step).

## 1. Vision

AETHER is a **dynamic, modular frontend section library** that coexists with PHANTOM on the same Shopify page/template. PHANTOM stays the Shopify theme/commerce engine; AETHER supplies premium visual sections. Merchants compose any order of `AETHER section / PHANTOM section / AETHER section / …` inside a single OS 2.0 JSON template, because every AETHER unit is a native Liquid section with its own `{% schema %}`, presets and settings.

```
SHOPIFY · PHANTOM THEME ENGINE
├── PHANTOM SECTIONS            └── AETHER SECTIONS
│   Existing PHANTOM UI              Premium AETHER UI
│   Commerce components              Custom visual components
│   Existing settings                AETHER settings
│   Existing snippets                AETHER snippets
└── shared: theme.liquid, assets, locales
```

## 2. Delivery model (decided)

**Native Liquid section library** shipped inside the PHANTOM theme. No Shopify app, no OAuth, no toggle. Sections are opt-in per template via the editor.

- Section files: `sections/aether-*.liquid`, each with `{% schema %}` + `presets`.
- Merchants add/reorder them beside PHANTOM sections in any JSON template.
- AETHER does **not** depend on the Task 03 `designs/` + `ph_active_design` toggle layer (that layer stays reserved for design-wide external frontends).

## 3. Namespace & assets (decided)

- **Classes:** all AETHER selectors prefixed `aether-*`.
- **Tokens:** own `--aether-*` custom-property set (see §8).
- **CSS:** one lean `assets/aether.css.liquid` — scoped to `.aether-*`, no Bootstrap, no `:root`/`body`/bare element selectors, no `!important`, z-index ≤ 10000.
- **JS:** one vanilla `assets/aether.js.liquid` — idempotent, ES5-friendly, no-op when no AETHER section is present on the page.
- **Loading:** both loaded from `layout/theme.liquid` (additive blocks). Because everything is namespaced, the default PHANTOM render path is byte-for-byte unaffected.
- **v1 CSS is hand-curated** (extracted from the frontend's design system). The `designs/build` purge pipeline may be reused later if the library grows; not required for v1.

## 4. v1 section scope (curated MVP — decided)

| Section | Role | Key settings | Data source |
|---|---|---|---|
| `aether-hero` | Full-width slider (1..N slides): bg image, eyebrow, headline, subtitle, CTA | blocks `slide` (image, eyebrow, headline, subtitle, cta_label, cta_url); section: autoplay, slide height, overlay | settings only |
| `aether-featured-products` | Product grid from one collection, cards with sale badge + add-to-cart | `collection`, `limit` (3–12), `show_badges`, `heading` | real commerce: `product.url/title/featured_image/price/compare_at_price/available`; reuses PHANTOM `product.price` + `ui-badge` |
| `aether-promo` | Full-width image banner with overlay + CTA | `image`, `eyebrow`, `heading`, `text`, `cta_label`, `cta_url`, `overlay` | settings only (image) |
| `aether-testimonials` | Review cards (grid or auto-rotate) | blocks `testimonial` (quote, author, role, avatar, rating); `heading` | settings only |
| `aether-newsletter` | Email capture | `heading`, `text`, `button_label`, `newsletter_form_id` | posts to PHANTOM `/contact#contact_form` (customer newsletter) |
| `aether-footer-extra` | Brand block + optional menus + contact + social | `brand_text`, `brand_image`, blocks `link_list` (menu), `contact_email/phone/address`, social URLs | `link_list` (menus), `shop.name` |

## 5. Data binding

Liquid replaces data, never design:

- **Real commerce data** only in `aether-featured-products`: products render via `collection.products` loop using `product.featured_image` (`image_url`), `product.title`, `product.url`, price via PHANTOM `product.price` snippet (`product`, `use_variant: false`), sale badge via `ui-badge` when `product.compare_at_price > product.price`, sold-out overlay via `product.available == false`.
- **Menus** (`link_list`) in `aether-footer-extra`.
- **Newsletter** posts a standard Shopify customer-newsletter contact form to `/contact#contact_form` with `form_type: 'customer'` and `contact[tags]` = `newsletter`, so subscribers land in the merchant's Shopify customers list.
- Add-to-cart in `aether-featured-products` posts to `/cart/add.js` and dispatches `cart:updated` (PHANTOM cart listens; no cart UI duplication).
- All user-facing strings via `{{ 'key' | t }}` + locales (all 8 languages, §9).

## 6. JS lifecycle contract (`aether.js`)

Follows OS 2.0 conventions and the existing PHANTOM patterns:

- Sections carry `data-section-type="aether-*"` + `data-section-id="{{ section.id }}"` on their root.
- Listens to `shopify:section:load`, `shopify:section:unload`, `shopify:section:select`, `shopify:section:deselect`, `cart:updated`.
- On init/destroy it mounts/unmounts controllers for: hero slider (arrows/dots/autoplay), testimonials rotation, reveal-on-scroll (IntersectionObserver), newsletter submit.
- Respects `prefers-reduced-motion` and `[data-disable-animations="true"]` everywhere (motion off → no slider autoplay/rotation/reveal; content always visible).
- Vanilla JS, no jQuery/GSAP for v1. A tiny shared controller registry (`window.AetherSections`) mirrors PHANTOM's section controller pattern.
- Asset only executes work when at least one `[data-section-type^="aether-"]` exists.

## 7. Theming (decided)

- **Default:** AETHER's own premium `--aether-*` tokens (warm palette, rounded, playful-yet-premium identity derived from the frontend design system).
- **Harmonize with PHANTOM:** each section gets a `harmonize` checkbox. When on, the section maps its semantic tokens to PHANTOM's `--ph-color*` (accent → `--ph-colorBtnPrimary`, text → `--ph-colorTextBody`, bg → `--ph-colorBody`, border → `--ph-colorBorders`, sale → `--ph-colorSaleTag`, etc.) — same token-bridge pattern proven in Task 03's demo.
- z-index budget reused: sticky 5000 / drawer 9000 / modal 9050 / toast 9500 / 3D 9700 (≤ 10000).

## 8. Token surface (`aether.css.liquid`)

```css
.aether {
  --aether-accent: ...;          /* premium warm accent */
  --aether-accent-text: ...;
  --aether-bg: ...;
  --aether-text: ...;
  --aether-muted: ...;
  --aether-border: ...;
  --aether-radius: ...;
  --aether-sale: ...;
  /* harmonize mode maps the above to --ph-color* */
}
```
(Exact palette values finalized during implementation from `frontend/frontend/assets/css/style.css`.)

## 9. File layout & deliverables

```
phantom-theme-v2.2.0/
├── sections/aether-hero.liquid
├── sections/aether-featured-products.liquid
├── sections/aether-promo.liquid
├── sections/aether-testimonials.liquid
├── sections/aether-newsletter.liquid
├── sections/aether-footer-extra.liquid
├── assets/aether.css.liquid
├── assets/aether.js.liquid
├── templates/page.aether.json          (mixed AETHER+PHANTOM demo page)
├── config/settings_schema.json         (no change for v1 — sections self-contained)
├── layout/theme.liquid                 (additive: load aether.css + aether.js)
└── locales/{en.default,de,es,fr,it,pt-BR,pt-PT}.{json,schema.json}  (aether_* keys)
docs/aether/manifest.md                 (component manifest)
docs/aether/mapping.md                  (design → data anchors)
docs/aether/fidelity-report.md          (QA record)
```

`templates/page.aether.json` (mixed composition to prove coexistence):
`aether-hero` → `featured-collection` (PHANTOM) → `aether-promo` → `rich-text` (PHANTOM) → `aether-testimonials` → `aether-newsletter` → `aether-footer-extra`.

## 10. QA gate (DoD)

1. `shopify theme check --path phantom-theme-v2.2.0` → 0 offenses (~280 files).
2. Default-path regression: `templates/index.json`, `assets/theme.css.liquid`, `assets/theme.js` untouched; `theme.liquid` diff additive-only; aether.js no-op on the default path (verify no console errors / no DOM mutation when no AETHER section present).
3. `aether.css.liquid` < 40 KB; contract audit: no `:root`/`^body`/`!important`/z-index ≥ 5 digits.
4. Locale key completeness across all 8 languages (theme-check MatchingTranslations clean).
5. Mixed composition verified: `page.aether.json` renders all 7 sections; dynamic-commerce fields present in `aether-featured-products`.
6. Visual fidelity record: screenshots of `page.aether.json` composition (static) at 1440/992/768/390 → `docs/aether/fidelity-report.md`. Live-store render QA is manual (no Shopify auth in this environment).

## 11. Roadmap (after v1)

- v2: port remaining frontend components (benefits/features, FAQ, team, blog-posts, announcement bar, cookie notice, back-to-top) as AETHER sections.
- Optional: route AETHER CSS through `designs/build` purge pipeline.
- Optional: AETHER `vendor-{slug}` slot for GSAP/Swiper if a section genuinely needs it (documented, unused for v1).
