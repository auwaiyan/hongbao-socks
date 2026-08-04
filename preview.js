/**
 * Generate a self-contained preview HTML (CSS/JS/favicon inlined, video placeholder)
 * so the site can be viewed by double-clicking the file — no server, no internet.
 * Usage: node preview.js [locale]
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const DOCS = path.join(ROOT, 'docs');
const locale = process.argv[2] || 'en';

const css = fs.readFileSync(path.join(SRC, 'styles', 'main.css'), 'utf8');
const js = fs.readFileSync(path.join(SRC, 'scripts', 'main.js'), 'utf8');
const svg = fs.readFileSync(path.join(SRC, 'assets', 'images', 'favicon.svg'), 'utf8');
const iconUri = 'data:image/svg+xml,' + encodeURIComponent(svg);

let html = fs.readFileSync(path.join(DOCS, locale, 'index.html'), 'utf8');

// inline stylesheet
html = html.replace(/<link rel="stylesheet" href="\/assets\/css\/main\.css"[^>]*>/,
  `<style>\n${css}\n.hero-video-poster{aspect-ratio:4/3;border-radius:8px;background:linear-gradient(135deg,#d8e6cf,#eaf3de);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.4rem;color:#2F4A2C}\n.hero-video-poster span{font-size:2.6rem;line-height:1}\n.hero-video-poster em{font-style:normal;font-size:.85rem;opacity:.7}\n</style>`);

// inline favicon
html = html.replace(/<link rel="icon" href="\/assets\/images\/favicon\.svg"[^>]*>/,
  `<link rel="icon" href="${iconUri}">`);

// inline script
html = html.replace(/<script src="\/assets\/js\/main\.js"[^>]*><\/script>/,
  `<script>\n${js}\n</script>`);

// replace video element with a styled placeholder (no local media in preview)
html = html.replace(/<video[\s\S]*?<\/video>/,
  '<div class="hero-video-poster"><span>▶</span><em>Factory production video</em></div>');

// drop external meta refs that can't resolve locally (og:image etc.) — visual only
html = html.replace(/<meta property="og:image"[^>]*>/, '');

const out = path.join(ROOT, `site-preview-${locale}.html`);
fs.writeFileSync(out, html);
console.log(`wrote ${out}  (${(html.length / 1024).toFixed(1)} KB)`);
