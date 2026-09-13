// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  normalizeQuantity,
  parseQuantity,
  normalizeGallery,
  activeMedia,
  optionUrl,
  linkedProductUrl,
  canonicalUrl,
  ProductRequest,
  type Gallery,
  type ProductState,
} from "../src/shopify-product-adapter";
const image = {
  id: "image-1",
  src: "/one",
  srcset: "/one 480w",
  sizes: "100vw",
  width: 480,
  height: 360,
  alt: "One",
  thumbnail: "/thumb",
  zoom: "/zoom",
};
const gallery: Gallery = {
  selectedEntity: { type: "variant", id: "variant-1" },
  mediaIds: ["image-1", "image-2"],
  featuredMediaId: "image-2",
  mediaById: { "image-1": image, "image-2": { ...image, id: "image-2" } },
};
const state: ProductState = {
  productId: "product-1",
  sectionId: "main",
  productUrl: "/products/example",
  defaultOnly: false,
  options: [
    {
      name: "Model",
      position: 1,
      values: [
        {
          id: "option-1",
          name: "One",
          selected: true,
          available: true,
          productUrl: null,
        },
      ],
    },
  ],
  variant: {
    id: "variant-1",
    available: true,
    price: "₩100",
    comparePrice: null,
    rule: { min: 1, max: null, increment: 1 },
  },
  gallery,
  purchaseEnabled: true,
  showPrice: true,
  strings: {},
};
function response(value: ProductState) {
  return new Response(
    `<script data-product-state type="application/json">${JSON.stringify(value)}</script>`,
  );
}
afterEach(() => vi.unstubAllGlobals());
describe("quantity rules", () => {
  it("rounds from min, preserves valid values, clamps max to valid increment", () => {
    const rule = { min: 2, max: 12, increment: 3 };
    expect(normalizeQuantity(5, rule)).toBe(5);
    expect(normalizeQuantity(7, rule)).toBe(8);
    expect(normalizeQuantity(12, rule)).toBe(11);
    expect(normalizeQuantity(-2, rule)).toBe(2);
  });
  it("rejects incomplete text instead of submitting old state", () => {
    for (const text of ["", "2x", "1.5", "-1", "1e3"])
      expect(
        parseQuantity(text, { min: 1, max: null, increment: 1 }),
      ).toBeNull();
    expect(parseQuantity("17", { min: 1, max: null, increment: 1 })).toBe(17);
  });
});
describe("gallery data boundary", () => {
  it("removes missing ids and duplicates without sorting the source", () => {
    expect(
      normalizeGallery({
        ...gallery,
        mediaIds: ["image-2", "deleted", "image-1", "image-2"],
      }).mediaIds,
    ).toEqual(["image-2", "image-1"]);
  });
  it("prefers a linked representative, then preserves a surviving image", () => {
    expect(activeMedia(gallery, "image-1")).toBe("image-2");
    expect(activeMedia({ ...gallery, featuredMediaId: null }, "image-1")).toBe(
      "image-1",
    );
    expect(
      activeMedia(
        { ...gallery, featuredMediaId: null, mediaIds: [] },
        "image-1",
      ),
    ).toBeNull();
  });
  it("photo navigation does not mutate the purchase entity", () => {
    const copy = structuredClone(gallery);
    expect(activeMedia(copy, "image-1", false)).toBe("image-1");
    expect(copy.selectedEntity).toEqual(gallery.selectedEntity);
  });
});
describe("URL state", () => {
  it("preserves locale, preview, unrelated queries and clears conflicting variant", () => {
    const url = optionUrl(
      "https://shop.test/fr/products/a?variant=old&preview_theme_id=123&utm_source=x",
      ["one", "two"],
    );
    expect(url.pathname).toBe("/fr/products/a");
    expect(url.searchParams.get("variant")).toBeNull();
    expect(url.searchParams.get("preview_theme_id")).toBe("123");
    expect(url.searchParams.get("option_values")).toBe("one,two");
  });
  it("distinguishes sold out from missing combinations", () => {
    expect(
      canonicalUrl("https://shop.test/products/a?option_values=one", {
        ...state,
        variant: { ...state.variant!, available: false },
      }).searchParams.get("variant"),
    ).toBe("variant-1");
    const url = canonicalUrl("https://shop.test/products/a?variant=old", {
      ...state,
      variant: null,
    });
    expect(url.searchParams.has("variant")).toBe(false);
    expect(url.searchParams.get("option_values")).toBe("option-1");
  });
});
describe("section requests", () => {
  it("only accepts the last response even if a transport ignores abort", async () => {
    let finishFirst!: (r: Response) => void;
    const fetcher = vi
      .fn()
      .mockImplementationOnce(
        () => new Promise((resolve) => (finishFirst = resolve)),
      )
      .mockResolvedValueOnce(response({ ...state, variant: null }));
    vi.stubGlobal("fetch", fetcher);
    const request = new ProductRequest(),
      first = request.load(new URL("https://shop.test/products/a"), "main");
    const second = await request.load(
      new URL("https://shop.test/products/a?option_values=b"),
      "main",
    );
    finishFirst(response(state));
    expect(await first).toBeNull();
    expect(second?.state.variant).toBeNull();
    expect(fetcher.mock.calls[0][1].signal.aborted).toBe(true);
  });
  it("rejects error pages and missing state so buying can stay blocked", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("error", { status: 500 })),
    );
    await expect(
      new ProductRequest().load(
        new URL("https://shop.test/products/a"),
        "main",
      ),
    ).rejects.toThrow();
  });
});

it("preserves locale and preview context for linked products", () => {
  const url = linkedProductUrl(
    "https://shop.test/fr/products/one?preview_theme_id=123&variant=old",
    "/products/two",
    ["new"],
    "/fr/",
  );
  expect(url.pathname).toBe("/fr/products/two");
  expect(url.searchParams.get("preview_theme_id")).toBe("123");
  expect(url.searchParams.has("variant")).toBe(false);
});
it("ignores a failed stale request after a newer successful selection", async () => {
  let rejectOld!: (error: Error) => void;
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            rejectOld = reject;
          }),
      )
      .mockResolvedValueOnce(response(state)),
  );
  const request = new ProductRequest();
  const old = request.load(new URL("https://shop.test/products/one"), "main");
  expect(
    (await request.load(new URL("https://shop.test/products/two"), "main"))
      ?.state.variant?.id,
  ).toBe("variant-1");
  rejectOld(new Error("stale network failure"));
  expect(await old).toBeNull();
});
