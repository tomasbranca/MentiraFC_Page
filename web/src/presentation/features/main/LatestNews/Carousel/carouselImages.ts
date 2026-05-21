export const HOME_CAROUSEL_IMAGE_WIDTHS = [480, 640, 768, 960, 1120, 1280] as const;

export const HOME_CAROUSEL_IMAGE_SIZES = "100vw";
export const HOME_CAROUSEL_IMAGE_QUALITY = 70;
export const HOME_CAROUSEL_IMAGE_FIT = "crop";

export const getHomeCarouselImageHeight = (width: number): number =>
  Math.round(width * 0.75);
