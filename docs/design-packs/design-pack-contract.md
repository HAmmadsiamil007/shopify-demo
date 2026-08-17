# Design Pack Contract — PHANTOM Core

> Binding contract for what a Design Pack is, provides, and must NOT do. Materialized in Wave 0 T4 from spec §3 of `docs/superpowers/specs/2026-08-16-phantom-design-pack-architecture.md`. Related: `docs/design-packs/registry.md`, `docs/design-packs/conversion-contract.md`, `docs/design-packs/failure-register.md`.

A Design Pack is a **self-contained visual frontend system shipped inside the theme**, identified by a unique `pack_id`. Packs are conventions + a registry + a loader — not a runtime plugin system (Shopify has no native pack mechanism; the architecture does not emulate one).

## 1. Pack anatomy

| Field | Meaning | Liquid implementation |
|---|---|---|
| `pack_id` | unique slug, lowercase `[a-z0-9-]` | `design-pack-resolver.liquid` list |
| `display_name` | merchant-facing label | locale key `t:settings_schema.design_pack.packs.<id>` |
| `asset_base` | file base for `{asset_base}.css.liquid` / `{asset_base}.js.liquid` | resolver `dp_assets` list |
| `version` | pack version | resolver constant + `docs/{pack}/manifest.md` |
| `status` | `draft` / `active` | resolver: only `active` packs emit assets (guards missing assets) |
| `section_prefix` | `{pack}-` on section files, types, classes | convention (§3.4) |
| `settings_namespace` | `{pack}_` on settings ids + locale keys | convention (§6) |
| `locale_namespace` | `{pack}_*` keys, all 7 locales | convention (§6) |
| `default_templates` | base + suffixed template compositions the pack ships | convention (§8) |
| `default` | is this pack the shipped default? | `active_design_pack` schema `default: "aether"` |

The resolver implements `pack_id` / `asset_base` / `status` / `version` as parallel lists in one snippet — the **single registration point**. Everything else is enforced by convention and documented per pack in `docs/{pack}/manifest.md` + `docs/design-packs/registry.md`.

## 2. What a pack provides

- `sections/{pack}-*.liquid` — real OS 2.0 sections: own markup, `{% schema %}`, presets, settings, `data-section-type="{pack}-*"`, root class `ph-client ph-client--{pack} {pack}-{component}`.
- `assets/{pack}.css.liquid` — hand-curated, fully scoped; tokens on `.ph-client--{pack}` root; no Bootstrap/GSAP/Swiper runtime dependency (design-time only).
- `assets/{pack}.js.liquid` — vanilla, idempotent, no-op without sections; controllers with `init()/destroy()/refresh()`; integrates with the PHANTOM event bus.
- Settings group in `settings_schema.json` + defaults in `settings_data.json`.
- Locale keys `{pack}_*` in all 7 locales (+ `.schema.json` label keys).
- Template compositions (base + `*.{pack}.json` alternates) + `docs/{pack}/manifest.md`, `mapping.md`, `fidelity-report.md`.

## 3. What a pack must NOT do

- Never modify `theme.liquid` core blocks, `theme.js`, `theme.css.liquid`, `css-variables.liquid`, PHANTOM sections/snippets/blocks, or other packs' files.
- Never define `:root` / `body` / `html` / bare-element selectors globally; never use `!important` except approved state overrides (documented per occurrence); never exceed the z-index budget.
- Never assume its own header/footer/page wrapper exists; never require pack-specific global DOM.
- Never load GSAP / Three.js / Lenis / Swiper unless the approved design genuinely requires them (per-section opt-in, documented).

## 4. CSS isolation contract

```
.ph-client                  — pack container root (established by Task 03)
.ph-client--{pack}          — pack variant (aether, nova, …); token scope
.{pack}-{component}         — e.g. .aether-hero, .aether-product-grid
--{pack}-{token}            — e.g. --aether-accent (defined on .ph-client--{pack} only)
```

- **Selectors:** every rule must reference `.ph-client--{pack}` or a `.{pack}-*` class; `@media` / `@supports` recursed; `@keyframes` names prefixed `{pack}-`.
- **Specificity:** default ≤ 2 class levels; no IDs; no element selectors outside pack components.
- **z-index:** reuse the `--ph-z-*` budget (5000 / 9000 / 9050 / 9500 / 9700, cap 10000).
- **Harmonization adapter:** per-section `harmonize` checkbox maps semantic pack tokens to PHANTOM tokens on the section root, e.g. `--aether-accent: var(--ph-colorBtnPrimary)` — proven Task 03 pattern. Explicit adapter, no leakage: pack tokens are read by pack CSS only.
- **Enforcement:** `designs/build/audit-scope.mjs` scoping audit adapted into a pack-CSS gate (`--check` runs selector audit for `{pack}` prefix).

## 5. JS lifecycle contract

- Pack JS loads `defer` (theme.liquid generic loader); **executes no work** unless ≥1 `[data-section-type^="{pack}-"]` exists.
- Subscribes to the **existing** PHANTOM event bus: `shopify:section:load/unload/select/deselect`, `shopify:block:select/deselect`, `cart:updated`, `phantom:ready` — never re-implements it (invariant 12).
- Controller registry per pack: `{Pack}Runtime.controllers = { 'aether-hero': { init(el, opts), destroy(el), refresh(el) } }`; boot scan + event-driven mount/unmount; duplicate guards (init flag on element); cleanup on unload (listeners, observers, intervals, swipers).
- Respects `prefers-reduced-motion` and `data-disable-animations` (+ PHANTOM `disable_animations` setting) everywhere; animations never gate commerce.

## 6. Settings & tokens strategy

- New group "Design Packs": `active_design_pack` + explanatory paragraph (default ≠ lock).
- **Per-pack token group** (e.g. "AETHER — Design Pack"), ids `{pack}_*`. Pack-owned settings are NOT a universal schema (spec §6 amendment 5): AETHER's controls do not imply NOVA ships the same; the runtime never assumes a pack's settings shape; each pack's CSS reads only its own `{{ settings.{pack}_* }}` keys — heterogeneous pack settings cannot leak or collide.
- **Brand-level only:** colors/fonts/radius/motion/dark-light. Spacing scales, timing curves, elevation, shadows = fixed art-direction tokens in CSS (settings must not destroy art direction).
- Locale keys `design_pack_*` + `{pack}_*` in **all 7 locales** (+ `.schema.json` label keys); theme-check `MatchingTranslations` is a QA gate.