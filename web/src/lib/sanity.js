import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";

export const client = createClient({
  projectId: "jwpxrdo2",
  dataset: "production",
  apiVersion: "2023-01-01",
  useCdn: true,
});

const builder = createImageUrlBuilder(client);

export function urlFor(source) {
  return builder.image(source);
}

export async function getNews() {
  return client.fetch(`
    *[_type == "news"] | order(date desc) {
      _id,
      title,
      description,
      content,
      date,
      slug,
      "imageUrl": imageUrl.asset->url
    }
  `);
}

