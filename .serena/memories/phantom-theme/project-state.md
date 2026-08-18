# PHANTOM Theme — Project State (updated 2026-08-18)

Theme: PHANTOM v2.3.0 (OS 2.0), rebranded from Impulse v8.2.0 by Archetype Themes.
Path: `C:\Users\hamma\Downloads\phantom\phantom-theme\phantom-theme-v2.2.0\`

## Current status: MASTER OPERATING MODEL APPROVED (2026-08-18); Wave 1 (AETHER Master Phase 1) Tasks 1–9 COMPLETE, Tasks 10–13 remaining; ALL committed, NOT pushed (31 commits ahead of origin)

### Master Operating Model (2026-08-18 — USER-APPROVED working direction)
Spec: `docs/superpowers/specs/2026-08-18-phantom-master-operating-model.md` (committed 76b3818). Plan updated in-place: `docs/superpowers/plans/2026-08-17-phantom-design-pack-wave1.md` now opens with the Master Operating Model section + roadmap.
- Business objective is NOT a multi-theme marketplace. Do NOT build permanent packs (NOVA/LUXE/client-XXX). Model: ONE protected PHANTOM+ AETHER MASTER → fresh independent copy per client → transform ONLY that copy's AETHER layer into the client's approved design.
- Master is versioned/tagged (`PHANTOM-AETHER-MASTER-v1.0`), never client-modified; clients never start from another client's theme; backports are deliberate (client improvement → master only if generic/reusable/approved → new master version).
- Client may heavily modify AETHER layer (sections/snippets/templates/CSS/JS/motion/assets/tokens/composition); normally NOT touch PHANTOM Core/theme.js/cart/search infra/adapters/library/Theme Editor runtime.
- Per-client flow: external premium frontend (HTML/Bootstrap/GSAP/Three.js/Lenis/Swiper) → CLIENT APPROVAL → DESIGN FREEZE → transform AETHER (Liquid replaces data, never design) → QA → deliver. Deviations logged as ORIGINAL→WHY→SHOPIFY CONSTRAINT→NEW→VISUAL IMPACT.
- Roadmap: Wave 1 (current, 8 commerce sections) → Wave 2 (blog/article/page/FAQ/team/testimonials/contact/newsletter/promo/404/search/legal) → Wave 3 (accounts + wishlist) → hardening + `PHANTOM-AETHER-MASTER-v1.0` tag → Client Conversion Playbook. Generic Design Pack runtime/resolver stays as tested future-proofing, not the primary workflow.

### Design Pack Wave 1 — AETHER Master Phase 1 (2026-08-17/18 — Tasks 1–9 DONE; 10–13 OPEN)
Plan: `docs/superpowers/plans/2026-08-17-phantom-design-pack-wave1.md`. Gates per task: `shopify theme check` 0 offenses, `node designs/build/check-registry.mjs` PASS, CSS ≤60 KB hard ceiling (currently 58.2 KB), never push.
Commit trail (newest first):
- 76b3818 — plan + spec for Master operating model.
- 2bc65dd — Task 9 cart section: `sections/aether-cart-items.liquid` + `templates/cart.aether.json`; `aether.js.liquid` gains `aetherChangeCartItem()` (theme.cart.changeItem w/ fetch fallback) + `CONTROLLERS['aether-cart-items']` (qty/remove, dispatches `cart:updated`); `aether.css.liquid` consolidated + minified (58,220 B base + 0 B section stylesheets; selector audit 209→243, zero lost); locales: `aether.cart.*` (17 keys) + `aether-cart-items` schema family + `sections.categories.cart` in all 7 languages; `_scripts/add-locale-keys.ps1` extended (cart + product families, rebuild gate now checks all families incl. product; tool is committed, not gitignored). Line/cart discount loops use PHANTOM var names (`discount_allocation`, `cart_discount`).
- 007d0b8f — Task 8 product section (aether-product.liquid, product.aether.json, aether-product.js, locale keys via scripts/add-aether-product-locales.py — root `scripts/` now gitignored, superseded by _scripts/add-locale-keys.ps1).
- b220103 (T7 collection grid), 2285705 (T6 hero), 1168f33 (T5 featured products), 8676bda (T4 footer), 8cc44fa (plan doc), 530836d (T3 header), 6b1bbef (T2 announcement bar), ec12ad0 (T1 foundation: vendored swiper/gsap/lenis + motion.js + runtime).
NOTES: frozen source `frontend/frontend/` is visual truth (deviation table D1–D11 in plan). PHANTOM integration points reused: `cart:updated`/`cart:quantity` bus, `theme-resource-loader`, `theme.Currency.formatMoney`/`theme.settings.moneyFormat` (money format from `theme.liquid:82`, NOT `Shopify.money_format`; the `{{amount}}` JS fallback is wrapped in `{% raw %}` — theme-check flags raw `{{amount}}` in .liquid JS). `aether.css.liquid` is deliberately MINIFIED (inline comment ledger) to hold the 60 KB budget — do not re-prettify.
REMAINING: Task 10 (rebuild `templates/index.aether.json` coexistence composition), Task 11 (locale completeness — mostly done via add-locale-keys.ps1; verify MatchingTranslations), Task 12 (liquid-scope-boundaries.md, deviations log, registry/manifest sync, contract amendments), Task 13 (parity proof pages + captures, fidelity report, full gates, final report). Then push authorization (31 commits ahead, NOT pushed) and Wave 2 authorization.

### Design Pack Wave 0 (2026-08-17 — COMPLETE; nothing pushed, push needs user OK)
Plan: `docs/superpowers/plans/2026-08-16-phantom-design-pack-wave0.md` (committed a17bf53). Spec: `docs/superpowers/specs/2026-08-16-phantom-design-pack-architecture.md`.
Commit trail (newest first):
- f0e0cf2 — docs sync: registry.md (seven lists + group alternates + NOVA walkthrough) + manifest.md (chrome skeleton status).
- a17bf53 — Wave 0 plan doc committed.
- 9112120 — spec §15 step 2: deleted legacy stubs `sections/media-text.liquid` + `sections/newsletter-section.liquid` (zero refs verified). NOTE: `snippets/newsletter-section.liquid` is LIVE (sections/newsletter.liquid → password.json + index templates) — kept. Spec-named phantom-dark-mode.js/effects.js/three-scenes.js exist ONLY in frozen frontend (`frontend/frontend/assets/js/`), not in theme.
- 4278c91 — T5 AETHER chrome: resolver now SEVEN positional lists (+`dp_header_groups`/`dp_footer_groups`/`dp_popup_groups`; maps aether→`*.aether` group alternates, demo/none→PHANTOM groups); theme.liquid renders `{% sections dp_header_group %}`/`dp_popup_group`/`dp_footer_group` (UndefinedObject-disabled; zero pack-name conditionals); new `sections/aether-announcement-bar.liquid`/`aether-header.liquid`/`aether-footer.liquid` (skeleton chrome); new group alternates `header-group.aether.json` (announcement+header), `footer-group.aether.json`, `popup-group.aether.json` (empty); aether chrome locale keys ×4 in all 7 `*.schema.json` via new `_scripts/add-locale-keys.ps1`; check-registry.mjs extended (resolve() mirrors group handles + 6 new group-existence checks).
- a79e02a — spec §15 step 1: `frontend/frontend/` committed as FROZEN visual source of truth (253 files: HTML pages, ~200 images, vendor css/js, QA evidence md/png). MCP filesystem server's tree was STALE/INVERTED — real path is `frontend/frontend/` (PowerShell/Test-Path authoritative). Wrong `frontend/.gitignore` created then removed.
- d0157e5 + 1afb187 — T4 docs at REPO ROOT docs/ (tracked convention; theme-local docs/ is gitignored): `docs/design-packs/registry.md`, `design-pack-contract.md`, `conversion-contract.md`, `failure-register.md` (19 rows), `docs/aether/manifest.md`.
- a249145 + ecc6583 + b85d376 — T3 template alternates (`templates/index.aether.json` verbatim mirror, `collection.aether.json`, `product.aether.json`) + `docs/design-packs/template-promotion-contract.md` (promotion = snapshot → validate → promote → regression → commit; archives `*.phantom.json` created only at promotion).
- ca71bb5, b8896b8, 8efdd45, b89280e — T1+T2: resolver+gate, settings (`active_design_pack` default aether; `design_pack` + `aether_*` token groups), locales ×7, loader, `client-demo.js`→`client-demo.js.liquid` rename, `assets/aether.css.liquid` (1.3 KB tokens) + `aether.js.liquid` (3.4 KB AetherRuntime skeleton).
QA (final): theme-check **285 files 0 offenses**; `node designs/build/check-registry.mjs` **REGISTRY: PASS (22 checks incl. 6 group-existence)**; untouched-file audit clean — Wave 0 modified ONLY resolver, check-registry.mjs, theme.liquid (loader + 3 group lines), settings_schema/data, 7 locale schema files; deleted only the 2 spec-ordered stubs.
Lessons recorded: `{% render %}` = isolated scope (must use `{% include %}` for dp_*); `general.accessibility.navigation` and `general.payment.label` DON'T exist in regular locales — use `general.drawers.navigation`, `general.search.submit`, `cart.general.title`; group alternates = `sections/{base}.{suffix}.json` discoverable in editor; AETHER is default pack → storefront now renders skeleton aether chrome.

### Design Pack Architecture (2026-08-16 — SPEC APPROVED BY USER; partially superseded by Master Operating Model 2026-08-18)
- PHANTOM = design-agnostic CORE; AETHER = first/default DESIGN PACK (replaceable by NOVA/LUXE/client packs without touching Core); `active_design_pack` = generic resolver (single registration point); demo/none = legacy entries (Task 03 stack preserved). NOTE: the multi-pack marketplace framing is superseded — the Master Operating Model keeps the generic resolver as future-proofing only.
- Key rule: active pack changes DEFAULT design (assets/templates/tokens/chrome groups), NEVER section availability. Mixing AETHER + PHANTOM sections = first-class OS 2.0.
- Waves: W1 AETHER commerce core (hero/featured/collection/product/cart + chrome styling) → W2 content/blog → W3 accounts. Budgets: aether.css ≤60 KB, aether.js ≤40 KB. z-index 5000/9000/9050/9500/9700 cap 10000.
- Superseded: 2026-08-16-aether-section-library-design.md (v1 draft, absorbed as AETHER Wave 1).

### Task 03 correction pass (2026-08-16 — post-execution external review, committed)
Record: `docs/superpowers/corrections/2026-08-16-phantom-task03-correction-pass.md`. `designs/build/audit-scope.mjs` (selector-scoping audit) wired into build.mjs; client-demo asset 9413 → 9213 bytes; data-ph-section/data-ph-component hooks on client sections; picsum → local SVGs; contract §1.2/§1.7/§1.8/§2.4 rewritten; mapping.md token-substitution note; theme-check 274 files 0 offenses.

### Task 01/02/03 (2026-08-16 — committed; Task 03 pushed to origin)
- Task 01 blueprint: `docs/superpowers/specs/2026-08-16-phantom-external-integration-blueprint.md` (a5da4ab). Decisions: Bootstrap = design-time only; CSS namespace `.ph-client--{slug}[data-ph-design]`; token bridge `--ph-color*`; z-index budget; ClientDesign ES module via import map; multi-design via designs/{slug}/.
- Task 02 baseline (a5da4ab): 269 files 0 offenses; versions 2.3.0; designs/ scaffold (contracts/, _template/, build/ sass+purgecss pipeline `node build.mjs --slug {slug}` / `--check`).
- Task 03 (a28a676..40c3952, PUSHED): client-demo design (Aurora), `page.demo.json`, `ph_active_design` toggle (later removed by Wave 0), QA-07 fidelity report + 6 screenshots. Live-store manual QA for demo page still open (no Shopify auth here).

## Repo policy
- Remote: https://github.com/HAmmadsiamil007/shopify-demo.git (branch main) — the real client demo store, keep presentable. Push ONLY with explicit user OK.
- https://github.com/HAmmadsiamil007/shopify-phantom- is FROZEN — never touch/push again.
- `.serena/memories/*` files are git-tracked — update + commit them when state changes.
- Theme-local `phantom-theme-v2.2.0/docs/` is gitignored by design — tracked docs live at repo ROOT `docs/`. `_scripts/add-locale-keys.ps1` IS committed (locale tooling). Root `scripts/` is gitignored (one-off python helpers, superseded).

## Related
- Theme-check command: `shopify theme check` in theme dir (Shopify CLI; Node v24). `npx @shopify/theme-check` / `theme-check-node` are NOT the right commands.
- No live Shopify store auth in this environment — live-render QA is manual.
- Watermarks-remover tool installed 2026-08-16 (service 127.0.0.1:8765, skill remove-ai-marks).
- PowerShell gotchas: `\r\n` inside PS double quotes is literal text (backslash-r-backslash-n) — .NET Regex interprets it as CRLF, but string REPLACEMENTS need backtick escapes ("`r`n"); `rg` is NOT installed — use Select-String or the grep tool.