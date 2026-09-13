import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Carousel, type CarouselHandle } from "@astryxdesign/core/Carousel";
import type { Gallery, Media } from "./shopify-product-adapter";
const Lightbox = lazy(() =>
  import("@astryxdesign/core/Lightbox").then((module) => ({
    default: module.Lightbox,
  })),
);
function ResponsiveImage({
  media,
  fallback,
}: {
  media: Media;
  fallback: string;
}) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <span className="gallery-empty" role="img" aria-label={media.alt}>
      {fallback}
    </span>
  ) : (
    <img
      src={media.src}
      srcSet={media.srcset}
      sizes={media.sizes}
      width={media.width}
      height={media.height}
      alt={media.alt}
      onError={() => setFailed(true)}
    />
  );
}
export function ProductGallery({
  gallery,
  activeId,
  onSelect,
  strings: t,
}: {
  gallery: Gallery;
  activeId: string | null;
  onSelect: (id: string) => void;
  strings: Record<string, string>;
}) {
  const [open, setOpen] = useState(false),
    [opened, setOpened] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null),
    rail = useRef<CarouselHandle>(null);
  const index = Math.max(0, gallery.mediaIds.indexOf(activeId ?? ""));
  const media = gallery.mediaById[gallery.mediaIds[index]];
  useEffect(() => {
    rail.current?.scrollTo(index);
  }, [index, gallery.mediaIds.join(",")]);
  useEffect(() => {
    if (!media) setOpen(false);
  }, [media]);
  function changeOpen(value: boolean) {
    setOpen(value);
    if (!value) requestAnimationFrame(() => trigger.current?.focus());
  }
  if (!media) return <div className="gallery-empty">{t.no_image}</div>;
  function move(delta: number) {
    onSelect(
      gallery.mediaIds[
        (index + delta + gallery.mediaIds.length) % gallery.mediaIds.length
      ],
    );
  }
  return (
    <div className="nara-gallery">
      <button
        className="nara-image-button"
        type="button"
        aria-label={t.zoom}
        ref={trigger}
        onClick={() => {
          setOpened(true);
          setOpen(true);
        }}
      >
        <ResponsiveImage
          key={media.id}
          media={media}
          fallback={t.image_error}
        />
        <span className="image-enlarge" aria-hidden="true">
          ↗
        </span>
      </button>
      {gallery.mediaIds.length > 1 && (
        <>
          <div className="gallery-navigation">
            <button
              type="button"
              aria-label={t.previous}
              onClick={() => move(-1)}
            >
              ←
            </button>
            <span aria-live="polite">
              {index + 1} / {gallery.mediaIds.length}
            </span>
            <button type="button" aria-label={t.next} onClick={() => move(1)}>
              →
            </button>
          </div>
          <Carousel
            handleRef={rail}
            hasEdgeFade={false}
            hasButtons={false}
            hasSnap
            gap={1}
            aria-label={t.gallery}
          >
            {gallery.mediaIds.map((id, i) => (
              <button
                key={id}
                type="button"
                className="nara-thumbnail"
                aria-label={`${t.gallery} ${i + 1}`}
                aria-current={id === activeId ? "true" : undefined}
                onClick={() => onSelect(id)}
              >
                <img
                  src={gallery.mediaById[id].thumbnail}
                  alt={gallery.mediaById[id].alt}
                  width={100}
                  height={75}
                  loading="lazy"
                />
              </button>
            ))}
          </Carousel>
        </>
      )}
      {opened && (
        <Suspense fallback={open ? <p role="status">{t.updating}</p> : null}>
          <Lightbox
            className="nara-lightbox"
            isOpen={open}
            onOpenChange={changeOpen}
            media={gallery.mediaIds.map((id) => ({
              src: gallery.mediaById[id].zoom,
              alt: gallery.mediaById[id].alt,
            }))}
            index={index}
            onIndexChange={(i) => onSelect(gallery.mediaIds[i])}
            hasZoom
          />
        </Suspense>
      )}
    </div>
  );
}
