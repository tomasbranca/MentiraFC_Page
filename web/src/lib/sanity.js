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
  return client.fetch(`
    *[_type == "games"] | order(date desc)[0] {
      date,
      state,
      location,
      competition,
      rival->{
        name,
        "logoUrl": logo.asset->url
      },
      result{
        goalsFor,
        goalsAgainst,
        scorers[]{
          goals,
          player->{
            name,
            lastName
          }
        }
      }
    }
  `);
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

export async function getTable() {
  const data = await client.fetch(`
    *[_type == "table" && active == true][0]{
      title,
      logo,
      primaryColor,
      standings[]{
        position,
        played,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        points,
        team->{
          _id,
          name,
          logo,
          isMain
        }
      },
      _updatedAt
    }
  `);
  return data;
}

export async function getFinishedGames() {
  return client.fetch(`
    *[_type == "games" && state == "finalizado"] | order(date desc) {
      _id,
      date,
      state,
      location,
      competition,

      result{
        goalsFor,
        goalsAgainst,
        scorers[]{
          goals,
          player->{
            name,
            lastName
          }
        }
      },
      rival->{
        name,
        "logoUrl": logo.asset->url
      }
    }
  `);
}

export const getSuggestedNews = async (currentSlug) => {
  const now = new Date();

  const buildDate = (monthsBack) => {
    const d = new Date();
    d.setMonth(now.getMonth() - monthsBack);
    return d.toISOString();
  };

  const query = `
    *[_type == "news" && slug.current != $slug && date >= $date]
    | order(date desc)[0...10] {
      _id,
      title,
      description,
      "slug": slug,
      date,
      "imageUrl": image.asset->url
    }
  `;

  // 1️⃣ intentar 2 meses
  let result = await client.fetch(query, {
    slug: currentSlug,
    date: buildDate(2),
  });

  // 2️⃣ fallback 4 meses
  if (result.length < 3) {
    result = await client.fetch(query, {
      slug: currentSlug,
      date: buildDate(4),
    });
  }

  // 3️⃣ fallback sin filtro de fecha
  if (result.length < 3) {
    result = await client.fetch(
      `*[_type == "news" && slug.current != $slug]
        | order(date desc)[0...10] {
        _id,
        title,
        description,
        "slug": slug,
        date,
        "imageUrl": image.asset->url
      }`,
      { slug: currentSlug }
    );
  }

  return result;
};
