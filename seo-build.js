/* SEO finishing pass for generated HTML. Source content remains in src/content. */
const fs = require('fs');
const path = require('path');
module.exports = function finishSeo(out, site, base, locales) {
  const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const json = o => JSON.stringify(o).replace(/</g, '\\u003c');
  const files = [];
  function walk(dir) { for (const e of fs.readdirSync(dir, {withFileTypes:true})) {
    const p=path.join(dir,e.name); if(e.isDirectory()) walk(p); else if(p.endsWith('.html')) files.push(p);
  }}
  for(const locale of locales) walk(path.join(out,locale));
  const routes=new Set(files.map(p=>'/'+path.relative(out,p).replace(/\\/g,'/').replace(/index\.html$/,'')));
  const labels={en:'Products',zh:'产品',de:'Produkte',es:'Productos',fr:'Produits'};
  const homeLabels={en:'Home',zh:'首页',de:'Startseite',es:'Inicio',fr:'Accueil'};
  const slugs=['custom-promotional-socks-manufacturer','custom-jacquard-novelty-socks-manufacturer','custom-team-sports-socks-manufacturer'];
  const names=['Custom Promotional & Logo Socks','Custom Jacquard & Novelty Socks','Custom Sports & Team Socks'];
  const guide='/en/guides/sock-materials-guide-cotton-bamboo-recycled-polyester.html';
  const moq='/en/guides/private-label-socks-moq-sampling-lead-time.html';
  function webpSize(p) {
    const b=fs.readFileSync(p); if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP') return null;
    const type=b.toString('ascii',12,16);
    if(type==='VP8X') return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];
    if(type==='VP8 ') return [b.readUInt16LE(26)&16383,b.readUInt16LE(28)&16383];
    if(type==='VP8L') {const n=b.readUInt32LE(21);return [(n&16383)+1,((n>>>14)&16383)+1];}
    return null;
  }
  const sizeCache=new Map();
  for(const file of files) {
    const route='/'+path.relative(out,file).replace(/\\/g,'/').replace(/index\.html$/,'');
    const locale=route.split('/')[1], suffix=route.slice(locale.length+2), home=suffix==='';
    let h=fs.readFileSync(file,'utf8');
    h=h.replace('</head>','<noscript><style>.reveal{opacity:1;transform:none}</style></noscript>\n</head>');
    // Header targets must work from every page, including guides and category pages.
    h=h.replace(/<header class="site-header"[\s\S]*?<\/header>/,header=>header
      .replace(/href="#products"/g,`href="${base}/${locale}/products.html"`)
      .replace(/href="#(factory|sustainability|inquiry)"/g,`href="${base}/${locale}/#$1"`)
      .replace(/href="([^" ]*\/)(en|zh|de|es|fr)\/" role="menuitem"/g,(m,p,l)=>
        `href="${base}/${l}/${routes.has('/'+l+'/'+suffix)?suffix:''}" role="menuitem"`));
    // Only list real equivalent translations; never point an English-only guide at unrelated home pages.
    h=h.replace(/\s*<link rel="alternate" hreflang="[^"]+" href="[^"]+"\s*\/>/g,'');
    const equivalents=locales.filter(l=>routes.has('/'+l+'/'+suffix));
    if(equivalents.length>1) h=h.replace('</head>',equivalents.map(l=>`<link rel="alternate" hreflang="${l}" href="${site}${base}/${l}/${suffix}">`).join('\n')+`\n<link rel="alternate" hreflang="x-default" href="${site}${base}/en/${suffix}">\n</head>`);
    // Add the organization's stable identity without inventing product ratings or prices.
    h=h.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(m,raw)=>{
      const o=JSON.parse(raw); if(o['@type']==='Organization') Object.assign(o,{'@id':site+'/#organization',url:site+base+'/en/',logo:site+base+'/assets/images/huakui-mark.png'});
      return `<script type="application/ld+json">${json(o)}</script>`;
    });
    if(suffix==='products.html') h=h.replace('Made for brands, programmes and everyday demand.','Custom Sock Collections for Brands and Teams');
    const title=(h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)||[])[1]||labels[locale];
    if(!home) {
      const crumbs=[{name:homeLabels[locale],url:`${site}${base}/${locale}/`}];
      if(suffix.startsWith('products/')) crumbs.push({name:labels[locale],url:`${site}${base}/${locale}/products.html`});
      const decoded=title.replace(/&amp;/g,'&').replace(/<[^>]+>/g,'');
      crumbs.push({name:decoded,url:site+base+route});
      h=h.replace('</head>',`<script type="application/ld+json">${json({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:crumbs.map((c,i)=>({'@type':'ListItem',position:i+1,name:c.name,item:c.url}))})}</script>\n</head>`);
      if(suffix.startsWith('products/')) h=h.replace(/<a class="back-link"[^>]*>[\s\S]*?<\/a>/,`<nav aria-label="Breadcrumb"><a href="${base}/${locale}/">${homeLabels[locale]}</a> / <a href="${base}/${locale}/products.html">${labels[locale]}</a> / <span>${title}</span></nav>`);
    }
    if(suffix==='products.html') {
      h=h.replace('Made for brands, programmes and everyday demand.','Custom Sock Collections for Brands and Teams');
      // Directory pages previously contained images but no category-detail links.
      let i=0; h=h.replace(/<div class="portfolio-toolbar">/g,()=>{const n=i++;return `<p><a href="${base}/${locale}/products/${slugs[n]}.html">${locale==='en'?names[n]:labels[locale]} →</a></p><div class="portfolio-toolbar">`;});
    }
    if(locale==='en') {
      let content='';
      if(suffix==='private-label.html') content=`<section class="private-label-section"><h2>Materials and Sourcing Requirements</h2><p>Considering bamboo-derived yarns for a lifestyle range or merino wool for an outdoor sock brief? Share your intended fibre blend, sock weight and target market. Ask our team to confirm yarn availability, sampling feasibility and supporting documents before selecting a material.</p><p>For bamboo socks, define the actual fibre composition and labelling requirements. For merino wool socks, specify wool percentage, cushioning and care requirements. Material selection alone does not establish that a finished sock is sustainable.</p><p><a href="${base}${guide}">Compare cotton, bamboo-derived fibres and recycled polyester</a></p><h2>MOQ, Sampling and Lead Times</h2><p>Send quantities by design, colour and size, your packaging brief and required delivery date. Minimum order quantity, sample timing and production lead time need to be confirmed for the agreed specification.</p><p><a href="${base}${moq}">Read the MOQ, sampling and lead-time guide</a></p></section>`;
      if(suffix.startsWith('products/')||suffix==='private-label.html') content+=`<section class="band"><div class="container"><h2>Plan Your Custom Sock Programme</h2><p>Compare the relevant product line, then share your artwork, intended use, quantity and packaging requirements.</p><ul>${slugs.filter(s=>!suffix.includes(s)).map(s=>`<li><a href="${base}/en/products/${s}.html">${names[slugs.indexOf(s)]}</a></li>`).join('')}${suffix!=='private-label.html'?`<li><a href="${base}/en/private-label.html">Private label development and packaging</a></li>`:''}<li><a href="${base}${moq}">MOQ, sampling and lead times</a></li></ul></div></section>`;
      if(home) content=`<section class="band"><div class="container"><h2>Prepare Your Sock Sourcing Brief</h2><p>Define the wearer, intended use, quantities by design and size, material requirements and packaging before requesting a quote.</p><p><a href="${base}/en/private-label.html">Private label sock development</a> · <a href="${base}${guide}">Sock material guide</a> · <a href="${base}${moq}">MOQ and sampling guide</a></p></div></section>`;
      h=h.replace('</main>',content+'\n</main>');
    }
    let imageIndex=0;
    h=h.replace(/<img\b[^>]*>/g,tag=>{
      const src=(tag.match(/src="([^"]+)"/)||[])[1]; if(!src)return tag;
      const imageAlts={
        'product-line-1-web/2.webp':'Ribbed crew socks in green, yellow and cream with cuff lettering',
        'product-line-2-web/15.webp':'Striped crew socks in dark and neutral colour combinations',
        'product-line-3-web/16.webp':'Navy, green and grey crew socks with contrasting heel and toe panels'
      };
      if(locale==='en') for(const [key,alt] of Object.entries(imageAlts)) if(src.endsWith('/'+key)) tag=tag.replace(/alt="[^"]*"/,`alt="${alt}"`);
      const logo=src.includes('huakui-mark');
      if(!logo) {
        imageIndex++;
        if(imageIndex>1&&!/loading=/.test(tag))tag=tag.replace('>',' loading="lazy">');
        if(!/decoding=/.test(tag))tag=tag.replace('>',' decoding="async">');
      }
      if(src.endsWith('.webp')&&!/\bwidth=/.test(tag)) {
        const local=path.join(out,src.slice(base.length).replace(/^\//,''));
        if(!sizeCache.has(local))sizeCache.set(local,webpSize(local));
        const size=sizeCache.get(local); if(size)tag=tag.replace('>',` width="${size[0]}" height="${size[1]}">`);
      }
      return tag;
    });
    // Preserve user-initiated playback; avoid automatically fetching the 27.6 MB video.
    h=h.replace(/<video\b[\s\S]*?>/g,t=>t.replace(/preload="auto"/,'preload="metadata"').replace(/\s+autoplay\b/,''));
    fs.writeFileSync(file,h);
  }
  // Every generated canonical page gets its own sitemap entry, with reciprocal alternates.
  let xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
  for(const route of [...routes].sort()) {
    const suffix=route.split('/').slice(2).join('/');
    const equivalents=locales.filter(l=>routes.has('/'+l+'/'+suffix));
    xml+=`<url><loc>${esc(site+base+route)}</loc>`;
    if(equivalents.length>1) for(const l of equivalents)xml+=`<xhtml:link rel="alternate" hreflang="${l}" href="${esc(site+base+'/'+l+'/'+suffix)}"/>`;
    xml+='</url>\n';
  }
  fs.writeFileSync(path.join(out,'sitemap.xml'),xml+'</urlset>\n');
  console.log(`[seo] Updated ${files.length} pages and sitemap; existing URLs retained.`);
};
