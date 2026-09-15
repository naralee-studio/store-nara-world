// Inspect server HTML, without executing React or browser scripts.
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
const template = JSON.parse(readFileSync(new URL('../templates/product.json', import.meta.url), 'utf8')).sections.main;
const [base = 'http://127.0.0.1:9292', ...paths] = process.argv.slice(2);
assert(paths.length, 'Pass product paths to audit');
for (const path of paths) {
  const response = await fetch(new URL(path, base));
  assert(response.ok, `HTTP ${response.status}: ${path}`);
  const document = new JSDOM(await response.text()).window.document;
  const meta = name => document.querySelector(`meta[property="${name}"],meta[name="${name}"]`)?.content;
  const json = [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap(script => {
    const value = JSON.parse(script.textContent);
    return Array.isArray(value) ? value : value['@graph'] || [value];
  });
  const products = json.filter(item => ['Product', 'ProductGroup'].includes(item['@type']));
  assert.equal(products.length, 1, 'Exactly one root product schema');
  const product = products[0];
  assert(product.name && product.description && product.url, 'Product identity and description');
  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  assert(canonical && !/[?&](preview_theme_id|variant|section_id)=/.test(canonical), 'Clean canonical');
  assert.equal(product.url, canonical);
  assert(meta('description') && meta('og:title'), 'Description and social title');
  assert.equal(document.querySelectorAll('h1').length, 1, 'Single product heading');
  const state = JSON.parse(document.querySelector('[data-product-state]').textContent);
  const website = json.find(item=>item['@type']==='WebSite');
  const webpage = json.find(item=>item['@type']==='WebPage');
  const organization = json.find(item=>item['@type']==='Organization');
  assert.equal(website.publisher['@id'], organization['@id']);
  assert.equal(webpage.isPartOf['@id'], website['@id']);
  assert.equal(webpage.mainEntity['@id'], new URL(product['@id'], canonical).href);
  const crumbs = json.find(item=>item['@type']==='BreadcrumbList').itemListElement;
  assert.equal(crumbs.at(-1).item, canonical);
  const variants = product['@type'] === 'ProductGroup' ? product.hasVariant : [product];
  assert(variants?.length, 'Products/variants are present');
  const offers = variants.flatMap(item => Array.isArray(item.offers) ? item.offers : [item.offers]);
  for (const offer of offers) {
    assert(offer && Number.isFinite(Number(offer.price)) && Number(offer.price) >= 0, 'Numeric price');
    assert(/^[A-Z]{3}$/.test(offer.priceCurrency), 'ISO currency');
    assert(offer.availability?.includes('schema.org/'), 'Availability');
    assert.equal(new URL(offer.url).origin, new URL(canonical).origin, 'Public offer URL');
    assert(!offer.url.includes('preview_theme_id'), 'No preview offer URL');
  }
  if (state.variant) {
    const selected = offers.find(offer => new URL(offer.url).searchParams.get('variant') === state.variant.id);
    assert(selected, 'Selected variant has an offer');
    assert.equal(Number(meta('product:price:amount')), Number(selected.price), 'Social price matches selected offer');
    assert.equal(meta('product:price:currency'), selected.priceCurrency);
  }
  const details = [...document.querySelectorAll('.product-accordion')].map(el => ({heading:el.querySelector('summary').textContent.replace('+','').trim(),text:el.querySelector('.accordion-content').textContent.trim()}));
  assert(details.length && details.every(item => item.text), 'Non-empty details in server HTML');
  const handle = new URL(canonical).pathname.split('/').at(-1);
  const expected = template.block_order.map(id=>template.blocks[id]).filter(block=>block.type==='accordion' && (block.settings.scope==='all' || block.settings.product===handle)).map(block=>block.settings.heading);
  assert.deepEqual(details.map(item=>item.heading), expected, 'Only shared and matching-product details');
  console.log(JSON.stringify({path,type:product['@type'],offers:offers.length,canonical,details:details.map(item=>item.heading),status:'pass'}));
}
