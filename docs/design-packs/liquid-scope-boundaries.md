# Liquid Scope Boundaries — `{% render %}` vs `{% include %}` (PHANTOM + AETHER)

> User-required boundary document (Wave 1 Task 12). Records exactly where the theme depends on **shared Liquid scope**, why it cannot silently become `render`, and where `render` is the correct, preferred pattern.

## 1. The discovery (Wave 0 Task 1)

`{% render %}` creates an **isolated scope**: variables assigned *inside* the rendered snippet are invisible to the caller, and the caller's variables are not passed unless declared in the `render` call's parameters. `{% include %}` shares the surrounding scope in both directions.

The Design Pack resolver/loader path **requires shared scope**. `snippets/design-pack-resolver.liquid` assigns the registry outputs as variables that `layout/theme.liquid` consumes directly:

- Invoked with `{% include %}` at `layout/theme.liquid:38` (guarded by `{%- comment %} theme-check-disable DeprecatedTag ...` — **never remove those guards**).
- Consumed at `theme.liquid:42-44` (asset link/script + `body` class) and `theme.liquid:377-379` / `404-413` (`{% sections dp_header_group %}` / `dp_popup_group` / `dp_footer_group`).
- Assigns produced: `dp_active`, `dp_asset`, `dp_enabled`, `dp_header_group`, `dp_footer_group`, `dp_popup_group`.

## 2. The boundary (binding)

- `design-pack-resolver.liquid` **MUST be included, never rendered** — `render` would discard its assigns and the layout would lose the registry state.
- The `dp_*` assigns **MUST NOT be re-created** inside any render scope (no "helper snippet that re-assigns `dp_*`"). There is exactly one source of truth for the registry.
- Everything else in the theme may use `render` freely.

## 3. Why not "fix" it with render + re-assign

The apparent modernization — `render 'design-pack-resolver'` and re-assigning the outputs from the rendered snippet — is the trap:

1. It forks the registry (the seven positional lists in the resolver) into a second copy living in render parameters, or into a second snippet.
2. The integrity gate `designs/build/check-registry.mjs` parses the **resolver file** as the single source of truth; a render-side copy would silently desync and the gate would no longer be guarding what the theme actually uses.
3. This failure mode is recorded in `docs/design-packs/failure-register.md` (row 19) and the Wave 0 lessons log.

`include` is deprecated by Shopify's theme-check conventions but is **the correct, deliberate tool here**; the `theme-check-disable DeprecatedTag` comment documents the intent and keeps the gate green.

## 4. Where `render` IS fine

Section-internal snippets do not share state with the layout and should use `render` (isolated scope is a feature there):

- `aether-product-card` (rendered from `aether-featured-products`, `aether-collection-grid`, `aether-product` with explicit `product`/`variant`/`per_row`/`collection` parameters).
- `aether-pagination`, `aether-sort`, PHANTOM's own `product-price` / `form-product` / etc.
- Any snippet whose outputs are passed back through explicit `render` parameters.

Rule of thumb: **shared scope upward (layout registry) → `include`; leaf rendering → `render`.**

## 5. Reference

- `docs/superpowers/specs/2026-08-16-phantom-design-pack-architecture.md` §4 (resolution) and §14 (Core stability proof).
- `docs/design-packs/failure-register.md` rows 1 and 19 (resolver-scope failures).
- `snippets/design-pack-resolver.liquid`, `layout/theme.liquid:37-44, 377-379, 404-413`.