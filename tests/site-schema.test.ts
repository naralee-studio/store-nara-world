import { readFileSync } from 'node:fs';
import { Liquid } from 'liquidjs';
import { expect, it } from 'vitest';
const source = readFileSync('snippets/site-structured-data.liquid','utf8').replace(/{% doc %}[\s\S]*?{% enddoc %}/,'');
const engine = new Liquid();
engine.registerFilter('t', (key:string)=>({'general.home':'Home','collections.title':'Products'}[key] || key));
const context = {settings:{organization_url:'https://nara.world/',support_email:'contact@nara.world'},shop:{name:'nara.',url:'https://store.nara.world'},routes:{root_url:'/',all_products_collection_url:'/collections/all'},canonical_url:'https://store.nara.world/products/little',page_title:'little family',product:{title:'little family'},description:'A limited edition.'};
async function render(pageType:string, extra={}) {return engine.parseAndRender(source,{...context,request:{page_type:pageType,locale:{iso_code:'en'}},...extra});}
it('links the shared brand to a distinct storefront site, page, product and breadcrumb',async()=>{
 const html=await render('product');const graph=JSON.parse(html.match(/<script[^>]*>([\s\S]*?)<\/script>/)![1])['@graph'];
 const byType=(type:string)=>graph.find((node:any)=>node['@type']===type);
 expect(byType('Organization')['@id']).toBe('https://nara.world/#organization');
 expect(byType('WebSite')['@id']).toBe('https://store.nara.world/#website');
 expect(byType('WebPage').mainEntity['@id']).toBe(context.canonical_url+'#product');
 expect(byType('BreadcrumbList').itemListElement.at(-1).item).toBe(context.canonical_url);
 expect(byType('Product')).toBeUndefined();expect(byType('VideoObject')).toBeUndefined();
});
it('escapes script-closing text while preserving valid JSON and omits private utility pages',async()=>{
 const title='little </script><script>alert(1)</script>';
 const html=await render('product',{page_title:title});
 expect(html.match(/<script/g)).toHaveLength(1);
 const graph=JSON.parse(html.match(/<script[^>]*>([\s\S]*?)<\/script>/)![1])['@graph'];
 expect(graph.find((n:any)=>n['@type']==='WebPage').name).toBe(title);
 for(const page of ['cart','search','password','404'])expect((await render(page)).trim()).toBe('');
});
