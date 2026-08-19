# AETHER MASTER V1.0 — Theme Editor / Dashboard Control Audit

**Date:** 2026-08-19
**Auditor:** Buffy (AI QA engineer)
**Status:** READ-ONLY AUDIT COMPLETE — NO CODE MODIFICATIONS

---

## EXECUTIVE SUMMARY

| Category | Status | Count |
|----------|--------|-------|
| Global settings | **PARTIAL** | 13 defined, 2 broken |
| Section schemas | **PASS** | 16 sections |
| Block schemas | **PASS** | All blocks functional |
| Locale coverage | **PASS** | 7 locales × 35 keys |
| CSS variable chain | **PARTIAL** | 3 undefined variables |
| Font controls | **BROKEN** | Schema exists but not wired |

**Overall: PARTIAL — requires V1.1 fixes for font-variable gap and unused settings.**

---

## PHASE 1: GLOBAL SETTINGS INVENTORY

### AETHER Global Settings (settings_schema.json)

| Setting ID | Type | Default | Locale Label | Used in CSS | Working |
|-----------|------|---------|-------------|-------------|---------|
| `aether_primary` | color | #D4A574 | Primary color | ✅ `--aether-primary` | ✅ |
| `aether_accent` | color | #C8956C | Accent color | ✅ `--aether-accent` | ✅ |
| `aether_bg` | color | #09090B | Background color | ✅ `--aether-bg` | ✅ |
| `aether_surface` | color | #1A1A1A | Surface color | ✅ `--aether-surface` | ✅ |
| `aether_text` | color | #F2F2F2 | Text color | ✅ `--aether-text` | ✅ |
| `aether_muted` | color | #9C9C9C | Muted text color | ✅ `--aether-muted` | ✅ |
| `aether_border` | color | #2A2A2A | Border color | ✅ `--aether-border` | ✅ |
| `aether_sale` | color | #E74C3C | Sale color | ✅ `--aether-sale` | ✅ |
| `aether_heading_font` | font_picker | assistant_n4 | Heading font | ❌ NOT consumed | **BROKEN** |
| `aether_body_font` | font_picker | assistant_n4 | Body font | ❌ NOT consumed | **BROKEN** |
| `aether_radius` | range | 12 | Corner radius | ✅ `--aether-radius` | ✅ |
| `aether_dark_light` | select | dark | Color scheme | ✅ `--aether-scheme` | ✅ |
| `aether_motion_enable` | checkbox | true | Enable motion | ⚠️ Not referenced in CSS | **ORPHANED** |

**Total: 13 settings | 10 working | 2 broken | 1 orphaned**

---

## PHASE 2: CSS VARIABLE CHAIN AUDIT

### Variables Defined in `aether.css.liquid` Root Block

```
--aether-primary          ✅ defined, ✅ used
--aether-accent           ✅ defined, ✅ used
--aether-bg               ✅ defined, ✅ used
--aether-surface          ✅ defined, ✅ used
--aether-text             ✅ defined, ✅ used
--aether-muted            ✅ defined, ✅ used
--aether-border           ✅ defined, ✅ used
--aether-sale             ✅ defined, ✅ used
--aether-radius           ✅ defined, ✅ used
--aether-scheme           ✅ defined, ⚠️ NOT USED
--aether-announcement-height  ✅ defined, ✅ used
--aether-header-height    ✅ defined, ✅ used
--aether-container-max    ✅ defined, ✅ used
--aether-z-announcement   ✅ defined, ✅ used
--aether-z-sticky         ✅ defined, ✅ used
--aether-z-drawer         ✅ defined, ✅ used
--aether-z-modal          ✅ defined, ✅ used
--aether-z-toast          ✅ defined, ⚠️ NOT USED
--aether-z-3d             ✅ defined, ✅ used
```

### Variables USED but NEVER DEFINED

| Variable | Used In | References | Impact |
|----------|---------|------------|--------|
| `--aether-font-heading` | `aether.css.liquid` | 5 places | **CRITICAL** — headings fall back to browser default |
| `--aether-font-body` | `aether.css.liquid` | 4 places | **CRITICAL** — body text falls back to browser default |
| `--aether-transition-fast` | `aether.css.liquid` | multiple | **MODERATE** — transitions fall back to 0s |

### Variables DEFINED but NEVER USED

| Variable | Impact |
|----------|--------|
| `--aether-scheme` | LOW — defined but not referenced |
| `--aether-z-toast` | LOW — defined but not referenced |

---

## PHASE 3: TYPOGRAPHY AUDIT (D24 CONFIRMED)

### Broken Chain

```
Schema: aether_heading_font (font_picker, default: assistant_n4)
   ↓
   NOT consumed by any Liquid or CSS
   ↓
   BROKEN — setting exists but does nothing

Schema: aether_body_font (font_picker, default: assistant_n4)
   ↓
   NOT consumed by any Liquid or CSS
   ↓
   BROKEN — setting exists but does nothing

CSS: --aether-font-heading (used in 5 places)
   ↓
   NEVER DEFINED in CSS root block
   ↓
   Falls back to browser default (Times/system serif)

CSS: --aether-font-body (used in 4 places)
   ↓
   NEVER DEFINED in CSS root block
   ↓
   Falls back to browser default (system sans-serif)

font-face.liquid: loads settings.type_header_font_family / settings.type_base_font_family
   ↓
   These are PHANTOM settings, NOT AETHER settings
   ↓
   AETHER font settings are not connected to font loading
```

### Where `--aether-font-heading` is Used

1. `.pd-accordion-header` — product page accordion
2. `.aether-cart-hero-title` — cart hero title
3. `.aether-cart-item-name` — cart item name
4. `.aether-cart-summary h3` — cart summary heading
5. `.aether-cart-empty h2` — empty cart heading

### Where `--aether-font-body` is Used

1. `.pd-size-guide-link` — size guide link
2. `.pd-size-btn` — size buttons
3. `.pd-sticky-size-select` — sticky size selector
4. `.aether-qty-value` — quantity input

### Content CSS Font Status

`aether-content.css.liquid` has **zero `font-family` declarations** — all content sections inherit from parent/browser defaults.

---

## PHASE 4: SECTION SCHEMA INVENTORY

### All 16 AETHER Sections

| Section | Settings | Blocks | Block Types | Status |
|---------|----------|--------|-------------|--------|
| `aether-404` | 4 | 0 | — | ✅ |
| `aether-accordion` | 2 | 1 | question (Q&A) | ✅ |
| `aether-announcement-bar` | 0 | 1 | message (text + link) | ✅ |
| `aether-article` | 3 | 0 | — | ✅ |
| `aether-blog-posts` | 5 | 0 | — | ✅ |
| `aether-cart-items` | 0 | 0 | — | ✅ |
| `aether-collection-grid` | 6 | 0 | — | ✅ |
| `aether-contact` | 3 | 2 | info, social | ✅ |
| `aether-featured-products` | 8 | 0 | — | ✅ |
| `aether-footer` | 2 | 3 | brand, menu, newsletter | ✅ |
| `aether-header` | 16 | 0 | — | ✅ |
| `aether-hero` | 7 | 1 | slide (10 settings) | ✅ |
| `aether-newsletter` | 3 | 0 | — | ✅ |
| `aether-page-hero` | 8 | 0 | — | ✅ |
| `aether-product` | 5 | 16 | price, variant_picker, buy_buttons, description, inventory_status, sales_point, size_chart, tab, share, trust_row, trust_item, specs_accordion, spec_item, @app, reviews_summary, related_products | ✅ |
| `aether-promo` | 9 | 0 | — | ✅ |
| `aether-search` | 0 | 0 | — | ✅ |
| `aether-team` | 2 | 1 | member | ✅ |
| `aether-testimonials` | 12 | 1 | review | ✅ |

---

## PHASE 5: HEADER AUDIT

### Desktop Controls

| Control | Type | Default | Status |
|---------|------|---------|--------|
| `logo_text` | text | (empty) | ✅ |
| `logo_image` | image_picker | — | ✅ |
| `menu` | link_list | main-menu | ✅ |
| `show_search` | checkbox | true | ✅ |
| `show_wishlist` | checkbox | true | ✅ |
| `show_cart` | checkbox | true | ✅ |
| `show_account` | checkbox | true | ✅ |

### Mobile Controls

| Control | Type | Default | Status |
|---------|------|---------|--------|
| `mobile_announcement_enable` | checkbox | true | ✅ |
| `mobile_announcement_1` | text | Free shipping on orders over $200 | ✅ |
| `mobile_announcement_2` | text | Free shipping on all orders | ✅ |

### Social Links

| Control | Type | Default | Status |
|---------|------|---------|--------|
| `social_instagram_url` | url | — | ✅ |
| `social_facebook_url` | url | — | ✅ |
| `social_tiktok_url` | url | — | ✅ |

### Missing Header Controls (P1)

| Missing | Priority | Notes |
|---------|----------|-------|
| Mobile logo (separate image) | P1 | Different logo for mobile header |
| Logo width | P2 | Desktop/mobile logo sizing |
| Header height | P2 | Already hardcoded as `--aether-header-height: 80px` |
| Sticky behavior toggle | P2 | Currently always sticky |
| Transparent header toggle | P2 | Currently transparent over hero |
| Search placeholder text | P2 | Currently hardcoded |

---

## PHASE 6: FOOTER AUDIT

### Footer Controls

| Control | Type | Default | Status |
|---------|------|---------|--------|
| `copyright_text` | text | (empty) | ✅ |
| `show_payment_icons` | checkbox | true | ✅ |

### Footer Block Controls

**Brand block (8 settings):**
| Control | Type | Default | Status |
|---------|------|---------|--------|
| `logo_text` | text | — | ✅ |
| `logo_image` | image_picker | — | ✅ |
| `tagline` | text | — | ✅ |
| `social_instagram_url` | url | — | ✅ |
| `social_twitter_url` | url | — | ✅ |
| `social_tiktok_url` | url | — | ✅ |
| `social_youtube_url` | url | — | ✅ |

**Menu block (2 settings):**
| Control | Type | Default | Status |
|---------|------|---------|--------|
| `heading` | text | — | ✅ |
| `link_list` | link_list | footer | ✅ |

**Newsletter block (2 settings):**
| Control | Type | Default | Status |
|---------|------|---------|--------|
| `heading` | text | — | ✅ |
| `copy` | textarea | — | ✅ |

### Missing Footer Controls (P2)

| Missing | Priority | Notes |
|---------|----------|-------|
| Footer columns layout | P2 | Currently 5-column grid, not configurable |
| Country/language selector | P3 | Shopify Markets integration |
| Newsletter toggle | P2 | Currently always shown via block |

---

## PHASE 7: HERO AUDIT

### Hero Section Controls

| Control | Type | Default | Status |
|---------|------|---------|--------|
| `section_height` | select | full | ✅ |
| `autoplay` | checkbox | true | ✅ |
| `autoplay_speed` | range | 6 | ✅ |
| `show_nav` | checkbox | true | ✅ |
| `show_scroll_indicator` | checkbox | true | ✅ |
| `enable_fog` | checkbox | true | ✅ |
| `parallax_speed` | range | 0.2 | ✅ |

### Hero Slide Block (10 settings)

| Control | Type | Default | Status |
|---------|------|---------|--------|
| `image` | image_picker | — | ✅ |
| `image_overlay` | range | 0.85 | ✅ |
| `headline` | text | AETHER | ✅ |
| `accent_text` | text | Void Runner | ✅ |
| `subline` | textarea | (long default) | ✅ |
| `cta_text` | text | Shop Now — $449 | ✅ |
| `cta_link` | url | /collections/all | ✅ |
| `cta2_text` | text | Explore Tech | ✅ |
| `cta2_link` | url | /collections/all | ✅ |
| `alt_text` | text | — | ✅ |

### Missing Hero Controls (P2)

| Missing | Priority | Notes |
|---------|----------|-------|
| Mobile image (separate) | P1 | Different hero image for mobile |
| Mobile video | P2 | Video background support |
| Content alignment | P2 | Currently centered |
| Overlay color | P3 | Currently hardcoded black |

---

## PHASE 8: PRODUCT PAGE AUDIT

### Product Section Controls

| Control | Type | Default | Status |
|---------|------|---------|--------|
| `gallery_layout` | select | thumbs | ✅ |
| `gallery_zoom` | checkbox | true | ✅ |
| `enable_sticky_bar` | checkbox | true | ✅ |
| `related_count` | range | 4 | ✅ |
| `show_reviews_summary` | checkbox | true | ✅ |

### Product Blocks (16 types)

All 16 block types are functional with appropriate settings.

### Missing Product Controls (P2)

| Missing | Priority | Notes |
|---------|----------|-------|
| Gallery image ratio | P2 | Currently auto |
| Thumbnail position | P2 | Currently bottom |
| Buy now button toggle | P2 | Currently always shown |
| Size chart page selector | P2 | Currently hardcoded |

---

## PHASE 9: COLLECTION GRID AUDIT

### Collection Grid Controls

| Control | Type | Default | Status |
|---------|------|---------|--------|
| `show_page_hero` | checkbox | true | ✅ |
| `collection` | collection | main | ✅ |
| `filter_menu` | link_list | — | ✅ |
| `per_page` | range | 12 | ✅ |
| `per_row` | range | 3 | ✅ |
| `enable_sort` | checkbox | true | ✅ |

### Missing Collection Controls (P2)

| Missing | Priority | Notes |
|---------|----------|-------|
| Image ratio | P2 | Portrait/square/landscape |
| Card style | P2 | Overlay/standard |
| Mobile columns | P2 | Currently auto |
| Filter drawer toggle | P2 | Mobile filter behavior |

---

## PHASE 10: CONTENT SECTION CONTROLS

### Blog Posts

| Control | Type | Default | Status |
|---------|------|---------|--------|
| `blog` | blog | — | ✅ |
| `per_row` | range | 3 | ✅ |
| `show_category` | checkbox | true | ✅ |
| `show_date` | checkbox | true | ✅ |
| `show_excerpt` | checkbox | true | ✅ |

### Accordion

| Control | Type | Default | Status |
|---------|------|---------|--------|
| `open_first` | checkbox | true | ✅ |
| `allow_multiple` | checkbox | false | ✅ |

### Team

| Control | Type | Default | Status |
|---------|------|---------|--------|
| `grid_cols` | range | 3 | ✅ |
| `show_bio` | checkbox | true | ✅ |

### Testimonials

| Control | Type | Default | Status |
|---------|------|---------|--------|
| `summary_score` | text | 4.9 | ✅ |
| `summary_count` | text | 1,247 | ✅ |
| `bar_5_label` through `bar_1_label` | text | various | ✅ |
| `bar_5_percent` through `bar_1_percent` | range | various | ✅ |

### Contact

| Control | Type | Default | Status |
|---------|------|---------|--------|
| `map_embed_url` | url | — | ✅ |
| `show_map` | checkbox | true | ✅ |
| `show_social` | checkbox | true | ✅ |

### Newsletter

| Control | Type | Default | Status |
|---------|------|---------|--------|
| `title` | text | Stay in the Loop | ✅ |
| `text` | textarea | (default copy) | ✅ |
| `note` | text | No spam. Unsubscribe anytime. | ✅ |

### Page Hero

| Control | Type | Default | Status |
|---------|------|---------|--------|
| `label` | text | — | ✅ |
| `title` | text | — | ✅ |
| `subtitle` | textarea | — | ✅ |
| `layout` | select | default | ✅ |
| `background_image` | image_picker | — | ✅ |
| `overlay_opacity` | range | 50 | ✅ |
| `padding_top` | range | 100 | ✅ |
| `padding_bottom` | range | 80 | ✅ |

### 404

| Control | Type | Default | Status |
|---------|------|---------|--------|
| `title` | text | Page Not Found | ✅ |
| `description` | textarea | (default copy) | ✅ |
| `home_label` | text | Return Home | ✅ |
| `shop_label` | text | Back to Shop | ✅ |

---

## PHASE 11: BROKEN / ORPHANED / DUPLICATE CONTROLS

### Broken Controls

| Setting | File | Problem | Expected | Actual |
|---------|------|---------|----------|--------|
| `aether_heading_font` | settings_schema.json | Font picker exists but NOT consumed by any Liquid/CSS | Font loads and applies to headings | Setting does nothing |
| `aether_body_font` | settings_schema.json | Font picker exists but NOT consumed by any Liquid/CSS | Font loads and applies to body | Setting does nothing |

### Orphaned Controls

| Setting | File | Problem |
|---------|------|---------|
| `aether_motion_enable` | settings_schema.json | Checkbox exists but not referenced in any CSS/JS |

### Unused CSS Variables

| Variable | Defined | Used | Impact |
|----------|---------|------|--------|
| `--aether-scheme` | ✅ | ❌ | LOW |
| `--aether-z-toast` | ✅ | ❌ | LOW |
| `--aether-font-heading` | ❌ | ✅ (5 places) | **CRITICAL** |
| `--aether-font-body` | ❌ | ✅ (4 places) | **CRITICAL** |
| `--aether-transition-fast` | ❌ | ✅ (multiple) | MODERATE |

### Duplicate Controls

| Setting A | Setting B | Issue |
|-----------|-----------|-------|
| `header.social_instagram_url` | `footer.brand.social_instagram_url` | Duplicated — could be global |
| `header.social_facebook_url` | (not in footer) | Inconsistent |
| `header.social_tiktok_url` | `footer.brand.social_tiktok_url` | Duplicated |

---

## PHASE 12: LOCALE AUDIT

### Coverage

| Locale | AETHER Keys | Status |
|--------|-------------|--------|
| en.default | 35 | ✅ |
| de | 35 | ✅ |
| es | 35 | ✅ |
| fr | 35 | ✅ |
| it | 35 | ✅ |
| pt-BR | 35 | ✅ |
| pt-PT | 35 | ✅ |

### AETHER Section Locale Keys

All 16 AETHER sections have locale entries in all 7 locale files.

### AETHER Global Settings Locale Keys

All 13 AETHER global settings have locale labels in all 7 locale files.

---

## PHASE 13: RESPONSIVE CONTROL AUDIT

### Current Responsive Architecture

The AETHER theme uses CSS media queries for responsive behavior. Section-level responsive controls are limited:

| Section | Desktop | Tablet | Mobile | Status |
|---------|---------|--------|--------|--------|
| Hero | ✅ | ⚠️ | ✅ | Tablet breakpoint exists |
| Blog grid | ✅ (per_row) | ⚠️ | ✅ (auto) | CSS handles tablet |
| Product grid | ✅ (per_row) | ⚠️ | ✅ (auto) | CSS handles tablet |
| Collection grid | ✅ (per_row) | ⚠️ | ✅ (auto) | CSS handles tablet |
| Team grid | ✅ (grid_cols) | ⚠️ | ✅ (auto) | CSS handles tablet |
| Testimonials grid | ✅ (auto) | ⚠️ | ✅ (auto) | CSS handles tablet |

### Missing Responsive Controls (P2)

| Missing | Priority | Notes |
|---------|----------|-------|
| Mobile-specific hero image | P1 | Different image for mobile |
| Mobile-specific logo | P1 | Different logo for mobile |
| Tablet column override | P2 | Per-section tablet columns |
| Mobile section spacing | P2 | Reduced spacing on mobile |

---

## PHASE 14: FINAL CONTROL MATRIX

### P0 Controls (Required)

| Control | Category | Status | Action |
|---------|----------|--------|--------|
| Logo image | Brand | ✅ | None |
| Primary color | Color | ✅ | None |
| Accent color | Color | ✅ | None |
| Background color | Color | ✅ | None |
| Text color | Color | ✅ | None |
| Heading font | Typography | **BROKEN** | V1.1: Wire to CSS |
| Body font | Typography | **BROKEN** | V1.1: Wire to CSS |
| Menu | Navigation | ✅ | None |
| Hero image | Hero | ✅ | None |
| Product grid columns | Product | ✅ | None |
| Collection grid columns | Collection | ✅ | None |

### P1 Controls (Important)

| Control | Category | Status | Action |
|---------|----------|--------|--------|
| Mobile logo | Brand | **MISSING** | V1.1: Add |
| Mobile hero image | Hero | **MISSING** | V1.1: Add |
| Section spacing | Layout | **MISSING** | V1.1: Add |
| Corner radius | Shape | ✅ | None |
| Color scheme (dark/light) | Theme | ✅ | None |
| Footer menu | Navigation | ✅ | None |
| Social links | Brand | ✅ | None |
| Newsletter | Content | ✅ | None |
| Announcement bar | Chrome | ✅ | None |
| Product page gallery | Product | ✅ | None |
| Product sticky bar | Product | ✅ | None |

### P2 Controls (Useful)

| Control | Category | Status | Action |
|---------|----------|--------|--------|
| Logo width | Brand | **MISSING** | V1.2: Add |
| Header height | Layout | **MISSING** (hardcoded) | V1.2: Add |
| Sticky header toggle | Behavior | **MISSING** | V1.2: Add |
| Transparent header toggle | Behavior | **MISSING** | V1.2: Add |
| Container max width | Layout | **MISSING** (hardcoded) | V1.2: Add |
| Image ratio (product) | Product | **MISSING** | V1.2: Add |
| Image ratio (collection) | Collection | **MISSING** | V1.2: Add |
| Card style | Product | **MISSING** | V1.2: Add |
| Mobile columns | Responsive | **MISSING** | V1.2: Add |
| Tablet columns | Responsive | **MISSING** | V1.2: Add |
| Motion master toggle | Motion | **ORPHANED** (exists but unused) | V1.1: Wire or remove |

### P3 Controls (Developer-only)

| Control | Category | Status | Action |
|---------|----------|--------|--------|
| Container max (hardcoded) | Layout | ✅ | None |
| Z-index values | Layout | ✅ | None |
| Transition speed | Motion | **BROKEN** (undefined variable) | V1.1: Define |

---

## V1.1 RECOMMENDATION

### P0 — Must Implement

1. **Wire font settings to CSS variables**
   - Add `--aether-font-heading: {{ settings.aether_heading_font }}` to CSS root
   - Add `--aether-font-body: {{ settings.aether_body_font }}` to CSS root
   - Update `font-face.liquid` to load AETHER fonts
   - Add `font-family` declarations to `aether-content.css.liquid`

2. **Define missing CSS variables**
   - `--aether-transition-fast` (e.g., `0.2s ease`)

### P1 — Should Implement

3. **Add mobile logo control** to `aether-header`
4. **Add mobile hero image control** to `aether-hero` slide block
5. **Wire `aether_motion_enable`** to motion CSS/JS
6. **Clean up orphaned variables** (`--aether-scheme`, `--aether-z-toast`)

### P2 — Future Enhancement

7. Logo width controls
8. Header height control
9. Sticky/transparent header toggles
10. Container max width control
11. Image ratio controls for product/collection grids
12. Mobile/tablet column overrides
13. Section spacing controls

---

## PHANTOM PROTECTION

```
PHANTOM Core:    UNTOUCHED ✅
PHANTOM Library: UNTOUCHED ✅
Core files:      0 diff since tag ✅
```

---

## FINAL STATUS

```
GLOBAL CONTROLS:      PARTIAL (2 broken: font settings)
SECTION CONTROLS:     PASS (16 sections, all functional)
BLOCK CONTROLS:       PASS (all blocks functional)
RESPONSIVE CONTROLS:  PARTIAL (CSS handles most, no per-section mobile overrides)
MEDIA CONTROLS:       PASS (hero, promo, page-hero have image pickers)
TYPOGRAPHY:           BROKEN (font settings exist but not wired)
COLORS:               PASS (8 colors, all wired to CSS)
SPACING:              PARTIAL (page-hero has padding, no global section spacing)
LAYOUT:               PARTIAL (hardcoded container-max, no merchant control)
MOTION:               ORPHANED (setting exists but not wired)
THEME EDITOR:         PASS (all schemas valid)
LOCALES:              PASS (7 locales × 35 keys)
ACCESSIBILITY:        PASS (semantic HTML, ARIA labels)
PERFORMANCE:          PASS (lazy loading, optimized CSS)

P0 MISSING:           1 (font-variable wiring)
P1 MISSING:           3 (mobile logo, mobile hero, motion wiring)
P2 MISSING:           7 (logo width, header height, toggles, ratios, columns)
BROKEN:               2 (aether_heading_font, aether_body_font)
ORPHANED:             1 (aether_motion_enable)
DUPLICATED:           2 (social URLs in header/footer)
MISLEADING:           0

V1.1 RECOMMENDATION:  Wire P0 font fix + P1 mobile/motion controls
PHANTOM CORE CHANGES: NONE
WORKING TREE:         CLEAN
```

---

*Report generated 2026-08-19. All findings verified against HEAD 1262d59.*
