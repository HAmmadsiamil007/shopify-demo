# PHANTOM Client-Design Integration Contracts

Ratified by Task 01 (2026-08-16, `docs/superpowers/specs/2026-08-16-phantom-external-integration-blueprint.md`).
These contracts are binding for every client design integrated into PHANTOM. Zero visual change to the default theme.

---

## 1. CSS Namespace Contract

### 1.1 Scope root (mandatory)

Every client design renders inside exactly one scope root:

```html
<div class="ph-client ph-client--{slug}" data-ph-design="{slug}">
```

- `{slug}` is the lowercase-kebab design slug (e.g. `phone-premium`).
- The scope root is added in `layout/theme.liquid` (or per-template) **only when the design is active**.
- The default PHANTOM theme renders without the scope root and is untouched.

### 1.2 Authoring rules (hard rules, linted)

**Two layers, two rule sets.** The frozen design source and the production client CSS are different artifacts with different rules:

| Layer | File | May use | Must not use |
|---|---|---|---|
| **Design source** (design-time) | `designs/{slug}/source/*.html` | `:root`, `body`, bare element selectors, any CSS the designer wants | nothing — it is a static mockup, never shipped |
| **Production client CSS** (shipped) | `assets/client-{slug}.css.liquid` | `.ph-client--{slug}` selectors, `html.js .ph-client--{slug}` reveal guards, scoped `@media` | `:root`, `body`, `html`, bare element selectors, unscoped Bootstrap classes, `!important` outside component state, z-index > 10000 |

The build pipeline (contract §1.7) is the transformation between the two: it must **remove or scope every
design-time global** so the shipped artifact contains no global selectors. `designs/build/audit-scope.mjs`
enforces this automatically on every build (`node build.mjs --slug {slug}` fails on unscoped selectors).

### 1.3 Token bridge

- Client design tokens are declared at the scope root: `.ph-client { --slug-*: ...; }` — never on `:root`.
- When a client token semantically equals a PHANTOM token, reference it:
  `--slug-bg: var(--ph-colorBody);` (single source of truth).
- When the design diverges, override locally inside the scope. No global mutation.
- Do not expose raw PHANTOM tokens to clients; expose only the documented bridge table.

PHANTOM token family (verified): `--ph-colorBody`, `--ph-colorBodyText` (as `--ph-colorTextBody`), `--ph-colorBtnPrimary`, `--ph-colorBtnPrimaryText`, `--ph-colorNav`, `--ph-colorNavText`, `--ph-colorDrawer*`, `--ph-colorModalBg`, `--ph-colorHeroText`, `--ph-colorPrice`, `--ph-colorSaleTag*`, `--ph-colorFooter*`, `--ph-colorLink`, `--ph-colorBorder`, `--ph-colorCartDot`, `--ph-colorGridOverlay*`, `--ph-colorImageOverlay*`, `--ph-colorSmallImageBg`, `--ph-colorLargeImageBg`, `--ph-colorTextSavings`, `--ph-colorAnnouncement*`, plus typography tokens `--typeBase*`, `--typeHeader*`.

### 1.4 z-index budget (mandatory, cap 10000)

```text
sticky nav       5000
drawer           9000
modal            9050
toast            9500
3D overlay       9700
```

No client value may exceed 10000 (PHANTOM's own stack ends at 10001).

### 1.5 Breakpoints

Client designs keep their own scale **inside the scope only** (Bootstrap design-time: 576/768/992/1200/1400).
PHANTOM's own scale (769/959/1050/1140) is untouched and never reused by client sections.
Because the scope owns its responsive behavior, the two scales never interact. Record the mapping in the design's `mapping.md`.

### 1.6 Cascade priority (documented)

```text
1. PHANTOM global (theme.css.liquid, ph-*.css.liquid)
2. client-{slug}.css.liquid  (loaded last; wins inside scope via .ph-client--{slug} specificity)
```

### 1.7 Production Bootstrap (Option D)

Bootstrap is a design-time tool only. Production ships `client-{slug}.css` built by `designs/build/build.mjs`:

1. Sass-compile **only the Bootstrap modules used** by the design (module list in `designs/build/scss/client.scss`), nested inside the scope wrapper.
2. **Scope-audit every emitted selector** (`designs/build/audit-scope.mjs`): each selector must reference `.ph-client--{slug}`; `@media`/`@supports` bodies are recursed, `@keyframes` bodies skipped. Build fails on any unscoped selector.
3. **Strip dead rules** the wrapper cannot express (Bootstrap's `:root { --bs-* }` nested under the scope can never match and is removed).
4. **Purge** unused CSS against `source/**/*.html` (PurgeCSS).
5. Output to `production/client-{slug}.css`, which becomes `assets/client-{slug}.css.liquid`.

The nested-`@import` strategy is **proven for the Task 03 demo subset only** (containers/grid/buttons/utilities).
A design that needs more of Bootstrap (modals, offcanvas, carousels, forms) must either (a) verify the
audit still passes and extend `audit-scope.mjs` if the emitted selectors escape the wrapper, or (b) switch
to the compile-then-scope postprocessor pattern (compile Bootstrap unscoped, then prefix every selector —
documented evolution for Task 04+; not required for v1).

### 1.8 Default-path regression definition

"Default theme renders exactly as today" is defined as **no regression** — not byte-identical HTML:

- No visual change, no functional change, no asset-loading change, no CSS/JS change, no performance change
  when the design toggle is `none` or the design files are absent.
- `layout/theme.liquid` / `snippets/theme-import-map.liquid` diffs must be additive-only or conditional-only.
- `templates/index.json` and all global CSS/JS assets must be untouched by client-design work.
- Byte-level HTML differences (whitespace, settings defaults) are acceptable and expected.

---

## 2. JavaScript Lifecycle Contract

### 2.1 Public API (mandatory shape)

Every client design ships one ES module exposing:

```js
class ClientDesign {
  init()     // idempotent boot
  destroy()  // full teardown (GSAP contexts, Swiper, Lenis, observers, 3D renderer)
  refresh()  // re-scan injected/replaced DOM after Shopify section events
}
```

### 2.2 Event contract (verified gaps being closed)

| Event | Required handling |
|---|---|
| `phantom:ready` | Initial boot when design is active |
| `DOMContentLoaded` | Never used as sole boot trigger |
| `shopify:section:load` | `refresh()` the new section only |
| `shopify:section:unload` | Per-section `destroy()` (Swiper/GSAP/observers/listeners) |
| `shopify:section:select` | Pause heavy animation in editor |
| `shopify:section:deselect` | Resume animation |
| `shopify:theme:changed` / editor re-render | Full `destroy()` → `init()` |
| `cart:updated` | Badge/count updates via PHANTOM's existing event |

### 2.3 Library ownership

| Library | Policy |
|---|---|
| GSAP + ScrollTrigger | One `gsap.context()` per section; auto-cleanup on unload |
| Lenis | **Single instance per design**; owned by ClientDesign; paused in editor |
| Swiper | Instance registry keyed by section id; destroyed on unload; never double-created |
| Three.js | Lazy-loaded per section; WebGL detected first; renderer + RAF loop owned and disposed by the section module; never a commerce dependency |
| AOS / Flickity / PhotoSwipe | Already global in `phantom-vendor.js` — do not re-bundle |

### 2.4 Module placement

- Template shell: `designs/_template/js/client-design.js`.
- On activation: copy to `assets/client-{slug}.js` and load directly from `layout/theme.liquid`:
  `<script type="module" src="{{ 'client-' | append: slug | append: '.js' | asset_url }}">`.
- **Import-map registration is NOT required** for a standalone module that imports nothing (Task 03 demo).
  Add a `client-{slug}` entry to `snippets/theme-import-map.liquid` only when the module (or a Task 04+
  AETHER section module) actually imports a shared `ui-*`/`theme-*` module through the map.
- One global registry entry: `window.ClientDesign`.

---

## 3. Build Contract

- Build pipeline: `designs/build/` (`npm ci` once; `node build.mjs --slug {slug}` per design).
- Outputs: `designs/{slug}/production/client-{slug}.css` (+ optional `vendor-{slug}.js` bundle).
- The theme only ever references built production files; never raw Bootstrap.
- CI-friendly: `node build.mjs --slug {slug} --check` exits non-zero on un-purgeable size growth > 10%.