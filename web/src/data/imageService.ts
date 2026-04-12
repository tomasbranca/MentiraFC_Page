import { urlFor } from "./sanity/sanity.image";

type ImageOptions = {
  width?: number;
  height?: number;
  fit?: "crop" | "clip" | "fill" | "fillmax" | "max" | "scale" | "min";
};

export const getImageUrl = (image: unknown, options: ImageOptions = {}): string => {
  let builder = urlFor(image);

  if (options.width) builder = builder.width(options.width);
  if (options.height) builder = builder.height(options.height);
  if (options.fit) builder = builder.fit(options.fit);

  return builder.url();
};
