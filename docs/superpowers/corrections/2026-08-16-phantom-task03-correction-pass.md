# PHANTOM Task 03 — Correction Pass (post-execution audit)

- **Date:** 2026-08-16
- **Applies to:** executed Task 03 (`docs/superpowers/plans/2026-08-16-phantom-task03-design-activation-plan.md`, commits `a5da4ab..40c3952`, pushed to `shopify-demo`)
- **Trigger:** external technical review of the Task 03 plan (12 findings). This record audits each finding against the **shipped code** (not the plan text), applies fixes where the finding is real, and re-verifies.

## Task roles (explicit)

- **TASK 03 (this work):** *Prove external-design activation safely.* A controlled proof-of-concept. The `ph_active_design` toggle (`none`|`demo`) is a **temporary activation mechanism** for the proof — it is NOT the final architecture.
- **TASK 04 (next):** *Convert the proof into a modular AETHER section system.* Sections with their own `{% schema %}`, presets, per-section assets/lifecycle, mixed `AETHER section / PHANTOM section / AETHER section` composition in one JSON template (spec already exists: `docs/superpowers/specs/2026-08-16-aether-section-library-design.md`).
- **TASK 05+:** *Integrate real premium external client designs into AETHER.*

Task 03 must not be made to do Task 04's job — global-design activation stays a proof mechanism.

## Finding-by-finding disposition

| # | Finding | Severity | Real in shipped code? | Disposition |
|---|---|---|---|---|
| 1 | Global activation vs modular AETHER | arch | As-designed (proof only) | Documented above + in plan header note. No code change — Task 03 stays a proof. |
| 2 | Frozen source uses `:root`/`body` vs "no globals" contract | HIGH | Contradiction existed in contract text | Contract §1.2 rewritten: two layers (design source may use globals; production must not). |
| 3 | `.ph-client__container` vs `.container` mismatch | HIGH | **No** — shipped sections already use `.container`; compiled scoped `.container` verified (6 rules, all breakpoints) | Verified; recorded. No change needed. |
| 4 | Bootstrap Sass nesting strategy risky | HIGH | Strategy proven for demo subset (output fully scoped) | Audit added (`audit-scope.mjs`) + dead-rule strip + strategy limits documented in contract §1.7. |
| 5 | "Scoped/purged" not actually proven | HIGH | **Yes** — QA was 4 regexes; shipped CSS contained dead `.ph-client--demo :root` + Bootstrap `:not(.btn-check) + …` chained selector | `designs/build/audit-scope.mjs` added; wired into `build.mjs` (both build and `--check` fail on any unscoped selector); dead `:root` stripped; asset rebuilt 9413 → 9213 bytes. |
| 6 | Token bridge vs "frozen source" tension | MEDIUM | Intent undocumented | `designs/demo/mapping.md` gains "Token substitution (intentional design-system integration)" section — QA compares structure/layout, not exact hex. |
| 7 | Import-map duplication | MEDIUM | **Yes** — `theme-import-map.liquid` shipped a `client-demo` entry; module imports nothing | Entry removed. Contract §2.4 now states: import-map registration only when the module actually imports shared modules. |
| 8 | Lifecycle only partially real | LOW | `_unbindLifecycle() {}` confusing | Commented (AbortSignal semantics) + header note: IO-only proof; vendor-library lifecycle lands in Task 04+. |
| 9 | Missing `data-ph-section`/`data-ph-component` | LOW | **Yes** | Added to all 3 client sections (`demo`/`hero|collection|footer`) for future AETHER JS registry, analytics, editor lifecycle. |
| 10 | External picsum.photos dependency | LOW | **Yes** (frozen source only) | Replaced with local SVG placeholders (`designs/demo/source/assets/aurora-{bowl,linen,candlestick}.svg`); source screenshots re-captured. |
| 11 | Dynamic fields incomplete | LOW | Adapter already permits future fields | Documented in mapping.md (variant/quick-add explicit out-of-scope for Task 03). |
| 12 | "Byte-identical" too strong | MEDIUM | Wording only | Contract §1.8 defines regression as no visual/functional/asset/perf change; byte differences acceptable. |

## Files changed

| File | Change |
|---|---|
| `designs/build/audit-scope.mjs` | NEW — selector-scoping audit + dead `:root` strip |
| `designs/build/build.mjs` | Wire audit + strip into build/check; fail on unscoped selectors |
| `designs/demo/production/client-demo.css` | Rebuilt (9.0 KB, dead `:root` removed) |
| `assets/client-demo.css.liquid` | Rebuilt asset copied |
| `snippets/theme-import-map.liquid` | Removed conditional `client-*` entry |
| `sections/client-demo-{hero,collection,footer}.liquid` | Added `data-ph-section="demo"` + `data-ph-component` |
| `assets/client-demo.js` | Lifecycle comments (AbortSignal, vendor-lib scope note) |
| `designs/demo/source/index.html` + `assets/aurora-*.svg` | Local placeholders replace picsum.photos |
| `designs/contracts/css-namespace-contract.md` | §1.2 two-layer rule, §1.7 audit/strip/limits, §1.8 regression definition, §2.4 import-map policy |
| `designs/demo/mapping.md` | Token-substitution intent + future data surface |
| `docs/integration/demo/fidelity-report.md` | QA table updated (scope audit, new size) |
| `docs/integration/demo/screenshots/*` | Re-captured against local placeholder source |
| This record | Problem-by-problem disposition |

## QA re-run (all green)

1. `node build.mjs --slug demo` → build OK, scope audit 0 issues, dead `:root` stripped (9213 bytes)
2. `node build.mjs --slug demo --check` → `OK demo: 9.0 KB`
3. `shopify theme check --path phantom-theme-v2.2.0` → 0 offenses
4. CSS contract audit (no `:root` / `^body` / `!important` / z-index ≥ 5 digits) → clean
5. JSON validates (settings_schema, settings_data, locales, page.demo)
6. Default-path regression: only conditional/additive diffs in layout + import map; `index.json` untouched

## Bottom line

The plan's foundation was sound; the shipped code had already absorbed the container fix (P3). The real gaps were **automated scope proof (P5)**, **contract clarity (P2/P12)**, **import-map duplication (P7)**, and **section metadata (P9)** — all closed here without changing the architecture or the default render path.