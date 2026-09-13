import type { Media } from "./shopify-product-adapter";

// Decode both display sizes before committing a lightbox navigation. Browsers
// otherwise keep painting the previous large image while its new src loads.
const ready = new Map<string, Promise<void>>();
function decodeImage(src: string, srcset = "", sizes = ""): Promise<void> {
  const key = JSON.stringify([
    src,
    srcset,
    sizes,
    srcset ? window.innerWidth : 0,
    srcset ? window.devicePixelRatio : 1,
  ]);
  const existing = ready.get(key);
  if (existing) return existing;
  const promise = new Promise<void>((resolve, reject) => {
    const image = new Image();
    const timeout = setTimeout(
      () => finish(new Error("Image load timed out")),
      15000,
    );
    function finish(error?: unknown) {
      clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      if (error) reject(error);
      else resolve();
    }
    image.onload = () => {
      image.decode().then(() => finish(), finish);
    };
    image.onerror = () => finish(new Error("Image unavailable"));
    if (srcset) {
      image.sizes = sizes;
      image.srcset = srcset;
    }
    image.src = src;
  });
  ready.set(key, promise);
  promise.catch(() => ready.delete(key));
  return promise;
}
export function prepareGalleryImage(media: Media): Promise<void> {
  return Promise.all([
    decodeImage(media.zoom),
    decodeImage(media.src, media.srcset, media.sizes),
  ]).then(() => undefined);
}
