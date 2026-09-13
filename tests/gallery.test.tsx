// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { useState } from "react";
import { ProductGallery } from "../src/ProductGallery";
const loader = vi.hoisted(() => vi.fn());
vi.mock("../src/gallery-images", () => ({ prepareGalleryImage: loader }));
vi.mock("@astryxdesign/core/Carousel", () => ({
  Carousel: ({ children }: any) => <div>{children}</div>,
}));
vi.mock("@astryxdesign/core/Lightbox", () => ({
  Lightbox: ({ isOpen, index, media, onIndexChange, onOpenChange }: any) =>
    isOpen ? (
      <div role="dialog">
        <img alt="Expanded" src={media[index].src} />
        <button onClick={() => onIndexChange(1)}>Next expanded</button>
        <button onClick={() => onOpenChange(false)}>Close expanded</button>
      </div>
    ) : null,
}));
const image = (id: string) => ({
  id,
  src: `/${id}.jpg`,
  srcset: `/${id}.jpg 800w`,
  sizes: "100vw",
  width: 800,
  height: 600,
  alt: id,
  thumbnail: `/${id}-thumb.jpg`,
  zoom: `/${id}-large.jpg`,
});
afterEach(() => {
  cleanup();
  loader.mockReset();
});
function setup() {
  let resolve!: () => void, reject!: (error: Error) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  loader.mockReturnValue(promise);
  function Harness() {
    const [id, setId] = useState("one");
    return (
      <ProductGallery
        gallery={{
          selectedEntity: { type: "product", id: "p" },
          mediaIds: ["one", "two"],
          featuredMediaId: null,
          mediaById: { one: image("one"), two: image("two") },
        }}
        activeId={id}
        onSelect={setId}
        strings={{
          zoom: "Open",
          next: "Next",
          previous: "Previous",
          gallery: "Photos",
          updating: "Loading",
          image_error: "Failed",
        }}
      />
    );
  }
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Open" }));
  return { resolve, reject };
}
it("keeps both images on the old selection until decoding finishes", async () => {
  const pending = setup();
  fireEvent.click(await screen.findByRole("button", { name: "Next expanded" }));
  expect(screen.getByAltText("Expanded").getAttribute("src")).toBe(
    "/one-large.jpg",
  );
  expect(
    document.querySelector(".nara-image-button img")?.getAttribute("src"),
  ).toBe("/one.jpg");
  await act(async () => pending.resolve());
  expect(screen.getByAltText("Expanded").getAttribute("src")).toBe(
    "/two-large.jpg",
  );
  expect(
    document.querySelector(".nara-image-button img")?.getAttribute("src"),
  ).toBe("/two.jpg");
});
it("does not apply a pending navigation after closing", async () => {
  const pending = setup();
  fireEvent.click(await screen.findByRole("button", { name: "Next expanded" }));
  fireEvent.click(screen.getByRole("button", { name: "Close expanded" }));
  await act(async () => pending.resolve());
  expect(
    document.querySelector(".nara-image-button img")?.getAttribute("src"),
  ).toBe("/one.jpg");
});
it("keeps both images on a failed load", async () => {
  const pending = setup();
  fireEvent.click(await screen.findByRole("button", { name: "Next expanded" }));
  await act(async () => pending.reject(new Error("network")));
  expect(screen.getByAltText("Expanded").getAttribute("src")).toBe(
    "/one-large.jpg",
  );
  expect(
    document.querySelector(".nara-image-button img")?.getAttribute("src"),
  ).toBe("/one.jpg");
});
