import { Component, useLayoutEffect, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NaraTheme } from "./nara-theme";
import { ProductExperience } from "./ProductExperience";
import { Quantity } from "./Quantity";
import { readState } from "./shopify-product-adapter";
import "./nara.css";
class FallbackBoundary extends Component<
  { children: ReactNode; restore: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.restore();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
function CartQuantity({ host }: { host: HTMLElement }) {
  const input = host.querySelector<HTMLInputElement>(
    'input[name="updates[]"]',
  )!;
  const [value, setValue] = useState(Number(input.value));
  const rule = {
    min: Number(input.min) || 1,
    max: input.max ? Number(input.max) : null,
    increment: Number(input.step) || 1,
  };
  useLayoutEffect(() => {
    host.querySelector<HTMLElement>("[data-cart-fallback]")!.hidden = true;
    input.disabled = true;
    return () => {
      host.querySelector<HTMLElement>("[data-cart-fallback]")!.hidden = false;
      input.disabled = false;
    };
  }, [host, input]);
  return (
    <Quantity
      form={input.form!}
      rule={rule}
      value={value}
      onChange={setValue}
      name="updates[]"
      label={host.dataset.label!}
      invalidMessage={host.dataset.invalid!}
    />
  );
}
const roots = new Map<HTMLElement, Root>();
function restore(host: HTMLElement) {
  delete host.dataset.enhanced;
  host
    .querySelectorAll<HTMLElement>(
      "[data-gallery-fallback],[data-price-fallback],[data-input-fallback],[data-cart-fallback]",
    )
    .forEach((el) => {
      el.hidden = false;
      if (el instanceof HTMLFieldSetElement) el.disabled = false;
      el.querySelectorAll<HTMLInputElement>("input").forEach(
        (input) => (input.disabled = false),
      );
    });
}
function mount(scope: ParentNode) {
  scope
    .querySelectorAll<HTMLElement>(
      "[data-product-experience],[data-cart-quantity]",
    )
    .forEach((host) => {
      if (roots.has(host)) return;
      try {
        const product = host.hasAttribute("data-product-experience");
        const initial = product ? readState(host) : null;
        const container = host.querySelector<HTMLElement>(
          product ? "[data-product-root]" : "[data-cart-mount]",
        );
        if (!container) return;
        const root = createRoot(container);
        roots.set(host, root);
        root.render(
          <FallbackBoundary restore={() => restore(host)}>
            <NaraTheme
              strings={
                initial?.strings ?? {
                  increment: host.dataset.increment ?? "",
                  decrement: host.dataset.decrement ?? "",
                }
              }
            >
              {initial ? (
                <ProductExperience root={host} initial={initial} />
              ) : (
                <CartQuantity host={host} />
              )}
            </NaraTheme>
          </FallbackBoundary>,
        );
      } catch (error) {
        restore(host);
        console.error("Nara enhancement unavailable", error);
      }
    });
}
const lifecycleKey = Symbol.for("nara.ui.dispose");
const lifecycle = window as unknown as Record<symbol, (() => void) | undefined>;
lifecycle[lifecycleKey]?.();
const onLoad = (event: Event) => mount(event.target as HTMLElement);
const onUnload = (event: Event) => {
  for (const [host, root] of roots) {
    if ((event.target as HTMLElement).contains(host)) {
      root.unmount();
      roots.delete(host);
    }
  }
};
lifecycle[lifecycleKey] = () => {
  document.removeEventListener("shopify:section:load", onLoad);
  document.removeEventListener("shopify:section:unload", onUnload);
  for (const root of roots.values()) root.unmount();
  roots.clear();
};
mount(document);
document.addEventListener("shopify:section:load", onLoad);
document.addEventListener("shopify:section:unload", onUnload);
