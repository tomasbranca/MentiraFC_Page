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
      "imageUrl": image.asset->url
    }
  `);
}

export async function getGame() {
  const data = await client.fetch(`
  {
    "live": *[_type == "games" && state == "en_curso"][0]{
      date,
      state,
      result,
      location,
      competition,
      rival->{
        name,
        "logoUrl": logo.asset->url
      }
    },
    "next": *[_type == "games" && state == "por_jugar" && date > now()]
      | order(date asc)[0]{
        date,
        state,
        location,
        competition,
        rival->{
          name,
          "logoUrl": logo.asset->url
        }
      },
    "last": *[_type == "games" && state == "finalizado"]
      | order(date desc)[0]{
        date,
        state,
        result,
        location,
        competition,
        rival->{
          name,
          "logoUrl": logo.asset->url
        }
      }
  }
  `);

  return data.live ?? data.next ?? data.last ?? null;
}

export async function getNewsBySlug(slug) {
  const data = await client.fetch(
    `
    *[_type == "news" && slug.current == $slug][0] {
      _id,
      title,
      description,
      content,
      date,
      slug,
      "imageUrl": image.asset->url
    }
  `,
    { slug }
  );

  return data;
}

export async function getPlayers() {
  return client.fetch(`
    *[_type == "players"] | order(number asc) {
      _id,
      name,
      lastName,
      number,
      position,
      birthDate,
      goals,
      slug,
      "imageUrl": photo.asset->url
    }
  `);
}

export async function getPlayerBySlug(slug) {
  const data = await client.fetch(
    `
    *[_type == "players" && slug.current == $slug][0] {
      _id,
      name,
      lastName,
      number,
      position,
      birthDate,
      goals,
      slug,
      "imageUrl": photo.asset->url
    }
  `,
    { slug }
  );

  return data;
}