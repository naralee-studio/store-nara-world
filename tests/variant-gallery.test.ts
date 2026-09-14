import { readFileSync } from "node:fs";
import { Liquid } from "liquidjs";
import { activeMedia } from "../src/shopify-product-adapter";
import { expect, it } from "vitest";
const source = readFileSync(
  "snippets/product-gallery-ids.liquid",
  "utf8",
).replace(/{% doc %}[\s\S]*?{% enddoc %}/, "");
const liquid = new Liquid();
// Exercise the actual JSON field as well as the shared Liquid calculation.
const featuredField = readFileSync("snippets/product-state.liquid", "utf8")
  .split("\n")
  .find((line) => line.includes('"featuredMediaId":'))!
  .replace(/{% render 'product-gallery-ids'[^%]*%}/, source);

async function render(
  files: number[] | null,
  shared = false,
  policy = "variant_common",
  defaultOnly = false,
  featured = true,
  featuredOnly = false,
) {
  const media = [1, 2, 3, 4].map((id) => ({
    id,
    media_type: "image",
    src: `original-${id}`,
  }));
  const product = {
    media: [...media, { id: 5, media_type: "video" }],
    images: media.map((m) => ({ ...m, "attached_to_variant?": m.id < 3 })),
    has_only_default_variant: defaultOnly,
    selected_or_first_available_variant: {
      featured_media: featured ? media[0] : null,
      metafields: {
        nara: {
          gallery_images:
            files === null
              ? null
              : {
                  type: "list.file_reference",
                  value: files.map((id) => ({ id })),
                },
          gallery_include_shared: { value: shared },
        },
      },
    },
  };
  const context = {
    product,
    variant: product.selected_or_first_available_variant,
    section: { settings: { gallery_policy: policy } },
  };
  const ids = await liquid.parseAndRender(source, context);
  const rendered = featuredOnly
    ? await liquid.parseAndRender(featuredField, {
        ...context,
        featured_only: true,
        gallery_ids: ids.trim().split("|").filter(Boolean),
      })
    : ids;
  if (featuredOnly) {
    const preferred = JSON.parse(
      `{${rendered.trim().replace(/,$/, "")}}`,
    ).featuredMediaId;
    return preferred === null ? [] : [preferred];
  }
  return rendered.trim().split("|").filter(Boolean);
}
it("uses the ordered variant file list and removes duplicate, foreign and non-image references", async () => {
  expect(await render([4, 2, 4, 999, 5])).toEqual(["4", "2"]);
});
it("appends only shared images in product order, without duplicating mapped images", async () => {
  expect(await render([4, 2], true)).toEqual(["4", "2", "3"]);
});
it("falls back for missing, empty or entirely invalid lists", async () => {
  for (const files of [null, [], [999, 5]])
    expect(await render(files)).toEqual(["1", "3", "4"]);
});
it("preserves the all-images override and the default-only product policy", async () => {
  expect(await render([4, 2], false, "all")).toEqual(["1", "2", "3", "4"]);
  expect(await render([4, 2], false, "variant_common", true)).toEqual([
    "1",
    "2",
    "3",
    "4",
  ]);
});

it("does not invent a representative when there is no featured image or valid mapping", async () => {
  for (const files of [null, [], [999, 5]]) {
    expect(
      await render(files, false, "variant_common", false, false, true),
    ).toEqual([]);
  }
  const mediaIds = await render(null, false, "variant_common", false, false);
  const gallery = {
    mediaIds,
    featuredMediaId: null,
    mediaById: {},
    selectedEntity: { type: "variant" as const, id: "b" },
  };
  expect(activeMedia(gallery, "4")).toBe("4");
  expect(activeMedia(gallery, "2")).toBe("3");
});
it("prefers an explicit list's first valid image, otherwise the native representative", async () => {
  expect(
    await render([999, 4, 2], false, "variant_common", false, false, true),
  ).toEqual(["4"]);
  expect(
    await render(null, false, "variant_common", false, true, true),
  ).toEqual(["1"]);
  expect(await render([4, 2], false, "all", false, true, true)).toEqual(["1"]);
  expect(
    await render([4, 2], false, "variant_common", true, true, true),
  ).toEqual(["1"]);
  expect(await render([4, 2], false, "all", false, false, true)).toEqual([]);
});
