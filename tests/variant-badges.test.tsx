// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { VariantBadges } from "../src/VariantBadges";
const option = {
  name: "Model",
  position: 1,
  values: [
    {
      id: "sofa-id",
      name: "Sofa",
      selected: false,
      available: true,
      productUrl: null,
    },
    {
      id: "set-id",
      name: "Complete collection",
      selected: true,
      available: true,
      productUrl: null,
      standalone: true,
    },
    {
      id: "chair-id",
      name: "Chair",
      selected: false,
      available: false,
      productUrl: null,
    },
  ],
};
afterEach(cleanup);
it("separates the configured value regardless of its label or position and submits option IDs", () => {
  const choose = vi.fn();
  const { container } = render(
    <VariantBadges
      option={option}
      value="set-id"
      onChange={choose}
      unavailable="Sold out"
    />,
  );
  expect(container.querySelector(".variant-standalone")?.textContent).toBe(
    "Complete collection",
  );
  expect(
    screen
      .getByRole("button", { name: "Complete collection" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "Sofa" }));
  expect(choose).toHaveBeenCalledWith("sofa-id");
});
it("keeps unavailable options selectable for gallery inspection without presenting them as available", () => {
  const choose = vi.fn();
  render(
    <VariantBadges
      option={option}
      value="set-id"
      onChange={choose}
      unavailable="Sold out"
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Chair — Sold out" }));
  expect(choose).toHaveBeenCalledWith("chair-id");
});
