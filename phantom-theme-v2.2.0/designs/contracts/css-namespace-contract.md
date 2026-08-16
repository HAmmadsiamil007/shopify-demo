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

| Rule | Applies to |
|---|---|
| All client CSS selectors prefixed with `.ph-client` (or nested under it in source) | CSS |
| Never write `:root`, `body`, `html`, or bare element selectors | CSS |
| Never set `!important` outside component-specific state overrides | CSS |
| Never exceed z-index 10000 (PHANTOM ceiling is 10001) | CSS |
| Raw Bootstrap classes never appear unscoped in the theme | CSS/build |
| Never re-bundle AOS, Flickity, PhotoSwipe (already in `phantom-vendor.js`) | build |
| All JS hooks use `data-ph-*` attributes inside the scope | JS |
| Client JS never attaches global listeners without cleanup | JS |

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

1. Sass-compile **only the Bootstrap modules used** by the design (module list in `designs/build/scss/client.scss`).
2. **Namespace every selector** under `.ph-client` (compile with the scope wrapper).
3. **Purge** unused CSS against `source/**/*.html` (PurgeCSS).
4. Minify + output to `production/client-{slug}.css`, which becomes `assets/client-{slug}.css.liquid`.

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
- On activation: copy to `assets/client-{slug}.js` and register in `snippets/theme-import-map.liquid` (matches the existing `ui-*` ES-module precedent).
- One global registry entry: `window.ClientDesign`.

---

## 3. Build Contract

- Build pipeline: `designs/build/` (`npm ci` once; `node build.mjs --slug {slug}` per design).
- Outputs: `designs/{slug}/production/client-{slug}.css` (+ optional `vendor-{slug}.js` bundle).
- The theme only ever references built production files; never raw Bootstrap.
- CI-friendly: `node build.mjs --slug {slug} --check` exits non-zero on un-purgeable size growth > 10%.