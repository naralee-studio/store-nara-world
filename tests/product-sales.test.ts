import { readFileSync } from 'node:fs';
import { Liquid } from 'liquidjs';
import { expect, it } from 'vitest';
const engine = new Liquid();
const source = readFileSync('snippets/product-for-sale.liquid', 'utf8');
it('only enables explicitly selected sale products and fails closed for new products', async () => {
  for (const [id, expected] of [['little', 'true'], ['family', 'false'], ['new', 'false']]) {
    expect(await engine.parseAndRender(source, {product: {id}, settings: {sale_products: [{id: 'little'}]}})).toBe(expected);
  }
  expect(await engine.parseAndRender(source, {product: {id: 'little'}, settings: {}})).toBe('false');
});
