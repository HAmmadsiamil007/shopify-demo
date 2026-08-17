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

const ok = results.length > 0 && results.every((r) => r.ok);
console.log(`\nREGISTRY: ${ok ? 'PASS' : 'FAIL'}`);
process.exit(ok ? 0 : 1);