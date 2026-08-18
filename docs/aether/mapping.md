# AETHER — Design → Data Mapping

> Per-pack mapping (contract §3.2). Records how the frozen reference (`frontend/frontend/`, committed `a79e02a`) maps to Liquid data anchors in the AETHER Master (Wave 1). Fidelity evidence: `fidelity-report.md`.

## Class-name mapping (frozen → theme)

The frozen reference uses unprefixed class names; the AETHER port renames them with the `aether-` prefix (CSS isolation contract §4 — pack classes are `{pack}-*`). Mapping used during the port (sections built from these, verified in Wave 1 QA):

| Frozen | Theme | Section |
|---|---|---|
| `.announcement-bar` | `.aether-announcement-bar` | `aether-announcement-bar` |
| `.header` / `.main-nav` / `.header-actions` | `.aether-header` / `.aether-header__nav` / `.aether-header__actions` | `aether-header` |
| `.mobile-header` / `.mobile-menu` | `.aether-mobile-header` / `.aether-mobile-menu` | `aether-header` |
| `.hero-slider` / `.hero-slide-bg` / `.hero-slide-text` | `.aether-hero-swiper` / `.aether-hero-slide-bg` / `.aether-hero-slide-text` | `aether-hero` |
| `.bestsellers` | `.aether-featured-products` | `aether-featured-products` |
| `.product-card` / `.product-image` / `.product-info` | `.aether-product-card` / `.aether-product-image` / `.aether-product-info` | `aether-product-card` |
| `.page-hero` / `.filter-bar` / `.filter-buttons` | `.aether-page-hero` / `.aether-filter-bar` / `.aether-filter-buttons` | `aether-collection-grid` |
| `.shop-grid` / `.shop-pagination` | `.aether-shop-grid` / `.aether-shop-pagination` | `aether-collection-grid` |
| `.pd-*` (product detail) | `.pd-*` **unchanged** (product page kept frozen classes) | `aether-product` |
| `.cart-section` / `.cart-item*` / `.cart-summary` | `.aether-cart-section` / `.aether-cart-item*` / `.aether-cart-summary` | `aether-cart-items` |
| `.footer*` | `.aether-footer__*` | `aether-footer` |

## Data anchors (static → Liquid)

| Frozen (static) | Liquid data | Section |
|---|---|---|
| hero slides (3) | `section.blocks` (type `slide`) | `aether-hero` |
| hero headline/subline/CTA | `block.settings.headline/subline/cta_label/cta_link` | `aether-hero` |
| product cards (4 rich) | `collections[section.settings.featured_collection].products` | `aether-featured-products` |
| card image/title/price/tagline/rating | `product.featured_image`, `product.title`, `price`, `product.metafields.aether.tagline`, `product.metafields.aether.rating_*` | `aether-product-card` |
| product grid (6) | `grid_collection.products` (`collection` setting/template wins), `paginate`, `sort_by` | `aether-collection-grid` |
| filter pills | `section.settings.filter_menu` link_list (D4) | `aether-collection-grid` |
| gallery/options/qty/ATC | `product.media`, `product.options_with_values`, variant engine by option POSITION (D7), `form` | `aether-product` |
| accordion (size guide/desc) | `block.settings` (spec blocks, `default_open`) | `aether-product` |
| reviews summary/bars | `product.metafields.reviews.rating` + `product.metafields.reviews.rating_count` (bars computed in Liquid) | `aether-product` |
| related products | `product.metafields.aether.related` product refs → cards | `aether-product` |
| cart lines/summary | `cart.items`, `cart.item_count`, `cart.total_price`, `/cart/change.js` wiring (D6/D9) | `aether-cart-items` |
| announcement rotation | `block.settings.text` × N, `show_mobile_rotation` | `aether-announcement-bar` |
| footer links/newsletter/socials/payments | `link_list` settings, `form` (customer/contact), social url settings, static payment badges | `aether-footer` |

## Freeze revisions

- Frozen reference commit: `a79e02a` (repo root `frontend/frontend/`, 22 pages).
- Wave 1 shipped: commits `ec12ad0` → `904fb45` (see `fidelity-report.md` §Commits).
- DESIGN FREEZE (contract §10): TBD — pending live-store render sign-off (manual QA, no Shopify auth in dev loop).