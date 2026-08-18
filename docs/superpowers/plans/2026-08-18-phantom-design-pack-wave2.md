# Wave 2 — AETHER Content Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the AETHER content layer (blog/article/page/FAQ/team/testimonials/contact/newsletter/promo/search/404) as 11 bespoke `aether-*` sections + 5 template alternates + template-gated content assets, with parity evidence and all gates green — without touching Wave 1 commerce payloads or PHANTOM core.

**Architecture:** Sections are pure Liquid + schema; styles go to a NEW `aether-content.css.liquid` (≤40 KB) and scripts to a NEW `aether-content.js.liquid` (≤20 KB, enhancement-only), both gated by `dp_content_asset` set in `snippets/design-pack-resolver.liquid` for content templates only. PHANTOM plumbing (contact form mechanics, newsletter-form snippet, search infra, rich-text renderer) is reused; AETHER owns all presentation.

**Tech Stack:** Shopify OS 2.0 Liquid sections, theme-check (Shopify CLI), Node (check-registry.mjs), Playwright (parity harness), PowerShell (`_scripts/add-locale-keys.ps1`).

## Global Constraints

(Verbatim from spec `docs/superpowers/specs/2026-08-18-phantom-design-pack-wave2-design.md` v2 — amendments 1–12. Every task implicitly requires these.)

- `assets/aether-content.css.liquid`: NEW, minified (inline comment ledger), hard ceiling **40 KB**.
- `assets/aether-content.js.liquid`: NEW module, `defer`, hard ceiling **20 KB**. **ALL controllers are progressive-enhancement only**: accordion content visible without JS; all testimonials visible without JS; article readable without JS; contact form = normal Shopify submission without JS; newsletter functional without JS.
- **Gate (D20):** `snippets/design-pack-resolver.liquid` sets `dp_content_asset = 'aether-content'` when pack active AND `template` ∈ {blog, article, page, search, 404, password}. password = forward-compatible gating ONLY (no Wave 2 implementation; Wave 3 adds it).
- **theme.liquid boundary (amendment 2):** theme.liquid may contain ONLY the centralized Design Pack asset-loader hooks (exactly 2 new gated lines). AETHER sections must NEVER add direct script/stylesheet loading to theme.liquid.
- **Ownership (amendment 11):** AETHER owns visual presentation; PHANTOM provides plumbing only. No client-specific assumptions.
- **Deferred (amendment 12, STOP CONDITION):** password visual, wishlist, login, account, join-now, checkout, thank-you, customer templates, blog comments design. After Wave 2 QA: STOP and report.
- Wave 1 commerce payloads must stay unchanged: 58,418 B/page. Commerce templates: NO content assets.
- Contact map: `map_embed_url` setting → iframe generated from controlled URL (D21) — no raw iframe HTML field. Allowed domains: google.com/maps, maps.app.goo.gl, openstreetmap.org embed.
- Rich-text reuse (D18): PHANTOM rich-text is a content renderer/adapter ONLY; AETHER wraps/neutralizes PHANTOM styling.
- Search (D19): parity N/A. Validate: data correctness, AETHER visual consistency, responsive, editor, functional behavior. No invented parity claims.
- Read-time (amendment 8): computed server-side in Liquid (`article.content | strip_html | split ' ' | size` ÷ 200) as fallback; JS may enhance only.
- Newsletter (amendment 5): PHANTOM `newsletter-form` snippet = plumbing only; AETHER owns wrapper/presentation; selector audit proves zero PHANTOM visual leakage.
- Locales: every section adds its schema family + `aether.content.*` runtime keys to ALL 7 locale files (`en,de,fr,es,pt,ja,zh-CN` — check `locales/*.schema.json` list) via `_scripts/add-locale-keys.ps1` pattern; Task-11-style verification (identical key sets, all `t:` refs resolve).
- Gates per task: `shopify theme check` = 0 offenses (run in `phantom-theme-v2.2.0`); `node designs/build/check-registry.mjs` = PASS. Never push. Commit per task.
- Untouched-file audit vs `904fb45~1`: `theme.js`, `phantom-vendor.js`, `theme.css.liquid`, `css-variables.liquid`, `ph-design-tokens.css.liquid`, `settings_schema.json`, `settings_data.json` UNTOUCHED. theme.liquid: only the 2 sanctioned gated lines.

---

## File Structure

**Created (theme):**
- `sections/aether-page-hero.liquid`, `aether-blog-posts.liquid`, `aether-article.liquid`, `aether-accordion.liquid`, `aether-team.liquid`, `aether-testimonials.liquid`, `aether-contact.liquid`, `aether-newsletter.liquid`, `aether-promo.liquid`, `aether-search.liquid`, `aether-404.liquid`
- `assets/aether-content.css.liquid`, `assets/aether-content.js.liquid`
- `templates/blog.aether.json`, `article.aether.json`, `page.aether.json`, `search.aether.json`, `404.aether.json`

**Modified:**
- `snippets/design-pack-resolver.liquid` (dp_content_asset gate)
- `layout/theme.liquid` (exactly 2 gated lines)
- `locales/*.schema.json` ×7 + `locales/*.json` ×7 (new families + runtime keys)
- `designs/build/check-registry.mjs` (content budgets + gate unit tests)
- `docs/aether/mapping.md` (v2 — content class map + data anchors)
- `docs/aether/manifest.md` (Wave 2 section, D18–D21+), `docs/design-packs/registry.md` (§7)
- `docs/aether/fidelity-report-w2.md` (NEW), `docs/superpowers/plans/2026-08-18-phantom-design-pack-wave2.md` (this file)
- `.serena/memories/phantom-theme/project-state.md`

**Created (QA harness):**
- `designs/aether/source/w2/*.html` (9 proof pages) + rendered `w2/aether-proof-w2.css`
- `docs/integration/aether/references-w2/*.png` (27) + `docs/integration/aether/proofs-w2/*.png` (27)

**Frozen class → section map (authoritative, from extraction):** blog-card(16:10 image, gold category chip, read-more arrow), blog-hero(60vh overlay), article-meta(author/date/read-time with `—` separators), accordion(Bootstrap collapse pattern: `div.accordion` > `.accordion-item` > `h2.accordion-header` > `button.accordion-button` + `div.accordion-collapse.collapse` > `.accordion-body`), team-card(120px circle image, name/role/bio), review-card(stars/title/text/author/verified/date), rating bars(bar-track/bar-fill inline width), filter-btn(.active), contact form(4 fields + subject select), info-card(icon/title/value, 5 cards), map-placeholder, error-page(ghost code/title/desc/2 buttons), content-page(800px prose, gold h2, effective-date), newsletter-section(glow/inner/form/input-wrap/btn/note/success.is-visible), feature-card(icon/title/description — UNSTYLED in frozen, theme supplies styling), stat-item(countup), mission-grid, story-section(60vh bg image + quote), faq-cta.

---

### Task 1: Foundation — content asset gate + skeletons + registry extension

**Files:**
- Modify: `phantom-theme-v2.2.0/snippets/design-pack-resolver.liquid`
- Modify: `phantom-theme-v2.2.0/layout/theme.liquid:41-45` and `:376-380`
- Create: `phantom-theme-v2.2.0/assets/aether-content.css.liquid`, `phantom-theme-v2.2.0/assets/aether-content.js.liquid`
- Modify: `phantom-theme-v2.2.0/designs/build/check-registry.mjs`

**Interfaces:**
- Consumes: Wave 0 resolver (`dp_enabled`, `dp_asset`), Wave 1 registry gate.
- Produces: `dp_content_asset` assign (string `'aether-content'` or nil) available in theme.liquid; `AetherContent` controller-registration contract: `window.Aether = window.Aether || {}; Aether.ContentControllers = { 'aether-accordion': fn, ... }` mounted via `shopify:section:load` (same pattern as `aether.js.liquid` Wave 1).

- [ ] **Step 1: Read the resolver + theme.liquid loader region**

Read `snippets/design-pack-resolver.liquid` (full) and `layout/theme.liquid` lines 30–50 + 370–385. Note the `{%- if dp_enabled -%}` blocks and the `dp_*` assign list.

- [ ] **Step 2: Add the dp_content_asset gate to the resolver**

Append to `snippets/design-pack-resolver.liquid` (inside the existing `{% if dp_enabled %}` region, after `dp_asset` is set):

```liquid
{%- assign dp_content_templates = 'blog,article,page,search,404,password' | split: ',' -%}
{%- assign dp_content_asset = nil -%}
{%- if dp_content_templates contains template.name -%}
  {%- assign dp_content_asset = 'aether-content' -%}
{%- endif -%}
```

(`template.name` = e.g. `blog`, `article`, `page`, `search`, `404`, `password` — the base template without suffix. Verify with `template.name` on a suffix page like `page.about` returns `page`.)

- [ ] **Step 3: Add the 2 gated loader lines to theme.liquid**

After the existing stylesheet block (`theme.liquid:42-44`):

```liquid
  {%- # theme-check-disable UndefinedObject -%}
  {%- if dp_content_asset -%}
    {{ dp_content_asset | append: '.css.liquid' | asset_url | stylesheet_tag }}
  {%- endif -%}
  {%- # theme-check-enable UndefinedObject -%}
```

After the existing module script block (`theme.liquid:377-379`):

```liquid
  {%- # theme-check-disable UndefinedObject -%}
  {%- if dp_content_asset -%}
    <script type="module" src="{{ dp_content_asset | append: '.js.liquid' | asset_url }}" defer></script>
  {%- endif -%}
  {%- # theme-check-enable UndefinedObject -%}
```

- [ ] **Step 4: Create aether-content.css.liquid skeleton**

```liquid
/* AETHER content layer — Wave 2. MINIFIED before commit (ledger of sections below).
   Budget: <= 40 KB. Contents (ordered): page-hero, blog-posts, article,
   accordion, team, testimonials, contact, newsletter, promo, search, 404. */
```

(Minification = Wave 1 pattern: `aether.css.liquid` has an inline comment ledger; the file is shipped minified. Keep the ledger comment, minify the rest via the Wave 1 minifier approach.)

- [ ] **Step 5: Create aether-content.js.liquid skeleton**

```liquid
/* AETHER content runtime — Wave 2. Enhancement-only, <= 20 KB, module.
   Controllers: aether-accordion, aether-testimonials, aether-contact,
   aether-newsletter, aether-article. Mount pattern mirrors aether.js.liquid:
   document.addEventListener('shopify:section:load', ...) + DATA_SECTION_TYPE
   lookup; strict-mode / reduced-motion / touch gating identical to Wave 1. */
```

- [ ] **Step 6: Extend check-registry.mjs — content budgets + gate unit test**

In `designs/build/check-registry.mjs`, after the existing aether.js/aether-product.js budget checks, add:
1. Budget check: rendered `aether-content.css.liquid` ≤ 40,960 B; rendered `aether-content.js.liquid` ≤ 20,480 B (render both with the same frozen-token defaults used for aether.css).
2. Gate unit test: stub `template.name` values — for each of {blog, article, page, search, 404, password} the resolver's content gate emits `aether-content`; for each of {index, collection, product, cart, list-collections} it does NOT (commerce payload unchanged).

- [ ] **Step 7: Run gates**

Run: `shopify theme check` (cwd `phantom-theme-v2.2.0`) → 0 offenses.
Run: `node designs/build/check-registry.mjs` (cwd `phantom-theme-v2.2.0`) → REGISTRY: PASS.

- [ ] **Step 8: Commit**

```bash
git add phantom-theme-v2.2.0/snippets/design-pack-resolver.liquid phantom-theme-v2.2.0/layout/theme.liquid phantom-theme-v2.2.0/assets/aether-content.css.liquid phantom-theme-v2.2.0/assets/aether-content.js.liquid phantom-theme-v2.2.0/designs/build/check-registry.mjs
git commit -m "Wave 2 T1: content asset gate (dp_content_asset) + skeleton assets + registry checks"
```

---

### Task 2: aether-page-hero

**Files:**
- Create: `phantom-theme-v2.2.0/sections/aether-page-hero.liquid`
- Modify: `locales/en.default.schema.json` (+6 others via script, Task 14 handles bulk — add family now)

**Interfaces:**
- Produces: `{% render 'aether-page-hero' %}`-style section with `data-section-type="aether-page-hero"`; classes `.aether-page-hero`, `.aether-page-hero__title`, `.aether-page-hero__subtitle`, `.aether-page-hero__label`, `.aether-page-hero__content` (legal variant).

**Frozen mapping:** `section.page-hero` (+`data-parallax-section`), `span.section-label`, `h1.page-hero-title`, `p.page-hero-subtitle`, `.hero-fog` decoration (aria-hidden, decorative only — SKIP fog: it's an animation artifact, not content), legal variant `.page-hero:has(.page-hero-content)` (reduced padding, uppercase letterspaced h1, `div.hero-overlay`).

- [ ] **Step 1: Write the section**

```liquid
{%- style -%}
  #aether-page-hero-{{ section.id }} { ... }
{%- endstyle -%}
<section id="aether-page-hero-{{ section.id }}" class="aether-page-hero{% if section.settings.layout == 'compact' %} aether-page-hero--compact{% endif %}"
  data-section-type="aether-page-hero">
  <div class="container aether-page-hero__inner">
    {%- if section.settings.label != blank -%}
      <span class="section-label aether-page-hero__label">{{ section.settings.label }}</span>
    {%- endif -%}
    {%- if section.settings.title != blank -%}
      <h1 class="aether-page-hero__title">{{ section.settings.title }}</h1>
    {%- endif -%}
    {%- if section.settings.subtitle != blank -%}
      <p class="aether-page-hero__subtitle">{{ section.settings.subtitle }}</p>
    {%- endif -%}
  </div>
</section>
```

Schema settings (locale keys `t:sections.aether-page-hero.settings.*`): `label` (text), `title` (text), `subtitle` (richtext/textarea), `layout` (select: default|compact — compact = legal variant, uppercase letterspaced title, reduced padding), `background_image` (image_picker), `overlay_opacity` (range 0–90), `padding_top/padding_bottom` (range 0–100, PHANTOM naming convention). CSS classes: `.aether-page-hero` (padding 100px 0 80px pattern from frozen, background image + overlay when set, centered text).

- [ ] **Step 2: Add locale family to all 7 schema files**

Via `_scripts/add-locale-keys.ps1` (theme-local tooling): add family `aether-page-hero` with keys `name`, `settings.label.name/.label`, `settings.title.name/.label`, `settings.subtitle.name/.label`, `settings.layout.name/.label`, `settings.layout.options.default/.compact`, `settings.background_image.name/.label`, `settings.overlay_opacity.name/.label`, `settings.padding_top.name/.label`, `settings.padding_bottom.name/.label`. Run script → 7 files regenerated.

- [ ] **Step 3: Run gates**

`shopify theme check` → 0 offenses; `node designs/build/check-registry.mjs` → PASS (add `aether-page-hero` to the section inventory list if the gate tracks sections).

- [ ] **Step 4: Commit**

```bash
git add phantom-theme-v2.2.0/sections/aether-page-hero.liquid phantom-theme-v2.2.0/locales/*.schema.json
git commit -m "Wave 2 T2: aether-page-hero section + locale family"
```

---

### Task 3: aether-blog-posts

**Files:**
- Create: `phantom-theme-v2.2.0/sections/aether-blog-posts.liquid`
- Modify: locales ×7 (family `aether-blog-posts`)

**Interfaces:**
- Consumes: `blog` handle setting; PHANTOM naming conventions for blog object (`blog.articles`, `article.image`, `article.published_at`).
- Produces: `.aether-blog-grid`, `.aether-blog-card{__image,__category,__content,__date,__title,__excerpt,__read-more}`; `data-section-type="aether-blog-posts"`.

**Frozen mapping:** `a.blog-card` (1px border, hover gold + translateY(-4px)) with `.blog-card-image` (aspect-ratio 16/10, img cover, hover scale 1.05), `.blog-category` (absolute gold chip top-left, uppercase), `.blog-card-content`, `.blog-date` ("Jul 15, 2026" — `| date: format: 'month_day_year'`), `.blog-card-title`, `.blog-card-excerpt`, `.blog-read-more` (gold uppercase + `fa-arrow-right`). NO pagination in frozen — use `paginate` for >6 posts with the AETHER pill style (deviation D22: pagination added; frozen has none — documented).

- [ ] **Step 1: Write the section**

```liquid
<section class="aether-blog-posts" data-section-type="aether-blog-posts">
  <div class="container">
    <div class="aether-blog-grid aether-blog-grid--cols-{{ section.settings.per_row }}">
      {%- assign blog = blogs[section.settings.blog] -%}
      {%- if blog != blank and blog.articles_count > 0 -%}
        {%- paginate blog.articles by 6 -%}
          {%- for article in blog.articles -%}
            <a href="{{ article.url }}" class="aether-blog-card" data-reveal-item>
              {%- if article.image -%}
                <div class="aether-blog-card__image" data-image-zoom>
                  <img src="{{ article.image | image_url: width: 1200 }}" alt="{{ article.image.alt | escape }}" loading="lazy">
                  {%- if article.tags.size > 0 and section.settings.show_category -%}
                    <span class="aether-blog-card__category">{{ article.tags.first }}</span>
                  {%- endif -%}
                </div>
              {%- endif -%}
              <div class="aether-blog-card__content">
                {%- if section.settings.show_date -%}
                  <span class="aether-blog-card__date">{{ article.published_at | date: format: 'month_day_year' }}</span>
                {%- endif -%}
                <h3 class="aether-blog-card__title">{{ article.title }}</h3>
                {%- if section.settings.show_excerpt -%}
                  <p class="aether-blog-card__excerpt">{{ article.excerpt_or_content | strip_html | truncate: 120 }}</p>
                {%- endif -%}
                <span class="aether-blog-card__read-more">{{ 'aether.content.blog.read_more' | t }} <i class="fas fa-arrow-right" aria-hidden="true"></i></span>
              </div>
            </a>
          {%- endfor -%}
          {%- if paginate.pages > 1 -%}
            {%- render 'pagination', paginate: paginate -%}
          {%- endif -%}
        {%- endpaginate -%}
      {%- else -%}
        <p>{{ 'aether.content.blog.empty' | t }}</p>
      {%- endif -%}
    </div>
  </div>
</section>
```

Settings: `blog` (blog), `per_row` (range 2–4, default 3 → modifier class `aether-blog-grid--cols-N`, D17 pattern — NO inline grid style), `show_category` (checkbox), `show_date` (checkbox), `show_excerpt` (checkbox). CSS: grid `gap: 24px` (frozen blog-grid no gap rule; use 24px consistent with reviews-grid), responsive: ≤1024 2 cols, ≤576 1 col; card per frozen spec above.

- [ ] **Step 2: Locale family** — via script: family `aether-blog-posts` (name + settings.blog/label, per_row, show_category, show_date, show_excerpt) + runtime keys `aether.content.blog.read_more`, `aether.content.blog.empty` in all 7 `locales/*.json`.

- [ ] **Step 3: Gates** — theme-check 0; registry PASS.

- [ ] **Step 4: Commit**

```bash
git add phantom-theme-v2.2.0/sections/aether-blog-posts.liquid phantom-theme-v2.2.0/locales/
git commit -m "Wave 2 T3: aether-blog-posts section + locale family"
```

---

### Task 4: aether-article

**Files:**
- Create: `phantom-theme-v2.2.0/sections/aether-article.liquid`
- Modify: locales ×7 (family `aether-article`)

**Interfaces:**
- Consumes: `article` object (article template context), `blog` object for related.
- Produces: `.aether-article-hero{__image,__overlay,__title,__category}`, `.aether-article-meta{__author,__date,__read-time,__separator}`, `.aether-article-body`, `.aether-article-author-bio{__avatar,__info}`, `.aether-related{__grid}` reusing `aether-blog-card`.

**Frozen mapping:** `.blog-hero` (60vh, min-height 400px, full-bleed img + gradient overlay `to top, rgba(9,9,11,0.9), rgba(9,9,11,0.3)`, bottom-aligned content, padding-bottom 60px), category span above h1, `.article-meta` (author `—` date `—` read-time; separators are text `—`), `.article-body` (max-width 720px centered; h2, p, blockquote gold border, img.article-image width 100%), `.article-author-bio` (flex; 60px circle avatar gold border, strong name + p description), related = 3 blog cards under `section-header` label "Continue Reading".

- [ ] **Step 1: Write the section**

Read-time fallback (amendment 8, server-side):

```liquid
{%- assign words = article.content | strip_html | split: ' ' | size -%}
{%- assign read_time = words | divided_by: 200 | at_least: 1 -%}
```

Markup skeleton (article template context): hero (image + overlay + category/title), meta row (author/date/read-time with `—` separators, read-time text: `{{ read_time }} {{ 'aether.content.article.min_read' | t }}`), `{{ article.content }}` body (wrapped in `.aether-article-body`; add `article-image` class to body imgs via CSS selector `.aether-article-body img`), author bio (avatar = `{{ article.author | slice: 0, 1 }}` letter circle if no image — frozen uses fa-user icon; use fa-user icon per frozen), related posts (last 3 articles from same blog, excluding current, reusing `aether-blog-card` markup pattern).

Settings: `show_author` (checkbox), `show_related` (checkbox), `related_count` (range 1–3, default 3). CSS: `.aether-article-body` 720px centered, `blockquote` gold 2px left border italic, h2 spacing 32px, img width 100%.

- [ ] **Step 2: Locale family** — `aether-article` (name, settings.show_author, show_related, related_count) + runtime `aether.content.article.min_read`, `.written_by` (for author prefix if needed), `.continue_reading` label (section-header "Continue Reading" frozen text), `.related_posts` title.

- [ ] **Step 3: Gates** — theme-check 0; registry PASS.

- [ ] **Step 4: Commit**

```bash
git add phantom-theme-v2.2.0/sections/aether-article.liquid phantom-theme-v2.2.0/locales/
git commit -m "Wave 2 T4: aether-article section + locale family"
```

---

### Task 5: aether-accordion (FAQ)

**Files:**
- Create: `phantom-theme-v2.2.0/sections/aether-accordion.liquid`
- Modify: locales ×7 (family `aether-accordion`)

**Interfaces:**
- Consumes: blocks (question/answer); `open_first`, `allow_multiple` settings.
- Produces: `.aether-accordion{__item,__header,__button,__body}` with NO Bootstrap dependency — enhancement-only JS controller `aether-accordion` (Task 15 defines the controller in aether-content.js.liquid; this task ships the section + CSS so content is fully visible/readable without JS).

**Frozen mapping:** `.accordion` max-width 800px centered; `.accordion-item` surface bg 1px border margin-bottom 10px; `.accordion-button::after` filter invert(1); active button gold. First item open by default; `data-bs-parent` semantics → `allow_multiple` off = one open at a time.

- [ ] **Step 1: Write the section (no-JS readable)**

Base HTML: all answers RENDERED (visible without JS — amendment 3). CSS default: closed items collapse bodies via `.aether-accordion__body[hidden]`; the open state is toggled by the JS controller adding `is-open` + removing `hidden`. Server default: if `open_first` → first item `is-open` (no `hidden`); if `allow_multiple` → controller allows multiple.

```liquid
<section class="aether-accordion" data-section-type="aether-accordion"
  data-allow-multiple="{{ section.settings.allow_multiple }}">
  <div class="container aether-accordion__list">
    {%- for block in section.blocks -%}
      <div class="aether-accordion__item{% if forloop.first and section.settings.open_first %} is-open{% endif %}" {{ block.shopify_attributes }}>
        <h2 class="aether-accordion__header">
          <button type="button" class="aether-accordion__button" aria-expanded="{% if forloop.first and section.settings.open_first %}true{% else %}false{% endif %}" aria-controls="aether-acc-{{ section.id }}-{{ forloop.index }}">
            {{ block.settings.question }}
          </button>
        </h2>
        <div id="aether-acc-{{ section.id }}-{{ forloop.index }}" class="aether-accordion__body"{% unless forloop.first and section.settings.open_first %} hidden{% endunless %}>
          <div class="aether-accordion__answer">{{ block.settings.answer }}</div>
        </div>
      </div>
    {%- endfor -%}
  </div>
</section>
```

Block settings: `question` (text), `answer` (richtext). Section settings: `open_first` (checkbox, default true), `allow_multiple` (checkbox, default false). CSS: 800px max-width centered, item borders, gold active state, arrow icon via CSS (`.aether-accordion__button::after` — use chevron, invert filter pattern), body `hidden` display handling.

- [ ] **Step 2: Locale family** — `aether-accordion` (name, blocks.question.name/.label, blocks.answer.name/.label, settings.open_first, allow_multiple).

- [ ] **Step 3: Gates** — theme-check 0; registry PASS.

- [ ] **Step 4: Commit**

```bash
git add phantom-theme-v2.2.0/sections/aether-accordion.liquid phantom-theme-v2.2.0/locales/
git commit -m "Wave 2 T5: aether-accordion section (no-JS readable) + locale family"
```

---

### Task 6: aether-team

**Files:**
- Create: `phantom-theme-v2.2.0/sections/aether-team.liquid`
- Modify: locales ×7 (family `aether-team`)

**Interfaces:**
- Produces: `.aether-team-grid`, `.aether-team-card{__image,__name,__role,__bio}`.

**Frozen mapping:** `.team-grid` `repeat(3,1fr); gap:30px` (≤1024 2 cols, ≤576 1 col); `.team-card` centered, 30px padding, 1px border; `.team-image` 120×120 circle, 2px border, margin auto, img cover; `.team-name`; `.team-role` gold uppercase letterspaced; `.team-bio` chrome 0.85rem.

- [ ] **Step 1: Write the section**

Blocks: `member` → `image` (image_picker), `name` (text), `role` (text), `bio` (textarea). Grid + card per frozen CSS spec. Settings: `grid_cols` (range 2–4 default 3 → modifier class, D17 pattern), `show_bio` (checkbox).

- [ ] **Step 2: Locale family** — `aether-team` (name, blocks.member.name/.label + image/name/role/bio, settings.grid_cols, show_bio).

- [ ] **Step 3: Gates** — theme-check 0; registry PASS.

- [ ] **Step 4: Commit**

```bash
git add phantom-theme-v2.2.0/sections/aether-team.liquid phantom-theme-v2.2.0/locales/
git commit -m "Wave 2 T6: aether-team section + locale family"
```

---

### Task 7: aether-testimonials

**Files:**
- Create: `phantom-theme-v2.2.0/sections/aether-testimonials.liquid`
- Modify: locales ×7 (family `aether-testimonials`)

**Interfaces:**
- Consumes: `aether-testimonials` controller (Task 15) for filter; section must render ALL reviews without JS.
- Produces: `.aether-rating-overview{__big,__details,__stars,__count}`, `.aether-rating-bars{__row,__label,__track,__fill,__percent}`, `.aether-filter-bar{__btn,__btn--active}`, `.aether-reviews-grid`, `.aether-review-card{__stars,__title,__text,__author,__verified,__date}`.

**Frozen mapping:** summary flex (overview 4.9 big gold 4rem + stars ×5 + count "Based on 1,247 reviews"), 5 bar rows (labels "5 star".."1 star", widths 85/10/3/1/1% inline, gold fills), filter buttons All Reviews/5 Stars/4 Stars/Verified Only (`.active` first, gold border active), reviews grid `repeat(3,1fr); gap:24px` (≤1024 2 cols, ≤576 1 col), card: stars, title, text, author strong + verified badge (`fa-check-circle`), date. CTA "Have you tried the Void Runner?" + btn.

- [ ] **Step 1: Write the section**

Blocks: `review` → `text` (textarea), `title` (text), `author` (text), `date` (text), `stars` (range 1–5 default 5), `verified` (checkbox), `category` (select: all|5|4|3|2|1|verified — drives filter grouping; "Verified Only" = category `verified`). Rating summary settings: `summary_score` (text "4.9"), `summary_count` (text "Based on 1,247 reviews"), 5 × `bar_N_label` + `bar_N_percent` (range 0–100). Filter buttons always rendered; filter is enhancement-only (no-JS: all cards visible). Cards carry `data-category="{{ block.settings.category }}"` for the controller.

- [ ] **Step 2: Locale family** — `aether-testimonials` (name, blocks.review.name/.label + 7 settings, settings.summary_*, bars) + runtime `aether.content.testimonials.verified`, `.all_reviews`, `.five_stars`, `.four_stars`, `.verified_only`, `.based_on` (prefix for count).

- [ ] **Step 3: Gates** — theme-check 0; registry PASS.

- [ ] **Step 4: Commit**

```bash
git add phantom-theme-v2.2.0/sections/aether-testimonials.liquid phantom-theme-v2.2.0/locales/
git commit -m "Wave 2 T7: aether-testimonials section + locale family"
```

---

### Task 8: aether-contact

**Files:**
- Create: `phantom-theme-v2.2.0/sections/aether-contact.liquid`
- Modify: locales ×7 (family `aether-contact`)

**Interfaces:**
- Consumes: PHANTOM contact form pattern (`contact-form.liquid:16`), `form.posted_successfully?`, `form.errors`.
- Produces: `.aether-contact-hero`, `.aether-contact-form-wrap`, `.aether-form-group`, `.aether-submit-btn`, `.aether-info-card{__icon}`, `.aether-social-links{__link}`, `.aether-map{__iframe}` (D21: iframe generated from `map_embed_url`).

**Frozen mapping:** hero (160/80px padding, gradient bg, centered), row 7/5 split (≤992 stacked), form wrap (surface bg 50px padding, h2 bottom border), 4 form-group fields (name/email/subject select w/ 4 options/message textarea 140px), submit gold uppercase; 5 info cards (address/email/phone/hours/follow with 3 social links); map placeholder 300px (replace with controlled iframe per D21, placeholder fallback when URL empty).

- [ ] **Step 1: Write the section**

Form (PHANTOM mechanics, AETHER markup):

```liquid
{%- form 'contact', id: form_id -%}
  {%- if form.posted_successfully? -%}
    <div class="aether-contact-form__success" role="status">{{ 'aether.content.contact.success' | t }}</div>
  {%- elsif form.errors -%}
    <div class="aether-contact-form__errors" role="alert">{{ form.errors | default_errors }}</div>
  {%- endif -%}
  <div class="aether-form-group">
    <label for="aether-contact-name-{{ section.id }}">{{ 'aether.content.contact.name' | t }}</label>
    <input type="text" id="aether-contact-name-{{ section.id }}" name="contact[name]" placeholder="{{ 'aether.content.contact.name_placeholder' | t }}" required>
  </div>
  ... email (contact[email]), subject (contact[subject] as select with 4 options), message (contact[body], textarea) ...
  <button type="submit" class="aether-submit-btn">{{ 'aether.content.contact.submit' | t }}</button>
{%- endform -%}
```

Map (D21 — controlled iframe):

```liquid
{%- if section.settings.map_embed_url != blank -%}
  <div class="aether-map">
    <iframe class="aether-map__iframe" src="{{ section.settings.map_embed_url | escape }}" loading="lazy"
      title="{{ 'aether.content.contact.map_title' | t }}" allowfullscreen></iframe>
  </div>
{%- else -%}
  <div class="aether-map aether-map--placeholder"><i class="fas fa-map-location-dot" aria-hidden="true"></i><span>{{ 'aether.content.contact.map_soon' | t }}</span></div>
{%- endif -%}
```

Info cards = blocks (`icon` select from fa-set: location-dot/envelope/phone/clock/share-nodes, `title` text, `content` richtext — links allowed for email/phone), `show_map` checkbox. Settings: `map_embed_url` (url — NOTE: iframe src from embed URL; allowed-domain guidance documented in settings help text), `show_social` + 3 × social block (platform select instagram/x-twitter/tiktok, url).

- [ ] **Step 2: Locale family** — `aether-contact` (name, blocks.info.name/.label + icon/title/content, blocks.social.name/.label + platform/url, settings.map_embed_url, show_map, show_social) + runtime `aether.content.contact.*` (success, errors prefix, name, email, subject, message, placeholders, submit, map_title, map_soon, select default + 4 options).

- [ ] **Step 3: Gates** — theme-check 0; registry PASS.

- [ ] **Step 4: Commit**

```bash
git add phantom-theme-v2.2.0/sections/aether-contact.liquid phantom-theme-v2.2.0/locales/
git commit -m "Wave 2 T8: aether-contact section (controlled map iframe) + locale family"
```

---

### Task 9: aether-newsletter

**Files:**
- Create: `phantom-theme-v2.2.0/sections/aether-newsletter.liquid`
- Modify: locales ×7 (family `aether-newsletter`)

**Interfaces:**
- Consumes: `snippets/newsletter-form.liquid` (PHANTOM plumbing — same as `aether-footer.liquid:62`).
- Produces: `.aether-newsletter{__glow,__inner,__title,__text,__form,__input-wrap,__input,__btn,__note,__success}`.

**Frozen mapping:** 100px/80px padding, transparent bg, 600px radial gold glow at 50/50 (decorative, aria-hidden), inner max-width 580 centered, form 480, input wrap flex 1px border + backdrop blur + focus-within gold, input transparent flex 1, btn gold uppercase with arrow, note with fa-lock "No spam. Unsubscribe anytime.", success hidden → `.is-visible` (0.5s fade).

- [ ] **Step 1: Write the section**

AETHER wrapper owns presentation; `{% render 'newsletter-form', section_id: section.id, snippet_context: 'newsletter' %}` for the form mechanics (check the snippet's expected params in `snippets/newsletter-form.liquid` — match them exactly). Success state = snippet's existing success output styled by `.aether-newsletter__success`. **Amendment 5 selector audit:** after CSS is written, grep rendered CSS for PHANTOM newsletter selector leaks (`.newsletter-section`, `.newsletter-form` etc. un-prefixed under `.aether-newsletter` scope) — zero leaks required.

- [ ] **Step 2: Locale family** — `aether-newsletter` (name, settings.title, text, note) + runtime keys already covered by snippet.

- [ ] **Step 3: Gates** — theme-check 0; registry PASS; selector audit (above) clean.

- [ ] **Step 4: Commit**

```bash
git add phantom-theme-v2.2.0/sections/aether-newsletter.liquid phantom-theme-v2.2.0/locales/
git commit -m "Wave 2 T9: aether-newsletter section (PHANTOM plumbing, AETHER presentation)"
```

---

### Task 10: aether-promo

**Files:**
- Create: `phantom-theme-v2.2.0/sections/aether-promo.liquid`
- Modify: locales ×7 (family `aether-promo`)

**Interfaces:**
- Produces: `.aether-promo{__media,__content,__label,__title,__text,__cta}`; layout split|overlay.

**Design derivation (D-derivation, no single frozen page):** derive from index/shop promo + footer-promotions language (gold CTA, void surfaces, image + content split, magnetic button style). Settings: `layout` (select: split|overlay), `image` (image_picker), `label`, `title`, `text`, `cta_label`, `cta_link` (url), `reverse` (checkbox, split only), `overlay_opacity` (overlay only).

- [ ] **Step 1: Write the section** — split: 2-col grid (media + content), overlay: bg image + centered content over gradient. Both responsive (≤768 stack). Buttons: `.btn`-style AETHER button (reuse `.aether-btn` pattern if defined in aether.css.liquid — else define `.aether-promo__cta` styled per btn-primary frozen look: gold bg, uppercase).

- [ ] **Step 2: Locale family** — `aether-promo` (name + 10 settings).

- [ ] **Step 3: Gates** — theme-check 0; registry PASS.

- [ ] **Step 4: Commit**

```bash
git add phantom-theme-v2.2.0/sections/aether-promo.liquid phantom-theme-v2.2.0/locales/
git commit -m "Wave 2 T10: aether-promo section + locale family"
```

---

### Task 11: aether-search

**Files:**
- Create: `phantom-theme-v2.2.0/sections/aether-search.liquid`
- Modify: locales ×7 (family `aether-search`)

**Interfaces:**
- Consumes: `search.performed?`, `search.results`, `search.types`, `search.results_count` (PHANTOM main-search conventions — read `sections/main-search.liquid` first).
- Produces: `.aether-search{__form,__input,__results-grid,__card}`; results card geometry mirrors `aether-shop-grid` (collection grid) / `aether-blog-card` (16:10 media).

**Amendment 7:** parity N/A; validate data correctness + AETHER visual consistency + responsive + editor + functional behavior (documented in fidelity report, no parity claims).

- [ ] **Step 1: Read PHANTOM search conventions** — read `sections/main-search.liquid` + `sections/search-results.liquid`; reuse the `search.types` loop pattern for mixed results (product/article/page) with per-type card handling.

- [ ] **Step 2: Write the section**

Search form (GET `?q=`, `search.terms`), results grid: products → shop-card style (image, title, price via `theme.Currency` formatting — price markup per `aether-product.liquid` conventions); articles → blog-card style; pages → text rows. Empty + no-results states with `search.results_count == 0`.

- [ ] **Step 3: Locale family** — `aether-search` (name + settings) + runtime `aether.content.search.*` (placeholder, results_count, no_results, empty, clear).

- [ ] **Step 4: Gates** — theme-check 0; registry PASS.

- [ ] **Step 5: Commit**

```bash
git add phantom-theme-v2.2.0/sections/aether-search.liquid phantom-theme-v2.2.0/locales/
git commit -m "Wave 2 T11: aether-search section (derived, parity N/A) + locale family"
```

---

### Task 12: aether-404

**Files:**
- Create: `phantom-theme-v2.2.0/sections/aether-404.liquid`
- Modify: locales ×7 (family `aether-404`)

**Interfaces:**
- Produces: `.aether-error{__code,__title,__description,__buttons}`; must render inside default 404 template chrome.

**Frozen mapping:** `.error-page` 100vh flex centered void bg, `.error-code` clamp(6rem,15vw,12rem) 800 ghost white 0.05, margin-bottom -20px, `.error-title`, `.error-description`, `.error-buttons` flex gap 20 (btn-primary "Return Home" + btn-outline "Back to Shop").

- [ ] **Step 1: Write the section**

```liquid
<section class="aether-error" data-section-type="aether-404">
  <div class="aether-error__content">
    <span class="aether-error__code" aria-hidden="true">404</span>
    <h1 class="aether-error__title">{{ section.settings.title }}</h1>
    <p class="aether-error__description">{{ section.settings.description }}</p>
    <div class="aether-error__buttons">
      <a href="{{ routes.root_url }}" class="aether-btn aether-btn--primary">{{ section.settings.home_label }}</a>
      <a href="{{ routes.all_products_collection_url }}" class="aether-btn aether-btn--outline">{{ section.settings.shop_label }}</a>
    </div>
  </div>
</section>
```

Settings: title, description, home_label, shop_label. (100vh section: ensure it works with header overlay — 404 template will use default chrome per template task.)

- [ ] **Step 2: Locale family** — `aether-404` (name + 4 settings).

- [ ] **Step 3: Gates** — theme-check 0; registry PASS.

- [ ] **Step 4: Commit**

```bash
git add phantom-theme-v2.2.0/sections/aether-404.liquid phantom-theme-v2.2.0/locales/
git commit -m "Wave 2 T12: aether-404 section + locale family"
```

---

### Task 13: Template alternates

**Files:**
- Create: `templates/blog.aether.json`, `templates/article.aether.json`, `templates/page.aether.json`, `templates/search.aether.json`, `templates/404.aether.json`
- Modify: locales ×7 (sections.categories additions: blog/article/page/search/404)

**Interfaces:**
- Consumes: all 11 sections + PHANTOM `rich-text` (D18 renderer).
- Produces: registerable alternates; `blog.aether.json` promotes via template-promotion-contract (snapshot → validate → promote → regression → commit).

- [ ] **Step 1: Write the template JSONs**

```json
{
  "sections": {
    "main": {
      "type": "aether-page-hero",
      "settings": { "label": "Journal", "title": "The AETHER Dispatch", "subtitle": "Insights on technology, performance, and the future of footwear" }
    },
    "posts": { "type": "aether-blog-posts", "settings": { "blog": "news", "per_row": 3, "show_category": true, "show_date": true, "show_excerpt": true } },
    "newsletter": { "type": "aether-newsletter", "settings": {} }
  },
  "order": ["main", "posts", "newsletter"]
}
```

article.aether.json: aether-page-hero (compact) → aether-article → aether-newsletter. page.aether.json: aether-page-hero → aether content sections (merchant-composed) → rich-text (D18 — added as composition example only, no prose styling forced; rich-text wrapped so PHANTOM styling is neutralized per amendment 6). search.aether.json: aether-page-hero (Search) → aether-search. 404.aether.json: aether-404 only (default chrome handles header/footer via group alternates).

- [ ] **Step 2: Locale categories** — add `sections.categories.blog/article/page/search/404` entries (check existing `sections.categories.*` pattern in Wave 1 locales).

- [ ] **Step 3: Promotion-contract validation** — per `docs/design-packs/template-promotion-contract.md`: snapshot current PHANTOM templates, validate alternates (theme-check + registry), promote (register as default for the pack), regression (theme-check + gates).

- [ ] **Step 4: Gates** — theme-check 0; registry PASS.

- [ ] **Step 5: Commit**

```bash
git add phantom-theme-v2.2.0/templates/*.aether.json phantom-theme-v2.2.0/locales/
git commit -m "Wave 2 T13: content template alternates (blog/article/page/search/404)"
```

---

### Task 14: aether-content.js.liquid — controllers

**Files:**
- Modify: `phantom-theme-v2.2.0/assets/aether-content.js.liquid`

**Interfaces:**
- Consumes: section markup contracts from Tasks 2–12 (`data-section-type`, `.is-open`, `hidden`, `data-category`, `data-allow-multiple`).
- Produces: mounted controllers on `shopify:section:load`; all enhancement-only.

- [ ] **Step 1: Write the controller registry**

Follow `aether.js.liquid` Wave 1 structure exactly: `Aether.ContentControllers = {}` + `document.addEventListener('shopify:section:load', ...)` dispatch + `init` guards (`matchMedia('(prefers-reduced-motion: reduce)')` only for animation parts; controllers must work under reduced motion).

- [ ] **Step 2: aether-accordion** — toggle: on button click, toggle `hidden` on `.aether-accordion__body` + `is-open`/`aria-expanded` on item/button; if `!allow_multiple`, close siblings first. No-JS default: content visible (Task 5 base). SSR state preserved (open_first).

- [ ] **Step 3: aether-testimonials** — filter: on `.aether-filter-bar__btn` click, set `.is-active`; cards with `data-category` mismatch get `hidden`; "All" shows all. No-JS default: all visible. Buttons must re-render on section load (state from clicked button).

- [ ] **Step 4: aether-contact** — enhancement: on submit, disable button + "Sending…" label (`aria-busy`); on server-rendered errors (form re-rendered with errors), scroll to error block. Form submits natively without JS (amendment 3).

- [ ] **Step 5: aether-newsletter** — enhancement: on submit success (snippet's success output present on re-render), add `.is-visible` to success block + swap form state (same as frozen `.newsletter-success.is-visible` behavior). Functional without JS.

- [ ] **Step 6: aether-article** — enhancement: client-side read-time refinement (recompute from rendered text) ONLY if server value is missing; never gate content.

- [ ] **Step 7: Gate + commit** — theme-check 0; registry PASS (aether-content.js.liquid ≤ 20 KB — render + measure).

```bash
git add phantom-theme-v2.2.0/assets/aether-content.js.liquid
git commit -m "Wave 2 T14: aether-content.js controllers (enhancement-only)"
```

---

### Task 15: aether-content.css.liquid — full styles + parity capture prep

**Files:**
- Modify: `phantom-theme-v2.2.0/assets/aether-content.css.liquid`

**Interfaces:**
- Consumes: class contracts from Tasks 2–12.
- Produces: complete rendered CSS for the proof harness; final budget measurement.

- [ ] **Step 1: Write all section styles** — minified, ledger comment, per frozen spec in the map (hero paddings, card ratios, accordion borders, team circles, rating bars, form groups, newsletter glow, error ghost code, promo split/overlay, search grid). Use `theme.json`-style spacing but classes only. Include `.aether-btn--primary/--outline` (used by promo/404/search CTA) — check whether `aether.css.liquid` already defines `.aether-btn`; if yes, extend in content CSS; if no, define here.

- [ ] **Step 2: Measure budget** — render via the Wave 1 render pipeline (frozen-token defaults) → must be ≤ 40,960 B. Record number.

- [ ] **Step 3: Selector audit (amendment 5)** — grep rendered CSS: zero un-prefixed PHANTOM content selectors (`.newsletter-*`, `.accordion-*`, `.team-*`, `.blog-*` etc. outside `.aether-*` scope). Zero leaks.

- [ ] **Step 4: Gates** — theme-check 0; registry PASS (budgets + gate unit tests from Task 1).

- [ ] **Step 5: Commit**

```bash
git add phantom-theme-v2.2.0/assets/aether-content.css.liquid
git commit -m "Wave 2 T15: aether-content.css complete (budget + selector audit)"
```

---

### Task 16: Parity harness v2

**Files:**
- Create: `phantom-theme-v2.2.0/designs/aether/source/w2/` (9 proof pages + rendered CSS), `docs/integration/aether/references-w2/`, `docs/integration/aether/proofs-w2/`, `docs/aether/fidelity-report-w2.md`

**Interfaces:**
- Consumes: frozen `frontend/frontend/{blog,single-blog,about,faq,team,testimonials,contact,404,cookie-policy}.html`; sections Tasks 2–12; `C:\Users\hamma\AppData\Local\Temp\opencode\render-proof-css.ps1` + `parity_diff.py` (Wave 1 tooling).
- Produces: 27+27 PNGs, structural mapping table, functional matrix v2, isolation test evidence, fidelity report v2.

- [ ] **Step 1: Build proof pages** — for each of the 9 pages, render section markup with sample data (blog: 6 posts w/ dates/categories; article: hero/body/author/related; about: mission/features/stats/story composition via page.aether composition; faq: 8 Q&A; team: 6 members; testimonials: 6 reviews + summary bars + 4 filter buttons; contact: 4 fields + 5 info cards + map placeholder; 404: error content; legal: hero compact + prose). Rules (Wave 1): verbatim class mapping from frozen (no invented classes), rendered `aether-content.css.liquid` + `aether.css.liquid` (frozen token defaults) linked, NO JS (fonts = fallback, documented), same single image `Luxury_running_sneaker_on_pedestal_202607222032.jpeg`.

- [ ] **Step 2: Frozen captures** — serve `frontend/frontend` (python http.server 8125), screenshot 9 pages × {1440,768,390} via playwright-mcp `browser_run_code_unsafe` with `page.screenshot({ timeout: 60000 })` (tool has 5 s timeout on tall pages — use run_code_unsafe) → `docs/integration/aether/references-w2/{page}-{width}.png`.

- [ ] **Step 3: Proof captures** — serve `designs/aether/source/w2` (port 8126), same 9 × 3 → `docs/integration/aether/proofs-w2/`.

- [ ] **Step 4: Structural diff + pixel table** — structural geometry via playwright evaluate per section (heights/cols); pixel diff via `parity_diff.py` (supporting data only). Record PASS/FAIL per section per breakpoint; FAIL → fix section/CSS, re-render proof CSS, re-capture.

- [ ] **Step 5: Isolation test (amendment 9)** — on a commerce proof page (Wave 1 proofs, e.g. shop.html) assert no aether-content stylesheet/script tags; on a content proof page assert both present. Record in report.

- [ ] **Step 6: Fidelity report v2** — `docs/aether/fidelity-report-w2.md`: methodology (incl. no-JS/font-fallback caveats), pixel table, structural matrix, functional matrix v2 (11 rows × 7 cols), editor lifecycle checklist (ADD/REMOVE/RE-ADD/MOVE/DUPLICATE/EDIT/SAVE/RELOAD per section + coexistence A–E), isolation evidence, search = derivation validation record (no parity claims — amendment 7), deviations D18–D22, **human visual sign-off step** (user opens references-w2 vs proofs-w2 pairs; agent cannot view images).

- [ ] **Step 7: Commit**

```bash
git add phantom-theme-v2.2.0/designs/aether/source/w2 docs/integration/aether/references-w2 docs/integration/aether/proofs-w2 docs/aether/fidelity-report-w2.md
git commit -m "Wave 2 T16: parity harness v2 — 9 pages x 3 widths, fidelity report v2"
```

---

### Task 17: Full gates + docs + memory + final report

**Files:**
- Modify: `docs/aether/manifest.md` (Wave 2 section, D18–D22), `docs/design-packs/registry.md` (§7), `docs/aether/mapping.md` (v2), `.serena/memories/phantom-theme/project-state.md`, this plan (checkboxes), `docs/superpowers/plans/2026-08-17-phantom-design-pack-wave1.md` (regression note, optional)

**Interfaces:**
- Consumes: everything.
- Produces: Wave 2 complete state, STOP condition honored.

- [ ] **Step 1: Registry/manifest sync** — manifest.md: Wave 2 section (11 sections + 2 assets + 5 templates, budgets 40/20 KB, payload table), deviations D18 (rich-text renderer), D19 (search derived), D20 (template gate), D21 (controlled map iframe), D22 (blog pagination added — frozen has none). registry.md §7 Wave 2 status.

- [ ] **Step 2: mapping.md v2** — frozen→theme class table for all 11 sections + data anchors (data-phantom attrs → Liquid data: `blog_post`→article loop, `blog_date`→published_at, `article_read_time`→wordcount calc, `team_member`→member block, `rating_score`→summary setting, `faq_cta`→accordion CTA or settings).

- [ ] **Step 3: Full gates** — theme-check (0 offenses, ~350 files); `check-registry.mjs` PASS (incl. content budgets + gate tests + isolation); untouched-file audit vs `904fb45~1` (theme.js/phantom-vendor.js/theme.css.liquid/css-variables.liquid/ph-design-tokens.css.liquid/settings_schema.json/settings_data.json UNTOUCHED; theme.liquid = only 2 sanctioned lines); payload table (amendment 10): Home/Collection/Product/Cart (58,418 B, unchanged) + Blog/Article/Page/Search/404 (CSS/JS/vendor/total).

- [ ] **Step 4: Memory + plan checkboxes** — project-state.md: Wave 2 complete, commit trail, budgets, deferred items, STOP noted. Plan checkboxes [x].

- [ ] **Step 5: Commit**

```bash
git add docs/aether/manifest.md docs/design-packs/registry.md docs/aether/mapping.md .serena/memories/phantom-theme/project-state.md docs/superpowers/plans/2026-08-18-phantom-design-pack-wave2.md
git commit -m "Wave 2 T17: docs, memory, full gates"
```

- [ ] **Step 6: Final report** — user-required fields (same list as Wave 1): WAVE 2 STATUS / FILES CREATED / FILES MODIFIED / FILES UNTOUCHED / SECTIONS COMPLETED / LIQUID DATA MAPPINGS / CSS ISOLATION / JS LIFECYCLE / THEME EDITOR QA / VISUAL PARITY (with human sign-off pointer) / MOBILE QA / PHANTOM REGRESSION / THEME CHECK / REGISTRY CHECK / PERFORMANCE (payload table) / ACCESSIBILITY / GIT COMMITS / UNEXPECTED CHANGES / KNOWN RISKS / NEXT TASK. **STOP — no Wave 3 implementation; do NOT push (await explicit authorization).**

---

## Self-Review Notes

- **Spec coverage:** §2 templates → Task 13; §3 sections → Tasks 2–12; §4 data/forms → per-section tasks (contact form Task 8, newsletter Task 9, search Task 11, read-time Task 4); §5 assets/gate → Tasks 1, 14, 15 (40/20 KB ceilings, password forward-compat, theme.liquid 2-line boundary); §6 locales → per-task families + verification in Task 17; §7 QA → Tasks 16 (harness, isolation test, matrix v2) + 17 (gates, payload table, deviations); §8 deliverables → Task 17 + final report. Amendments 1–12: 1 (password gate doc) Task 1, 2 (theme.liquid boundary) Task 1 + Global Constraints, 3 (enhancement-only) Tasks 5/14, 4 (map URL) Task 8, 5 (newsletter isolation) Tasks 9/15, 6 (rich-text boundary) Task 13, 7 (search no-parity) Task 11/16, 8 (read-time server) Task 4, 9 (isolation test) Task 16, 10 (payload table) Task 17, 11 (ownership) Global Constraints, 12 (STOP) Task 17.
- **Placeholder scan:** no TBDs; every task has concrete files, code skeletons or exact frozen references, and a commit command.
- **Type consistency:** `dp_content_asset` (Task 1) consumed in Task 1 loader lines only; `data-section-type="aether-*"` matches controller names in Task 14; class contracts (`aether-accordion__body` + `hidden`, `data-category`, `data-allow-multiple`) match between section tasks and controller tasks; `map_embed_url` setting (Task 8) matches D21; template JSON `settings` keys match section settings defined in Tasks 2–12.