// Registry integrity gate for the Design Pack Runtime.
// Mirrors the resolution algorithm in snippets/design-pack-resolver.liquid 1:1.
// Usage: node designs/build/check-registry.mjs   (exit 0 = PASS)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themeRoot = path.resolve(__dirname, '..', '..');
const resolverPath = path.join(themeRoot, 'snippets', 'design-pack-resolver.liquid');

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`CHECK ${name}: ${ok ? 'PASS' : 'FAIL'}${detail ? ' — ' + detail : ''}`);
};
const fail = (name, detail) => check(name, false, detail);

const resolver = fs.readFileSync(resolverPath, 'utf8');
const listRe = /assign\s+(dp_\w+)\s*=\s*'([^']*)'\s*\|\s*split:\s*'\|'/g;
const lists = {};
let m;
while ((m = listRe.exec(resolver)) !== null) lists[m[1]] = m[2].split('|');

for (const key of ['dp_packs', 'dp_assets', 'dp_versions', 'dp_statuses']) {
  if (!lists[key]) fail(`registry has ${key}`, 'missing from resolver');
}

if (lists.dp_packs) {
  const len = lists.dp_packs.length;
  const lens = Object.keys(lists).map((k) => `${k}=${lists[k].length}`);
  check('registry lists equal length', lens.every((l) => l.endsWith(`=${len}`)), lens.join(', '));
  check('registry lists non-empty', len >= 1, `length=${len}`);
  check('first pack is aether', lists.dp_packs[0] === 'aether', `dp_packs[0]=${lists.dp_packs[0]}`);
  check('no duplicate pack ids', new Set(lists.dp_packs).size === len, lists.dp_packs.join(','));
}

const resolve = (requested) => {
  const req = String(requested ?? '').trim().toLowerCase();
  const fallback = {
    active: lists.dp_packs[0],
    asset: lists.dp_assets[0],
    enabled: true,
    header_group: lists.dp_header_groups[0],
    footer_group: lists.dp_footer_groups[0],
    popup_group: lists.dp_popup_groups[0],
  };
  if (req === '' || req === 'blank') return fallback;
  const i = lists.dp_packs.indexOf(req);
  if (i === -1) return fallback;
  if (lists.dp_statuses[i] !== 'active') return { active: req, asset: 'none', enabled: false };
  return {
    active: lists.dp_packs[i],
    asset: lists.dp_assets[i],
    enabled: true,
    header_group: lists.dp_header_groups[i],
    footer_group: lists.dp_footer_groups[i],
    popup_group: lists.dp_popup_groups[i],
  };
};

const cases = [
  ['blank fallback', 'blank', { active: 'aether', asset: 'aether', enabled: true, header_group: 'header-group.aether', footer_group: 'footer-group.aether', popup_group: 'popup-group.aether' }],
  ['missing fallback', null, { active: 'aether', asset: 'aether', enabled: true, header_group: 'header-group.aether', footer_group: 'footer-group.aether', popup_group: 'popup-group.aether' }],
  ['invalid fallback', 'bogus', { active: 'aether', asset: 'aether', enabled: true, header_group: 'header-group.aether', footer_group: 'footer-group.aether', popup_group: 'popup-group.aether' }],
  ['case-insensitive', 'AETHER', { active: 'aether', asset: 'aether', enabled: true, header_group: 'header-group.aether', footer_group: 'footer-group.aether', popup_group: 'popup-group.aether' }],
  ['aether default path', 'aether', { active: 'aether', asset: 'aether', enabled: true, header_group: 'header-group.aether', footer_group: 'footer-group.aether', popup_group: 'popup-group.aether' }],
  ['legacy demo path', 'demo', { active: 'demo', asset: 'client-demo', enabled: true, header_group: 'header-group', footer_group: 'footer-group', popup_group: 'popup-group' }],
  ['legacy none path', 'none', { active: 'none', asset: 'none', enabled: false }],
];
for (const [name, input, want] of cases) {
  const got = resolve(input);
  check(name, JSON.stringify(got) === JSON.stringify(want), `input=${JSON.stringify(input)} got=${JSON.stringify(got)}`);
}

if (lists.dp_statuses) {
  lists.dp_packs.forEach((pack, i) => {
    if (pack === 'none') return;
    const status = lists.dp_statuses[i];
    if (status !== 'active') return;
    const isDefault = i === 0;
    for (const ext of ['css.liquid', 'js.liquid']) {
      const file = path.join(themeRoot, 'assets', `${lists.dp_assets[i]}.${ext}`);
      const exists = fs.existsSync(file);
      if (exists || isDefault) {
        check(`asset exists ${lists.dp_assets[i]}.${ext}`, exists || isDefault,
          isDefault && !exists ? 'default pack skeleton lands in Wave 0 T2' : '');
      } else {
        check(`asset exists ${lists.dp_assets[i]}.${ext}`, false, 'missing active-pack asset');
      }
    }
  });
}

if (lists.dp_header_groups) {
  lists.dp_packs.forEach((pack, i) => {
    for (const group of ['dp_header_groups', 'dp_footer_groups', 'dp_popup_groups']) {
      const handle = lists[group][i];
      const file = path.join(themeRoot, 'sections', `${handle}.json`);
      check(`group exists ${pack} -> ${handle}.json`, fs.existsSync(file), file);
    }
  });
}

// ── AETHER WAVE 1 INVENTORY: every aether-* section file must exist ────────
// NOTE: intentionally FAILS mid-wave for sections not yet created (Tasks 5-9);
// full green = Wave 1 end (Task 13 Step 5). Budget + vendor-asset checks below
// must be green once Task 1 lands.
const aetherSections = ['aether-announcement-bar','aether-header','aether-footer','aether-hero','aether-featured-products','aether-collection-grid','aether-page-hero','aether-product','aether-cart-items','aether-blog-posts'];
for (const name of aetherSections) {
  const p = path.join(themeRoot, 'sections', name + '.liquid');
  check(`aether section exists ${name}.liquid`, fs.existsSync(p), p);
}

// ── AETHER BUDGET + PER-PAGE MEASUREMENT helpers ────────────────────────────
const THEME_DIR = themeRoot;

const stripLiquidAndComments = (src) =>
  src
    .replace(/{%[\s\S]*?%}/g, '') // liquid tags (incl. whitespace control)
    .replace(/<!--[\s\S]*?-->/g, ''); // html comments

const stylesheetBytes = (filePath) => {
  if (!fs.existsSync(filePath)) return 0;
  const src = fs.readFileSync(filePath, 'utf8');
  const blocks = src.match(/{%\s*stylesheet\s*%}([\s\S]*?){%\s*endstylesheet\s*%}/g) || [];
  let bytes = 0;
  for (const block of blocks) bytes += Buffer.byteLength(stripLiquidAndComments(block), 'utf8');
  return bytes;
};

// BUDGET HARD CEILING: aether.css.liquid + ALL aether-* section {% stylesheet %}
// blocks (raw bytes, excludes liquid tags + html comments) — FAIL if > 60000.
const computeAetherCssBudget = async (dir) => {
  const base = path.join(dir, 'assets', 'aether.css.liquid');
  const baseBytes = fs.existsSync(base)
    ? Buffer.byteLength(stripLiquidAndComments(fs.readFileSync(base, 'utf8')), 'utf8')
    : 0;
  const sectionDir = path.join(dir, 'sections');
  let sectionsBytes = 0;
  if (fs.existsSync(sectionDir)) {
    const aetherFiles = fs.readdirSync(sectionDir)
      .filter((f) => f.startsWith('aether-') && f.endsWith('.liquid'));
    for (const f of aetherFiles) sectionsBytes += stylesheetBytes(path.join(sectionDir, f));
  }
  const bytes = baseBytes + sectionsBytes;
  return { ok: bytes <= 60000, bytes, baseBytes, sectionsBytes };
};

// PER-PAGE MEASUREMENT (informational — no hard page limits yet): actual
// payload per template = aether.css.liquid + stylesheet blocks of only the
// sections the template loads (incl. header/footer groups) + aether-swiper.min.css
// on slider pages. Recorded in docs/aether/fidelity-report.md at Wave 1 close.
const resolveTemplateSections = (dir, templateFile) => {
  const types = [];
  const visit = (file, seen) => {
    if (!fs.existsSync(file) || seen.has(file)) return;
    seen.add(file);
    let json;
    try {
      json = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return;
    }
    if (!json.sections) return;
    for (const type of Object.keys(json.sections)) {
      const alt = path.join(dir, 'sections', type + '.aether.json');
      const plain = path.join(dir, 'sections', type + '.json');
      const liquid = path.join(dir, 'sections', type + '.liquid');
      if (fs.existsSync(alt)) { types.push(type); visit(alt, seen); }
      else if (fs.existsSync(plain)) { types.push(type); visit(plain, seen); }
      else if (fs.existsSync(liquid)) types.push(type);
    }
  };
  visit(path.join(dir, 'templates', templateFile), new Set());
  return types;
};

const computeAetherPageCssBudgets = (dir) => {
  const pages = {
    home: 'index.aether.json',
    collection: 'collection.aether.json',
    product: 'product.aether.json',
    cart: 'cart.aether.json',
  };
  const baseFile = path.join(dir, 'assets', 'aether.css.liquid');
  const baseBytes = fs.existsSync(baseFile)
    ? Buffer.byteLength(stripLiquidAndComments(fs.readFileSync(baseFile, 'utf8')), 'utf8')
    : 0;
  const swiperCssFile = path.join(dir, 'assets', 'aether-swiper.min.css');
  const swiperCssBytes = fs.existsSync(swiperCssFile) ? fs.statSync(swiperCssFile).size : 0;
  const out = {};
  for (const [key, file] of Object.entries(pages)) {
    const tpl = path.join(dir, 'templates', file);
    if (!fs.existsSync(tpl)) {
      out[key] = { bytes: null, note: `template ${file} not created yet (later wave task)` };
      continue;
    }
    const types = resolveTemplateSections(dir, file);
    let bytes = baseBytes;
    for (const type of types) bytes += stylesheetBytes(path.join(dir, 'sections', type + '.liquid'));
    if (types.includes('aether-hero')) bytes += swiperCssBytes;
    out[key] = { bytes, sections: types };
  }
  return out;
};

const budgetBytes = await computeAetherCssBudget(THEME_DIR);
check('BUDGET aether css pack ceiling <= 60000 B', budgetBytes.ok,
  `${budgetBytes.bytes} B (base ${budgetBytes.baseBytes} B + aether section stylesheets ${budgetBytes.sectionsBytes} B)`);

const pageBudgets = computeAetherPageCssBudgets(THEME_DIR);
console.log('PAGE BUDGETS (informational — no hard limits; recorded in docs/aether/fidelity-report.md at Wave 1 close):');
for (const [key, b] of Object.entries(pageBudgets)) {
  if (b.bytes === null) console.log(`PAGE BUDGET ${key}: n/a — ${b.note}`);
  else console.log(`PAGE BUDGET ${key}: ${b.bytes} B (sections: ${b.sections.join(', ')})`);
}

// ── AETHER VENDOR ASSETS exist ──────────────────────────────────────────────
for (const f of ['aether-swiper.min.js','aether-swiper.min.css','aether-gsap.min.js','aether-lenis.min.js','aether-motion.js','aether-product.js']) {
  check(`aether asset exists ${f}`, fs.existsSync(path.join(THEME_DIR, 'assets', f)), '');
}

// ── AETHER CONTENT ASSETS (Wave 2 T1) ───────────────────────────────────────
// Skeletons ship a comment ledger only; budget measured the same way as the
// aether.css base (liquid tags + html comments stripped, UTF-8 bytes).
const contentCssFile = path.join(THEME_DIR, 'assets', 'aether-content.css.liquid');
const contentJsFile = path.join(THEME_DIR, 'assets', 'aether-content.js.liquid');
const contentCssBytes = fs.existsSync(contentCssFile)
  ? Buffer.byteLength(stripLiquidAndComments(fs.readFileSync(contentCssFile, 'utf8')), 'utf8')
  : -1;
const contentJsBytes = fs.existsSync(contentJsFile)
  ? Buffer.byteLength(stripLiquidAndComments(fs.readFileSync(contentJsFile, 'utf8')), 'utf8')
  : -1;
check(`content asset exists aether-content.css.liquid`, fs.existsSync(contentCssFile), '');
check(`content asset exists aether-content.js.liquid`, fs.existsSync(contentJsFile), '');
check('BUDGET aether-content.css.liquid <= 40960 B', contentCssBytes >= 0 && contentCssBytes <= 40960, `${contentCssBytes} B`);
check('BUDGET aether-content.js.liquid <= 20480 B', contentJsBytes >= 0 && contentJsBytes <= 20480, `${contentJsBytes} B`);

// ── AETHER CONTENT GATE (Wave 2 T1) — mirrors design-pack-resolver.liquid ───
// dp_content_asset: 'aether-content' on content templates when dp_enabled,
// nil on commerce templates. The template list is parsed from the resolver
// source so the gate test can never drift from the resolver.
const contentListRe = /assign\s+dp_content_templates\s*=\s*'([^']*)'\s*\|\s*split:\s*','/;
const contentListMatch = contentListRe.exec(resolver);
const contentTemplates = contentListMatch ? contentListMatch[1].split(',') : [];
check('resolver defines dp_content_templates', contentListMatch !== null && contentTemplates.length > 0,
  contentListMatch ? contentListMatch[1] : 'gate missing from resolver');
const contentAssetFor = (templateName) =>
  contentTemplates.includes(templateName) ? 'aether-content' : null;
for (const t of ['blog', 'article', 'page', 'search', '404', 'password']) {
  const got = contentAssetFor(t);
  check(`content gate emits on ${t}`, got === 'aether-content', `got=${JSON.stringify(got)}`);
}
for (const t of ['index', 'collection', 'product', 'cart', 'list-collections']) {
  const got = contentAssetFor(t);
  check(`content gate silent on ${t}`, got === null, `got=${JSON.stringify(got)}`);
}

const ok = results.length > 0 && results.every((r) => r.ok);
console.log(`\nREGISTRY: ${ok ? 'PASS' : 'FAIL'}`);
process.exit(ok ? 0 : 1);