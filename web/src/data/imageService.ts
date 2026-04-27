import { urlFor } from "./sanity/sanity.image";

type ImageOptions = {
  width?: number;
  height?: number;
  fit?: "crop" | "clip" | "fill" | "fillmax" | "max" | "scale" | "min";
  quality?: number;
  format?: "webp" | "jpg" | "png";
  autoFormat?: boolean;
};

const isSanityImageUrl = (value: string): boolean =>
  value.includes("cdn.sanity.io/images/");

const buildSanityImageUrlFromString = (
  imageUrl: string,
  options: ImageOptions
): string => {
  try {
    const url = new URL(imageUrl);

    if (options.width) url.searchParams.set("w", String(options.width));
    if (options.height) url.searchParams.set("h", String(options.height));
    if (options.fit) url.searchParams.set("fit", options.fit);
    if (options.quality) url.searchParams.set("q", String(options.quality));
    if (options.autoFormat) url.searchParams.set("auto", "format");
    if (options.format) url.searchParams.set("fm", options.format);

    return url.toString();
  } catch {
    return imageUrl;
  }
};

export const getImageUrl = (
  image: unknown,
  options: ImageOptions = {}
): string => {
  if (!image) {
    return "";
  }

  if (typeof image === "string") {
    if (!isSanityImageUrl(image)) {
      return image;
    }

    return buildSanityImageUrlFromString(image, options);
  }

  let builder = urlFor(image);

  if (options.width) builder = builder.width(options.width);
  if (options.height) builder = builder.height(options.height);
  if (options.fit) builder = builder.fit(options.fit);
  if (options.quality) builder = builder.quality(options.quality);
  if (options.autoFormat) builder = builder.auto("format");
  if (options.format) builder = builder.format(options.format);

  return builder.url();
};

export const getImageSrcSet = (
  image: unknown,
  widths: number[],
  options: Omit<ImageOptions, "width"> = {}
): string =>
  widths
    .map((width) => `${getImageUrl(image, { ...options, width })} ${width}w`)
    .join(", ");
