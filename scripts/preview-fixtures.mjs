// Local-only QA server. Synthetic products; never forwards cart writes to Shopify.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
const strings = JSON.parse(
  readFileSync("locales/en.default.json", "utf8"),
).product;
const esc = (text) =>
  String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
const ids = ["m-one", "m-two", "m-three"];
const mediaById = Object.fromEntries(
  ids.map((id, index) => {
    const src = `/image/${index}`;
    return [
      id,
      {
        id,
        src,
        srcset: `${src} 800w`,
        sizes: "100vw",
        width: 800,
        height: 600,
        alt: `Test image ${index + 1}`,
        thumbnail: src,
        zoom: src,
      },
    ];
  }),
);
function state(url) {
  const values = (
    url.searchParams.get("option_values") ||
    url.searchParams
      .get("variant")
      ?.replace("variant-", "")
      .replace("_", ",") ||
    "a,small"
  ).split(",");
  const defaultOnly = url.searchParams.has("default");
  const missing = values[0] === "b" && values[1] === "large";
  const soldOut = values[0] === "a" && values[1] === "large";
  const count = Number(url.searchParams.get("images") ?? 3);
  const mediaIds = ids.slice(0, count);
  const selectedId = `variant-${values.join("_")}`;
  return {
    productId: "fixture-product",
    sectionId: "fixture",
    productUrl: "/products/fixture",
    defaultOnly,
    purchaseEnabled: true,
    showPrice: true,
    strings,
    options: [
      {
        name: "Model",
        position: 1,
        values: ["a", "b"].map((id) => ({
          id,
          name: id.toUpperCase(),
          selected: id === values[0],
          available: true,
          productUrl: null,
        })),
      },
      {
        name: "Size",
        position: 2,
        values: ["small", "large"].map((id) => ({
          id,
          name: id,
          selected: id === values[1],
          available: id === "small",
          productUrl: null,
        })),
      },
    ],
    variant: missing
      ? null
      : {
          id: selectedId,
          available: !soldOut,
          price: values[0] === "a" ? "₩100,000" : "₩200,000",
          comparePrice: null,
          rule:
            values[0] === "a"
              ? { min: 2, max: 12, increment: 3 }
              : { min: 1, max: null, increment: 1 },
        },
    gallery: {
      selectedEntity: {
        type: defaultOnly ? "product" : "variant",
        id: defaultOnly ? "fixture-product" : selectedId,
      },
      mediaIds,
      featuredMediaId: values[0] === "b" ? "m-two" : "m-one",
      mediaById,
    },
  };
}
function product(data) {
  return `<main><div class="product-layout section-space" data-product-experience>
 <div><div data-gallery-fallback>Image fallback</div><div data-gallery-mount></div></div>
 <div class="product-details"><h1>Test object.</h1><div data-price-fallback>Price fallback</div><div data-price-mount></div>
 <form method="post" action="/cart/add"><fieldset data-input-fallback><input name="id" value="${esc(data.variant?.id ?? "")}"/><input name="quantity" value="2"/></fieldset><div data-input-mount></div><div data-payment></div></form></div>
 <div data-product-root></div><script data-product-state type="application/json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script></div></main>`;
}
function cart() {
  return `<main><form method="post" action="/cart"><h1>Fixture cart</h1>${["Engraving A", "Engraving B"].map((title, i) => `<div data-cart-quantity data-line-key="same-variant:${i}" data-label="Quantity — ${title}" data-invalid="Enter a whole-number quantity."><h2>${title}</h2><div data-cart-fallback><input name="updates[]" type="number" min="1" step="1" value="${i + 1}"/></div><div data-cart-mount></div></div>`).join("")}<button type="submit">Update</button></form></main>`;
}
const shell = (body) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>:root{--page-width:90rem;--page-margin:20px;--color-background:#fff;--color-foreground:#20201e;--style-border-radius-inputs:0px}</style><link rel="stylesheet" href="/assets/critical.css"/><link rel="stylesheet" href="/assets/nara-ui.css"/><script type="module" src="/assets/nara-ui.js"></script></head><body>${body}<button type="button" id="fixture-reload">Reload section</button><script>const scope=document.querySelector('main');const markup=scope?.innerHTML;document.querySelector('#fixture-reload').onclick=()=>{if(!scope)return;scope.dispatchEvent(new CustomEvent('shopify:section:unload',{bubbles:true}));scope.innerHTML=markup;scope.dispatchEvent(new CustomEvent('shopify:section:load',{bubbles:true}));scope.dispatchEvent(new CustomEvent('shopify:section:load',{bubbles:true}));};</script></body></html>`;
createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1:9293");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(
      shell(
        `<h1>Submitted to local fixture only</h1><pre>${esc(JSON.stringify([...new URLSearchParams(body)], null, 2))}</pre>`,
      ),
    );
    return;
  }
  if (url.pathname.startsWith("/assets/")) {
    const name = basename(url.pathname);
    try {
      res.setHeader(
        "Content-Type",
        name.endsWith(".js")
          ? "text/javascript"
          : name.endsWith(".css")
            ? "text/css"
            : "font/woff2",
      );
      res.end(readFileSync(resolve("assets", name)));
    } catch {
      res.writeHead(404);
      res.end();
    }
    return;
  }
  if (url.pathname.startsWith("/image/")) {
    res.setHeader("Content-Type", "image/svg+xml");
    res.end(
      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#fafafa"/><circle cx="400" cy="300" r="150" fill="${["#FFD300", "#38B2FF", "#19671B"][Number(basename(url.pathname))] ?? "#222"}"/></svg>`,
    );
    return;
  }
  if (url.searchParams.has("section_id") && url.searchParams.has("fail")) {
    res.writeHead(503);
    res.end("Fixture request failure");
    return;
  }
  const body = url.pathname === "/cart" ? cart() : product(state(url));
  if (url.searchParams.has("section_id") && url.searchParams.has("slow"))
    await new Promise((resolve) => setTimeout(resolve, 1200));
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(url.searchParams.has("section_id") ? body : shell(body));
}).listen(9293, "127.0.0.1", () =>
  console.log(
    "Local QA fixtures: http://127.0.0.1:9293/products/fixture (options: ?images=0, ?images=1, ?default, ?slow, ?fail; cart: /cart)",
  ),
);
