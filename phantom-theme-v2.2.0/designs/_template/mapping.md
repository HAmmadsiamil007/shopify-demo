# Design → Shopify Mapping — designs/{slug}

The adapter contract: how the design's source maps onto PHANTOM's data surface.
Filled during design review (Task 03 step 7).

## Data surface (design side)

| Design element (source) | Anchor | Breakpoint behavior | PHANTOM data source |
|---|---|---|---|
| Hero headline | `[data-ph-hero-title]` | stacked → 2-col @ 992 (client scale) | `section.settings.title` |
| ... | | | |

## Engine notes

- Liquid replaces data, never design: the external frontend is the source of truth
  for layout/styling; PHANTOM Liquid fills in products, collections, cart, customer, search.
- Client breakpoints (576/768/992/1200/1400) apply **inside `.ph-client` only**
  (contract §1.5). PHANTOM's scale (769/959/1050/1140) is untouched.
- Component library: every design element must resolve to an existing
  PHANTOM section/block/snippet or be declared NEW here (then added to the theme).