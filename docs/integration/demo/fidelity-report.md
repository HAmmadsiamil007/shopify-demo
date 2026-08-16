# Demo design — Visual Fidelity Report (QA-07)

- Design: `designs/demo` (Aurora Studio) — frozen source `designs/demo/source/index.html`
- Date: 2026-08-16
- Method: source reference captured at 1440/1200/992/768/576/390 px
  (`docs/integration/demo/screenshots/`). Live storefront render requires a
  connected Shopify store (no auth in this environment) — recorded as manual
  editor QA for the demo page: assign `page.demo` template, set
  `ph_active_design = demo`, compare against the reference screenshots.

| Dimension | Source (reference) | Shopify render (manual QA) | Status |
|---|---|---|---|
| HTML structure | hero → collection (3-col) → footer | page.demo = hero/collection/footer | pending live store |
| Typography | serif headings, muted body | `--ph-color*` tokens + design CSS | pending live store |
| Spacing | 96/72/80 px section rhythm, 16px gutters | design CSS `.ph-client__*` | pending live store |
| Container widths | Bootstrap `.container` | scoped containers module | pending live store |
| Grid | 1/2/3 cols @ 576/768 | `.row.g-4` + `.col-12.col-sm-6.col-md-4` | pending live store |
| Colors | warm palette | token bridge (`--ph-color*` → `--demo-*`) | pending live store |
| Borders/Shadows | 12px radius, hover lift | design CSS | pending live store |
| Responsive | reflow at all widths | scoped Bootstrap grid | pending live store |
| Hover | card lift + link accent | design CSS | pending live store |
| Animation | scroll reveal, reduced-motion off | `client-demo.js` IO reveal + CSS guard | pending live store |

## Automated checks performed in this environment (no store)

| Check | Result |
|---|---|
| theme-check (274 files) | 0 offenses |
| build check (`node build.mjs --slug demo --check`) | OK — 9.2 KB (< 60 KB) |
| CSS contract audit (`:root` / `^body` / `!important` / z-index ≥ 5 digits) | all clean |
| Scroll-reveal rules in shipped CSS | `html.js .ph-client--demo .ph-client__reveal(.is-visible)` present |
| Dynamic-data fields in collection section | title, url, featured_image, price, compare_at_price, available — all present |
| Default-path regression (git diff) | `templates/index.json`, `theme.css.liquid`, `theme.js` untouched; only conditional wiring in layout/import-map/config/locales |
| Locale key completeness (en/de/es/fr/it/pt-BR/pt-PT) | all schema keys present |

Live-store render QA is the remaining manual gate (documented above).
