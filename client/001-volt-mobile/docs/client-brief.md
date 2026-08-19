# CLIENT #1 BRIEF — VOLT MOBILE

**Client ID:** 001
**Branch:** `client/001-volt-mobile`
**Baseline:** `aether-master-v1.2.1` (commit `e7e55f0` — fix(aether): set default Cabinet Grotesk and Satoshi fonts)
**Brief date:** 2026-08-19
**Status:** BRIEF ACTIVE — awaiting client visual approval of external frontend

---

## 1. CLIENT

| Field | Value |
|---|---|
| Client | Volt Mobile |
| Contact | (fictional) |
| Industry | Premium mobile phones & accessories |
| Store type | Flagship ecommerce (Online Store 2.0) |
| Region | Global (EN default) |

## 2. STORE TYPE

Premium flagship ecommerce storefront. Spec-driven storytelling over discount retail. Conversion focus on a small, curated catalog of flagship devices and premium accessories.

## 3. PRODUCT TYPE

- **Flagship smartphones** (fictional brand line: Volt X-series) — 3 core SKUs + 1 special edition
- **Premium accessories** — chargers, cases, earbuds, cables, power banks
- **Add-ons** — trade-in / upgrade program (content-level), warranty add-on (checkout-level)

## 4. BRAND

| Field | Value |
|---|---|
| Name | VOLT MOBILE |
| Positioning | Premium flagship + specs |
| Core idea | High-end smartphones presented through premium visual storytelling, detailed specifications, advanced product imagery, and technology-focused interactions |
| Design direction | Premium / minimalist — dark luxury technology aesthetic |
| Tagline (working) | "Power, engineered." |
| Voice | Confident, precise, technical but human. No discount language. |

## 5. TARGET CUSTOMER

**Tech enthusiasts, 25–40.**

- Spec-literate — compares cameras, displays, chips, battery, performance
- Design-conscious — values premium industrial design
- Follows flagship launches
- Expects fast, polished digital experiences
- Researches before purchasing; comfortable with deep technical content
- Interested in flagship phones and premium accessories

## 6. REFERENCE SITES

- Apple.com (hero/product storytelling, cinematic device imagery)
- Nothing.tech (dark tech minimalism, industrial design)
- Samsung Galaxy launch pages (spec-led product pages)
- OnePlus / OPPO flagship pages (spec tables, performance storytelling)

> These are directional references only — Volt Mobile must not copy any brand's identity.

## 7. REQUIRED PAGES

| # | Page | Priority | Notes |
|---|------|----------|-------|
| 1 | Home | P0 | Cinematic hero, flagship feature sections, featured products, spec marquee, accessories, newsletter |
| 2 | Collection | P0 | Phones grid + accessories grid, filters/sort, product cards with spec chips |
| 3 | Product (PDP) | P0 | Gallery, variant selector, spec sheet, comparison block, add to cart |
| 4 | Cart | P0 | Drawer + page, line items, free-shipping progress |
| 5 | Search | P0 | Predictive-style overlay + results page |
| 6 | Blog | P1 | Tech editorial |
| 7 | Article | P1 | Spec review format |
| 8 | About | P1 | Brand story, engineering narrative |
| 9 | Contact | P1 | Support + sales |
| 10 | FAQ | P1 | Accordion |
| 11 | 404 | P2 | Branded |
| 12 | Legal | P2 | Privacy / terms / cookies |

## 8. REQUIRED FEATURES

- Predictive search (products, pages, articles)
- Quick view on product cards
- Cart drawer with free-shipping progress bar
- Recently viewed products
- Product spec comparison block (PDP)
- Sticky add-to-cart on PDP (mobile)
- Spec chip tags on product cards (chip / display / camera)
- Variant selector with color swatches
- Newsletters / email capture
- Multi-section editorial layouts on home

## 9. MOBILE REQUIREMENTS

- All layouts responsive at 390 / 768 / 1024 / 1440 (proof targets)
- Mobile hero uses dedicated media + focal point control
- Sticky header adapts (compact) on scroll
- Touch-friendly swiper galleries, thumb-friendly hit targets
- Sticky buy bar on PDP mobile
- No horizontal overflow; images lazy-loaded

## 10. SPECIAL INTERACTIONS

- **Hero device animation** — Three.js-rendered flagship device with orbiting spec callouts (client-specific — lives in client copy, not master)
- Lenis smooth scroll
- GSAP scroll-triggered reveals, stagger, parallax
- Marquee spec strips (infinite ticker)
- Product card hover micro-interactions (image swap, spec chip reveal)
- PDP gallery (Swiper) with pinch zoom on mobile
- Countdown / "launch" timer for special edition (optional, P2)

## 11. SPECIAL SHOPIFY REQUIREMENTS

- Theme Editor control surface must cover: logo, colors, fonts, hero media + mobile hero media, header, footer, product grids, cards, buttons, content sections, responsive options, motion (inherited from AETHER V1.2.1 control system)
- Demo data: 4 fictional phone SKUs + 8 accessories, 2 collections, 3 blog articles, FAQ page, about/contact pages
- Locales: EN default (master's 7-language files remain available)
- No real-brand assets, no legal complications (fully fictional brand)

---

# SEPARATED REQUIREMENTS

## DESIGN (visual, frozen at approval)

| Area | Requirement |
|---|---|
| Aesthetic | Dark luxury technology. Near-black backgrounds, deep surfaces, cyan energy accent |
| Palette | bg `#050507`-family, surface `#121216`, text `#F5F5F4`, muted `#A1A1A6`, border `#232329`, accent electric cyan `#22D3EE`-family |
| Typography | Display: Cabinet Grotesk. Body: Satoshi. (AETHER defaults — no font work needed) |
| Imagery | Cinematic device renders, dark studio lighting, high-contrast spec close-ups |
| Motion | Smooth, deliberate, hardware-accelerated; reduced-motion respected |
| Spacing | Generous editorial whitespace; strict grid discipline |

## FUNCTIONALITY (behavior, not visual)

- All commerce flows work: browse → quick view → cart drawer → checkout
- Search overlay + results; sorting/filtering on collections
- Spec comparison on PDP; sticky buy bar mobile; recently-viewed trail
- Animations never gate commerce; reduced-motion fallbacks

## DATA (static → Shopify later)

- Static demo data in external frontend, marked with `data-phantom-*` anchors at conversion
- Products, collections, articles, pages seeded into Shopify demo store at conversion phase

## SHOPIFY FEATURES (platform)

- AETHER section/block/snippet mapping (see mapping doc at conversion)
- Theme Editor settings already audited PASS in AETHER V1.2.1 control system
- Any gap discovered → decision tree: client-specific (stay in copy) vs generic (backport → AETHER V1.3)

---

## WORKFLOW GUARDRAILS

1. External frontend = **visual source of truth**. Liquid replaces data, never design.
2. **DESIGN FREEZE** at client approval — no redesign during conversion.
3. PHANTOM Core + PHANTOM Library untouched. Only the AETHER layer transforms.
4. Client-specific features stay in this branch; generic improvements backport to master as V1.3+.
5. No Wave 3 speculative work. Requirements only via this decision tree: requirement → supported by V1.2.1? → use / investigate → client-specific or generic.