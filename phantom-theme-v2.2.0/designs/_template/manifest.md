# Component Manifest — designs/{slug}

One entry per Shopify section (or block) the design owns.
This is the design↔engine contract: every row must be filled before activation.

```yaml
design: {slug}
version: 0.1.0
status: draft            # draft | built | verified | active
```

## Manifest

| Shopify section (`sections/*.liquid`) | Role | Client component | CSS scope hook | JS controller | Notes |
|---|---|---|---|---|---|
| `header.liquid` | Commerce header (sticky) | `.ph-header` | `.ph-client .ph-header` | `Header` in `client-{slug}.js` | z-sticky=5000 |
| `main-product.liquid` | PDP media + buy box | `.ph-pdp` | `.ph-client .ph-pdp` | `Pdp` | uses `pdp-media-gallery.liquid` |
| ... | | | | | |

## Rules

- Every client component is **scoped** (hook always under `.ph-client`).
- Every JS controller implements `destroy()` (contract §2).
- Every section with an animation has a `prefers-reduced-motion` fallback.
- z-index values must be ≤ 10000 and listed here for audit.