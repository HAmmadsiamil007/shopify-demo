# Design Pack Registry — PHANTOM Core

> Binding reference for the Design Pack Runtime. Materialized in Wave 0 T4 from spec §4 (Active Design Resolution), §5 (Default vs available), §8 (Template strategy), §15 (Waves) of `docs/superpowers/specs/2026-08-16-phantom-design-pack-architecture.md`. Related: `docs/design-packs/template-promotion-contract.md`, `docs/design-packs/design-pack-contract.md`.

## 1. What the registry is

The registry is the **single registration point** for design packs. It lives in `snippets/design-pack-resolver.liquid` as four positional lists:

| List | Meaning |
|---|---|
| `dp_packs` | unique `pack_id` values, lowercase `[a-z0-9-]` |
| `dp_assets` | asset file base for `{asset_base}.css.liquid` / `{asset_base}.js.liquid` |
| `dp_versions` | pack version constants |
| `dp_statuses` | `active` (assets load) / `legacy` (compat entry, nothing loads) / `draft` (reserved) |

**Contract rules (binding):**

- Lists are positional — index `i` across all four lists describes the same pack. Equal length is mandatory.
- `dp_packs[0]` is always the production default (`aether`). Unknown / blank / missing `active_design_pack` resolves safely to index 0.
- `theme.liquid` reads **only** the resolver outputs (`dp_active`, `dp_asset`, `dp_enabled`) — zero pack-name conditionals anywhere in Core.
- The default pack's asset checks are strict once its skeleton assets exist (T2 auto-expires the exception).
- Integrity is gated by `designs/build/check-registry.mjs` — corrupt registry = QA FAIL, never silent tolerance.

## 2. Current registry state

| index | pack | asset base | version | status | role |
|---|---|---|---|---|---|
| 0 | `aether` | `aether` | 1.0.0 | active | production default (Design Pack) |
| 1 | `demo` | `client-demo` | 1.0.0 | active | legacy Task 03 client-design stack |
| 2 | `none` | `none` | 0.0.0 | legacy | legacy dev/test entry — loads nothing |

Resolution behavior (`node designs/build/check-registry.mjs` unit-tests all paths):

- `active_design_pack = aether` → `{ active: aether, asset: aether, enabled: true }`
- `demo` → `{ active: demo, asset: client-demo, enabled: true }` (Task 03 behavior preserved)
- `none` → `{ active: none, asset: none, enabled: false }` (nothing loads)
- invalid id (`bogus`), blank, or missing → safe fallback to `aether`

## 3. Registering a new pack (walkthrough — NOVA example)

NOVA is a hypothetical second pack. Registration touches only pack-owned files plus one registry row — PHANTOM Core stays implementation-stable (spec §14 proof).

1. **Resolver row** — append one entry to each list in `snippets/design-pack-resolver.liquid` (same index):

```liquid
{%- assign dp_packs = 'aether|demo|none|nova' | split: '|' -%}
{%- assign dp_assets = 'aether|client-demo|none|nova' | split: '|' -%}
{%- assign dp_versions = '1.0.0|1.0.0|0.0.0|1.0.0' | split: '|' -%}
{%- assign dp_statuses = 'active|active|legacy|draft' | split: '|' -%}
```

   Keep `status: draft` until NOVA assets ship (guards missing assets — failure row 2).

2. **Settings** — add `nova` to the `active_design_pack` select options in `config/settings_schema.json` + `settings_data.json` default; NOVA token group `nova_*` (pack-owned — NOT a universal schema; each pack ships its own settings shape, spec §6 amendment 5).

3. **Locales** — `nova_*` keys + `.schema.json` label keys in **all 7** `locales/*.schema.json` files; `MatchingTranslations` is the QA gate (failure row 17).

4. **Assets** — `assets/nova.css.liquid` (tokens on `.ph-client--nova`, zero `:root`, budget per §11) + `assets/nova.js.liquid` (`NovaRuntime`, event-bus subscription, no-op without `[data-section-type^="nova-"]`). Then flip registry `status` → `active`.

5. **Sections** — `sections/nova-*.liquid` with `data-section-type="nova-*"`, `{% schema %}` presets, `ph-client ph-client--nova nova-{component}` root classes; pack CSS scope audit gate (`--check`) green.

6. **Templates** — `{base}.nova.json` alternates (suffix `nova` unreserved); promotion via `docs/design-packs/template-promotion-contract.md` (snapshot → validate → promote → regression → commit), never "copy and flip".

7. **Docs** — `docs/nova/manifest.md` (component registry), `mapping.md` (data anchors), `fidelity-report.md` (screenshot evidence).

8. **Gates** — `node designs/build/check-registry.mjs` PASS (equal lengths, unique ids, first = aether, strict asset existence for `active` packs) + theme-check 0 offenses.

## 4. Final report format (spec §17, end of each phase)

```
ARCHITECTURE STATUS:    READY / NOT READY
AETHER:                 DESIGN PACK (first/default)
PHANTOM:                CORE / PHANTOM LIBRARY / DESIGN PACK RUNTIME (three-layer)
DEFAULT DESIGN:         aether
REPLACEMENT MODEL:      active_design_pack resolver + template promotion/rollback contract
COEXISTENCE:            PASS (verified §7/§14)
EXTERNAL FRONTEND CONVERSION: READY (contract §10, DESIGN FREEZE gate)
NEXT TASK:              <next wave/task>
```

## 5. Remaining Wave 0 steps (tracked)

- Commit `frontend/frontend/` as frozen visual source of truth (+ `.gitignore` note) — spec §15 Wave 0 step 1.
- Delete legacy stubs (`media-text.liquid`, `newsletter-section.liquid`, `phantom-dark-mode.js`, `effects.js`, `three-scenes.js`) — spec §15 Wave 0 step 2.
- T5: AETHER chrome alternates in `sections/header-group.json` / `footer-group.json` / `popup-group.json`.