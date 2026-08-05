# Huakui Knitting — B2B overseas website

Static, multi-language (EN / DE / ES / FR) marketing site for
**Foshan Huakui Knitting Co., Ltd.** Built with plain HTML/CSS/JS and a
zero-dependency Node build script. Deploys to Vercel.

## Quick start (local preview)

```bash
node build.js
# then serve the docs/ folder any way you like, e.g.:
python -m http.server 8080 --directory docs
# open http://localhost:8080  (auto-redirects to your browser language)
```

Requires Node 18+ (no npm install needed — `build.js` uses only built-ins).

## Project layout

```
src/
  content/{en,de,es,fr}.json   # all copy, single source of truth
  templates/index.html          # home page template
  templates/products.html      # catalog page template
  templates/partials/*.html     # reusable section blocks
  styles/main.css              # eco-minimal design system
  scripts/main.js              # nav, language switch, reveal, form
  assets/{images,video}/       # media
build.js                       # renders templates + JSON → docs/{locale}/
vercel.json                    # Vercel deploy config
docs/                          # build output (gitignored, regenerated)
```

## Edit content

All text lives in `src/content/<locale>.json`. Change copy there and re-run
`node build.js`. No HTML editing needed.

A few values are placeholders to replace before going live — search the JSON
for the keys below and swap in real data:

| Key | Replace with |
|---|---|
| `inquiry.formEndpoint` | `https://formsubmit.co/<your-real-email>` |
| `footer.email` | real sales email |
| `footer.whatsapp` | real WhatsApp number |
| `hero` stats / `factory.stats` | confirm real numbers |

## Deploy to Vercel (non-technical, step by step)

1. **Push to GitHub** — create a repo named `hongbao-socks` and push this folder.
2. Sign up at **vercel.com** → "Continue with GitHub".
3. Dashboard → **Add New… → Project** → import `hongbao-socks`.
4. Vercel reads `vercel.json` automatically. Confirm:
   - Framework Preset: **Other**
   - Build Command: `node build.js`
   - Output Directory: `docs`
5. Click **Deploy**. Vercel builds and gives you a
   `https://hongbao-socks-<random>.vercel.app` URL with HTTPS + global CDN.
6. (Optional) **Settings → Domains** → add `huakuiknitting.com`, point DNS at
   Vercel → free Let's Encrypt SSL.

Every later `git push` re-deploys automatically.

## Inquiry form

Uses **FormSubmit** (no signup). Point `inquiry.formEndpoint` in each
`content/*.json` at `https://formsubmit.co/<your-email>`. **First submission
triggers an activation email** — click the link to start receiving inquiries.

## Languages

| Code | Name |
|---|---|
| en | English (default) |
| de | Deutsch |
| es | Español |
| fr | Français |

Root `/` detects the visitor's browser language and redirects.
