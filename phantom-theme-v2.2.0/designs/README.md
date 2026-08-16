# PHANTOM Client Designs

Integration scaffold ratified by Task 01 (blueprint: `docs/superpowers/specs/2026-08-16-phantom-external-integration-blueprint.md`).

**Architecture:** PHANTOM is the commerce/theme engine. The external frontend is the design source of truth. Liquid is the adapter — it replaces data, never design.

**Zero visual change:** nothing in `designs/` is loaded by the default theme. Activation is explicit and per-design.

## Directory layout

```text
designs/
├── README.md                  ← this file
├── contracts/                 ← binding integration contracts (CSS namespace, JS lifecycle)
│   ├── css-namespace-contract.md
│   └── js-lifecycle-contract.md
├── build/                     ← build pipeline (scoped Bootstrap compile + purge)
│   ├── package.json
│   ├── build.mjs
│   └── scss/client.scss       ← production CSS entry (module list + tokens)
└── _template/                 ← copy to designs/{slug}/ to start a new design
    ├── source/                ← frozen external design (HTML/CSS/JS snapshot)
    ├── production/            ← built output (client-{slug}.css) — theme only references this
    ├── js/client-design.js    ← ClientDesign lifecycle shell (copy to assets/client-{slug}.js)
    ├── manifest.md            ← component manifest (section ↔ client component map)
    └── mapping.md             ← design → Shopify data mapping
```

## Activating a design (Task 03)

1. `cp -r designs/_template designs/{slug}`
2. Put the frozen external design in `designs/{slug}/source/`.
3. Fill `manifest.md` + `mapping.md`; every component must resolve to an existing PHANTOM section/block/snippet.
4. Adapt `build/scss/client.scss` (module list + tokens) into `production/scss/client.scss`.
5. `cd designs/build && npm ci && node build.mjs --slug {slug}` → `production/client-{slug}.css`.
6. Copy `js/client-design.js` → `assets/client-{slug}.js`, fill `{slug}` + LIBRARIES, register in `snippets/theme-import-map.liquid` (ui-* precedent).
7. Wrap the active layout in `.ph-client ph-client--{slug}` scope root; ship `assets/client-{slug}.css.liquid`.

## Rules that cannot be bent

- Client CSS never escapes `.ph-client` (no `:root`, `body`, bare elements).
- z-index cap 10000; budget in contract §1.4.
- Bootstrap is design-time only; production is scoped + purged.
- Client JS: init/destroy/refresh, per-section GSAP contexts, single Lenis, Swiper registry, lazy 3D.
- Never re-bundle AOS/Flickity/PhotoSwiper (in `phantom-vendor.js`).
- `designs/` holds no design secrets or store data — only structure, contracts, and build tooling.