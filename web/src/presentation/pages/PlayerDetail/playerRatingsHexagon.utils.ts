import type { FieldPlayerRatings, GoalkeeperRatings, Player } from "../../../types/models";

export interface PlayerRatingHexagonPoint {
  label: string;
  value: number;
}

const FIELD_PLAYER_RATING_DEFINITIONS: {
  key: keyof FieldPlayerRatings;
  label: string;
}[] = [
  { key: "speed", label: "VEL" },
  { key: "shooting", label: "TIR" },
  { key: "passing", label: "PAS" },
  { key: "dribbling", label: "REG" },
  { key: "defense", label: "DEF" },
  { key: "physical", label: "FIS" },
];

const GOALKEEPER_RATING_DEFINITIONS: {
  key: keyof GoalkeeperRatings;
  label: string;
}[] = [
  { key: "jumping", label: "SAL" },
  { key: "saving", label: "PAR" },
  { key: "kicking", label: "SAQ" },
  { key: "reflexes", label: "REF" },
  { key: "speed", label: "VEL" },
  { key: "positioning", label: "POS" },
];

const isCompleteRatingValue = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 10;

export const getPlayerRatingHexagonPoints = (
  player: Player
): PlayerRatingHexagonPoint[] | null => {
  if (player.position === "arq") {
    const ratings = player.goalkeeperRatings;
    if (!ratings) return null;

    const points = GOALKEEPER_RATING_DEFINITIONS.map(({ key, label }) => ({
      label,
      value: ratings[key],
    }));

    return points.every((point) => isCompleteRatingValue(point.value))
      ? (points as PlayerRatingHexagonPoint[])
      : null;
  }

  const ratings = player.fieldRatings;
  if (!ratings) return null;

  const points = FIELD_PLAYER_RATING_DEFINITIONS.map(({ key, label }) => ({
    label,
    value: ratings[key],
  }));

  return points.every((point) => isCompleteRatingValue(point.value))
    ? (points as PlayerRatingHexagonPoint[])
    : null;
};
