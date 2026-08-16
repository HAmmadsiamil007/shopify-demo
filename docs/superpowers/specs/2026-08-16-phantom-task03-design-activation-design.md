# PHANTOM — Task 03: Design Activation Walkthrough (Design)

- **Date:** 2026-08-16
- **Predecessor:** Task 01 blueprint (`docs/superpowers/specs/2026-08-16-phantom-external-integration-blueprint.md`) + Task 02 hardening/scaffold (theme-check clean: 269 files, 0 offenses).
- **Goal:** Prove the blueprint's activation pipeline end-to-end with a fictional `demo` design — frozen external source → scoped build → client sections → ClientDesign JS → config toggle → QA. **Zero visual change on the default theme.**

---

## 1. Decisions (approved)

| Question | Decision |
|---|---|
| Task 03 scope | Full end-to-end demo activation (lean scope) |
| Demo source | Fictional design we author (Bootstrap 5.3, per blueprint §6) |
| Activation mechanism | Theme-settings toggle (`ph_active_design`: `none` / `demo`) — blueprint §4.3 dev model |
| Components | Hero + featured-collection + footer (3 client sections) |
| Composition | Dedicated demo template `templates/page.demo.json`; `index.json` untouched |
| Execution | Full chain in order: source → build → sections → JS → import map → toggle → QA |

## 2. Scope root (blueprint §6.2, binding)

When `ph_active_design = 'demo'`, `layout/theme.liquid` renders:

```html
<body class="ph-client ph-client--demo" data-ph-design="demo">
```

- Client CSS selectors always start with `.ph-client` (never `:root`, `body`, or bare elements — contract `designs/contracts/css-namespace-contract.md`).
- z-index budget inside scope: sticky 5000 / drawer 9000 / modal 9050 / toast 9500 / 3D 9700; cap 10000; no `!important` (contract §1.4).
- Client breakpoints 576/768/992/1200/1400 inside `.ph-client` only; PHANTOM scale untouched (contract §1.5).
- Cascade: PHANTOM global first, `client-demo.css.liquid` last (blueprint §6.6).

## 3. Deliverables — new files

| File | Purpose |
|---|---|
| `designs/demo/source/index.html` | Frozen external design: hero + featured-collection grid + footer. Bootstrap 5.3 (scoped build), inline SVG logo, CSS-gradient placeholder imagery (no binaries). |
| `designs/demo/manifest.md` | Filled: 3 sections ↔ client components, CSS scope hooks, JS controllers, z-index audit. |
| `designs/demo/mapping.md` | Filled: design anchors ↔ Shopify data (`section.settings.*`, `collection.products`, `shop.name`, menus). |
| `designs/demo/production/scss/client.scss` | Scoped Bootstrap modules only (grid, buttons, utilities subset) + `--demo-*` token bridge to `--ph-color*` + z-budget vars. `{slug}` placeholders. |
| `designs/demo/production/client-demo.css` | Build output (pipeline-generated). |
| `designs/demo/js/client-design.js` | ClientDesign shell for demo → copied to `assets/client-demo.js`. |
| `assets/client-demo.js` | ES module: `init/destroy/refresh`; IntersectionObserver scroll-reveal (no vendor libs — `vendor-{slug}` slot documented but unused); section registry; AbortController listeners; `shopify:section:load/unload/select/deselect` + `phantom:ready` + `cart:updated`. |
| `assets/client-demo.css.liquid` | Built CSS copied from `designs/demo/production/client-demo.css`. |
| `sections/client-demo-hero.liquid` | Hero: schema (image, title, subtitle, CTA URL/text) + preset. `{% stylesheet %}` for scope-local styles, `.ph-client--demo` hooks. |
| `sections/client-demo-collection.liquid` | Featured collection grid: schema (collection picker, limit, badges toggle) + preset. Reuses PHANTOM price/badge snippets for commerce data; client-owned grid markup (blueprint §9). |
| `sections/client-demo-footer.liquid` | Footer: schema (menu picker, text) + preset. |
| `templates/page.demo.json` | Composition of the 3 client sections. |

## 4. Deliverables — modified files

| File | Change |
|---|---|
| `config/settings_schema.json` | New `ph_designs` group: `ph_active_design` select (`none` default / `demo`). |
| `layout/theme.liquid` | Conditional scope root on `<body>`; conditional load of `client-demo.css.liquid` (stylesheet link), import-map registration, deferred module script — only when active. |
| `snippets/theme-import-map.liquid` | Register `client-demo` module (ui-* precedent). |
| `locales/en.default.json` (+ `en.default.schema.json`) | Keys: `ph_designs` group label, `ph_active_design` label/options, section names/settings labels for the 3 client sections. |
| `designs/README.md` | Activation instructions updated to reflect the demo walkthrough. |

## 5. Activation flow

- `ph_active_design = none` (default): theme renders byte-identical to today. No scope root, no client assets, `page.demo` renders its sections unstyled (documented behavior: template is inert until design active).
- `ph_active_design = demo`: scope root + `data-ph-design`; `client-demo.css.liquid` + `client-demo.js` load; `page.demo` renders the styled client sections.

## 6. QA gate (definition of done for Task 03)

1. `shopify theme check --path …` → 0 offenses (≈272 files).
2. `node designs/build/build.mjs --slug demo --check` passes; `client-demo.css` < 60 KB.
3. Git diff audit: default path (toggle off) shows no functional/visual change — `index.json` untouched, global CSS/JS untouched.
4. Render check: `page.demo` with toggle off = default theme look; with toggle on = styled demo sections (structure verified via rendered HTML: scope classes present, Liquid data injected).
5. Client CSS grep audit: no `:root`, no bare `body`/element selectors, no z-index > 10000, no `!important`.
6. Lifecycle check: registry/AbortController pattern present; `destroy()` on `shopify:section:unload`.

## 7. Housekeeping

1. Commit pending Task 02 work first: hardening (version sync, dead-code removal, bug fixes, disable comments, orphan deletions) + `designs/` scaffold + Task 01 blueprint — to origin `shopify-demo` (branch `main`). Old `shopify-phantom-` repo stays frozen.
2. Delete stray test artifact `designs/true/` (slug-"true" build leftover).
3. Then commit Task 03 deliverables.

## 8. Out of scope (deliberate)

- Real client design (Phase 12 of blueprint).
- Rich Theme Editor settings (spacing/alignment/animation choice) — lean scope per approval.
- Vendor libs (GSAP/Swiper/Lenis/Three) in the demo — the `vendor-{slug}` slot and lifecycle hooks are documented and ready.
- App blocks (`@app`) in client sections — blueprint Phase 8, later.