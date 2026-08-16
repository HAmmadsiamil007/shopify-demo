# Design → Shopify Mapping — designs/demo

## Data surface (design side)

| Design element (source) | Anchor | Breakpoint behavior | PHANTOM data source |
|---|---|---|---|
| Hero eyebrow "Aurora Studio" | `.ph-client__hero-eyebrow` | static | `section.settings.title` |
| Hero headline | `.ph-client__hero-title` | static | `section.settings.title` |
| Hero image/placeholder | `.ph-client__hero-placeholder` | static | `section.settings.image` (falls back to placeholder) |
| Hero subtitle | `.ph-client__hero-subtitle` | static | `section.settings.subtitle` |
| Hero CTA "Shop the collection" | `.btn.btn-primary` | static | `section.settings.cta_label` + `cta_url` |
| Collection title "Featured pieces" | `.ph-client__collection-title` | static | `section.settings.heading` |
| Product card grid (3-up) | `.row.g-4 > .col-12.col-sm-6.col-md-4` | 1 → 2 → 3 cols @ 576/768 | `collection.products` (limit) |
| Card media | `.ph-client__card-media img` | ratio 4/5 | `product.featured_image` |
| Card title | `.ph-client__card-title a` | — | `product.title` + `product.url` |
| Card price | `.ph-client__card-price` | — | `product.price` via `product.price` snippet |
| Sale badge | `.ph-client__badge` | — | `product.compare_at_price > product.price` |
| Sold-out overlay | `.ph-client__card-soldout` | — | `product.available == false` |
| Footer brand/text | `.ph-client__footer-brand` | stack → 3-col @ 768 | `section.settings.brand_text` / `footer_text` |
| Footer links | `.ph-client__footer-links` | — | `section.settings.menu` (link_list) |
| Copyright | `.ph-client__footer-copy` | — | `shop.name` + current year |

## Engine notes

- Liquid replaces data, never design: layout/styling come from the frozen source; Liquid fills products, collection, shop, menus.
- Client breakpoints (576/768/992/1200/1400) apply inside `.ph-client--demo` only (contract §1.5).
- Reused PHANTOM commerce snippets: `product.price`, `ui-badge` (contract: client owns grid markup, PHANTOM owns commerce data).
- Every element above resolves to an existing section/snippet or is declared NEW (the 3 `client-demo-*` sections — added to the theme in Task 4).
