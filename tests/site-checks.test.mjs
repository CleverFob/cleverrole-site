// Public site regression checks. No network, no dependencies, no product changes: it only reads the files.
// Run: node --test tests/site-checks.test.mjs
// Proves, before any release: every page is there, every link and picture it names exists, the site stays
// hidden from search until launch, the sitemap matches the pages, and wording rules for customers still hold.
import test from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = { '/': 'index.html', '/privacy': 'privacy/index.html', '/terms': 'terms/index.html' };
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
// Set LAUNCHED=1 on launch day: the noindex checks then flip to "must be indexable".
const LAUNCHED = process.env.LAUNCHED === '1';

// A path like /privacy or /icon-180.png or /terms/ -> the file it serves.
function fileFor(urlPath) {
  const p = urlPath.split('#')[0].split('?')[0];
  if (PAGES[p]) return PAGES[p];
  if (PAGES[p.replace(/\/$/, '')]) return PAGES[p.replace(/\/$/, '')];
  return p.replace(/^\//, '');
}

for (const [url, file] of Object.entries(PAGES)) {
  test(`${url}: page file exists and has the basics`, () => {
    assert.ok(existsSync(join(ROOT, file)), `${file} is missing`);
    const h = read(file);
    assert.match(h, /^<!doctype html>/i);
    assert.match(h, /<html lang="en"/);
    assert.match(h, /<meta name="viewport" content="width=device-width/);
    assert.match(h, /<title>[^<]+<\/title>/);
    assert.match(h, /<link rel="canonical" href="https:\/\/cleverrole\.com\//);
  });

  test(`${url}: every local link, picture, icon and script it names exists`, () => {
    const h = read(file);
    const refs = [...h.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((m) => m[1])
      .concat([...h.matchAll(/url\((?!data:)['"]?([^'")]+)['"]?\)/g)].map((m) => m[1]));
    const local = refs.filter((r) => r.startsWith('/') && !r.startsWith('//'));
    assert.ok(local.length > 0, 'found no local references, the check itself is broken');
    for (const r of local) {
      const f = fileFor(r);
      assert.ok(existsSync(join(ROOT, f)), `${url} points at ${r} but ${f} does not exist`);
    }
  });

  test(`${url}: search visibility matches the launch state`, () => {
    const h = read(file);
    const hidden = /<meta name="robots" content="[^"]*noindex/i.test(h);
    assert.strictEqual(hidden, !LAUNCHED, LAUNCHED ? 'launched but page still says noindex' : 'page is missing noindex before launch');
  });

  test(`${url}: no secrets and no wording that must never reach customers`, () => {
    const h = read(file);
    for (const re of [/sk_live_/, /sk_test_/, /whsec_/, /AKIA[A-Z0-9]{16}/, /-----BEGIN [A-Z ]*KEY-----/, /eyJ[\w-]{40,}\.[\w-]{10,}/]) {
      assert.ok(!re.test(h), `${file} looks like it contains a secret (${re})`);
    }
    // Only the visible text and the page title/description are checked, not the chat's hidden matching rules.
    const visible = h.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ');
    for (const word of [/\bStripe\b/i, /\bChatGPT\b/i, /\bOpenAI\b/i, /\bAnthropic\b/i, /\bClaude\b/i, /\bWyoming\b/i, /\bCasper\b/i]) {
      assert.ok(!word.test(visible), `${file} shows customers ${word}`);
    }
  });

  test(`${url}: picture and social-card files are real files`, () => {
    const h = read(file);
    const og = h.match(/property="og:image" content="https:\/\/cleverrole\.com(\/[^"]+)"/);
    assert.ok(og, 'og:image is missing');
    assert.ok(existsSync(join(ROOT, og[1].slice(1))), `og:image file ${og[1]} is missing`);
  });
}

test('sitemap lists exactly the pages that exist', () => {
  const xml = read('sitemap.xml');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(urls.length >= 3);
  for (const u of urls) {
    assert.match(u, /^https:\/\/cleverrole\.com\//);
    const f = fileFor(new URL(u).pathname);
    assert.ok(existsSync(join(ROOT, f)), `sitemap lists ${u} but ${f} does not exist`);
  }
  for (const url of Object.keys(PAGES)) {
    assert.ok(urls.some((u) => new URL(u).pathname.replace(/\/$/, '') === url.replace(/\/$/, '')), `${url} is missing from the sitemap`);
  }
});

test('robots.txt lets search engines see the pages (so they can see noindex) and points nowhere odd', () => {
  const r = read('robots.txt');
  assert.ok(!/^\s*Disallow:\s*\/\s*$/m.test(r), 'robots.txt blocks the whole site; a blocked page can never be seen to say noindex');
});

test('web manifest and 404 page are valid', () => {
  const m = JSON.parse(read('site.webmanifest'));
  assert.ok(m.name);
  for (const i of m.icons || []) assert.ok(existsSync(join(ROOT, i.src.replace(/^\//, ''))), `manifest icon ${i.src} is missing`);
  assert.match(read('404.html'), /<title>/);
  assert.match(read('CNAME'), /cleverrole\.com/);
});

test('no stray secrets or env files anywhere in the repo', () => {
  const bad = [];
  (function walk(d) {
    for (const n of readdirSync(d)) {
      if (n === '.git' || n === 'node_modules') continue;
      const p = join(d, n);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      if (/^\.env/.test(n) || /\.(pem|key|p12)$/.test(n)) bad.push(p);
    }
  })(ROOT);
  assert.deepStrictEqual(bad, []);
});
