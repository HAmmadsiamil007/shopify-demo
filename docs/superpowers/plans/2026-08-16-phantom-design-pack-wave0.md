# Phantom Design Pack — Wave 0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Design Pack Runtime (Wave 0) in `phantom-theme-v2.2.0/`: a generic `active_design_pack` resolver + registry integrity gate + resolver-driven `theme.liquid` loader + Design Packs settings + legacy `demo`/`none` compatibility — with AETHER registered as the first/default pack.

**Architecture:** One generic resolver snippet (`snippets/design-pack-resolver.liquid`) owns the positional pack registry (`dp_packs/dp_assets/dp_versions/dp_statuses`). `theme.liquid` consumes ONLY its outputs (`dp_active`, `dp_asset`, `dp_enabled`) — zero pack-name conditionals. A Node integrity gate (`designs/build/check-registry.mjs`) parses the same lists, fails QA on corruption, and unit-tests the resolution/fallback algorithm. Settings live in one "Design Packs" group (`active_design_pack`, default `aether`) plus a pack-owned `aether_*` token group. Legacy `demo`/`none` keep their Task 03 behavior via registry entries, not special cases.

**Tech Stack:** Liquid (resolver, no theme-check-breaking syntax), Node 18+ (integrity gate — plain `node`, no deps, mirrors `designs/build/build.mjs` style), Shopify CLI (`shopify theme check`).

**Spec:** `docs/superpowers/specs/2026-08-16-phantom-design-pack-architecture.md` (approved + hardened, commit `2245052`).

## Global Constraints

- **Terminology (binding):** PHANTOM = CORE / PHANTOM LIBRARY / DESIGN PACK RUNTIME (+ ACTIVE DESIGN PACK). Resolver is generic — NO `if aether / elseif aether / switch aether` architecture, ever. NOVA/LUXE/CLIENT-X must fit the same registry.
- **T1 boundary (user-authorized, commit `2245052` §15):** resolver + `check-registry.mjs` + Design Packs settings + `active_design_pack` + `aether_*` token group + `settings_data` default `"aether"` + legacy `ph_active_design` migration + resolver-driven `theme.liquid` loader + legacy `demo` compatibility + QA. STRICTLY NOT IN T1: AETHER visual sections/hero/grids/product/header/footer, template promotion/replacement, frontend conversion, PHANTOM section/snippet/block rewrites, theme.js lifecycle changes, theme.css.liquid rewrite, phantom-vendor.js rewrite.
- **Registry integrity:** positional `dp_*` lists equal length; `dp_packs[0] == 'aether'`; invalid/blank/missing `active_design_pack` falls back safely to `aether`; `demo` → loads `client-demo` assets; `none` → loads nothing (legacy). Corrupt registry = QA FAIL, never silent tolerance.
- **Legacy compat:** `demo` and `none` behave exactly as Task 03 (`ph_active_design`). Do NOT delete `client-demo-*` assets/sections. Do NOT break `templates/page.demo.json`. Body scope root `ph-client ph-client--{slug} data-ph-design="{slug}"` must still emit for `demo`.
- **theme.liquid:** after migration it contains ZERO pack-name-specific conditionals. Loader appends `.css.liquid` / `.js.liquid` uniformly. All pack JS assets share the `.js.liquid` convention (implies renaming `client-demo.js` → `client-demo.js.liquid`, content unchanged — `client-demo.js` is loaded ONLY from theme.liquid, verified by grep).
- **Pack-owned settings:** `aether_*` is NOT a universal schema; future packs ship their own groups. Settings editor order: "Design Packs" group then "AETHER — Design Pack" token group (replacing old "Client designs" group).
- **Locales:** new keys `t:settings_schema.design_pack.*` and `t:settings_schema.aether.*` in ALL 7 `locales/*.schema.json` files (en.default, de, es, fr, it, pt-BR, pt-PT); old `ph_designs` subtree removed from all 7. English values everywhere (structure parity is what theme-check's MatchingTranslations enforces). `t:settings_schema.*` keys live ONLY in `.schema.json` files (existing convention).
- **AETHER token defaults (verified against frozen frontend `frontend/frontend/`, 22 pages):** primary `#D4A574` (×10), accent `#C8956C`, bg `#09090B` (×42), surface `#1A1A1A` (×18), sale `#E74C3C` (×9). Text `#F2F2F2`, muted `#9C9C9C`, border `#2A2A2A` are near-white/gray conventions on Void — final confirmation happens in T2 design-token mapping; schema defaults stand for T1.
- **Asset-existence gate:** `check-registry.mjs` requires `assets/{asset}.css.liquid` + `assets/{asset}.js.liquid` for every `active` pack EXCEPT the default pack (index 0) — the default pack's skeleton assets materialize in T2; the exception auto-expires when they exist. `none` (legacy) requires no assets.
- **QA gates (all must pass before commit):** theme-check 0 offenses; registry PASS; default AETHER PASS; legacy DEMO PASS; invalid fallback PASS; blank fallback PASS; PHANTOM regression PASS (demo pipeline `build.mjs --slug demo --check`, git untouched-file audit).
- **Git safety:** inspect status/branch before modifying; confirm commit `2245052` present; only authorized files change; new implementation commit (DO NOT amend `2245052`); DO NOT push.
- **Palette/format note:** `settings_schema.json` is pretty-printed JSON; `settings_data.json` is a single long line; locale schema files are pretty-printed with a `settings_schema` root key.

---

## Task 1: `snippets/design-pack-resolver.liquid` — the generic registry + resolver

**Files:**
- Create: `phantom-theme-v2.2.0/snippets/design-pack-resolver.liquid`
- Test: `phantom-theme-v2.2.0/designs/build/check-registry.mjs` (Task 2 — resolver's lists are parsed by it)

**Interfaces:**
- Consumes: `settings.active_design_pack` (select string, may be blank/missing).
- Produces: `dp_packs` (array), `dp_assets` (array), `dp_versions` (array), `dp_statuses` (array), `dp_requested` (string), `dp_index` (int), `dp_active` (string), `dp_asset` (string), `dp_enabled` (bool). Later tasks (T5 chrome, Wave 1 AETHER sections) consume `dp_active`/`dp_asset`/`dp_enabled` in the same file scope after `{%- render 'design-pack-resolver' -%}`.

- [ ] **Step 0: Git safety snapshot**

Run (repo root): `git status --short`, `git branch --show-current`, `git log --oneline -3`.
Expected: branch `main`; `2245052` at HEAD; only `?? frontend/` untracked (pre-existing, untouched); NO unexpected user changes. If anything unexpected appears, STOP and report before modifying.

- [ ] **Step 1: Write the resolver**

Create `phantom-theme-v2.2.0/snippets/design-pack-resolver.liquid` with EXACTLY:

```liquid
{% comment %}
  Design Pack Runtime — active design pack resolver (single registration point).
  PHANTOM Core contract: consumers read ONLY dp_active / dp_asset / dp_enabled.
  Never add pack-name conditionals here or in theme.liquid — extend the four
  positional lists below (same index across all four). check-registry.mjs gates
  integrity; the first entry is always the production default (aether).
  Statuses: active = assets load | legacy = compatibility entry (none) | draft = reserved.
{% endcomment %}

{%- assign dp_packs = 'aether|demo|none' | split: '|' -%}
{%- assign dp_assets = 'aether|client-demo|none' | split: '|' -%}
{%- assign dp_versions = '1.0.0|1.0.0|0.0.0' | split: '|' -%}
{%- assign dp_statuses = 'active|active|legacy' | split: '|' -%}

{%- assign dp_found = false -%}
{%- assign dp_index = 0 -%}
{%- assign dp_enabled = false -%}
{%- assign dp_active = dp_packs[0] -%}
{%- assign dp_asset = dp_assets[0] -%}

{%- if settings.active_design_pack != blank -%}
  {%- assign dp_requested = settings.active_design_pack | strip | downcase -%}
{%- else -%}
  {%- assign dp_requested = dp_packs[0] -%}
{%- endif -%}

{%- for dp_entry in dp_packs -%}
  {%- if dp_entry == dp_requested -%}
    {%- assign dp_found = true -%}
    {%- assign dp_index = forloop.index0 -%}
    {%- assign dp_active = dp_packs[dp_index] -%}
    {%- assign dp_asset = dp_assets[dp_index] -%}
    {%- if dp_statuses[dp_index] == 'active' -%}
      {%- assign dp_enabled = true -%}
    {%- endif -%}
  {%- endif -%}
{%- endfor -%}

{%- comment -%}
  Fallback contract: unknown id -> safe fallback to the production default
  (dp_packs[0]). A found-but-legacy entry (none) resolves to asset 'none' with
  dp_enabled=false, so nothing loads — preserved Task 03 behavior.
{%- endcomment -%}
{%- unless dp_found -%}
  {%- assign dp_active = dp_packs[0] -%}
  {%- assign dp_asset = dp_assets[0] -%}
  {%- assign dp_enabled = true -%}
{%- endunless -%}
```

- [ ] **Step 2: Commit resolver alone? NO — resolver is not independently testable until Task 2 exists. Carry on to Task 2 without committing.**

---

## Task 2: `designs/build/check-registry.mjs` — registry integrity gate + resolution tests

**Files:**
- Create: `phantom-theme-v2.2.0/designs/build/check-registry.mjs`
- Test: run `node designs/build/check-registry.mjs` (from `phantom-theme-v2.2.0/`)

**Interfaces:**
- Consumes: `snippets/design-pack-resolver.liquid` (parses `assign dp_X = '...' | split: '|'` lines; resolution algorithm mirrored 1:1 from Task 1).
- Produces: exit code 0/1; stdout lines `CHECK <name>: PASS|FAIL` + final `REGISTRY: PASS|FAIL`. Reused verbatim in QA (Task 6) and as the NOVA/LUXE/CLIENT-X registration gate.

- [ ] **Step 1: Write the gate**

Create `phantom-theme-v2.2.0/designs/build/check-registry.mjs` with EXACTLY:

```js
// Registry integrity gate for the Design Pack Runtime.
// Mirrors the resolution algorithm in snippets/design-pack-resolver.liquid 1:1.
// Usage: node designs/build/check-registry.mjs   (exit 0 = PASS)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themeRoot = path.resolve(__dirname, '..', '..');
const resolverPath = path.join(themeRoot, 'snippets', 'design-pack-resolver.liquid');

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`CHECK ${name}: ${ok ? 'PASS' : 'FAIL'}${detail ? ' — ' + detail : ''}`);
};
const fail = (name, detail) => check(name, false, detail);

const resolver = fs.readFileSync(resolverPath, 'utf8');
const listRe = /assign\s+(dp_\w+)\s*=\s*'([^']*)'\s*\|\s*split:\s*'\|'/g;
const lists = {};
let m;
while ((m = listRe.exec(resolver)) !== null) lists[m[1]] = m[2].split('|');

for (const key of ['dp_packs', 'dp_assets', 'dp_versions', 'dp_statuses']) {
  if (!lists[key]) fail(`registry has ${key}`, 'missing from resolver');
}

if (lists.dp_packs) {
  const len = lists.dp_packs.length;
  const lens = Object.keys(lists).map((k) => `${k}=${lists[k].length}`);
  check('registry lists equal length', lens.every((l) => l.endsWith(`=${len}`)), lens.join(', '));
  check('registry lists non-empty', len >= 1, `length=${len}`);
  check('first pack is aether', lists.dp_packs[0] === 'aether', `dp_packs[0]=${lists.dp_packs[0]}`);
  check('no duplicate pack ids', new Set(lists.dp_packs).size === len, lists.dp_packs.join(','));
}

const resolve = (requested) => {
  const req = String(requested ?? '').trim().toLowerCase();
  const fallback = { active: lists.dp_packs[0], asset: lists.dp_assets[0], enabled: true };
  if (req === '' || req === 'blank') return fallback;
  const i = lists.dp_packs.indexOf(req);
  if (i === -1) return fallback;
  if (lists.dp_statuses[i] !== 'active') return { active: req, asset: 'none', enabled: false };
  return { active: lists.dp_packs[i], asset: lists.dp_assets[i], enabled: true };
};

const cases = [
  ['blank fallback', 'blank', { active: 'aether', asset: 'aether', enabled: true }],
  ['missing fallback', null, { active: 'aether', asset: 'aether', enabled: true }],
  ['invalid fallback', 'bogus', { active: 'aether', asset: 'aether', enabled: true }],
  ['case-insensitive', 'AETHER', { active: 'aether', asset: 'aether', enabled: true }],
  ['aether default path', 'aether', { active: 'aether', asset: 'aether', enabled: true }],
  ['legacy demo path', 'demo', { active: 'demo', asset: 'client-demo', enabled: true }],
  ['legacy none path', 'none', { active: 'none', asset: 'none', enabled: false }],
];
for (const [name, input, want] of cases) {
  const got = resolve(input);
  check(name, JSON.stringify(got) === JSON.stringify(want), `input=${JSON.stringify(input)} got=${JSON.stringify(got)}`);
}

if (lists.dp_statuses) {
  lists.dp_packs.forEach((pack, i) => {
    if (pack === 'none') return;
    const status = lists.dp_statuses[i];
    if (status !== 'active') return;
    const isDefault = i === 0;
    for (const ext of ['css.liquid', 'js.liquid']) {
      const file = path.join(themeRoot, 'assets', `${lists.dp_assets[i]}.${ext}`);
      const exists = fs.existsSync(file);
      if (exists || isDefault) {
        check(`asset exists ${lists.dp_assets[i]}.${ext}`, exists || isDefault,
          isDefault && !exists ? 'default pack skeleton lands in Wave 0 T2' : '');
      } else {
        check(`asset exists ${lists.dp_assets[i]}.${ext}`, false, 'missing active-pack asset');
      }
    }
  });
}

const ok = results.length > 0 && results.every((r) => r.ok);
console.log(`\nREGISTRY: ${ok ? 'PASS' : 'FAIL'}`);
process.exit(ok ? 0 : 1);
```

- [ ] **Step 2: Run the gate**

Run: `node designs/build/check-registry.mjs` (workdir `phantom-theme-v2.2.0/`)
Expected: 14 CHECK lines all PASS, `REGISTRY: PASS`, exit 0. Asset checks: `client-demo.css.liquid` + `client-demo.js.liquid` PASS only AFTER Task 5's rename; `aether.css.liquid`/`aether.js.liquid` show the "default pack skeleton lands in Wave 0 T2" note (PASS by exception). If a check FAILs, fix the resolver (Task 1) or rename (Task 5) — never weaken the gate.

- [ ] **Step 3: Commit Tasks 1 + 2 together**

```bash
git add phantom-theme-v2.2.0/snippets/design-pack-resolver.liquid phantom-theme-v2.2.0/designs/build/check-registry.mjs
git commit -m "feat(design-pack): generic resolver + registry integrity gate (Wave 0 T1)
- snippets/design-pack-resolver.liquid: single registration point (dp_packs/
  dp_assets/dp_versions/dp_statuses); resolves active_design_pack generically;
  blank/missing/invalid -> safe fallback to aether; legacy none -> disabled.
- designs/build/check-registry.mjs: parses registry, gates equal lengths,
  first=aether, unique ids, asset existence (default pack exempt until T2);
  unit-tests fallback paths; exits 0/1."
```

---

## Task 3: Settings — "Design Packs" group, `active_design_pack`, `aether_*` token group

**Files:**
- Modify: `phantom-theme-v2.2.0/config/settings_schema.json` (replace the final "Client designs" group)
- Modify: `phantom-theme-v2.2.0/config/settings_data.json` (top-level `ph_active_design` → `active_design_pack`)

**Interfaces:**
- Consumes: nothing (schema must be self-consistent with Task 4 locale keys).
- Produces: `settings.active_design_pack` (consumed by resolver Task 1); `settings.aether_*` (consumed by T2 skeleton CSS, Wave 1).

- [ ] **Step 1: Replace the "Client designs" group in settings_schema.json**

The file ends with the group `"name": "t:settings_schema.ph_designs.name"` containing the `ph_active_design` select. Replace that entire final group object (and remove the trailing comma logic so the array stays valid) with TWO groups, in this exact order:

```json
  {
    "name": "t:settings_schema.design_pack.name",
    "settings": [
      {
        "type": "paragraph",
        "content": "t:settings_schema.design_pack.paragraph"
      },
      {
        "type": "select",
        "id": "active_design_pack",
        "label": "t:settings_schema.design_pack.settings.active_design_pack.label",
        "default": "aether",
        "options": [
          { "value": "aether", "label": "t:settings_schema.design_pack.settings.active_design_pack.options.aether.label" },
          { "value": "demo", "label": "t:settings_schema.design_pack.settings.active_design_pack.options.demo.label" },
          { "value": "none", "label": "t:settings_schema.design_pack.settings.active_design_pack.options.none.label" }
        ]
      }
    ]
  },
  {
    "name": "t:settings_schema.aether.name",
    "settings": [
      {
        "type": "paragraph",
        "content": "t:settings_schema.aether.paragraph"
      },
      {
        "type": "color",
        "id": "aether_primary",
        "label": "t:settings_schema.aether.settings.aether_primary.label",
        "default": "#D4A574"
      },
      {
        "type": "color",
        "id": "aether_accent",
        "label": "t:settings_schema.aether.settings.aether_accent.label",
        "default": "#C8956C"
      },
      {
        "type": "color",
        "id": "aether_bg",
        "label": "t:settings_schema.aether.settings.aether_bg.label",
        "default": "#09090B"
      },
      {
        "type": "color",
        "id": "aether_surface",
        "label": "t:settings_schema.aether.settings.aether_surface.label",
        "default": "#1A1A1A"
      },
      {
        "type": "color",
        "id": "aether_text",
        "label": "t:settings_schema.aether.settings.aether_text.label",
        "default": "#F2F2F2"
      },
      {
        "type": "color",
        "id": "aether_muted",
        "label": "t:settings_schema.aether.settings.aether_muted.label",
        "default": "#9C9C9C"
      },
      {
        "type": "color",
        "id": "aether_border",
        "label": "t:settings_schema.aether.settings.aether_border.label",
        "default": "#2A2A2A"
      },
      {
        "type": "color",
        "id": "aether_sale",
        "label": "t:settings_schema.aether.settings.aether_sale.label",
        "default": "#E74C3C"
      },
      {
        "type": "font_picker",
        "id": "aether_heading_font",
        "label": "t:settings_schema.aether.settings.aether_heading_font.label",
        "default": "assistant_n4"
      },
      {
        "type": "font_picker",
        "id": "aether_body_font",
        "label": "t:settings_schema.aether.settings.aether_body_font.label",
        "default": "assistant_n4"
      },
      {
        "type": "range",
        "id": "aether_radius",
        "min": 0,
        "max": 32,
        "step": 1,
        "unit": "px",
        "label": "t:settings_schema.aether.settings.aether_radius.label",
        "default": 12
      },
      {
        "type": "select",
        "id": "aether_dark_light",
        "label": "t:settings_schema.aether.settings.aether_dark_light.label",
        "default": "dark",
        "options": [
          { "value": "dark", "label": "t:settings_schema.aether.settings.aether_dark_light.options.dark.label" },
          { "value": "light", "label": "t:settings_schema.aether.settings.aether_dark_light.options.light.label" }
        ]
      },
      {
        "type": "checkbox",
        "id": "aether_motion_enable",
        "label": "t:settings_schema.aether.settings.aether_motion_enable.label",
        "default": true
      }
    ]
  }
]
```

Verify with `Get-Content config/settings_schema.json | ConvertFrom-Json` (workdir `phantom-theme-v2.2.0/`) — must parse with the two new groups and NO `ph_active_design` anywhere.

- [ ] **Step 2: Update settings_data.json**

`config/settings_data.json` is one long line. Replace the top-level key `"ph_active_design":"none"` with `"active_design_pack":"aether"` (appears between `"current":"PHANTOM Default"` and `"installed_preset_name"`). Do NOT add `active_design_pack` to the style presets (pack selection is global, not a style-preset concern; presets do not define the key, so installing a preset cannot clobber it).

Verify: `(Get-Content config/settings_data.json -Raw | ConvertFrom-Json).active_design_pack` → `aether`; `ph_active_design` appears ZERO times.

- [ ] **Step 3: Validate schema JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('config/settings_schema.json','utf8')); JSON.parse(require('fs').readFileSync('config/settings_data.json','utf8')); console.log('SETTINGS JSON: PASS')"` (workdir `phantom-theme-v2.2.0/`)
Expected: `SETTINGS JSON: PASS`. If parse errors, fix and re-run. Do NOT commit yet — Task 4 locale keys must land first (MatchingTranslations would otherwise flag the new `t:settings_schema.*` references).

---

## Task 4: Locale keys — `design_pack.*` + `aether.*` in all 7 `.schema.json` files

**Files:**
- Modify (×7): `phantom-theme-v2.2.0/locales/en.default.schema.json`, `de.schema.json`, `es.schema.json`, `fr.schema.json`, `it.schema.json`, `pt-BR.schema.json`, `pt-PT.schema.json`

**Interfaces:**
- Consumes: the `t:settings_schema.*` references introduced in Task 3.
- Produces: `settings_schema.design_pack` + `settings_schema.aether` subtrees (structure-identical across all 7 files, English values), `settings_schema.ph_designs` REMOVED.

- [ ] **Step 1: Confirm each file has a `settings_schema` root key and a `ph_designs` subtree**

Run: `Get-ChildItem locales -Filter *.schema.json | ForEach-Object { $j = Get-Content $_.FullName -Raw | ConvertFrom-Json; "$($_.Name): settings_schema=$([bool]$j.settings_schema) ph_designs=$([bool]$j.settings_schema.ph_designs)" }` (workdir `phantom-theme-v2.2.0/`)
Expected: 7 lines, all `settings_schema=True ph_designs=True`.

- [ ] **Step 2: Replace `ph_designs` with `design_pack` + `aether` in each file (Node script, one pass per file)**

Run this inline Node script (transient — no repo file) from `phantom-theme-v2.2.0/`:

```js
const fs = require('fs');
const path = require('path');
const langs = ['en.default', 'de', 'es', 'fr', 'it', 'pt-BR', 'pt-PT'];
const designPack = {
  name: 'Design Packs',
  paragraph: 'Select the active design pack. PHANTOM Core, PHANTOM Library and the Design Pack Runtime stay available; the active pack only changes the default design.',
  settings: {
    active_design_pack: {
      label: 'Active design pack',
      options: {
        aether: { label: 'AETHER (default)' },
        demo: { label: 'Demo — Aurora Studio (legacy)' },
        none: { label: 'None (legacy)' }
      }
    }
  }
};
const aether = {
  name: 'AETHER — Design Pack',
  paragraph: 'Pack-owned design tokens for the AETHER design pack. These settings belong to AETHER only; other design packs ship their own.',
  settings: {
    aether_primary: { label: 'Primary color' },
    aether_accent: { label: 'Accent color' },
    aether_bg: { label: 'Background color' },
    aether_surface: { label: 'Surface color' },
    aether_text: { label: 'Text color' },
    aether_muted: { label: 'Muted text color' },
    aether_border: { label: 'Border color' },
    aether_sale: { label: 'Sale color' },
    aether_heading_font: { label: 'Heading font' },
    aether_body_font: { label: 'Body font' },
    aether_radius: { label: 'Corner radius' },
    aether_dark_light: { label: 'Color scheme', options: { dark: { label: 'Dark (Void)' }, light: { label: 'Light' } } },
    aether_motion_enable: { label: 'Enable motion' }
  }
};
for (const lang of langs) {
  const file = path.join('locales', `${lang}.schema.json`);
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!j.settings_schema || !j.settings_schema.ph_designs) throw new Error(`unexpected shape: ${file}`);
  delete j.settings_schema.ph_designs;
  j.settings_schema.design_pack = designPack;
  j.settings_schema.aether = aether;
  fs.writeFileSync(file, JSON.stringify(j, null, 2) + '\n', 'utf8');
  console.log(`updated ${file}`);
}
```

- [ ] **Step 3: Verify key parity across all 7 files + parse validity**

Run:
```powershell
Get-ChildItem locales -Filter *.schema.json | ForEach-Object { $j = Get-Content $_.FullName -Raw | ConvertFrom-Json; $k = $j.settings_schema.PSObject.Properties.Name -join ','; "$($_.Name): $k" }
```
Expected: 7 lines, each containing `design_pack,aether` (or superset), and NONE containing `ph_designs`. Then confirm no `ph_designs` string remains in `locales/`: `Select-String -Path "locales\*.json" -Pattern "ph_designs"` → zero matches (covers both `.json` and `.schema.json`).

---

## Task 5: `theme.liquid` migration + `client-demo.js` → `.js.liquid` rename

**Files:**
- Modify: `phantom-theme-v2.2.0/layout/theme.liquid` (3 edits)
- Rename: `phantom-theme-v2.2.0/assets/client-demo.js` → `phantom-theme-v2.2.0/assets/client-demo.js.liquid` (content unchanged)

**Interfaces:**
- Consumes: resolver outputs `dp_enabled`, `dp_active`, `dp_asset` (Task 1, rendered in `<head>` before first use — Liquid assigns are file-scoped, so `{%- render 'design-pack-resolver' -%}` anywhere before line 37 suffices).
- Produces: identical legacy behavior for `demo` (CSS+JS load, body scope classes) and `none` (nothing loads, no classes); `aether` default resolves but its asset links point at skeleton files that land in T2.

- [ ] **Step 1: Insert resolver render + swap CSS loader**

In `layout/theme.liquid`, replace lines 37–39 (the `{%- if settings.ph_active_design != 'none' -%}` block):

```liquid
  {%- render 'design-pack-resolver' -%}

  {%- if dp_enabled -%}
    {{ dp_asset | append: '.css.liquid' | asset_url | stylesheet_tag }}
  {%- endif -%}
```

- [ ] **Step 2: Swap JS loader**

Replace lines 370–372 (the `<script type="module" ...>` block):

```liquid
  {%- if dp_enabled -%}
    <script type="module" src="{{ dp_asset | append: '.js.liquid' | asset_url }}"></script>
  {%- endif -%}
```

- [ ] **Step 3: Swap body scope classes**

Replace the `{%- if settings.ph_active_design != 'none' %} ph-client ph-client--{{ settings.ph_active_design }} data-ph-design="{{ settings.ph_active_design }}"{%- endif %}` fragment in the `<body ...>` tag with:

```liquid
{%- if dp_enabled %} ph-client ph-client--{{ dp_active }} data-ph-design="{{ dp_active }}"{%- endif %}
```

- [ ] **Step 4: Rename client-demo.js**

Run: `git mv assets/client-demo.js assets/client-demo.js.liquid` (workdir `phantom-theme-v2.2.0/`). Content is plain JS with zero Liquid tags — Shopify rendering output is byte-identical. Verify: `client-demo.js` is loaded ONLY from theme.liquid (pre-verified by grep; re-run `Get-ChildItem -Recurse -Include *.liquid,*.js,*.json -Path layout,snippets,sections,templates,config | Select-String -Pattern "client-demo\.js"` → zero matches).

- [ ] **Step 5: Verify zero `ph_active_design` remains in theme code**

Run: `Get-ChildItem -Recurse -Include *.liquid -Path layout,snippets,sections,templates | Select-String -Pattern "ph_active_design"` → zero matches. Also `Select-String -Path "config\*.json" -Pattern "ph_active_design"` → zero matches.

- [ ] **Step 6: Re-run registry gate (asset checks now strict for demo)**

Run: `node designs/build/check-registry.mjs` (workdir `phantom-theme-v2.2.0/`)
Expected: all PASS including `asset exists client-demo.css.liquid` and `asset exists client-demo.js.liquid`.

- [ ] **Step 7: Commit Tasks 3 + 4 + 5**

```bash
git add phantom-theme-v2.2.0/config/settings_schema.json phantom-theme-v2.2.0/config/settings_data.json phantom-theme-v2.2.0/locales/ phantom-theme-v2.2.0/layout/theme.liquid phantom-theme-v2.2.0/assets/client-demo.js phantom-theme-v2.2.0/assets/client-demo.js.liquid
git commit -m "feat(design-pack): Design Packs settings, resolver-driven theme.liquid, legacy demo compat (Wave 0 T1)
- settings_schema: replace 'Client designs' group with 'Design Packs'
  (active_design_pack, default aether) + pack-owned AETHER token group
  (aether_primary/accent/bg/surface/text/muted/border/sale, fonts, radius,
  dark_light, motion) with frozen-frontend palette defaults.
- settings_data: active_design_pack=aether (replaces ph_active_design=none).
- locales x7: design_pack.* + aether.* keys; ph_designs removed.
- theme.liquid: generic resolver-driven loader (CSS + JS + body scope root);
  zero pack-name conditionals; legacy demo/none behavior preserved.
- assets: client-demo.js -> client-demo.js.liquid (uniform .js.liquid
  convention; content unchanged; sole loader updated)."
```

---

## Task 6: QA battery — all gates green

**Files:** none modified (verification only).

- [ ] **Step 1: theme-check**

Run: `shopify theme check` (workdir `phantom-theme-v2.2.0/`)
Expected: `0 offenses` (274 files). This command is standalone (no store auth required). If it still prompts, run `shopify theme check --version` first to confirm the CLI, then re-run plain `shopify theme check`.

- [ ] **Step 2: registry integrity gate**

Run: `node designs/build/check-registry.mjs` (workdir `phantom-theme-v2.2.0/`)
Expected: `REGISTRY: PASS`, exit 0.

- [ ] **Step 3: legacy demo pipeline regression**

Run: `node designs/build/build.mjs --slug demo --check` (workdir `phantom-theme-v2.2.0/`)
Expected: build check passes (no >10% size growth) — proves the demo pipeline/asset chain is untouched.

- [ ] **Step 4: zero pack-name literals audit in theme.liquid**

Run: `Select-String -Path "layout\theme.liquid" -Pattern "aether|client-demo|ph_active_design"` (workdir `phantom-theme-v2.2.0/`)
Expected: zero matches — the resolver render tag (`design-pack-resolver`) and generic `dp_*` loader lines contain no pack-name literals. This proves theme.liquid has zero pack-specific conditional logic.

- [ ] **Step 5: git diff audit**

Run: `git status --short` and `git diff --stat` (repo root).
Expected: exactly these changed paths:
- `phantom-theme-v2.2.0/snippets/design-pack-resolver.liquid` (new)
- `phantom-theme-v2.2.0/designs/build/check-registry.mjs` (new)
- `phantom-theme-v2.2.0/config/settings_schema.json`
- `phantom-theme-v2.2.0/config/settings_data.json`
- `phantom-theme-v2.2.0/layout/theme.liquid`
- `phantom-theme-v2.2.0/assets/client-demo.js` → `client-demo.js.liquid` (rename)
- `phantom-theme-v2.2.0/locales/*.schema.json` ×7
Plus the pre-existing untracked `frontend/` (repo root — untouched, not staged).

- [ ] **Step 6: PHANTOM untouched-file audit**

Run: `git diff --stat HEAD` and confirm ZERO changes under `sections/`, `snippets/` (except the new resolver), `assets/` (except the rename), `templates/`, `theme.js`, `theme.css.liquid`, `phantom-vendor.js`, `layout/theme.liquid` (only the 3 authorized edits). Also `git status` must show NO modified files outside the authorized list.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore(design-pack): Wave 0 T1 QA — registry gate + audits green (theme-check 0 offenses)"
```

Actually NO — QA is verification, not a content change. If everything is already committed in Tasks 2 and 5 commits, skip this commit. Only commit if QA produced a fix (e.g., a locale typo fix). Do not create an empty commit.

---

## Task 7: Final report

- [ ] **Step 1: Collect results**

Run: `git log --oneline -3` (repo root) to capture the new commit hash(es); `node designs/build/check-registry.mjs` output; `shopify theme check` output.

- [ ] **Step 2: Report exactly**

```
WAVE 0 T1 STATUS: PASS / FAIL
FILES CREATED: ...
FILES MODIFIED: ...
FILES UNTOUCHED: ...
REGISTRY CHECK: ...
THEME-CHECK: ...
LEGACY DEMO: ...
AETHER DEFAULT: ...
INVALID FALLBACK: ...
BLANK FALLBACK: ...
PHANTOM REGRESSION: ...
UNEXPECTED CHANGES: NONE / LIST
COMMIT: ...
NEXT TASK: Wave 0 T2 — AETHER skeleton assets (NOT authorized this session — STOP)
```

- [ ] **Step 3: STOP** — do not proceed to T2. Await explicit authorization.

---

## Wave 0 remaining tasks (NOT authorized this session — definitions for future sessions)

### Task T2: AETHER skeleton assets
**Files:** create `phantom-theme-v2.2.0/assets/aether.css.liquid` (≤ 60 KB budget, `.ph-client--aether` token scope `--aether-*` consuming `settings.aether_*`, zero visual rules — skeleton only), `aether.js.liquid` (≤ 40 KB budget, stub subscribing to `phantom:ready` + `theme.Sections`, never replacing theme.js lifecycle), optionally `aether.placeholders.json`. **Acceptance:** registry gate asset checks turn strict (default-pack exception auto-expires); theme-check 0 offenses; `node designs/build/check-registry.mjs` all PASS.

### Task T3: Template archives + promotion/rollback contract
**Files:** create `phantom-theme-v2.2.0/templates/product.aether.json`, `collection.aether.json`, `index.aether.json` (archives via `*.phantom.json` naming where needed); implement the §8 contract docs (`snapshot → validate → promote → regression → commit`). **Acceptance:** suffixed-template naming verified against §4 reserved list; rollback paths deterministic; theme-check 0 offenses.

### Task T4: Docs materialization
**Files:** `phantom-theme-v2.2.0/docs/design-packs/registry.md`, `design-pack-contract.md`, `conversion-contract.md`, `failure-register.md`, `phantom-theme-v2.2.0/docs/aether/manifest.md` (from spec §§7–13). **Acceptance:** spec §17 report format documented; registry doc teaches NOVA registration.

### Task T5: AETHER chrome
**Files:** AETHER alternates for `sections/header-group.json`, `footer-group.json`, `popup-group.json` (schema-level, resolving via `dp_active`). **Acceptance:** chrome switches with pack; PHANTOM chrome remains default when `none`; theme-check 0 offenses.

**Waves 1–3 (later):** W1 AETHER commerce core (hero, featured-products, collection-grid, product, cart-items), W2 content/blog, W3 classic accounts — each wave = plan + QA gate per spec §15.