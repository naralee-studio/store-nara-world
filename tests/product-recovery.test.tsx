// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { ProductExperience } from "../src/ProductExperience";
import type { ProductState } from "../src/shopify-product-adapter";
vi.mock("@astryxdesign/core/Selector", () => ({
  Selector: ({ label, value, options, onChange }: any) => (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o: any) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));
vi.mock("@astryxdesign/core/Carousel", () => ({
  Carousel: ({ children }: any) => <div>{children}</div>,
}));
vi.mock("@astryxdesign/core/Lightbox", () => {
  throw new Error("Lightbox chunk failed");
});
vi.mock("../src/gallery-images", () => ({
  prepareGalleryImage: () => Promise.resolve(),
}));
vi.mock("../src/Quantity", () => ({
  Quantity: ({ value, onChange, name, label }: any) => (
    <input
      aria-label={label}
      name={name}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  ),
}));
function state(id: string): ProductState {
  const image = {
    id,
    src: `/${id}.jpg`,
    srcset: `/${id}.jpg 800w`,
    sizes: "100vw",
    width: 800,
    height: 600,
    alt: id,
    thumbnail: `/${id}.jpg`,
    zoom: `/${id}-large.jpg`,
  };
  return {
    productId: "p",
    sectionId: "main",
    productUrl: "/products/p",
    defaultOnly: false,
    purchaseEnabled: true,
    showPrice: true,
    variant: {
      id,
      available: true,
      price: `Price ${id}`,
      comparePrice: null,
      rule: { min: 1, max: null, increment: 1 },
    },
    options: [
      {
        name: "Model",
        position: 1,
        values: ["a", "b", "c"].map((v) => ({
          id: v,
          name: v,
          selected: v === id,
          available: true,
          productUrl: null,
        })),
      },
    ],
    gallery: {
      selectedEntity: { type: "variant", id },
      featuredMediaId: id,
      mediaIds: [id],
      mediaById: { [id]: image },
    },
    strings: {
      zoom: "Zoom",
      close: "Close",
      image_error: "Image failed",
      retry: "Retry",
      quantity: "Quantity",
      add_to_cart: "Add",
      request_error: "Request failed",
    },
  };
}
function response(id: string) {
  return new Response(
    `<script data-product-state type="application/json">${JSON.stringify(state(id))}</script><div data-payment></div>`,
  );
}
function setup() {
  history.replaceState({}, "", "/products/p?variant=a");
  const root = document.createElement("div");
  root.innerHTML =
    '<div data-gallery-fallback></div><div data-gallery-mount></div><div data-price-fallback></div><div data-price-mount></div><form action="/cart/add"><fieldset data-input-fallback></fieldset><div data-input-mount></div><div data-payment></div></form>';
  document.body.append(root);
  render(<ProductExperience root={root} initial={state("a")} />);
  return root;
}
async function choose(id: string) {
  fireEvent.change(screen.getByLabelText("Model"), { target: { value: id } });
  await screen.findByText(`Price ${id}`);
}
afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it("preserves selected variant, quantity, price, gallery and purchase form when the lazy viewer import rejects", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response("b")));
  vi.spyOn(console, "error").mockImplementation(() => {});
  const root = setup();
  await choose("b");
  fireEvent.change(screen.getByLabelText("Quantity"), {
    target: { value: "5" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Zoom" }));
  await screen.findByText("Image failed");
  expect((screen.getByLabelText("Model") as HTMLSelectElement).value).toBe("b");
  expect(new FormData(root.querySelector("form")!).get("id")).toBe("b");
  expect(new FormData(root.querySelector("form")!).get("quantity")).toBe("5");
  expect(screen.getByText("Price b")).toBeTruthy();
  expect(
    root.querySelector(".nara-image-button img")?.getAttribute("src"),
  ).toBe("/b.jpg");
  expect(location.search).toBe("?variant=b");
  expect(
    (screen.getByRole("button", { name: "Add" }) as HTMLButtonElement).disabled,
  ).toBe(false);
  expect(screen.getByRole("link", { name: "Zoom" }).getAttribute("href")).toBe(
    "/b-large.jpg",
  );
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByText("Image failed")).toBeNull();
});
it("keeps forward history when retrying a failed back navigation", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(response("b"))
    .mockResolvedValueOnce(response("c"))
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce(response("b"))
    .mockResolvedValueOnce(response("c"));
  vi.stubGlobal("fetch", fetcher);
  setup();
  await choose("b");
  await choose("c");
  history.back();
  await screen.findByRole("button", { name: "Retry" });
  expect(location.search).toBe("?variant=b");
  const push = vi.spyOn(history, "pushState");
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByText("Price b");
  expect(push).not.toHaveBeenCalled();
  history.forward();
  await waitFor(() => expect(location.search).toBe("?variant=c"));
  await screen.findByText("Price c");
});
it("still pushes history when retrying a failed option selection", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(response("b")),
  );
  setup();
  fireEvent.change(screen.getByLabelText("Model"), { target: { value: "b" } });
  await screen.findByRole("button", { name: "Retry" });
  const push = vi.spyOn(history, "pushState");
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByText("Price b");
  expect(push).toHaveBeenCalledTimes(1);
  expect(location.search).toBe("?variant=b");
});
