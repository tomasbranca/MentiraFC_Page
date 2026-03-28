import { urlFor } from "../lib/sanity";

export const getImageUrl = (image, options = {}) => {
  let builder = urlFor(image);

  if (options.width) builder = builder.width(options.width);
  if (options.height) builder = builder.height(options.height);
  if (options.fit) builder = builder.fit(options.fit);

  return builder.url();
};