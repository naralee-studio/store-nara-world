import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { VariantBadges } from "./VariantBadges";
import { ProductGallery } from "./ProductGallery";
import { Quantity } from "./Quantity";
import {
  activeMedia,
  canonicalUrl,
  linkedProductUrl,
  normalizeQuantity,
  optionUrl,
  ProductRequest,
  selection,
  type ProductState,
} from "./shopify-product-adapter";
export function ProductExperience({
  root,
  initial,
}: {
  root: HTMLElement;
  initial: ProductState;
}) {
  const [state, setState] = useState(initial),
    [ids, setIds] = useState(() => selection(initial));
  const [quantity, setQuantity] = useState(initial.variant?.rule.min ?? 1);
  const [activeId, setActiveId] = useState<string | null>(() =>
    activeMedia(initial.gallery, null),
  );
  const [pending, setPending] = useState(false),
    [error, setError] = useState(false);
  const request = useRef(new ProductRequest()),
    target = useRef<{ url: URL; push: boolean } | null>(null),
    busy = useRef(false);
  const form = root.querySelector<HTMLFormElement>(
    'form[action*="/cart/add"]',
  )!;
  const payment = root.querySelector<HTMLElement>("[data-payment]")!;
  const idInput = useRef<HTMLInputElement>(null),
    t = state.strings;
  const canBuy =
    state.purchaseEnabled &&
    Boolean(state.variant?.available) &&
    !pending &&
    !error;
  function blockBuying() {
    busy.current = true;
    if (idInput.current) idInput.current.disabled = true;
    payment.hidden = true;
    payment.inert = true;
  }
  async function load(url: URL, push: boolean) {
    target.current = { url, push };
    blockBuying();
    setPending(true);
    setError(false);
    try {
      const result = await request.current.load(url, initial.sectionId);
      if (!result) return;
      if (result.state.productId !== initial.productId) {
        window.location.assign(url);
        return;
      }
      const next = result.state;
      setState(next);
      setIds(selection(next));
      setQuantity((q) =>
        next.variant ? normalizeQuantity(q, next.variant.rule) : q,
      );
      setActiveId((current) => activeMedia(next.gallery, current));
      setPending(false);
      busy.current = false;
      // Only this non-React checkout slot is replaced. Never replace a live root.
      const nextPayment = result.document.querySelector("[data-payment]");
      if (nextPayment)
        payment.replaceChildren(
          ...Array.from(nextPayment.childNodes).map((node) =>
            document.importNode(node, true),
          ),
        );
      if (push) history.pushState({}, "", canonicalUrl(url.href, next));
    } catch {
      setPending(false);
      setError(true);
      busy.current = true;
    }
  }
  function choose(position: number, id: string) {
    const next = ids.map((value, index) => (index === position ? id : value));
    setIds(next);
    const option = state.options[position].values.find(
      (value) => value.id === id,
    );
    const url = optionUrl(location.href, next);
    if (
      option?.productUrl &&
      new URL(option.productUrl, location.origin).pathname !==
        new URL(state.productUrl, location.origin).pathname
    ) {
      const destination = linkedProductUrl(
        location.href,
        option.productUrl,
        next,
        state.localeRoot,
      );
      blockBuying();
      window.location.assign(destination);
      return;
    }
    void load(url, true);
  }
  useLayoutEffect(() => {
    root.dataset.enhanced = "true";
    const fallback = root.querySelector<HTMLFieldSetElement>(
      "[data-input-fallback]",
    )!;
    fallback.disabled = true;
    fallback.hidden = true;
    root.querySelector<HTMLElement>("[data-gallery-fallback]")!.hidden = true;
    root.querySelector<HTMLElement>("[data-price-fallback]")!.hidden = true;
    return () => {
      delete root.dataset.enhanced;
      fallback.disabled = false;
      fallback.hidden = false;
      root.querySelector<HTMLElement>("[data-gallery-fallback]")!.hidden =
        false;
      root.querySelector<HTMLElement>("[data-price-fallback]")!.hidden = false;
    };
  }, [root]);
  useLayoutEffect(() => {
    payment.hidden = !canBuy;
    payment.inert = !canBuy;
    const shopify = window as unknown as {
      Shopify?: { PaymentButton?: { init: () => void } };
    };
    if (canBuy) shopify.Shopify?.PaymentButton?.init();
  }, [canBuy, payment, state]);
  useEffect(() => {
    const pop = () => {
      void load(new URL(location.href), false);
    };
    const guard = (event: Event) => {
      if (busy.current || !state.purchaseEnabled || !state.variant?.available) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener("popstate", pop);
    form.addEventListener("submit", guard, true);
    return () => {
      window.removeEventListener("popstate", pop);
      form.removeEventListener("submit", guard, true);
    };
  }, [state, form]);
  useEffect(() => () => request.current.cancel(), []);
  return (
    <>
      {createPortal(
        <ProductGallery
          gallery={state.gallery}
          activeId={activeId}
          onSelect={setActiveId}
          strings={t}
        />,
        root.querySelector("[data-gallery-mount]")!,
      )}
      {createPortal(
        state.showPrice && state.variant ? (
          <p className="product-price" aria-live="polite">
            {state.variant.price}{" "}
            {state.variant.comparePrice && <s>{state.variant.comparePrice}</s>}
          </p>
        ) : null,
        root.querySelector("[data-price-mount]")!,
      )}
      {createPortal(
        <div className="nara-purchase" aria-busy={pending}>
          {!state.defaultOnly &&
            state.options.map((option, index) =>
              option.values.length > 1 ? (
                <VariantBadges
                  key={option.position}
                  option={option}
                  value={ids[index]}
                  onChange={(id) => choose(index, id)}
                  unavailable={t.option_unavailable}
                />
              ) : (
                <p key={option.position}>
                  {option.name}: {option.values[0]?.name}
                </p>
              ),
            )}
          <div className="selection-status" role="status">
            {pending
              ? t.updating
              : error
                ? t.request_error
                : !state.variant
                  ? `${t.unavailable}. ${t.choose_other}`
                  : !state.variant.available
                    ? t.sold_out
                    : null}
          </div>
          {error && (
            <div className="selection-recovery">
              <button
                type="button"
                className="button-secondary"
                onClick={() =>
                  target.current &&
                  void load(target.current.url, target.current.push)
                }
              >
                {t.retry}
              </button>
              <a href={target.current?.url.href}>{t.open_selection}</a>
            </div>
          )}
        </div>,
        root.querySelector("[data-input-mount]")!,
      )}
      {createPortal(
        <div className="nara-purchase-actions" aria-busy={pending}>
          {state.purchaseEnabled && (
            <>
              <input
                ref={idInput}
                type="hidden"
                name="id"
                value={state.variant?.id ?? ""}
                disabled={!canBuy}
              />
              <Quantity
                form={form}
                rule={
                  state.variant?.rule ?? { min: 1, max: null, increment: 1 }
                }
                value={quantity}
                onChange={setQuantity}
                name="quantity"
                label={t.quantity}
                invalidMessage={t.invalid_quantity}
                disabled={!canBuy}
              />
              <p className="purchase-caption">{t.purchase_caption}</p>
              <button
                type="submit"
                name="add"
                className="add-to-cart"
                disabled={!canBuy}
              >
                {!state.variant
                  ? t.unavailable
                  : state.variant.available
                    ? t.add_to_cart
                    : t.sold_out}
              </button>
            </>
          )}
        </div>,
        root.querySelector("[data-purchase-mount]")!,
      )}
    </>
  );
}
