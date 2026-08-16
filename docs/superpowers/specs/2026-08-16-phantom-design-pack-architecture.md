# PHANTOM Design Pack Architecture

- **Date:** 2026-08-16
- **Status:** Approved — specification (awaiting user review)
- **Supersedes:** `2026-08-16-aether-section-library-design.md` (draft, never implemented) — its 6-section scope is absorbed as AETHER Wave 1 of this architecture
- **Theme:** PHANTOM v2.3.0 (OS 2.0) — `phantom-theme-v2.2.0/`
- **Repo policy:** origin = `shopify-demo` (branch `main`); `shopify-phantom-` is FROZEN

---

## 0. Executive summary

PHANTOM is split into two conceptual layers:

1. **PHANTOM CORE** — commerce engine + theme runtime + shared UI kit. **Design-agnostic. Never redesigned for a pack.**
2. **DESIGN PACK RUNTIME** — a generic, registry-driven mechanism (`active_design_pack`) that activates one **Design Pack** at a time as the *default* design system.

A **Design Pack** (AETHER today; NOVA, LUXE, CLIENT-X tomorrow) is a coherent visual frontend system: its own sections, CSS, JS, tokens, settings, templates and locales. Packs are replaceable without touching PHANTOM Core.

**The key rule (explicit):**

> `active_design_pack` changes the **default design** (which CSS/JS loads, which compositions ship as base templates). It does **NOT** change the available section library, and it does **NOT** lock the merchant into one design. All sections from all packs and PHANTOM remain visible and composable in the Theme Editor.

```
                         PHANTOM CORE
                              │
                ┌─────────────┴─────────────┐
                │                           │
          COMMERCE ENGINE              DESIGN PACK RUNTIME
                │                           │
      Shopify data/functions          Active Design Pack
                │                           │
                │                  ┌────────┴────────┐
                │                  │                 │
                │               AETHER             NOVA
                │                  │                 │
                └──────────┬───────┴─────────────────┘
                           │
                    SHOPIFY THEME
                           │
                 ┌─────────┴─────────┐
                 │                   │
           AETHER sections      PHANTOM sections
                 │                   │
                 └─────────┬─────────┘
                           ↓
                    FINAL STOREFRONT
```

### The 17 architecture invariants (binding)

1. PHANTOM Core is design-agnostic.
2. AETHER is a replaceable Design Pack, not PHANTOM identity.
3. `active_design_pack` is generic and must not contain AETHER-specific branching.
4. AETHER is the initial/default Design Pack.
5. Future packs (NOVA, …) can replace AETHER without rewriting PHANTOM Core.
6. The active Design Pack controls default composition/assets/tokens — **not** section availability.
7. PHANTOM sections, snippets, blocks and compatible templates remain available.
8. AETHER and PHANTOM sections can coexist on the same OS 2.0 template.
9. The external HTML/CSS/JS frontend is the visual source of truth.
10. Liquid replaces data, not the approved visual design.
11. Every Design Pack has isolated CSS and JS.
12. Design Pack JS integrates with the existing PHANTOM `theme.js` lifecycle event bus rather than replacing it.
13. The architecture supports the client's external-frontend → Design Pack conversion workflow.
14. AETHER must be generic enough to serve any ecommerce vertical.
15. AETHER's default templates must be replaceable/promotable without destroying PHANTOM alternatives.
16. All 7 existing locales must be supported.
17. Existing PHANTOM infrastructure must remain regression-safe.

---

## 1. Forensic repository audit (verified 2026-08-16, not inherited)

Every claim below was verified directly against the repository. Corrections to prior reports are flagged `[CORRECTION]`.

### 1.1 Inventory

| Area | Count | Notes |
|---|---|---|
| `sections/` | 64 `.liquid` + 3 group `.json` | 67 files; 21 distinct `data-section-type` values |
| `snippets/` | 133 | dotted-name families: `product.*`, `form.product.*`, `ui-*`, `pdp-*`, `layout.*`, `style.*`, `theme-*`, `variant-*`, `header-*`, `footer-*` |
| `blocks/` | 14 | `_ph-pdp-*`, consumed ONLY by `main-product-high-variant.liquid` via `{% content_for %}` |
| `templates/` | 23 JSON + 2 root Liquid + 7 customers Liquid | `cart.ajax.liquid`, `gift_card.liquid`; customers = classic Liquid accounts |
| `assets/` | 129 | `theme.css.liquid` 717 KB (static, zero Liquid); `theme.js` 261 KB; `phantom-vendor.js` 126 KB (AOS + Flickity + PhotoSwipe + noUiSlider + JS Cookie); `lazy-load.min.js` (is-land 4.0.0); 11 `ui-*.js` ES modules; 4 `ph-*.js`; 5 client JS; 80 SVGs (56 `icon.*`, 22 `ph-icon.*`, 3 chevrons, 5 decorative); 4 JPGs |
| `locales/` | 14 files | **7 languages** `[CORRECTION: prior reports said 8]`: en.default, de, es, fr, it, pt-BR, pt-PT (+ `.schema.json` each) |
| `config/` | 2 | `settings_schema.json` (15 groups, 1275 lines), `settings_data.json` (7 presets, no `current.settings` object) |
| `layout/` | 3 | `theme.liquid`, `password.liquid`, `gift_card.liquid` |

### 1.2 Critical verified facts

1. **No base `product.json` or `collection.json` exists** `[CORRECTION]` — only suffixed variants (`product.preorder.json`, `product.high-variant.json`, `product.product-landing.json`, `product.brand-story.json`, `product.gift-card.json`, `product.modal.json`; `collection.no-sidebar.json`, `collection.no-promos.json`, `collection.collection-landing.json`). Creating AETHER `product.json`/`collection.json` is purely additive.
2. **Theme Editor template discovery:** the theme already ships 16 suffixed templates and the `page.demo.json` assignment pattern — suffixed naming `{base}.{suffix}.json` is verified valid and editor-discoverable in this theme (Shopify OS 2.0 `template.suffix` mechanism). Therefore `{base}.{pack}.json` (e.g. `index.aether.json`, `product.nova.json`) is a safe convention. `[Amendment 3 — verified]` Suffix collisions must be avoided with existing suffixes: `preorder`, `high-variant`, `product-landing`, `brand-story`, `gift-card`, `modal`, `no-sidebar`, `no-promos`, `collection-landing`, `full-width`, `faq`, `demo`, `about`, `contact`, `ajax`, `classic` (reserved for PHANTOM archives).
3. **Settings→CSS pipeline:** `theme.css.liquid` is static; all settings mapping happens in (a) `theme.liquid` inline `{% style %}` (`--root-*`, `--color-*`, `--element-*`), (b) `snippets/css-variables.liquid` (54 `--ph-color*` + `--typeHeader*`/`--typeBase*`), (c) `assets/ph-design-tokens.css.liquid` (static scales: `--ph-space-*`, `--ph-z-*` z-index budget sticky 5000/drawer 9000/modal 9050/toast 9500/3D 9700 cap 10000, `--ph-elevation-*`, `--ph-border-*`, `--ph-opacity-*`), (d) section-level `{% style %}`.
4. **JS lifecycle:** `theme.js` = classic `theme.Sections` registry — 17 constructors registered at boot, document-level listeners for `shopify:section:load/unload/select/deselect` + `shopify:block:select/deselect`, `cart:updated` CustomEvent, and a `phantom:ready` boot event. Instance creation scans `[data-section-type]` **only for registered types** — unknown types are never queried, so pack section types (`aether-*`) cannot collide.
5. **Task 03 loader is the seed:** `theme.liquid` already conditionally loads `client-{slug}.css.liquid` + `client-{slug}.js` when `settings.ph_active_design != 'none'` (settings_schema group 15, options `none`/`demo`; settings_data `"ph_active_design": "none"`). `sections/client-demo-{hero,collection,footer}.liquid` use `.ph-client--demo` scope + `--demo-*` tokens + scoped Bootstrap grid.
6. **Section groups:** `sections/header-group.json` (announcement + header), `footer-group.json` (footer-promotions + footer), `popup-group.json` (`custom.popups` group; newsletter-popup + age-verification-popup, disabled). 44 sections carry `disabled_on: ["footer","header","custom.popups"]`; `apps.liquid` renders `@app` blocks; `@app` in 7+ sections.
7. **Dead code found:** `sections/media-text.liquid` (0 B), `sections/newsletter-section.liquid` (0 B) — stubs; `phantom-dark-mode.js`, `effects.js`, `three-scenes.js` (34 B stub) in assets — never loaded by any page; `contact-form.php` in `frontend/` — unconfigured. No `theme-check.yml`, no `.github/`, no root `package.json`; `_scripts/` + `theme-check-output.txt` gitignored; `designs/build/` holds the client-design pipeline (sass + purgecss + bootstrap, `node build.mjs --slug demo [--check]`).
8. **AETHER on disk today:** zero `sections/aether-*.liquid`, zero `aether_*` locale keys. The only implemented client layer is Task 03's `client-demo-*` stack (`designs/demo/` source + pipeline → `assets/client-demo.css.liquid` + `client-demo.js`, composed in `templates/page.demo.json`).
9. **`frontend/frontend/`** = pure static (22 HTML + 5 PNG + 5 MD + 1 PHP + snapshots; **no Liquid/JSON/CSS/JS**). Data layer: `data-phantom-*` attribute vocabulary (settings/products/posts/menus/cart), `phantom-data.js` WP REST bridge (`/wp-json/phantom/v1/page-data`, 1-hour cache, never live), `firebase-auth.js` (demo-mode), `animations.js` (GSAP, 40 KB), `main.js` (25.8 KB), CDN libs (Bootstrap 5.3.3, Swiper 11, GSAP 3.12.5, Lenis 1.1.18, FontAwesome). 99 KB `style.css`. Dark "Void" identity (`--void`/`--gold`/`--chrome`).

### 1.3 Forensic corrections register

| Prior claim | Verdict |
|---|---|
| "8 languages" | **7** — en/de/es/fr/it/pt-BR/pt-PT |
| "templates/index.json untouched (Task 03)" | True, but **no base product/collection templates exist at all** — AETHER creates them |
| "274 files, 0 offenses (theme-check)" | True for last run; theme-check output file records an *older* run with 366 offenses — re-run at each wave gate |
| "Bootstrap in production (client-demo)" | Yes but scoped `.ph-client--demo`; AETHER production = hand-curated, no Bootstrap dependency |
| AETHER v1 spec "6 sections" | Superseded — absorbed as Wave 1 of pack architecture |

---

## 2. Classification (ownership map)

Classification key: **CORE** = design-agnostic commerce/runtime (never pack-owned); **PHANTOM DESIGN** = default OS 2.0 design layer (stays available; not pack-owned); **GLOBAL INFRA** = shared infrastructure (never pack-owned, packs integrate with it); **PACK** = owned by a Design Pack; **CLIENT LAYER** = Task 03 demo stack (precedent for pack CSS/JS discipline); **LEGACY** = dead/stub.

| Component | Location | Responsibility | Owner | Reusable? | Design-specific? | Commerce-critical? | Safe to replace? |
|---|---|---|---|---|---|---|---|
| `theme.js` Sections registry + events | `assets/theme.js` | section lifecycle, cart, globals | CORE | yes | no | yes | no |
| `theme.css.liquid` (717 KB static) | `assets/` | base OS 2.0 styles | CORE | yes | part | yes | no |
| `phantom-vendor.js`, `lazy-load.min.js`, `ext-inview.js` | `assets/` | vendor + is-land lazy | CORE | yes | no | yes | no |
| `css-variables.liquid` (54 `--ph-color*`) | `snippets/` | settings→token bridge | CORE | yes | no | yes | no |
| `ph-design-tokens.css.liquid` (`--ph-space/-z/-elevation…`) | `assets/` | token scales + z budget | CORE | yes | no | yes | no |
| `ph-motion/loader/skeleton/transitions.*` | `assets/`, `snippets/` | PHANTOM motion/preloader | PHANTOM DESIGN | yes | yes | no | replaceable by pack (opt-out via settings) |
| `main-*`, `featured-*`, `collection-*`, `product-*` templates & snippets, `pdp-*`, `form.product*`, `product-grid-item`, `cart-item`, `cart-drawer`, `collection-grid-filters-form`, `pagination`, `variant-*`, `quantity-input`, `quick-shop-modal`, `ui-*` kit, `layout.*`, `style.*` | `sections/` `snippets/` | commerce adapters + UI kit | CORE | yes | no | yes | no |
| `header`, `announcement`, `footer`, `footer-promotions`, `newsletter-popup`, `age-verification-popup`, `offers-drawer`, `password-header`, `giftcard-header`, `apps`, `header-*`/`footer-*`/`drawer-*` snippets | `sections/` `snippets/` `sections/*.json` | theme chrome + groups | CORE | yes | part | yes | no |
| `slideshow`, `rich-text`, `promo-grid`, `text-and-image`, `text-columns`, `text-with-icons`, `hero-video`, `featured-video`, `background-image-text`, `background-video-text`, `image-compare`, `hotspots`, `logo-list`, `map`, `scrolling-*`, `testimonials`, `faq`, `countdown`, `quiz`, `newsletter`, `contact-form`, `featured-collections`, `blog-*`, `article-template`, `advanced-content`, `urgency-bar`, `free-shipping-bar`, `size-guide`, `main-page*` | `sections/` | PHANTOM marketing/content sections | PHANTOM DESIGN | yes | no | **no — stay available** (merchant may choose them) |
| `main-product-high-variant` + `blocks/_ph-pdp-*` | `sections/` `blocks/` | flex PDP (OS 2.0 content_for) | CORE | yes | part | yes | no |
| `client-demo-*` sections, `client-demo.css.liquid`, `client-demo.js`, `designs/` pipeline + contracts | `sections/` `assets/` `designs/` `templates/page.demo.json` | Task 03 proof stack | CLIENT LAYER | yes (precedent) | yes | no | **migrate** into pack resolver as legacy-compat entry `demo` |
| `ph_active_design` setting | `config/settings_schema.json` | client-design toggle | CLIENT LAYER | — | — | no | **replaced** by `active_design_pack` (see §5) |
| `media-text.liquid`, `newsletter-section.liquid` (0 B) | `sections/` | dead stubs | LEGACY | no | — | no | delete (Wave 0 cleanup) |
| `phantom-dark-mode.js`, `effects.js`, `three-scenes.js` | `assets/` | never loaded | LEGACY | no | — | no | delete (Wave 0 cleanup) |
| `frontend/frontend/` | repo root (untracked) | static visual source of truth | CLIENT DESIGN SOURCE | yes | yes | no | freeze; commit as reference |
| `aether-*` (future) | `sections/` `assets/` `templates/` `locales/` | AETHER Design Pack | **PACK** | yes | yes | no | yes — by design |

---

## 3. Design Pack Contract

A Design Pack is a self-contained visual frontend system shipped inside the theme, identified by a unique `pack_id`. Packs are **conventions + a registry + a loader**, not a runtime plugin system — Shopify has no native pack mechanism, and the architecture does not emulate one.

### 3.1 Pack anatomy (conceptual registry entry)

| Field | Meaning | Liquid implementation |
|---|---|---|
| `pack_id` | unique slug, lowercase `[a-z0-9-]` | `design-pack-resolver.liquid` list |
| `display_name` | merchant-facing label | locale key `t:settings_schema.design_pack.packs.<id>` |
| `asset_base` | file base for `{asset_base}.css.liquid` / `{asset_base}.js.liquid` | resolver `asset_bases` list |
| `version` | pack version | resolver constant + `docs/{pack}/manifest.md` |
| `status` | `draft` / `active` | resolver: only `active` packs emit assets (guards missing-asset) |
| `section_prefix` | `{pack}-` on section files, types, classes | convention (§3.4) |
| `settings_namespace` | `{pack}_` on settings ids + locale keys | convention (§6) |
| `locale_namespace` | `{pack}_*` keys, all 7 locales | convention (§6) |
| `default_templates` | base + suffixed template compositions the pack ships | convention (§8) |
| `default` | is this pack the shipped default? | `active_design_pack` schema `default: "aether"` |

Liquid constraint: the resolver implements `pack_id`/`asset_base`/`status`/`version` as parallel lists in one snippet — the **single registration point**. The remaining fields are enforced by convention and documented per pack in `docs/{pack}/manifest.md` + the global `docs/design-packs/registry.md`.

### 3.2 What a pack provides

- `sections/{pack}-*.liquid` — real OS 2.0 sections, each with own markup, `{% schema %}`, presets, settings, `data-section-type="{pack}-*"`, root class `ph-client ph-client--{pack} {pack}-{component}`.
- `assets/{pack}.css.liquid` — hand-curated, fully scoped; tokens on `.ph-client--{pack}` root; no Bootstrap/GSAP/Swiper runtime dependency (design-time only).
- `assets/{pack}.js.liquid` — vanilla, idempotent, no-op without sections; controllers with `init()/destroy()/refresh()`; integrates with PHANTOM event bus (§7).
- Settings group in `settings_schema.json` + defaults in `settings_data.json`.
- Locale keys `{pack}_*` in all 7 locales (+ `.schema.json` label keys).
- Template compositions (base + `*.{pack}.json` alternates) + `docs/{pack}/manifest.md`, `mapping.md`, `fidelity-report.md`.

### 3.3 What a pack must NOT do

- Never modify `theme.liquid` core blocks, `theme.js`, `theme.css.liquid`, `css-variables.liquid`, PHANTOM sections/snippets/blocks, or other packs' files.
- Never define `:root`/`body`/`html`/bare-element selectors globally; never use `!important` except approved state overrides (documented per occurrence); never exceed the z-index budget.
- Never assume its own header/footer/page wrapper exists; never require pack-specific global DOM.
- Never load GSAP/Three.js/Lenis/Swiper unless the approved design genuinely requires them (per-section opt-in, documented).

### 3.4 CSS isolation contract

```
.ph-client                  — pack container root (already established by Task 03)
.ph-client--{pack}          — pack variant (aether, nova, …); token scope
.{pack}-{component}         — e.g. .aether-hero, .aether-product-grid
--{pack}-{token}            — e.g. --aether-accent (defined on .ph-client--{pack} only)
```

- Selectors: every rule must reference `.ph-client--{pack}` or a `.{pack}-*` class; `@media`/`@supports` recursed; `@keyframes` names prefixed `{pack}-`.
- Specificity: default ≤ 2 class levels; no IDs; no element selectors outside pack components.
- z-index: reuse `--ph-z-*` budget (5000/9000/9050/9500/9700, cap 10000).
- Token harmonization adapter: per-section `harmonize` checkbox maps semantic pack tokens to PHANTOM tokens on the section root, e.g. `--aether-accent: var(--ph-colorBtnPrimary)` — proven pattern from Task 03 demo. Explicit adapter, no leakage: pack tokens are read by pack CSS only.
- Enforcement: the `designs/build/audit-scope.mjs` scoping audit (proven in Task 03 correction pass) is adapted into a pack-CSS gate (`--check` runs selector audit for `{pack}` prefix).

### 3.5 JS lifecycle contract

- Pack JS loads `defer` (theme.liquid, generic loader); executes no work unless ≥1 `[data-section-type^="{pack}-"]` exists.
- Subscribes to the **existing** PHANTOM event bus: `shopify:section:load/unload/select/deselect`, `shopify:block:select/deselect`, `cart:updated`, `phantom:ready` — never re-implements it (invariant 12).
- Controller registry per pack: `{Pack}Runtime.controllers = { 'aether-hero': { init(el, opts), destroy(el), refresh(el) } }`; boot scan + event-driven mount/unmount; duplicate guards (init flag on element); cleanup on unload (listeners, observers, intervals, swipers).
- Respects `prefers-reduced-motion` and `data-disable-animations` (+ PHANTOM `disable_animations` setting) everywhere; animations never gate commerce.

---

## 4. Active Design Resolution

**Storage:** `settings.active_design_pack` — new "Design Packs" settings group in `settings_schema.json`:

```json
{ "type": "select", "id": "active_design_pack",
  "label": "t:settings_schema.design_pack.active_design_pack",
  "default": "aether",
  "options": [
    { "value": "aether", "label": "t:settings_schema.design_pack.packs.aether" },
    { "value": "demo",   "label": "t:settings_schema.design_pack.packs.demo" },
    { "value": "none",   "label": "t:settings_schema.design_pack.packs.none" }
  ] }
```

- **`aether`** — the production default (AETHER is the premium frontend; "PHANTOM with no frontend" is not a production state).
- **`demo`** — legacy compatibility for the Task 03 client-design stack (loads `client-demo.css.liquid` + `client-demo.js` through the resolver; `page.demo.json` keeps working). Conceptual production state: still AETHER; `demo` is a development/testing entry.
- **`none`** — legacy compatibility value preserved for dev/testing (no pack assets). Not a normal pack choice. `[Amendment 1]`
- Future packs are appended to the resolver + settings options when shipped (single registration point).

**Reading:** `snippets/design-pack-resolver.liquid` — the ONLY place that knows pack names:

```liquid
{%- comment -%} DESIGN PACK REGISTRY — single registration point {%- endcomment -%}
{%- assign dp_packs   = 'aether|demo|none' | split: '|' -%}
{%- assign dp_assets  = 'aether|client-demo|none' | split: '|' -%}
{%- assign dp_versions= '1.0.0|1.0.0|0' | split: '|' -%}
{%- assign dp_status  = 'active|active|legacy' | split: '|' -%}
{%- assign dp_requested = settings.active_design_pack | default: 'aether' -%}
{%- assign dp_index = 0 -%}
{%- for p in dp_packs -%}{%- if p == dp_requested -%}{%- assign dp_index = forloop.index0 -%}{%- break -%}{%- endif -%}{%- endfor -%}
{%- if dp_index == 0 and dp_requested != 'aether' -%}{%- assign dp_index = 0 -%}{%- endif -%}  {%- comment -%} invalid → fallback to aether (index 0) {%- endcomment -%}
{%- assign dp_active = dp_packs[dp_index] -%}
{%- assign dp_asset  = dp_assets[dp_index] -%}
{%- assign dp_enabled = dp_status[dp_index] != 'legacy' and dp_status[dp_index] == 'active' -%}
```

**Resolution rules (explicit):**

| Condition | Result |
|---|---|
| missing / blank setting | `aether` (schema default + resolver fallback) |
| invalid id (not in registry) | `aether` — no error, no broken asset tag |
| `status != active` | assets not emitted; sections still available in editor |
| `demo` / `none` | legacy entries — assets emit only for `demo`; `none` emits nothing |
| future pack added | +1 row in resolver lists, +1 option in settings, +`{pack}.css.liquid`/`{pack}.js.liquid` assets |

**Loading (theme.liquid — replaces the `client-` conditional):**

```liquid
{%- render 'design-pack-resolver' -%}
{%- if dp_enabled and dp_asset != 'none' -%}
  {{ dp_asset | append: '.css.liquid' | asset_url | stylesheet_tag }}
  <script src="{{ dp_asset | append: '.js.liquid' | asset_url }}" defer="defer"></script>
{%- endif -%}
```

- **Sections:** unaffected by the resolver — all OS 2.0 sections are always discoverable in the editor (Shopify constraint, embraced). Active pack never hides PHANTOM sections (invariant 6).
- **Theme Editor:** fully functional — resolver is a plain setting; pack sections have presets; per-section harmonize checkboxes; merchant can remove/add any AETHER or PHANTOM section on any template.
- **Discovery:** pack templates ship as base compositions + `*.{pack}.json` alternates, both editor-assignable (§8).

---

## 5. Default design vs available design library

- **DEFAULT DESIGN** — determined by `active_design_pack` (+ base template compositions). Today: AETHER.
- **AVAILABLE LIBRARY** — everything: PHANTOM sections/snippets/blocks/templates + AETHER sections + future packs' sections. Nothing is hidden.
- The default pack's templates are promoted to base template names (§8 promotion procedure). A different pack shipping later promotes its own compositions — PHANTOM's identity is never overwritten; the base template simply points at the currently promoted design.

---

## 6. Settings & tokens strategy

- **New settings group "Design Packs":** `active_design_pack` (above) + paragraph explaining default ≠ lock.
- **Per-pack token group** (e.g. "AETHER — Design Pack"), ids `aether_*`; NOVA later gets `nova_*` — no cross-pack leakage possible by construction (each pack's CSS reads only its own settings):

```
aether_primary / aether_accent / aether_bg / aether_surface / aether_text /
aether_muted / aether_border / aether_sale             (color)
aether_heading_font / aether_body_font                 (font_picker)
aether_radius                                         (range, 0–32)
aether_dark_light                                     (select: dark|light)
aether_motion_enable                                  (checkbox)
```

- **Brand-level only:** colors/fonts/radius/motion/dark-light. Spacing scales, timing curves, elevation, shadows = fixed art-direction tokens in CSS (settings must not destroy art direction).
- **Harmonize adapter:** per-section `harmonize` checkbox → section root maps semantic tokens to `--ph-color*` via CSS (proven Task 03 pattern). Explicit, documented, opt-in.
- **Locale keys:** new `design_pack_*` + `aether_*` key families in **all 7 locales** (+ `.schema.json` label keys for settings groups/sections). theme-check `MatchingTranslations` is a QA gate.
- `settings_data.json`: `"active_design_pack": "aether"` + `aether_*` defaults added to the default preset; other presets untouched (schema defaults + resolver fallback cover them).

---

## 7. PHANTOM coexistence (first-class)

- Mixing is a normal OS 2.0 composition, e.g. `templates/index.json` may become: `aether-hero` → `featured-collection` (PHANTOM) → `aether-promo` → `rich-text` (PHANTOM) → `aether-testimonials` → `newsletter` (PHANTOM).
- No special mode/toggle required (invariant 8). Theme Editor add/remove/sort works across both families.
- Pack sections reuse PHANTOM **adapters** freely (`product.price`, `ui-image`, `product-grid-item`, `pagination`, `form.product`, `@app` blocks) — reuse of logic, never of unscoped styles.
- PHANTOM sections with a visual style incompatible with AETHER remain available; the merchant chooses them intentionally (specified by user; no forced restyling).
- A visual incompatibility is accepted and documented; packs do not restyle PHANTOM sections.

---

## 8. Template strategy (default vs available)

**Verified naming rule `[Amendment 3]`:** OS 2.0 suffixed templates `{base}.{suffix}.json` are valid and editor-discoverable (proven by the 16 existing suffixed templates). Convention: `{base}.{pack}.json` for pack alternates; `.phantom` reserved for archived PHANTOM base compositions; existing suffixes must not be reused (`preorder`, `no-sidebar`, …).

| Page type | Base (default = promoted pack) | Pack alternates | PHANTOM archives (preserve) |
|---|---|---|---|
| home | `index.json` → AETHER composition (archive current PHANTOM as `index.phantom.json`) | `index.aether.json` | `index.phantom.json` |
| collection | **NEW** `collection.json` → AETHER | `collection.aether.json` | existing suffixed variants untouched |
| product | **NEW** `product.json` → AETHER | `product.aether.json` | existing suffixed variants untouched |
| blog / article / search / cart / 404 / page / list-collections / password | AETHER composition replaces base (archive PHANTOM as `*.phantom.json`) | `*.aether.json` | `*.phantom.json` |
| customers/* | classic Liquid templates — AETHER versions replace content in place (Liquid, not JSON sections) | — | git history (no archive copies; pure Liquid files are versioned) |
| gift_card / cart.ajax | untouched | — | — |

**Promotion procedure (documented in `docs/design-packs/registry.md`):** pack ships `*.{pack}.json` alternates → client/merchant approves → composition is copied to the base template name → `active_design_pack` flipped. Base template = "currently promoted design"; pack does not own PHANTOM's identity. No PHANTOM template is destroyed; nothing is hidden from the editor.

---

## 9. Data contract (Liquid replaces data, never design)

| Data | Liquid object | PHANTOM adapter reused (not restyled) |
|---|---|---|
| products / variants | `product.*`, `product.variants`, `product.selected_or_first_available_variant` | `product.price`, `product-grid-item`, `form.product`, `variant-*`, `pdp-variant-picker`, `quantity-input` |
| prices | `price`, `compare_at_price`, `money`/`money_with_currency` | `product.price` (`use_variant:`) |
| images | `featured_image`, `product.media`, `image_url` | `ui-image`, `image-element` |
| collections | `collection.products`, `collections` | `collection-grid-item`, `subcollections` |
| menus | `linklists`, `link_list` blocks | `footer-menu`, `drawer-menu` |
| pages / legal | `page.content`, `page.title` | `main-page` |
| articles / blogs | `article.*`, `blog.articles` | `article-grid-item`, `comment` |
| customers | `customer.*`, `{% form 'customer_login' %}` etc. | `customer-account`, classic Liquid templates |
| search | `search.results`, `search.performed` | `search-grid-item`, `collection-grid-filters-form` |
| cart | `cart.items`, `cart.total_price`, `/cart/add.js`, `cart:updated` | `cart-item`, `cart-drawer` |
| metafields | `product.metafields.*` | documented per section |
| app blocks | `@app` blocks in pack schemas | `apps.liquid` pattern |
| forms | contact / newsletter / customer | `{% form %}` + `form_type` (`customer`, `contact`) → `/contact#contact_form` |

All user-facing strings via `{{ 'aether.*' | t }}` + 7 locales.

---

## 10. External frontend → Design Pack conversion contract

```
CLIENT → "premium fashion store" → external frontend (HTML/Bootstrap/vendor CSS/
theme CSS/GSAP/Three/Lenis/Swiper/animations) → client approves → FREEZE DESIGN
→ component manifest (frontend/frontend + data-phantom-* vocabulary) →
static/dynamic classification → map component → section/block/snippet/template/
adapter → preserve DOM/design intent → replace static data with Liquid →
add {% schema %} → scope CSS (pack namespace, audit gate) → scope JS (pack
runtime, event bus) → lifecycle handling → Theme Editor test → commerce test →
visual regression (screenshots vs frozen source) → promote to default
```

- The external frontend is the **visual source of truth** (frozen: `frontend/frontend/`, committed to repo as reference — currently untracked; decision to commit it is part of Wave 0).
- Design-time libraries (GSAP/Three/Lenis/Swiper/Bootstrap) are development tools; production ships only capabilities the approved design requires (invariant: performance budget, §12).
- Conversion evidence per pack: `docs/{pack}/manifest.md` (component registry) + `mapping.md` (design → data anchors, `data-phantom-*` → Liquid) + `fidelity-report.md` (screenshot comparison).

---

## 11. Performance strategy

- Pack CSS/JS load **only when the active pack is `active`** (conditional tags in theme.liquid — proven Task 03 pattern).
- Pack JS is a **no-op** on pages without pack sections (early exit).
- v1 budgets: `aether.css.liquid` ≤ 60 KB, `aether.js.liquid` ≤ 40 KB (hand-curated; the 717 KB static `theme.css.liquid` is not duplicated).
- Lazy loading: is-land (`lazy-load.min.js`) + `loading="lazy"` via `ui-image`; section-aware JS (only present sections initialize).
- No design-time CDN libs in production unless required by the approved design (per-section opt-in, documented in manifest; `vendor-{pack}` slot reserved in `theme-import-map` pattern).
- All pack assets `defer`/preload-eligible; no render-blocking inline scripts beyond the resolver-driven tags.

---

## 12. Accessibility strategy

- WCAG 2.1 AA baseline: semantics (header/nav/main/section/article), keyboard + focus management, visible focus rings, skip-link reuse, ARIA for sliders/accordions/modals/drawers, accessible forms (labels, errors), contrast via token pairs.
- Motion: `prefers-reduced-motion` + `data-disable-animations` + PHANTOM `disable_animations` respected; content never hidden behind animations; commerce never gated on animation.
- Pack sections reuse PHANTOM `a11y.css` primitives (skip-link, focus-visible, reduced-motion, forced-colors) — global infra, not pack-owned.

---

## 13. Failure mode register

| # | Failure | Cause | Impact | Detection | Prevention | Fallback | Recovery |
|---|---|---|---|---|---|---|---|
| 1 | invalid design id | merchant/typo setting | defaults used | resolver whitelist | registry + fallback | `aether` | re-select valid pack |
| 2 | missing pack asset | pack files not uploaded | broken link/script tag | asset exists? (build check) | status=draft until assets ship | assets skipped when status≠active | ship assets, flip status |
| 3 | missing section file | template references undeleted section | editor shows missing section | theme-check `MissingSection` | keep files in sync | section ignored/removed by editor | restore file |
| 4 | broken pack CSS | selector leak | visual bleed into PHANTOM/other packs | scope audit (`--check`) gate | namespace contract | revert pack CSS | fix + re-audit |
| 5 | duplicate CSS | two packs' tokens both `:root` | token collision | audit (no `:root` in pack CSS) | scope tokens on `.ph-client--{pack}` | cascade defaults | fix |
| 6 | JS init twice | section:load after manual init | duplicate sliders/listeners | runtime init flag per element | idempotent controllers | destroy+reinit | reinit only on unload/load cycle |
| 7 | section unloaded | editor removes section | stale listeners | `shopify:section:unload` handler | destroy() on unload | removed DOM | no-op |
| 8 | editor reload | section:load re-fires | re-init | init-flag + refresh() | idempotent | reuse instance | refresh() |
| 9 | app block inserted | @app into pack section | render OK | `{% render block %}` pattern | apps.liquid pattern in pack schemas | block renders inline | none |
| 10 | PHANTOM+AETHER mix | intentional | no conflict | CSS/JS namespace audit | isolation contracts | independent styling | none |
| 11 | mobile rendering | breakpoint bleed | layout shift | responsive QA + screenshots | pack breakpoints inside `.ph-client--{pack}` | PHANTOM responsive intact | fix breakpoints |
| 12 | reduced motion | user/merchant pref | animations on | `prefers-reduced-motion` check | motion off by default under pref | static layout | none |
| 13 | WebGL unavailable | no WebGL / stub | 3D scene missing | feature-detect | three-scenes is a stub; no production 3D | skip scene | none |
| 14 | missing Shopify data | empty collection, no image | empty grid / placeholder | `{% if %}` guards | onboarding placeholders (`onboarding-product-grid-item` pattern) | graceful empty state | add data |
| 15 | out-of-stock / variant unavailable | inventory | add-to-cart blocked | `product.available`, `selected_or_first_available_variant` | disable + sold-out overlay (`ui-badge` pattern) | message | restock |
| 16 | pack JS syntax error | regression | controllers dead | theme-check + manual console gate | QA gate | PHANTOM JS unaffected (isolated) | fix + re-verify |
| 17 | locale missing key | pack added key in 1 locale only | translation fallback EN | `MatchingTranslations` gate | 7-locale key checklist | EN fallback | add keys |
| 18 | checkout/cart mismatch | `cart:updated` missed | stale badge | event contract | listen `cart:updated` on pack JS | re-fetch cart | reload |

---

## 14. AETHER → NOVA replacement scenario (final proof)

**Page today** (base `index.json`, `active_design_pack = aether`):

```
1. AETHER Hero            (aether-hero)
2. PHANTOM Featured Collection   (featured-collection)
3. AETHER Product Grid    (aether-featured-products)
4. PHANTOM Promo Section  (promo-grid)
5. AETHER Editorial       (aether-promo)
6. PHANTOM Newsletter     (newsletter)
```

**Replacement — `active_design_pack = nova`:**

| Layer | Changes | Untouched |
|---|---|---|
| Pack CSS/JS | `aether.css.liquid`/`aether.js.liquid` → `nova.css.liquid`/`nova.js.liquid` (generic loader, resolver row added) | resolver mechanism, theme.liquid, theme.js, theme.css.liquid, css-variables.liquid, ph-design-tokens.css |
| Default templates | base compositions re-pointed to `nova-*` sections (promotion procedure); `index.aether.json` + PHANTOM sections remain available | all PHANTOM templates + archives |
| Settings | `aether_*` token group dormant; `nova_*` group active | PHANTOM settings groups, `design_pack` group |
| Sections | `nova-hero`, `nova-*` replace `aether-*` in compositions; AETHER sections remain in editor library | all PHANTOM sections/snippets/blocks, `client-demo-*`, `main-*`, `apps`, groups |
| Commerce | identical — `product.price`, `form.product`, `cart:updated`, `{% form %}`, `@app` adapters reused by NOVA | PHANTOM Core, Shopify behavior, app blocks |
| Locales | `nova_*` keys (7 languages) | `aether_*`, `client_*`, PHANTOM keys |

**Conclusion:** PHANTOM Core (commerce engine, runtime, UI kit, chrome, groups, settings pipeline) remains byte-stable across the swap; only pack-owned files change. Coexistence, editor, checkout and apps are unaffected. ✓

---

## 15. Implementation boundary (Phase 17) & waves

This spec is **architecture only**. No AETHER sections are built here. Implementation order:

- **Wave 0 — Pack infrastructure (the "platform"):**
  1. Commit `frontend/frontend/` as frozen visual source of truth (+ `.gitignore` note) — decision from correction pass stands.
  2. Delete legacy stubs (`media-text.liquid`, `newsletter-section.liquid`, `phantom-dark-mode.js`, `effects.js`, `three-scenes.js`) — theme-check re-run.
  3. `snippets/design-pack-resolver.liquid` (registry + resolution rules §4).
  4. Settings: new "Design Packs" group (`active_design_pack`) + `aether_*` token group + locale label keys (7 locales + schema variants); migrate `ph_active_design` → resolver (legacy entries `demo`/`none`); settings_data defaults.
  5. `theme.liquid`: replace `client-` conditional with resolver-driven pack loading.
  6. AETHER skeleton: minimal valid `assets/aether.css.liquid` + `assets/aether.js.liquid` (tokens + no-op runtime) so `aether` is loadable; registry `status: active`.
  7. Template archives: `index.phantom.json` + `*.phantom.json` for every base template AETHER will replace (content = current PHANTOM compositions, verbatim).
  8. Docs: `docs/design-packs/registry.md`, `docs/design-packs/design-pack-contract.md`, `docs/design-packs/conversion-contract.md`, `docs/design-packs/failure-register.md` (materialized from this spec); `docs/aether/manifest.md` skeleton; mark v1 AETHER spec superseded.
  9. QA gate: theme-check 0 offenses; default path unchanged when `active_design_pack = aether` but skeleton CSS/JS present (no DOM mutation, no console errors); `demo` still renders (legacy proof); resolver fallback tests (invalid id, blank).
- **Wave 1 — AETHER sections (commerce core):** `aether-hero`, `aether-featured-products`, `aether-collection-grid`, `aether-product`, `aether-cart-items`, chrome (`aether-announcement-bar`, `aether-header`, `aether-footer`) into header/footer groups as alternates; base `product.json`/`collection.json` + AETHER `index.json`; locales; mapping.md; fidelity screenshots.
- **Wave 2 — AETHER content:** blog/article, page sections (hero/rich-text/faq/team/testimonials/contact/newsletter/promo), 404, search, legal pages.
- **Wave 3 — AETHER accounts & extras:** customers templates (login/register/account/addresses, classic Liquid), password, wishlist (localStorage), final QA + promotion docs.
- **Each wave = spec-deliverable check + its own plan + QA gate (§17).**

### Files: created / modified / untouched

**Created:** `snippets/design-pack-resolver.liquid`; `assets/aether.css.liquid`, `assets/aether.js.liquid` (skeletons, then per wave); `sections/aether-*.liquid` (waves); `templates/product.json`, `templates/collection.json`, `templates/*.aether.json`, `templates/*.phantom.json` (archives); `docs/design-packs/*`, `docs/aether/*`; `frontend/frontend/` committed (reference).

**Modified:** `layout/theme.liquid` (loader block only — additive); `config/settings_schema.json` (Design Packs + AETHER token groups); `config/settings_data.json` (defaults); `locales/*` (7 languages + schema variants: `design_pack_*`, `aether_*` keys); `templates/index.json` (+`blog/article/search/cart/404/page/password/list-collections` — AETHER compositions replacing bases, archives first); `sections/header-group.json`/`footer-group.json` (AETHER chrome alternates — Wave 1); `docs/2026-08-16-aether-section-library-design.md` (superseded banner); `.serena/memories/phantom-theme/project-state.md`.

**Untouched (regression-safe):** `assets/theme.css.liquid`, `assets/theme.js`, `assets/phantom-vendor.js`, `assets/lazy-load.min.js`, `ext-inview.js`, all `ui-*.js`, all `ph-*.js`, `snippets/css-variables.liquid`, `ph-design-tokens.css.liquid`, `ph-motion/loader/skeleton/transitions.*`, ALL PHANTOM sections/snippets/blocks (incl. `client-demo-*`), all existing suffixed templates, `templates/customers/*` (until Wave 3), `templates/gift_card.liquid`, `cart.ajax.liquid`, `layout/password.liquid`, `layout/gift_card.liquid`, `designs/` pipeline, `settings_data.json` presets (except additive defaults).

### Migration risks

1. **Two toggles during transition** (`ph_active_design` + `active_design_pack`) — mitigated: resolver owns both paths from Wave 0 step 4; `ph_active_design` setting removed from schema after migration; settings_data key ignored by Shopify.
2. **Base template replacement changes live store look** — mitigated: archives shipped in the same commit; promotion is explicit + reversible; editor always has PHANTOM sections.
3. **Locale drift** (7 languages × 2 file types) — mitigated: `MatchingTranslations` gate + `_scripts/add-locale-keys.ps1` reuse.
4. **Pack CSS bleed** — mitigated: audit gate (`audit-scope.mjs` adapted) + no-`:root` rule.
5. **Editor re-init loops** — mitigated: idempotent controllers + init flags (§3.5).
6. **`asset_url` on missing assets silently emits broken tags** — mitigated: registry `status` gate (§13 row 2).
7. **settings_data preset divergence** — non-default presets keep working via schema defaults + resolver fallback.

### Wave 1 starting task (exact)

> **T1: Implement `snippets/design-pack-resolver.liquid` + settings group "Design Packs" + migrate `theme.liquid` loader + `settings_data` default `active_design_pack: "aether"`; commit with QA (theme-check 0 offenses, demo legacy proof, fallback unit checks).**

(Then T2: AETHER skeleton assets; T3: template archives; T4: docs; T5: AETHER chrome sections into groups…)

---

## 16. Definition of Done (architecture)

1. `snippets/design-pack-resolver.liquid` exists; resolution rules (§4 table) all behave as specified (incl. invalid-id → aether, blank → aether).
2. `theme.liquid` contains **zero** pack-name conditionals — resolver only.
3. `active_design_pack` setting shipped (default `aether`); `ph_active_design` removed from schema; `demo`/`none` behave as legacy entries.
4. AETHER skeleton assets load on default path with no console errors and no DOM mutation (no-op JS).
5. Task 03 demo page (`page.demo.json`) still renders via legacy `demo` entry.
6. All PHANTOM sections/snippets/blocks/templates untouched (git diff proof) except explicit archive copies.
7. All 7 locales carry `design_pack_*` + `aether_*` keys; `MatchingTranslations` clean.
8. Scope audit gate green for any pack CSS (adapted `audit-scope.mjs`).
9. theme-check: 0 offenses (274+ files).
10. Spec reviewed by user; Wave 1 plan written; no AETHER sections implemented before user authorization.

---

## 17. Final report format (end of each phase)

```
ARCHITECTURE STATUS:    READY / NOT READY
AETHER:                 DESIGN PACK (first/default)
PHANTOM:                CORE (+ default design layer, untouched)
DEFAULT DESIGN:         aether
REPLACEMENT MODEL:      active_design_pack resolver + template promotion
COEXISTENCE:            PASS (verified §7/§14)
EXTERNAL FRONTEND CONVERSION: READY (contract §10)
NEXT TASK:              Wave 0 T1 — resolver + settings + loader migration
```