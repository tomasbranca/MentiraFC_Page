import type { Game, MatchEvent } from "../../../../types/models";

type Scorer = {
  player: NonNullable<MatchEvent["player"]>;
  goals: number;
};

export const isGameInProgress = (game: Game | null): boolean => {
  if (!game) return false;

  const now = new Date();
  const gameDate = new Date(game.date);

  return game.state === "por_jugar" && gameDate <= now;
};

export const getScorers = (events: MatchEvent[] = []): Scorer[] => {
  return Object.values(
    events.reduce<Record<string, Scorer>>((acc, event) => {
      const player = event.player;

      if (!player) return acc;

      const key = `${player.name}-${player.lastName}`;

      if (!acc[key]) {
        acc[key] = {
          player,
          goals: 0,
        };
      }

      acc[key].goals += 1;

      return acc;
    }, {})
  );
};

export const getShortName = (
  name?: string,
  lastName?: string
): string => {
  if (!name || !lastName) return "";
  return `${name[0].toUpperCase()}. ${lastName}`;
};
