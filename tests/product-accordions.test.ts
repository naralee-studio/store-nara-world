import { readFileSync } from 'node:fs';
import { Liquid } from 'liquidjs';
import { expect, it } from 'vitest';
const source = readFileSync('snippets/product-accordions.liquid','utf8').replace(/{% doc %}[\s\S]*?{% enddoc %}/,'');
const engine = new Liquid();
const shared = {type:'accordion',settings:{heading:'Shipping',content:'Shared information'}};
const family = {type:'accordion',settings:{scope:'product',product:{id:'family'},heading:'Dimensions',content:'Sofa 143.5 cm'}};
const little = {type:'accordion',settings:{scope:'product',product:{id:'little'},heading:'Dimensions',content:'32 × 24 × 4 cm'}};
it('renders shared and matching product content in server HTML, never another product’s specifications',async()=>{
 const html = await engine.parseAndRender(source,{product:{id:'little'},section:{blocks:[shared,family,little]}});
 expect(html).toContain('Shared information');expect(html).toContain('32 × 24 × 4 cm');expect(html).not.toContain('Sofa');
 expect(html.match(/<details /g)).toHaveLength(2);
});
it('keeps linked page content and hides empty details',async()=>{
 const html = await engine.parseAndRender(source,{product:{id:'little'},section:{blocks:[{type:'accordion',settings:{heading:'Returns',page:{content:'Page policy'}}},{type:'accordion',settings:{heading:'Empty'}}]}});
 expect(html).toContain('Page policy');expect(html).not.toContain('Empty');
});

it('hides restricted content when its selected product is missing',async()=>{
 const html=await engine.parseAndRender(source,{product:{id:'little'},section:{blocks:[{type:'accordion',settings:{scope:'product',heading:'Private dimensions',content:'Wrong specifications'}}]}});
 expect(html).not.toContain('Wrong specifications');
});
