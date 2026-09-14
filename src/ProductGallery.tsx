import {
  Component,
  type ReactNode,
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { prepareGalleryImage } from "./gallery-images";
import { Carousel, type CarouselHandle } from "@astryxdesign/core/Carousel";
import type { Gallery, Media } from "./shopify-product-adapter";
const Lightbox = lazy(() =>
  import("@astryxdesign/core/Lightbox").then((module) => ({
    default: module.Lightbox,
  })),
);
// An optional viewer must never tear down the product's purchase state.
class LightboxBoundary extends Component<
  {
    children: ReactNode;
    fallback: ReactNode;
  },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
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
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null);
  const revision = useRef(0);
  const galleryKey = JSON.stringify(
    gallery.mediaIds.map((id) => gallery.mediaById[id]),
  );
  useLayoutEffect(() => {
    revision.current++;
    setLoading(false);
    setLoadError(false);
    return () => {
      revision.current++;
    };
  }, [galleryKey, activeId]);
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
  useEffect(() => {
    if (!open) return;
    // Only the current image and immediate neighbours, not the whole gallery.
    for (const i of [index - 1, index, index + 1]) {
      const next = gallery.mediaById[gallery.mediaIds[i]];
      if (next) void prepareGalleryImage(next).catch(() => {});
    }
  }, [open, index, galleryKey]);
  async function selectLightbox(i: number) {
    const next = gallery.mediaById[gallery.mediaIds[i]];
    if (!next) return;
    const request = ++revision.current;
    setLoading(true);
    setLoadError(false);
    try {
      await prepareGalleryImage(next);
      if (request !== revision.current) return;
      setLoading(false);
      onSelect(next.id);
    } catch {
      if (request !== revision.current) return;
      setLoading(false);
      setLoadError(true);
    }
  }
  function changeOpen(value: boolean) {
    revision.current++;
    setLoading(false);
    setLoadError(false);
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
      {open &&
        dialog &&
        (loading || loadError) &&
        createPortal(
          <p className="lightbox-load-status" role="status">
            {loadError ? t.image_error : t.updating}
          </p>,
          dialog,
        )}
      {opened && (
        <LightboxBoundary
          fallback={
            open ? (
              <div role="status">
                <p>{t.image_error}</p>
                <a href={media.zoom} target="_blank" rel="noopener noreferrer">
                  {t.zoom}
                </a>{" "}
                <button type="button" onClick={() => changeOpen(false)}>
                  {t.close}
                </button>
              </div>
            ) : null
          }
        >
          <Suspense fallback={open ? <p role="status">{t.updating}</p> : null}>
            <Lightbox
              ref={setDialog}
              aria-busy={loading}
              className="nara-lightbox"
              isOpen={open}
              onOpenChange={changeOpen}
              media={gallery.mediaIds.map((id) => ({
                src: gallery.mediaById[id].zoom,
                alt: gallery.mediaById[id].alt,
              }))}
              index={index}
              onIndexChange={(i) => void selectLightbox(i)}
              hasZoom
            />
          </Suspense>
        </LightboxBoundary>
      )}
    </div>
  );
}
