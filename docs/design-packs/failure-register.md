# Failure Mode Register — Design Pack Runtime

> Binding failure register for the Design Pack Runtime. Materialized in Wave 0 T4 from spec §13 of `docs/superpowers/specs/2026-08-16-phantom-design-pack-architecture.md`. Every new pack or runtime feature must re-check this table; new failure modes are appended (never renumbered).

## 1. Register

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
| 19 | registry desync | parallel `dp_*` lists differ in length | wrong pack assets / broken tags | `check-registry.mjs` gate + runtime index-guard | positional lists + integrity gate (amendment 2) | fallback `aether` | fix lists, re-run gate |

## 2. How to add a failure mode

- Append the next row number (never renumber existing rows).
- Fill every column: Failure / Cause / Impact / Detection / Prevention / Fallback / Recovery.
- State the detection mechanism concretely (which gate, which check, which event).
- If the prevention mechanism is not implemented yet, mark the row `⚠️ unenforced` in the Detection column until the gate exists.

## 3. Enforcement map (rows → gates)

| Gate | Enforces |
|---|---|
| `designs/build/check-registry.mjs` | rows 1, 2, 19 |
| theme-check (theme-check.yml) | rows 3, 16, 17 (`MatchingTranslations`) |
| pack CSS scope audit (`--check`) | rows 4, 5, 11 |
| pack JS runtime (init flags, event bus) | rows 6, 7, 8, 12, 18 |
| `{% render block %}` / apps.liquid pattern | row 9 |
| `{% if %}` + onboarding placeholders | rows 14, 15 |
| feature-detect (WebGL) | row 13 |