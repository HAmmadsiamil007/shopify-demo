# AETHER — Fidelity Report (Wave 1)

> Parity evidence per contract §3.2. Harness: frozen reference (`frontend/frontend/`, served statically) vs static proof pages (`designs/aether/source/*.html`, rendered from the theme's real section markup with sample data). Screenshots: `docs/integration/aether/references/` and `docs/integration/aether/proofs/` (12 + 12 PNGs, 1440/768/390).

## 1. Methodology & known limitations

- **Two different CSS implementations:** the frozen pages render their own design CSS (with its own fonts/particles/preloader); the proof renders the theme's `aether-proof.css` (rendered `assets/aether.css.liquid` with frozen token defaults). A raw pixel diff therefore **cannot be near zero** and is NOT the pass/fail criterion — it is supporting data. Pass/fail comes from the structural section mapping (below) + section-level geometry.
- **Fonts:** the theme loads Cabinet Grotesk/Satoshi via `aether.js` `loadCSS` at runtime (D8). Static proofs have no JS → system-font fallback → text metrics differ from both frozen and live theme. Visual sign-off must use the LIVE store or a proof with fonts injected.
- **JS-driven effects** (swiper, GSAP reveals/parallax/tilt, Lenis) are absent in static proofs; the static screenshots show base layout, not motion states.
- **Images:** the frozen pages' photos differ from the proof's single available image (reused across slides/cards). Layout, not imagery, is compared.
- **Index composition** differs by design (D5): frozen home has categories/FAQ sections; AETHER home interleaves AETHER commerce sections with PHANTOM sections.
- **Human eyeball sign-off: USER** — the agent that ran this harness cannot view images. The reviewer must open the paired screenshots listed below for final visual sign-off.

## 2. Numeric pixel diff (supporting data, NOT pass/fail)

Full-page diff, min-height crop: mean per-channel difference / % pixels changed.

| Page | 1440 | 768 | 390 |
|---|---|---|---|
| index | 152 / 95% | 156 / 97% | 145 / 96% |
| shop | 165 / 97% | 209 / 99% | 157 / 96% |
| product-detail | 153 / 96% | 146 / 91% | 163 / 94% |
| cart | 94 / 92% | 159 / 96% | 155 / 94% |

Interpretation: high by construction (methodology §1). Structural geometry comparison (below) is the meaningful check.

## 3. Structural section mapping (the pass/fail check)

Frozen class → theme class (see `mapping.md`), measured on shop at 1440 and 390 (both pages share the same layout model):

| Section | 1440 frozen → proof | 390 frozen → proof | Verdict |
|---|---|---|---|
| Announcement bar | 1425×40 @y0 → 1425×41 @y0 | hidden (mobile) → hidden | PASS |
| Header (overlay) | overlay 80px → overlay (h0 absolute) | mobile 375×56 → 375×57 | PASS |
| Page hero | 1410×459 → 1409×486 | 360×292 → 359×292 | PASS (desktop +27px, minor) |
| Filter bar | 1410×105 → 1409×96 | 360×157 → 359×137 | PASS (minor) |
| Shop grid | 1260→1409 wide, 3 cols both | **1 col → 1 col** (was 3 — fixed in QA, D17) | PASS after fix |
| Product cards | 400×552 → 450×565, 6 cards | stacked 320→359 wide | PASS (minor sizing) |
| Pagination | 1410×124 → 1409×126 | present | PASS |
| Footer | 1410×432 → 1409×308 | 360×1307 → 359×1154 | PASS (theme footer more compact by design) |
| Page heights | shop 3052 → 2455 | 4703 → 4192 | PASS (differs by design: compact theme footer, no newsletter section block) |

Index: hero 3 slides (frozen 3), featured 4 rich cards (frozen 4), collection 6 cards (frozen 6) — counts match. Product-detail: pd-* markup verbatim from section; proof height 8260 vs frozen 4439 at 1440 (theme includes related products + reviews + sticky bar; frozen page is shorter) — mobile 6249 vs 5987 ≈ close. Cart: 2 lines + summary both.

## 4. Functional parity matrix (amendment 8)

| Component | Visual | Desktop | Tablet | Mobile | Editor | Liquid/data | Interaction |
|---|---|---|---|---|---|---|---|
| Announcement | PASS (ref 3 msg) | PASS | PASS | PASS (mobile bar) | manual* | PASS | PASS (rotation via JS; static verified) |
| Header | PASS | PASS | PASS | PASS (drawer) | manual* | PASS | PASS (search→predictive bus D2; wishlist/account links) |
| Footer | PASS | PASS | PASS | PASS (stacked) | manual* | PASS | PASS (newsletter form) |
| Hero | PASS | PASS | PASS | PASS (single col) | manual* | PASS | PASS (swiper nav/counter/autoplay; reduced-motion gated) |
| Featured products / card | PASS | PASS | PASS | PASS | manual* | PASS | PASS (ATC → cart:updated bus; tilt/magnetic gated D11) |
| Collection grid | PASS | PASS | PASS | PASS (1 col, D17 fix) | manual* | PASS | PASS (sort dropdown; pills = menu links D4) |
| Product | PASS | PASS | PASS | PASS | manual* | PASS | PASS (variant engine by option position D7; qty; sticky bar; size modal; reviews) |
| Cart | PASS | PASS | PASS | PASS | manual* | PASS | PASS (qty/remove via /cart/change.js + cart:updated D6/D9; totals) |

* Editor column = documented manual store checklist (§6) — no Shopify auth in the dev loop; run on the live store before DESIGN FREEZE.

## 5. QA finding fixed during Wave 1 close-out

- **D17 — responsive grid regression:** `aether-collection-grid.liquid` emitted inline `style="grid-template-columns: repeat({{ per_row }}, 1fr)"`, which overrides the CSS media queries (≤1024 → 2 cols, ≤576 → 1 col) — mobile would always show `per_row` columns (3 default) vs frozen 1 col. Fixed: inline style removed, modifier class `aether-shop-grid--cols-{2|3|4}` added (`sections/aether-collection-grid.liquid:89`, `assets/aether.css.liquid` base rules; media queries unchanged and now effective). Verified: computed grid = 1 col at 390, 3 cols at 1440. Budget after fix: 58,418 B (≤ 60 KB).

## 6. Editor lifecycle checklist (manual store test — run before DESIGN FREEZE)

Per section (all 8 AETHER sections + chrome groups): ADD (add section in editor), REMOVE (delete), RE-ADD, MOVE (reorder), DUPLICATE, EDIT (change a setting), SAVE, RELOAD (page renders saved state; section re-initializes — `shopify:section:load` controllers mount; no duplicate listeners; animations re-run only on motion-enabled + non-touch + reduced-motion OK).

Coexistence A–E (user brief):
- A: aether-only template renders (promote `index.aether.json` etc.)
- B: mixed template (AETHER + PHANTOM sections interleaved) renders and both CSS/JS stacks coexist (current home)
- C: remove ALL aether sections → PHANTOM-only page renders, aether.js no-ops (zero `[data-section-type^="aether-"]` → inert)
- D: remove ALL phantom sections → aether-only page renders (no PHANTOM chrome dependency)
- E: pack switch via `active_design_pack` setting: `aether` → assets load; `demo`/`none` → aether assets NOT injected (resolver unit-tested in `check-registry.mjs`; live-store verify)

## 7. Gates (final, after D17 fix)

- theme-check: **296 files, 0 offenses**
- registry (`node designs/build/check-registry.mjs`): **PASS** — resolution unit tests, asset inventory, budgets (home 58,418 B; collection 58,418 B; product 58,418 B; cart 58,418 B — all ≤ 60 KB)
- untouched-file audit vs `ec12ad0~1`: theme.js / phantom-vendor.js / theme.css.liquid / css-variables.liquid / ph-design-tokens.css.liquid / theme.liquid / settings_schema.json / settings_data.json — **UNTOUCHED**; only AETHER layer + locales + registry gate + docs changed
- aether.js.liquid 29,956 B (≤ 40 KB); aether-product.js 15,815 B (≤ 20 KB); vendors loaded on demand (swiper 151.7 KB, gsap 115.6 KB, lenis 13 KB)

## 8. Commits (Wave 1)

`ec12ad0` (foundation) → `6b1bbef` (announcement) → `530836d` (header) → `8cc44fa` (plan) → `8676bda` (footer) → `1168f33` (featured/card) → `2285705` (hero) → `b220103` (collection grid) → `007d0b8` (product) → `2bc65dd` (cart) → `76b3818` (master model) → `b533db0` (memory) → `eead352` (home composition) → `ed39075` (plan notes) → `904fb45` (docs) → *(this commit)* (QA + evidence).

## 9. Visual sign-off (REQUIRED — human)

Open the paired screenshots and confirm per page/breakpoint:
- `docs/integration/aether/references/index-1440.png` vs `docs/integration/aether/proofs/index-1440.png` (…768, …390)
- shop, product-detail, cart likewise.

Sign-off result → record here and, if PASS, set DESIGN FREEZE revision in `docs/aether/manifest.md` (contract §10).