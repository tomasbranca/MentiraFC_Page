import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../../../components/Button/Button";
import ProgressiveMedia from "../../../../components/ProgressiveMedia/ProgressiveMedia";
import { getImageSrcSet, getImageUrl } from "../../../../../data/imageService";
import "./Carousel.css";
import {
  getHomeCarouselImageHeight,
  HOME_CAROUSEL_IMAGE_FIT,
  HOME_CAROUSEL_IMAGE_QUALITY,
  HOME_CAROUSEL_IMAGE_SIZES,
  HOME_CAROUSEL_IMAGE_WIDTHS,
} from "./carouselImages";

import { useCarousel } from "../../../../hooks/useCarrousel";
import { useAutoplay } from "./hooks/useAutoPlay";
import { getNewsLink } from "../../../../utils/navigation.utils";
import type { NewsItem } from "../../../../../types/models";

type CarouselProps = {
  items: NewsItem[];
};

const INACTIVE_CAROUSEL_IMAGE_DELAY_MS = 4500;

const Carousel = ({ items }: CarouselProps) => {
  const { activeIndex, next, prev } = useCarousel(items?.length || 0);
  const { autoplay, manual } = useAutoplay();
  const [shouldLoadInactiveImages, setShouldLoadInactiveImages] =
    useState(false);
  const itemsKey = useMemo(
    () => items.map((item) => item.id).join("|"),
    [items]
  );
  const largestImageWidth =
    HOME_CAROUSEL_IMAGE_WIDTHS[HOME_CAROUSEL_IMAGE_WIDTHS.length - 1];

  useEffect(() => {
    if (!autoplay || !items?.length) return;

    const interval = setInterval(() => {
      next();
    }, 4500);

    return () => clearInterval(interval);
  }, [autoplay, items, next]);

  useEffect(() => {
    setShouldLoadInactiveImages(false);
  }, [itemsKey]);

  useEffect(() => {
    if (shouldLoadInactiveImages || !items.length) return;

    const timeoutId = globalThis.setTimeout(
      () => setShouldLoadInactiveImages(true),
      INACTIVE_CAROUSEL_IMAGE_DELAY_MS
    );
    return () => globalThis.clearTimeout(timeoutId);
  }, [items.length, itemsKey, shouldLoadInactiveImages]);

  if (!items || items.length === 0) return null;

  return (
    <section className="carousel-wrapper relative w-full overflow-hidden">
      {items.map((item, index) => {
        const isActive = index === activeIndex;
        const shouldLoadImage = isActive || shouldLoadInactiveImages;
        const imageSource = shouldLoadImage ? item.imageUrl : null;

        return (
          <div
            key={item.id}
            className={`carousel-slide ${isActive ? "active" : ""}`}
          >
          <ProgressiveMedia
            src={
              shouldLoadImage
                ? getImageUrl(imageSource, {
                    width: largestImageWidth,
                    height: getHomeCarouselImageHeight(largestImageWidth),
                    fit: HOME_CAROUSEL_IMAGE_FIT,
                    quality: HOME_CAROUSEL_IMAGE_QUALITY,
                    autoFormat: true,
                  })
                : undefined
            }
            srcSet={
              shouldLoadImage
                ? getImageSrcSet(imageSource, [...HOME_CAROUSEL_IMAGE_WIDTHS], {
                    height: getHomeCarouselImageHeight,
                    fit: HOME_CAROUSEL_IMAGE_FIT,
                    quality: HOME_CAROUSEL_IMAGE_QUALITY,
                    autoFormat: true,
                  })
                : undefined
            }
            sizes={HOME_CAROUSEL_IMAGE_SIZES}
            alt={item.imageAlt || item.title}
            wrapperClassName="absolute inset-0"
            className="w-full h-full object-cover"
            {...(Object.prototype.hasOwnProperty.call(
              HTMLImageElement.prototype,
              "fetchPriority"
            )
              ? { fetchPriority: isActive ? "high" : "auto" }
              : {})}
            loading={isActive ? "eager" : "lazy"}
            decoding="async"
            width={largestImageWidth}
            height={getHomeCarouselImageHeight(largestImageWidth)}
            skeletonClassName="bg-violet-950"
          />

          <div className="absolute inset-0 flex items-end bg-linear-to-t from-violet-900 via-black/40 to-transparent">
            <div className="w-full overflow-hidden px-4 pb-4 sm:px-6 sm:pb-5 lg:px-10 lg:pb-10">
              <div className="max-w-3xl">
                <h2 className="font-black uppercase text-white wrap-break-word">
                  {item.title}
                </h2>

                <p className="mt-2 text-white/90 leading-snug line-clamp-2 sm:line-clamp-3 lg:mt-3 lg:line-clamp-none max-w-2xl">
                  {item.description}
                </p>

                <Link
                  to={getNewsLink(item)}
                  aria-label={`Leer mas sobre ${item.title}`}
                >
                  <Button
                    variant="primary"
                    className="
                      group
                      mt-2
                      px-3 py-2
                      rounded-md
                      sm:mt-3 sm:px-4 sm:py-2.5
                      md:px-5 md:py-3 md:rounded-lg
                    "
                    showArrow
                  >
                    Leer más
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          </div>
        );
      })}

      {manual && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 p-2 text-white"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 p-2 text-white"
          >
            ›
          </button>
        </>
      )}
    </section>
  );
};

export default Carousel;
