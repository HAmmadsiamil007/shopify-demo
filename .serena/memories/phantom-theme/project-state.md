# PHANTOM Theme — Project State (updated 2026-08-16)

Theme: PHANTOM v2.3.0 (OS 2.0), rebranded from Impulse v8.2.0 by Archetype Themes.
Path: `C:\Users\hamma\Downloads\phantom\phantom-theme\phantom-theme-v2.2.0\`

## Current status: Task 03 (design activation walkthrough) COMPLETE (2026-08-16, pushed)

### Task 01 — Blueprint (completed 2026-08-16)
Deliverable: `docs/superpowers/specs/2026-08-16-phantom-external-integration-blueprint.md` (committed in a5da4ab).
- Architecture: PHANTOM = commerce/theme engine; external frontend = design source of truth; Liquid = adapter (replaces data, never design).
- Key decisions: Bootstrap = design-time tool only (Option D: production = scoped per-module purge compile); CSS namespace `.ph-client--{slug}[data-ph-design]` (never :root/body/bare elements in client CSS); token bridge to `--ph-color*`; z-index budget sticky 5000 / drawer 9000 / modal 9050 / toast 9500 / 3D 9700 (cap 10000; PHANTOM ceiling 10001); client breakpoints 576/768/992/1200/1400 inside scope only; ClientDesign ES module via import map (ui-* precedent); multi-design via designs/{slug}/ source-of-truth (branches rejected).

### Task 02 — Baseline hardening + integration scaffold (COMPLETE, committed a5da4ab)
Theme-check: 269 files, 0 offenses.
- Versions synced to 2.3.0; dead `window.phMotion.animate` removed; bug fixes (pdp-media-gallery alt, reset_password email); theme-check disable comments on 18 files; orphan deletions (5 snippets + 2 SVGs; 26 ph-icon SVGs kept).
- Scaffold: `designs/contracts/` (css-namespace-contract.md, js-lifecycle-contract.md), `designs/_template/` (client-design.js shell, manifest.md, mapping.md, source/, production/), `designs/build/` (npm pipeline: sass + purgecss + bootstrap; `node build.mjs --slug {slug}` / `--check`).

### Task 03 — Design activation walkthrough (COMPLETE 2026-08-16, pushed to shopify-demo origin)
Spec: `docs/superpowers/specs/2026-08-16-phantom-task03-design-activation-design.md` (commits d13c36b, f0caba2).
Plan: `docs/superpowers/plans/2026-08-16-phantom-task03-design-activation-plan.md` (commit ae1fc62) — 6 tasks, 30 steps.
SDD artifacts (gitignored, NOT in repo): `.superpowers/sdd/` — task briefs, reports, review packages, `progress.md` ledger.

Commits (all on main, pushed `a28a676..40c3952` → origin/main shopify-demo):
- a5da4ab — Task 02 baseline + Task 1 housekeeping
- c786506 — Task 2: demo frozen source + manifest + mapping (Aurora Studio)
- ae2ef80 — Task 3: scoped CSS build pipeline output
- 3bfa4460 — CRITICAL FIX: PurgeCSS safelist `/^html\.js/` — reveal rules restored in client CSS
- 88199bb4 — Task 4: client sections (client-demo-hero/collection/footer) + page.demo.json
- e2135de — Task 5: activation wiring — ph_active_design toggle, body scope root, conditional assets, import map, locales (all 8 languages)
- 40c3952 — Task 6: QA-07 fidelity report + 6 reference screenshots (1440/1200/992/768/576/390)

Task 5 QA catches during final sweep: settings_data.json BOM (removed), pt-BR/pt-PT missing `ph_designs` schema keys (added), en preset name too long "Demo — featured collection" → "Demo collection". Final theme-check: 274 files, 0 offenses. Build check: OK 9.2 KB (< 60 KB). CSS contract audit clean; `html.js .ph-client--demo .ph-client__reveal(.is-visible)` confirmed present in shipped `assets/client-demo.css.liquid`.

## Next session (per blueprint §9 roadmap)
1. Task 04 — generic design loader hardening (designs/contracts hardening, `vendor-{slug}` slot, multi-design registry patterns) per spec `2026-08-16-phantom-external-integration-blueprint.md`.
2. Task 05 — first real client design (designs/{real-slug}/ end-to-end).
3. Live-store manual QA for the demo page remains open: assign `page.demo` template, set `ph_active_design = demo`, compare against `docs/integration/demo/screenshots/` (no Shopify auth in this environment).

## Repo policy (2026-08-16)
- Remote: https://github.com/HAmmadsiamil007/shopify-demo.git (branch main) — the real client demo store, keep presentable.
- https://github.com/HAmmadsiamil007/shopify-phantom- is FROZEN — never touch/push again.
- `.serena/memories/*` files are git-tracked — update + commit them when state changes.

## Related
- Watermarks-remover tool installed 2026-08-16 (service 127.0.0.1:8765, skill remove-ai-marks, restart script C:\Users\hamma\.agents\tools\watermarks-remover\start-service.ps1).
- Theme-check command: `shopify theme check --path "C:\Users\hamma\Downloads\phantom\phantom-theme\phantom-theme-v2.2.0"` (Shopify CLI 4.6.1; Node v24.18.0).
- No live Shopify store auth in this environment — live-render QA is manual (documented in fidelity report plan).