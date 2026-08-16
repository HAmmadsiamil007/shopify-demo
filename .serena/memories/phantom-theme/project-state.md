# PHANTOM Theme — Project State (updated 2026-08-16)

Theme: PHANTOM v2.3.0 (OS 2.0), rebranded from Impulse v8.2.0 by Archetype Themes.
Path: `C:\Users\hamma\Downloads\phantom\phantom-theme\phantom-theme-v2.2.0\`

## Current status: Task 03 (design activation walkthrough) IN PROGRESS — paused by user (2026-08-16)

### Task 01 — Blueprint (completed 2026-08-16)
Deliverable: `docs/superpowers/specs/2026-08-16-phantom-external-integration-blueprint.md` (committed in a5da4ab).
- Architecture: PHANTOM = commerce/theme engine; external frontend = design source of truth; Liquid = adapter (replaces data, never design).
- Key decisions: Bootstrap = design-time tool only (Option D: production = scoped per-module purge compile); CSS namespace `.ph-client--{slug}[data-ph-design]` (never :root/body/bare elements in client CSS); token bridge to `--ph-color*`; z-index budget sticky 5000 / drawer 9000 / modal 9050 / toast 9500 / 3D 9700 (cap 10000; PHANTOM ceiling 10001); client breakpoints 576/768/992/1200/1400 inside scope only; ClientDesign ES module via import map (ui-* precedent); multi-design via designs/{slug}/ source-of-truth (branches rejected).

### Task 02 — Baseline hardening + integration scaffold (COMPLETE, committed a5da4ab)
Theme-check: 269 files, 0 offenses.
- Versions synced to 2.3.0; dead `window.phMotion.animate` removed; bug fixes (pdp-media-gallery alt, reset_password email); theme-check disable comments on 18 files; orphan deletions (5 snippets + 2 SVGs; 26 ph-icon SVGs kept).
- Scaffold: `designs/contracts/` (css-namespace-contract.md, js-lifecycle-contract.md), `designs/_template/` (client-design.js shell, manifest.md, mapping.md, source/, production/), `designs/build/` (npm pipeline: sass + purgecss + bootstrap; `node build.mjs --slug {slug}` / `--check`).

### Task 03 — Design activation walkthrough (IN PROGRESS, paused)
Spec: `docs/superpowers/specs/2026-08-16-phantom-task03-design-activation-design.md` (commits d13c36b, f0caba2).
Plan: `docs/superpowers/plans/2026-08-16-phantom-task03-design-activation-plan.md` (commit ae1fc62) — 6 tasks, 30 steps.
SDD artifacts (gitignored, NOT in repo): `.superpowers/sdd/` — task-1..6 briefs, task-1..3 reports, review packages, `progress.md` ledger.

Progress (executed via subagent-driven development on main):
- Task 1 (housekeeping: commit Task 02 work + delete designs/true): DONE — commit a5da4ab. Review clean.
- Task 2 (demo frozen source + manifest + mapping): DONE — commit c786506. Review clean. `designs/demo/` created (fictional "Aurora Studio" design).
- Task 3 (demo build pipeline → client-demo.css): implemented — commit ae2ef80 — BUT REVIEW FOUND A CRITICAL BUG, FIX NOT YET APPLIED:
  - **Pending fix (Critical):** PurgeCSS strips the reveal rules (`html.js & .ph-client__reveal` / `.is-visible`) because the frozen source has no `html class="js"`. Fix: add `/^html\.js/` to the `standard` safelist array in `designs/build/build.mjs` (~line 87-90), rebuild (`node build.mjs --slug demo` from designs/build), re-copy to `assets/client-demo.css.liquid`, verify `html.js .ph-client__reveal` + `.is-visible` present in built CSS, commit (build.mjs + production/client-demo.css + assets/client-demo.css.liquid). A fix subagent was dispatched but CANCELLED by user.
  - **State of the fix NOW (2026-08-16, paused):** the safelist edit (`standard: [/^ph-client/, /^data-ph-/, /^html\.js/]`) IS ALREADY APPLIED in `phantom-theme-v2.2.0/designs/build/build.mjs` but UNCOMMITTED (working tree). NOT done yet: rebuild, re-copy to assets/client-demo.css.liquid, positive verification, commit, re-review.
  - Also flagged (Important): add a positive presence check (built CSS must contain `html.js`) to QA audits; (Minor) `.ph-client--demo :root` dead selector from Bootstrap `maps` module; trailing newline cosmetics.
- Tasks 4 (client sections + page.demo.json), 5 (activation wiring: client-demo.js, ph_active_design toggle, theme.liquid, import map, locales), 6 (QA gate + fidelity report + commit + push): NOT STARTED.

Commits on main so far: d13c36b (spec), f0caba2 (spec update), ae1fc62 (plan), a5da4ab (Task 02 + Task 1), c786506 (Task 2), ae2ef80 (Task 3 impl, needs fix).
NOT PUSHED yet — push to origin is Task 6 step 9.

## Resume instructions (next session)
1. Apply the Task 3 Critical fix (see above), re-run `--check`, re-review (review package base c786506).
2. Execute Tasks 4-6 from the plan (`docs/superpowers/plans/2026-08-16-phantom-task03-design-activation-plan.md`) using briefs in `.superpowers/sdd/` and the progress ledger (`.superpowers/sdd/progress.md`).
3. Task 6 includes: QA gate (theme-check 0 offenses, build check, CSS contract audit, default-path git diff audit, fidelity report `docs/integration/demo/fidelity-report.md`) then `git push origin main`.
4. After Task 03: Task 04 (generic design loader hardening) and Task 05 (first real client design) per spec §9 roadmap.

## Repo policy (2026-08-16)
- Remote: https://github.com/HAmmadsiamil007/shopify-demo.git (branch main) — the real client demo store, keep presentable.
- https://github.com/HAmmadsiamil007/shopify-phantom- is FROZEN — never touch/push again.
- `.serena/memories/*` files are git-tracked — update + commit them when state changes.

## Related
- Watermarks-remover tool installed 2026-08-16 (service 127.0.0.1:8765, skill remove-ai-marks, restart script C:\Users\hamma\.agents\tools\watermarks-remover\start-service.ps1).
- Theme-check command: `shopify theme check --path "C:\Users\hamma\Downloads\phantom\phantom-theme\phantom-theme-v2.2.0"` (Shopify CLI 4.6.1; Node v24.18.0).
- No live Shopify store auth in this environment — live-render QA is manual (documented in fidelity report plan).