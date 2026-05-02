type ImageOptions = {
  width?: number;
  height?: number;
  fit?: "crop" | "clip" | "fill" | "fillmax" | "max" | "scale" | "min";
  quality?: number;
  format?: "webp" | "jpg" | "png";
  autoFormat?: boolean;
};

const DEFAULT_SANITY_IMAGE_QUALITY = 75;

type SanityImageAssetRef = {
  assetId: string;
  width: string;
  height: string;
  format: string;
};

const isSanityImageUrl = (value: string): boolean =>
  value.includes("cdn.sanity.io/images/");

const withDefaultSanityTransforms = (options: ImageOptions): ImageOptions => ({
  ...options,
  quality: options.quality ?? DEFAULT_SANITY_IMAGE_QUALITY,
  autoFormat: options.autoFormat ?? true,
});

const parseSanityImageAssetRef = (
  value: string
): SanityImageAssetRef | null => {
  // Sanity asset refs encode the original dimensions and format:
  // image-<assetId>-<width>x<height>-<format>.
  const match = value.match(
    /^image-([a-zA-Z0-9]+)-(\d+)x(\d+)-([a-z0-9]+)$/
  );

  if (!match) {
    return null;
  }

  const [, assetId, width, height, format] = match;

  if (!assetId || !width || !height || !format) {
    return null;
  }

  return { assetId, width, height, format };
};

const getSanityImageAssetRef = (image: unknown): string | null => {
  if (typeof image === "string") {
    return image;
  }

  if (!image || typeof image !== "object") {
    return null;
  }

  const asset = (image as { asset?: unknown }).asset;

  if (!asset || typeof asset !== "object") {
    return null;
  }

  const ref = (asset as { _ref?: unknown })._ref;

  return typeof ref === "string" ? ref : null;
};

const buildSanityImageUrlFromString = (
  imageUrl: string,
  options: ImageOptions
): string => {
  try {
    const url = new URL(imageUrl);

    if (options.width) url.searchParams.set("w", String(options.width));
    if (options.height) url.searchParams.set("h", String(options.height));
    if (options.fit) url.searchParams.set("fit", options.fit);
    if (options.quality !== undefined) {
      url.searchParams.set("q", String(options.quality));
    }
    if (options.autoFormat) url.searchParams.set("auto", "format");
    if (options.format) url.searchParams.set("fm", options.format);

    return url.toString();
  } catch {
    return imageUrl;
  }
};

const buildSanityImageUrlFromAssetRef = (
  image: unknown,
  options: ImageOptions
): string => {
  const ref = getSanityImageAssetRef(image)?.trim();
  const asset = ref ? parseSanityImageAssetRef(ref) : null;
  const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
  const dataset = import.meta.env.VITE_SANITY_DATASET;

  if (!asset || !projectId || !dataset) {
    return "";
  }

  // Some queries return raw asset refs instead of resolved URLs; rebuilding the
  // CDN URL here keeps components independent from the exact GROQ projection.
  const url = `https://cdn.sanity.io/images/${projectId}/${dataset}/${asset.assetId}-${asset.width}x${asset.height}.${asset.format}`;

  return buildSanityImageUrlFromString(url, options);
};

export const getImageUrl = (
  image: unknown,
  options: ImageOptions = {}
): string => {
  if (!image) {
    return "";
  }

  if (typeof image === "string") {
    const normalizedImage = image.trim();

    if (!normalizedImage) {
      return "";
    }

    if (isSanityImageUrl(normalizedImage)) {
      // Resolved Sanity URLs still receive app defaults for quality/format.
      return buildSanityImageUrlFromString(
        normalizedImage,
        withDefaultSanityTransforms(options)
      );
    }

    if (parseSanityImageAssetRef(normalizedImage)) {
      return buildSanityImageUrlFromAssetRef(
        normalizedImage,
        withDefaultSanityTransforms(options)
      );
    }

    return normalizedImage;
  }

  return buildSanityImageUrlFromAssetRef(
    image,
    withDefaultSanityTransforms(options)
  );
};

export const getImageSrcSet = (
  image: unknown,
  widths: number[],
  options: Omit<ImageOptions, "width"> = {}
): string =>
  widths
    .map((width) => {
      const url = getImageUrl(image, { ...options, width });

      return url ? `${url} ${width}w` : "";
    })
    .filter(Boolean)
    .join(", ");
