# Template Promotion & Rollback Contract — Design Pack Runtime

> Binding contract, spec §8 (Design Pack Architecture, `docs/superpowers/specs/2026-08-16-phantom-design-pack-architecture.md`). Materialized in Wave 0 T3. Referenced by `docs/design-packs/registry.md` (Wave 0 T4).

## 1. Naming rules (spec §8, amendment 3)

OS 2.0 suffixed templates `{base}.{suffix}.json` are valid and editor-discoverable. Conventions:

- `{base}.{pack}.json` — pack alternates (e.g. `index.aether.json`, `product.aether.json`).
- `{base}.phantom.json` — **reserved** for archived PHANTOM base compositions (created only at promotion time).
- Existing suffixes must never be reused: `collection-landing`, `no-promos`, `no-sidebar`, `about`, `contact`, `demo`, `faq`, `full-width`, `brand-story`, `gift-card`, `high-variant`, `modal`, `preorder`, `product-landing` (verified 2026-08-17; `aether` and `phantom` are unreserved).

Page-type map (spec §8 table):

| Page type | Base (default = promoted pack) | Pack alternates | PHANTOM archives |
|---|---|---|---|
| home | `index.json` (PHANTOM today) | `index.aether.json` | `index.phantom.json` at promotion |
| collection | no base today | `collection.aether.json` | existing suffixed variants untouched |
| product | no base today | `product.aether.json` | existing suffixed variants untouched |
| blog/article/search/cart/404/page/list-collections/password | AETHER replaces base at promotion | `*.aether.json` | `*.phantom.json` at promotion |
| customers/* | classic Liquid — AETHER versions replace content in place | — | git history only |
| gift_card / cart.ajax | untouched | — | — |

## 2. Promotion procedure (deterministic — never "copy and flip")

```
PRE-PROMOTION SNAPSHOT  →  VALIDATE  →  PROMOTE  →  REGRESSION  →  COMMIT
```

1. **Snapshot:** before any base-template change, archive the current base composition verbatim (PHANTOM bases → `{base}.phantom.json`; a previously promoted pack's base → `{base}.{pack}.backup.json`, committed alongside).
2. **Validate:** theme-check 0 offenses on the staged tree; `node designs/build/check-registry.mjs` green; pack QA gates green.
3. **Promote:** copy `{base}.{pack}.json` → base template name; flip `active_design_pack` (settings_data default preset).
4. **Regression:** screenshots at 1440/992/768/390 vs the pack's frozen visual source; mixed-composition smoke test (pack + PHANTOM sections on one template); `demo` legacy proof.
5. **Commit:** the promotion lands as its own commit, never mixed with unrelated changes.

## 3. Rollback (deterministic)

Restore the base composition from its archive — `restore index.phantom.json` for PHANTOM bases, `{base}.{pack}.backup.json` for a previously promoted pack — and revert the `active_design_pack` value **in the same commit**. No manual re-composition ever.

## 4. Wave 0 T3 state of the alternates

- `templates/index.aether.json` — verbatim mirror of the current `index.json` base composition (zero visual delta at promotion until Wave 1 swaps in `aether-*` sections).
- `templates/collection.aether.json` / `product.aether.json` — fresh compositions from existing PHANTOM sections (no base exists for these page types; AETHER sections land in Wave 1 and replace the section types in place).
- `index.phantom.json` is **not** created yet — archives are created by the snapshot step at promotion time only.