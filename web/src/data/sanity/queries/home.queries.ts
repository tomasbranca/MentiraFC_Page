export const HOME_CRITICAL_QUERY = `
  {
    "news": *[_type == "news"] | order(date desc)[0...6] {
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
      "imageUrl": image.asset->url
    },
    "latestGame": *[_type == "games" && defined(date)] | order(date desc)[0] {
      _id,
      date,
      state,
      location,
      competition,
      tournament->{
        _id,
        name,
        organization->{
          name
        }
      },
      rival->{
        _id,
        name,
        "logoUrl": logo.asset->url
      },
      result{
        goalsFor,
        goalsAgainst
      },
      "events": *[
        _type == "events" &&
        game._ref == ^._id &&
        type == "goal"
      ]{
        _id,
        type,
        order,
        player->{
          _id,
          name,
          lastName,
          slug
        }
      }
    }
  }
`;
