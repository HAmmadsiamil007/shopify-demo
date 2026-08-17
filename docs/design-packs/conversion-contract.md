# External Frontend → Design Pack Conversion Contract — PHANTOM Core

> Binding contract for converting an approved external frontend into a Design Pack. Materialized in Wave 0 T4 from spec §§9–12 of `docs/superpowers/specs/2026-08-16-phantom-design-pack-architecture.md`. Related: `docs/design-packs/registry.md`, `docs/design-packs/design-pack-contract.md`.

## 1. Conversion pipeline

```
CLIENT → "premium fashion store" → external frontend (HTML/Bootstrap/vendor CSS/
theme CSS/GSAP/Three/Lenis/Swiper/animations) → client approves → 🔒 DESIGN FREEZE
→ component manifest (frontend/frontend + data-phantom-* vocabulary) →
static/dynamic classification → map component → section/block/snippet/template/
adapter → preserve DOM/design intent → replace static data with Liquid →
add {% schema %} → scope CSS (pack namespace, audit gate) → scope JS (pack
runtime, event bus) → lifecycle handling → Theme Editor test → commerce test →
visual regression (screenshots vs frozen source) → promote to default
```

## 2. DESIGN FREEZE (mandatory gate — spec §10 amendment 4)

- After client approval and **before any conversion work**, the approved visual design is frozen.
- The frozen artifact is the external frontend itself (committed reference copy — `frontend/frontend/`, commit decision in Wave 0) + the component manifest.
- **After freeze, conversion must preserve the approved visual design** — hierarchy, layout, spacing, typography, imagery, component structure, responsive behavior, interaction, animation intent. The converter is forbidden from "improving"/redesigning during Liquid conversion.
- Changes after freeze require a new client approval + a freeze revision; the revision is documented in the pack's `mapping.md`.
- Rationale: prevents the classic failure "the Shopify version doesn't look like the approved frontend".

## 3. Data contract (spec §9)

Components are classified **static** (fixed content, no storefront data) vs **dynamic** (require Shopify data). Dynamic components are anchored via a `data-phantom-*` vocabulary in the frozen frontend markup; the conversion maps each anchor to a Liquid data source:

| `data-phantom-*` anchor | Shopify Liquid source |
|---|---|
| `data-phantom-product` | `product` / `product.price` (adapter) |
| `data-phantom-product-grid` | `collection.products` via `product-grid-item` (adapter) |
| `data-phantom-price` | `product.price` / `product.selected_or_first_available_variant` |
| `data-phantom-image` | `ui-image` (adapter — lazy `loading="lazy"`, `is-land`) |
| `data-phantom-form` | `{% form 'product' %}` via `form.product` (adapter) |
| `data-phantom-pagination` | `pagination` (adapter) |
| `data-phantom-cart` | `cart` / `cart:updated` event |
| `data-phantom-section-content` | section `{% schema %}` settings (merchant-editable) |

- Reuse PHANTOM **adapters** freely (`product.price`, `ui-image`, `product-grid-item`, `pagination`, `form.product`, `@app` blocks) — reuse of logic, never of unscoped styles (§7).
- Replace static data with Liquid; add `{% schema %}` so every component is editor-configurable.
- Conversion evidence per pack: `docs/{pack}/manifest.md` (component registry) + `mapping.md` (design → data anchors, `data-phantom-*` → Liquid) + `fidelity-report.md` (screenshot comparison).

## 4. Performance strategy (spec §11)

- Pack CSS/JS load **only when the active pack is `active`** (conditional tags in theme.liquid — proven Task 03 pattern).
- Pack JS is a **no-op** on pages without pack sections (early exit).
- v1 budgets: `aether.css.liquid` ≤ 60 KB, `aether.js.liquid` ≤ 40 KB (hand-curated; the 717 KB static `theme.css.liquid` is not duplicated).
- Lazy loading: is-land (`lazy-load.min.js`) + `loading="lazy"` via `ui-image`; section-aware JS (only present sections initialize).
- No design-time CDN libs in production unless required by the approved design (per-section opt-in, documented in manifest; `vendor-{pack}` slot reserved in the `theme-import-map` pattern).
- All pack assets `defer`/preload-eligible; no render-blocking inline scripts beyond the resolver-driven tags.

## 5. Accessibility strategy (spec §12)

- WCAG 2.1 AA baseline: semantics (header/nav/main/section/article), keyboard + focus management, visible focus rings, skip-link reuse, ARIA for sliders/accordions/modals/drawers, accessible forms (labels, errors), contrast via token pairs.
- Motion: `prefers-reduced-motion` + `data-disable-animations` + PHANTOM `disable_animations` respected; content never hidden behind animations; commerce never gated on animation.
- Pack sections reuse PHANTOM `a11y.css` primitives (skip-link, focus-visible, reduced-motion, forced-colors) — global infra, not pack-owned.

## 6. Handoff checklist (used at promotion)

- [ ] DESIGN FREEZE recorded (freeze revision + date in `mapping.md`)
- [ ] `docs/{pack}/manifest.md` — every component registered (section type, static/dynamic, dependencies)
- [ ] `docs/{pack}/mapping.md` — every `data-phantom-*` anchor → Liquid source; freeze revisions
- [ ] `docs/{pack}/fidelity-report.md` — screenshot comparison vs frozen source (1440/992/768/390)
- [ ] Pack CSS scope audit gate green; z-index budget respected; zero `:root` rules
- [ ] Pack JS: no-op without pack sections; event-bus only; idempotent controllers
- [ ] theme-check 0 offenses; `check-registry.mjs` PASS; `MatchingTranslations` clean
- [ ] Promotion per `docs/design-packs/template-promotion-contract.md`