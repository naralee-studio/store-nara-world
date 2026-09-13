// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { useState } from "react";
import { Quantity } from "../src/Quantity";
afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});
function setup() {
  const form = document.createElement("form");
  document.body.append(form);
  const sent: string[][] = [];
  form.requestSubmit = () =>
    form.dispatchEvent(
      new Event("submit", { cancelable: true, bubbles: true }),
    );
  function Harness() {
    const [value, setValue] = useState(2);
    return (
      <>
        <Quantity
          form={form}
          rule={{ min: 2, max: 12, increment: 3 }}
          value={value}
          onChange={setValue}
          name="quantity"
          label="Quantity"
          invalidMessage="Enter a whole number"
        />
        <button type="submit">Add</button>
      </>
    );
  }
  render(<Harness />, { container: form });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    sent.push(new FormData(form).getAll("quantity") as string[]);
  });
  return { form, sent };
}
it("submits the current draft once on immediate Enter, normalized to the increment", () => {
  const { sent } = setup();
  const input = screen.getByRole("spinbutton");
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: "7" } });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(sent).toEqual([["8"]]);
});
it("submits the current draft on direct form submission", () => {
  const { form, sent } = setup();
  const input = screen.getByRole("spinbutton");
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: "11" } });
  fireEvent.submit(form);
  expect(sent).toEqual([["11"]]);
});
it("blocks malformed draft instead of silently sending the previous quantity", () => {
  const { sent } = setup();
  const input = screen.getByRole("spinbutton");
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: "7x" } });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(sent).toEqual([]);
  expect(screen.getByText("Enter a whole number")).toBeTruthy();
});
