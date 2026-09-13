export interface QuantityRule {
  min: number;
  max: number | null;
  increment: number;
}
export interface Media {
  id: string;
  src: string;
  srcset: string;
  sizes: string;
  width: number;
  height: number;
  alt: string;
  thumbnail: string;
  zoom: string;
}
export interface Gallery {
  selectedEntity: { type: "product" | "variant"; id: string };
  mediaIds: string[];
  featuredMediaId: string | null;
  mediaById: Record<string, Media>;
}
export interface Option {
  name: string;
  position: number;
  values: {
    id: string;
    name: string;
    selected: boolean;
    available: boolean;
    productUrl: string | null;
  }[];
}
export interface ProductState {
  productId: string;
  sectionId: string;
  productUrl: string;
  localeRoot?: string;
  defaultOnly: boolean;
  options: Option[];
  variant: {
    id: string;
    available: boolean;
    price: string;
    comparePrice: string | null;
    rule: QuantityRule;
  } | null;
  gallery: Gallery;
  purchaseEnabled: boolean;
  showPrice: boolean;
  strings: Record<string, string>;
}
export function normalizeGallery(gallery: Gallery): Gallery {
  return {
    ...gallery,
    mediaIds: [...new Set(gallery.mediaIds)].filter((id) =>
      Boolean(gallery.mediaById[id]),
    ),
  };
}
export function activeMedia(
  gallery: Gallery,
  current: string | null,
  preferFeatured = true,
): string | null {
  if (
    preferFeatured &&
    gallery.featuredMediaId &&
    gallery.mediaIds.includes(gallery.featuredMediaId)
  )
    return gallery.featuredMediaId;
  return current && gallery.mediaIds.includes(current)
    ? current
    : (gallery.mediaIds[0] ?? null);
}
export function normalizeQuantity(value: number, rule: QuantityRule): number {
  const min = Math.max(1, rule.min),
    step = Math.max(1, rule.increment);
  const upper =
    rule.max == null
      ? Infinity
      : Math.max(min, min + Math.floor((rule.max - min) / step) * step);
  return Math.min(
    upper,
    Math.max(
      min,
      min +
        Math.round(((Number.isFinite(value) ? value : min) - min) / step) *
          step,
    ),
  );
}
export function parseQuantity(text: string, rule: QuantityRule): number | null {
  if (!/^\d+$/.test(text.trim())) return null;
  const value = Number(text.trim());
  return Number.isSafeInteger(value) ? normalizeQuantity(value, rule) : null;
}
export function selection(state: ProductState): string[] {
  return state.options.map(
    (option) => option.values.find((value) => value.selected)?.id ?? "",
  );
}
export function optionUrl(href: string, ids: string[]): URL {
  const url = new URL(href);
  url.searchParams.delete("variant");
  url.searchParams.delete("section_id");
  url.searchParams.delete("sections");
  url.searchParams.set("option_values", ids.join(","));
  return url;
}
export function canonicalUrl(href: string, state: ProductState): URL {
  const url = new URL(href);
  url.searchParams.delete("section_id");
  url.searchParams.delete("sections");
  if (state.variant) {
    url.searchParams.set("variant", state.variant.id);
    url.searchParams.delete("option_values");
  } else {
    url.searchParams.delete("variant");
    url.searchParams.set("option_values", selection(state).join(","));
  }
  return url;
}
export function readState(root: ParentNode): ProductState {
  const el = root.querySelector<HTMLScriptElement>(
    "script[data-product-state]",
  );
  if (!el?.textContent) throw new Error("Missing product state");
  const state = JSON.parse(el.textContent) as ProductState;
  if (!state.productId || !Array.isArray(state.options) || !state.gallery)
    throw new Error("Invalid product state");
  state.gallery = normalizeGallery(state.gallery);
  return state;
}
export class ProductRequest {
  private controller?: AbortController;
  private revision = 0;
  cancel() {
    this.revision++;
    this.controller?.abort();
  }
  async load(
    url: URL,
    sectionId: string,
  ): Promise<{ state: ProductState; document: Document } | null> {
    this.cancel();
    const revision = this.revision;
    this.controller = new AbortController();
    const request = new URL(url);
    request.searchParams.set("section_id", sectionId);
    const controller = this.controller;
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(request, {
        signal: this.controller.signal,
        headers: { Accept: "text/html" },
      });
      if (!response.ok) throw new Error("Product request failed");
      const html = await response.text();
      if (revision !== this.revision) return null;
      const document = new DOMParser().parseFromString(html, "text/html");
      return { state: readState(document), document };
    } catch (error) {
      if (revision !== this.revision) return null;
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

/** Keep the market path and preview/query context when an option links products. */
export function linkedProductUrl(
  href: string,
  linked: string,
  ids: string[],
  localeRoot = "/",
): URL {
  const current = optionUrl(href, ids);
  const target = new URL(linked, current.origin);
  if (localeRoot !== "/" && target.pathname.startsWith("/products/"))
    target.pathname = localeRoot.replace(/\/$/, "") + target.pathname;
  target.searchParams.delete("variant");
  for (const [key, value] of current.searchParams)
    target.searchParams.set(key, value);
  return target;
}
