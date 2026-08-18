# Wave 2 — AETHER Content Sections (Design Spec)

Status: APPROVED 2026-08-18 with hardening amendments 1–12 (user review). Versions: v1 parts 1–3 approved → v2 amended.
Plan: `docs/superpowers/plans/2026-08-18-phantom-design-pack-wave2.md` (written by writing-plans skill after this spec).
Precedent: Wave 1 (`docs/superpowers/plans/2026-08-17-phantom-design-pack-wave1.md`, `docs/superpowers/specs/2026-08-17-phantom-design-pack-wave1-design.md`), Master Operating Model spec 2026-08-18.

## 1. Scope

Build the AETHER **content layer**: blog/article/page/FAQ/team/testimonials/contact/newsletter/promo/search/404 — as bespoke `aether-*` sections (full rebuild, not PHANTOM reuse), new AETHER template alternates, separate content assets with template-gated loading, parity harness + fidelity report v2, all gates green. Wave 1 commerce payloads must stay unchanged (58,418 B/page).

**Ownership boundary (amendment 11):** AETHER owns the *visual presentation*; PHANTOM may provide *plumbing* (contact form mechanics, newsletter form, search infrastructure, rich-text as renderer). "Full rebuild" = AETHER owns markup/styling, never "never reuse PHANTOM plumbing". AETHER remains the reusable premium starter implementation — no client-specific assumptions that make future client-copy transformations difficult.

### Deferred to Wave 3 (recorded, NOT built — amendment 12 STOP CONDITION)
- password/coming-soon (frozen page exists — roadmap defers to Wave 3 with accounts; **no Wave 2 visual implementation**)
- wishlist, login, account, join-now, checkout, thank-you, customer templates
- Blog comments: Shopify default behavior (PHANTOM article template conventions), no bespoke design this wave.
- After Wave 2 QA, **STOP and report** — no Wave 3 implementation, no architecture redesign.

## 2. Templates (new AETHER alternates)

| Template file | Content |
|---|---|
| `templates/blog.aether.json` | aether-page-hero + aether-blog-posts + aether-newsletter |
| `templates/article.aether.json` | aether-page-hero + aether-article (incl. related posts block) + aether-newsletter |
| `templates/page.aether.json` | aether-page-hero + aether content sections + PHANTOM rich-text for prose (D18 — renderer only) |
| `templates/search.aether.json` | aether-page-hero + aether-search |
| `templates/404.aether.json` | aether-404 (no chrome dependence — works with default header/footer groups) |

Per-page alternates (about/contact/faq/legal pages) use Shopify's template-suffix pattern with the AETHER alternates as base (documented in mapping.md; no extra code files — composition docs only).

## 3. Sections (11 new)

Frozen source = visual truth (`frontend/frontend/*.html`, commit `a79e02a`). Class mapping → `docs/aether/mapping.md` v2.

| Section | Frozen classes | Blocks/settings |
|---|---|---|
| `sections/aether-page-hero.liquid` | page-hero, page-hero-title, page-hero-subtitle, (legal: hero-overlay, page-hero-content) | title, subtitle, background image, overlay, height, alignment |
| `sections/aether-blog-posts.liquid` | blog-grid, blog-card{,-image,-content,-title,-excerpt,-meta,-category,-date,-read-more} | blog handle, per_row (2–4, modifier classes like D17 pattern), show category/date/excerpt, pagination |
| `sections/aether-article.liquid` | blog-hero{,-image,-overlay,-title}, article-body, article-meta, article-date, article-read-time, article-separator, author-avatar/author-info/author-bio, related-posts + blog-card reuse | article renderer (no blocks), show author, show related posts (3), read-time calc |
| `sections/aether-accordion.liquid` | accordion{,-item,-header,-button,-body,-collapse} (faq.html) | blocks: question + answer; open_first, allow_multiple |
| `sections/aether-team.liquid` | team-grid, team-card{,-image,-name,-role,-bio} (team.html) | blocks: member (image/name/role/bio); grid cols, hover effect |
| `sections/aether-testimonials.liquid` | reviews-grid, review-card{,-title,-text,-stars,-author,-date,-verified-badge}, rating-overview, rating-bars, bar-track/bar-fill, filter-bar, filter-buttons (testimonials.html) | blocks: review (text, stars, author, date, verified, category); rating summary = 3 metric bars (setting-driven); filter by category (static grouping) |
| `sections/aether-contact.liquid` | contact-hero, contact-form-wrap, form-group, submit-btn, info-card{,-icon}, social-links, map-placeholder (contact.html) | `{% form 'contact' %}` (PHANTOM pattern `contact-form.liquid:16`, incl. `form.posted_successfully?`/`form.errors`), info card blocks, **map embed URL setting → iframe generated from controlled URL (D21)** |
| `sections/aether-newsletter.liquid` | newsletter-section{,-title,-text,-form,-input-wrap,-input,-btn,-note,-success,-glow} | reuses PHANTOM `snippets/newsletter-form.liquid` **as plumbing only (amendment 5 — AETHER owns wrapper/presentation; verify zero PHANTOM visual CSS leakage via selector audit)**; title/text/note settings |
| `sections/aether-promo.liquid` | promo banner styling (roadmap item; no single frozen hero — derive from index/shop promo + footer-promotions language) | image, headline, subtext, CTA (label/link), layout (split/overlay) |
| `sections/aether-search.liquid` | derived from shop/blog card language (NO frozen search page — parity N/A, D19) | search.performed?, search.results, search.types (PHANTOM conventions); card grid mirrors aether-shop-grid geometry |
| `sections/aether-404.liquid` | error-page{,-code,-title,-description,-buttons} (404.html) | big code, title, blurb, 2 CTAs |

### Composition notes
- about.html = page-hero + features-grid/mission/stats/story → composed from aether-page-hero + PHANTOM rich-text (D18) + aether-team/featured reuse where applicable. Legal pages (privacy/terms/cookie) = page-hero + rich-text prose.
- FAQ page = page-hero + aether-accordion + aether-newsletter. Team = page-hero + aether-team. Testimonials = page-hero + aether-testimonials. Contact = aether-contact (contact-hero is the section's own hero).

## 4. Data & forms

- Blog/article: native Shopify blog objects; read-time = word count / 200 **computed server-side in Liquid as the fallback (amendment 8) — JS may enhance but must never make essential article content JS-dependent**; dates via `| date: format: 'month_day_year'`; no new runtime aether.* keys beyond locales.
- FAQ/team/testimonials: settings blocks only. Testimonial category filter = static block grouping (data anchors in mapping.md).
- Contact: `{% form 'contact' %}` — posts via standard contact endpoint; identical success/error handling as PHANTOM, AETHER-styled markup only. **Form submits normally without JS (amendment 3).**
- Newsletter: PHANTOM `snippets/newsletter-form.liquid` reuse (zero new form plumbing). **Functional without JS.**
- Search: PHANTOM search infra untouched (main-search/predictive-search/theme.js); AETHER section only restyles results markup.

## 5. Assets, budgets, loading gate

- `assets/aether-content.css.liquid` — NEW, minified (inline comment ledger), **hard ceiling 40 KB**.
- `assets/aether-content.js.liquid` — NEW module, `defer`, **ceiling 20 KB**. Controllers: `aether-accordion` (open/close, multiple per setting), `aether-testimonials` (category filter, re-groups static cards), `aether-contact` (submit state, error scroll), `aether-newsletter` (success swap), `aether-article` (read-time enhancement). **ALL controllers are progressive enhancement only (amendment 3):** accordion content visible without JS; all testimonials visible without JS; article readable without JS; contact form = normal Shopify submission without JS; newsletter functional without JS. Strict-mode / reduced-motion / touch gating identical to Wave 1 (`aether.js.liquid` conventions).
- **Gate (D20):** `snippets/design-pack-resolver.liquid` (sanctioned dp_* owner per liquid-scope-boundaries.md) sets `dp_content_asset = 'aether-content'` when pack active AND `template` ∈ {blog, article, page, search, 404, password}. **password is included for forward-compatible gating only (amendment 1) — documented explicitly; it receives NO Wave 2 implementation; Wave 3 adds the visual implementation without resolver churn.** `theme.liquid` gains exactly 2 gated lines: stylesheet tag after line 43 pattern; module script after line 378 pattern. Commerce templates (index/collection/product/cart) unchanged: 58,418 B payload.
- **theme.liquid boundary (amendment 2):** `theme.liquid` may contain ONLY the centralized Design Pack asset-loader hooks. AETHER sections/content components must NEVER add direct `<script>`/stylesheet loading to `theme.liquid`. Wave 2's two content-loader lines are a sanctioned extension of the existing centralized loader only.
- Documented rule: `aether-content-*` sections placed on commerce templates render layout without content CSS (template-based gate by design; compose content sections on content templates).

## 6. Locales

2 schema families per section + `aether.content.*` runtime keys, ×7 languages via `_scripts/add-locale-keys.ps1` (theme-local gitignored tooling; regeneration logic lives in the script — D15). Task-11-style verification: identical key sets across 7 files, all `t:` refs resolve.

## 7. QA & gates

- **Parity harness v2:** frozen captures blog, single-blog, about, faq, team, testimonials, contact, 404, cookie-policy (legal rep) = 9 pages × 3 widths → `docs/integration/aether/references-w2/`. Proof pages `designs/aether/source/w2/*.html` (9 files) — same build rules as Wave 1 (verbatim class mapping, no invented classes, rendered CSS via existing render-proof-css pipeline). Captures → `docs/integration/aether/proofs-w2/`.
- Diff: structural mapping (pass/fail) + numeric pixel table (supporting data only, methodology documented) + **human visual sign-off** (agent cannot view images — sign-off step in fidelity-report v2 §9 pattern).
- Search: derivation — **parity N/A, do NOT manufacture frozen-reference parity claims (amendment 7)**. Validate instead: Shopify search data correctness, AETHER visual consistency, responsive behavior, Theme Editor, functional search behavior.
- **Functional parity matrix v2:** 11 rows × 7 columns (Visual/Desktop/Tablet/Mobile/Editor/Liquid+data/Interaction). Interaction verified statically + documented manual checklist for live store. (Keep this matrix as the standard QA format for all future client projects.)
- **Content/Commerce asset isolation test (amendment 9):** explicit QA gate — Commerce page: aether-content CSS absent + JS absent; Content page: both present; Mixed page (content sections on a commerce template or vice versa): both layers coexist safely. Verified via check-registry unit test + network-request assertions in the parity harness (playwright).
- **Gates:** theme-check 0 offenses (~350 files); `check-registry.mjs` extended — content asset budgets + content-gate unit test (resolver emits dp_content_asset only on content templates; commerce payloads unchanged); untouched-file audit vs `904fb45~1` (PHANTOM core untouched; only resolver snippet, theme.liquid 2 gated lines, AETHER layer, docs, registry/memory); payloads: commerce 58,418 B unchanged; content ≤ 58,418 B + 40 KB CSS + 20 KB JS.
- **Performance reporting (amendment 10):** record actual per-page measurements (CSS / JS / vendor JS / total theme asset payload) for Home, Collection, Product, Cart (Wave 1) AND Blog, Article, Page, Search, 404 (Wave 2) — becomes the standard payload table for the client-copy workflow.
- **Deviation log:** D18 rich-text reuse for prose — **boundary (amendment 6): rich-text is reused as a content/data renderer/adapter, NOT the AETHER visual system; AETHER wraps/neutralizes PHANTOM styling as needed**; D19 search derived (no reference); D20 template-based content gate; D21 contact map embed URL → iframe generated from controlled URL (allowed-domain check, responsive + accessibility attributes, lazy loading) — no raw iframe HTML field; D22+ reserved for QA findings.
- **Newsletter visual isolation test (amendment 5):** selector audit proving zero PHANTOM visual CSS leaks into the AETHER newsletter (aether-newsletter + footer newsletter block); PHANTOM form plumbing only.

## 8. Deliverables & process

Spec + plan (`2026-08-18-phantom-design-pack-wave2.md`), section-by-section implementation commits (gates per commit), locales commit, parity harness + fidelity report v2, manifest.md Wave 2 section + registry.md §7, mapping.md v2, memory update, final report with user-required fields. **Never push without explicit authorization** (Wave 1 still unpushed at ~37 commits — user: wait).