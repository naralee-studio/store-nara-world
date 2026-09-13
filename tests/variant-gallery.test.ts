import { readFileSync } from "node:fs";
import { Liquid } from "liquidjs";
import { expect, it } from "vitest";
const source = readFileSync(
  "snippets/product-gallery-ids.liquid",
  "utf8",
).replace(/{% doc %}[\s\S]*?{% enddoc %}/, "");
const liquid = new Liquid();
async function render(
  files: number[] | null,
  shared = false,
  policy = "variant_common",
  defaultOnly = false,
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
      featured_media: media[0],
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
  return (
    await liquid.parseAndRender(source, {
      product,
      section: { settings: { gallery_policy: policy } },
    })
  )
    .trim()
    .split("|")
    .filter(Boolean);
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
