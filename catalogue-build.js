/* Stable public style references shared by catalogues, translations and quote forms. */
const fs = require('fs');
const path = require('path');
module.exports = function buildCatalogue(out, site, base, locales) {
  const registry = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/content/style-references.json'), 'utf8'));
  const ui = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/content/style-inquiry-i18n.json'), 'utf8'));
  const esc = value => String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const images = new Map(), codes = new Set();
  for (const item of registry) {
    if (!/^YYJ-0[1-3]-\d{5}$/.test(item.code) || item.code.slice(4,6) !== String(item.line).padStart(2,'0') || codes.has(item.code) || images.has(item.image)) throw Error('Invalid or duplicate style reference: '+item.code);
    if (!fs.existsSync(path.join(out,'assets/images',item.image))) throw Error('Missing style image: '+item.image);
    images.set(item.image,item); codes.add(item.code);
  }
  function referenceFor(tag) {
    const src = tag.match(/\bsrc="([^"]+)"/);
    return src && images.get(src[1].replace(base+'/assets/images/',''));
  }
  const files=[];
  function walk(dir) { for(const e of fs.readdirSync(dir,{withFileTypes:true})) { const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(p.endsWith('.html'))files.push(p); } }
  for(const locale of locales)walk(path.join(out,locale));
  for(const file of files) {
    const route=path.relative(out,file).replace(/\\/g,'/'), locale=route.split('/')[0], labels=ui[locale];
    let h=fs.readFileSync(file,'utf8'), count=0;
    function caption(item,tag) {
      count++;
      return `<${tag} class="style-caption"><span class="style-code">${item.code}</span><a class="style-quote" href="${base}/${locale}/?style=${item.code}#inquiry" aria-label="${esc(labels.quote+' '+item.code)}">${esc(labels.quote)} <span aria-hidden="true">→</span></a></${tag}>`;
    }
    // Only catalogue cards and gallery figures get a caption, never decorative or hero images.
    h=h.replace(/<article class="portfolio-card">[\s\S]*?<\/article>/g,card=>{
      const item=referenceFor(card);if(!item)throw Error('Catalogue image has no permanent reference');
      return card.replace('</article>',caption(item,'div')+'</article>');
    });
    h=h.replace(/<div class="product-line-gallery">([\s\S]*?)<\/div>/g,(m,inside)=>
      '<div class="product-line-gallery">'+inside.replace(/<figure>[\s\S]*?<\/figure>/g,figure=>{
        const item=referenceFor(figure);if(!item)throw Error('Gallery image has no permanent reference');
        return figure.replace('</figure>',caption(item,'figcaption')+'</figure>');
      })+'</div>');
    function terms(headingTag) { return `<section class="style-terms"><${headingTag}>${esc(labels.termsTitle)}</${headingTag}><dl>${labels.terms.map(t=>`<div><dt>${esc(t[0])}</dt><dd>${esc(t[1])}</dd></div>`).join('')}</dl></section>`; }
    if(count) h=h.replace('</main>',`<section class="band"><div class="container">${terms('h2')}</div></section>\n</main>`);
    const hasForm=h.includes('data-form="inquiry"');
    if(hasForm) {
      h=h.replace(`src="${base}/assets/js/main.js"`, `src="${base}/assets/js/main.js?v=yyj-20260907"`);
      const options=registry.map(item=>`<option value="${item.code}" data-line="${item.line}" data-image="${esc(site+base+'/assets/images/'+item.image)}">${item.code}</option>`).join('');
      const fields=`<label class="form-full">${esc(labels.reference)}<select name="Style reference"><option value="">${esc(labels.noReference)}</option>${options}</select></label><div class="form-full style-preview" data-style-preview hidden><img data-style-image alt="" width="72" height="90"><div><span>${esc(labels.selected)}</span><strong data-style-code></strong></div></div><input type="hidden" name="Reference image" value=""><div class="form-row style-order-fields"><label>${esc(labels.quantity)}<input type="number" name="Estimated quantity (pairs)" min="1" step="1" inputmode="numeric" placeholder="${esc(labels.optional)}"></label><label>${esc(labels.delivery)}<input type="date" name="Requested delivery date"></label></div>`;
      h=h.replace('<label class="form-full">',fields+'<label class="form-full">');
      h=h.replace(/(<ul class="inquiry-contact">[\s\S]*?<\/ul>)/,'$1'+terms('h3'));
      h=h.replace('</body>',`<script src="${base}/assets/js/style-inquiry.js?v=yyj-20260907" defer></script>\n</body>`);
    }
    if(count||hasForm) h=h.replace('</head>',`<link rel="stylesheet" href="${base}/assets/css/style-inquiry.css?v=yyj-20260907">\n</head>`);
    fs.writeFileSync(file,h);
  }
  console.log(`[catalogue] ${registry.length} permanent references, ${locales.length} languages; quote forms connected.`);
};
