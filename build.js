/**
 * Huakui Knitting — static site build script (zero dependencies)
 *
 * Reads content JSON + HTML templates, renders 5 language folders into /docs.
 * Mini template engine: partials {{> name}}, variables {{a.b.c}},
 * loops {{#each list}}...{{/each}}, conditionals {{#if key}}...{{/if}}.
 *
 * Usage:  node build.js
 * Env:    BASE_PATH (default "/"), SITE_URL (default https://huakuisocks.com)
 */
const fs = require('fs');
const path = require('path');

const LOCALES = ['en', 'zh', 'de', 'es', 'fr'];
const DEFAULT_LOCALE = 'en';
const LOCALE_NAMES = { en: 'English', zh: '中文', de: 'Deutsch', es: 'Español', fr: 'Français' };
const SRC = path.join(__dirname, 'src');
const OUT = path.join(__dirname, 'docs');
const BASE = (process.env.BASE_PATH || '/').replace(/\/$/, '') || '';
const SITE_URL = (process.env.SITE_URL || 'https://huakuisocks.com').replace(/\/$/, '');

/* ---------- tiny template engine ---------- */
function get(ctx, key) {
  if (key === '.' || key === 'this') return typeof ctx === 'string' ? ctx : '';
  const parts = key.split('.');
  let v = ctx;
  for (const p of parts) {
    if (v == null) return '';
    v = v[p];
  }
  if (v == null) return '';
  return typeof v === 'object' ? JSON.stringify(v) : String(v);
}

function renderVars(tpl, ctx) {
  return tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => escapeHtml(get(ctx, k)));
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// innermost-first block processing (supports single-level nesting realistically used here)
function processBlocks(tpl, ctx) {
  let prev;
  let safety = 0;
  while (tpl !== prev && safety++ < 200) {
    prev = tpl;
    // each
    tpl = tpl.replace(/\{\{#each\s+([\w.]+)\s*\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, key, inner) => {
      const list = get(ctx, key);
      let arr;
      try { arr = JSON.parse(list); } catch { arr = []; }
      if (!Array.isArray(arr)) return '';
      return arr.map((item, idx) => {
        const base = Object.assign({}, ctx, { __i: String(idx + 1) });
        const itemCtx = typeof item === 'object' && item !== null
          ? Object.assign(base, item, { __item: item })
          : Object.assign(base, { '.': item, this: item });
        let out = processBlocks(inner, itemCtx);
        out = renderVars(out, itemCtx);
        return out;
      }).join('');
    });
    // if (truthy)
    tpl = tpl.replace(/\{\{#if\s+([\w.]+)\s*\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, inner) => {
      const val = get(ctx, key);
      const truthy = val !== '' && val !== '0' && val !== 'false' && val !== 'null';
      return truthy ? inner : '';
    });
  }
  return tpl;
}

function loadPartials(dir) {
  const partials = {};
  if (!fs.existsSync(dir)) return partials;
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith('.html')) partials[f.slice(0, -5)] = fs.readFileSync(path.join(dir, f), 'utf8');
  }
  return partials;
}

function injectPartials(tpl, partials) {
  let prev, safety = 0;
  do {
    prev = tpl;
    tpl = tpl.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, n) => partials[n] != null ? partials[n] : `<!-- missing partial: ${n} -->`);
  } while (tpl !== prev && safety++ < 50);
  return tpl;
}

function render(tpl, ctx, partials) {
  tpl = injectPartials(tpl, partials);
  tpl = processBlocks(tpl, ctx);
  tpl = renderVars(tpl, ctx);
  return tpl;
}

/* ---------- helpers ---------- */
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function prefixBase(p) {
  return p.startsWith('/') ? BASE + p : p;
}

function hreflangTags(page) {
  return LOCALES.map(l => `  <link rel="alternate" hreflang="${l}" href="${SITE_URL}${BASE}/${l}/${page}" />`).join('\n') +
    `\n  <link rel="alternate" hreflang="x-default" href="${SITE_URL}${BASE}/${DEFAULT_LOCALE}/${page}" />`;
}

/* ---------- build ---------- */
function build() {
  // ensure docs exists (overwrite in place; avoids sandbox trash-delete issues)
  ensureDir(OUT);

  // copy static assets
  copyDir(path.join(SRC, 'styles'), path.join(OUT, 'assets', 'css'));
  copyDir(path.join(SRC, 'scripts'), path.join(OUT, 'assets', 'js'));
  copyDir(path.join(SRC, 'assets', 'images'), path.join(OUT, 'assets', 'images'));
  copyDir(path.join(SRC, 'assets', 'video'), path.join(OUT, 'assets', 'video'));

  const partials = loadPartials(path.join(SRC, 'templates', 'partials'));
  const templates = {
    index: fs.readFileSync(path.join(SRC, 'templates', 'index.html'), 'utf8'),
    products: fs.existsSync(path.join(SRC, 'templates', 'products.html'))
      ? fs.readFileSync(path.join(SRC, 'templates', 'products.html'), 'utf8') : null,
  };

  for (const locale of LOCALES) {
    const contentPath = path.join(SRC, 'content', `${locale}.json`);
    if (!fs.existsSync(contentPath)) {
      console.warn(`[skip] no content for ${locale}`);
      continue;
    }
    const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
    // add runtime meta
    content.__locale = locale;
    content.__locales = LOCALES.map(l => ({ code: l, name: LOCALE_NAMES[l], current: l === locale }));
    content.__base = BASE;
    content.__siteUrl = SITE_URL;

    const localeDir = path.join(OUT, locale);
    ensureDir(localeDir);

    // index page
    let html = render(templates.index, content, partials);
    html = html.replace('<html>', `<html lang="${locale}">`);
    html = html.replace('<!--HREFLANG-->', hreflangTags(''));
    fs.writeFileSync(path.join(localeDir, 'index.html'), html);

    // products page
    if (templates.products) {
      let phtml = render(templates.products, content, partials);
      phtml = phtml.replace('<html>', `<html lang="${locale}">`);
      phtml = phtml.replace('<!--HREFLANG-->', hreflangTags('products.html'));
      fs.writeFileSync(path.join(localeDir, 'products.html'), phtml);
    }
    console.log(`[ok] rendered ${locale}`);
  }

  // root redirect (browser-language detection)
  const redirectHtml = `<!doctype html><html lang="${DEFAULT_LOCALE}"><head><meta charset="utf-8">
<title>Huakui Knitting — Sustainable Socks Manufacturer</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="canonical" href="${SITE_URL}${BASE}/${DEFAULT_LOCALE}/" />
<!--HREFLANG-->
<meta http-equiv="refresh" content="0; url=${BASE}/${DEFAULT_LOCALE}/">
</head><body>
<script>
(function(){
  var lang=(navigator.language||navigator.userLanguage||'${DEFAULT_LOCALE}').slice(0,2).toLowerCase();
  var langs=['en','zh','de','es','fr'];
  var target=langs.indexOf(lang)>-1?lang:'${DEFAULT_LOCALE}';
  var base=${JSON.stringify(BASE)};
  location.replace(base+'/'+target+'/');
})();
</script>
<p>Redirecting… <a href="${BASE}/${DEFAULT_LOCALE}/">Continue</a></p>
</body></html>`;
  fs.writeFileSync(path.join(OUT, 'index.html'), redirectHtml.replace('<!--HREFLANG-->', hreflangTags('')));

  // 404
  const notFound = `<!doctype html><html lang="${DEFAULT_LOCALE}"><head><meta charset="utf-8">
<title>404 — Huakui Knitting</title><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;font-family:system-ui,sans-serif;background:#F5F8FA;color:#17212B;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center}
a{color:#0878C9}</style></head><body><div><h1 style="font-size:4rem;margin:0;color:#0878C9">404</h1>
<p>This page wandered off the production line.</p><p><a href="${BASE}/${DEFAULT_LOCALE}/">Back to home →</a></p></div></body></html>`;
  fs.writeFileSync(path.join(OUT, '404.html'), notFound);

  // robots.txt
  fs.writeFileSync(path.join(OUT, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}${BASE}/sitemap.xml\n`);

  // sitemap.xml with hreflang
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;
  const pages = ['', 'products.html'];
  for (const p of pages) {
    sitemap += `  <url>\n    <loc>${SITE_URL}${BASE}/${DEFAULT_LOCALE}/${p}</loc>\n`;
    for (const l of LOCALES) {
      sitemap += `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}${BASE}/${l}/${p}"/>\n`;
    }
    sitemap += `  </url>\n`;
  }
  sitemap += `</urlset>\n`;
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemap);

  console.log(`\nBuild complete → ${OUT}`);
  console.log(`Base path: ${BASE}   Site URL: ${SITE_URL}`);
  console.log(`Locales: ${LOCALES.join(', ')}`);
}

build();
