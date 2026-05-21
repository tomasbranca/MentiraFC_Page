import { GAME_PROJECTION } from "./games.queries";

export const HOME_CRITICAL_QUERY = `
  {
    "news": *[_type == "news" && !(_id in path("drafts.**"))] | order(date desc)[0...6] {
      _id,
      title,
      description,
      content[]{
        ...,
        "imageUrl": asset->url,
        "fileUrl": file.asset->url,
        "mimeType": file.asset->mimeType,
        "originalFilename": file.asset->originalFilename
      },
      date,
      slug,
      "imageAlt": image.alt,
      "imageUrl": image.asset->url
    },
    "latestGame": coalesce(
      *[
        _type == "games" &&
        state == "por_jugar" &&
        defined(date) &&
        dateTime(date) <= dateTime(now())
      ] | order(date desc)[0] ${GAME_PROJECTION},
      *[
        _type == "games" &&
        state == "por_jugar" &&
        defined(date) &&
        dateTime(date) > dateTime(now())
      ] | order(date asc)[0] ${GAME_PROJECTION},
      *[
        _type == "games" &&
        state == "finalizado" &&
        defined(date)
      ] | order(date desc)[0] ${GAME_PROJECTION}
    )
  }
`;
