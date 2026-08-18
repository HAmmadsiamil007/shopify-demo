# PHANTOM + AETHER — Master Client Design Workflow (Operating Model)

**Date:** 2026-08-18
**Status:** Working direction for the business (approved)
**Applies to:** all future work after AETHER Master Wave 1 (this file records the model; Wave 1 executes it via `docs/superpowers/plans/2026-08-17-phantom-design-pack-wave1.md`)

## The model in one line

> **ONE protected PHANTOM + AETHER Master → a fresh independent copy for each client → that copy's AETHER layer is transformed into the client's approved design.**

The objective is NOT a multi-theme marketplace. Do NOT build a new permanent design pack (NOVA, LUXE, client-001, …) for each client. AETHER is the reusable premium starter. The generic Design Pack Runtime/resolver may remain as future-proofing (already built and tested in Wave 0), but it is not the primary client workflow.

## Business architecture

```
                         PHANTOM MASTER
                              │
               ┌──────────────┴──────────────┐
               │                             │
          PHANTOM CORE                  AETHER MASTER
               │                             │
        Shopify commerce              Premium starter UI
        Theme runtime                 Liquid sections
        Settings                      CSS
        Adapters                      JS / motion
        Cart / search                 Templates
        Theme Editor                  Tokens / assets
               │                             │
               └──────────────┬──────────────┘
                              │
                    PROTECTED MASTER
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
      CLIENT A            CLIENT B            CLIENT C
      Phone               Shoes               Furniture
          │                   │                   │
       modify               modify             modify
       AETHER               AETHER             AETHER
          │                   │                   │
          ▼                   ▼                   ▼
       Shopify             Shopify             Shopify
```

## External design process (sits above the model)

```
CLIENT REQUIREMENT
       ↓
Premium external frontend (HTML / Bootstrap / vendor CSS / theme CSS /
GSAP / Three.js / Lenis / Swiper / animations)
       ↓
CLIENT APPROVAL
       ↓
🔒 DESIGN FREEZE
       ↓
Transform AETHER in that client's copy (Liquid + Shopify data)
       ↓
QA
       ↓
DELIVER
```

## Master rule

- **PHANTOM Master is never edited for a client.** It is the golden source, versioned/tagged: `PHANTOM-AETHER-MASTER-v1.0`, `v1.1`, …
- New clients start from the latest approved master. Existing client projects stay independent unless an improvement is deliberately backported.

## What is customized per client (inside the client copy)

AETHER layer — may be heavily redesigned:

```
AETHER
├── sections
├── snippets
├── templates
├── assets
├── CSS
├── JS
├── motion
├── images
├── typography
└── tokens
```

Normally NOT touched (unless a genuine client requirement demands an infrastructure change):

```
PHANTOM CORE
PHANTOM commerce adapters
PHANTOM cart infrastructure
PHANTOM search infrastructure
PHANTOM Theme Editor/runtime
PHANTOM Library
```

## Master plan phases

### Phase 0 — Protect the foundation
- [ ] Finish Wave 0 (done), Wave 1, Wave 2, Wave 3
- [ ] Run complete theme-check, registry checks, visual parity, functional parity
- [ ] Run Theme Editor tests, mobile tests, accessibility checks, performance checks
- [ ] Verify PHANTOM regression
- [ ] Tag stable release, create immutable master baseline
- [ ] Document master version, document known limitations
- [ ] Create clean client-copy procedure

### Phase 1 — Finish AETHER as the reusable starter
- Wave 1 (current): announcement, header, footer, hero, featured products, collection grid, product, cart
- Wave 2: blog, article, page, FAQ, team, testimonials, contact, newsletter, promo, 404, search, legal
- Wave 3: customer login, register, account, addresses, password, wishlist, final QA
- Gate per wave: SPEC → PLAN → IMPLEMENT → QA → COMMIT → STOP

### Phase 2 — AETHER Master hardening
- [ ] Verify PHANTOM Core has no dependency on AETHER-specific markup
- [ ] Verify AETHER does not require PHANTOM visual markup to work
- [ ] Verify AETHER and PHANTOM sections coexist
- [ ] Verify all AETHER sections independently render / removable / reorderable
- [ ] Verify Theme Editor, app blocks, product/collection/cart/search/variant/menu/form data, localization
- Client-editability test: replace header, hero, product card, product page, collection, cart presentation, footer, typography, color system, animations without touching Core — this is the real long-term success metric

### Phase 3 — Create a client copy
- Never start from the last client's theme. Always: AETHER MASTER → COPY → CLIENT PROJECT
- `clients/client-phone/`, `clients/client-shoes/`, … — each client: own Git repo/branch, own Shopify theme, own design source, own assets, own final build
- Rule: a client copy must never modify the master

### Phase 4 — Build client design outside Shopify
- Premium frontend: HTML, Bootstrap, vendor CSS, theme CSS, GSAP, Three.js, Lenis, Swiper, animations
- `client-design/home, collection, product, cart, search, pages, assets, css, js, docs`
- Complete desktop/tablet/mobile, hover, loading, empty, error states, animations, navigation, product UX, cart UX, responsive behavior — all visual work BEFORE Shopify conversion

### Phase 5 — Client approval / Design Freeze
- CLIENT DESIGN → internal QA → client review → approval → 🔒 DESIGN FREEZE
- After freeze: no silent redesign; no "Shopify made me change it" without documentation; every structural deviation logged (ORIGINAL → WHY → SHOPIFY CONSTRAINT → NEW → VISUAL IMPACT); client changes become a new revision

### Phase 6 — Convert client frontend into the AETHER layer
- Mapping: external frontend → AETHER implementation → Shopify data (hero HTML → aether-hero.liquid, product card HTML → aether-product-card.liquid, collection HTML → aether-collection-grid.liquid, product HTML → aether-product.liquid, cart HTML → aether-cart-items.liquid)
- Rules: preserve approved DOM intent; preserve useful classes; replace hardcoded data with Liquid; keep commerce behavior native; keep Shopify schema editable; keep AETHER CSS scoped; keep AETHER JS isolated; keep responsive behavior; keep animation intent; document deviations; reuse PHANTOM adapters where appropriate

### Phase 7 — Client-specific customization boundaries
- May modify: AETHER sections/snippets/templates/CSS/JS/assets/tokens/animations/composition
- Avoid modifying: PHANTOM Core, theme.js, commerce engine, cart infrastructure, search infrastructure, existing PHANTOM adapters, PHANTOM section library — unless absolutely necessary

### Phase 8 — Client Theme Editor composition
- Client must be able to mix AETHER hero, AETHER product grid, PHANTOM promo grid, AETHER editorial, PHANTOM newsletter in one page
- Test per client: add/remove/re-add/reorder/duplicate AETHER + PHANTOM sections, modify settings, add/remove blocks, mix both, save, reload

### Phase 9 — Client commerce QA
- Product: title, images, gallery, variant selection, price, compare-at, quantity, add to cart, availability, product forms, app blocks
- Collection: products, sorting, filters, pagination, empty collection
- Cart: add, remove, quantity, cart count, subtotal, checkout, empty cart
- Search: search icon, input, predictive search, results
- Other: menus, newsletter, contact, customer pages, app blocks

### Phase 10 — Client visual QA
- External approved frontend vs Shopify implementation at 1440 / 1200 / 992 / 768 / 576 / 390
- Typography, spacing, header, hero, product cards, collection, product, cart, footer, motion, mobile, tablet
- (Wave 1 parity architecture already uses reference screenshots at 1440/768/390 + fidelity report)

### Phase 11 — Performance
- AETHER CSS ≤ 60 KB hard ceiling; measure home/collection/product/cart payloads
- Load GSAP/Swiper/Lenis/Three.js only when needed; optimize images; remove unused vendor code; no duplicate libraries

### Phase 12 — Accessibility
- Keyboard, focus, headings, images, contrast, forms, sliders, drawers, reduced motion, mobile touch

### Phase 13 — SEO
- Titles, meta, canonicals, product data, structured data, breadcrumbs, heading hierarchy, image alt, crawlable content

### Phase 14 — Freeze the delivered client
- CLIENT FINAL → Git tag → Shopify theme backup → release package → documentation
- Never use the delivered client as another client's starting point; start again from AETHER MASTER

### Phase 15 — Master improvements
- Client A reveals something valuable (e.g., a better generic variant selector): fix in client → validate → decide whether it is a reusable improvement → backport deliberately to AETHER MASTER → new master version
- Do NOT automatically push every client customization into Master

## Master vs client rules

| Change | Master | Client |
|---|---|---|
| Shopify bug fix | ✅ | ✅ |
| Generic commerce improvement | ✅ | ✅ |
| Generic accessibility improvement | ✅ | ✅ |
| Generic performance improvement | ✅ | ✅ |
| Brand colors | ❌ | ✅ |
| Client logo | ❌ | ✅ |
| Client hero | ❌ | ✅ |
| Client product-card design | ❌ | ✅ |
| Client-specific animation | ❌ | ✅ |
| Client-specific template composition | ❌ | ✅ |
| Client-specific copy | ❌ | ✅ |

## Development discipline

- Every substantial phase: SPEC → PLAN → IMPLEMENT → QA → COMMIT → STOP
- Never combine large architectural changes with unrelated visual changes
- Never silently change locked architecture
- Never push without explicit authorization
- Always inspect actual repository state before changing it
- Always report unexpected changes

## Definition of done (per client)

CLIENT DESIGN → DESIGN FREEZE → AETHER TRANSFORMATION → SHOPIFY DATA → THEME EDITOR → PHANTOM COEXISTENCE → COMMERCE → VISUAL PARITY → FUNCTIONAL PARITY → PERFORMANCE → ACCESSIBILITY → SEO → REGRESSION → DELIVERY

## Final success criterion

The system is successful when a completely new approved HTML/CSS/JS premium frontend can be taken for a client, the AETHER master copied, only the AETHER presentation layer modified as much as necessary, real Shopify data and commerce connected, and the store delivered — without rebuilding PHANTOM Core. That is the primary business objective. Do not optimize for a theoretical theme marketplace unless explicitly requested.