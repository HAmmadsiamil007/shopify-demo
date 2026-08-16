# Component Manifest — designs/demo

```yaml
design: demo
version: 0.1.0
status: built
```

## Manifest

| Shopify section (`sections/*.liquid`) | Role | Client component | CSS scope hook | JS controller | z-index |
|---|---|---|---|---|---|
| `client-demo-hero.liquid` | Hero (eyebrow, image/placeholder, title, subtitle, CTA) | `.ph-client__hero` | `.ph-client--demo .ph-client__hero` | `Hero` (reveal via IO) | ≤ auto |
| `client-demo-collection.liquid` | Featured collection grid (3-up, badges, sold-out) | `.ph-client__collection` / `.ph-client__card` | `.ph-client--demo .ph-client__collection` | `Collection` (reveal via IO) | ≤ auto |
| `client-demo-footer.liquid` | Footer (brand, menu, text, copyright) | `.ph-client__footer` | `.ph-client--demo .ph-client__footer` | none | ≤ auto |

## Rules

- Every client component is scoped (hook always under `.ph-client--demo`).
- Every JS controller implements `destroy()` (contract §2).
- Every animated element respects `prefers-reduced-motion`.
- z-index values ≤ 10000; demo uses none above auto.
